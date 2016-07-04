(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++)
      target[i + target_start] = this[i + start]
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/index.js","/../../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer")
},{"+7ZJp0":4,"base64-js":2,"buffer":1,"ieee754":3}],2:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js","/../../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib")
},{"+7ZJp0":4,"buffer":1}],3:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js","/../../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754")
},{"+7ZJp0":4,"buffer":1}],4:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/gulp-browserify/node_modules/browserify/node_modules/process/browser.js","/../../../node_modules/gulp-browserify/node_modules/browserify/node_modules/process")
},{"+7ZJp0":4,"buffer":1}],5:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var isarray = require('isarray')

/**
 * Expose `pathToRegexp`.
 */
module.exports = pathToRegexp
module.exports.parse = parse
module.exports.compile = compile
module.exports.tokensToFunction = tokensToFunction
module.exports.tokensToRegExp = tokensToRegExp

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g')

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string} str
 * @return {!Array}
 */
function parse (str) {
  var tokens = []
  var key = 0
  var index = 0
  var path = ''
  var res

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0]
    var escaped = res[1]
    var offset = res.index
    path += str.slice(index, offset)
    index = offset + m.length

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1]
      continue
    }

    var next = str[index]
    var prefix = res[2]
    var name = res[3]
    var capture = res[4]
    var group = res[5]
    var modifier = res[6]
    var asterisk = res[7]

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path)
      path = ''
    }

    var partial = prefix != null && next != null && next !== prefix
    var repeat = modifier === '+' || modifier === '*'
    var optional = modifier === '?' || modifier === '*'
    var delimiter = res[2] || '/'
    var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?')

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      partial: partial,
      asterisk: !!asterisk,
      pattern: escapeGroup(pattern)
    })
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index)
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path)
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @return {!function(Object=, Object=)}
 */
function compile (str) {
  return tokensToFunction(parse(str))
}

/**
 * Prettier encoding of URI path segments.
 *
 * @param  {string}
 * @return {string}
 */
function encodeURIComponentPretty (str) {
  return encodeURI(str).replace(/[\/?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Encode the asterisk parameter. Similar to `pretty`, but allows slashes.
 *
 * @param  {string}
 * @return {string}
 */
function encodeAsterisk (str) {
  return encodeURI(str).replace(/[?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length)

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$')
    }
  }

  return function (obj, opts) {
    var path = ''
    var data = obj || {}
    var options = opts || {}
    var encode = options.pretty ? encodeURIComponentPretty : encodeURIComponent

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i]

      if (typeof token === 'string') {
        path += token

        continue
      }

      var value = data[token.name]
      var segment

      if (value == null) {
        if (token.optional) {
          // Prepend partial segment prefixes.
          if (token.partial) {
            path += token.prefix
          }

          continue
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined')
        }
      }

      if (isarray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received `' + JSON.stringify(value) + '`')
        }

        if (value.length === 0) {
          if (token.optional) {
            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encode(value[j])

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received `' + JSON.stringify(segment) + '`')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment
        }

        continue
      }

      segment = token.asterisk ? encodeAsterisk(value) : encode(value)

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
      }

      path += token.prefix + segment
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1')
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {!RegExp} re
 * @param  {Array}   keys
 * @return {!RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys
  return re
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags (options) {
  return options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {!Array}  keys
 * @return {!RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g)

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        partial: false,
        asterisk: false,
        pattern: null
      })
    }
  }

  return attachKeys(path, keys)
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array}   keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = []

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source)
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options))

  return attachKeys(regexp, keys)
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {!Array}  keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function stringToRegexp (path, keys, options) {
  var tokens = parse(path)
  var re = tokensToRegExp(tokens, options)

  // Attach keys back to the regexp.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] !== 'string') {
      keys.push(tokens[i])
    }
  }

  return attachKeys(re, keys)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}  tokens
 * @param  {Object=} options
 * @return {!RegExp}
 */
function tokensToRegExp (tokens, options) {
  options = options || {}

  var strict = options.strict
  var end = options.end !== false
  var route = ''
  var lastToken = tokens[tokens.length - 1]
  var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken)

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]

    if (typeof token === 'string') {
      route += escapeString(token)
    } else {
      var prefix = escapeString(token.prefix)
      var capture = '(?:' + token.pattern + ')'

      if (token.repeat) {
        capture += '(?:' + prefix + capture + ')*'
      }

      if (token.optional) {
        if (!token.partial) {
          capture = '(?:' + prefix + '(' + capture + '))?'
        } else {
          capture = prefix + '(' + capture + ')?'
        }
      } else {
        capture = prefix + '(' + capture + ')'
      }

      route += capture
    }
  }

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?'
  }

  if (end) {
    route += '$'
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithSlash ? '' : '(?=\\/|$)'
  }

  return new RegExp('^' + route, flags(options))
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {(Array|Object)=}       keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
function pathToRegexp (path, keys, options) {
  keys = keys || []

  if (!isarray(keys)) {
    options = /** @type {!Object} */ (keys)
    keys = []
  } else if (!options) {
    options = {}
  }

  if (path instanceof RegExp) {
    return regexpToRegexp(path, /** @type {!Array} */ (keys))
  }

  if (isarray(path)) {
    return arrayToRegexp(/** @type {!Array} */ (path), /** @type {!Array} */ (keys), options)
  }

  return stringToRegexp(/** @type {string} */ (path), /** @type {!Array} */ (keys), options)
}

}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/path-to-regexp/index.js","/../../../node_modules/path-to-regexp")
},{"+7ZJp0":4,"buffer":1,"isarray":6}],6:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/path-to-regexp/node_modules/isarray/index.js","/../../../node_modules/path-to-regexp/node_modules/isarray")
},{"+7ZJp0":4,"buffer":1}],7:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
// @version 0.7.22
(function() {
  window.WebComponents = window.WebComponents || {
    flags: {}
  };
  var file = "webcomponents.js";
  var script = document.querySelector('script[src*="' + file + '"]');
  var flags = {};
  if (!flags.noOpts) {
    location.search.slice(1).split("&").forEach(function(option) {
      var parts = option.split("=");
      var match;
      if (parts[0] && (match = parts[0].match(/wc-(.+)/))) {
        flags[match[1]] = parts[1] || true;
      }
    });
    if (script) {
      for (var i = 0, a; a = script.attributes[i]; i++) {
        if (a.name !== "src") {
          flags[a.name] = a.value || true;
        }
      }
    }
    if (flags.log && flags.log.split) {
      var parts = flags.log.split(",");
      flags.log = {};
      parts.forEach(function(f) {
        flags.log[f] = true;
      });
    } else {
      flags.log = {};
    }
  }
  flags.shadow = flags.shadow || flags.shadowdom || flags.polyfill;
  if (flags.shadow === "native") {
    flags.shadow = false;
  } else {
    flags.shadow = flags.shadow || !HTMLElement.prototype.createShadowRoot;
  }
  if (flags.register) {
    window.CustomElements = window.CustomElements || {
      flags: {}
    };
    window.CustomElements.flags.register = flags.register;
  }
  WebComponents.flags = flags;
})();

if (WebComponents.flags.shadow) {
  if (typeof WeakMap === "undefined") {
    (function() {
      var defineProperty = Object.defineProperty;
      var counter = Date.now() % 1e9;
      var WeakMap = function() {
        this.name = "__st" + (Math.random() * 1e9 >>> 0) + (counter++ + "__");
      };
      WeakMap.prototype = {
        set: function(key, value) {
          var entry = key[this.name];
          if (entry && entry[0] === key) entry[1] = value; else defineProperty(key, this.name, {
            value: [ key, value ],
            writable: true
          });
          return this;
        },
        get: function(key) {
          var entry;
          return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
        },
        "delete": function(key) {
          var entry = key[this.name];
          if (!entry || entry[0] !== key) return false;
          entry[0] = entry[1] = undefined;
          return true;
        },
        has: function(key) {
          var entry = key[this.name];
          if (!entry) return false;
          return entry[0] === key;
        }
      };
      window.WeakMap = WeakMap;
    })();
  }
  window.ShadowDOMPolyfill = {};
  (function(scope) {
    "use strict";
    var constructorTable = new WeakMap();
    var nativePrototypeTable = new WeakMap();
    var wrappers = Object.create(null);
    function detectEval() {
      if (typeof chrome !== "undefined" && chrome.app && chrome.app.runtime) {
        return false;
      }
      if (navigator.getDeviceStorage) {
        return false;
      }
      try {
        var f = new Function("return true;");
        return f();
      } catch (ex) {
        return false;
      }
    }
    var hasEval = detectEval();
    function assert(b) {
      if (!b) throw new Error("Assertion failed");
    }
    var defineProperty = Object.defineProperty;
    var getOwnPropertyNames = Object.getOwnPropertyNames;
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    function mixin(to, from) {
      var names = getOwnPropertyNames(from);
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        defineProperty(to, name, getOwnPropertyDescriptor(from, name));
      }
      return to;
    }
    function mixinStatics(to, from) {
      var names = getOwnPropertyNames(from);
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        switch (name) {
         case "arguments":
         case "caller":
         case "length":
         case "name":
         case "prototype":
         case "toString":
          continue;
        }
        defineProperty(to, name, getOwnPropertyDescriptor(from, name));
      }
      return to;
    }
    function oneOf(object, propertyNames) {
      for (var i = 0; i < propertyNames.length; i++) {
        if (propertyNames[i] in object) return propertyNames[i];
      }
    }
    var nonEnumerableDataDescriptor = {
      value: undefined,
      configurable: true,
      enumerable: false,
      writable: true
    };
    function defineNonEnumerableDataProperty(object, name, value) {
      nonEnumerableDataDescriptor.value = value;
      defineProperty(object, name, nonEnumerableDataDescriptor);
    }
    getOwnPropertyNames(window);
    function getWrapperConstructor(node, opt_instance) {
      var nativePrototype = node.__proto__ || Object.getPrototypeOf(node);
      if (isFirefox) {
        try {
          getOwnPropertyNames(nativePrototype);
        } catch (error) {
          nativePrototype = nativePrototype.__proto__;
        }
      }
      var wrapperConstructor = constructorTable.get(nativePrototype);
      if (wrapperConstructor) return wrapperConstructor;
      var parentWrapperConstructor = getWrapperConstructor(nativePrototype);
      var GeneratedWrapper = createWrapperConstructor(parentWrapperConstructor);
      registerInternal(nativePrototype, GeneratedWrapper, opt_instance);
      return GeneratedWrapper;
    }
    function addForwardingProperties(nativePrototype, wrapperPrototype) {
      installProperty(nativePrototype, wrapperPrototype, true);
    }
    function registerInstanceProperties(wrapperPrototype, instanceObject) {
      installProperty(instanceObject, wrapperPrototype, false);
    }
    var isFirefox = /Firefox/.test(navigator.userAgent);
    var dummyDescriptor = {
      get: function() {},
      set: function(v) {},
      configurable: true,
      enumerable: true
    };
    function isEventHandlerName(name) {
      return /^on[a-z]+$/.test(name);
    }
    function isIdentifierName(name) {
      return /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(name);
    }
    function getGetter(name) {
      return hasEval && isIdentifierName(name) ? new Function("return this.__impl4cf1e782hg__." + name) : function() {
        return this.__impl4cf1e782hg__[name];
      };
    }
    function getSetter(name) {
      return hasEval && isIdentifierName(name) ? new Function("v", "this.__impl4cf1e782hg__." + name + " = v") : function(v) {
        this.__impl4cf1e782hg__[name] = v;
      };
    }
    function getMethod(name) {
      return hasEval && isIdentifierName(name) ? new Function("return this.__impl4cf1e782hg__." + name + ".apply(this.__impl4cf1e782hg__, arguments)") : function() {
        return this.__impl4cf1e782hg__[name].apply(this.__impl4cf1e782hg__, arguments);
      };
    }
    function getDescriptor(source, name) {
      try {
        return Object.getOwnPropertyDescriptor(source, name);
      } catch (ex) {
        return dummyDescriptor;
      }
    }
    var isBrokenSafari = function() {
      var descr = Object.getOwnPropertyDescriptor(Node.prototype, "nodeType");
      return descr && !descr.get && !descr.set;
    }();
    function installProperty(source, target, allowMethod, opt_blacklist) {
      var names = getOwnPropertyNames(source);
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (name === "polymerBlackList_") continue;
        if (name in target) continue;
        if (source.polymerBlackList_ && source.polymerBlackList_[name]) continue;
        if (isFirefox) {
          source.__lookupGetter__(name);
        }
        var descriptor = getDescriptor(source, name);
        var getter, setter;
        if (typeof descriptor.value === "function") {
          if (allowMethod) {
            target[name] = getMethod(name);
          }
          continue;
        }
        var isEvent = isEventHandlerName(name);
        if (isEvent) getter = scope.getEventHandlerGetter(name); else getter = getGetter(name);
        if (descriptor.writable || descriptor.set || isBrokenSafari) {
          if (isEvent) setter = scope.getEventHandlerSetter(name); else setter = getSetter(name);
        }
        var configurable = isBrokenSafari || descriptor.configurable;
        defineProperty(target, name, {
          get: getter,
          set: setter,
          configurable: configurable,
          enumerable: descriptor.enumerable
        });
      }
    }
    function register(nativeConstructor, wrapperConstructor, opt_instance) {
      if (nativeConstructor == null) {
        return;
      }
      var nativePrototype = nativeConstructor.prototype;
      registerInternal(nativePrototype, wrapperConstructor, opt_instance);
      mixinStatics(wrapperConstructor, nativeConstructor);
    }
    function registerInternal(nativePrototype, wrapperConstructor, opt_instance) {
      var wrapperPrototype = wrapperConstructor.prototype;
      assert(constructorTable.get(nativePrototype) === undefined);
      constructorTable.set(nativePrototype, wrapperConstructor);
      nativePrototypeTable.set(wrapperPrototype, nativePrototype);
      addForwardingProperties(nativePrototype, wrapperPrototype);
      if (opt_instance) registerInstanceProperties(wrapperPrototype, opt_instance);
      defineNonEnumerableDataProperty(wrapperPrototype, "constructor", wrapperConstructor);
      wrapperConstructor.prototype = wrapperPrototype;
    }
    function isWrapperFor(wrapperConstructor, nativeConstructor) {
      return constructorTable.get(nativeConstructor.prototype) === wrapperConstructor;
    }
    function registerObject(object) {
      var nativePrototype = Object.getPrototypeOf(object);
      var superWrapperConstructor = getWrapperConstructor(nativePrototype);
      var GeneratedWrapper = createWrapperConstructor(superWrapperConstructor);
      registerInternal(nativePrototype, GeneratedWrapper, object);
      return GeneratedWrapper;
    }
    function createWrapperConstructor(superWrapperConstructor) {
      function GeneratedWrapper(node) {
        superWrapperConstructor.call(this, node);
      }
      var p = Object.create(superWrapperConstructor.prototype);
      p.constructor = GeneratedWrapper;
      GeneratedWrapper.prototype = p;
      return GeneratedWrapper;
    }
    function isWrapper(object) {
      return object && object.__impl4cf1e782hg__;
    }
    function isNative(object) {
      return !isWrapper(object);
    }
    function wrap(impl) {
      if (impl === null) return null;
      assert(isNative(impl));
      var wrapper = impl.__wrapper8e3dd93a60__;
      if (wrapper != null) {
        return wrapper;
      }
      return impl.__wrapper8e3dd93a60__ = new (getWrapperConstructor(impl, impl))(impl);
    }
    function unwrap(wrapper) {
      if (wrapper === null) return null;
      assert(isWrapper(wrapper));
      return wrapper.__impl4cf1e782hg__;
    }
    function unsafeUnwrap(wrapper) {
      return wrapper.__impl4cf1e782hg__;
    }
    function setWrapper(impl, wrapper) {
      wrapper.__impl4cf1e782hg__ = impl;
      impl.__wrapper8e3dd93a60__ = wrapper;
    }
    function unwrapIfNeeded(object) {
      return object && isWrapper(object) ? unwrap(object) : object;
    }
    function wrapIfNeeded(object) {
      return object && !isWrapper(object) ? wrap(object) : object;
    }
    function rewrap(node, wrapper) {
      if (wrapper === null) return;
      assert(isNative(node));
      assert(wrapper === undefined || isWrapper(wrapper));
      node.__wrapper8e3dd93a60__ = wrapper;
    }
    var getterDescriptor = {
      get: undefined,
      configurable: true,
      enumerable: true
    };
    function defineGetter(constructor, name, getter) {
      getterDescriptor.get = getter;
      defineProperty(constructor.prototype, name, getterDescriptor);
    }
    function defineWrapGetter(constructor, name) {
      defineGetter(constructor, name, function() {
        return wrap(this.__impl4cf1e782hg__[name]);
      });
    }
    function forwardMethodsToWrapper(constructors, names) {
      constructors.forEach(function(constructor) {
        names.forEach(function(name) {
          constructor.prototype[name] = function() {
            var w = wrapIfNeeded(this);
            return w[name].apply(w, arguments);
          };
        });
      });
    }
    scope.addForwardingProperties = addForwardingProperties;
    scope.assert = assert;
    scope.constructorTable = constructorTable;
    scope.defineGetter = defineGetter;
    scope.defineWrapGetter = defineWrapGetter;
    scope.forwardMethodsToWrapper = forwardMethodsToWrapper;
    scope.isIdentifierName = isIdentifierName;
    scope.isWrapper = isWrapper;
    scope.isWrapperFor = isWrapperFor;
    scope.mixin = mixin;
    scope.nativePrototypeTable = nativePrototypeTable;
    scope.oneOf = oneOf;
    scope.registerObject = registerObject;
    scope.registerWrapper = register;
    scope.rewrap = rewrap;
    scope.setWrapper = setWrapper;
    scope.unsafeUnwrap = unsafeUnwrap;
    scope.unwrap = unwrap;
    scope.unwrapIfNeeded = unwrapIfNeeded;
    scope.wrap = wrap;
    scope.wrapIfNeeded = wrapIfNeeded;
    scope.wrappers = wrappers;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    function newSplice(index, removed, addedCount) {
      return {
        index: index,
        removed: removed,
        addedCount: addedCount
      };
    }
    var EDIT_LEAVE = 0;
    var EDIT_UPDATE = 1;
    var EDIT_ADD = 2;
    var EDIT_DELETE = 3;
    function ArraySplice() {}
    ArraySplice.prototype = {
      calcEditDistances: function(current, currentStart, currentEnd, old, oldStart, oldEnd) {
        var rowCount = oldEnd - oldStart + 1;
        var columnCount = currentEnd - currentStart + 1;
        var distances = new Array(rowCount);
        for (var i = 0; i < rowCount; i++) {
          distances[i] = new Array(columnCount);
          distances[i][0] = i;
        }
        for (var j = 0; j < columnCount; j++) distances[0][j] = j;
        for (var i = 1; i < rowCount; i++) {
          for (var j = 1; j < columnCount; j++) {
            if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1])) distances[i][j] = distances[i - 1][j - 1]; else {
              var north = distances[i - 1][j] + 1;
              var west = distances[i][j - 1] + 1;
              distances[i][j] = north < west ? north : west;
            }
          }
        }
        return distances;
      },
      spliceOperationsFromEditDistances: function(distances) {
        var i = distances.length - 1;
        var j = distances[0].length - 1;
        var current = distances[i][j];
        var edits = [];
        while (i > 0 || j > 0) {
          if (i == 0) {
            edits.push(EDIT_ADD);
            j--;
            continue;
          }
          if (j == 0) {
            edits.push(EDIT_DELETE);
            i--;
            continue;
          }
          var northWest = distances[i - 1][j - 1];
          var west = distances[i - 1][j];
          var north = distances[i][j - 1];
          var min;
          if (west < north) min = west < northWest ? west : northWest; else min = north < northWest ? north : northWest;
          if (min == northWest) {
            if (northWest == current) {
              edits.push(EDIT_LEAVE);
            } else {
              edits.push(EDIT_UPDATE);
              current = northWest;
            }
            i--;
            j--;
          } else if (min == west) {
            edits.push(EDIT_DELETE);
            i--;
            current = west;
          } else {
            edits.push(EDIT_ADD);
            j--;
            current = north;
          }
        }
        edits.reverse();
        return edits;
      },
      calcSplices: function(current, currentStart, currentEnd, old, oldStart, oldEnd) {
        var prefixCount = 0;
        var suffixCount = 0;
        var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
        if (currentStart == 0 && oldStart == 0) prefixCount = this.sharedPrefix(current, old, minLength);
        if (currentEnd == current.length && oldEnd == old.length) suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
        currentStart += prefixCount;
        oldStart += prefixCount;
        currentEnd -= suffixCount;
        oldEnd -= suffixCount;
        if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0) return [];
        if (currentStart == currentEnd) {
          var splice = newSplice(currentStart, [], 0);
          while (oldStart < oldEnd) splice.removed.push(old[oldStart++]);
          return [ splice ];
        } else if (oldStart == oldEnd) return [ newSplice(currentStart, [], currentEnd - currentStart) ];
        var ops = this.spliceOperationsFromEditDistances(this.calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));
        var splice = undefined;
        var splices = [];
        var index = currentStart;
        var oldIndex = oldStart;
        for (var i = 0; i < ops.length; i++) {
          switch (ops[i]) {
           case EDIT_LEAVE:
            if (splice) {
              splices.push(splice);
              splice = undefined;
            }
            index++;
            oldIndex++;
            break;

           case EDIT_UPDATE:
            if (!splice) splice = newSplice(index, [], 0);
            splice.addedCount++;
            index++;
            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;

           case EDIT_ADD:
            if (!splice) splice = newSplice(index, [], 0);
            splice.addedCount++;
            index++;
            break;

           case EDIT_DELETE:
            if (!splice) splice = newSplice(index, [], 0);
            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
          }
        }
        if (splice) {
          splices.push(splice);
        }
        return splices;
      },
      sharedPrefix: function(current, old, searchLength) {
        for (var i = 0; i < searchLength; i++) if (!this.equals(current[i], old[i])) return i;
        return searchLength;
      },
      sharedSuffix: function(current, old, searchLength) {
        var index1 = current.length;
        var index2 = old.length;
        var count = 0;
        while (count < searchLength && this.equals(current[--index1], old[--index2])) count++;
        return count;
      },
      calculateSplices: function(current, previous) {
        return this.calcSplices(current, 0, current.length, previous, 0, previous.length);
      },
      equals: function(currentValue, previousValue) {
        return currentValue === previousValue;
      }
    };
    scope.ArraySplice = ArraySplice;
  })(window.ShadowDOMPolyfill);
  (function(context) {
    "use strict";
    var OriginalMutationObserver = window.MutationObserver;
    var callbacks = [];
    var pending = false;
    var timerFunc;
    function handle() {
      pending = false;
      var copies = callbacks.slice(0);
      callbacks = [];
      for (var i = 0; i < copies.length; i++) {
        (0, copies[i])();
      }
    }
    if (OriginalMutationObserver) {
      var counter = 1;
      var observer = new OriginalMutationObserver(handle);
      var textNode = document.createTextNode(counter);
      observer.observe(textNode, {
        characterData: true
      });
      timerFunc = function() {
        counter = (counter + 1) % 2;
        textNode.data = counter;
      };
    } else {
      timerFunc = window.setTimeout;
    }
    function setEndOfMicrotask(func) {
      callbacks.push(func);
      if (pending) return;
      pending = true;
      timerFunc(handle, 0);
    }
    context.setEndOfMicrotask = setEndOfMicrotask;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var setEndOfMicrotask = scope.setEndOfMicrotask;
    var wrapIfNeeded = scope.wrapIfNeeded;
    var wrappers = scope.wrappers;
    var registrationsTable = new WeakMap();
    var globalMutationObservers = [];
    var isScheduled = false;
    function scheduleCallback(observer) {
      if (observer.scheduled_) return;
      observer.scheduled_ = true;
      globalMutationObservers.push(observer);
      if (isScheduled) return;
      setEndOfMicrotask(notifyObservers);
      isScheduled = true;
    }
    function notifyObservers() {
      isScheduled = false;
      while (globalMutationObservers.length) {
        var notifyList = globalMutationObservers;
        globalMutationObservers = [];
        notifyList.sort(function(x, y) {
          return x.uid_ - y.uid_;
        });
        for (var i = 0; i < notifyList.length; i++) {
          var mo = notifyList[i];
          mo.scheduled_ = false;
          var queue = mo.takeRecords();
          removeTransientObserversFor(mo);
          if (queue.length) {
            mo.callback_(queue, mo);
          }
        }
      }
    }
    function MutationRecord(type, target) {
      this.type = type;
      this.target = target;
      this.addedNodes = new wrappers.NodeList();
      this.removedNodes = new wrappers.NodeList();
      this.previousSibling = null;
      this.nextSibling = null;
      this.attributeName = null;
      this.attributeNamespace = null;
      this.oldValue = null;
    }
    function registerTransientObservers(ancestor, node) {
      for (;ancestor; ancestor = ancestor.parentNode) {
        var registrations = registrationsTable.get(ancestor);
        if (!registrations) continue;
        for (var i = 0; i < registrations.length; i++) {
          var registration = registrations[i];
          if (registration.options.subtree) registration.addTransientObserver(node);
        }
      }
    }
    function removeTransientObserversFor(observer) {
      for (var i = 0; i < observer.nodes_.length; i++) {
        var node = observer.nodes_[i];
        var registrations = registrationsTable.get(node);
        if (!registrations) return;
        for (var j = 0; j < registrations.length; j++) {
          var registration = registrations[j];
          if (registration.observer === observer) registration.removeTransientObservers();
        }
      }
    }
    function enqueueMutation(target, type, data) {
      var interestedObservers = Object.create(null);
      var associatedStrings = Object.create(null);
      for (var node = target; node; node = node.parentNode) {
        var registrations = registrationsTable.get(node);
        if (!registrations) continue;
        for (var j = 0; j < registrations.length; j++) {
          var registration = registrations[j];
          var options = registration.options;
          if (node !== target && !options.subtree) continue;
          if (type === "attributes" && !options.attributes) continue;
          if (type === "attributes" && options.attributeFilter && (data.namespace !== null || options.attributeFilter.indexOf(data.name) === -1)) {
            continue;
          }
          if (type === "characterData" && !options.characterData) continue;
          if (type === "childList" && !options.childList) continue;
          var observer = registration.observer;
          interestedObservers[observer.uid_] = observer;
          if (type === "attributes" && options.attributeOldValue || type === "characterData" && options.characterDataOldValue) {
            associatedStrings[observer.uid_] = data.oldValue;
          }
        }
      }
      for (var uid in interestedObservers) {
        var observer = interestedObservers[uid];
        var record = new MutationRecord(type, target);
        if ("name" in data && "namespace" in data) {
          record.attributeName = data.name;
          record.attributeNamespace = data.namespace;
        }
        if (data.addedNodes) record.addedNodes = data.addedNodes;
        if (data.removedNodes) record.removedNodes = data.removedNodes;
        if (data.previousSibling) record.previousSibling = data.previousSibling;
        if (data.nextSibling) record.nextSibling = data.nextSibling;
        if (associatedStrings[uid] !== undefined) record.oldValue = associatedStrings[uid];
        scheduleCallback(observer);
        observer.records_.push(record);
      }
    }
    var slice = Array.prototype.slice;
    function MutationObserverOptions(options) {
      this.childList = !!options.childList;
      this.subtree = !!options.subtree;
      if (!("attributes" in options) && ("attributeOldValue" in options || "attributeFilter" in options)) {
        this.attributes = true;
      } else {
        this.attributes = !!options.attributes;
      }
      if ("characterDataOldValue" in options && !("characterData" in options)) this.characterData = true; else this.characterData = !!options.characterData;
      if (!this.attributes && (options.attributeOldValue || "attributeFilter" in options) || !this.characterData && options.characterDataOldValue) {
        throw new TypeError();
      }
      this.characterData = !!options.characterData;
      this.attributeOldValue = !!options.attributeOldValue;
      this.characterDataOldValue = !!options.characterDataOldValue;
      if ("attributeFilter" in options) {
        if (options.attributeFilter == null || typeof options.attributeFilter !== "object") {
          throw new TypeError();
        }
        this.attributeFilter = slice.call(options.attributeFilter);
      } else {
        this.attributeFilter = null;
      }
    }
    var uidCounter = 0;
    function MutationObserver(callback) {
      this.callback_ = callback;
      this.nodes_ = [];
      this.records_ = [];
      this.uid_ = ++uidCounter;
      this.scheduled_ = false;
    }
    MutationObserver.prototype = {
      constructor: MutationObserver,
      observe: function(target, options) {
        target = wrapIfNeeded(target);
        var newOptions = new MutationObserverOptions(options);
        var registration;
        var registrations = registrationsTable.get(target);
        if (!registrations) registrationsTable.set(target, registrations = []);
        for (var i = 0; i < registrations.length; i++) {
          if (registrations[i].observer === this) {
            registration = registrations[i];
            registration.removeTransientObservers();
            registration.options = newOptions;
          }
        }
        if (!registration) {
          registration = new Registration(this, target, newOptions);
          registrations.push(registration);
          this.nodes_.push(target);
        }
      },
      disconnect: function() {
        this.nodes_.forEach(function(node) {
          var registrations = registrationsTable.get(node);
          for (var i = 0; i < registrations.length; i++) {
            var registration = registrations[i];
            if (registration.observer === this) {
              registrations.splice(i, 1);
              break;
            }
          }
        }, this);
        this.records_ = [];
      },
      takeRecords: function() {
        var copyOfRecords = this.records_;
        this.records_ = [];
        return copyOfRecords;
      }
    };
    function Registration(observer, target, options) {
      this.observer = observer;
      this.target = target;
      this.options = options;
      this.transientObservedNodes = [];
    }
    Registration.prototype = {
      addTransientObserver: function(node) {
        if (node === this.target) return;
        scheduleCallback(this.observer);
        this.transientObservedNodes.push(node);
        var registrations = registrationsTable.get(node);
        if (!registrations) registrationsTable.set(node, registrations = []);
        registrations.push(this);
      },
      removeTransientObservers: function() {
        var transientObservedNodes = this.transientObservedNodes;
        this.transientObservedNodes = [];
        for (var i = 0; i < transientObservedNodes.length; i++) {
          var node = transientObservedNodes[i];
          var registrations = registrationsTable.get(node);
          for (var j = 0; j < registrations.length; j++) {
            if (registrations[j] === this) {
              registrations.splice(j, 1);
              break;
            }
          }
        }
      }
    };
    scope.enqueueMutation = enqueueMutation;
    scope.registerTransientObservers = registerTransientObservers;
    scope.wrappers.MutationObserver = MutationObserver;
    scope.wrappers.MutationRecord = MutationRecord;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    function TreeScope(root, parent) {
      this.root = root;
      this.parent = parent;
    }
    TreeScope.prototype = {
      get renderer() {
        if (this.root instanceof scope.wrappers.ShadowRoot) {
          return scope.getRendererForHost(this.root.host);
        }
        return null;
      },
      contains: function(treeScope) {
        for (;treeScope; treeScope = treeScope.parent) {
          if (treeScope === this) return true;
        }
        return false;
      }
    };
    function setTreeScope(node, treeScope) {
      if (node.treeScope_ !== treeScope) {
        node.treeScope_ = treeScope;
        for (var sr = node.shadowRoot; sr; sr = sr.olderShadowRoot) {
          sr.treeScope_.parent = treeScope;
        }
        for (var child = node.firstChild; child; child = child.nextSibling) {
          setTreeScope(child, treeScope);
        }
      }
    }
    function getTreeScope(node) {
      if (node instanceof scope.wrappers.Window) {
        debugger;
      }
      if (node.treeScope_) return node.treeScope_;
      var parent = node.parentNode;
      var treeScope;
      if (parent) treeScope = getTreeScope(parent); else treeScope = new TreeScope(node, null);
      return node.treeScope_ = treeScope;
    }
    scope.TreeScope = TreeScope;
    scope.getTreeScope = getTreeScope;
    scope.setTreeScope = setTreeScope;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var forwardMethodsToWrapper = scope.forwardMethodsToWrapper;
    var getTreeScope = scope.getTreeScope;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var wrappers = scope.wrappers;
    var wrappedFuns = new WeakMap();
    var listenersTable = new WeakMap();
    var handledEventsTable = new WeakMap();
    var currentlyDispatchingEvents = new WeakMap();
    var targetTable = new WeakMap();
    var currentTargetTable = new WeakMap();
    var relatedTargetTable = new WeakMap();
    var eventPhaseTable = new WeakMap();
    var stopPropagationTable = new WeakMap();
    var stopImmediatePropagationTable = new WeakMap();
    var eventHandlersTable = new WeakMap();
    var eventPathTable = new WeakMap();
    function isShadowRoot(node) {
      return node instanceof wrappers.ShadowRoot;
    }
    function rootOfNode(node) {
      return getTreeScope(node).root;
    }
    function getEventPath(node, event) {
      var path = [];
      var current = node;
      path.push(current);
      while (current) {
        var destinationInsertionPoints = getDestinationInsertionPoints(current);
        if (destinationInsertionPoints && destinationInsertionPoints.length > 0) {
          for (var i = 0; i < destinationInsertionPoints.length; i++) {
            var insertionPoint = destinationInsertionPoints[i];
            if (isShadowInsertionPoint(insertionPoint)) {
              var shadowRoot = rootOfNode(insertionPoint);
              var olderShadowRoot = shadowRoot.olderShadowRoot;
              if (olderShadowRoot) path.push(olderShadowRoot);
            }
            path.push(insertionPoint);
          }
          current = destinationInsertionPoints[destinationInsertionPoints.length - 1];
        } else {
          if (isShadowRoot(current)) {
            if (inSameTree(node, current) && eventMustBeStopped(event)) {
              break;
            }
            current = current.host;
            path.push(current);
          } else {
            current = current.parentNode;
            if (current) path.push(current);
          }
        }
      }
      return path;
    }
    function eventMustBeStopped(event) {
      if (!event) return false;
      switch (event.type) {
       case "abort":
       case "error":
       case "select":
       case "change":
       case "load":
       case "reset":
       case "resize":
       case "scroll":
       case "selectstart":
        return true;
      }
      return false;
    }
    function isShadowInsertionPoint(node) {
      return node instanceof HTMLShadowElement;
    }
    function getDestinationInsertionPoints(node) {
      return scope.getDestinationInsertionPoints(node);
    }
    function eventRetargetting(path, currentTarget) {
      if (path.length === 0) return currentTarget;
      if (currentTarget instanceof wrappers.Window) currentTarget = currentTarget.document;
      var currentTargetTree = getTreeScope(currentTarget);
      var originalTarget = path[0];
      var originalTargetTree = getTreeScope(originalTarget);
      var relativeTargetTree = lowestCommonInclusiveAncestor(currentTargetTree, originalTargetTree);
      for (var i = 0; i < path.length; i++) {
        var node = path[i];
        if (getTreeScope(node) === relativeTargetTree) return node;
      }
      return path[path.length - 1];
    }
    function getTreeScopeAncestors(treeScope) {
      var ancestors = [];
      for (;treeScope; treeScope = treeScope.parent) {
        ancestors.push(treeScope);
      }
      return ancestors;
    }
    function lowestCommonInclusiveAncestor(tsA, tsB) {
      var ancestorsA = getTreeScopeAncestors(tsA);
      var ancestorsB = getTreeScopeAncestors(tsB);
      var result = null;
      while (ancestorsA.length > 0 && ancestorsB.length > 0) {
        var a = ancestorsA.pop();
        var b = ancestorsB.pop();
        if (a === b) result = a; else break;
      }
      return result;
    }
    function getTreeScopeRoot(ts) {
      if (!ts.parent) return ts;
      return getTreeScopeRoot(ts.parent);
    }
    function relatedTargetResolution(event, currentTarget, relatedTarget) {
      if (currentTarget instanceof wrappers.Window) currentTarget = currentTarget.document;
      var currentTargetTree = getTreeScope(currentTarget);
      var relatedTargetTree = getTreeScope(relatedTarget);
      var relatedTargetEventPath = getEventPath(relatedTarget, event);
      var lowestCommonAncestorTree;
      var lowestCommonAncestorTree = lowestCommonInclusiveAncestor(currentTargetTree, relatedTargetTree);
      if (!lowestCommonAncestorTree) lowestCommonAncestorTree = relatedTargetTree.root;
      for (var commonAncestorTree = lowestCommonAncestorTree; commonAncestorTree; commonAncestorTree = commonAncestorTree.parent) {
        var adjustedRelatedTarget;
        for (var i = 0; i < relatedTargetEventPath.length; i++) {
          var node = relatedTargetEventPath[i];
          if (getTreeScope(node) === commonAncestorTree) return node;
        }
      }
      return null;
    }
    function inSameTree(a, b) {
      return getTreeScope(a) === getTreeScope(b);
    }
    var NONE = 0;
    var CAPTURING_PHASE = 1;
    var AT_TARGET = 2;
    var BUBBLING_PHASE = 3;
    var pendingError;
    function dispatchOriginalEvent(originalEvent) {
      if (handledEventsTable.get(originalEvent)) return;
      handledEventsTable.set(originalEvent, true);
      dispatchEvent(wrap(originalEvent), wrap(originalEvent.target));
      if (pendingError) {
        var err = pendingError;
        pendingError = null;
        throw err;
      }
    }
    function isLoadLikeEvent(event) {
      switch (event.type) {
       case "load":
       case "beforeunload":
       case "unload":
        return true;
      }
      return false;
    }
    function dispatchEvent(event, originalWrapperTarget) {
      if (currentlyDispatchingEvents.get(event)) throw new Error("InvalidStateError");
      currentlyDispatchingEvents.set(event, true);
      scope.renderAllPending();
      var eventPath;
      var overrideTarget;
      var win;
      if (isLoadLikeEvent(event) && !event.bubbles) {
        var doc = originalWrapperTarget;
        if (doc instanceof wrappers.Document && (win = doc.defaultView)) {
          overrideTarget = doc;
          eventPath = [];
        }
      }
      if (!eventPath) {
        if (originalWrapperTarget instanceof wrappers.Window) {
          win = originalWrapperTarget;
          eventPath = [];
        } else {
          eventPath = getEventPath(originalWrapperTarget, event);
          if (!isLoadLikeEvent(event)) {
            var doc = eventPath[eventPath.length - 1];
            if (doc instanceof wrappers.Document) win = doc.defaultView;
          }
        }
      }
      eventPathTable.set(event, eventPath);
      if (dispatchCapturing(event, eventPath, win, overrideTarget)) {
        if (dispatchAtTarget(event, eventPath, win, overrideTarget)) {
          dispatchBubbling(event, eventPath, win, overrideTarget);
        }
      }
      eventPhaseTable.set(event, NONE);
      currentTargetTable.delete(event, null);
      currentlyDispatchingEvents.delete(event);
      return event.defaultPrevented;
    }
    function dispatchCapturing(event, eventPath, win, overrideTarget) {
      var phase = CAPTURING_PHASE;
      if (win) {
        if (!invoke(win, event, phase, eventPath, overrideTarget)) return false;
      }
      for (var i = eventPath.length - 1; i > 0; i--) {
        if (!invoke(eventPath[i], event, phase, eventPath, overrideTarget)) return false;
      }
      return true;
    }
    function dispatchAtTarget(event, eventPath, win, overrideTarget) {
      var phase = AT_TARGET;
      var currentTarget = eventPath[0] || win;
      return invoke(currentTarget, event, phase, eventPath, overrideTarget);
    }
    function dispatchBubbling(event, eventPath, win, overrideTarget) {
      var phase = BUBBLING_PHASE;
      for (var i = 1; i < eventPath.length; i++) {
        if (!invoke(eventPath[i], event, phase, eventPath, overrideTarget)) return;
      }
      if (win && eventPath.length > 0) {
        invoke(win, event, phase, eventPath, overrideTarget);
      }
    }
    function invoke(currentTarget, event, phase, eventPath, overrideTarget) {
      var listeners = listenersTable.get(currentTarget);
      if (!listeners) return true;
      var target = overrideTarget || eventRetargetting(eventPath, currentTarget);
      if (target === currentTarget) {
        if (phase === CAPTURING_PHASE) return true;
        if (phase === BUBBLING_PHASE) phase = AT_TARGET;
      } else if (phase === BUBBLING_PHASE && !event.bubbles) {
        return true;
      }
      if ("relatedTarget" in event) {
        var originalEvent = unwrap(event);
        var unwrappedRelatedTarget = originalEvent.relatedTarget;
        if (unwrappedRelatedTarget) {
          if (unwrappedRelatedTarget instanceof Object && unwrappedRelatedTarget.addEventListener) {
            var relatedTarget = wrap(unwrappedRelatedTarget);
            var adjusted = relatedTargetResolution(event, currentTarget, relatedTarget);
            if (adjusted === target) return true;
          } else {
            adjusted = null;
          }
          relatedTargetTable.set(event, adjusted);
        }
      }
      eventPhaseTable.set(event, phase);
      var type = event.type;
      var anyRemoved = false;
      targetTable.set(event, target);
      currentTargetTable.set(event, currentTarget);
      listeners.depth++;
      for (var i = 0, len = listeners.length; i < len; i++) {
        var listener = listeners[i];
        if (listener.removed) {
          anyRemoved = true;
          continue;
        }
        if (listener.type !== type || !listener.capture && phase === CAPTURING_PHASE || listener.capture && phase === BUBBLING_PHASE) {
          continue;
        }
        try {
          if (typeof listener.handler === "function") listener.handler.call(currentTarget, event); else listener.handler.handleEvent(event);
          if (stopImmediatePropagationTable.get(event)) return false;
        } catch (ex) {
          if (!pendingError) pendingError = ex;
        }
      }
      listeners.depth--;
      if (anyRemoved && listeners.depth === 0) {
        var copy = listeners.slice();
        listeners.length = 0;
        for (var i = 0; i < copy.length; i++) {
          if (!copy[i].removed) listeners.push(copy[i]);
        }
      }
      return !stopPropagationTable.get(event);
    }
    function Listener(type, handler, capture) {
      this.type = type;
      this.handler = handler;
      this.capture = Boolean(capture);
    }
    Listener.prototype = {
      equals: function(that) {
        return this.handler === that.handler && this.type === that.type && this.capture === that.capture;
      },
      get removed() {
        return this.handler === null;
      },
      remove: function() {
        this.handler = null;
      }
    };
    var OriginalEvent = window.Event;
    OriginalEvent.prototype.polymerBlackList_ = {
      returnValue: true,
      keyLocation: true
    };
    function Event(type, options) {
      if (type instanceof OriginalEvent) {
        var impl = type;
        if (!OriginalBeforeUnloadEvent && impl.type === "beforeunload" && !(this instanceof BeforeUnloadEvent)) {
          return new BeforeUnloadEvent(impl);
        }
        setWrapper(impl, this);
      } else {
        return wrap(constructEvent(OriginalEvent, "Event", type, options));
      }
    }
    Event.prototype = {
      get target() {
        return targetTable.get(this);
      },
      get currentTarget() {
        return currentTargetTable.get(this);
      },
      get eventPhase() {
        return eventPhaseTable.get(this);
      },
      get path() {
        var eventPath = eventPathTable.get(this);
        if (!eventPath) return [];
        return eventPath.slice();
      },
      stopPropagation: function() {
        stopPropagationTable.set(this, true);
      },
      stopImmediatePropagation: function() {
        stopPropagationTable.set(this, true);
        stopImmediatePropagationTable.set(this, true);
      }
    };
    var supportsDefaultPrevented = function() {
      var e = document.createEvent("Event");
      e.initEvent("test", true, true);
      e.preventDefault();
      return e.defaultPrevented;
    }();
    if (!supportsDefaultPrevented) {
      Event.prototype.preventDefault = function() {
        if (!this.cancelable) return;
        unsafeUnwrap(this).preventDefault();
        Object.defineProperty(this, "defaultPrevented", {
          get: function() {
            return true;
          },
          configurable: true
        });
      };
    }
    registerWrapper(OriginalEvent, Event, document.createEvent("Event"));
    function unwrapOptions(options) {
      if (!options || !options.relatedTarget) return options;
      return Object.create(options, {
        relatedTarget: {
          value: unwrap(options.relatedTarget)
        }
      });
    }
    function registerGenericEvent(name, SuperEvent, prototype) {
      var OriginalEvent = window[name];
      var GenericEvent = function(type, options) {
        if (type instanceof OriginalEvent) setWrapper(type, this); else return wrap(constructEvent(OriginalEvent, name, type, options));
      };
      GenericEvent.prototype = Object.create(SuperEvent.prototype);
      if (prototype) mixin(GenericEvent.prototype, prototype);
      if (OriginalEvent) {
        try {
          registerWrapper(OriginalEvent, GenericEvent, new OriginalEvent("temp"));
        } catch (ex) {
          registerWrapper(OriginalEvent, GenericEvent, document.createEvent(name));
        }
      }
      return GenericEvent;
    }
    var UIEvent = registerGenericEvent("UIEvent", Event);
    var CustomEvent = registerGenericEvent("CustomEvent", Event);
    var relatedTargetProto = {
      get relatedTarget() {
        var relatedTarget = relatedTargetTable.get(this);
        if (relatedTarget !== undefined) return relatedTarget;
        return wrap(unwrap(this).relatedTarget);
      }
    };
    function getInitFunction(name, relatedTargetIndex) {
      return function() {
        arguments[relatedTargetIndex] = unwrap(arguments[relatedTargetIndex]);
        var impl = unwrap(this);
        impl[name].apply(impl, arguments);
      };
    }
    var mouseEventProto = mixin({
      initMouseEvent: getInitFunction("initMouseEvent", 14)
    }, relatedTargetProto);
    var focusEventProto = mixin({
      initFocusEvent: getInitFunction("initFocusEvent", 5)
    }, relatedTargetProto);
    var MouseEvent = registerGenericEvent("MouseEvent", UIEvent, mouseEventProto);
    var FocusEvent = registerGenericEvent("FocusEvent", UIEvent, focusEventProto);
    var defaultInitDicts = Object.create(null);
    var supportsEventConstructors = function() {
      try {
        new window.FocusEvent("focus");
      } catch (ex) {
        return false;
      }
      return true;
    }();
    function constructEvent(OriginalEvent, name, type, options) {
      if (supportsEventConstructors) return new OriginalEvent(type, unwrapOptions(options));
      var event = unwrap(document.createEvent(name));
      var defaultDict = defaultInitDicts[name];
      var args = [ type ];
      Object.keys(defaultDict).forEach(function(key) {
        var v = options != null && key in options ? options[key] : defaultDict[key];
        if (key === "relatedTarget") v = unwrap(v);
        args.push(v);
      });
      event["init" + name].apply(event, args);
      return event;
    }
    if (!supportsEventConstructors) {
      var configureEventConstructor = function(name, initDict, superName) {
        if (superName) {
          var superDict = defaultInitDicts[superName];
          initDict = mixin(mixin({}, superDict), initDict);
        }
        defaultInitDicts[name] = initDict;
      };
      configureEventConstructor("Event", {
        bubbles: false,
        cancelable: false
      });
      configureEventConstructor("CustomEvent", {
        detail: null
      }, "Event");
      configureEventConstructor("UIEvent", {
        view: null,
        detail: 0
      }, "Event");
      configureEventConstructor("MouseEvent", {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        button: 0,
        relatedTarget: null
      }, "UIEvent");
      configureEventConstructor("FocusEvent", {
        relatedTarget: null
      }, "UIEvent");
    }
    var OriginalBeforeUnloadEvent = window.BeforeUnloadEvent;
    function BeforeUnloadEvent(impl) {
      Event.call(this, impl);
    }
    BeforeUnloadEvent.prototype = Object.create(Event.prototype);
    mixin(BeforeUnloadEvent.prototype, {
      get returnValue() {
        return unsafeUnwrap(this).returnValue;
      },
      set returnValue(v) {
        unsafeUnwrap(this).returnValue = v;
      }
    });
    if (OriginalBeforeUnloadEvent) registerWrapper(OriginalBeforeUnloadEvent, BeforeUnloadEvent);
    function isValidListener(fun) {
      if (typeof fun === "function") return true;
      return fun && fun.handleEvent;
    }
    function isMutationEvent(type) {
      switch (type) {
       case "DOMAttrModified":
       case "DOMAttributeNameChanged":
       case "DOMCharacterDataModified":
       case "DOMElementNameChanged":
       case "DOMNodeInserted":
       case "DOMNodeInsertedIntoDocument":
       case "DOMNodeRemoved":
       case "DOMNodeRemovedFromDocument":
       case "DOMSubtreeModified":
        return true;
      }
      return false;
    }
    var OriginalEventTarget = window.EventTarget;
    function EventTarget(impl) {
      setWrapper(impl, this);
    }
    var methodNames = [ "addEventListener", "removeEventListener", "dispatchEvent" ];
    [ Node, Window ].forEach(function(constructor) {
      var p = constructor.prototype;
      methodNames.forEach(function(name) {
        Object.defineProperty(p, name + "_", {
          value: p[name]
        });
      });
    });
    function getTargetToListenAt(wrapper) {
      if (wrapper instanceof wrappers.ShadowRoot) wrapper = wrapper.host;
      return unwrap(wrapper);
    }
    EventTarget.prototype = {
      addEventListener: function(type, fun, capture) {
        if (!isValidListener(fun) || isMutationEvent(type)) return;
        var listener = new Listener(type, fun, capture);
        var listeners = listenersTable.get(this);
        if (!listeners) {
          listeners = [];
          listeners.depth = 0;
          listenersTable.set(this, listeners);
        } else {
          for (var i = 0; i < listeners.length; i++) {
            if (listener.equals(listeners[i])) return;
          }
        }
        listeners.push(listener);
        var target = getTargetToListenAt(this);
        target.addEventListener_(type, dispatchOriginalEvent, true);
      },
      removeEventListener: function(type, fun, capture) {
        capture = Boolean(capture);
        var listeners = listenersTable.get(this);
        if (!listeners) return;
        var count = 0, found = false;
        for (var i = 0; i < listeners.length; i++) {
          if (listeners[i].type === type && listeners[i].capture === capture) {
            count++;
            if (listeners[i].handler === fun) {
              found = true;
              listeners[i].remove();
            }
          }
        }
        if (found && count === 1) {
          var target = getTargetToListenAt(this);
          target.removeEventListener_(type, dispatchOriginalEvent, true);
        }
      },
      dispatchEvent: function(event) {
        var nativeEvent = unwrap(event);
        var eventType = nativeEvent.type;
        handledEventsTable.set(nativeEvent, false);
        scope.renderAllPending();
        var tempListener;
        if (!hasListenerInAncestors(this, eventType)) {
          tempListener = function() {};
          this.addEventListener(eventType, tempListener, true);
        }
        try {
          return unwrap(this).dispatchEvent_(nativeEvent);
        } finally {
          if (tempListener) this.removeEventListener(eventType, tempListener, true);
        }
      }
    };
    function hasListener(node, type) {
      var listeners = listenersTable.get(node);
      if (listeners) {
        for (var i = 0; i < listeners.length; i++) {
          if (!listeners[i].removed && listeners[i].type === type) return true;
        }
      }
      return false;
    }
    function hasListenerInAncestors(target, type) {
      for (var node = unwrap(target); node; node = node.parentNode) {
        if (hasListener(wrap(node), type)) return true;
      }
      return false;
    }
    if (OriginalEventTarget) registerWrapper(OriginalEventTarget, EventTarget);
    function wrapEventTargetMethods(constructors) {
      forwardMethodsToWrapper(constructors, methodNames);
    }
    var originalElementFromPoint = document.elementFromPoint;
    function elementFromPoint(self, document, x, y) {
      scope.renderAllPending();
      var element = wrap(originalElementFromPoint.call(unsafeUnwrap(document), x, y));
      if (!element) return null;
      var path = getEventPath(element, null);
      var idx = path.lastIndexOf(self);
      if (idx == -1) return null; else path = path.slice(0, idx);
      return eventRetargetting(path, self);
    }
    function getEventHandlerGetter(name) {
      return function() {
        var inlineEventHandlers = eventHandlersTable.get(this);
        return inlineEventHandlers && inlineEventHandlers[name] && inlineEventHandlers[name].value || null;
      };
    }
    function getEventHandlerSetter(name) {
      var eventType = name.slice(2);
      return function(value) {
        var inlineEventHandlers = eventHandlersTable.get(this);
        if (!inlineEventHandlers) {
          inlineEventHandlers = Object.create(null);
          eventHandlersTable.set(this, inlineEventHandlers);
        }
        var old = inlineEventHandlers[name];
        if (old) this.removeEventListener(eventType, old.wrapped, false);
        if (typeof value === "function") {
          var wrapped = function(e) {
            var rv = value.call(this, e);
            if (rv === false) e.preventDefault(); else if (name === "onbeforeunload" && typeof rv === "string") e.returnValue = rv;
          };
          this.addEventListener(eventType, wrapped, false);
          inlineEventHandlers[name] = {
            value: value,
            wrapped: wrapped
          };
        }
      };
    }
    scope.elementFromPoint = elementFromPoint;
    scope.getEventHandlerGetter = getEventHandlerGetter;
    scope.getEventHandlerSetter = getEventHandlerSetter;
    scope.wrapEventTargetMethods = wrapEventTargetMethods;
    scope.wrappers.BeforeUnloadEvent = BeforeUnloadEvent;
    scope.wrappers.CustomEvent = CustomEvent;
    scope.wrappers.Event = Event;
    scope.wrappers.EventTarget = EventTarget;
    scope.wrappers.FocusEvent = FocusEvent;
    scope.wrappers.MouseEvent = MouseEvent;
    scope.wrappers.UIEvent = UIEvent;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var UIEvent = scope.wrappers.UIEvent;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrap = scope.wrap;
    var OriginalTouchEvent = window.TouchEvent;
    if (!OriginalTouchEvent) return;
    var nativeEvent;
    try {
      nativeEvent = document.createEvent("TouchEvent");
    } catch (ex) {
      return;
    }
    var nonEnumDescriptor = {
      enumerable: false
    };
    function nonEnum(obj, prop) {
      Object.defineProperty(obj, prop, nonEnumDescriptor);
    }
    function Touch(impl) {
      setWrapper(impl, this);
    }
    Touch.prototype = {
      get target() {
        return wrap(unsafeUnwrap(this).target);
      }
    };
    var descr = {
      configurable: true,
      enumerable: true,
      get: null
    };
    [ "clientX", "clientY", "screenX", "screenY", "pageX", "pageY", "identifier", "webkitRadiusX", "webkitRadiusY", "webkitRotationAngle", "webkitForce" ].forEach(function(name) {
      descr.get = function() {
        return unsafeUnwrap(this)[name];
      };
      Object.defineProperty(Touch.prototype, name, descr);
    });
    function TouchList() {
      this.length = 0;
      nonEnum(this, "length");
    }
    TouchList.prototype = {
      item: function(index) {
        return this[index];
      }
    };
    function wrapTouchList(nativeTouchList) {
      var list = new TouchList();
      for (var i = 0; i < nativeTouchList.length; i++) {
        list[i] = new Touch(nativeTouchList[i]);
      }
      list.length = i;
      return list;
    }
    function TouchEvent(impl) {
      UIEvent.call(this, impl);
    }
    TouchEvent.prototype = Object.create(UIEvent.prototype);
    mixin(TouchEvent.prototype, {
      get touches() {
        return wrapTouchList(unsafeUnwrap(this).touches);
      },
      get targetTouches() {
        return wrapTouchList(unsafeUnwrap(this).targetTouches);
      },
      get changedTouches() {
        return wrapTouchList(unsafeUnwrap(this).changedTouches);
      },
      initTouchEvent: function() {
        throw new Error("Not implemented");
      }
    });
    registerWrapper(OriginalTouchEvent, TouchEvent, nativeEvent);
    scope.wrappers.Touch = Touch;
    scope.wrappers.TouchEvent = TouchEvent;
    scope.wrappers.TouchList = TouchList;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrap = scope.wrap;
    var nonEnumDescriptor = {
      enumerable: false
    };
    function nonEnum(obj, prop) {
      Object.defineProperty(obj, prop, nonEnumDescriptor);
    }
    function NodeList() {
      this.length = 0;
      nonEnum(this, "length");
    }
    NodeList.prototype = {
      item: function(index) {
        return this[index];
      }
    };
    nonEnum(NodeList.prototype, "item");
    function wrapNodeList(list) {
      if (list == null) return list;
      var wrapperList = new NodeList();
      for (var i = 0, length = list.length; i < length; i++) {
        wrapperList[i] = wrap(list[i]);
      }
      wrapperList.length = length;
      return wrapperList;
    }
    function addWrapNodeListMethod(wrapperConstructor, name) {
      wrapperConstructor.prototype[name] = function() {
        return wrapNodeList(unsafeUnwrap(this)[name].apply(unsafeUnwrap(this), arguments));
      };
    }
    scope.wrappers.NodeList = NodeList;
    scope.addWrapNodeListMethod = addWrapNodeListMethod;
    scope.wrapNodeList = wrapNodeList;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    scope.wrapHTMLCollection = scope.wrapNodeList;
    scope.wrappers.HTMLCollection = scope.wrappers.NodeList;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var EventTarget = scope.wrappers.EventTarget;
    var NodeList = scope.wrappers.NodeList;
    var TreeScope = scope.TreeScope;
    var assert = scope.assert;
    var defineWrapGetter = scope.defineWrapGetter;
    var enqueueMutation = scope.enqueueMutation;
    var getTreeScope = scope.getTreeScope;
    var isWrapper = scope.isWrapper;
    var mixin = scope.mixin;
    var registerTransientObservers = scope.registerTransientObservers;
    var registerWrapper = scope.registerWrapper;
    var setTreeScope = scope.setTreeScope;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var wrapIfNeeded = scope.wrapIfNeeded;
    var wrappers = scope.wrappers;
    function assertIsNodeWrapper(node) {
      assert(node instanceof Node);
    }
    function createOneElementNodeList(node) {
      var nodes = new NodeList();
      nodes[0] = node;
      nodes.length = 1;
      return nodes;
    }
    var surpressMutations = false;
    function enqueueRemovalForInsertedNodes(node, parent, nodes) {
      enqueueMutation(parent, "childList", {
        removedNodes: nodes,
        previousSibling: node.previousSibling,
        nextSibling: node.nextSibling
      });
    }
    function enqueueRemovalForInsertedDocumentFragment(df, nodes) {
      enqueueMutation(df, "childList", {
        removedNodes: nodes
      });
    }
    function collectNodes(node, parentNode, previousNode, nextNode) {
      if (node instanceof DocumentFragment) {
        var nodes = collectNodesForDocumentFragment(node);
        surpressMutations = true;
        for (var i = nodes.length - 1; i >= 0; i--) {
          node.removeChild(nodes[i]);
          nodes[i].parentNode_ = parentNode;
        }
        surpressMutations = false;
        for (var i = 0; i < nodes.length; i++) {
          nodes[i].previousSibling_ = nodes[i - 1] || previousNode;
          nodes[i].nextSibling_ = nodes[i + 1] || nextNode;
        }
        if (previousNode) previousNode.nextSibling_ = nodes[0];
        if (nextNode) nextNode.previousSibling_ = nodes[nodes.length - 1];
        return nodes;
      }
      var nodes = createOneElementNodeList(node);
      var oldParent = node.parentNode;
      if (oldParent) {
        oldParent.removeChild(node);
      }
      node.parentNode_ = parentNode;
      node.previousSibling_ = previousNode;
      node.nextSibling_ = nextNode;
      if (previousNode) previousNode.nextSibling_ = node;
      if (nextNode) nextNode.previousSibling_ = node;
      return nodes;
    }
    function collectNodesNative(node) {
      if (node instanceof DocumentFragment) return collectNodesForDocumentFragment(node);
      var nodes = createOneElementNodeList(node);
      var oldParent = node.parentNode;
      if (oldParent) enqueueRemovalForInsertedNodes(node, oldParent, nodes);
      return nodes;
    }
    function collectNodesForDocumentFragment(node) {
      var nodes = new NodeList();
      var i = 0;
      for (var child = node.firstChild; child; child = child.nextSibling) {
        nodes[i++] = child;
      }
      nodes.length = i;
      enqueueRemovalForInsertedDocumentFragment(node, nodes);
      return nodes;
    }
    function snapshotNodeList(nodeList) {
      return nodeList;
    }
    function nodeWasAdded(node, treeScope) {
      setTreeScope(node, treeScope);
      node.nodeIsInserted_();
    }
    function nodesWereAdded(nodes, parent) {
      var treeScope = getTreeScope(parent);
      for (var i = 0; i < nodes.length; i++) {
        nodeWasAdded(nodes[i], treeScope);
      }
    }
    function nodeWasRemoved(node) {
      setTreeScope(node, new TreeScope(node, null));
    }
    function nodesWereRemoved(nodes) {
      for (var i = 0; i < nodes.length; i++) {
        nodeWasRemoved(nodes[i]);
      }
    }
    function ensureSameOwnerDocument(parent, child) {
      var ownerDoc = parent.nodeType === Node.DOCUMENT_NODE ? parent : parent.ownerDocument;
      if (ownerDoc !== child.ownerDocument) ownerDoc.adoptNode(child);
    }
    function adoptNodesIfNeeded(owner, nodes) {
      if (!nodes.length) return;
      var ownerDoc = owner.ownerDocument;
      if (ownerDoc === nodes[0].ownerDocument) return;
      for (var i = 0; i < nodes.length; i++) {
        scope.adoptNodeNoRemove(nodes[i], ownerDoc);
      }
    }
    function unwrapNodesForInsertion(owner, nodes) {
      adoptNodesIfNeeded(owner, nodes);
      var length = nodes.length;
      if (length === 1) return unwrap(nodes[0]);
      var df = unwrap(owner.ownerDocument.createDocumentFragment());
      for (var i = 0; i < length; i++) {
        df.appendChild(unwrap(nodes[i]));
      }
      return df;
    }
    function clearChildNodes(wrapper) {
      if (wrapper.firstChild_ !== undefined) {
        var child = wrapper.firstChild_;
        while (child) {
          var tmp = child;
          child = child.nextSibling_;
          tmp.parentNode_ = tmp.previousSibling_ = tmp.nextSibling_ = undefined;
        }
      }
      wrapper.firstChild_ = wrapper.lastChild_ = undefined;
    }
    function removeAllChildNodes(wrapper) {
      if (wrapper.invalidateShadowRenderer()) {
        var childWrapper = wrapper.firstChild;
        while (childWrapper) {
          assert(childWrapper.parentNode === wrapper);
          var nextSibling = childWrapper.nextSibling;
          var childNode = unwrap(childWrapper);
          var parentNode = childNode.parentNode;
          if (parentNode) originalRemoveChild.call(parentNode, childNode);
          childWrapper.previousSibling_ = childWrapper.nextSibling_ = childWrapper.parentNode_ = null;
          childWrapper = nextSibling;
        }
        wrapper.firstChild_ = wrapper.lastChild_ = null;
      } else {
        var node = unwrap(wrapper);
        var child = node.firstChild;
        var nextSibling;
        while (child) {
          nextSibling = child.nextSibling;
          originalRemoveChild.call(node, child);
          child = nextSibling;
        }
      }
    }
    function invalidateParent(node) {
      var p = node.parentNode;
      return p && p.invalidateShadowRenderer();
    }
    function cleanupNodes(nodes) {
      for (var i = 0, n; i < nodes.length; i++) {
        n = nodes[i];
        n.parentNode.removeChild(n);
      }
    }
    var originalImportNode = document.importNode;
    var originalCloneNode = window.Node.prototype.cloneNode;
    function cloneNode(node, deep, opt_doc) {
      var clone;
      if (opt_doc) clone = wrap(originalImportNode.call(opt_doc, unsafeUnwrap(node), false)); else clone = wrap(originalCloneNode.call(unsafeUnwrap(node), false));
      if (deep) {
        for (var child = node.firstChild; child; child = child.nextSibling) {
          clone.appendChild(cloneNode(child, true, opt_doc));
        }
        if (node instanceof wrappers.HTMLTemplateElement) {
          var cloneContent = clone.content;
          for (var child = node.content.firstChild; child; child = child.nextSibling) {
            cloneContent.appendChild(cloneNode(child, true, opt_doc));
          }
        }
      }
      return clone;
    }
    function contains(self, child) {
      if (!child || getTreeScope(self) !== getTreeScope(child)) return false;
      for (var node = child; node; node = node.parentNode) {
        if (node === self) return true;
      }
      return false;
    }
    var OriginalNode = window.Node;
    function Node(original) {
      assert(original instanceof OriginalNode);
      EventTarget.call(this, original);
      this.parentNode_ = undefined;
      this.firstChild_ = undefined;
      this.lastChild_ = undefined;
      this.nextSibling_ = undefined;
      this.previousSibling_ = undefined;
      this.treeScope_ = undefined;
    }
    var OriginalDocumentFragment = window.DocumentFragment;
    var originalAppendChild = OriginalNode.prototype.appendChild;
    var originalCompareDocumentPosition = OriginalNode.prototype.compareDocumentPosition;
    var originalIsEqualNode = OriginalNode.prototype.isEqualNode;
    var originalInsertBefore = OriginalNode.prototype.insertBefore;
    var originalRemoveChild = OriginalNode.prototype.removeChild;
    var originalReplaceChild = OriginalNode.prototype.replaceChild;
    var isIEOrEdge = /Trident|Edge/.test(navigator.userAgent);
    var removeChildOriginalHelper = isIEOrEdge ? function(parent, child) {
      try {
        originalRemoveChild.call(parent, child);
      } catch (ex) {
        if (!(parent instanceof OriginalDocumentFragment)) throw ex;
      }
    } : function(parent, child) {
      originalRemoveChild.call(parent, child);
    };
    Node.prototype = Object.create(EventTarget.prototype);
    mixin(Node.prototype, {
      appendChild: function(childWrapper) {
        return this.insertBefore(childWrapper, null);
      },
      insertBefore: function(childWrapper, refWrapper) {
        assertIsNodeWrapper(childWrapper);
        var refNode;
        if (refWrapper) {
          if (isWrapper(refWrapper)) {
            refNode = unwrap(refWrapper);
          } else {
            refNode = refWrapper;
            refWrapper = wrap(refNode);
          }
        } else {
          refWrapper = null;
          refNode = null;
        }
        refWrapper && assert(refWrapper.parentNode === this);
        var nodes;
        var previousNode = refWrapper ? refWrapper.previousSibling : this.lastChild;
        var useNative = !this.invalidateShadowRenderer() && !invalidateParent(childWrapper);
        if (useNative) nodes = collectNodesNative(childWrapper); else nodes = collectNodes(childWrapper, this, previousNode, refWrapper);
        if (useNative) {
          ensureSameOwnerDocument(this, childWrapper);
          clearChildNodes(this);
          originalInsertBefore.call(unsafeUnwrap(this), unwrap(childWrapper), refNode);
        } else {
          if (!previousNode) this.firstChild_ = nodes[0];
          if (!refWrapper) {
            this.lastChild_ = nodes[nodes.length - 1];
            if (this.firstChild_ === undefined) this.firstChild_ = this.firstChild;
          }
          var parentNode = refNode ? refNode.parentNode : unsafeUnwrap(this);
          if (parentNode) {
            originalInsertBefore.call(parentNode, unwrapNodesForInsertion(this, nodes), refNode);
          } else {
            adoptNodesIfNeeded(this, nodes);
          }
        }
        enqueueMutation(this, "childList", {
          addedNodes: nodes,
          nextSibling: refWrapper,
          previousSibling: previousNode
        });
        nodesWereAdded(nodes, this);
        return childWrapper;
      },
      removeChild: function(childWrapper) {
        assertIsNodeWrapper(childWrapper);
        if (childWrapper.parentNode !== this) {
          var found = false;
          var childNodes = this.childNodes;
          for (var ieChild = this.firstChild; ieChild; ieChild = ieChild.nextSibling) {
            if (ieChild === childWrapper) {
              found = true;
              break;
            }
          }
          if (!found) {
            throw new Error("NotFoundError");
          }
        }
        var childNode = unwrap(childWrapper);
        var childWrapperNextSibling = childWrapper.nextSibling;
        var childWrapperPreviousSibling = childWrapper.previousSibling;
        if (this.invalidateShadowRenderer()) {
          var thisFirstChild = this.firstChild;
          var thisLastChild = this.lastChild;
          var parentNode = childNode.parentNode;
          if (parentNode) removeChildOriginalHelper(parentNode, childNode);
          if (thisFirstChild === childWrapper) this.firstChild_ = childWrapperNextSibling;
          if (thisLastChild === childWrapper) this.lastChild_ = childWrapperPreviousSibling;
          if (childWrapperPreviousSibling) childWrapperPreviousSibling.nextSibling_ = childWrapperNextSibling;
          if (childWrapperNextSibling) {
            childWrapperNextSibling.previousSibling_ = childWrapperPreviousSibling;
          }
          childWrapper.previousSibling_ = childWrapper.nextSibling_ = childWrapper.parentNode_ = undefined;
        } else {
          clearChildNodes(this);
          removeChildOriginalHelper(unsafeUnwrap(this), childNode);
        }
        if (!surpressMutations) {
          enqueueMutation(this, "childList", {
            removedNodes: createOneElementNodeList(childWrapper),
            nextSibling: childWrapperNextSibling,
            previousSibling: childWrapperPreviousSibling
          });
        }
        registerTransientObservers(this, childWrapper);
        return childWrapper;
      },
      replaceChild: function(newChildWrapper, oldChildWrapper) {
        assertIsNodeWrapper(newChildWrapper);
        var oldChildNode;
        if (isWrapper(oldChildWrapper)) {
          oldChildNode = unwrap(oldChildWrapper);
        } else {
          oldChildNode = oldChildWrapper;
          oldChildWrapper = wrap(oldChildNode);
        }
        if (oldChildWrapper.parentNode !== this) {
          throw new Error("NotFoundError");
        }
        var nextNode = oldChildWrapper.nextSibling;
        var previousNode = oldChildWrapper.previousSibling;
        var nodes;
        var useNative = !this.invalidateShadowRenderer() && !invalidateParent(newChildWrapper);
        if (useNative) {
          nodes = collectNodesNative(newChildWrapper);
        } else {
          if (nextNode === newChildWrapper) nextNode = newChildWrapper.nextSibling;
          nodes = collectNodes(newChildWrapper, this, previousNode, nextNode);
        }
        if (!useNative) {
          if (this.firstChild === oldChildWrapper) this.firstChild_ = nodes[0];
          if (this.lastChild === oldChildWrapper) this.lastChild_ = nodes[nodes.length - 1];
          oldChildWrapper.previousSibling_ = oldChildWrapper.nextSibling_ = oldChildWrapper.parentNode_ = undefined;
          if (oldChildNode.parentNode) {
            originalReplaceChild.call(oldChildNode.parentNode, unwrapNodesForInsertion(this, nodes), oldChildNode);
          }
        } else {
          ensureSameOwnerDocument(this, newChildWrapper);
          clearChildNodes(this);
          originalReplaceChild.call(unsafeUnwrap(this), unwrap(newChildWrapper), oldChildNode);
        }
        enqueueMutation(this, "childList", {
          addedNodes: nodes,
          removedNodes: createOneElementNodeList(oldChildWrapper),
          nextSibling: nextNode,
          previousSibling: previousNode
        });
        nodeWasRemoved(oldChildWrapper);
        nodesWereAdded(nodes, this);
        return oldChildWrapper;
      },
      nodeIsInserted_: function() {
        for (var child = this.firstChild; child; child = child.nextSibling) {
          child.nodeIsInserted_();
        }
      },
      hasChildNodes: function() {
        return this.firstChild !== null;
      },
      get parentNode() {
        return this.parentNode_ !== undefined ? this.parentNode_ : wrap(unsafeUnwrap(this).parentNode);
      },
      get firstChild() {
        return this.firstChild_ !== undefined ? this.firstChild_ : wrap(unsafeUnwrap(this).firstChild);
      },
      get lastChild() {
        return this.lastChild_ !== undefined ? this.lastChild_ : wrap(unsafeUnwrap(this).lastChild);
      },
      get nextSibling() {
        return this.nextSibling_ !== undefined ? this.nextSibling_ : wrap(unsafeUnwrap(this).nextSibling);
      },
      get previousSibling() {
        return this.previousSibling_ !== undefined ? this.previousSibling_ : wrap(unsafeUnwrap(this).previousSibling);
      },
      get parentElement() {
        var p = this.parentNode;
        while (p && p.nodeType !== Node.ELEMENT_NODE) {
          p = p.parentNode;
        }
        return p;
      },
      get textContent() {
        var s = "";
        for (var child = this.firstChild; child; child = child.nextSibling) {
          if (child.nodeType != Node.COMMENT_NODE) {
            s += child.textContent;
          }
        }
        return s;
      },
      set textContent(textContent) {
        if (textContent == null) textContent = "";
        var removedNodes = snapshotNodeList(this.childNodes);
        if (this.invalidateShadowRenderer()) {
          removeAllChildNodes(this);
          if (textContent !== "") {
            var textNode = unsafeUnwrap(this).ownerDocument.createTextNode(textContent);
            this.appendChild(textNode);
          }
        } else {
          clearChildNodes(this);
          unsafeUnwrap(this).textContent = textContent;
        }
        var addedNodes = snapshotNodeList(this.childNodes);
        enqueueMutation(this, "childList", {
          addedNodes: addedNodes,
          removedNodes: removedNodes
        });
        nodesWereRemoved(removedNodes);
        nodesWereAdded(addedNodes, this);
      },
      get childNodes() {
        var wrapperList = new NodeList();
        var i = 0;
        for (var child = this.firstChild; child; child = child.nextSibling) {
          wrapperList[i++] = child;
        }
        wrapperList.length = i;
        return wrapperList;
      },
      cloneNode: function(deep) {
        return cloneNode(this, deep);
      },
      contains: function(child) {
        return contains(this, wrapIfNeeded(child));
      },
      compareDocumentPosition: function(otherNode) {
        return originalCompareDocumentPosition.call(unsafeUnwrap(this), unwrapIfNeeded(otherNode));
      },
      isEqualNode: function(otherNode) {
        return originalIsEqualNode.call(unsafeUnwrap(this), unwrapIfNeeded(otherNode));
      },
      normalize: function() {
        var nodes = snapshotNodeList(this.childNodes);
        var remNodes = [];
        var s = "";
        var modNode;
        for (var i = 0, n; i < nodes.length; i++) {
          n = nodes[i];
          if (n.nodeType === Node.TEXT_NODE) {
            if (!modNode && !n.data.length) this.removeChild(n); else if (!modNode) modNode = n; else {
              s += n.data;
              remNodes.push(n);
            }
          } else {
            if (modNode && remNodes.length) {
              modNode.data += s;
              cleanupNodes(remNodes);
            }
            remNodes = [];
            s = "";
            modNode = null;
            if (n.childNodes.length) n.normalize();
          }
        }
        if (modNode && remNodes.length) {
          modNode.data += s;
          cleanupNodes(remNodes);
        }
      }
    });
    defineWrapGetter(Node, "ownerDocument");
    registerWrapper(OriginalNode, Node, document.createDocumentFragment());
    delete Node.prototype.querySelector;
    delete Node.prototype.querySelectorAll;
    Node.prototype = mixin(Object.create(EventTarget.prototype), Node.prototype);
    scope.cloneNode = cloneNode;
    scope.nodeWasAdded = nodeWasAdded;
    scope.nodeWasRemoved = nodeWasRemoved;
    scope.nodesWereAdded = nodesWereAdded;
    scope.nodesWereRemoved = nodesWereRemoved;
    scope.originalInsertBefore = originalInsertBefore;
    scope.originalRemoveChild = originalRemoveChild;
    scope.snapshotNodeList = snapshotNodeList;
    scope.wrappers.Node = Node;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLCollection = scope.wrappers.HTMLCollection;
    var NodeList = scope.wrappers.NodeList;
    var getTreeScope = scope.getTreeScope;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrap = scope.wrap;
    var originalDocumentQuerySelector = document.querySelector;
    var originalElementQuerySelector = document.documentElement.querySelector;
    var originalDocumentQuerySelectorAll = document.querySelectorAll;
    var originalElementQuerySelectorAll = document.documentElement.querySelectorAll;
    var originalDocumentGetElementsByTagName = document.getElementsByTagName;
    var originalElementGetElementsByTagName = document.documentElement.getElementsByTagName;
    var originalDocumentGetElementsByTagNameNS = document.getElementsByTagNameNS;
    var originalElementGetElementsByTagNameNS = document.documentElement.getElementsByTagNameNS;
    var OriginalElement = window.Element;
    var OriginalDocument = window.HTMLDocument || window.Document;
    function filterNodeList(list, index, result, deep) {
      var wrappedItem = null;
      var root = null;
      for (var i = 0, length = list.length; i < length; i++) {
        wrappedItem = wrap(list[i]);
        if (!deep && (root = getTreeScope(wrappedItem).root)) {
          if (root instanceof scope.wrappers.ShadowRoot) {
            continue;
          }
        }
        result[index++] = wrappedItem;
      }
      return index;
    }
    function shimSelector(selector) {
      return String(selector).replace(/\/deep\/|::shadow|>>>/g, " ");
    }
    function shimMatchesSelector(selector) {
      return String(selector).replace(/:host\(([^\s]+)\)/g, "$1").replace(/([^\s]):host/g, "$1").replace(":host", "*").replace(/\^|\/shadow\/|\/shadow-deep\/|::shadow|\/deep\/|::content|>>>/g, " ");
    }
    function findOne(node, selector) {
      var m, el = node.firstElementChild;
      while (el) {
        if (el.matches(selector)) return el;
        m = findOne(el, selector);
        if (m) return m;
        el = el.nextElementSibling;
      }
      return null;
    }
    function matchesSelector(el, selector) {
      return el.matches(selector);
    }
    var XHTML_NS = "http://www.w3.org/1999/xhtml";
    function matchesTagName(el, localName, localNameLowerCase) {
      var ln = el.localName;
      return ln === localName || ln === localNameLowerCase && el.namespaceURI === XHTML_NS;
    }
    function matchesEveryThing() {
      return true;
    }
    function matchesLocalNameOnly(el, ns, localName) {
      return el.localName === localName;
    }
    function matchesNameSpace(el, ns) {
      return el.namespaceURI === ns;
    }
    function matchesLocalNameNS(el, ns, localName) {
      return el.namespaceURI === ns && el.localName === localName;
    }
    function findElements(node, index, result, p, arg0, arg1) {
      var el = node.firstElementChild;
      while (el) {
        if (p(el, arg0, arg1)) result[index++] = el;
        index = findElements(el, index, result, p, arg0, arg1);
        el = el.nextElementSibling;
      }
      return index;
    }
    function querySelectorAllFiltered(p, index, result, selector, deep) {
      var target = unsafeUnwrap(this);
      var list;
      var root = getTreeScope(this).root;
      if (root instanceof scope.wrappers.ShadowRoot) {
        return findElements(this, index, result, p, selector, null);
      } else if (target instanceof OriginalElement) {
        list = originalElementQuerySelectorAll.call(target, selector);
      } else if (target instanceof OriginalDocument) {
        list = originalDocumentQuerySelectorAll.call(target, selector);
      } else {
        return findElements(this, index, result, p, selector, null);
      }
      return filterNodeList(list, index, result, deep);
    }
    var SelectorsInterface = {
      querySelector: function(selector) {
        var shimmed = shimSelector(selector);
        var deep = shimmed !== selector;
        selector = shimmed;
        var target = unsafeUnwrap(this);
        var wrappedItem;
        var root = getTreeScope(this).root;
        if (root instanceof scope.wrappers.ShadowRoot) {
          return findOne(this, selector);
        } else if (target instanceof OriginalElement) {
          wrappedItem = wrap(originalElementQuerySelector.call(target, selector));
        } else if (target instanceof OriginalDocument) {
          wrappedItem = wrap(originalDocumentQuerySelector.call(target, selector));
        } else {
          return findOne(this, selector);
        }
        if (!wrappedItem) {
          return wrappedItem;
        } else if (!deep && (root = getTreeScope(wrappedItem).root)) {
          if (root instanceof scope.wrappers.ShadowRoot) {
            return findOne(this, selector);
          }
        }
        return wrappedItem;
      },
      querySelectorAll: function(selector) {
        var shimmed = shimSelector(selector);
        var deep = shimmed !== selector;
        selector = shimmed;
        var result = new NodeList();
        result.length = querySelectorAllFiltered.call(this, matchesSelector, 0, result, selector, deep);
        return result;
      }
    };
    var MatchesInterface = {
      matches: function(selector) {
        selector = shimMatchesSelector(selector);
        return scope.originalMatches.call(unsafeUnwrap(this), selector);
      }
    };
    function getElementsByTagNameFiltered(p, index, result, localName, lowercase) {
      var target = unsafeUnwrap(this);
      var list;
      var root = getTreeScope(this).root;
      if (root instanceof scope.wrappers.ShadowRoot) {
        return findElements(this, index, result, p, localName, lowercase);
      } else if (target instanceof OriginalElement) {
        list = originalElementGetElementsByTagName.call(target, localName, lowercase);
      } else if (target instanceof OriginalDocument) {
        list = originalDocumentGetElementsByTagName.call(target, localName, lowercase);
      } else {
        return findElements(this, index, result, p, localName, lowercase);
      }
      return filterNodeList(list, index, result, false);
    }
    function getElementsByTagNameNSFiltered(p, index, result, ns, localName) {
      var target = unsafeUnwrap(this);
      var list;
      var root = getTreeScope(this).root;
      if (root instanceof scope.wrappers.ShadowRoot) {
        return findElements(this, index, result, p, ns, localName);
      } else if (target instanceof OriginalElement) {
        list = originalElementGetElementsByTagNameNS.call(target, ns, localName);
      } else if (target instanceof OriginalDocument) {
        list = originalDocumentGetElementsByTagNameNS.call(target, ns, localName);
      } else {
        return findElements(this, index, result, p, ns, localName);
      }
      return filterNodeList(list, index, result, false);
    }
    var GetElementsByInterface = {
      getElementsByTagName: function(localName) {
        var result = new HTMLCollection();
        var match = localName === "*" ? matchesEveryThing : matchesTagName;
        result.length = getElementsByTagNameFiltered.call(this, match, 0, result, localName, localName.toLowerCase());
        return result;
      },
      getElementsByClassName: function(className) {
        return this.querySelectorAll("." + className);
      },
      getElementsByTagNameNS: function(ns, localName) {
        var result = new HTMLCollection();
        var match = null;
        if (ns === "*") {
          match = localName === "*" ? matchesEveryThing : matchesLocalNameOnly;
        } else {
          match = localName === "*" ? matchesNameSpace : matchesLocalNameNS;
        }
        result.length = getElementsByTagNameNSFiltered.call(this, match, 0, result, ns || null, localName);
        return result;
      }
    };
    scope.GetElementsByInterface = GetElementsByInterface;
    scope.SelectorsInterface = SelectorsInterface;
    scope.MatchesInterface = MatchesInterface;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var NodeList = scope.wrappers.NodeList;
    function forwardElement(node) {
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.nextSibling;
      }
      return node;
    }
    function backwardsElement(node) {
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.previousSibling;
      }
      return node;
    }
    var ParentNodeInterface = {
      get firstElementChild() {
        return forwardElement(this.firstChild);
      },
      get lastElementChild() {
        return backwardsElement(this.lastChild);
      },
      get childElementCount() {
        var count = 0;
        for (var child = this.firstElementChild; child; child = child.nextElementSibling) {
          count++;
        }
        return count;
      },
      get children() {
        var wrapperList = new NodeList();
        var i = 0;
        for (var child = this.firstElementChild; child; child = child.nextElementSibling) {
          wrapperList[i++] = child;
        }
        wrapperList.length = i;
        return wrapperList;
      },
      remove: function() {
        var p = this.parentNode;
        if (p) p.removeChild(this);
      }
    };
    var ChildNodeInterface = {
      get nextElementSibling() {
        return forwardElement(this.nextSibling);
      },
      get previousElementSibling() {
        return backwardsElement(this.previousSibling);
      }
    };
    var NonElementParentNodeInterface = {
      getElementById: function(id) {
        if (/[ \t\n\r\f]/.test(id)) return null;
        return this.querySelector('[id="' + id + '"]');
      }
    };
    scope.ChildNodeInterface = ChildNodeInterface;
    scope.NonElementParentNodeInterface = NonElementParentNodeInterface;
    scope.ParentNodeInterface = ParentNodeInterface;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var ChildNodeInterface = scope.ChildNodeInterface;
    var Node = scope.wrappers.Node;
    var enqueueMutation = scope.enqueueMutation;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var OriginalCharacterData = window.CharacterData;
    function CharacterData(node) {
      Node.call(this, node);
    }
    CharacterData.prototype = Object.create(Node.prototype);
    mixin(CharacterData.prototype, {
      get nodeValue() {
        return this.data;
      },
      set nodeValue(data) {
        this.data = data;
      },
      get textContent() {
        return this.data;
      },
      set textContent(value) {
        this.data = value;
      },
      get data() {
        return unsafeUnwrap(this).data;
      },
      set data(value) {
        var oldValue = unsafeUnwrap(this).data;
        enqueueMutation(this, "characterData", {
          oldValue: oldValue
        });
        unsafeUnwrap(this).data = value;
      }
    });
    mixin(CharacterData.prototype, ChildNodeInterface);
    registerWrapper(OriginalCharacterData, CharacterData, document.createTextNode(""));
    scope.wrappers.CharacterData = CharacterData;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var CharacterData = scope.wrappers.CharacterData;
    var enqueueMutation = scope.enqueueMutation;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    function toUInt32(x) {
      return x >>> 0;
    }
    var OriginalText = window.Text;
    function Text(node) {
      CharacterData.call(this, node);
    }
    Text.prototype = Object.create(CharacterData.prototype);
    mixin(Text.prototype, {
      splitText: function(offset) {
        offset = toUInt32(offset);
        var s = this.data;
        if (offset > s.length) throw new Error("IndexSizeError");
        var head = s.slice(0, offset);
        var tail = s.slice(offset);
        this.data = head;
        var newTextNode = this.ownerDocument.createTextNode(tail);
        if (this.parentNode) this.parentNode.insertBefore(newTextNode, this.nextSibling);
        return newTextNode;
      }
    });
    registerWrapper(OriginalText, Text, document.createTextNode(""));
    scope.wrappers.Text = Text;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    if (!window.DOMTokenList) {
      console.warn("Missing DOMTokenList prototype, please include a " + "compatible classList polyfill such as http://goo.gl/uTcepH.");
      return;
    }
    var unsafeUnwrap = scope.unsafeUnwrap;
    var enqueueMutation = scope.enqueueMutation;
    function getClass(el) {
      return unsafeUnwrap(el).getAttribute("class");
    }
    function enqueueClassAttributeChange(el, oldValue) {
      enqueueMutation(el, "attributes", {
        name: "class",
        namespace: null,
        oldValue: oldValue
      });
    }
    function invalidateClass(el) {
      scope.invalidateRendererBasedOnAttribute(el, "class");
    }
    function changeClass(tokenList, method, args) {
      var ownerElement = tokenList.ownerElement_;
      if (ownerElement == null) {
        return method.apply(tokenList, args);
      }
      var oldValue = getClass(ownerElement);
      var retv = method.apply(tokenList, args);
      if (getClass(ownerElement) !== oldValue) {
        enqueueClassAttributeChange(ownerElement, oldValue);
        invalidateClass(ownerElement);
      }
      return retv;
    }
    var oldAdd = DOMTokenList.prototype.add;
    DOMTokenList.prototype.add = function() {
      changeClass(this, oldAdd, arguments);
    };
    var oldRemove = DOMTokenList.prototype.remove;
    DOMTokenList.prototype.remove = function() {
      changeClass(this, oldRemove, arguments);
    };
    var oldToggle = DOMTokenList.prototype.toggle;
    DOMTokenList.prototype.toggle = function() {
      return changeClass(this, oldToggle, arguments);
    };
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var ChildNodeInterface = scope.ChildNodeInterface;
    var GetElementsByInterface = scope.GetElementsByInterface;
    var Node = scope.wrappers.Node;
    var ParentNodeInterface = scope.ParentNodeInterface;
    var SelectorsInterface = scope.SelectorsInterface;
    var MatchesInterface = scope.MatchesInterface;
    var addWrapNodeListMethod = scope.addWrapNodeListMethod;
    var enqueueMutation = scope.enqueueMutation;
    var mixin = scope.mixin;
    var oneOf = scope.oneOf;
    var registerWrapper = scope.registerWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrappers = scope.wrappers;
    var OriginalElement = window.Element;
    var matchesNames = [ "matches", "mozMatchesSelector", "msMatchesSelector", "webkitMatchesSelector" ].filter(function(name) {
      return OriginalElement.prototype[name];
    });
    var matchesName = matchesNames[0];
    var originalMatches = OriginalElement.prototype[matchesName];
    function invalidateRendererBasedOnAttribute(element, name) {
      var p = element.parentNode;
      if (!p || !p.shadowRoot) return;
      var renderer = scope.getRendererForHost(p);
      if (renderer.dependsOnAttribute(name)) renderer.invalidate();
    }
    function enqueAttributeChange(element, name, oldValue) {
      enqueueMutation(element, "attributes", {
        name: name,
        namespace: null,
        oldValue: oldValue
      });
    }
    var classListTable = new WeakMap();
    function Element(node) {
      Node.call(this, node);
    }
    Element.prototype = Object.create(Node.prototype);
    mixin(Element.prototype, {
      createShadowRoot: function() {
        var newShadowRoot = new wrappers.ShadowRoot(this);
        unsafeUnwrap(this).polymerShadowRoot_ = newShadowRoot;
        var renderer = scope.getRendererForHost(this);
        renderer.invalidate();
        return newShadowRoot;
      },
      get shadowRoot() {
        return unsafeUnwrap(this).polymerShadowRoot_ || null;
      },
      setAttribute: function(name, value) {
        var oldValue = unsafeUnwrap(this).getAttribute(name);
        unsafeUnwrap(this).setAttribute(name, value);
        enqueAttributeChange(this, name, oldValue);
        invalidateRendererBasedOnAttribute(this, name);
      },
      removeAttribute: function(name) {
        var oldValue = unsafeUnwrap(this).getAttribute(name);
        unsafeUnwrap(this).removeAttribute(name);
        enqueAttributeChange(this, name, oldValue);
        invalidateRendererBasedOnAttribute(this, name);
      },
      get classList() {
        var list = classListTable.get(this);
        if (!list) {
          list = unsafeUnwrap(this).classList;
          if (!list) return;
          list.ownerElement_ = this;
          classListTable.set(this, list);
        }
        return list;
      },
      get className() {
        return unsafeUnwrap(this).className;
      },
      set className(v) {
        this.setAttribute("class", v);
      },
      get id() {
        return unsafeUnwrap(this).id;
      },
      set id(v) {
        this.setAttribute("id", v);
      }
    });
    matchesNames.forEach(function(name) {
      if (name !== "matches") {
        Element.prototype[name] = function(selector) {
          return this.matches(selector);
        };
      }
    });
    if (OriginalElement.prototype.webkitCreateShadowRoot) {
      Element.prototype.webkitCreateShadowRoot = Element.prototype.createShadowRoot;
    }
    mixin(Element.prototype, ChildNodeInterface);
    mixin(Element.prototype, GetElementsByInterface);
    mixin(Element.prototype, ParentNodeInterface);
    mixin(Element.prototype, SelectorsInterface);
    mixin(Element.prototype, MatchesInterface);
    registerWrapper(OriginalElement, Element, document.createElementNS(null, "x"));
    scope.invalidateRendererBasedOnAttribute = invalidateRendererBasedOnAttribute;
    scope.matchesNames = matchesNames;
    scope.originalMatches = originalMatches;
    scope.wrappers.Element = Element;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var Element = scope.wrappers.Element;
    var defineGetter = scope.defineGetter;
    var enqueueMutation = scope.enqueueMutation;
    var mixin = scope.mixin;
    var nodesWereAdded = scope.nodesWereAdded;
    var nodesWereRemoved = scope.nodesWereRemoved;
    var registerWrapper = scope.registerWrapper;
    var snapshotNodeList = scope.snapshotNodeList;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var wrappers = scope.wrappers;
    var escapeAttrRegExp = /[&\u00A0"]/g;
    var escapeDataRegExp = /[&\u00A0<>]/g;
    function escapeReplace(c) {
      switch (c) {
       case "&":
        return "&amp;";

       case "<":
        return "&lt;";

       case ">":
        return "&gt;";

       case '"':
        return "&quot;";

       case " ":
        return "&nbsp;";
      }
    }
    function escapeAttr(s) {
      return s.replace(escapeAttrRegExp, escapeReplace);
    }
    function escapeData(s) {
      return s.replace(escapeDataRegExp, escapeReplace);
    }
    function makeSet(arr) {
      var set = {};
      for (var i = 0; i < arr.length; i++) {
        set[arr[i]] = true;
      }
      return set;
    }
    var voidElements = makeSet([ "area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr" ]);
    var plaintextParents = makeSet([ "style", "script", "xmp", "iframe", "noembed", "noframes", "plaintext", "noscript" ]);
    var XHTML_NS = "http://www.w3.org/1999/xhtml";
    function needsSelfClosingSlash(node) {
      if (node.namespaceURI !== XHTML_NS) return true;
      var doctype = node.ownerDocument.doctype;
      return doctype && doctype.publicId && doctype.systemId;
    }
    function getOuterHTML(node, parentNode) {
      switch (node.nodeType) {
       case Node.ELEMENT_NODE:
        var tagName = node.tagName.toLowerCase();
        var s = "<" + tagName;
        var attrs = node.attributes;
        for (var i = 0, attr; attr = attrs[i]; i++) {
          s += " " + attr.name + '="' + escapeAttr(attr.value) + '"';
        }
        if (voidElements[tagName]) {
          if (needsSelfClosingSlash(node)) s += "/";
          return s + ">";
        }
        return s + ">" + getInnerHTML(node) + "</" + tagName + ">";

       case Node.TEXT_NODE:
        var data = node.data;
        if (parentNode && plaintextParents[parentNode.localName]) return data;
        return escapeData(data);

       case Node.COMMENT_NODE:
        return "<!--" + node.data + "-->";

       default:
        console.error(node);
        throw new Error("not implemented");
      }
    }
    function getInnerHTML(node) {
      if (node instanceof wrappers.HTMLTemplateElement) node = node.content;
      var s = "";
      for (var child = node.firstChild; child; child = child.nextSibling) {
        s += getOuterHTML(child, node);
      }
      return s;
    }
    function setInnerHTML(node, value, opt_tagName) {
      var tagName = opt_tagName || "div";
      node.textContent = "";
      var tempElement = unwrap(node.ownerDocument.createElement(tagName));
      tempElement.innerHTML = value;
      var firstChild;
      while (firstChild = tempElement.firstChild) {
        node.appendChild(wrap(firstChild));
      }
    }
    var oldIe = /MSIE/.test(navigator.userAgent);
    var OriginalHTMLElement = window.HTMLElement;
    var OriginalHTMLTemplateElement = window.HTMLTemplateElement;
    function HTMLElement(node) {
      Element.call(this, node);
    }
    HTMLElement.prototype = Object.create(Element.prototype);
    mixin(HTMLElement.prototype, {
      get innerHTML() {
        return getInnerHTML(this);
      },
      set innerHTML(value) {
        if (oldIe && plaintextParents[this.localName]) {
          this.textContent = value;
          return;
        }
        var removedNodes = snapshotNodeList(this.childNodes);
        if (this.invalidateShadowRenderer()) {
          if (this instanceof wrappers.HTMLTemplateElement) setInnerHTML(this.content, value); else setInnerHTML(this, value, this.tagName);
        } else if (!OriginalHTMLTemplateElement && this instanceof wrappers.HTMLTemplateElement) {
          setInnerHTML(this.content, value);
        } else {
          unsafeUnwrap(this).innerHTML = value;
        }
        var addedNodes = snapshotNodeList(this.childNodes);
        enqueueMutation(this, "childList", {
          addedNodes: addedNodes,
          removedNodes: removedNodes
        });
        nodesWereRemoved(removedNodes);
        nodesWereAdded(addedNodes, this);
      },
      get outerHTML() {
        return getOuterHTML(this, this.parentNode);
      },
      set outerHTML(value) {
        var p = this.parentNode;
        if (p) {
          p.invalidateShadowRenderer();
          var df = frag(p, value);
          p.replaceChild(df, this);
        }
      },
      insertAdjacentHTML: function(position, text) {
        var contextElement, refNode;
        switch (String(position).toLowerCase()) {
         case "beforebegin":
          contextElement = this.parentNode;
          refNode = this;
          break;

         case "afterend":
          contextElement = this.parentNode;
          refNode = this.nextSibling;
          break;

         case "afterbegin":
          contextElement = this;
          refNode = this.firstChild;
          break;

         case "beforeend":
          contextElement = this;
          refNode = null;
          break;

         default:
          return;
        }
        var df = frag(contextElement, text);
        contextElement.insertBefore(df, refNode);
      },
      get hidden() {
        return this.hasAttribute("hidden");
      },
      set hidden(v) {
        if (v) {
          this.setAttribute("hidden", "");
        } else {
          this.removeAttribute("hidden");
        }
      }
    });
    function frag(contextElement, html) {
      var p = unwrap(contextElement.cloneNode(false));
      p.innerHTML = html;
      var df = unwrap(document.createDocumentFragment());
      var c;
      while (c = p.firstChild) {
        df.appendChild(c);
      }
      return wrap(df);
    }
    function getter(name) {
      return function() {
        scope.renderAllPending();
        return unsafeUnwrap(this)[name];
      };
    }
    function getterRequiresRendering(name) {
      defineGetter(HTMLElement, name, getter(name));
    }
    [ "clientHeight", "clientLeft", "clientTop", "clientWidth", "offsetHeight", "offsetLeft", "offsetTop", "offsetWidth", "scrollHeight", "scrollWidth" ].forEach(getterRequiresRendering);
    function getterAndSetterRequiresRendering(name) {
      Object.defineProperty(HTMLElement.prototype, name, {
        get: getter(name),
        set: function(v) {
          scope.renderAllPending();
          unsafeUnwrap(this)[name] = v;
        },
        configurable: true,
        enumerable: true
      });
    }
    [ "scrollLeft", "scrollTop" ].forEach(getterAndSetterRequiresRendering);
    function methodRequiresRendering(name) {
      Object.defineProperty(HTMLElement.prototype, name, {
        value: function() {
          scope.renderAllPending();
          return unsafeUnwrap(this)[name].apply(unsafeUnwrap(this), arguments);
        },
        configurable: true,
        enumerable: true
      });
    }
    [ "focus", "getBoundingClientRect", "getClientRects", "scrollIntoView" ].forEach(methodRequiresRendering);
    registerWrapper(OriginalHTMLElement, HTMLElement, document.createElement("b"));
    scope.wrappers.HTMLElement = HTMLElement;
    scope.getInnerHTML = getInnerHTML;
    scope.setInnerHTML = setInnerHTML;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrap = scope.wrap;
    var OriginalHTMLCanvasElement = window.HTMLCanvasElement;
    function HTMLCanvasElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLCanvasElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLCanvasElement.prototype, {
      getContext: function() {
        var context = unsafeUnwrap(this).getContext.apply(unsafeUnwrap(this), arguments);
        return context && wrap(context);
      }
    });
    registerWrapper(OriginalHTMLCanvasElement, HTMLCanvasElement, document.createElement("canvas"));
    scope.wrappers.HTMLCanvasElement = HTMLCanvasElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var OriginalHTMLContentElement = window.HTMLContentElement;
    function HTMLContentElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLContentElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLContentElement.prototype, {
      constructor: HTMLContentElement,
      get select() {
        return this.getAttribute("select");
      },
      set select(value) {
        this.setAttribute("select", value);
      },
      setAttribute: function(n, v) {
        HTMLElement.prototype.setAttribute.call(this, n, v);
        if (String(n).toLowerCase() === "select") this.invalidateShadowRenderer(true);
      }
    });
    if (OriginalHTMLContentElement) registerWrapper(OriginalHTMLContentElement, HTMLContentElement);
    scope.wrappers.HTMLContentElement = HTMLContentElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var wrapHTMLCollection = scope.wrapHTMLCollection;
    var unwrap = scope.unwrap;
    var OriginalHTMLFormElement = window.HTMLFormElement;
    function HTMLFormElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLFormElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLFormElement.prototype, {
      get elements() {
        return wrapHTMLCollection(unwrap(this).elements);
      }
    });
    registerWrapper(OriginalHTMLFormElement, HTMLFormElement, document.createElement("form"));
    scope.wrappers.HTMLFormElement = HTMLFormElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var rewrap = scope.rewrap;
    var OriginalHTMLImageElement = window.HTMLImageElement;
    function HTMLImageElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLImageElement.prototype = Object.create(HTMLElement.prototype);
    registerWrapper(OriginalHTMLImageElement, HTMLImageElement, document.createElement("img"));
    function Image(width, height) {
      if (!(this instanceof Image)) {
        throw new TypeError("DOM object constructor cannot be called as a function.");
      }
      var node = unwrap(document.createElement("img"));
      HTMLElement.call(this, node);
      rewrap(node, this);
      if (width !== undefined) node.width = width;
      if (height !== undefined) node.height = height;
    }
    Image.prototype = HTMLImageElement.prototype;
    scope.wrappers.HTMLImageElement = HTMLImageElement;
    scope.wrappers.Image = Image;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var NodeList = scope.wrappers.NodeList;
    var registerWrapper = scope.registerWrapper;
    var OriginalHTMLShadowElement = window.HTMLShadowElement;
    function HTMLShadowElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLShadowElement.prototype = Object.create(HTMLElement.prototype);
    HTMLShadowElement.prototype.constructor = HTMLShadowElement;
    if (OriginalHTMLShadowElement) registerWrapper(OriginalHTMLShadowElement, HTMLShadowElement);
    scope.wrappers.HTMLShadowElement = HTMLShadowElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var contentTable = new WeakMap();
    var templateContentsOwnerTable = new WeakMap();
    function getTemplateContentsOwner(doc) {
      if (!doc.defaultView) return doc;
      var d = templateContentsOwnerTable.get(doc);
      if (!d) {
        d = doc.implementation.createHTMLDocument("");
        while (d.lastChild) {
          d.removeChild(d.lastChild);
        }
        templateContentsOwnerTable.set(doc, d);
      }
      return d;
    }
    function extractContent(templateElement) {
      var doc = getTemplateContentsOwner(templateElement.ownerDocument);
      var df = unwrap(doc.createDocumentFragment());
      var child;
      while (child = templateElement.firstChild) {
        df.appendChild(child);
      }
      return df;
    }
    var OriginalHTMLTemplateElement = window.HTMLTemplateElement;
    function HTMLTemplateElement(node) {
      HTMLElement.call(this, node);
      if (!OriginalHTMLTemplateElement) {
        var content = extractContent(node);
        contentTable.set(this, wrap(content));
      }
    }
    HTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLTemplateElement.prototype, {
      constructor: HTMLTemplateElement,
      get content() {
        if (OriginalHTMLTemplateElement) return wrap(unsafeUnwrap(this).content);
        return contentTable.get(this);
      }
    });
    if (OriginalHTMLTemplateElement) registerWrapper(OriginalHTMLTemplateElement, HTMLTemplateElement);
    scope.wrappers.HTMLTemplateElement = HTMLTemplateElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var registerWrapper = scope.registerWrapper;
    var OriginalHTMLMediaElement = window.HTMLMediaElement;
    if (!OriginalHTMLMediaElement) return;
    function HTMLMediaElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLMediaElement.prototype = Object.create(HTMLElement.prototype);
    registerWrapper(OriginalHTMLMediaElement, HTMLMediaElement, document.createElement("audio"));
    scope.wrappers.HTMLMediaElement = HTMLMediaElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLMediaElement = scope.wrappers.HTMLMediaElement;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var rewrap = scope.rewrap;
    var OriginalHTMLAudioElement = window.HTMLAudioElement;
    if (!OriginalHTMLAudioElement) return;
    function HTMLAudioElement(node) {
      HTMLMediaElement.call(this, node);
    }
    HTMLAudioElement.prototype = Object.create(HTMLMediaElement.prototype);
    registerWrapper(OriginalHTMLAudioElement, HTMLAudioElement, document.createElement("audio"));
    function Audio(src) {
      if (!(this instanceof Audio)) {
        throw new TypeError("DOM object constructor cannot be called as a function.");
      }
      var node = unwrap(document.createElement("audio"));
      HTMLMediaElement.call(this, node);
      rewrap(node, this);
      node.setAttribute("preload", "auto");
      if (src !== undefined) node.setAttribute("src", src);
    }
    Audio.prototype = HTMLAudioElement.prototype;
    scope.wrappers.HTMLAudioElement = HTMLAudioElement;
    scope.wrappers.Audio = Audio;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var rewrap = scope.rewrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var OriginalHTMLOptionElement = window.HTMLOptionElement;
    function trimText(s) {
      return s.replace(/\s+/g, " ").trim();
    }
    function HTMLOptionElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLOptionElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLOptionElement.prototype, {
      get text() {
        return trimText(this.textContent);
      },
      set text(value) {
        this.textContent = trimText(String(value));
      },
      get form() {
        return wrap(unwrap(this).form);
      }
    });
    registerWrapper(OriginalHTMLOptionElement, HTMLOptionElement, document.createElement("option"));
    function Option(text, value, defaultSelected, selected) {
      if (!(this instanceof Option)) {
        throw new TypeError("DOM object constructor cannot be called as a function.");
      }
      var node = unwrap(document.createElement("option"));
      HTMLElement.call(this, node);
      rewrap(node, this);
      if (text !== undefined) node.text = text;
      if (value !== undefined) node.setAttribute("value", value);
      if (defaultSelected === true) node.setAttribute("selected", "");
      node.selected = selected === true;
    }
    Option.prototype = HTMLOptionElement.prototype;
    scope.wrappers.HTMLOptionElement = HTMLOptionElement;
    scope.wrappers.Option = Option;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var OriginalHTMLSelectElement = window.HTMLSelectElement;
    function HTMLSelectElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLSelectElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLSelectElement.prototype, {
      add: function(element, before) {
        if (typeof before === "object") before = unwrap(before);
        unwrap(this).add(unwrap(element), before);
      },
      remove: function(indexOrNode) {
        if (indexOrNode === undefined) {
          HTMLElement.prototype.remove.call(this);
          return;
        }
        if (typeof indexOrNode === "object") indexOrNode = unwrap(indexOrNode);
        unwrap(this).remove(indexOrNode);
      },
      get form() {
        return wrap(unwrap(this).form);
      }
    });
    registerWrapper(OriginalHTMLSelectElement, HTMLSelectElement, document.createElement("select"));
    scope.wrappers.HTMLSelectElement = HTMLSelectElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var wrapHTMLCollection = scope.wrapHTMLCollection;
    var OriginalHTMLTableElement = window.HTMLTableElement;
    function HTMLTableElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLTableElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLTableElement.prototype, {
      get caption() {
        return wrap(unwrap(this).caption);
      },
      createCaption: function() {
        return wrap(unwrap(this).createCaption());
      },
      get tHead() {
        return wrap(unwrap(this).tHead);
      },
      createTHead: function() {
        return wrap(unwrap(this).createTHead());
      },
      createTFoot: function() {
        return wrap(unwrap(this).createTFoot());
      },
      get tFoot() {
        return wrap(unwrap(this).tFoot);
      },
      get tBodies() {
        return wrapHTMLCollection(unwrap(this).tBodies);
      },
      createTBody: function() {
        return wrap(unwrap(this).createTBody());
      },
      get rows() {
        return wrapHTMLCollection(unwrap(this).rows);
      },
      insertRow: function(index) {
        return wrap(unwrap(this).insertRow(index));
      }
    });
    registerWrapper(OriginalHTMLTableElement, HTMLTableElement, document.createElement("table"));
    scope.wrappers.HTMLTableElement = HTMLTableElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var wrapHTMLCollection = scope.wrapHTMLCollection;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var OriginalHTMLTableSectionElement = window.HTMLTableSectionElement;
    function HTMLTableSectionElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLTableSectionElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLTableSectionElement.prototype, {
      constructor: HTMLTableSectionElement,
      get rows() {
        return wrapHTMLCollection(unwrap(this).rows);
      },
      insertRow: function(index) {
        return wrap(unwrap(this).insertRow(index));
      }
    });
    registerWrapper(OriginalHTMLTableSectionElement, HTMLTableSectionElement, document.createElement("thead"));
    scope.wrappers.HTMLTableSectionElement = HTMLTableSectionElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var wrapHTMLCollection = scope.wrapHTMLCollection;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var OriginalHTMLTableRowElement = window.HTMLTableRowElement;
    function HTMLTableRowElement(node) {
      HTMLElement.call(this, node);
    }
    HTMLTableRowElement.prototype = Object.create(HTMLElement.prototype);
    mixin(HTMLTableRowElement.prototype, {
      get cells() {
        return wrapHTMLCollection(unwrap(this).cells);
      },
      insertCell: function(index) {
        return wrap(unwrap(this).insertCell(index));
      }
    });
    registerWrapper(OriginalHTMLTableRowElement, HTMLTableRowElement, document.createElement("tr"));
    scope.wrappers.HTMLTableRowElement = HTMLTableRowElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLContentElement = scope.wrappers.HTMLContentElement;
    var HTMLElement = scope.wrappers.HTMLElement;
    var HTMLShadowElement = scope.wrappers.HTMLShadowElement;
    var HTMLTemplateElement = scope.wrappers.HTMLTemplateElement;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var OriginalHTMLUnknownElement = window.HTMLUnknownElement;
    function HTMLUnknownElement(node) {
      switch (node.localName) {
       case "content":
        return new HTMLContentElement(node);

       case "shadow":
        return new HTMLShadowElement(node);

       case "template":
        return new HTMLTemplateElement(node);
      }
      HTMLElement.call(this, node);
    }
    HTMLUnknownElement.prototype = Object.create(HTMLElement.prototype);
    registerWrapper(OriginalHTMLUnknownElement, HTMLUnknownElement);
    scope.wrappers.HTMLUnknownElement = HTMLUnknownElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var Element = scope.wrappers.Element;
    var HTMLElement = scope.wrappers.HTMLElement;
    var registerWrapper = scope.registerWrapper;
    var defineWrapGetter = scope.defineWrapGetter;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrap = scope.wrap;
    var mixin = scope.mixin;
    var SVG_NS = "http://www.w3.org/2000/svg";
    var OriginalSVGElement = window.SVGElement;
    var svgTitleElement = document.createElementNS(SVG_NS, "title");
    if (!("classList" in svgTitleElement)) {
      var descr = Object.getOwnPropertyDescriptor(Element.prototype, "classList");
      Object.defineProperty(HTMLElement.prototype, "classList", descr);
      delete Element.prototype.classList;
    }
    function SVGElement(node) {
      Element.call(this, node);
    }
    SVGElement.prototype = Object.create(Element.prototype);
    mixin(SVGElement.prototype, {
      get ownerSVGElement() {
        return wrap(unsafeUnwrap(this).ownerSVGElement);
      }
    });
    registerWrapper(OriginalSVGElement, SVGElement, document.createElementNS(SVG_NS, "title"));
    scope.wrappers.SVGElement = SVGElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var OriginalSVGUseElement = window.SVGUseElement;
    var SVG_NS = "http://www.w3.org/2000/svg";
    var gWrapper = wrap(document.createElementNS(SVG_NS, "g"));
    var useElement = document.createElementNS(SVG_NS, "use");
    var SVGGElement = gWrapper.constructor;
    var parentInterfacePrototype = Object.getPrototypeOf(SVGGElement.prototype);
    var parentInterface = parentInterfacePrototype.constructor;
    function SVGUseElement(impl) {
      parentInterface.call(this, impl);
    }
    SVGUseElement.prototype = Object.create(parentInterfacePrototype);
    if ("instanceRoot" in useElement) {
      mixin(SVGUseElement.prototype, {
        get instanceRoot() {
          return wrap(unwrap(this).instanceRoot);
        },
        get animatedInstanceRoot() {
          return wrap(unwrap(this).animatedInstanceRoot);
        }
      });
    }
    registerWrapper(OriginalSVGUseElement, SVGUseElement, useElement);
    scope.wrappers.SVGUseElement = SVGUseElement;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var EventTarget = scope.wrappers.EventTarget;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var wrap = scope.wrap;
    var OriginalSVGElementInstance = window.SVGElementInstance;
    if (!OriginalSVGElementInstance) return;
    function SVGElementInstance(impl) {
      EventTarget.call(this, impl);
    }
    SVGElementInstance.prototype = Object.create(EventTarget.prototype);
    mixin(SVGElementInstance.prototype, {
      get correspondingElement() {
        return wrap(unsafeUnwrap(this).correspondingElement);
      },
      get correspondingUseElement() {
        return wrap(unsafeUnwrap(this).correspondingUseElement);
      },
      get parentNode() {
        return wrap(unsafeUnwrap(this).parentNode);
      },
      get childNodes() {
        throw new Error("Not implemented");
      },
      get firstChild() {
        return wrap(unsafeUnwrap(this).firstChild);
      },
      get lastChild() {
        return wrap(unsafeUnwrap(this).lastChild);
      },
      get previousSibling() {
        return wrap(unsafeUnwrap(this).previousSibling);
      },
      get nextSibling() {
        return wrap(unsafeUnwrap(this).nextSibling);
      }
    });
    registerWrapper(OriginalSVGElementInstance, SVGElementInstance);
    scope.wrappers.SVGElementInstance = SVGElementInstance;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var OriginalCanvasRenderingContext2D = window.CanvasRenderingContext2D;
    function CanvasRenderingContext2D(impl) {
      setWrapper(impl, this);
    }
    mixin(CanvasRenderingContext2D.prototype, {
      get canvas() {
        return wrap(unsafeUnwrap(this).canvas);
      },
      drawImage: function() {
        arguments[0] = unwrapIfNeeded(arguments[0]);
        unsafeUnwrap(this).drawImage.apply(unsafeUnwrap(this), arguments);
      },
      createPattern: function() {
        arguments[0] = unwrap(arguments[0]);
        return unsafeUnwrap(this).createPattern.apply(unsafeUnwrap(this), arguments);
      }
    });
    registerWrapper(OriginalCanvasRenderingContext2D, CanvasRenderingContext2D, document.createElement("canvas").getContext("2d"));
    scope.wrappers.CanvasRenderingContext2D = CanvasRenderingContext2D;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var addForwardingProperties = scope.addForwardingProperties;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var OriginalWebGLRenderingContext = window.WebGLRenderingContext;
    if (!OriginalWebGLRenderingContext) return;
    function WebGLRenderingContext(impl) {
      setWrapper(impl, this);
    }
    mixin(WebGLRenderingContext.prototype, {
      get canvas() {
        return wrap(unsafeUnwrap(this).canvas);
      },
      texImage2D: function() {
        arguments[5] = unwrapIfNeeded(arguments[5]);
        unsafeUnwrap(this).texImage2D.apply(unsafeUnwrap(this), arguments);
      },
      texSubImage2D: function() {
        arguments[6] = unwrapIfNeeded(arguments[6]);
        unsafeUnwrap(this).texSubImage2D.apply(unsafeUnwrap(this), arguments);
      }
    });
    var OriginalWebGLRenderingContextBase = Object.getPrototypeOf(OriginalWebGLRenderingContext.prototype);
    if (OriginalWebGLRenderingContextBase !== Object.prototype) {
      addForwardingProperties(OriginalWebGLRenderingContextBase, WebGLRenderingContext.prototype);
    }
    var instanceProperties = /WebKit/.test(navigator.userAgent) ? {
      drawingBufferHeight: null,
      drawingBufferWidth: null
    } : {};
    registerWrapper(OriginalWebGLRenderingContext, WebGLRenderingContext, instanceProperties);
    scope.wrappers.WebGLRenderingContext = WebGLRenderingContext;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var Node = scope.wrappers.Node;
    var GetElementsByInterface = scope.GetElementsByInterface;
    var NonElementParentNodeInterface = scope.NonElementParentNodeInterface;
    var ParentNodeInterface = scope.ParentNodeInterface;
    var SelectorsInterface = scope.SelectorsInterface;
    var mixin = scope.mixin;
    var registerObject = scope.registerObject;
    var registerWrapper = scope.registerWrapper;
    var OriginalDocumentFragment = window.DocumentFragment;
    function DocumentFragment(node) {
      Node.call(this, node);
    }
    DocumentFragment.prototype = Object.create(Node.prototype);
    mixin(DocumentFragment.prototype, ParentNodeInterface);
    mixin(DocumentFragment.prototype, SelectorsInterface);
    mixin(DocumentFragment.prototype, GetElementsByInterface);
    mixin(DocumentFragment.prototype, NonElementParentNodeInterface);
    registerWrapper(OriginalDocumentFragment, DocumentFragment, document.createDocumentFragment());
    scope.wrappers.DocumentFragment = DocumentFragment;
    var Comment = registerObject(document.createComment(""));
    scope.wrappers.Comment = Comment;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var DocumentFragment = scope.wrappers.DocumentFragment;
    var TreeScope = scope.TreeScope;
    var elementFromPoint = scope.elementFromPoint;
    var getInnerHTML = scope.getInnerHTML;
    var getTreeScope = scope.getTreeScope;
    var mixin = scope.mixin;
    var rewrap = scope.rewrap;
    var setInnerHTML = scope.setInnerHTML;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var shadowHostTable = new WeakMap();
    var nextOlderShadowTreeTable = new WeakMap();
    function ShadowRoot(hostWrapper) {
      var node = unwrap(unsafeUnwrap(hostWrapper).ownerDocument.createDocumentFragment());
      DocumentFragment.call(this, node);
      rewrap(node, this);
      var oldShadowRoot = hostWrapper.shadowRoot;
      nextOlderShadowTreeTable.set(this, oldShadowRoot);
      this.treeScope_ = new TreeScope(this, getTreeScope(oldShadowRoot || hostWrapper));
      shadowHostTable.set(this, hostWrapper);
    }
    ShadowRoot.prototype = Object.create(DocumentFragment.prototype);
    mixin(ShadowRoot.prototype, {
      constructor: ShadowRoot,
      get innerHTML() {
        return getInnerHTML(this);
      },
      set innerHTML(value) {
        setInnerHTML(this, value);
        this.invalidateShadowRenderer();
      },
      get olderShadowRoot() {
        return nextOlderShadowTreeTable.get(this) || null;
      },
      get host() {
        return shadowHostTable.get(this) || null;
      },
      invalidateShadowRenderer: function() {
        return shadowHostTable.get(this).invalidateShadowRenderer();
      },
      elementFromPoint: function(x, y) {
        return elementFromPoint(this, this.ownerDocument, x, y);
      },
      getSelection: function() {
        return document.getSelection();
      },
      get activeElement() {
        var unwrappedActiveElement = unwrap(this).ownerDocument.activeElement;
        if (!unwrappedActiveElement || !unwrappedActiveElement.nodeType) return null;
        var activeElement = wrap(unwrappedActiveElement);
        while (!this.contains(activeElement)) {
          while (activeElement.parentNode) {
            activeElement = activeElement.parentNode;
          }
          if (activeElement.host) {
            activeElement = activeElement.host;
          } else {
            return null;
          }
        }
        return activeElement;
      }
    });
    scope.wrappers.ShadowRoot = ShadowRoot;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var getTreeScope = scope.getTreeScope;
    var OriginalRange = window.Range;
    var ShadowRoot = scope.wrappers.ShadowRoot;
    function getHost(node) {
      var root = getTreeScope(node).root;
      if (root instanceof ShadowRoot) {
        return root.host;
      }
      return null;
    }
    function hostNodeToShadowNode(refNode, offset) {
      if (refNode.shadowRoot) {
        offset = Math.min(refNode.childNodes.length - 1, offset);
        var child = refNode.childNodes[offset];
        if (child) {
          var insertionPoint = scope.getDestinationInsertionPoints(child);
          if (insertionPoint.length > 0) {
            var parentNode = insertionPoint[0].parentNode;
            if (parentNode.nodeType == Node.ELEMENT_NODE) {
              refNode = parentNode;
            }
          }
        }
      }
      return refNode;
    }
    function shadowNodeToHostNode(node) {
      node = wrap(node);
      return getHost(node) || node;
    }
    function Range(impl) {
      setWrapper(impl, this);
    }
    Range.prototype = {
      get startContainer() {
        return shadowNodeToHostNode(unsafeUnwrap(this).startContainer);
      },
      get endContainer() {
        return shadowNodeToHostNode(unsafeUnwrap(this).endContainer);
      },
      get commonAncestorContainer() {
        return shadowNodeToHostNode(unsafeUnwrap(this).commonAncestorContainer);
      },
      setStart: function(refNode, offset) {
        refNode = hostNodeToShadowNode(refNode, offset);
        unsafeUnwrap(this).setStart(unwrapIfNeeded(refNode), offset);
      },
      setEnd: function(refNode, offset) {
        refNode = hostNodeToShadowNode(refNode, offset);
        unsafeUnwrap(this).setEnd(unwrapIfNeeded(refNode), offset);
      },
      setStartBefore: function(refNode) {
        unsafeUnwrap(this).setStartBefore(unwrapIfNeeded(refNode));
      },
      setStartAfter: function(refNode) {
        unsafeUnwrap(this).setStartAfter(unwrapIfNeeded(refNode));
      },
      setEndBefore: function(refNode) {
        unsafeUnwrap(this).setEndBefore(unwrapIfNeeded(refNode));
      },
      setEndAfter: function(refNode) {
        unsafeUnwrap(this).setEndAfter(unwrapIfNeeded(refNode));
      },
      selectNode: function(refNode) {
        unsafeUnwrap(this).selectNode(unwrapIfNeeded(refNode));
      },
      selectNodeContents: function(refNode) {
        unsafeUnwrap(this).selectNodeContents(unwrapIfNeeded(refNode));
      },
      compareBoundaryPoints: function(how, sourceRange) {
        return unsafeUnwrap(this).compareBoundaryPoints(how, unwrap(sourceRange));
      },
      extractContents: function() {
        return wrap(unsafeUnwrap(this).extractContents());
      },
      cloneContents: function() {
        return wrap(unsafeUnwrap(this).cloneContents());
      },
      insertNode: function(node) {
        unsafeUnwrap(this).insertNode(unwrapIfNeeded(node));
      },
      surroundContents: function(newParent) {
        unsafeUnwrap(this).surroundContents(unwrapIfNeeded(newParent));
      },
      cloneRange: function() {
        return wrap(unsafeUnwrap(this).cloneRange());
      },
      isPointInRange: function(node, offset) {
        return unsafeUnwrap(this).isPointInRange(unwrapIfNeeded(node), offset);
      },
      comparePoint: function(node, offset) {
        return unsafeUnwrap(this).comparePoint(unwrapIfNeeded(node), offset);
      },
      intersectsNode: function(node) {
        return unsafeUnwrap(this).intersectsNode(unwrapIfNeeded(node));
      },
      toString: function() {
        return unsafeUnwrap(this).toString();
      }
    };
    if (OriginalRange.prototype.createContextualFragment) {
      Range.prototype.createContextualFragment = function(html) {
        return wrap(unsafeUnwrap(this).createContextualFragment(html));
      };
    }
    registerWrapper(window.Range, Range, document.createRange());
    scope.wrappers.Range = Range;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var Element = scope.wrappers.Element;
    var HTMLContentElement = scope.wrappers.HTMLContentElement;
    var HTMLShadowElement = scope.wrappers.HTMLShadowElement;
    var Node = scope.wrappers.Node;
    var ShadowRoot = scope.wrappers.ShadowRoot;
    var assert = scope.assert;
    var getTreeScope = scope.getTreeScope;
    var mixin = scope.mixin;
    var oneOf = scope.oneOf;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var ArraySplice = scope.ArraySplice;
    function updateWrapperUpAndSideways(wrapper) {
      wrapper.previousSibling_ = wrapper.previousSibling;
      wrapper.nextSibling_ = wrapper.nextSibling;
      wrapper.parentNode_ = wrapper.parentNode;
    }
    function updateWrapperDown(wrapper) {
      wrapper.firstChild_ = wrapper.firstChild;
      wrapper.lastChild_ = wrapper.lastChild;
    }
    function updateAllChildNodes(parentNodeWrapper) {
      assert(parentNodeWrapper instanceof Node);
      for (var childWrapper = parentNodeWrapper.firstChild; childWrapper; childWrapper = childWrapper.nextSibling) {
        updateWrapperUpAndSideways(childWrapper);
      }
      updateWrapperDown(parentNodeWrapper);
    }
    function insertBefore(parentNodeWrapper, newChildWrapper, refChildWrapper) {
      var parentNode = unwrap(parentNodeWrapper);
      var newChild = unwrap(newChildWrapper);
      var refChild = refChildWrapper ? unwrap(refChildWrapper) : null;
      remove(newChildWrapper);
      updateWrapperUpAndSideways(newChildWrapper);
      if (!refChildWrapper) {
        parentNodeWrapper.lastChild_ = parentNodeWrapper.lastChild;
        if (parentNodeWrapper.lastChild === parentNodeWrapper.firstChild) parentNodeWrapper.firstChild_ = parentNodeWrapper.firstChild;
        var lastChildWrapper = wrap(parentNode.lastChild);
        if (lastChildWrapper) lastChildWrapper.nextSibling_ = lastChildWrapper.nextSibling;
      } else {
        if (parentNodeWrapper.firstChild === refChildWrapper) parentNodeWrapper.firstChild_ = refChildWrapper;
        refChildWrapper.previousSibling_ = refChildWrapper.previousSibling;
      }
      scope.originalInsertBefore.call(parentNode, newChild, refChild);
    }
    function remove(nodeWrapper) {
      var node = unwrap(nodeWrapper);
      var parentNode = node.parentNode;
      if (!parentNode) return;
      var parentNodeWrapper = wrap(parentNode);
      updateWrapperUpAndSideways(nodeWrapper);
      if (nodeWrapper.previousSibling) nodeWrapper.previousSibling.nextSibling_ = nodeWrapper;
      if (nodeWrapper.nextSibling) nodeWrapper.nextSibling.previousSibling_ = nodeWrapper;
      if (parentNodeWrapper.lastChild === nodeWrapper) parentNodeWrapper.lastChild_ = nodeWrapper;
      if (parentNodeWrapper.firstChild === nodeWrapper) parentNodeWrapper.firstChild_ = nodeWrapper;
      scope.originalRemoveChild.call(parentNode, node);
    }
    var distributedNodesTable = new WeakMap();
    var destinationInsertionPointsTable = new WeakMap();
    var rendererForHostTable = new WeakMap();
    function resetDistributedNodes(insertionPoint) {
      distributedNodesTable.set(insertionPoint, []);
    }
    function getDistributedNodes(insertionPoint) {
      var rv = distributedNodesTable.get(insertionPoint);
      if (!rv) distributedNodesTable.set(insertionPoint, rv = []);
      return rv;
    }
    function getChildNodesSnapshot(node) {
      var result = [], i = 0;
      for (var child = node.firstChild; child; child = child.nextSibling) {
        result[i++] = child;
      }
      return result;
    }
    var request = oneOf(window, [ "requestAnimationFrame", "mozRequestAnimationFrame", "webkitRequestAnimationFrame", "setTimeout" ]);
    var pendingDirtyRenderers = [];
    var renderTimer;
    function renderAllPending() {
      for (var i = 0; i < pendingDirtyRenderers.length; i++) {
        var renderer = pendingDirtyRenderers[i];
        var parentRenderer = renderer.parentRenderer;
        if (parentRenderer && parentRenderer.dirty) continue;
        renderer.render();
      }
      pendingDirtyRenderers = [];
    }
    function handleRequestAnimationFrame() {
      renderTimer = null;
      renderAllPending();
    }
    function getRendererForHost(host) {
      var renderer = rendererForHostTable.get(host);
      if (!renderer) {
        renderer = new ShadowRenderer(host);
        rendererForHostTable.set(host, renderer);
      }
      return renderer;
    }
    function getShadowRootAncestor(node) {
      var root = getTreeScope(node).root;
      if (root instanceof ShadowRoot) return root;
      return null;
    }
    function getRendererForShadowRoot(shadowRoot) {
      return getRendererForHost(shadowRoot.host);
    }
    var spliceDiff = new ArraySplice();
    spliceDiff.equals = function(renderNode, rawNode) {
      return unwrap(renderNode.node) === rawNode;
    };
    function RenderNode(node) {
      this.skip = false;
      this.node = node;
      this.childNodes = [];
    }
    RenderNode.prototype = {
      append: function(node) {
        var rv = new RenderNode(node);
        this.childNodes.push(rv);
        return rv;
      },
      sync: function(opt_added) {
        if (this.skip) return;
        var nodeWrapper = this.node;
        var newChildren = this.childNodes;
        var oldChildren = getChildNodesSnapshot(unwrap(nodeWrapper));
        var added = opt_added || new WeakMap();
        var splices = spliceDiff.calculateSplices(newChildren, oldChildren);
        var newIndex = 0, oldIndex = 0;
        var lastIndex = 0;
        for (var i = 0; i < splices.length; i++) {
          var splice = splices[i];
          for (;lastIndex < splice.index; lastIndex++) {
            oldIndex++;
            newChildren[newIndex++].sync(added);
          }
          var removedCount = splice.removed.length;
          for (var j = 0; j < removedCount; j++) {
            var wrapper = wrap(oldChildren[oldIndex++]);
            if (!added.get(wrapper)) remove(wrapper);
          }
          var addedCount = splice.addedCount;
          var refNode = oldChildren[oldIndex] && wrap(oldChildren[oldIndex]);
          for (var j = 0; j < addedCount; j++) {
            var newChildRenderNode = newChildren[newIndex++];
            var newChildWrapper = newChildRenderNode.node;
            insertBefore(nodeWrapper, newChildWrapper, refNode);
            added.set(newChildWrapper, true);
            newChildRenderNode.sync(added);
          }
          lastIndex += addedCount;
        }
        for (var i = lastIndex; i < newChildren.length; i++) {
          newChildren[i].sync(added);
        }
      }
    };
    function ShadowRenderer(host) {
      this.host = host;
      this.dirty = false;
      this.invalidateAttributes();
      this.associateNode(host);
    }
    ShadowRenderer.prototype = {
      render: function(opt_renderNode) {
        if (!this.dirty) return;
        this.invalidateAttributes();
        var host = this.host;
        this.distribution(host);
        var renderNode = opt_renderNode || new RenderNode(host);
        this.buildRenderTree(renderNode, host);
        var topMostRenderer = !opt_renderNode;
        if (topMostRenderer) renderNode.sync();
        this.dirty = false;
      },
      get parentRenderer() {
        return getTreeScope(this.host).renderer;
      },
      invalidate: function() {
        if (!this.dirty) {
          this.dirty = true;
          var parentRenderer = this.parentRenderer;
          if (parentRenderer) parentRenderer.invalidate();
          pendingDirtyRenderers.push(this);
          if (renderTimer) return;
          renderTimer = window[request](handleRequestAnimationFrame, 0);
        }
      },
      distribution: function(root) {
        this.resetAllSubtrees(root);
        this.distributionResolution(root);
      },
      resetAll: function(node) {
        if (isInsertionPoint(node)) resetDistributedNodes(node); else resetDestinationInsertionPoints(node);
        this.resetAllSubtrees(node);
      },
      resetAllSubtrees: function(node) {
        for (var child = node.firstChild; child; child = child.nextSibling) {
          this.resetAll(child);
        }
        if (node.shadowRoot) this.resetAll(node.shadowRoot);
        if (node.olderShadowRoot) this.resetAll(node.olderShadowRoot);
      },
      distributionResolution: function(node) {
        if (isShadowHost(node)) {
          var shadowHost = node;
          var pool = poolPopulation(shadowHost);
          var shadowTrees = getShadowTrees(shadowHost);
          for (var i = 0; i < shadowTrees.length; i++) {
            this.poolDistribution(shadowTrees[i], pool);
          }
          for (var i = shadowTrees.length - 1; i >= 0; i--) {
            var shadowTree = shadowTrees[i];
            var shadow = getShadowInsertionPoint(shadowTree);
            if (shadow) {
              var olderShadowRoot = shadowTree.olderShadowRoot;
              if (olderShadowRoot) {
                pool = poolPopulation(olderShadowRoot);
              }
              for (var j = 0; j < pool.length; j++) {
                destributeNodeInto(pool[j], shadow);
              }
            }
            this.distributionResolution(shadowTree);
          }
        }
        for (var child = node.firstChild; child; child = child.nextSibling) {
          this.distributionResolution(child);
        }
      },
      poolDistribution: function(node, pool) {
        if (node instanceof HTMLShadowElement) return;
        if (node instanceof HTMLContentElement) {
          var content = node;
          this.updateDependentAttributes(content.getAttribute("select"));
          var anyDistributed = false;
          for (var i = 0; i < pool.length; i++) {
            var node = pool[i];
            if (!node) continue;
            if (matches(node, content)) {
              destributeNodeInto(node, content);
              pool[i] = undefined;
              anyDistributed = true;
            }
          }
          if (!anyDistributed) {
            for (var child = content.firstChild; child; child = child.nextSibling) {
              destributeNodeInto(child, content);
            }
          }
          return;
        }
        for (var child = node.firstChild; child; child = child.nextSibling) {
          this.poolDistribution(child, pool);
        }
      },
      buildRenderTree: function(renderNode, node) {
        var children = this.compose(node);
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          var childRenderNode = renderNode.append(child);
          this.buildRenderTree(childRenderNode, child);
        }
        if (isShadowHost(node)) {
          var renderer = getRendererForHost(node);
          renderer.dirty = false;
        }
      },
      compose: function(node) {
        var children = [];
        var p = node.shadowRoot || node;
        for (var child = p.firstChild; child; child = child.nextSibling) {
          if (isInsertionPoint(child)) {
            this.associateNode(p);
            var distributedNodes = getDistributedNodes(child);
            for (var j = 0; j < distributedNodes.length; j++) {
              var distributedNode = distributedNodes[j];
              if (isFinalDestination(child, distributedNode)) children.push(distributedNode);
            }
          } else {
            children.push(child);
          }
        }
        return children;
      },
      invalidateAttributes: function() {
        this.attributes = Object.create(null);
      },
      updateDependentAttributes: function(selector) {
        if (!selector) return;
        var attributes = this.attributes;
        if (/\.\w+/.test(selector)) attributes["class"] = true;
        if (/#\w+/.test(selector)) attributes["id"] = true;
        selector.replace(/\[\s*([^\s=\|~\]]+)/g, function(_, name) {
          attributes[name] = true;
        });
      },
      dependsOnAttribute: function(name) {
        return this.attributes[name];
      },
      associateNode: function(node) {
        unsafeUnwrap(node).polymerShadowRenderer_ = this;
      }
    };
    function poolPopulation(node) {
      var pool = [];
      for (var child = node.firstChild; child; child = child.nextSibling) {
        if (isInsertionPoint(child)) {
          pool.push.apply(pool, getDistributedNodes(child));
        } else {
          pool.push(child);
        }
      }
      return pool;
    }
    function getShadowInsertionPoint(node) {
      if (node instanceof HTMLShadowElement) return node;
      if (node instanceof HTMLContentElement) return null;
      for (var child = node.firstChild; child; child = child.nextSibling) {
        var res = getShadowInsertionPoint(child);
        if (res) return res;
      }
      return null;
    }
    function destributeNodeInto(child, insertionPoint) {
      getDistributedNodes(insertionPoint).push(child);
      var points = destinationInsertionPointsTable.get(child);
      if (!points) destinationInsertionPointsTable.set(child, [ insertionPoint ]); else points.push(insertionPoint);
    }
    function getDestinationInsertionPoints(node) {
      return destinationInsertionPointsTable.get(node);
    }
    function resetDestinationInsertionPoints(node) {
      destinationInsertionPointsTable.set(node, undefined);
    }
    var selectorStartCharRe = /^(:not\()?[*.#[a-zA-Z_|]/;
    function matches(node, contentElement) {
      var select = contentElement.getAttribute("select");
      if (!select) return true;
      select = select.trim();
      if (!select) return true;
      if (!(node instanceof Element)) return false;
      if (!selectorStartCharRe.test(select)) return false;
      try {
        return node.matches(select);
      } catch (ex) {
        return false;
      }
    }
    function isFinalDestination(insertionPoint, node) {
      var points = getDestinationInsertionPoints(node);
      return points && points[points.length - 1] === insertionPoint;
    }
    function isInsertionPoint(node) {
      return node instanceof HTMLContentElement || node instanceof HTMLShadowElement;
    }
    function isShadowHost(shadowHost) {
      return shadowHost.shadowRoot;
    }
    function getShadowTrees(host) {
      var trees = [];
      for (var tree = host.shadowRoot; tree; tree = tree.olderShadowRoot) {
        trees.push(tree);
      }
      return trees;
    }
    function render(host) {
      new ShadowRenderer(host).render();
    }
    Node.prototype.invalidateShadowRenderer = function(force) {
      var renderer = unsafeUnwrap(this).polymerShadowRenderer_;
      if (renderer) {
        renderer.invalidate();
        return true;
      }
      return false;
    };
    HTMLContentElement.prototype.getDistributedNodes = HTMLShadowElement.prototype.getDistributedNodes = function() {
      renderAllPending();
      return getDistributedNodes(this);
    };
    Element.prototype.getDestinationInsertionPoints = function() {
      renderAllPending();
      return getDestinationInsertionPoints(this) || [];
    };
    HTMLContentElement.prototype.nodeIsInserted_ = HTMLShadowElement.prototype.nodeIsInserted_ = function() {
      this.invalidateShadowRenderer();
      var shadowRoot = getShadowRootAncestor(this);
      var renderer;
      if (shadowRoot) renderer = getRendererForShadowRoot(shadowRoot);
      unsafeUnwrap(this).polymerShadowRenderer_ = renderer;
      if (renderer) renderer.invalidate();
    };
    scope.getRendererForHost = getRendererForHost;
    scope.getShadowTrees = getShadowTrees;
    scope.renderAllPending = renderAllPending;
    scope.getDestinationInsertionPoints = getDestinationInsertionPoints;
    scope.visual = {
      insertBefore: insertBefore,
      remove: remove
    };
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var HTMLElement = scope.wrappers.HTMLElement;
    var assert = scope.assert;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var elementsWithFormProperty = [ "HTMLButtonElement", "HTMLFieldSetElement", "HTMLInputElement", "HTMLKeygenElement", "HTMLLabelElement", "HTMLLegendElement", "HTMLObjectElement", "HTMLOutputElement", "HTMLTextAreaElement" ];
    function createWrapperConstructor(name) {
      if (!window[name]) return;
      assert(!scope.wrappers[name]);
      var GeneratedWrapper = function(node) {
        HTMLElement.call(this, node);
      };
      GeneratedWrapper.prototype = Object.create(HTMLElement.prototype);
      mixin(GeneratedWrapper.prototype, {
        get form() {
          return wrap(unwrap(this).form);
        }
      });
      registerWrapper(window[name], GeneratedWrapper, document.createElement(name.slice(4, -7)));
      scope.wrappers[name] = GeneratedWrapper;
    }
    elementsWithFormProperty.forEach(createWrapperConstructor);
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var OriginalSelection = window.Selection;
    function Selection(impl) {
      setWrapper(impl, this);
    }
    Selection.prototype = {
      get anchorNode() {
        return wrap(unsafeUnwrap(this).anchorNode);
      },
      get focusNode() {
        return wrap(unsafeUnwrap(this).focusNode);
      },
      addRange: function(range) {
        unsafeUnwrap(this).addRange(unwrapIfNeeded(range));
      },
      collapse: function(node, index) {
        unsafeUnwrap(this).collapse(unwrapIfNeeded(node), index);
      },
      containsNode: function(node, allowPartial) {
        return unsafeUnwrap(this).containsNode(unwrapIfNeeded(node), allowPartial);
      },
      getRangeAt: function(index) {
        return wrap(unsafeUnwrap(this).getRangeAt(index));
      },
      removeRange: function(range) {
        unsafeUnwrap(this).removeRange(unwrap(range));
      },
      selectAllChildren: function(node) {
        unsafeUnwrap(this).selectAllChildren(node instanceof ShadowRoot ? unsafeUnwrap(node.host) : unwrapIfNeeded(node));
      },
      toString: function() {
        return unsafeUnwrap(this).toString();
      }
    };
    if (OriginalSelection.prototype.extend) {
      Selection.prototype.extend = function(node, offset) {
        unsafeUnwrap(this).extend(unwrapIfNeeded(node), offset);
      };
    }
    registerWrapper(window.Selection, Selection, window.getSelection());
    scope.wrappers.Selection = Selection;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var OriginalTreeWalker = window.TreeWalker;
    function TreeWalker(impl) {
      setWrapper(impl, this);
    }
    TreeWalker.prototype = {
      get root() {
        return wrap(unsafeUnwrap(this).root);
      },
      get currentNode() {
        return wrap(unsafeUnwrap(this).currentNode);
      },
      set currentNode(node) {
        unsafeUnwrap(this).currentNode = unwrapIfNeeded(node);
      },
      get filter() {
        return unsafeUnwrap(this).filter;
      },
      parentNode: function() {
        return wrap(unsafeUnwrap(this).parentNode());
      },
      firstChild: function() {
        return wrap(unsafeUnwrap(this).firstChild());
      },
      lastChild: function() {
        return wrap(unsafeUnwrap(this).lastChild());
      },
      previousSibling: function() {
        return wrap(unsafeUnwrap(this).previousSibling());
      },
      previousNode: function() {
        return wrap(unsafeUnwrap(this).previousNode());
      },
      nextNode: function() {
        return wrap(unsafeUnwrap(this).nextNode());
      }
    };
    registerWrapper(OriginalTreeWalker, TreeWalker);
    scope.wrappers.TreeWalker = TreeWalker;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var GetElementsByInterface = scope.GetElementsByInterface;
    var Node = scope.wrappers.Node;
    var ParentNodeInterface = scope.ParentNodeInterface;
    var NonElementParentNodeInterface = scope.NonElementParentNodeInterface;
    var Selection = scope.wrappers.Selection;
    var SelectorsInterface = scope.SelectorsInterface;
    var ShadowRoot = scope.wrappers.ShadowRoot;
    var TreeScope = scope.TreeScope;
    var cloneNode = scope.cloneNode;
    var defineGetter = scope.defineGetter;
    var defineWrapGetter = scope.defineWrapGetter;
    var elementFromPoint = scope.elementFromPoint;
    var forwardMethodsToWrapper = scope.forwardMethodsToWrapper;
    var matchesNames = scope.matchesNames;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var renderAllPending = scope.renderAllPending;
    var rewrap = scope.rewrap;
    var setWrapper = scope.setWrapper;
    var unsafeUnwrap = scope.unsafeUnwrap;
    var unwrap = scope.unwrap;
    var wrap = scope.wrap;
    var wrapEventTargetMethods = scope.wrapEventTargetMethods;
    var wrapNodeList = scope.wrapNodeList;
    var implementationTable = new WeakMap();
    function Document(node) {
      Node.call(this, node);
      this.treeScope_ = new TreeScope(this, null);
    }
    Document.prototype = Object.create(Node.prototype);
    defineWrapGetter(Document, "documentElement");
    defineWrapGetter(Document, "body");
    defineWrapGetter(Document, "head");
    defineGetter(Document, "activeElement", function() {
      var unwrappedActiveElement = unwrap(this).activeElement;
      if (!unwrappedActiveElement || !unwrappedActiveElement.nodeType) return null;
      var activeElement = wrap(unwrappedActiveElement);
      while (!this.contains(activeElement)) {
        while (activeElement.parentNode) {
          activeElement = activeElement.parentNode;
        }
        if (activeElement.host) {
          activeElement = activeElement.host;
        } else {
          return null;
        }
      }
      return activeElement;
    });
    function wrapMethod(name) {
      var original = document[name];
      Document.prototype[name] = function() {
        return wrap(original.apply(unsafeUnwrap(this), arguments));
      };
    }
    [ "createComment", "createDocumentFragment", "createElement", "createElementNS", "createEvent", "createEventNS", "createRange", "createTextNode" ].forEach(wrapMethod);
    var originalAdoptNode = document.adoptNode;
    function adoptNodeNoRemove(node, doc) {
      originalAdoptNode.call(unsafeUnwrap(doc), unwrap(node));
      adoptSubtree(node, doc);
    }
    function adoptSubtree(node, doc) {
      if (node.shadowRoot) doc.adoptNode(node.shadowRoot);
      if (node instanceof ShadowRoot) adoptOlderShadowRoots(node, doc);
      for (var child = node.firstChild; child; child = child.nextSibling) {
        adoptSubtree(child, doc);
      }
    }
    function adoptOlderShadowRoots(shadowRoot, doc) {
      var oldShadowRoot = shadowRoot.olderShadowRoot;
      if (oldShadowRoot) doc.adoptNode(oldShadowRoot);
    }
    var originalGetSelection = document.getSelection;
    mixin(Document.prototype, {
      adoptNode: function(node) {
        if (node.parentNode) node.parentNode.removeChild(node);
        adoptNodeNoRemove(node, this);
        return node;
      },
      elementFromPoint: function(x, y) {
        return elementFromPoint(this, this, x, y);
      },
      importNode: function(node, deep) {
        return cloneNode(node, deep, unsafeUnwrap(this));
      },
      getSelection: function() {
        renderAllPending();
        return new Selection(originalGetSelection.call(unwrap(this)));
      },
      getElementsByName: function(name) {
        return SelectorsInterface.querySelectorAll.call(this, "[name=" + JSON.stringify(String(name)) + "]");
      }
    });
    var originalCreateTreeWalker = document.createTreeWalker;
    var TreeWalkerWrapper = scope.wrappers.TreeWalker;
    Document.prototype.createTreeWalker = function(root, whatToShow, filter, expandEntityReferences) {
      var newFilter = null;
      if (filter) {
        if (filter.acceptNode && typeof filter.acceptNode === "function") {
          newFilter = {
            acceptNode: function(node) {
              return filter.acceptNode(wrap(node));
            }
          };
        } else if (typeof filter === "function") {
          newFilter = function(node) {
            return filter(wrap(node));
          };
        }
      }
      return new TreeWalkerWrapper(originalCreateTreeWalker.call(unwrap(this), unwrap(root), whatToShow, newFilter, expandEntityReferences));
    };
    if (document.registerElement) {
      var originalRegisterElement = document.registerElement;
      Document.prototype.registerElement = function(tagName, object) {
        var prototype, extendsOption;
        if (object !== undefined) {
          prototype = object.prototype;
          extendsOption = object.extends;
        }
        if (!prototype) prototype = Object.create(HTMLElement.prototype);
        if (scope.nativePrototypeTable.get(prototype)) {
          throw new Error("NotSupportedError");
        }
        var proto = Object.getPrototypeOf(prototype);
        var nativePrototype;
        var prototypes = [];
        while (proto) {
          nativePrototype = scope.nativePrototypeTable.get(proto);
          if (nativePrototype) break;
          prototypes.push(proto);
          proto = Object.getPrototypeOf(proto);
        }
        if (!nativePrototype) {
          throw new Error("NotSupportedError");
        }
        var newPrototype = Object.create(nativePrototype);
        for (var i = prototypes.length - 1; i >= 0; i--) {
          newPrototype = Object.create(newPrototype);
        }
        [ "createdCallback", "attachedCallback", "detachedCallback", "attributeChangedCallback" ].forEach(function(name) {
          var f = prototype[name];
          if (!f) return;
          newPrototype[name] = function() {
            if (!(wrap(this) instanceof CustomElementConstructor)) {
              rewrap(this);
            }
            f.apply(wrap(this), arguments);
          };
        });
        var p = {
          prototype: newPrototype
        };
        if (extendsOption) p.extends = extendsOption;
        function CustomElementConstructor(node) {
          if (!node) {
            if (extendsOption) {
              return document.createElement(extendsOption, tagName);
            } else {
              return document.createElement(tagName);
            }
          }
          setWrapper(node, this);
        }
        CustomElementConstructor.prototype = prototype;
        CustomElementConstructor.prototype.constructor = CustomElementConstructor;
        scope.constructorTable.set(newPrototype, CustomElementConstructor);
        scope.nativePrototypeTable.set(prototype, newPrototype);
        var nativeConstructor = originalRegisterElement.call(unwrap(this), tagName, p);
        return CustomElementConstructor;
      };
      forwardMethodsToWrapper([ window.HTMLDocument || window.Document ], [ "registerElement" ]);
    }
    forwardMethodsToWrapper([ window.HTMLBodyElement, window.HTMLDocument || window.Document, window.HTMLHeadElement, window.HTMLHtmlElement ], [ "appendChild", "compareDocumentPosition", "contains", "getElementsByClassName", "getElementsByTagName", "getElementsByTagNameNS", "insertBefore", "querySelector", "querySelectorAll", "removeChild", "replaceChild" ]);
    forwardMethodsToWrapper([ window.HTMLBodyElement, window.HTMLHeadElement, window.HTMLHtmlElement ], matchesNames);
    forwardMethodsToWrapper([ window.HTMLDocument || window.Document ], [ "adoptNode", "importNode", "contains", "createComment", "createDocumentFragment", "createElement", "createElementNS", "createEvent", "createEventNS", "createRange", "createTextNode", "createTreeWalker", "elementFromPoint", "getElementById", "getElementsByName", "getSelection" ]);
    mixin(Document.prototype, GetElementsByInterface);
    mixin(Document.prototype, ParentNodeInterface);
    mixin(Document.prototype, SelectorsInterface);
    mixin(Document.prototype, NonElementParentNodeInterface);
    mixin(Document.prototype, {
      get implementation() {
        var implementation = implementationTable.get(this);
        if (implementation) return implementation;
        implementation = new DOMImplementation(unwrap(this).implementation);
        implementationTable.set(this, implementation);
        return implementation;
      },
      get defaultView() {
        return wrap(unwrap(this).defaultView);
      }
    });
    registerWrapper(window.Document, Document, document.implementation.createHTMLDocument(""));
    if (window.HTMLDocument) registerWrapper(window.HTMLDocument, Document);
    wrapEventTargetMethods([ window.HTMLBodyElement, window.HTMLDocument || window.Document, window.HTMLHeadElement ]);
    function DOMImplementation(impl) {
      setWrapper(impl, this);
    }
    var originalCreateDocument = document.implementation.createDocument;
    DOMImplementation.prototype.createDocument = function() {
      arguments[2] = unwrap(arguments[2]);
      return wrap(originalCreateDocument.apply(unsafeUnwrap(this), arguments));
    };
    function wrapImplMethod(constructor, name) {
      var original = document.implementation[name];
      constructor.prototype[name] = function() {
        return wrap(original.apply(unsafeUnwrap(this), arguments));
      };
    }
    function forwardImplMethod(constructor, name) {
      var original = document.implementation[name];
      constructor.prototype[name] = function() {
        return original.apply(unsafeUnwrap(this), arguments);
      };
    }
    wrapImplMethod(DOMImplementation, "createDocumentType");
    wrapImplMethod(DOMImplementation, "createHTMLDocument");
    forwardImplMethod(DOMImplementation, "hasFeature");
    registerWrapper(window.DOMImplementation, DOMImplementation);
    forwardMethodsToWrapper([ window.DOMImplementation ], [ "createDocument", "createDocumentType", "createHTMLDocument", "hasFeature" ]);
    scope.adoptNodeNoRemove = adoptNodeNoRemove;
    scope.wrappers.DOMImplementation = DOMImplementation;
    scope.wrappers.Document = Document;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var EventTarget = scope.wrappers.EventTarget;
    var Selection = scope.wrappers.Selection;
    var mixin = scope.mixin;
    var registerWrapper = scope.registerWrapper;
    var renderAllPending = scope.renderAllPending;
    var unwrap = scope.unwrap;
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var wrap = scope.wrap;
    var OriginalWindow = window.Window;
    var originalGetComputedStyle = window.getComputedStyle;
    var originalGetDefaultComputedStyle = window.getDefaultComputedStyle;
    var originalGetSelection = window.getSelection;
    function Window(impl) {
      EventTarget.call(this, impl);
    }
    Window.prototype = Object.create(EventTarget.prototype);
    OriginalWindow.prototype.getComputedStyle = function(el, pseudo) {
      return wrap(this || window).getComputedStyle(unwrapIfNeeded(el), pseudo);
    };
    if (originalGetDefaultComputedStyle) {
      OriginalWindow.prototype.getDefaultComputedStyle = function(el, pseudo) {
        return wrap(this || window).getDefaultComputedStyle(unwrapIfNeeded(el), pseudo);
      };
    }
    OriginalWindow.prototype.getSelection = function() {
      return wrap(this || window).getSelection();
    };
    delete window.getComputedStyle;
    delete window.getDefaultComputedStyle;
    delete window.getSelection;
    [ "addEventListener", "removeEventListener", "dispatchEvent" ].forEach(function(name) {
      OriginalWindow.prototype[name] = function() {
        var w = wrap(this || window);
        return w[name].apply(w, arguments);
      };
      delete window[name];
    });
    mixin(Window.prototype, {
      getComputedStyle: function(el, pseudo) {
        renderAllPending();
        return originalGetComputedStyle.call(unwrap(this), unwrapIfNeeded(el), pseudo);
      },
      getSelection: function() {
        renderAllPending();
        return new Selection(originalGetSelection.call(unwrap(this)));
      },
      get document() {
        return wrap(unwrap(this).document);
      }
    });
    if (originalGetDefaultComputedStyle) {
      Window.prototype.getDefaultComputedStyle = function(el, pseudo) {
        renderAllPending();
        return originalGetDefaultComputedStyle.call(unwrap(this), unwrapIfNeeded(el), pseudo);
      };
    }
    registerWrapper(OriginalWindow, Window, window);
    scope.wrappers.Window = Window;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var unwrap = scope.unwrap;
    var OriginalDataTransfer = window.DataTransfer || window.Clipboard;
    var OriginalDataTransferSetDragImage = OriginalDataTransfer.prototype.setDragImage;
    if (OriginalDataTransferSetDragImage) {
      OriginalDataTransfer.prototype.setDragImage = function(image, x, y) {
        OriginalDataTransferSetDragImage.call(this, unwrap(image), x, y);
      };
    }
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var registerWrapper = scope.registerWrapper;
    var setWrapper = scope.setWrapper;
    var unwrap = scope.unwrap;
    var OriginalFormData = window.FormData;
    if (!OriginalFormData) return;
    function FormData(formElement) {
      var impl;
      if (formElement instanceof OriginalFormData) {
        impl = formElement;
      } else {
        impl = new OriginalFormData(formElement && unwrap(formElement));
      }
      setWrapper(impl, this);
    }
    registerWrapper(OriginalFormData, FormData, new OriginalFormData());
    scope.wrappers.FormData = FormData;
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var unwrapIfNeeded = scope.unwrapIfNeeded;
    var originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(obj) {
      return originalSend.call(this, unwrapIfNeeded(obj));
    };
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    "use strict";
    var isWrapperFor = scope.isWrapperFor;
    var elements = {
      a: "HTMLAnchorElement",
      area: "HTMLAreaElement",
      audio: "HTMLAudioElement",
      base: "HTMLBaseElement",
      body: "HTMLBodyElement",
      br: "HTMLBRElement",
      button: "HTMLButtonElement",
      canvas: "HTMLCanvasElement",
      caption: "HTMLTableCaptionElement",
      col: "HTMLTableColElement",
      content: "HTMLContentElement",
      data: "HTMLDataElement",
      datalist: "HTMLDataListElement",
      del: "HTMLModElement",
      dir: "HTMLDirectoryElement",
      div: "HTMLDivElement",
      dl: "HTMLDListElement",
      embed: "HTMLEmbedElement",
      fieldset: "HTMLFieldSetElement",
      font: "HTMLFontElement",
      form: "HTMLFormElement",
      frame: "HTMLFrameElement",
      frameset: "HTMLFrameSetElement",
      h1: "HTMLHeadingElement",
      head: "HTMLHeadElement",
      hr: "HTMLHRElement",
      html: "HTMLHtmlElement",
      iframe: "HTMLIFrameElement",
      img: "HTMLImageElement",
      input: "HTMLInputElement",
      keygen: "HTMLKeygenElement",
      label: "HTMLLabelElement",
      legend: "HTMLLegendElement",
      li: "HTMLLIElement",
      link: "HTMLLinkElement",
      map: "HTMLMapElement",
      marquee: "HTMLMarqueeElement",
      menu: "HTMLMenuElement",
      menuitem: "HTMLMenuItemElement",
      meta: "HTMLMetaElement",
      meter: "HTMLMeterElement",
      object: "HTMLObjectElement",
      ol: "HTMLOListElement",
      optgroup: "HTMLOptGroupElement",
      option: "HTMLOptionElement",
      output: "HTMLOutputElement",
      p: "HTMLParagraphElement",
      param: "HTMLParamElement",
      pre: "HTMLPreElement",
      progress: "HTMLProgressElement",
      q: "HTMLQuoteElement",
      script: "HTMLScriptElement",
      select: "HTMLSelectElement",
      shadow: "HTMLShadowElement",
      source: "HTMLSourceElement",
      span: "HTMLSpanElement",
      style: "HTMLStyleElement",
      table: "HTMLTableElement",
      tbody: "HTMLTableSectionElement",
      template: "HTMLTemplateElement",
      textarea: "HTMLTextAreaElement",
      thead: "HTMLTableSectionElement",
      time: "HTMLTimeElement",
      title: "HTMLTitleElement",
      tr: "HTMLTableRowElement",
      track: "HTMLTrackElement",
      ul: "HTMLUListElement",
      video: "HTMLVideoElement"
    };
    function overrideConstructor(tagName) {
      var nativeConstructorName = elements[tagName];
      var nativeConstructor = window[nativeConstructorName];
      if (!nativeConstructor) return;
      var element = document.createElement(tagName);
      var wrapperConstructor = element.constructor;
      window[nativeConstructorName] = wrapperConstructor;
    }
    Object.keys(elements).forEach(overrideConstructor);
    Object.getOwnPropertyNames(scope.wrappers).forEach(function(name) {
      window[name] = scope.wrappers[name];
    });
  })(window.ShadowDOMPolyfill);
  (function(scope) {
    var ShadowCSS = {
      strictStyling: false,
      registry: {},
      shimStyling: function(root, name, extendsName) {
        var scopeStyles = this.prepareRoot(root, name, extendsName);
        var typeExtension = this.isTypeExtension(extendsName);
        var scopeSelector = this.makeScopeSelector(name, typeExtension);
        var cssText = stylesToCssText(scopeStyles, true);
        cssText = this.scopeCssText(cssText, scopeSelector);
        if (root) {
          root.shimmedStyle = cssText;
        }
        this.addCssToDocument(cssText, name);
      },
      shimStyle: function(style, selector) {
        return this.shimCssText(style.textContent, selector);
      },
      shimCssText: function(cssText, selector) {
        cssText = this.insertDirectives(cssText);
        return this.scopeCssText(cssText, selector);
      },
      makeScopeSelector: function(name, typeExtension) {
        if (name) {
          return typeExtension ? "[is=" + name + "]" : name;
        }
        return "";
      },
      isTypeExtension: function(extendsName) {
        return extendsName && extendsName.indexOf("-") < 0;
      },
      prepareRoot: function(root, name, extendsName) {
        var def = this.registerRoot(root, name, extendsName);
        this.replaceTextInStyles(def.rootStyles, this.insertDirectives);
        this.removeStyles(root, def.rootStyles);
        if (this.strictStyling) {
          this.applyScopeToContent(root, name);
        }
        return def.scopeStyles;
      },
      removeStyles: function(root, styles) {
        for (var i = 0, l = styles.length, s; i < l && (s = styles[i]); i++) {
          s.parentNode.removeChild(s);
        }
      },
      registerRoot: function(root, name, extendsName) {
        var def = this.registry[name] = {
          root: root,
          name: name,
          extendsName: extendsName
        };
        var styles = this.findStyles(root);
        def.rootStyles = styles;
        def.scopeStyles = def.rootStyles;
        var extendee = this.registry[def.extendsName];
        if (extendee) {
          def.scopeStyles = extendee.scopeStyles.concat(def.scopeStyles);
        }
        return def;
      },
      findStyles: function(root) {
        if (!root) {
          return [];
        }
        var styles = root.querySelectorAll("style");
        return Array.prototype.filter.call(styles, function(s) {
          return !s.hasAttribute(NO_SHIM_ATTRIBUTE);
        });
      },
      applyScopeToContent: function(root, name) {
        if (root) {
          Array.prototype.forEach.call(root.querySelectorAll("*"), function(node) {
            node.setAttribute(name, "");
          });
          Array.prototype.forEach.call(root.querySelectorAll("template"), function(template) {
            this.applyScopeToContent(template.content, name);
          }, this);
        }
      },
      insertDirectives: function(cssText) {
        cssText = this.insertPolyfillDirectivesInCssText(cssText);
        return this.insertPolyfillRulesInCssText(cssText);
      },
      insertPolyfillDirectivesInCssText: function(cssText) {
        cssText = cssText.replace(cssCommentNextSelectorRe, function(match, p1) {
          return p1.slice(0, -2) + "{";
        });
        return cssText.replace(cssContentNextSelectorRe, function(match, p1) {
          return p1 + " {";
        });
      },
      insertPolyfillRulesInCssText: function(cssText) {
        cssText = cssText.replace(cssCommentRuleRe, function(match, p1) {
          return p1.slice(0, -1);
        });
        return cssText.replace(cssContentRuleRe, function(match, p1, p2, p3) {
          var rule = match.replace(p1, "").replace(p2, "");
          return p3 + rule;
        });
      },
      scopeCssText: function(cssText, scopeSelector) {
        var unscoped = this.extractUnscopedRulesFromCssText(cssText);
        cssText = this.insertPolyfillHostInCssText(cssText);
        cssText = this.convertColonHost(cssText);
        cssText = this.convertColonHostContext(cssText);
        cssText = this.convertShadowDOMSelectors(cssText);
        if (scopeSelector) {
          var self = this, cssText;
          withCssRules(cssText, function(rules) {
            cssText = self.scopeRules(rules, scopeSelector);
          });
        }
        cssText = cssText + "\n" + unscoped;
        return cssText.trim();
      },
      extractUnscopedRulesFromCssText: function(cssText) {
        var r = "", m;
        while (m = cssCommentUnscopedRuleRe.exec(cssText)) {
          r += m[1].slice(0, -1) + "\n\n";
        }
        while (m = cssContentUnscopedRuleRe.exec(cssText)) {
          r += m[0].replace(m[2], "").replace(m[1], m[3]) + "\n\n";
        }
        return r;
      },
      convertColonHost: function(cssText) {
        return this.convertColonRule(cssText, cssColonHostRe, this.colonHostPartReplacer);
      },
      convertColonHostContext: function(cssText) {
        return this.convertColonRule(cssText, cssColonHostContextRe, this.colonHostContextPartReplacer);
      },
      convertColonRule: function(cssText, regExp, partReplacer) {
        return cssText.replace(regExp, function(m, p1, p2, p3) {
          p1 = polyfillHostNoCombinator;
          if (p2) {
            var parts = p2.split(","), r = [];
            for (var i = 0, l = parts.length, p; i < l && (p = parts[i]); i++) {
              p = p.trim();
              r.push(partReplacer(p1, p, p3));
            }
            return r.join(",");
          } else {
            return p1 + p3;
          }
        });
      },
      colonHostContextPartReplacer: function(host, part, suffix) {
        if (part.match(polyfillHost)) {
          return this.colonHostPartReplacer(host, part, suffix);
        } else {
          return host + part + suffix + ", " + part + " " + host + suffix;
        }
      },
      colonHostPartReplacer: function(host, part, suffix) {
        return host + part.replace(polyfillHost, "") + suffix;
      },
      convertShadowDOMSelectors: function(cssText) {
        for (var i = 0; i < shadowDOMSelectorsRe.length; i++) {
          cssText = cssText.replace(shadowDOMSelectorsRe[i], " ");
        }
        return cssText;
      },
      scopeRules: function(cssRules, scopeSelector) {
        var cssText = "";
        if (cssRules) {
          Array.prototype.forEach.call(cssRules, function(rule) {
            if (rule.selectorText && (rule.style && rule.style.cssText !== undefined)) {
              cssText += this.scopeSelector(rule.selectorText, scopeSelector, this.strictStyling) + " {\n	";
              cssText += this.propertiesFromRule(rule) + "\n}\n\n";
            } else if (rule.type === CSSRule.MEDIA_RULE) {
              cssText += "@media " + rule.media.mediaText + " {\n";
              cssText += this.scopeRules(rule.cssRules, scopeSelector);
              cssText += "\n}\n\n";
            } else {
              try {
                if (rule.cssText) {
                  cssText += rule.cssText + "\n\n";
                }
              } catch (x) {
                if (rule.type === CSSRule.KEYFRAMES_RULE && rule.cssRules) {
                  cssText += this.ieSafeCssTextFromKeyFrameRule(rule);
                }
              }
            }
          }, this);
        }
        return cssText;
      },
      ieSafeCssTextFromKeyFrameRule: function(rule) {
        var cssText = "@keyframes " + rule.name + " {";
        Array.prototype.forEach.call(rule.cssRules, function(rule) {
          cssText += " " + rule.keyText + " {" + rule.style.cssText + "}";
        });
        cssText += " }";
        return cssText;
      },
      scopeSelector: function(selector, scopeSelector, strict) {
        var r = [], parts = selector.split(",");
        parts.forEach(function(p) {
          p = p.trim();
          if (this.selectorNeedsScoping(p, scopeSelector)) {
            p = strict && !p.match(polyfillHostNoCombinator) ? this.applyStrictSelectorScope(p, scopeSelector) : this.applySelectorScope(p, scopeSelector);
          }
          r.push(p);
        }, this);
        return r.join(", ");
      },
      selectorNeedsScoping: function(selector, scopeSelector) {
        if (Array.isArray(scopeSelector)) {
          return true;
        }
        var re = this.makeScopeMatcher(scopeSelector);
        return !selector.match(re);
      },
      makeScopeMatcher: function(scopeSelector) {
        scopeSelector = scopeSelector.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
        return new RegExp("^(" + scopeSelector + ")" + selectorReSuffix, "m");
      },
      applySelectorScope: function(selector, selectorScope) {
        return Array.isArray(selectorScope) ? this.applySelectorScopeList(selector, selectorScope) : this.applySimpleSelectorScope(selector, selectorScope);
      },
      applySelectorScopeList: function(selector, scopeSelectorList) {
        var r = [];
        for (var i = 0, s; s = scopeSelectorList[i]; i++) {
          r.push(this.applySimpleSelectorScope(selector, s));
        }
        return r.join(", ");
      },
      applySimpleSelectorScope: function(selector, scopeSelector) {
        if (selector.match(polyfillHostRe)) {
          selector = selector.replace(polyfillHostNoCombinator, scopeSelector);
          return selector.replace(polyfillHostRe, scopeSelector + " ");
        } else {
          return scopeSelector + " " + selector;
        }
      },
      applyStrictSelectorScope: function(selector, scopeSelector) {
        scopeSelector = scopeSelector.replace(/\[is=([^\]]*)\]/g, "$1");
        var splits = [ " ", ">", "+", "~" ], scoped = selector, attrName = "[" + scopeSelector + "]";
        splits.forEach(function(sep) {
          var parts = scoped.split(sep);
          scoped = parts.map(function(p) {
            var t = p.trim().replace(polyfillHostRe, "");
            if (t && splits.indexOf(t) < 0 && t.indexOf(attrName) < 0) {
              p = t.replace(/([^:]*)(:*)(.*)/, "$1" + attrName + "$2$3");
            }
            return p;
          }).join(sep);
        });
        return scoped;
      },
      insertPolyfillHostInCssText: function(selector) {
        return selector.replace(colonHostContextRe, polyfillHostContext).replace(colonHostRe, polyfillHost);
      },
      propertiesFromRule: function(rule) {
        var cssText = rule.style.cssText;
        if (rule.style.content && !rule.style.content.match(/['"]+|attr/)) {
          cssText = cssText.replace(/content:[^;]*;/g, "content: '" + rule.style.content + "';");
        }
        var style = rule.style;
        for (var i in style) {
          if (style[i] === "initial") {
            cssText += i + ": initial; ";
          }
        }
        return cssText;
      },
      replaceTextInStyles: function(styles, action) {
        if (styles && action) {
          if (!(styles instanceof Array)) {
            styles = [ styles ];
          }
          Array.prototype.forEach.call(styles, function(s) {
            s.textContent = action.call(this, s.textContent);
          }, this);
        }
      },
      addCssToDocument: function(cssText, name) {
        if (cssText.match("@import")) {
          addOwnSheet(cssText, name);
        } else {
          addCssToDocument(cssText);
        }
      }
    };
    var selectorRe = /([^{]*)({[\s\S]*?})/gim, cssCommentRe = /\/\*[^*]*\*+([^\/*][^*]*\*+)*\//gim, cssCommentNextSelectorRe = /\/\*\s*@polyfill ([^*]*\*+([^\/*][^*]*\*+)*\/)([^{]*?){/gim, cssContentNextSelectorRe = /polyfill-next-selector[^}]*content\:[\s]*?['"](.*?)['"][;\s]*}([^{]*?){/gim, cssCommentRuleRe = /\/\*\s@polyfill-rule([^*]*\*+([^\/*][^*]*\*+)*)\//gim, cssContentRuleRe = /(polyfill-rule)[^}]*(content\:[\s]*['"](.*?)['"])[;\s]*[^}]*}/gim, cssCommentUnscopedRuleRe = /\/\*\s@polyfill-unscoped-rule([^*]*\*+([^\/*][^*]*\*+)*)\//gim, cssContentUnscopedRuleRe = /(polyfill-unscoped-rule)[^}]*(content\:[\s]*['"](.*?)['"])[;\s]*[^}]*}/gim, cssPseudoRe = /::(x-[^\s{,(]*)/gim, cssPartRe = /::part\(([^)]*)\)/gim, polyfillHost = "-shadowcsshost", polyfillHostContext = "-shadowcsscontext", parenSuffix = ")(?:\\((" + "(?:\\([^)(]*\\)|[^)(]*)+?" + ")\\))?([^,{]*)";
    var cssColonHostRe = new RegExp("(" + polyfillHost + parenSuffix, "gim"), cssColonHostContextRe = new RegExp("(" + polyfillHostContext + parenSuffix, "gim"), selectorReSuffix = "([>\\s~+[.,{:][\\s\\S]*)?$", colonHostRe = /\:host/gim, colonHostContextRe = /\:host-context/gim, polyfillHostNoCombinator = polyfillHost + "-no-combinator", polyfillHostRe = new RegExp(polyfillHost, "gim"), polyfillHostContextRe = new RegExp(polyfillHostContext, "gim"), shadowDOMSelectorsRe = [ />>>/g, /::shadow/g, /::content/g, /\/deep\//g, /\/shadow\//g, /\/shadow-deep\//g, /\^\^/g, /\^/g ];
    function stylesToCssText(styles, preserveComments) {
      var cssText = "";
      Array.prototype.forEach.call(styles, function(s) {
        cssText += s.textContent + "\n\n";
      });
      if (!preserveComments) {
        cssText = cssText.replace(cssCommentRe, "");
      }
      return cssText;
    }
    function cssTextToStyle(cssText) {
      var style = document.createElement("style");
      style.textContent = cssText;
      return style;
    }
    function cssToRules(cssText) {
      var style = cssTextToStyle(cssText);
      document.head.appendChild(style);
      var rules = [];
      if (style.sheet) {
        try {
          rules = style.sheet.cssRules;
        } catch (e) {}
      } else {
        console.warn("sheet not found", style);
      }
      style.parentNode.removeChild(style);
      return rules;
    }
    var frame = document.createElement("iframe");
    frame.style.display = "none";
    function initFrame() {
      frame.initialized = true;
      document.body.appendChild(frame);
      var doc = frame.contentDocument;
      var base = doc.createElement("base");
      base.href = document.baseURI;
      doc.head.appendChild(base);
    }
    function inFrame(fn) {
      if (!frame.initialized) {
        initFrame();
      }
      document.body.appendChild(frame);
      fn(frame.contentDocument);
      document.body.removeChild(frame);
    }
    var isChrome = navigator.userAgent.match("Chrome");
    function withCssRules(cssText, callback) {
      if (!callback) {
        return;
      }
      var rules;
      if (cssText.match("@import") && isChrome) {
        var style = cssTextToStyle(cssText);
        inFrame(function(doc) {
          doc.head.appendChild(style.impl);
          rules = Array.prototype.slice.call(style.sheet.cssRules, 0);
          callback(rules);
        });
      } else {
        rules = cssToRules(cssText);
        callback(rules);
      }
    }
    function rulesToCss(cssRules) {
      for (var i = 0, css = []; i < cssRules.length; i++) {
        css.push(cssRules[i].cssText);
      }
      return css.join("\n\n");
    }
    function addCssToDocument(cssText) {
      if (cssText) {
        getSheet().appendChild(document.createTextNode(cssText));
      }
    }
    function addOwnSheet(cssText, name) {
      var style = cssTextToStyle(cssText);
      style.setAttribute(name, "");
      style.setAttribute(SHIMMED_ATTRIBUTE, "");
      document.head.appendChild(style);
    }
    var SHIM_ATTRIBUTE = "shim-shadowdom";
    var SHIMMED_ATTRIBUTE = "shim-shadowdom-css";
    var NO_SHIM_ATTRIBUTE = "no-shim";
    var sheet;
    function getSheet() {
      if (!sheet) {
        sheet = document.createElement("style");
        sheet.setAttribute(SHIMMED_ATTRIBUTE, "");
        sheet[SHIMMED_ATTRIBUTE] = true;
      }
      return sheet;
    }
    if (window.ShadowDOMPolyfill) {
      addCssToDocument("style { display: none !important; }\n");
      var doc = ShadowDOMPolyfill.wrap(document);
      var head = doc.querySelector("head");
      head.insertBefore(getSheet(), head.childNodes[0]);
      document.addEventListener("DOMContentLoaded", function() {
        var urlResolver = scope.urlResolver;
        if (window.HTMLImports && !HTMLImports.useNative) {
          var SHIM_SHEET_SELECTOR = "link[rel=stylesheet]" + "[" + SHIM_ATTRIBUTE + "]";
          var SHIM_STYLE_SELECTOR = "style[" + SHIM_ATTRIBUTE + "]";
          HTMLImports.importer.documentPreloadSelectors += "," + SHIM_SHEET_SELECTOR;
          HTMLImports.importer.importsPreloadSelectors += "," + SHIM_SHEET_SELECTOR;
          HTMLImports.parser.documentSelectors = [ HTMLImports.parser.documentSelectors, SHIM_SHEET_SELECTOR, SHIM_STYLE_SELECTOR ].join(",");
          var originalParseGeneric = HTMLImports.parser.parseGeneric;
          HTMLImports.parser.parseGeneric = function(elt) {
            if (elt[SHIMMED_ATTRIBUTE]) {
              return;
            }
            var style = elt.__importElement || elt;
            if (!style.hasAttribute(SHIM_ATTRIBUTE)) {
              originalParseGeneric.call(this, elt);
              return;
            }
            if (elt.__resource) {
              style = elt.ownerDocument.createElement("style");
              style.textContent = elt.__resource;
            }
            HTMLImports.path.resolveUrlsInStyle(style, elt.href);
            style.textContent = ShadowCSS.shimStyle(style);
            style.removeAttribute(SHIM_ATTRIBUTE, "");
            style.setAttribute(SHIMMED_ATTRIBUTE, "");
            style[SHIMMED_ATTRIBUTE] = true;
            if (style.parentNode !== head) {
              if (elt.parentNode === head) {
                head.replaceChild(style, elt);
              } else {
                this.addElementToDocument(style);
              }
            }
            style.__importParsed = true;
            this.markParsingComplete(elt);
            this.parseNext();
          };
          var hasResource = HTMLImports.parser.hasResource;
          HTMLImports.parser.hasResource = function(node) {
            if (node.localName === "link" && node.rel === "stylesheet" && node.hasAttribute(SHIM_ATTRIBUTE)) {
              return node.__resource;
            } else {
              return hasResource.call(this, node);
            }
          };
        }
      });
    }
    scope.ShadowCSS = ShadowCSS;
  })(window.WebComponents);
}

(function(scope) {
  if (window.ShadowDOMPolyfill) {
    window.wrap = ShadowDOMPolyfill.wrapIfNeeded;
    window.unwrap = ShadowDOMPolyfill.unwrapIfNeeded;
  } else {
    window.wrap = window.unwrap = function(n) {
      return n;
    };
  }
})(window.WebComponents);

(function(scope) {
  "use strict";
  var hasWorkingUrl = false;
  if (!scope.forceJURL) {
    try {
      var u = new URL("b", "http://a");
      u.pathname = "c%20d";
      hasWorkingUrl = u.href === "http://a/c%20d";
    } catch (e) {}
  }
  if (hasWorkingUrl) return;
  var relative = Object.create(null);
  relative["ftp"] = 21;
  relative["file"] = 0;
  relative["gopher"] = 70;
  relative["http"] = 80;
  relative["https"] = 443;
  relative["ws"] = 80;
  relative["wss"] = 443;
  var relativePathDotMapping = Object.create(null);
  relativePathDotMapping["%2e"] = ".";
  relativePathDotMapping[".%2e"] = "..";
  relativePathDotMapping["%2e."] = "..";
  relativePathDotMapping["%2e%2e"] = "..";
  function isRelativeScheme(scheme) {
    return relative[scheme] !== undefined;
  }
  function invalid() {
    clear.call(this);
    this._isInvalid = true;
  }
  function IDNAToASCII(h) {
    if ("" == h) {
      invalid.call(this);
    }
    return h.toLowerCase();
  }
  function percentEscape(c) {
    var unicode = c.charCodeAt(0);
    if (unicode > 32 && unicode < 127 && [ 34, 35, 60, 62, 63, 96 ].indexOf(unicode) == -1) {
      return c;
    }
    return encodeURIComponent(c);
  }
  function percentEscapeQuery(c) {
    var unicode = c.charCodeAt(0);
    if (unicode > 32 && unicode < 127 && [ 34, 35, 60, 62, 96 ].indexOf(unicode) == -1) {
      return c;
    }
    return encodeURIComponent(c);
  }
  var EOF = undefined, ALPHA = /[a-zA-Z]/, ALPHANUMERIC = /[a-zA-Z0-9\+\-\.]/;
  function parse(input, stateOverride, base) {
    function err(message) {
      errors.push(message);
    }
    var state = stateOverride || "scheme start", cursor = 0, buffer = "", seenAt = false, seenBracket = false, errors = [];
    loop: while ((input[cursor - 1] != EOF || cursor == 0) && !this._isInvalid) {
      var c = input[cursor];
      switch (state) {
       case "scheme start":
        if (c && ALPHA.test(c)) {
          buffer += c.toLowerCase();
          state = "scheme";
        } else if (!stateOverride) {
          buffer = "";
          state = "no scheme";
          continue;
        } else {
          err("Invalid scheme.");
          break loop;
        }
        break;

       case "scheme":
        if (c && ALPHANUMERIC.test(c)) {
          buffer += c.toLowerCase();
        } else if (":" == c) {
          this._scheme = buffer;
          buffer = "";
          if (stateOverride) {
            break loop;
          }
          if (isRelativeScheme(this._scheme)) {
            this._isRelative = true;
          }
          if ("file" == this._scheme) {
            state = "relative";
          } else if (this._isRelative && base && base._scheme == this._scheme) {
            state = "relative or authority";
          } else if (this._isRelative) {
            state = "authority first slash";
          } else {
            state = "scheme data";
          }
        } else if (!stateOverride) {
          buffer = "";
          cursor = 0;
          state = "no scheme";
          continue;
        } else if (EOF == c) {
          break loop;
        } else {
          err("Code point not allowed in scheme: " + c);
          break loop;
        }
        break;

       case "scheme data":
        if ("?" == c) {
          this._query = "?";
          state = "query";
        } else if ("#" == c) {
          this._fragment = "#";
          state = "fragment";
        } else {
          if (EOF != c && "	" != c && "\n" != c && "\r" != c) {
            this._schemeData += percentEscape(c);
          }
        }
        break;

       case "no scheme":
        if (!base || !isRelativeScheme(base._scheme)) {
          err("Missing scheme.");
          invalid.call(this);
        } else {
          state = "relative";
          continue;
        }
        break;

       case "relative or authority":
        if ("/" == c && "/" == input[cursor + 1]) {
          state = "authority ignore slashes";
        } else {
          err("Expected /, got: " + c);
          state = "relative";
          continue;
        }
        break;

       case "relative":
        this._isRelative = true;
        if ("file" != this._scheme) this._scheme = base._scheme;
        if (EOF == c) {
          this._host = base._host;
          this._port = base._port;
          this._path = base._path.slice();
          this._query = base._query;
          this._username = base._username;
          this._password = base._password;
          break loop;
        } else if ("/" == c || "\\" == c) {
          if ("\\" == c) err("\\ is an invalid code point.");
          state = "relative slash";
        } else if ("?" == c) {
          this._host = base._host;
          this._port = base._port;
          this._path = base._path.slice();
          this._query = "?";
          this._username = base._username;
          this._password = base._password;
          state = "query";
        } else if ("#" == c) {
          this._host = base._host;
          this._port = base._port;
          this._path = base._path.slice();
          this._query = base._query;
          this._fragment = "#";
          this._username = base._username;
          this._password = base._password;
          state = "fragment";
        } else {
          var nextC = input[cursor + 1];
          var nextNextC = input[cursor + 2];
          if ("file" != this._scheme || !ALPHA.test(c) || nextC != ":" && nextC != "|" || EOF != nextNextC && "/" != nextNextC && "\\" != nextNextC && "?" != nextNextC && "#" != nextNextC) {
            this._host = base._host;
            this._port = base._port;
            this._username = base._username;
            this._password = base._password;
            this._path = base._path.slice();
            this._path.pop();
          }
          state = "relative path";
          continue;
        }
        break;

       case "relative slash":
        if ("/" == c || "\\" == c) {
          if ("\\" == c) {
            err("\\ is an invalid code point.");
          }
          if ("file" == this._scheme) {
            state = "file host";
          } else {
            state = "authority ignore slashes";
          }
        } else {
          if ("file" != this._scheme) {
            this._host = base._host;
            this._port = base._port;
            this._username = base._username;
            this._password = base._password;
          }
          state = "relative path";
          continue;
        }
        break;

       case "authority first slash":
        if ("/" == c) {
          state = "authority second slash";
        } else {
          err("Expected '/', got: " + c);
          state = "authority ignore slashes";
          continue;
        }
        break;

       case "authority second slash":
        state = "authority ignore slashes";
        if ("/" != c) {
          err("Expected '/', got: " + c);
          continue;
        }
        break;

       case "authority ignore slashes":
        if ("/" != c && "\\" != c) {
          state = "authority";
          continue;
        } else {
          err("Expected authority, got: " + c);
        }
        break;

       case "authority":
        if ("@" == c) {
          if (seenAt) {
            err("@ already seen.");
            buffer += "%40";
          }
          seenAt = true;
          for (var i = 0; i < buffer.length; i++) {
            var cp = buffer[i];
            if ("	" == cp || "\n" == cp || "\r" == cp) {
              err("Invalid whitespace in authority.");
              continue;
            }
            if (":" == cp && null === this._password) {
              this._password = "";
              continue;
            }
            var tempC = percentEscape(cp);
            null !== this._password ? this._password += tempC : this._username += tempC;
          }
          buffer = "";
        } else if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c) {
          cursor -= buffer.length;
          buffer = "";
          state = "host";
          continue;
        } else {
          buffer += c;
        }
        break;

       case "file host":
        if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c) {
          if (buffer.length == 2 && ALPHA.test(buffer[0]) && (buffer[1] == ":" || buffer[1] == "|")) {
            state = "relative path";
          } else if (buffer.length == 0) {
            state = "relative path start";
          } else {
            this._host = IDNAToASCII.call(this, buffer);
            buffer = "";
            state = "relative path start";
          }
          continue;
        } else if ("	" == c || "\n" == c || "\r" == c) {
          err("Invalid whitespace in file host.");
        } else {
          buffer += c;
        }
        break;

       case "host":
       case "hostname":
        if (":" == c && !seenBracket) {
          this._host = IDNAToASCII.call(this, buffer);
          buffer = "";
          state = "port";
          if ("hostname" == stateOverride) {
            break loop;
          }
        } else if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c) {
          this._host = IDNAToASCII.call(this, buffer);
          buffer = "";
          state = "relative path start";
          if (stateOverride) {
            break loop;
          }
          continue;
        } else if ("	" != c && "\n" != c && "\r" != c) {
          if ("[" == c) {
            seenBracket = true;
          } else if ("]" == c) {
            seenBracket = false;
          }
          buffer += c;
        } else {
          err("Invalid code point in host/hostname: " + c);
        }
        break;

       case "port":
        if (/[0-9]/.test(c)) {
          buffer += c;
        } else if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c || stateOverride) {
          if ("" != buffer) {
            var temp = parseInt(buffer, 10);
            if (temp != relative[this._scheme]) {
              this._port = temp + "";
            }
            buffer = "";
          }
          if (stateOverride) {
            break loop;
          }
          state = "relative path start";
          continue;
        } else if ("	" == c || "\n" == c || "\r" == c) {
          err("Invalid code point in port: " + c);
        } else {
          invalid.call(this);
        }
        break;

       case "relative path start":
        if ("\\" == c) err("'\\' not allowed in path.");
        state = "relative path";
        if ("/" != c && "\\" != c) {
          continue;
        }
        break;

       case "relative path":
        if (EOF == c || "/" == c || "\\" == c || !stateOverride && ("?" == c || "#" == c)) {
          if ("\\" == c) {
            err("\\ not allowed in relative path.");
          }
          var tmp;
          if (tmp = relativePathDotMapping[buffer.toLowerCase()]) {
            buffer = tmp;
          }
          if (".." == buffer) {
            this._path.pop();
            if ("/" != c && "\\" != c) {
              this._path.push("");
            }
          } else if ("." == buffer && "/" != c && "\\" != c) {
            this._path.push("");
          } else if ("." != buffer) {
            if ("file" == this._scheme && this._path.length == 0 && buffer.length == 2 && ALPHA.test(buffer[0]) && buffer[1] == "|") {
              buffer = buffer[0] + ":";
            }
            this._path.push(buffer);
          }
          buffer = "";
          if ("?" == c) {
            this._query = "?";
            state = "query";
          } else if ("#" == c) {
            this._fragment = "#";
            state = "fragment";
          }
        } else if ("	" != c && "\n" != c && "\r" != c) {
          buffer += percentEscape(c);
        }
        break;

       case "query":
        if (!stateOverride && "#" == c) {
          this._fragment = "#";
          state = "fragment";
        } else if (EOF != c && "	" != c && "\n" != c && "\r" != c) {
          this._query += percentEscapeQuery(c);
        }
        break;

       case "fragment":
        if (EOF != c && "	" != c && "\n" != c && "\r" != c) {
          this._fragment += c;
        }
        break;
      }
      cursor++;
    }
  }
  function clear() {
    this._scheme = "";
    this._schemeData = "";
    this._username = "";
    this._password = null;
    this._host = "";
    this._port = "";
    this._path = [];
    this._query = "";
    this._fragment = "";
    this._isInvalid = false;
    this._isRelative = false;
  }
  function jURL(url, base) {
    if (base !== undefined && !(base instanceof jURL)) base = new jURL(String(base));
    this._url = url;
    clear.call(this);
    var input = url.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, "");
    parse.call(this, input, null, base);
  }
  jURL.prototype = {
    toString: function() {
      return this.href;
    },
    get href() {
      if (this._isInvalid) return this._url;
      var authority = "";
      if ("" != this._username || null != this._password) {
        authority = this._username + (null != this._password ? ":" + this._password : "") + "@";
      }
      return this.protocol + (this._isRelative ? "//" + authority + this.host : "") + this.pathname + this._query + this._fragment;
    },
    set href(href) {
      clear.call(this);
      parse.call(this, href);
    },
    get protocol() {
      return this._scheme + ":";
    },
    set protocol(protocol) {
      if (this._isInvalid) return;
      parse.call(this, protocol + ":", "scheme start");
    },
    get host() {
      return this._isInvalid ? "" : this._port ? this._host + ":" + this._port : this._host;
    },
    set host(host) {
      if (this._isInvalid || !this._isRelative) return;
      parse.call(this, host, "host");
    },
    get hostname() {
      return this._host;
    },
    set hostname(hostname) {
      if (this._isInvalid || !this._isRelative) return;
      parse.call(this, hostname, "hostname");
    },
    get port() {
      return this._port;
    },
    set port(port) {
      if (this._isInvalid || !this._isRelative) return;
      parse.call(this, port, "port");
    },
    get pathname() {
      return this._isInvalid ? "" : this._isRelative ? "/" + this._path.join("/") : this._schemeData;
    },
    set pathname(pathname) {
      if (this._isInvalid || !this._isRelative) return;
      this._path = [];
      parse.call(this, pathname, "relative path start");
    },
    get search() {
      return this._isInvalid || !this._query || "?" == this._query ? "" : this._query;
    },
    set search(search) {
      if (this._isInvalid || !this._isRelative) return;
      this._query = "?";
      if ("?" == search[0]) search = search.slice(1);
      parse.call(this, search, "query");
    },
    get hash() {
      return this._isInvalid || !this._fragment || "#" == this._fragment ? "" : this._fragment;
    },
    set hash(hash) {
      if (this._isInvalid) return;
      this._fragment = "#";
      if ("#" == hash[0]) hash = hash.slice(1);
      parse.call(this, hash, "fragment");
    },
    get origin() {
      var host;
      if (this._isInvalid || !this._scheme) {
        return "";
      }
      switch (this._scheme) {
       case "data":
       case "file":
       case "javascript":
       case "mailto":
        return "null";
      }
      host = this.host;
      if (!host) {
        return "";
      }
      return this._scheme + "://" + host;
    }
  };
  var OriginalURL = scope.URL;
  if (OriginalURL) {
    jURL.createObjectURL = function(blob) {
      return OriginalURL.createObjectURL.apply(OriginalURL, arguments);
    };
    jURL.revokeObjectURL = function(url) {
      OriginalURL.revokeObjectURL(url);
    };
  }
  scope.URL = jURL;
})(self);

(function(global) {
  if (global.JsMutationObserver) {
    return;
  }
  var registrationsTable = new WeakMap();
  var setImmediate;
  if (/Trident|Edge/.test(navigator.userAgent)) {
    setImmediate = setTimeout;
  } else if (window.setImmediate) {
    setImmediate = window.setImmediate;
  } else {
    var setImmediateQueue = [];
    var sentinel = String(Math.random());
    window.addEventListener("message", function(e) {
      if (e.data === sentinel) {
        var queue = setImmediateQueue;
        setImmediateQueue = [];
        queue.forEach(function(func) {
          func();
        });
      }
    });
    setImmediate = function(func) {
      setImmediateQueue.push(func);
      window.postMessage(sentinel, "*");
    };
  }
  var isScheduled = false;
  var scheduledObservers = [];
  function scheduleCallback(observer) {
    scheduledObservers.push(observer);
    if (!isScheduled) {
      isScheduled = true;
      setImmediate(dispatchCallbacks);
    }
  }
  function wrapIfNeeded(node) {
    return window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(node) || node;
  }
  function dispatchCallbacks() {
    isScheduled = false;
    var observers = scheduledObservers;
    scheduledObservers = [];
    observers.sort(function(o1, o2) {
      return o1.uid_ - o2.uid_;
    });
    var anyNonEmpty = false;
    observers.forEach(function(observer) {
      var queue = observer.takeRecords();
      removeTransientObserversFor(observer);
      if (queue.length) {
        observer.callback_(queue, observer);
        anyNonEmpty = true;
      }
    });
    if (anyNonEmpty) dispatchCallbacks();
  }
  function removeTransientObserversFor(observer) {
    observer.nodes_.forEach(function(node) {
      var registrations = registrationsTable.get(node);
      if (!registrations) return;
      registrations.forEach(function(registration) {
        if (registration.observer === observer) registration.removeTransientObservers();
      });
    });
  }
  function forEachAncestorAndObserverEnqueueRecord(target, callback) {
    for (var node = target; node; node = node.parentNode) {
      var registrations = registrationsTable.get(node);
      if (registrations) {
        for (var j = 0; j < registrations.length; j++) {
          var registration = registrations[j];
          var options = registration.options;
          if (node !== target && !options.subtree) continue;
          var record = callback(options);
          if (record) registration.enqueue(record);
        }
      }
    }
  }
  var uidCounter = 0;
  function JsMutationObserver(callback) {
    this.callback_ = callback;
    this.nodes_ = [];
    this.records_ = [];
    this.uid_ = ++uidCounter;
  }
  JsMutationObserver.prototype = {
    observe: function(target, options) {
      target = wrapIfNeeded(target);
      if (!options.childList && !options.attributes && !options.characterData || options.attributeOldValue && !options.attributes || options.attributeFilter && options.attributeFilter.length && !options.attributes || options.characterDataOldValue && !options.characterData) {
        throw new SyntaxError();
      }
      var registrations = registrationsTable.get(target);
      if (!registrations) registrationsTable.set(target, registrations = []);
      var registration;
      for (var i = 0; i < registrations.length; i++) {
        if (registrations[i].observer === this) {
          registration = registrations[i];
          registration.removeListeners();
          registration.options = options;
          break;
        }
      }
      if (!registration) {
        registration = new Registration(this, target, options);
        registrations.push(registration);
        this.nodes_.push(target);
      }
      registration.addListeners();
    },
    disconnect: function() {
      this.nodes_.forEach(function(node) {
        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          var registration = registrations[i];
          if (registration.observer === this) {
            registration.removeListeners();
            registrations.splice(i, 1);
            break;
          }
        }
      }, this);
      this.records_ = [];
    },
    takeRecords: function() {
      var copyOfRecords = this.records_;
      this.records_ = [];
      return copyOfRecords;
    }
  };
  function MutationRecord(type, target) {
    this.type = type;
    this.target = target;
    this.addedNodes = [];
    this.removedNodes = [];
    this.previousSibling = null;
    this.nextSibling = null;
    this.attributeName = null;
    this.attributeNamespace = null;
    this.oldValue = null;
  }
  function copyMutationRecord(original) {
    var record = new MutationRecord(original.type, original.target);
    record.addedNodes = original.addedNodes.slice();
    record.removedNodes = original.removedNodes.slice();
    record.previousSibling = original.previousSibling;
    record.nextSibling = original.nextSibling;
    record.attributeName = original.attributeName;
    record.attributeNamespace = original.attributeNamespace;
    record.oldValue = original.oldValue;
    return record;
  }
  var currentRecord, recordWithOldValue;
  function getRecord(type, target) {
    return currentRecord = new MutationRecord(type, target);
  }
  function getRecordWithOldValue(oldValue) {
    if (recordWithOldValue) return recordWithOldValue;
    recordWithOldValue = copyMutationRecord(currentRecord);
    recordWithOldValue.oldValue = oldValue;
    return recordWithOldValue;
  }
  function clearRecords() {
    currentRecord = recordWithOldValue = undefined;
  }
  function recordRepresentsCurrentMutation(record) {
    return record === recordWithOldValue || record === currentRecord;
  }
  function selectRecord(lastRecord, newRecord) {
    if (lastRecord === newRecord) return lastRecord;
    if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord)) return recordWithOldValue;
    return null;
  }
  function Registration(observer, target, options) {
    this.observer = observer;
    this.target = target;
    this.options = options;
    this.transientObservedNodes = [];
  }
  Registration.prototype = {
    enqueue: function(record) {
      var records = this.observer.records_;
      var length = records.length;
      if (records.length > 0) {
        var lastRecord = records[length - 1];
        var recordToReplaceLast = selectRecord(lastRecord, record);
        if (recordToReplaceLast) {
          records[length - 1] = recordToReplaceLast;
          return;
        }
      } else {
        scheduleCallback(this.observer);
      }
      records[length] = record;
    },
    addListeners: function() {
      this.addListeners_(this.target);
    },
    addListeners_: function(node) {
      var options = this.options;
      if (options.attributes) node.addEventListener("DOMAttrModified", this, true);
      if (options.characterData) node.addEventListener("DOMCharacterDataModified", this, true);
      if (options.childList) node.addEventListener("DOMNodeInserted", this, true);
      if (options.childList || options.subtree) node.addEventListener("DOMNodeRemoved", this, true);
    },
    removeListeners: function() {
      this.removeListeners_(this.target);
    },
    removeListeners_: function(node) {
      var options = this.options;
      if (options.attributes) node.removeEventListener("DOMAttrModified", this, true);
      if (options.characterData) node.removeEventListener("DOMCharacterDataModified", this, true);
      if (options.childList) node.removeEventListener("DOMNodeInserted", this, true);
      if (options.childList || options.subtree) node.removeEventListener("DOMNodeRemoved", this, true);
    },
    addTransientObserver: function(node) {
      if (node === this.target) return;
      this.addListeners_(node);
      this.transientObservedNodes.push(node);
      var registrations = registrationsTable.get(node);
      if (!registrations) registrationsTable.set(node, registrations = []);
      registrations.push(this);
    },
    removeTransientObservers: function() {
      var transientObservedNodes = this.transientObservedNodes;
      this.transientObservedNodes = [];
      transientObservedNodes.forEach(function(node) {
        this.removeListeners_(node);
        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          if (registrations[i] === this) {
            registrations.splice(i, 1);
            break;
          }
        }
      }, this);
    },
    handleEvent: function(e) {
      e.stopImmediatePropagation();
      switch (e.type) {
       case "DOMAttrModified":
        var name = e.attrName;
        var namespace = e.relatedNode.namespaceURI;
        var target = e.target;
        var record = new getRecord("attributes", target);
        record.attributeName = name;
        record.attributeNamespace = namespace;
        var oldValue = e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
        forEachAncestorAndObserverEnqueueRecord(target, function(options) {
          if (!options.attributes) return;
          if (options.attributeFilter && options.attributeFilter.length && options.attributeFilter.indexOf(name) === -1 && options.attributeFilter.indexOf(namespace) === -1) {
            return;
          }
          if (options.attributeOldValue) return getRecordWithOldValue(oldValue);
          return record;
        });
        break;

       case "DOMCharacterDataModified":
        var target = e.target;
        var record = getRecord("characterData", target);
        var oldValue = e.prevValue;
        forEachAncestorAndObserverEnqueueRecord(target, function(options) {
          if (!options.characterData) return;
          if (options.characterDataOldValue) return getRecordWithOldValue(oldValue);
          return record;
        });
        break;

       case "DOMNodeRemoved":
        this.addTransientObserver(e.target);

       case "DOMNodeInserted":
        var changedNode = e.target;
        var addedNodes, removedNodes;
        if (e.type === "DOMNodeInserted") {
          addedNodes = [ changedNode ];
          removedNodes = [];
        } else {
          addedNodes = [];
          removedNodes = [ changedNode ];
        }
        var previousSibling = changedNode.previousSibling;
        var nextSibling = changedNode.nextSibling;
        var record = getRecord("childList", e.target.parentNode);
        record.addedNodes = addedNodes;
        record.removedNodes = removedNodes;
        record.previousSibling = previousSibling;
        record.nextSibling = nextSibling;
        forEachAncestorAndObserverEnqueueRecord(e.relatedNode, function(options) {
          if (!options.childList) return;
          return record;
        });
      }
      clearRecords();
    }
  };
  global.JsMutationObserver = JsMutationObserver;
  if (!global.MutationObserver) {
    global.MutationObserver = JsMutationObserver;
    JsMutationObserver._isPolyfilled = true;
  }
})(self);

(function(scope) {
  "use strict";
  if (!window.performance) {
    var start = Date.now();
    window.performance = {
      now: function() {
        return Date.now() - start;
      }
    };
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function() {
      var nativeRaf = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
      return nativeRaf ? function(callback) {
        return nativeRaf(function() {
          callback(performance.now());
        });
      } : function(callback) {
        return window.setTimeout(callback, 1e3 / 60);
      };
    }();
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function() {
      return window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function(id) {
        clearTimeout(id);
      };
    }();
  }
  var workingDefaultPrevented = function() {
    var e = document.createEvent("Event");
    e.initEvent("foo", true, true);
    e.preventDefault();
    return e.defaultPrevented;
  }();
  if (!workingDefaultPrevented) {
    var origPreventDefault = Event.prototype.preventDefault;
    Event.prototype.preventDefault = function() {
      if (!this.cancelable) {
        return;
      }
      origPreventDefault.call(this);
      Object.defineProperty(this, "defaultPrevented", {
        get: function() {
          return true;
        },
        configurable: true
      });
    };
  }
  var isIE = /Trident/.test(navigator.userAgent);
  if (!window.CustomEvent || isIE && typeof window.CustomEvent !== "function") {
    window.CustomEvent = function(inType, params) {
      params = params || {};
      var e = document.createEvent("CustomEvent");
      e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
      return e;
    };
    window.CustomEvent.prototype = window.Event.prototype;
  }
  if (!window.Event || isIE && typeof window.Event !== "function") {
    var origEvent = window.Event;
    window.Event = function(inType, params) {
      params = params || {};
      var e = document.createEvent("Event");
      e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
      return e;
    };
    window.Event.prototype = origEvent.prototype;
  }
})(window.WebComponents);

window.HTMLImports = window.HTMLImports || {
  flags: {}
};

(function(scope) {
  var IMPORT_LINK_TYPE = "import";
  var useNative = Boolean(IMPORT_LINK_TYPE in document.createElement("link"));
  var hasShadowDOMPolyfill = Boolean(window.ShadowDOMPolyfill);
  var wrap = function(node) {
    return hasShadowDOMPolyfill ? window.ShadowDOMPolyfill.wrapIfNeeded(node) : node;
  };
  var rootDocument = wrap(document);
  var currentScriptDescriptor = {
    get: function() {
      var script = window.HTMLImports.currentScript || document.currentScript || (document.readyState !== "complete" ? document.scripts[document.scripts.length - 1] : null);
      return wrap(script);
    },
    configurable: true
  };
  Object.defineProperty(document, "_currentScript", currentScriptDescriptor);
  Object.defineProperty(rootDocument, "_currentScript", currentScriptDescriptor);
  var isIE = /Trident/.test(navigator.userAgent);
  function whenReady(callback, doc) {
    doc = doc || rootDocument;
    whenDocumentReady(function() {
      watchImportsLoad(callback, doc);
    }, doc);
  }
  var requiredReadyState = isIE ? "complete" : "interactive";
  var READY_EVENT = "readystatechange";
  function isDocumentReady(doc) {
    return doc.readyState === "complete" || doc.readyState === requiredReadyState;
  }
  function whenDocumentReady(callback, doc) {
    if (!isDocumentReady(doc)) {
      var checkReady = function() {
        if (doc.readyState === "complete" || doc.readyState === requiredReadyState) {
          doc.removeEventListener(READY_EVENT, checkReady);
          whenDocumentReady(callback, doc);
        }
      };
      doc.addEventListener(READY_EVENT, checkReady);
    } else if (callback) {
      callback();
    }
  }
  function markTargetLoaded(event) {
    event.target.__loaded = true;
  }
  function watchImportsLoad(callback, doc) {
    var imports = doc.querySelectorAll("link[rel=import]");
    var parsedCount = 0, importCount = imports.length, newImports = [], errorImports = [];
    function checkDone() {
      if (parsedCount == importCount && callback) {
        callback({
          allImports: imports,
          loadedImports: newImports,
          errorImports: errorImports
        });
      }
    }
    function loadedImport(e) {
      markTargetLoaded(e);
      newImports.push(this);
      parsedCount++;
      checkDone();
    }
    function errorLoadingImport(e) {
      errorImports.push(this);
      parsedCount++;
      checkDone();
    }
    if (importCount) {
      for (var i = 0, imp; i < importCount && (imp = imports[i]); i++) {
        if (isImportLoaded(imp)) {
          newImports.push(this);
          parsedCount++;
          checkDone();
        } else {
          imp.addEventListener("load", loadedImport);
          imp.addEventListener("error", errorLoadingImport);
        }
      }
    } else {
      checkDone();
    }
  }
  function isImportLoaded(link) {
    return useNative ? link.__loaded || link.import && link.import.readyState !== "loading" : link.__importParsed;
  }
  if (useNative) {
    new MutationObserver(function(mxns) {
      for (var i = 0, l = mxns.length, m; i < l && (m = mxns[i]); i++) {
        if (m.addedNodes) {
          handleImports(m.addedNodes);
        }
      }
    }).observe(document.head, {
      childList: true
    });
    function handleImports(nodes) {
      for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
        if (isImport(n)) {
          handleImport(n);
        }
      }
    }
    function isImport(element) {
      return element.localName === "link" && element.rel === "import";
    }
    function handleImport(element) {
      var loaded = element.import;
      if (loaded) {
        markTargetLoaded({
          target: element
        });
      } else {
        element.addEventListener("load", markTargetLoaded);
        element.addEventListener("error", markTargetLoaded);
      }
    }
    (function() {
      if (document.readyState === "loading") {
        var imports = document.querySelectorAll("link[rel=import]");
        for (var i = 0, l = imports.length, imp; i < l && (imp = imports[i]); i++) {
          handleImport(imp);
        }
      }
    })();
  }
  whenReady(function(detail) {
    window.HTMLImports.ready = true;
    window.HTMLImports.readyTime = new Date().getTime();
    var evt = rootDocument.createEvent("CustomEvent");
    evt.initCustomEvent("HTMLImportsLoaded", true, true, detail);
    rootDocument.dispatchEvent(evt);
  });
  scope.IMPORT_LINK_TYPE = IMPORT_LINK_TYPE;
  scope.useNative = useNative;
  scope.rootDocument = rootDocument;
  scope.whenReady = whenReady;
  scope.isIE = isIE;
})(window.HTMLImports);

(function(scope) {
  var modules = [];
  var addModule = function(module) {
    modules.push(module);
  };
  var initializeModules = function() {
    modules.forEach(function(module) {
      module(scope);
    });
  };
  scope.addModule = addModule;
  scope.initializeModules = initializeModules;
})(window.HTMLImports);

window.HTMLImports.addModule(function(scope) {
  var CSS_URL_REGEXP = /(url\()([^)]*)(\))/g;
  var CSS_IMPORT_REGEXP = /(@import[\s]+(?!url\())([^;]*)(;)/g;
  var path = {
    resolveUrlsInStyle: function(style, linkUrl) {
      var doc = style.ownerDocument;
      var resolver = doc.createElement("a");
      style.textContent = this.resolveUrlsInCssText(style.textContent, linkUrl, resolver);
      return style;
    },
    resolveUrlsInCssText: function(cssText, linkUrl, urlObj) {
      var r = this.replaceUrls(cssText, urlObj, linkUrl, CSS_URL_REGEXP);
      r = this.replaceUrls(r, urlObj, linkUrl, CSS_IMPORT_REGEXP);
      return r;
    },
    replaceUrls: function(text, urlObj, linkUrl, regexp) {
      return text.replace(regexp, function(m, pre, url, post) {
        var urlPath = url.replace(/["']/g, "");
        if (linkUrl) {
          urlPath = new URL(urlPath, linkUrl).href;
        }
        urlObj.href = urlPath;
        urlPath = urlObj.href;
        return pre + "'" + urlPath + "'" + post;
      });
    }
  };
  scope.path = path;
});

window.HTMLImports.addModule(function(scope) {
  var xhr = {
    async: true,
    ok: function(request) {
      return request.status >= 200 && request.status < 300 || request.status === 304 || request.status === 0;
    },
    load: function(url, next, nextContext) {
      var request = new XMLHttpRequest();
      if (scope.flags.debug || scope.flags.bust) {
        url += "?" + Math.random();
      }
      request.open("GET", url, xhr.async);
      request.addEventListener("readystatechange", function(e) {
        if (request.readyState === 4) {
          var redirectedUrl = null;
          try {
            var locationHeader = request.getResponseHeader("Location");
            if (locationHeader) {
              redirectedUrl = locationHeader.substr(0, 1) === "/" ? location.origin + locationHeader : locationHeader;
            }
          } catch (e) {
            console.error(e.message);
          }
          next.call(nextContext, !xhr.ok(request) && request, request.response || request.responseText, redirectedUrl);
        }
      });
      request.send();
      return request;
    },
    loadDocument: function(url, next, nextContext) {
      this.load(url, next, nextContext).responseType = "document";
    }
  };
  scope.xhr = xhr;
});

window.HTMLImports.addModule(function(scope) {
  var xhr = scope.xhr;
  var flags = scope.flags;
  var Loader = function(onLoad, onComplete) {
    this.cache = {};
    this.onload = onLoad;
    this.oncomplete = onComplete;
    this.inflight = 0;
    this.pending = {};
  };
  Loader.prototype = {
    addNodes: function(nodes) {
      this.inflight += nodes.length;
      for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
        this.require(n);
      }
      this.checkDone();
    },
    addNode: function(node) {
      this.inflight++;
      this.require(node);
      this.checkDone();
    },
    require: function(elt) {
      var url = elt.src || elt.href;
      elt.__nodeUrl = url;
      if (!this.dedupe(url, elt)) {
        this.fetch(url, elt);
      }
    },
    dedupe: function(url, elt) {
      if (this.pending[url]) {
        this.pending[url].push(elt);
        return true;
      }
      var resource;
      if (this.cache[url]) {
        this.onload(url, elt, this.cache[url]);
        this.tail();
        return true;
      }
      this.pending[url] = [ elt ];
      return false;
    },
    fetch: function(url, elt) {
      flags.load && console.log("fetch", url, elt);
      if (!url) {
        setTimeout(function() {
          this.receive(url, elt, {
            error: "href must be specified"
          }, null);
        }.bind(this), 0);
      } else if (url.match(/^data:/)) {
        var pieces = url.split(",");
        var header = pieces[0];
        var body = pieces[1];
        if (header.indexOf(";base64") > -1) {
          body = atob(body);
        } else {
          body = decodeURIComponent(body);
        }
        setTimeout(function() {
          this.receive(url, elt, null, body);
        }.bind(this), 0);
      } else {
        var receiveXhr = function(err, resource, redirectedUrl) {
          this.receive(url, elt, err, resource, redirectedUrl);
        }.bind(this);
        xhr.load(url, receiveXhr);
      }
    },
    receive: function(url, elt, err, resource, redirectedUrl) {
      this.cache[url] = resource;
      var $p = this.pending[url];
      for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
        this.onload(url, p, resource, err, redirectedUrl);
        this.tail();
      }
      this.pending[url] = null;
    },
    tail: function() {
      --this.inflight;
      this.checkDone();
    },
    checkDone: function() {
      if (!this.inflight) {
        this.oncomplete();
      }
    }
  };
  scope.Loader = Loader;
});

window.HTMLImports.addModule(function(scope) {
  var Observer = function(addCallback) {
    this.addCallback = addCallback;
    this.mo = new MutationObserver(this.handler.bind(this));
  };
  Observer.prototype = {
    handler: function(mutations) {
      for (var i = 0, l = mutations.length, m; i < l && (m = mutations[i]); i++) {
        if (m.type === "childList" && m.addedNodes.length) {
          this.addedNodes(m.addedNodes);
        }
      }
    },
    addedNodes: function(nodes) {
      if (this.addCallback) {
        this.addCallback(nodes);
      }
      for (var i = 0, l = nodes.length, n, loading; i < l && (n = nodes[i]); i++) {
        if (n.children && n.children.length) {
          this.addedNodes(n.children);
        }
      }
    },
    observe: function(root) {
      this.mo.observe(root, {
        childList: true,
        subtree: true
      });
    }
  };
  scope.Observer = Observer;
});

window.HTMLImports.addModule(function(scope) {
  var path = scope.path;
  var rootDocument = scope.rootDocument;
  var flags = scope.flags;
  var isIE = scope.isIE;
  var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
  var IMPORT_SELECTOR = "link[rel=" + IMPORT_LINK_TYPE + "]";
  var importParser = {
    documentSelectors: IMPORT_SELECTOR,
    importsSelectors: [ IMPORT_SELECTOR, "link[rel=stylesheet]:not([type])", "style:not([type])", "script:not([type])", 'script[type="application/javascript"]', 'script[type="text/javascript"]' ].join(","),
    map: {
      link: "parseLink",
      script: "parseScript",
      style: "parseStyle"
    },
    dynamicElements: [],
    parseNext: function() {
      var next = this.nextToParse();
      if (next) {
        this.parse(next);
      }
    },
    parse: function(elt) {
      if (this.isParsed(elt)) {
        flags.parse && console.log("[%s] is already parsed", elt.localName);
        return;
      }
      var fn = this[this.map[elt.localName]];
      if (fn) {
        this.markParsing(elt);
        fn.call(this, elt);
      }
    },
    parseDynamic: function(elt, quiet) {
      this.dynamicElements.push(elt);
      if (!quiet) {
        this.parseNext();
      }
    },
    markParsing: function(elt) {
      flags.parse && console.log("parsing", elt);
      this.parsingElement = elt;
    },
    markParsingComplete: function(elt) {
      elt.__importParsed = true;
      this.markDynamicParsingComplete(elt);
      if (elt.__importElement) {
        elt.__importElement.__importParsed = true;
        this.markDynamicParsingComplete(elt.__importElement);
      }
      this.parsingElement = null;
      flags.parse && console.log("completed", elt);
    },
    markDynamicParsingComplete: function(elt) {
      var i = this.dynamicElements.indexOf(elt);
      if (i >= 0) {
        this.dynamicElements.splice(i, 1);
      }
    },
    parseImport: function(elt) {
      elt.import = elt.__doc;
      if (window.HTMLImports.__importsParsingHook) {
        window.HTMLImports.__importsParsingHook(elt);
      }
      if (elt.import) {
        elt.import.__importParsed = true;
      }
      this.markParsingComplete(elt);
      if (elt.__resource && !elt.__error) {
        elt.dispatchEvent(new CustomEvent("load", {
          bubbles: false
        }));
      } else {
        elt.dispatchEvent(new CustomEvent("error", {
          bubbles: false
        }));
      }
      if (elt.__pending) {
        var fn;
        while (elt.__pending.length) {
          fn = elt.__pending.shift();
          if (fn) {
            fn({
              target: elt
            });
          }
        }
      }
      this.parseNext();
    },
    parseLink: function(linkElt) {
      if (nodeIsImport(linkElt)) {
        this.parseImport(linkElt);
      } else {
        linkElt.href = linkElt.href;
        this.parseGeneric(linkElt);
      }
    },
    parseStyle: function(elt) {
      var src = elt;
      elt = cloneStyle(elt);
      src.__appliedElement = elt;
      elt.__importElement = src;
      this.parseGeneric(elt);
    },
    parseGeneric: function(elt) {
      this.trackElement(elt);
      this.addElementToDocument(elt);
    },
    rootImportForElement: function(elt) {
      var n = elt;
      while (n.ownerDocument.__importLink) {
        n = n.ownerDocument.__importLink;
      }
      return n;
    },
    addElementToDocument: function(elt) {
      var port = this.rootImportForElement(elt.__importElement || elt);
      port.parentNode.insertBefore(elt, port);
    },
    trackElement: function(elt, callback) {
      var self = this;
      var done = function(e) {
        elt.removeEventListener("load", done);
        elt.removeEventListener("error", done);
        if (callback) {
          callback(e);
        }
        self.markParsingComplete(elt);
        self.parseNext();
      };
      elt.addEventListener("load", done);
      elt.addEventListener("error", done);
      if (isIE && elt.localName === "style") {
        var fakeLoad = false;
        if (elt.textContent.indexOf("@import") == -1) {
          fakeLoad = true;
        } else if (elt.sheet) {
          fakeLoad = true;
          var csr = elt.sheet.cssRules;
          var len = csr ? csr.length : 0;
          for (var i = 0, r; i < len && (r = csr[i]); i++) {
            if (r.type === CSSRule.IMPORT_RULE) {
              fakeLoad = fakeLoad && Boolean(r.styleSheet);
            }
          }
        }
        if (fakeLoad) {
          setTimeout(function() {
            elt.dispatchEvent(new CustomEvent("load", {
              bubbles: false
            }));
          });
        }
      }
    },
    parseScript: function(scriptElt) {
      var script = document.createElement("script");
      script.__importElement = scriptElt;
      script.src = scriptElt.src ? scriptElt.src : generateScriptDataUrl(scriptElt);
      scope.currentScript = scriptElt;
      this.trackElement(script, function(e) {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        scope.currentScript = null;
      });
      this.addElementToDocument(script);
    },
    nextToParse: function() {
      this._mayParse = [];
      return !this.parsingElement && (this.nextToParseInDoc(rootDocument) || this.nextToParseDynamic());
    },
    nextToParseInDoc: function(doc, link) {
      if (doc && this._mayParse.indexOf(doc) < 0) {
        this._mayParse.push(doc);
        var nodes = doc.querySelectorAll(this.parseSelectorsForNode(doc));
        for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
          if (!this.isParsed(n)) {
            if (this.hasResource(n)) {
              return nodeIsImport(n) ? this.nextToParseInDoc(n.__doc, n) : n;
            } else {
              return;
            }
          }
        }
      }
      return link;
    },
    nextToParseDynamic: function() {
      return this.dynamicElements[0];
    },
    parseSelectorsForNode: function(node) {
      var doc = node.ownerDocument || node;
      return doc === rootDocument ? this.documentSelectors : this.importsSelectors;
    },
    isParsed: function(node) {
      return node.__importParsed;
    },
    needsDynamicParsing: function(elt) {
      return this.dynamicElements.indexOf(elt) >= 0;
    },
    hasResource: function(node) {
      if (nodeIsImport(node) && node.__doc === undefined) {
        return false;
      }
      return true;
    }
  };
  function nodeIsImport(elt) {
    return elt.localName === "link" && elt.rel === IMPORT_LINK_TYPE;
  }
  function generateScriptDataUrl(script) {
    var scriptContent = generateScriptContent(script);
    return "data:text/javascript;charset=utf-8," + encodeURIComponent(scriptContent);
  }
  function generateScriptContent(script) {
    return script.textContent + generateSourceMapHint(script);
  }
  function generateSourceMapHint(script) {
    var owner = script.ownerDocument;
    owner.__importedScripts = owner.__importedScripts || 0;
    var moniker = script.ownerDocument.baseURI;
    var num = owner.__importedScripts ? "-" + owner.__importedScripts : "";
    owner.__importedScripts++;
    return "\n//# sourceURL=" + moniker + num + ".js\n";
  }
  function cloneStyle(style) {
    var clone = style.ownerDocument.createElement("style");
    clone.textContent = style.textContent;
    path.resolveUrlsInStyle(clone);
    return clone;
  }
  scope.parser = importParser;
  scope.IMPORT_SELECTOR = IMPORT_SELECTOR;
});

window.HTMLImports.addModule(function(scope) {
  var flags = scope.flags;
  var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
  var IMPORT_SELECTOR = scope.IMPORT_SELECTOR;
  var rootDocument = scope.rootDocument;
  var Loader = scope.Loader;
  var Observer = scope.Observer;
  var parser = scope.parser;
  var importer = {
    documents: {},
    documentPreloadSelectors: IMPORT_SELECTOR,
    importsPreloadSelectors: [ IMPORT_SELECTOR ].join(","),
    loadNode: function(node) {
      importLoader.addNode(node);
    },
    loadSubtree: function(parent) {
      var nodes = this.marshalNodes(parent);
      importLoader.addNodes(nodes);
    },
    marshalNodes: function(parent) {
      return parent.querySelectorAll(this.loadSelectorsForNode(parent));
    },
    loadSelectorsForNode: function(node) {
      var doc = node.ownerDocument || node;
      return doc === rootDocument ? this.documentPreloadSelectors : this.importsPreloadSelectors;
    },
    loaded: function(url, elt, resource, err, redirectedUrl) {
      flags.load && console.log("loaded", url, elt);
      elt.__resource = resource;
      elt.__error = err;
      if (isImportLink(elt)) {
        var doc = this.documents[url];
        if (doc === undefined) {
          doc = err ? null : makeDocument(resource, redirectedUrl || url);
          if (doc) {
            doc.__importLink = elt;
            this.bootDocument(doc);
          }
          this.documents[url] = doc;
        }
        elt.__doc = doc;
      }
      parser.parseNext();
    },
    bootDocument: function(doc) {
      this.loadSubtree(doc);
      this.observer.observe(doc);
      parser.parseNext();
    },
    loadedAll: function() {
      parser.parseNext();
    }
  };
  var importLoader = new Loader(importer.loaded.bind(importer), importer.loadedAll.bind(importer));
  importer.observer = new Observer();
  function isImportLink(elt) {
    return isLinkRel(elt, IMPORT_LINK_TYPE);
  }
  function isLinkRel(elt, rel) {
    return elt.localName === "link" && elt.getAttribute("rel") === rel;
  }
  function hasBaseURIAccessor(doc) {
    return !!Object.getOwnPropertyDescriptor(doc, "baseURI");
  }
  function makeDocument(resource, url) {
    var doc = document.implementation.createHTMLDocument(IMPORT_LINK_TYPE);
    doc._URL = url;
    var base = doc.createElement("base");
    base.setAttribute("href", url);
    if (!doc.baseURI && !hasBaseURIAccessor(doc)) {
      Object.defineProperty(doc, "baseURI", {
        value: url
      });
    }
    var meta = doc.createElement("meta");
    meta.setAttribute("charset", "utf-8");
    doc.head.appendChild(meta);
    doc.head.appendChild(base);
    doc.body.innerHTML = resource;
    if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
      HTMLTemplateElement.bootstrap(doc);
    }
    return doc;
  }
  if (!document.baseURI) {
    var baseURIDescriptor = {
      get: function() {
        var base = document.querySelector("base");
        return base ? base.href : window.location.href;
      },
      configurable: true
    };
    Object.defineProperty(document, "baseURI", baseURIDescriptor);
    Object.defineProperty(rootDocument, "baseURI", baseURIDescriptor);
  }
  scope.importer = importer;
  scope.importLoader = importLoader;
});

window.HTMLImports.addModule(function(scope) {
  var parser = scope.parser;
  var importer = scope.importer;
  var dynamic = {
    added: function(nodes) {
      var owner, parsed, loading;
      for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
        if (!owner) {
          owner = n.ownerDocument;
          parsed = parser.isParsed(owner);
        }
        loading = this.shouldLoadNode(n);
        if (loading) {
          importer.loadNode(n);
        }
        if (this.shouldParseNode(n) && parsed) {
          parser.parseDynamic(n, loading);
        }
      }
    },
    shouldLoadNode: function(node) {
      return node.nodeType === 1 && matches.call(node, importer.loadSelectorsForNode(node));
    },
    shouldParseNode: function(node) {
      return node.nodeType === 1 && matches.call(node, parser.parseSelectorsForNode(node));
    }
  };
  importer.observer.addCallback = dynamic.added.bind(dynamic);
  var matches = HTMLElement.prototype.matches || HTMLElement.prototype.matchesSelector || HTMLElement.prototype.webkitMatchesSelector || HTMLElement.prototype.mozMatchesSelector || HTMLElement.prototype.msMatchesSelector;
});

(function(scope) {
  var initializeModules = scope.initializeModules;
  var isIE = scope.isIE;
  if (scope.useNative) {
    return;
  }
  initializeModules();
  var rootDocument = scope.rootDocument;
  function bootstrap() {
    window.HTMLImports.importer.bootDocument(rootDocument);
  }
  if (document.readyState === "complete" || document.readyState === "interactive" && !window.attachEvent) {
    bootstrap();
  } else {
    document.addEventListener("DOMContentLoaded", bootstrap);
  }
})(window.HTMLImports);

window.CustomElements = window.CustomElements || {
  flags: {}
};

(function(scope) {
  var flags = scope.flags;
  var modules = [];
  var addModule = function(module) {
    modules.push(module);
  };
  var initializeModules = function() {
    modules.forEach(function(module) {
      module(scope);
    });
  };
  scope.addModule = addModule;
  scope.initializeModules = initializeModules;
  scope.hasNative = Boolean(document.registerElement);
  scope.isIE = /Trident/.test(navigator.userAgent);
  scope.useNative = !flags.register && scope.hasNative && !window.ShadowDOMPolyfill && (!window.HTMLImports || window.HTMLImports.useNative);
})(window.CustomElements);

window.CustomElements.addModule(function(scope) {
  var IMPORT_LINK_TYPE = window.HTMLImports ? window.HTMLImports.IMPORT_LINK_TYPE : "none";
  function forSubtree(node, cb) {
    findAllElements(node, function(e) {
      if (cb(e)) {
        return true;
      }
      forRoots(e, cb);
    });
    forRoots(node, cb);
  }
  function findAllElements(node, find, data) {
    var e = node.firstElementChild;
    if (!e) {
      e = node.firstChild;
      while (e && e.nodeType !== Node.ELEMENT_NODE) {
        e = e.nextSibling;
      }
    }
    while (e) {
      if (find(e, data) !== true) {
        findAllElements(e, find, data);
      }
      e = e.nextElementSibling;
    }
    return null;
  }
  function forRoots(node, cb) {
    var root = node.shadowRoot;
    while (root) {
      forSubtree(root, cb);
      root = root.olderShadowRoot;
    }
  }
  function forDocumentTree(doc, cb) {
    _forDocumentTree(doc, cb, []);
  }
  function _forDocumentTree(doc, cb, processingDocuments) {
    doc = window.wrap(doc);
    if (processingDocuments.indexOf(doc) >= 0) {
      return;
    }
    processingDocuments.push(doc);
    var imports = doc.querySelectorAll("link[rel=" + IMPORT_LINK_TYPE + "]");
    for (var i = 0, l = imports.length, n; i < l && (n = imports[i]); i++) {
      if (n.import) {
        _forDocumentTree(n.import, cb, processingDocuments);
      }
    }
    cb(doc);
  }
  scope.forDocumentTree = forDocumentTree;
  scope.forSubtree = forSubtree;
});

window.CustomElements.addModule(function(scope) {
  var flags = scope.flags;
  var forSubtree = scope.forSubtree;
  var forDocumentTree = scope.forDocumentTree;
  function addedNode(node, isAttached) {
    return added(node, isAttached) || addedSubtree(node, isAttached);
  }
  function added(node, isAttached) {
    if (scope.upgrade(node, isAttached)) {
      return true;
    }
    if (isAttached) {
      attached(node);
    }
  }
  function addedSubtree(node, isAttached) {
    forSubtree(node, function(e) {
      if (added(e, isAttached)) {
        return true;
      }
    });
  }
  var hasThrottledAttached = window.MutationObserver._isPolyfilled && flags["throttle-attached"];
  scope.hasPolyfillMutations = hasThrottledAttached;
  scope.hasThrottledAttached = hasThrottledAttached;
  var isPendingMutations = false;
  var pendingMutations = [];
  function deferMutation(fn) {
    pendingMutations.push(fn);
    if (!isPendingMutations) {
      isPendingMutations = true;
      setTimeout(takeMutations);
    }
  }
  function takeMutations() {
    isPendingMutations = false;
    var $p = pendingMutations;
    for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
      p();
    }
    pendingMutations = [];
  }
  function attached(element) {
    if (hasThrottledAttached) {
      deferMutation(function() {
        _attached(element);
      });
    } else {
      _attached(element);
    }
  }
  function _attached(element) {
    if (element.__upgraded__ && !element.__attached) {
      element.__attached = true;
      if (element.attachedCallback) {
        element.attachedCallback();
      }
    }
  }
  function detachedNode(node) {
    detached(node);
    forSubtree(node, function(e) {
      detached(e);
    });
  }
  function detached(element) {
    if (hasThrottledAttached) {
      deferMutation(function() {
        _detached(element);
      });
    } else {
      _detached(element);
    }
  }
  function _detached(element) {
    if (element.__upgraded__ && element.__attached) {
      element.__attached = false;
      if (element.detachedCallback) {
        element.detachedCallback();
      }
    }
  }
  function inDocument(element) {
    var p = element;
    var doc = window.wrap(document);
    while (p) {
      if (p == doc) {
        return true;
      }
      p = p.parentNode || p.nodeType === Node.DOCUMENT_FRAGMENT_NODE && p.host;
    }
  }
  function watchShadow(node) {
    if (node.shadowRoot && !node.shadowRoot.__watched) {
      flags.dom && console.log("watching shadow-root for: ", node.localName);
      var root = node.shadowRoot;
      while (root) {
        observe(root);
        root = root.olderShadowRoot;
      }
    }
  }
  function handler(root, mutations) {
    if (flags.dom) {
      var mx = mutations[0];
      if (mx && mx.type === "childList" && mx.addedNodes) {
        if (mx.addedNodes) {
          var d = mx.addedNodes[0];
          while (d && d !== document && !d.host) {
            d = d.parentNode;
          }
          var u = d && (d.URL || d._URL || d.host && d.host.localName) || "";
          u = u.split("/?").shift().split("/").pop();
        }
      }
      console.group("mutations (%d) [%s]", mutations.length, u || "");
    }
    var isAttached = inDocument(root);
    mutations.forEach(function(mx) {
      if (mx.type === "childList") {
        forEach(mx.addedNodes, function(n) {
          if (!n.localName) {
            return;
          }
          addedNode(n, isAttached);
        });
        forEach(mx.removedNodes, function(n) {
          if (!n.localName) {
            return;
          }
          detachedNode(n);
        });
      }
    });
    flags.dom && console.groupEnd();
  }
  function takeRecords(node) {
    node = window.wrap(node);
    if (!node) {
      node = window.wrap(document);
    }
    while (node.parentNode) {
      node = node.parentNode;
    }
    var observer = node.__observer;
    if (observer) {
      handler(node, observer.takeRecords());
      takeMutations();
    }
  }
  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
  function observe(inRoot) {
    if (inRoot.__observer) {
      return;
    }
    var observer = new MutationObserver(handler.bind(this, inRoot));
    observer.observe(inRoot, {
      childList: true,
      subtree: true
    });
    inRoot.__observer = observer;
  }
  function upgradeDocument(doc) {
    doc = window.wrap(doc);
    flags.dom && console.group("upgradeDocument: ", doc.baseURI.split("/").pop());
    var isMainDocument = doc === window.wrap(document);
    addedNode(doc, isMainDocument);
    observe(doc);
    flags.dom && console.groupEnd();
  }
  function upgradeDocumentTree(doc) {
    forDocumentTree(doc, upgradeDocument);
  }
  var originalCreateShadowRoot = Element.prototype.createShadowRoot;
  if (originalCreateShadowRoot) {
    Element.prototype.createShadowRoot = function() {
      var root = originalCreateShadowRoot.call(this);
      window.CustomElements.watchShadow(this);
      return root;
    };
  }
  scope.watchShadow = watchShadow;
  scope.upgradeDocumentTree = upgradeDocumentTree;
  scope.upgradeDocument = upgradeDocument;
  scope.upgradeSubtree = addedSubtree;
  scope.upgradeAll = addedNode;
  scope.attached = attached;
  scope.takeRecords = takeRecords;
});

window.CustomElements.addModule(function(scope) {
  var flags = scope.flags;
  function upgrade(node, isAttached) {
    if (node.localName === "template") {
      if (window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
        HTMLTemplateElement.decorate(node);
      }
    }
    if (!node.__upgraded__ && node.nodeType === Node.ELEMENT_NODE) {
      var is = node.getAttribute("is");
      var definition = scope.getRegisteredDefinition(node.localName) || scope.getRegisteredDefinition(is);
      if (definition) {
        if (is && definition.tag == node.localName || !is && !definition.extends) {
          return upgradeWithDefinition(node, definition, isAttached);
        }
      }
    }
  }
  function upgradeWithDefinition(element, definition, isAttached) {
    flags.upgrade && console.group("upgrade:", element.localName);
    if (definition.is) {
      element.setAttribute("is", definition.is);
    }
    implementPrototype(element, definition);
    element.__upgraded__ = true;
    created(element);
    if (isAttached) {
      scope.attached(element);
    }
    scope.upgradeSubtree(element, isAttached);
    flags.upgrade && console.groupEnd();
    return element;
  }
  function implementPrototype(element, definition) {
    if (Object.__proto__) {
      element.__proto__ = definition.prototype;
    } else {
      customMixin(element, definition.prototype, definition.native);
      element.__proto__ = definition.prototype;
    }
  }
  function customMixin(inTarget, inSrc, inNative) {
    var used = {};
    var p = inSrc;
    while (p !== inNative && p !== HTMLElement.prototype) {
      var keys = Object.getOwnPropertyNames(p);
      for (var i = 0, k; k = keys[i]; i++) {
        if (!used[k]) {
          Object.defineProperty(inTarget, k, Object.getOwnPropertyDescriptor(p, k));
          used[k] = 1;
        }
      }
      p = Object.getPrototypeOf(p);
    }
  }
  function created(element) {
    if (element.createdCallback) {
      element.createdCallback();
    }
  }
  scope.upgrade = upgrade;
  scope.upgradeWithDefinition = upgradeWithDefinition;
  scope.implementPrototype = implementPrototype;
});

window.CustomElements.addModule(function(scope) {
  var isIE = scope.isIE;
  var upgradeDocumentTree = scope.upgradeDocumentTree;
  var upgradeAll = scope.upgradeAll;
  var upgradeWithDefinition = scope.upgradeWithDefinition;
  var implementPrototype = scope.implementPrototype;
  var useNative = scope.useNative;
  function register(name, options) {
    var definition = options || {};
    if (!name) {
      throw new Error("document.registerElement: first argument `name` must not be empty");
    }
    if (name.indexOf("-") < 0) {
      throw new Error("document.registerElement: first argument ('name') must contain a dash ('-'). Argument provided was '" + String(name) + "'.");
    }
    if (isReservedTag(name)) {
      throw new Error("Failed to execute 'registerElement' on 'Document': Registration failed for type '" + String(name) + "'. The type name is invalid.");
    }
    if (getRegisteredDefinition(name)) {
      throw new Error("DuplicateDefinitionError: a type with name '" + String(name) + "' is already registered");
    }
    if (!definition.prototype) {
      definition.prototype = Object.create(HTMLElement.prototype);
    }
    definition.__name = name.toLowerCase();
    if (definition.extends) {
      definition.extends = definition.extends.toLowerCase();
    }
    definition.lifecycle = definition.lifecycle || {};
    definition.ancestry = ancestry(definition.extends);
    resolveTagName(definition);
    resolvePrototypeChain(definition);
    overrideAttributeApi(definition.prototype);
    registerDefinition(definition.__name, definition);
    definition.ctor = generateConstructor(definition);
    definition.ctor.prototype = definition.prototype;
    definition.prototype.constructor = definition.ctor;
    if (scope.ready) {
      upgradeDocumentTree(document);
    }
    return definition.ctor;
  }
  function overrideAttributeApi(prototype) {
    if (prototype.setAttribute._polyfilled) {
      return;
    }
    var setAttribute = prototype.setAttribute;
    prototype.setAttribute = function(name, value) {
      changeAttribute.call(this, name, value, setAttribute);
    };
    var removeAttribute = prototype.removeAttribute;
    prototype.removeAttribute = function(name) {
      changeAttribute.call(this, name, null, removeAttribute);
    };
    prototype.setAttribute._polyfilled = true;
  }
  function changeAttribute(name, value, operation) {
    name = name.toLowerCase();
    var oldValue = this.getAttribute(name);
    operation.apply(this, arguments);
    var newValue = this.getAttribute(name);
    if (this.attributeChangedCallback && newValue !== oldValue) {
      this.attributeChangedCallback(name, oldValue, newValue);
    }
  }
  function isReservedTag(name) {
    for (var i = 0; i < reservedTagList.length; i++) {
      if (name === reservedTagList[i]) {
        return true;
      }
    }
  }
  var reservedTagList = [ "annotation-xml", "color-profile", "font-face", "font-face-src", "font-face-uri", "font-face-format", "font-face-name", "missing-glyph" ];
  function ancestry(extnds) {
    var extendee = getRegisteredDefinition(extnds);
    if (extendee) {
      return ancestry(extendee.extends).concat([ extendee ]);
    }
    return [];
  }
  function resolveTagName(definition) {
    var baseTag = definition.extends;
    for (var i = 0, a; a = definition.ancestry[i]; i++) {
      baseTag = a.is && a.tag;
    }
    definition.tag = baseTag || definition.__name;
    if (baseTag) {
      definition.is = definition.__name;
    }
  }
  function resolvePrototypeChain(definition) {
    if (!Object.__proto__) {
      var nativePrototype = HTMLElement.prototype;
      if (definition.is) {
        var inst = document.createElement(definition.tag);
        nativePrototype = Object.getPrototypeOf(inst);
      }
      var proto = definition.prototype, ancestor;
      var foundPrototype = false;
      while (proto) {
        if (proto == nativePrototype) {
          foundPrototype = true;
        }
        ancestor = Object.getPrototypeOf(proto);
        if (ancestor) {
          proto.__proto__ = ancestor;
        }
        proto = ancestor;
      }
      if (!foundPrototype) {
        console.warn(definition.tag + " prototype not found in prototype chain for " + definition.is);
      }
      definition.native = nativePrototype;
    }
  }
  function instantiate(definition) {
    return upgradeWithDefinition(domCreateElement(definition.tag), definition);
  }
  var registry = {};
  function getRegisteredDefinition(name) {
    if (name) {
      return registry[name.toLowerCase()];
    }
  }
  function registerDefinition(name, definition) {
    registry[name] = definition;
  }
  function generateConstructor(definition) {
    return function() {
      return instantiate(definition);
    };
  }
  var HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  function createElementNS(namespace, tag, typeExtension) {
    if (namespace === HTML_NAMESPACE) {
      return createElement(tag, typeExtension);
    } else {
      return domCreateElementNS(namespace, tag);
    }
  }
  function createElement(tag, typeExtension) {
    if (tag) {
      tag = tag.toLowerCase();
    }
    if (typeExtension) {
      typeExtension = typeExtension.toLowerCase();
    }
    var definition = getRegisteredDefinition(typeExtension || tag);
    if (definition) {
      if (tag == definition.tag && typeExtension == definition.is) {
        return new definition.ctor();
      }
      if (!typeExtension && !definition.is) {
        return new definition.ctor();
      }
    }
    var element;
    if (typeExtension) {
      element = createElement(tag);
      element.setAttribute("is", typeExtension);
      return element;
    }
    element = domCreateElement(tag);
    if (tag.indexOf("-") >= 0) {
      implementPrototype(element, HTMLElement);
    }
    return element;
  }
  var domCreateElement = document.createElement.bind(document);
  var domCreateElementNS = document.createElementNS.bind(document);
  var isInstance;
  if (!Object.__proto__ && !useNative) {
    isInstance = function(obj, ctor) {
      if (obj instanceof ctor) {
        return true;
      }
      var p = obj;
      while (p) {
        if (p === ctor.prototype) {
          return true;
        }
        p = p.__proto__;
      }
      return false;
    };
  } else {
    isInstance = function(obj, base) {
      return obj instanceof base;
    };
  }
  function wrapDomMethodToForceUpgrade(obj, methodName) {
    var orig = obj[methodName];
    obj[methodName] = function() {
      var n = orig.apply(this, arguments);
      upgradeAll(n);
      return n;
    };
  }
  wrapDomMethodToForceUpgrade(Node.prototype, "cloneNode");
  wrapDomMethodToForceUpgrade(document, "importNode");
  document.registerElement = register;
  document.createElement = createElement;
  document.createElementNS = createElementNS;
  scope.registry = registry;
  scope.instanceof = isInstance;
  scope.reservedTagList = reservedTagList;
  scope.getRegisteredDefinition = getRegisteredDefinition;
  document.register = document.registerElement;
});

(function(scope) {
  var useNative = scope.useNative;
  var initializeModules = scope.initializeModules;
  var isIE = scope.isIE;
  if (useNative) {
    var nop = function() {};
    scope.watchShadow = nop;
    scope.upgrade = nop;
    scope.upgradeAll = nop;
    scope.upgradeDocumentTree = nop;
    scope.upgradeSubtree = nop;
    scope.takeRecords = nop;
    scope.instanceof = function(obj, base) {
      return obj instanceof base;
    };
  } else {
    initializeModules();
  }
  var upgradeDocumentTree = scope.upgradeDocumentTree;
  var upgradeDocument = scope.upgradeDocument;
  if (!window.wrap) {
    if (window.ShadowDOMPolyfill) {
      window.wrap = window.ShadowDOMPolyfill.wrapIfNeeded;
      window.unwrap = window.ShadowDOMPolyfill.unwrapIfNeeded;
    } else {
      window.wrap = window.unwrap = function(node) {
        return node;
      };
    }
  }
  if (window.HTMLImports) {
    window.HTMLImports.__importsParsingHook = function(elt) {
      if (elt.import) {
        upgradeDocument(wrap(elt.import));
      }
    };
  }
  function bootstrap() {
    upgradeDocumentTree(window.wrap(document));
    window.CustomElements.ready = true;
    var requestAnimationFrame = window.requestAnimationFrame || function(f) {
      setTimeout(f, 16);
    };
    requestAnimationFrame(function() {
      setTimeout(function() {
        window.CustomElements.readyTime = Date.now();
        if (window.HTMLImports) {
          window.CustomElements.elapsed = window.CustomElements.readyTime - window.HTMLImports.readyTime;
        }
        document.dispatchEvent(new CustomEvent("WebComponentsReady", {
          bubbles: true
        }));
      });
    });
  }
  if (document.readyState === "complete" || scope.flags.eager) {
    bootstrap();
  } else if (document.readyState === "interactive" && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
    bootstrap();
  } else {
    var loadEvent = window.HTMLImports && !window.HTMLImports.ready ? "HTMLImportsLoaded" : "DOMContentLoaded";
    window.addEventListener(loadEvent, bootstrap);
  }
})(window.CustomElements);

(function(scope) {
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(scope) {
      var self = this;
      var args = Array.prototype.slice.call(arguments, 1);
      return function() {
        var args2 = args.slice();
        args2.push.apply(args2, arguments);
        return self.apply(scope, args2);
      };
    };
  }
})(window.WebComponents);

(function(scope) {
  var style = document.createElement("style");
  style.textContent = "" + "body {" + "transition: opacity ease-in 0.2s;" + " } \n" + "body[unresolved] {" + "opacity: 0; display: block; overflow: hidden; position: relative;" + " } \n";
  var head = document.querySelector("head");
  head.insertBefore(style, head.firstChild);
})(window.WebComponents);

(function(scope) {
  window.Platform = scope;
})(window.WebComponents);
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/webcomponents.js/webcomponents.js","/../../../node_modules/webcomponents.js")
},{"+7ZJp0":4,"buffer":1}],8:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = {};
var elements = {};

PnBaseElement.createdCallback = function () {
    this.polymerNative = {};
    this.polymerNative.id = polymerNativeClient.utils.getNextId();
    elements[this.polymerNative.id] = this;
}

PnBaseElement.attachedCallback = function () {
    var self = this;
    setTimeout(function () {
        self.updateSerializedProperties();
        if (window.polymerNativeHost) {
            self.style.visibility = 'hidden';
            polymerNativeHost.createElement(self.polymerNative.serializedProperties);
        }
    }, 0);
}

PnBaseElement.detachedCallback = function () {
    if (window.polymerNativeHost) {
        polymerNativeHost.removeElement(this.polymerNative.id);
    }
}

PnBaseElement.update = function (recursive) {
    this.updateSerializedProperties();
    if (window.polymerNativeHost) {
        polymerNativeHost.updateElement(this.polymerNative.serializedProperties);
    }
    if (recursive) {
        for (var i = 0; i < this.childNodes.length; i++) {
            var childNode = this.childNodes[i];
            if (childNode.polymerNative) {
                childNode.update(recursive);
            }
        }
    }
}

PnBaseElement.updateSerializedProperties = function () {
    this.polymerNative.serializedProperties = JSON.stringify(polymerNativeClient.utils.getElementProperties(this));
}

PnBaseElement.getPNParent = function () {
    var parent = this;

    while (parent) {
        parent = parent.parentNode;

        if (parent && parent.polymerNative) {
            return parent;
        } else if (parent === window.document) {
            return null;
        }
    }
}

window.polymerNativeClient = window.polymerNativeClient || {};
window.polymerNativeClient.elements = elements;
window.polymerNativeClient.PnBaseElement = PnBaseElement;


//Global observers

PnBaseElement.onResize = function () {
    setTimeout(function(){
        for (var elementId in window.polymerNativeClient.elements) {
            var element = window.polymerNativeClient.elements[elementId];
            element.update();
        }
    }, 0);
}

PnBaseElement.onMutations = function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];

        console.log('Mutated ' + mutation.target.tagName);

        var structureChanged = mutation.removedNodes.length || mutation.addedNodes.length;
        mutation.target.update(structureChanged);
    }
}

PnBaseElement.initializeObserver = function () {
    var self = this,
        config = {
            childList: true,
            characterData: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        };

    this.observer = this.observer || new MutationObserver(PnBaseElement.onMutations);
    this.observer.observe(document.body, config);
}

window.addEventListener('load', PnBaseElement.initializeObserver);
window.addEventListener('orientationchange', PnBaseElement.onResize);

module.exports = PnBaseElement;
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/base/pn-base-element.js","/elements/base")
},{"+7ZJp0":4,"buffer":1}],9:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

var proto = Object.create(HTMLDivElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('view', {
    prototype: proto
});
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/base/pn-view.js","/elements/base")
},{"+7ZJp0":4,"../../pn-utils.js":19,"./pn-base-element.js":8,"buffer":1}],10:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLButtonElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('button', {
    extends: 'button',
    prototype: proto
});
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-button.js","/elements")
},{"+7ZJp0":4,"../pn-utils.js":19,"./base/pn-base-element.js":8,"buffer":1}],11:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLInputElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('checkbox', {
    extends: 'input',
    prototype: proto
});
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-checkbox.js","/elements")
},{"+7ZJp0":4,"../pn-utils.js":19,"./base/pn-base-element.js":8,"buffer":1}],12:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLImageElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('img', {
    extends: 'img',
    prototype: proto
});
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-img.js","/elements")
},{"+7ZJp0":4,"../pn-utils.js":19,"./base/pn-base-element.js":8,"buffer":1}],13:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLInputElement.prototype);
proto = Object.assign(proto, PnBaseElement);

proto.setValue = function (value) {
    this.value = value;
}

PnUtils.register('input', {
    extends: 'input',
    prototype: proto
});
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-input.js","/elements")
},{"+7ZJp0":4,"../pn-utils.js":19,"./base/pn-base-element.js":8,"buffer":1}],14:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLDivElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('label', {
    prototype: proto
});
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-label.js","/elements")
},{"+7ZJp0":4,"../pn-utils.js":19,"./base/pn-base-element.js":8,"buffer":1}],15:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

window.addEventListener('load', function(){

    var bodyElement = document.body;
    bodyElement.polymerNative = {};
    bodyElement.polymerNative.id = 'root';

    var bodyProps = PnUtils.getElementProperties(bodyElement);
    bodyProps.tagName = 'pn-root';

    console.log('Updating root view');

    if (window.polymerNativeHost) {
        polymerNativeHost.updateElement(JSON.stringify(bodyProps));
    }

    window.polymerNativeClient.elements['root'] = this;
});
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-rootview.js","/elements")
},{"+7ZJp0":4,"../pn-utils.js":19,"./base/pn-base-element.js":8,"buffer":1}],16:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var RebelRoute = require('../../../../../../rebel-router/es5/rebel-router.js').RebelRoute;
var pathToRegexp = require('path-to-regexp');
var PnBaseElement = require('../base/pn-base-element.js');
var PnUtils = require('../../pn-utils.js');


var Route = (function (_RebelRoute) {

    Route.prototype = Object.create(_RebelRouter && _RebelRouter.prototype);

    function Route() {

        return Object.getPrototypeOf(Route).apply(this);
    }

    Route.prototype.createdCallback = function() {
        Object.getPrototypeOf(Route.prototype).createdCallback.call(this, "native");
        PnBaseElement.createdCallback();
    };

    Route.prototype.attachedCallback = function() {
        Object.getPrototypeOf(Route.prototype).attachedCallback.call(this, "native");
        PnBaseElement.attachedCallback();
    };

    return Route;

})(RebelRouter);

var proto = Object.create(HTMLDivElement.prototype);
proto = Object.assign(proto, PnBaseElement);

proto.createdCallback = function () {
    console.log("CREATED?");
    PnBaseElement.createdCallback.apply(this);

    var self = this;
    this.activationPromise = new Promise(function(resolve, reject) {
        self.activationPromiseResolve = resolve;
    });
}

proto.attachedCallback = function () {
    PnBaseElement.attachedCallback.apply(this);
    //this.style.visibility = 'visible';

    this.initPathRegexp();
    //this.router = this.findRouter();
    //this.router.registerRoute(this);

    var self = this;

    setTimeout(function(){
        self.activationPromiseResolve();
    }, 100);
}

proto.activate = function (skipNative) {
    var self = this;

    this.activationPromise.then(function(){
        console.log('Activating ' + self.id + ' , skipping native = ' + skipNative);
        if (window.polymerNativeHost) {
            if (!skipNative) {
                window.polymerNativeHost.activateRoute(self.polymerNative.id);
            }
        } else {
            self.style.visibility = 'visible';
        }
    });
}

proto.deactivate = function (skipNative) {
    console.log('Deactivating ' + this.id + ' , skipping native = ' + skipNative);
    if (!window.polymerNativeHost && !skipNative) {
        this.style.visibility = 'hidden';
    }
}

proto.initPathRegexp = function () {
    var path = this.getAttribute('path');

    if (path) {
        this.pathRegexp = pathToRegexp(path);
    }
}

proto.findRouter = function () {
    var parent = this;

    while (parent) {
        parent = parent.parentNode;

        if (parent && parent.tagName.toLowerCase() === 'native-router') {
            return parent;
        } else if (parent === window.document) {
            return null;
        }
    }
}

PnUtils.register('route', {
    prototype: proto
});
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/router/pn-route.js","/elements/router")
},{"+7ZJp0":4,"../../../../../../rebel-router/es5/rebel-router.js":20,"../../pn-utils.js":19,"../base/pn-base-element.js":8,"buffer":1,"path-to-regexp":5}],17:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var RebelRouter = require('../../../../../../rebel-router/es5/rebel-router.js').RebelRouter;
// var History = require('history');
var PnBaseElement = require('../base/pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

//polymerNativeClient should be global to be able to call it from native code
window.polymerNativeClient = window.polymerNativeClient || {};

var syncingHistoryWithNative = false;

var Router = (function (_RebelRouter) {

    Router.prototype = Object.create(_RebelRouter && _RebelRouter.prototype);

    function Router() {

        return Object.getPrototypeOf(Router).apply(this);
    }

    Router.prototype.createdCallback = function() {
        Object.getPrototypeOf(Router.prototype).createdCallback.call(this, "native");
        PnBaseElement.createdCallback();
    };

    Router.prototype.attachedCallback = function() {
        Object.getPrototypeOf(Router.prototype).attachedCallback.call(this, "native");
        PnBaseElement.attachedCallback();
    };

    return Router;

})(RebelRouter);




// var proto = {};
//
// //Object.create(HTMLElement.prototype);
// proto.prototype = Object.create(RebelRouter && RebelRouter.prototype, { constructor: { value: proto, enumerable: false, writable: true, configurable: true } });
// console.log("PROTO:", proto);
// //proto = Object.assign(proto, PnBaseElement);
// proto.createdCallback = function () {
//     Object.getPrototypeOf(proto.prototype).createdCallback.call(this);
//     //this.prototype.createdCallback.apply(this.prototype);
//     //RebelRouter.createdCallback.apply(this);
//     //this.prototype.createdCallback.apply(this);
//     //console.log();
//     //this.prototype.createdCallback();
//     //console.log("PN CREATED!");
//     //PnBaseElement.createdCallback.apply(this);
//     //this.activeRoute = null;
//     //this.initHistory();
// }
// //
// // proto.attachedCallback = function () {
// //     //PnBaseElement.attachedCallback.apply(this);
// //     //this.style.visibility = 'visible';
// // }
//
// // proto.initHistory = function () {
// //     window.addEventListener('popstate', this.onHistoryChanged.bind(this));
// // }
// //
// // proto.onHistoryChanged = function (historyState, route) {
// //     var result = null;
// //     var routeToActivate = null;
// //
// //     if (route) {
// //         result = location.hash.match(route.pathRegexp);
// //         result && result.length && (routeToActivate = route);
// //     } else if (this.routes) {
// //         this.routes.forEach(function (route) {
// //             result = location.hash.match(route.pathRegexp);
// //             result && result.length && (routeToActivate = route);
// //         });
// //     }
// //
// //     routeToActivate && this.activateRoute(routeToActivate);
// //
// //     this.historyState = historyState;
// // }
// //
// // proto.registerRoute = function (route) {
// //     this.routes = this.routes || [];
// //     this.routes.push(route);
// //     this.onHistoryChanged(this.historyState, route);
// // }
// //
// // proto.activateRoute = function (route) {
// //     var self = this;
// //
// //     this.routes.forEach(function (routeIterator) {
// //         if (route === routeIterator) {
// //             if (self.activeRoute !== route) {
// //                 self.activeRoute = route;
// //                 route.activate(syncingHistoryWithNative);
// //             }
// //         } else {
// //             routeIterator.deactivate(syncingHistoryWithNative);
// //         }
// //     });
// // }

window.polymerNativeClient.back = function () {
    syncingHistoryWithNative = true;
    window.history.back();
    setTimeout(function(){
        syncingHistoryWithNative = false;
    }, 0);
}

PnUtils.register('router', {
    prototype: Router.prototype
});
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/router/pn-router.js","/elements/router")
},{"+7ZJp0":4,"../../../../../../rebel-router/es5/rebel-router.js":20,"../../pn-utils.js":19,"../base/pn-base-element.js":8,"buffer":1}],18:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
require('webcomponents.js');
require('./pn-utils.js');
require('./elements/base/pn-base-element.js');
require('./elements/base/pn-view.js');
require('./elements/pn-rootview.js');
require('./elements/pn-img.js');
require('./elements/pn-label.js');
require('./elements/pn-button.js');
require('./elements/pn-input.js');
require('./elements/pn-checkbox.js');
require('./elements/router/pn-route.js');
require('./elements/router/pn-router.js');
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_8c9c5b45.js","/")
},{"+7ZJp0":4,"./elements/base/pn-base-element.js":8,"./elements/base/pn-view.js":9,"./elements/pn-button.js":10,"./elements/pn-checkbox.js":11,"./elements/pn-img.js":12,"./elements/pn-input.js":13,"./elements/pn-label.js":14,"./elements/pn-rootview.js":15,"./elements/router/pn-route.js":16,"./elements/router/pn-router.js":17,"./pn-utils.js":19,"buffer":1,"webcomponents.js":7}],19:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var polymerNativeObjectId = 0;

var utils = {

    dropId: function () {
        polymerNativeObjectId = 0;
    },

    getNextId: function () {
        return polymerNativeObjectId++ + '';
    },

    getElementProperties: function (element) {
        var id = element.polymerNative.id;
        var tagName = element.getAttribute('is') || element.tagName;
        var parent = element.getPNParent && element.getPNParent();
        var parentId = parent ? parent.polymerNative.id : null;
        var bounds = element.getBoundingClientRect();
        var style = window.getComputedStyle(element);
        var text = element.textContent.replace(/\s{2,}/g,'');
        var src = element.getAttribute('src');
        var value = element.value;
        var placeholder = element.getAttribute('placeholder');
        var attributes = {};

        for (var i = 0; i < element.attributes.length; i++) {
            var attributeName = element.attributes[i].name;
            if (attributeName !== 'style') {
                var attributeValue = element.attributes[i].value;
                attributes[attributeName] = attributeValue;
            }
        }

        console.log('Updating ' + element.tagName + ', id=' + id + ', to ' + (parent ? parent.tagName : 'root') + ' ' + parentId + ', size=' + bounds.width + 'x' + bounds.height);

        if (parent) {
            var parentBounds = parent.getBoundingClientRect();
            bounds = {
                width: bounds.width,
                height: bounds.height,
                left: bounds.left - parentBounds.left,
                top: bounds.top - parentBounds.top
            }
        }

        return {
            id: id,
            tagName: tagName,
            bounds: bounds,
            attributes: attributes,
            style: {
                display: style.display,
                visibility: style.visibility,
                backgroundColor: style.backgroundColor,
                backgroundImage: style.backgroundImage === 'none' ? undefined : style.backgroundImage.replace('url(','').replace(')',''),
                fontSize: style.fontSize,
                color: style.color,
                borderRadius: style.borderRadius,
                borderColor: style.borderColor,
                borderWidth: style.borderWidth,
                textAlign: style.textAlign
            },
            text: text,
            src: src,
            value: value,
            placeholder: placeholder,
            parentId: parentId
        }
    },

    getElementById: function (elementId) {
        return polymerNativeClient.elements[elementId];
    },

    callMethod: function (elementId, methodName, argument) {
        var element = window.polymerNativeClient.utils.getElementById(elementId);
        element[methodName].call(element, argument);
    },

    dispatchEvent: function (elementId, eventName, data) {
        var element = window.polymerNativeClient.utils.getElementById(elementId);
        window.polymerNativeClient.utils.fireEvent(element, eventName);
    },

    fireEvent: function (node, eventName) {
        // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
        var doc;
        if (node.ownerDocument) {
            doc = node.ownerDocument;
        } else if (node.nodeType == 9) {
            // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
            doc = node;
        } else {
            throw new Error("Invalid node passed to fireEvent: " + node.id);
        }

        if (node.dispatchEvent) {
            // Gecko-style approach (now the standard) takes more work
            var eventClass = "";

            // Different events have different event classes.
            // If this switch statement can't map an eventName to an eventClass,
            // the event firing is going to fail.
            switch (eventName) {
                case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
                case "mousedown":
                case "mouseup":
                    eventClass = "MouseEvents";
                    break;

                case "focus":
                case "change":
                case "blur":
                case "select":
                    eventClass = "HTMLEvents";
                    break;

                default:
                    throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
                    break;
            }
            var event = doc.createEvent(eventClass);
            event.initEvent(eventName, true, true); // All events created as bubbling and cancelable.

            event.synthetic = true; // allow detection of synthetic events
            // The second parameter says go ahead with the default action
            node.dispatchEvent(event, true);
        } else if (node.fireEvent) {
            // IE-old school style
            var event = doc.createEventObject();
            event.synthetic = true; // allow detection of synthetic events
            node.fireEvent("on" + eventName, event);
        }
    },
    register: function (name, properties) {
        var tagName = 'native-' + name;
        document.registerElement(tagName, properties);
    }
};

window.polymerNativeClient = window.polymerNativeClient || {};
window.polymerNativeClient.utils = utils;
window.polymerNativeClient.dispatchEvent = utils.dispatchEvent;
window.polymerNativeClient.callMethod = utils.callMethod;

if (window.polymerNativeHost) {
    window.alert = polymerNativeHost.alert;
    window.console.log = polymerNativeHost.log;
}


if (typeof Object.assign != 'function') {
    (function () {
        Object.assign = function (target) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var output = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source !== undefined && source !== null) {
                    for (var nextKey in source) {
                        if (source.hasOwnProperty(nextKey)) {
                            output[nextKey] = source[nextKey];
                        }
                    }
                }
            }
            return output;
        };
    })();
}

module.exports = utils;
}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/pn-utils.js","/")
},{"+7ZJp0":4,"buffer":1}],20:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Created by Leon Revill on 15/12/2015.
 * Blog: blog.revillweb.com
 * GitHub: https://github.com/RevillWeb
 * Twitter: @RevillWeb
 */

/**
 * The main router class and entry point to the router.
 */

var RebelRouter = exports.RebelRouter = (function (_HTMLElement) {
    _inherits(RebelRouter, _HTMLElement);

    function RebelRouter() {
        _classCallCheck(this, RebelRouter);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(RebelRouter).apply(this, arguments));
    }

    _createClass(RebelRouter, [{
        key: "createdCallback",

        /**
         * Main initialisation point of rebel-router
         * @param prefix - If extending rebel-router you can specify a prefix when calling createdCallback in case your elements need to be named differently
         */
        value: function createdCallback(prefix) {
            var _this2 = this;

            var _prefix = prefix || "rebel";

            this.previousPath = null;
            this.basePath = null;

            //Get options
            this.options = {
                "animation": this.getAttribute("animation") == "true",
                "shadowRoot": this.getAttribute("shadow") == "true",
                "inherit": this.getAttribute("inherit") != "false"
            };

            //Get routes
            if (this.options.inherit === true) {
                //If this is a nested router then we need to go and get the parent path
                var $element = this;
                while ($element.parentNode) {
                    $element = $element.parentNode;
                    if ($element.nodeName.toLowerCase() == _prefix + "-router") {
                        var current = $element.current();
                        this.basePath = current.route;
                        break;
                    }
                }
            }
            this.routes = {};
            var $children = this.children;
            for (var i = 0; i < $children.length; i++) {
                var $child = $children[i];
                var path = $child.getAttribute("path");
                switch ($child.nodeName.toLowerCase()) {
                    case _prefix + "-default":
                        path = "*";
                        break;
                    case _prefix + "-route":
                        path = this.basePath !== null ? this.basePath + path : path;
                        break;
                }
                if (path !== null) {
                    this.routes[path] = {
                        "component": $child.getAttribute("component"),
                        "template": $child.innerHTML || null
                    };
                }
            }

            //After we have collected all configuration clear innerHTML
            this.innerHTML = "";

            if (this.options.shadowRoot === true) {
                this.createShadowRoot();
                this.root = this.shadowRoot;
            } else {
                this.root = this;
            }
            if (this.options.animation === true) {
                this.initAnimation();
            }
            this.render();
            RebelRouter.pathChange(function (isBack) {
                if (_this2.options.animation === true) {
                    if (isBack === true) {
                        _this2.classList.add("rbl-back");
                    } else {
                        _this2.classList.remove("rbl-back");
                    }
                }
                _this2.render();
            });
        }

        /**
         * Function used to initialise the animation mechanics if animation is turned on
         */

    }, {
        key: "initAnimation",
        value: function initAnimation() {
            var _this3 = this;

            var observer = new MutationObserver(function (mutations) {
                var node = mutations[0].addedNodes[0];
                if (node !== undefined) {
                    (function () {
                        var otherChildren = _this3.getOtherChildren(node);
                        node.classList.add("rebel-animate");
                        node.classList.add("enter");
                        setTimeout(function () {
                            if (otherChildren.length > 0) {
                                otherChildren.forEach(function (child) {
                                    child.classList.add("exit");
                                    setTimeout(function () {
                                        child.classList.add("complete");
                                    }, 10);
                                });
                            }
                            setTimeout(function () {
                                node.classList.add("complete");
                            }, 10);
                        }, 10);
                        var animationEnd = function animationEnd(event) {
                            if (event.target.className.indexOf("exit") > -1) {
                                _this3.root.removeChild(event.target);
                            }
                        };
                        node.addEventListener("transitionend", animationEnd);
                        node.addEventListener("animationend", animationEnd);
                    })();
                }
            });
            observer.observe(this, { childList: true });
        }

        /**
         * Method used to get the current route object
         * @returns {*}
         */

    }, {
        key: "current",
        value: function current() {
            var path = RebelRouter.getPathFromUrl();
            for (var route in this.routes) {
                if (route !== "*") {
                    var regexString = "^" + route.replace(/{\w+}\/?/g, "(\\w+)\/?");
                    regexString += regexString.indexOf("\\/?") > -1 ? "" : "\\/?" + "([?=&-\/\\w+]+)?$";
                    var regex = new RegExp(regexString);
                    if (regex.test(path)) {
                        return _routeResult(this.routes[route], route, regex, path);
                    }
                }
            }
            return this.routes["*"] !== undefined ? _routeResult(this.routes["*"], "*", null, path) : null;
        }

        /**
         * Method called to render the current view
         */

    }, {
        key: "render",
        value: function render() {
            var result = this.current();
            if (result !== null) {
                if (result.path !== this.previousPath || this.options.animation === true) {
                    if (this.options.animation !== true) {
                        this.root.innerHTML = "";
                    }
                    if (result.component !== null) {
                        var $component = document.createElement(result.component);
                        for (var key in result.params) {
                            var value = result.params[key];
                            if (typeof value == "Object") {
                                try {
                                    value = JSON.parse(value);
                                } catch (e) {
                                    console.error("Couldn't parse param value:", e);
                                }
                            }
                            $component.setAttribute(key, value);
                        }
                        this.root.appendChild($component);
                    } else {
                        var $template = result.template;
                        //TODO: Find a faster alternative
                        if ($template.indexOf("${") > -1) {
                            $template = $template.replace(/\${([^{}]*)}/g, function (a, b) {
                                var r = result.params[b];
                                return typeof r === 'string' || typeof r === 'number' ? r : a;
                            });
                        }
                        this.root.innerHTML = "<div>" + $template + "</div>";
                    }
                    this.previousPath = result.path;
                }
            }
        }

        /**
         *
         * @param node - Used with the animation mechanics to get all other view children except itself
         * @returns {Array}
         */

    }, {
        key: "getOtherChildren",
        value: function getOtherChildren(node) {
            var children = this.root.children;
            var results = [];
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child != node) {
                    results.push(child);
                }
            }
            return results;
        }
    }], [{
        key: "parseQueryString",

        /**
         * Static helper method to parse the query string from a url into an object.
         * @param url
         * @returns {{}}
         */
        value: function parseQueryString(url) {
            var result = {};
            if (url !== undefined) {
                var queryString = url.indexOf("?") > -1 ? url.substr(url.indexOf("?") + 1, url.length) : null;
                if (queryString !== null) {
                    queryString.split("&").forEach(function (part) {
                        if (!part) return;
                        part = part.replace("+", " ");
                        var eq = part.indexOf("=");
                        var key = eq > -1 ? part.substr(0, eq) : part;
                        var val = eq > -1 ? decodeURIComponent(part.substr(eq + 1)) : "";
                        var from = key.indexOf("[");
                        if (from == -1) result[decodeURIComponent(key)] = val;else {
                            var to = key.indexOf("]");
                            var index = decodeURIComponent(key.substring(from + 1, to));
                            key = decodeURIComponent(key.substring(0, from));
                            if (!result[key]) result[key] = [];
                            if (!index) result[key].push(val);else result[key][index] = val;
                        }
                    });
                }
            }
            return result;
        }

        /**
         * Static helper method to convert a class name to a valid element name.
         * @param Class
         * @returns {string}
         */

    }, {
        key: "classToTag",
        value: function classToTag(Class) {
            /**
             * Class.name would be better but this isn't supported in IE 11.
             */
            try {
                var name = Class.toString().match(/^function\s*([^\s(]+)/)[1].replace(/\W+/g, '-').replace(/([a-z\d])([A-Z0-9])/g, '$1-$2').toLowerCase();
            } catch (e) {
                throw new Error("Couldn't parse class name:", e);
            }
            if (RebelRouter.validElementTag(name) === false) {
                throw new Error("Class name couldn't be translated to tag.");
            }
            return name;
        }

        /**
         * Static helper method used to determine if an element with the specified name has already been registered.
         * @param name
         * @returns {boolean}
         */

    }, {
        key: "isRegisteredElement",
        value: function isRegisteredElement(name) {
            return document.createElement(name).constructor !== HTMLElement;
        }

        /**
         * Static helper method to take a web component class, create an element name and register the new element on the document.
         * @param Class
         * @returns {string}
         */

    }, {
        key: "createElement",
        value: function createElement(Class) {
            var name = RebelRouter.classToTag(Class);
            if (RebelRouter.isRegisteredElement(name) === false) {
                Class.prototype.name = name;
                document.registerElement(name, Class);
            }
            return name;
        }

        /**
         * Simple static helper method containing a regular expression to validate an element name
         * @param tag
         * @returns {boolean}
         */

    }, {
        key: "validElementTag",
        value: function validElementTag(tag) {
            return (/^[a-z0-9\-]+$/.test(tag)
            );
        }

        /**
         * Method used to register a callback to be called when the URL path changes.
         * @param callback
         */

    }, {
        key: "pathChange",
        value: function pathChange(callback) {
            if (RebelRouter.changeCallbacks === undefined) {
                RebelRouter.changeCallbacks = [];
            }
            RebelRouter.changeCallbacks.push(callback);
            var changeHandler = function changeHandler() {
                /**
                 *  event.oldURL and event.newURL would be better here but this doesn't work in IE :(
                 */
                if (window.location.href != RebelRouter.oldURL) {
                    RebelRouter.changeCallbacks.forEach(function (callback) {
                        callback(RebelRouter.isBack);
                    });
                    RebelRouter.isBack = false;
                }
                RebelRouter.oldURL = window.location.href;
            };
            if (window.onhashchange === null) {
                window.addEventListener("rblback", function () {
                    RebelRouter.isBack = true;
                });
            }
            window.onhashchange = changeHandler;
        }

        /**
         * Static helper method used to get the parameters from the provided route.
         * @param regex
         * @param route
         * @param path
         * @returns {{}}
         */

    }, {
        key: "getParamsFromUrl",
        value: function getParamsFromUrl(regex, route, path) {
            var result = RebelRouter.parseQueryString(path);
            var re = /{(\w+)}/g;
            var results = [];
            var match = undefined;
            while (match = re.exec(route)) {
                results.push(match[1]);
            }
            if (regex !== null) {
                var results2 = regex.exec(path);
                results.forEach(function (item, idx) {
                    result[item] = results2[idx + 1];
                });
            }
            return result;
        }

        /**
         * Static helper method used to get the path from the current URL.
         * @returns {*}
         */

    }, {
        key: "getPathFromUrl",
        value: function getPathFromUrl() {
            var result = window.location.href.match(/#(.*)$/);
            if (result !== null) {
                return result[1];
            }
        }
    }]);

    return RebelRouter;
})(HTMLElement);

document.registerElement("rebel-router", RebelRouter);

/**
 * Class which represents the rebel-route custom element
 */

var RebelRoute = (function (_HTMLElement2) {
    _inherits(RebelRoute, _HTMLElement2);

    function RebelRoute() {
        _classCallCheck(this, RebelRoute);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(RebelRoute).apply(this, arguments));
    }

    return RebelRoute;
})(HTMLElement);

document.registerElement("rebel-route", RebelRoute);

/**
 * Class which represents the rebel-default custom element
 */

var RebelDefault = (function (_HTMLElement3) {
    _inherits(RebelDefault, _HTMLElement3);

    function RebelDefault() {
        _classCallCheck(this, RebelDefault);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(RebelDefault).apply(this, arguments));
    }

    return RebelDefault;
})(HTMLElement);

document.registerElement("rebel-default", RebelDefault);

/**
 * Represents the prototype for an anchor element which added functionality to perform a back transition.
 */

var RebelBackA = (function (_HTMLAnchorElement) {
    _inherits(RebelBackA, _HTMLAnchorElement);

    function RebelBackA() {
        _classCallCheck(this, RebelBackA);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(RebelBackA).apply(this, arguments));
    }

    _createClass(RebelBackA, [{
        key: "attachedCallback",
        value: function attachedCallback() {
            var _this7 = this;

            this.addEventListener("click", function (event) {
                var path = _this7.getAttribute("href");
                event.preventDefault();
                if (path !== undefined) {
                    window.dispatchEvent(new CustomEvent('rblback'));
                }
                window.location.hash = path;
            });
        }
    }]);

    return RebelBackA;
})(HTMLAnchorElement);
/**
 * Register the back button custom element
 */

document.registerElement("rebel-back-a", {
    extends: "a",
    prototype: RebelBackA.prototype
});

/**
 * Constructs a route object
 * @param obj - the component name or the HTML template
 * @param route
 * @param regex
 * @param path
 * @returns {{}}
 * @private
 */
function _routeResult(obj, route, regex, path) {
    var result = {};
    result.component = obj.component;
    result.template = obj.template;
    result.route = route;
    result.path = path;
    result.params = RebelRouter.getParamsFromUrl(regex, route, path);
    return result;
}

}).call(this,require("+7ZJp0"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../../rebel-router/es5/rebel-router.js","/../../../../rebel-router/es5")
},{"+7ZJp0":4,"buffer":1}]},{},[18])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2xlb24vQ29kZS9wb2x5bWVyLW5hdGl2ZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9sZW9uL0NvZGUvcG9seW1lci1uYXRpdmUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiL2hvbWUvbGVvbi9Db2RlL3BvbHltZXItbmF0aXZlL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIvaG9tZS9sZW9uL0NvZGUvcG9seW1lci1uYXRpdmUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiL2hvbWUvbGVvbi9Db2RlL3BvbHltZXItbmF0aXZlL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9ob21lL2xlb24vQ29kZS9wb2x5bWVyLW5hdGl2ZS9ub2RlX21vZHVsZXMvcGF0aC10by1yZWdleHAvaW5kZXguanMiLCIvaG9tZS9sZW9uL0NvZGUvcG9seW1lci1uYXRpdmUvbm9kZV9tb2R1bGVzL3BhdGgtdG8tcmVnZXhwL25vZGVfbW9kdWxlcy9pc2FycmF5L2luZGV4LmpzIiwiL2hvbWUvbGVvbi9Db2RlL3BvbHltZXItbmF0aXZlL25vZGVfbW9kdWxlcy93ZWJjb21wb25lbnRzLmpzL3dlYmNvbXBvbmVudHMuanMiLCIvaG9tZS9sZW9uL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvYmFzZS9wbi1iYXNlLWVsZW1lbnQuanMiLCIvaG9tZS9sZW9uL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvYmFzZS9wbi12aWV3LmpzIiwiL2hvbWUvbGVvbi9Db2RlL3BvbHltZXItbmF0aXZlL3BhcnRpYWxzL2pzLWxpYnJhcnkvc3JjL2VsZW1lbnRzL3BuLWJ1dHRvbi5qcyIsIi9ob21lL2xlb24vQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9lbGVtZW50cy9wbi1jaGVja2JveC5qcyIsIi9ob21lL2xlb24vQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9lbGVtZW50cy9wbi1pbWcuanMiLCIvaG9tZS9sZW9uL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvcG4taW5wdXQuanMiLCIvaG9tZS9sZW9uL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvcG4tbGFiZWwuanMiLCIvaG9tZS9sZW9uL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvcG4tcm9vdHZpZXcuanMiLCIvaG9tZS9sZW9uL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvcm91dGVyL3BuLXJvdXRlLmpzIiwiL2hvbWUvbGVvbi9Db2RlL3BvbHltZXItbmF0aXZlL3BhcnRpYWxzL2pzLWxpYnJhcnkvc3JjL2VsZW1lbnRzL3JvdXRlci9wbi1yb3V0ZXIuanMiLCIvaG9tZS9sZW9uL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZmFrZV84YzljNWI0NS5qcyIsIi9ob21lL2xlb24vQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9wbi11dGlscy5qcyIsIi9ob21lL2xlb24vQ29kZS9yZWJlbC1yb3V0ZXIvZXM1L3JlYmVsLXJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmxDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmlPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTJcblxuLyoqXG4gKiBJZiBgQnVmZmVyLl91c2VUeXBlZEFycmF5c2A6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChjb21wYXRpYmxlIGRvd24gdG8gSUU2KVxuICovXG5CdWZmZXIuX3VzZVR5cGVkQXJyYXlzID0gKGZ1bmN0aW9uICgpIHtcbiAgLy8gRGV0ZWN0IGlmIGJyb3dzZXIgc3VwcG9ydHMgVHlwZWQgQXJyYXlzLiBTdXBwb3J0ZWQgYnJvd3NlcnMgYXJlIElFIDEwKywgRmlyZWZveCA0KyxcbiAgLy8gQ2hyb21lIDcrLCBTYWZhcmkgNS4xKywgT3BlcmEgMTEuNissIGlPUyA0LjIrLiBJZiB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGFkZGluZ1xuICAvLyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMsIHRoZW4gdGhhdCdzIHRoZSBzYW1lIGFzIG5vIGBVaW50OEFycmF5YCBzdXBwb3J0XG4gIC8vIGJlY2F1c2Ugd2UgbmVlZCB0byBiZSBhYmxlIHRvIGFkZCBhbGwgdGhlIG5vZGUgQnVmZmVyIEFQSSBtZXRob2RzLiBUaGlzIGlzIGFuIGlzc3VlXG4gIC8vIGluIEZpcmVmb3ggNC0yOS4gTm93IGZpeGVkOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzhcbiAgdHJ5IHtcbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDApXG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KGJ1ZilcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIHJldHVybiA0MiA9PT0gYXJyLmZvbygpICYmXG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgLy8gQ2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pXG5cbiAgdmFyIHR5cGUgPSB0eXBlb2Ygc3ViamVjdFxuXG4gIC8vIFdvcmthcm91bmQ6IG5vZGUncyBiYXNlNjQgaW1wbGVtZW50YXRpb24gYWxsb3dzIGZvciBub24tcGFkZGVkIHN0cmluZ3NcbiAgLy8gd2hpbGUgYmFzZTY0LWpzIGRvZXMgbm90LlxuICBpZiAoZW5jb2RpbmcgPT09ICdiYXNlNjQnICYmIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgc3ViamVjdCA9IHN0cmluZ3RyaW0oc3ViamVjdClcbiAgICB3aGlsZSAoc3ViamVjdC5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgICBzdWJqZWN0ID0gc3ViamVjdCArICc9J1xuICAgIH1cbiAgfVxuXG4gIC8vIEZpbmQgdGhlIGxlbmd0aFxuICB2YXIgbGVuZ3RoXG4gIGlmICh0eXBlID09PSAnbnVtYmVyJylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdClcbiAgZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpXG4gICAgbGVuZ3RoID0gQnVmZmVyLmJ5dGVMZW5ndGgoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKVxuICAgIGxlbmd0aCA9IGNvZXJjZShzdWJqZWN0Lmxlbmd0aCkgLy8gYXNzdW1lIHRoYXQgb2JqZWN0IGlzIGFycmF5LWxpa2VcbiAgZWxzZVxuICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgbmVlZHMgdG8gYmUgYSBudW1iZXIsIGFycmF5IG9yIHN0cmluZy4nKVxuXG4gIHZhciBidWZcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICAvLyBQcmVmZXJyZWQ6IFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgYnVmID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBUSElTIGluc3RhbmNlIG9mIEJ1ZmZlciAoY3JlYXRlZCBieSBgbmV3YClcbiAgICBidWYgPSB0aGlzXG4gICAgYnVmLmxlbmd0aCA9IGxlbmd0aFxuICAgIGJ1Zi5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgaVxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiB0eXBlb2Ygc3ViamVjdC5ieXRlTGVuZ3RoID09PSAnbnVtYmVyJykge1xuICAgIC8vIFNwZWVkIG9wdGltaXphdGlvbiAtLSB1c2Ugc2V0IGlmIHdlJ3JlIGNvcHlpbmcgZnJvbSBhIHR5cGVkIGFycmF5XG4gICAgYnVmLl9zZXQoc3ViamVjdClcbiAgfSBlbHNlIGlmIChpc0FycmF5aXNoKHN1YmplY3QpKSB7XG4gICAgLy8gVHJlYXQgYXJyYXktaXNoIG9iamVjdHMgYXMgYSBieXRlIGFycmF5XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpKVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0LnJlYWRVSW50OChpKVxuICAgICAgZWxzZVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0W2ldXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgYnVmLndyaXRlKHN1YmplY3QsIDAsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzICYmICFub1plcm8pIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGJ1ZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbi8vIFNUQVRJQyBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKGIpIHtcbiAgcmV0dXJuICEhKGIgIT09IG51bGwgJiYgYiAhPT0gdW5kZWZpbmVkICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGZ1bmN0aW9uIChzdHIsIGVuY29kaW5nKSB7XG4gIHZhciByZXRcbiAgc3RyID0gc3RyICsgJydcbiAgc3dpdGNoIChlbmNvZGluZyB8fCAndXRmOCcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCAvIDJcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAncmF3JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggKiAyXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZW5jb2RpbmcnKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIChsaXN0LCB0b3RhbExlbmd0aCkge1xuICBhc3NlcnQoaXNBcnJheShsaXN0KSwgJ1VzYWdlOiBCdWZmZXIuY29uY2F0KGxpc3QsIFt0b3RhbExlbmd0aF0pXFxuJyArXG4gICAgICAnbGlzdCBzaG91bGQgYmUgYW4gQXJyYXkuJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9IGVsc2UgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGxpc3RbMF1cbiAgfVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdG90YWxMZW5ndGggIT09ICdudW1iZXInKSB7XG4gICAgdG90YWxMZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRvdGFsTGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIodG90YWxMZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuLy8gQlVGRkVSIElOU1RBTkNFIE1FVEhPRFNcbi8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIF9oZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGFzc2VydChzdHJMZW4gJSAyID09PSAwLCAnSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJ5dGUgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgYXNzZXJ0KCFpc05hTihieXRlKSwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gYnl0ZVxuICB9XG4gIEJ1ZmZlci5fY2hhcnNXcml0dGVuID0gaSAqIDJcbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gX3V0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9hc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IEJ1ZmZlci5fY2hhcnNXcml0dGVuID1cbiAgICBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBfYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gX3V0ZjE2bGVXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gU3VwcG9ydCBib3RoIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZylcbiAgLy8gYW5kIHRoZSBsZWdhY3kgKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIGlmICghaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHsgIC8vIGxlZ2FjeVxuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG4gIHN0YXJ0ID0gTnVtYmVyKHN0YXJ0KSB8fCAwXG4gIGVuZCA9IChlbmQgIT09IHVuZGVmaW5lZClcbiAgICA/IE51bWJlcihlbmQpXG4gICAgOiBlbmQgPSBzZWxmLmxlbmd0aFxuXG4gIC8vIEZhc3RwYXRoIGVtcHR5IHN0cmluZ3NcbiAgaWYgKGVuZCA9PT0gc3RhcnQpXG4gICAgcmV0dXJuICcnXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uICh0YXJnZXQsIHRhcmdldF9zdGFydCwgc3RhcnQsIGVuZCkge1xuICB2YXIgc291cmNlID0gdGhpc1xuXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICghdGFyZ2V0X3N0YXJ0KSB0YXJnZXRfc3RhcnQgPSAwXG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgc291cmNlLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnc291cmNlRW5kIDwgc291cmNlU3RhcnQnKVxuICBhc3NlcnQodGFyZ2V0X3N0YXJ0ID49IDAgJiYgdGFyZ2V0X3N0YXJ0IDwgdGFyZ2V0Lmxlbmd0aCxcbiAgICAgICd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCBzb3VyY2UubGVuZ3RoLCAnc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gc291cmNlLmxlbmd0aCwgJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpXG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgPCBlbmQgLSBzdGFydClcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc3RhcnRcblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAobGVuIDwgMTAwIHx8ICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0X3N0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0X3N0YXJ0KVxuICB9XG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gX3V0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXMgPSAnJ1xuICB2YXIgdG1wID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgaWYgKGJ1ZltpXSA8PSAweDdGKSB7XG4gICAgICByZXMgKz0gZGVjb2RlVXRmOENoYXIodG1wKSArIFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICAgICAgdG1wID0gJydcbiAgICB9IGVsc2Uge1xuICAgICAgdG1wICs9ICclJyArIGJ1ZltpXS50b1N0cmluZygxNilcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzICsgZGVjb2RlVXRmOENoYXIodG1wKVxufVxuXG5mdW5jdGlvbiBfYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspXG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHJldHVybiBfYXNjaWlTbGljZShidWYsIHN0YXJ0LCBlbmQpXG59XG5cbmZ1bmN0aW9uIF9oZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIF91dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2krMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gY2xhbXAoc3RhcnQsIGxlbiwgMClcbiAgZW5kID0gY2xhbXAoZW5kLCBsZW4sIGxlbilcblxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIHJldHVybiBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIHZhciBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQsIHRydWUpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gICAgcmV0dXJuIG5ld0J1ZlxuICB9XG59XG5cbi8vIGBnZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiBfcmVhZFVJbnQxNiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWxcbiAgaWYgKGxpdHRsZUVuZGlhbikge1xuICAgIHZhbCA9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdIDw8IDhcbiAgfSBlbHNlIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRVSW50MzIgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICBpZiAob2Zmc2V0ICsgMiA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAyXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gICAgdmFsIHw9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldCArIDNdIDw8IDI0ID4+PiAwKVxuICB9IGVsc2Uge1xuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsID0gYnVmW29mZnNldCArIDFdIDw8IDE2XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDJdIDw8IDhcbiAgICBpZiAob2Zmc2V0ICsgMyA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgM11cbiAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldF0gPDwgMjQgPj4+IDApXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgdmFyIG5lZyA9IHRoaXNbb2Zmc2V0XSAmIDB4ODBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbmZ1bmN0aW9uIF9yZWFkSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsID0gX3JlYWRVSW50MTYoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgdHJ1ZSlcbiAgdmFyIG5lZyA9IHZhbCAmIDB4ODAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDE2KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZEludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IF9yZWFkVUludDMyKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDAwMDAwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmZmZmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDMyKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZEZsb2F0IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRGbG9hdCh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRmxvYXQodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkRG91YmxlIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyA3IDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZilcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpIHJldHVyblxuXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG59XG5cbmZ1bmN0aW9uIF93cml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmYpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGxlbiAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPVxuICAgICAgICAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmZmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmLCAtMHg4MClcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgdGhpcy53cml0ZVVJbnQ4KHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgdGhpcy53cml0ZVVJbnQ4KDB4ZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZiwgLTB4ODAwMClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIF93cml0ZVVJbnQxNihidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICBfd3JpdGVVSW50MTYoYnVmLCAweGZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICBfd3JpdGVVSW50MzIoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgX3dyaXRlVUludDMyKGJ1ZiwgMHhmZmZmZmZmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZJRUVFNzU0KHZhbHVlLCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gZmlsbCh2YWx1ZSwgc3RhcnQ9MCwgZW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHZhbHVlID0gdmFsdWUuY2hhckNvZGVBdCgwKVxuICB9XG5cbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgIWlzTmFOKHZhbHVlKSwgJ3ZhbHVlIGlzIG5vdCBhIG51bWJlcicpXG4gIGFzc2VydChlbmQgPj0gc3RhcnQsICdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBhc3NlcnQoc3RhcnQgPj0gMCAmJiBzdGFydCA8IHRoaXMubGVuZ3RoLCAnc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gdGhpcy5sZW5ndGgsICdlbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICB0aGlzW2ldID0gdmFsdWVcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBvdXQgPSBbXVxuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIG91dFtpXSA9IHRvSGV4KHRoaXNbaV0pXG4gICAgaWYgKGkgPT09IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMpIHtcbiAgICAgIG91dFtpICsgMV0gPSAnLi4uJ1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBvdXQuam9pbignICcpICsgJz4nXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKVxuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IGdldC9zZXQgbWV0aG9kcyBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9nZXQgPSBhcnIuZ2V0XG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbi8vIHNsaWNlKHN0YXJ0LCBlbmQpXG5mdW5jdGlvbiBjbGFtcCAoaW5kZXgsIGxlbiwgZGVmYXVsdFZhbHVlKSB7XG4gIGlmICh0eXBlb2YgaW5kZXggIT09ICdudW1iZXInKSByZXR1cm4gZGVmYXVsdFZhbHVlXG4gIGluZGV4ID0gfn5pbmRleDsgIC8vIENvZXJjZSB0byBpbnRlZ2VyLlxuICBpZiAoaW5kZXggPj0gbGVuKSByZXR1cm4gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgaW5kZXggKz0gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgcmV0dXJuIDBcbn1cblxuZnVuY3Rpb24gY29lcmNlIChsZW5ndGgpIHtcbiAgLy8gQ29lcmNlIGxlbmd0aCB0byBhIG51bWJlciAocG9zc2libHkgTmFOKSwgcm91bmQgdXBcbiAgLy8gaW4gY2FzZSBpdCdzIGZyYWN0aW9uYWwgKGUuZy4gMTIzLjQ1NikgdGhlbiBkbyBhXG4gIC8vIGRvdWJsZSBuZWdhdGUgdG8gY29lcmNlIGEgTmFOIHRvIDAuIEVhc3ksIHJpZ2h0P1xuICBsZW5ndGggPSB+fk1hdGguY2VpbCgrbGVuZ3RoKVxuICByZXR1cm4gbGVuZ3RoIDwgMCA/IDAgOiBsZW5ndGhcbn1cblxuZnVuY3Rpb24gaXNBcnJheSAoc3ViamVjdCkge1xuICByZXR1cm4gKEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHN1YmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN1YmplY3QpID09PSAnW29iamVjdCBBcnJheV0nXG4gIH0pKHN1YmplY3QpXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXlpc2ggKHN1YmplY3QpIHtcbiAgcmV0dXJuIGlzQXJyYXkoc3ViamVjdCkgfHwgQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpIHx8XG4gICAgICBzdWJqZWN0ICYmIHR5cGVvZiBzdWJqZWN0ID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mIHN1YmplY3QubGVuZ3RoID09PSAnbnVtYmVyJ1xufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGIgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGlmIChiIDw9IDB4N0YpXG4gICAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSlcbiAgICBlbHNlIHtcbiAgICAgIHZhciBzdGFydCA9IGlcbiAgICAgIGlmIChiID49IDB4RDgwMCAmJiBiIDw9IDB4REZGRikgaSsrXG4gICAgICB2YXIgaCA9IGVuY29kZVVSSUNvbXBvbmVudChzdHIuc2xpY2Uoc3RhcnQsIGkrMSkpLnN1YnN0cigxKS5zcGxpdCgnJScpXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGgubGVuZ3RoOyBqKyspXG4gICAgICAgIGJ5dGVBcnJheS5wdXNoKHBhcnNlSW50KGhbal0sIDE2KSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoc3RyKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIHBvc1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKVxuICAgICAgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBkZWNvZGVVdGY4Q2hhciAoc3RyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCkgLy8gVVRGIDggaW52YWxpZCBjaGFyXG4gIH1cbn1cblxuLypcbiAqIFdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHZhbHVlIGlzIGEgdmFsaWQgaW50ZWdlci4gVGhpcyBtZWFucyB0aGF0IGl0XG4gKiBpcyBub24tbmVnYXRpdmUuIEl0IGhhcyBubyBmcmFjdGlvbmFsIGNvbXBvbmVudCBhbmQgdGhhdCBpdCBkb2VzIG5vdFxuICogZXhjZWVkIHRoZSBtYXhpbXVtIGFsbG93ZWQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHZlcmlmdWludCAodmFsdWUsIG1heCkge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPj0gMCwgJ3NwZWNpZmllZCBhIG5lZ2F0aXZlIHZhbHVlIGZvciB3cml0aW5nIGFuIHVuc2lnbmVkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGlzIGxhcmdlciB0aGFuIG1heGltdW0gdmFsdWUgZm9yIHR5cGUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZnNpbnQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZklFRUU3NTQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxufVxuXG5mdW5jdGlvbiBhc3NlcnQgKHRlc3QsIG1lc3NhZ2UpIHtcbiAgaWYgKCF0ZXN0KSB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSB8fCAnRmFpbGVkIGFzc2VydGlvbicpXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiKzdaSnAwXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzXCIsXCIvLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFBMVVNfVVJMX1NBRkUgPSAnLScuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0hfVVJMX1NBRkUgPSAnXycuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTIHx8XG5cdFx0ICAgIGNvZGUgPT09IFBMVVNfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIIHx8XG5cdFx0ICAgIGNvZGUgPT09IFNMQVNIX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiKzdaSnAwXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbmV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIis3WkpwMFwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIis3WkpwMFwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3NcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgaXNhcnJheSA9IHJlcXVpcmUoJ2lzYXJyYXknKVxuXG4vKipcbiAqIEV4cG9zZSBgcGF0aFRvUmVnZXhwYC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBwYXRoVG9SZWdleHBcbm1vZHVsZS5leHBvcnRzLnBhcnNlID0gcGFyc2Vcbm1vZHVsZS5leHBvcnRzLmNvbXBpbGUgPSBjb21waWxlXG5tb2R1bGUuZXhwb3J0cy50b2tlbnNUb0Z1bmN0aW9uID0gdG9rZW5zVG9GdW5jdGlvblxubW9kdWxlLmV4cG9ydHMudG9rZW5zVG9SZWdFeHAgPSB0b2tlbnNUb1JlZ0V4cFxuXG4vKipcbiAqIFRoZSBtYWluIHBhdGggbWF0Y2hpbmcgcmVnZXhwIHV0aWxpdHkuXG4gKlxuICogQHR5cGUge1JlZ0V4cH1cbiAqL1xudmFyIFBBVEhfUkVHRVhQID0gbmV3IFJlZ0V4cChbXG4gIC8vIE1hdGNoIGVzY2FwZWQgY2hhcmFjdGVycyB0aGF0IHdvdWxkIG90aGVyd2lzZSBhcHBlYXIgaW4gZnV0dXJlIG1hdGNoZXMuXG4gIC8vIFRoaXMgYWxsb3dzIHRoZSB1c2VyIHRvIGVzY2FwZSBzcGVjaWFsIGNoYXJhY3RlcnMgdGhhdCB3b24ndCB0cmFuc2Zvcm0uXG4gICcoXFxcXFxcXFwuKScsXG4gIC8vIE1hdGNoIEV4cHJlc3Mtc3R5bGUgcGFyYW1ldGVycyBhbmQgdW4tbmFtZWQgcGFyYW1ldGVycyB3aXRoIGEgcHJlZml4XG4gIC8vIGFuZCBvcHRpb25hbCBzdWZmaXhlcy4gTWF0Y2hlcyBhcHBlYXIgYXM6XG4gIC8vXG4gIC8vIFwiLzp0ZXN0KFxcXFxkKyk/XCIgPT4gW1wiL1wiLCBcInRlc3RcIiwgXCJcXGQrXCIsIHVuZGVmaW5lZCwgXCI/XCIsIHVuZGVmaW5lZF1cbiAgLy8gXCIvcm91dGUoXFxcXGQrKVwiICA9PiBbdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgXCJcXGQrXCIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkXVxuICAvLyBcIi8qXCIgICAgICAgICAgICA9PiBbXCIvXCIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgXCIqXCJdXG4gICcoW1xcXFwvLl0pPyg/Oig/OlxcXFw6KFxcXFx3KykoPzpcXFxcKCgoPzpcXFxcXFxcXC58W15cXFxcXFxcXCgpXSkrKVxcXFwpKT98XFxcXCgoKD86XFxcXFxcXFwufFteXFxcXFxcXFwoKV0pKylcXFxcKSkoWysqP10pP3woXFxcXCopKSdcbl0uam9pbignfCcpLCAnZycpXG5cbi8qKlxuICogUGFyc2UgYSBzdHJpbmcgZm9yIHRoZSByYXcgdG9rZW5zLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHshQXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHBhcnNlIChzdHIpIHtcbiAgdmFyIHRva2VucyA9IFtdXG4gIHZhciBrZXkgPSAwXG4gIHZhciBpbmRleCA9IDBcbiAgdmFyIHBhdGggPSAnJ1xuICB2YXIgcmVzXG5cbiAgd2hpbGUgKChyZXMgPSBQQVRIX1JFR0VYUC5leGVjKHN0cikpICE9IG51bGwpIHtcbiAgICB2YXIgbSA9IHJlc1swXVxuICAgIHZhciBlc2NhcGVkID0gcmVzWzFdXG4gICAgdmFyIG9mZnNldCA9IHJlcy5pbmRleFxuICAgIHBhdGggKz0gc3RyLnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgaW5kZXggPSBvZmZzZXQgKyBtLmxlbmd0aFxuXG4gICAgLy8gSWdub3JlIGFscmVhZHkgZXNjYXBlZCBzZXF1ZW5jZXMuXG4gICAgaWYgKGVzY2FwZWQpIHtcbiAgICAgIHBhdGggKz0gZXNjYXBlZFsxXVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICB2YXIgbmV4dCA9IHN0cltpbmRleF1cbiAgICB2YXIgcHJlZml4ID0gcmVzWzJdXG4gICAgdmFyIG5hbWUgPSByZXNbM11cbiAgICB2YXIgY2FwdHVyZSA9IHJlc1s0XVxuICAgIHZhciBncm91cCA9IHJlc1s1XVxuICAgIHZhciBtb2RpZmllciA9IHJlc1s2XVxuICAgIHZhciBhc3RlcmlzayA9IHJlc1s3XVxuXG4gICAgLy8gUHVzaCB0aGUgY3VycmVudCBwYXRoIG9udG8gdGhlIHRva2Vucy5cbiAgICBpZiAocGF0aCkge1xuICAgICAgdG9rZW5zLnB1c2gocGF0aClcbiAgICAgIHBhdGggPSAnJ1xuICAgIH1cblxuICAgIHZhciBwYXJ0aWFsID0gcHJlZml4ICE9IG51bGwgJiYgbmV4dCAhPSBudWxsICYmIG5leHQgIT09IHByZWZpeFxuICAgIHZhciByZXBlYXQgPSBtb2RpZmllciA9PT0gJysnIHx8IG1vZGlmaWVyID09PSAnKidcbiAgICB2YXIgb3B0aW9uYWwgPSBtb2RpZmllciA9PT0gJz8nIHx8IG1vZGlmaWVyID09PSAnKidcbiAgICB2YXIgZGVsaW1pdGVyID0gcmVzWzJdIHx8ICcvJ1xuICAgIHZhciBwYXR0ZXJuID0gY2FwdHVyZSB8fCBncm91cCB8fCAoYXN0ZXJpc2sgPyAnLionIDogJ1teJyArIGRlbGltaXRlciArICddKz8nKVxuXG4gICAgdG9rZW5zLnB1c2goe1xuICAgICAgbmFtZTogbmFtZSB8fCBrZXkrKyxcbiAgICAgIHByZWZpeDogcHJlZml4IHx8ICcnLFxuICAgICAgZGVsaW1pdGVyOiBkZWxpbWl0ZXIsXG4gICAgICBvcHRpb25hbDogb3B0aW9uYWwsXG4gICAgICByZXBlYXQ6IHJlcGVhdCxcbiAgICAgIHBhcnRpYWw6IHBhcnRpYWwsXG4gICAgICBhc3RlcmlzazogISFhc3RlcmlzayxcbiAgICAgIHBhdHRlcm46IGVzY2FwZUdyb3VwKHBhdHRlcm4pXG4gICAgfSlcbiAgfVxuXG4gIC8vIE1hdGNoIGFueSBjaGFyYWN0ZXJzIHN0aWxsIHJlbWFpbmluZy5cbiAgaWYgKGluZGV4IDwgc3RyLmxlbmd0aCkge1xuICAgIHBhdGggKz0gc3RyLnN1YnN0cihpbmRleClcbiAgfVxuXG4gIC8vIElmIHRoZSBwYXRoIGV4aXN0cywgcHVzaCBpdCBvbnRvIHRoZSBlbmQuXG4gIGlmIChwYXRoKSB7XG4gICAgdG9rZW5zLnB1c2gocGF0aClcbiAgfVxuXG4gIHJldHVybiB0b2tlbnNcbn1cblxuLyoqXG4gKiBDb21waWxlIGEgc3RyaW5nIHRvIGEgdGVtcGxhdGUgZnVuY3Rpb24gZm9yIHRoZSBwYXRoLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgc3RyXG4gKiBAcmV0dXJuIHshZnVuY3Rpb24oT2JqZWN0PSwgT2JqZWN0PSl9XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHN0cikge1xuICByZXR1cm4gdG9rZW5zVG9GdW5jdGlvbihwYXJzZShzdHIpKVxufVxuXG4vKipcbiAqIFByZXR0aWVyIGVuY29kaW5nIG9mIFVSSSBwYXRoIHNlZ21lbnRzLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ31cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZW5jb2RlVVJJQ29tcG9uZW50UHJldHR5IChzdHIpIHtcbiAgcmV0dXJuIGVuY29kZVVSSShzdHIpLnJlcGxhY2UoL1tcXC8/I10vZywgZnVuY3Rpb24gKGMpIHtcbiAgICByZXR1cm4gJyUnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gIH0pXG59XG5cbi8qKlxuICogRW5jb2RlIHRoZSBhc3RlcmlzayBwYXJhbWV0ZXIuIFNpbWlsYXIgdG8gYHByZXR0eWAsIGJ1dCBhbGxvd3Mgc2xhc2hlcy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVuY29kZUFzdGVyaXNrIChzdHIpIHtcbiAgcmV0dXJuIGVuY29kZVVSSShzdHIpLnJlcGxhY2UoL1s/I10vZywgZnVuY3Rpb24gKGMpIHtcbiAgICByZXR1cm4gJyUnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gIH0pXG59XG5cbi8qKlxuICogRXhwb3NlIGEgbWV0aG9kIGZvciB0cmFuc2Zvcm1pbmcgdG9rZW5zIGludG8gdGhlIHBhdGggZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvRnVuY3Rpb24gKHRva2Vucykge1xuICAvLyBDb21waWxlIGFsbCB0aGUgdG9rZW5zIGludG8gcmVnZXhwcy5cbiAgdmFyIG1hdGNoZXMgPSBuZXcgQXJyYXkodG9rZW5zLmxlbmd0aClcblxuICAvLyBDb21waWxlIGFsbCB0aGUgcGF0dGVybnMgYmVmb3JlIGNvbXBpbGF0aW9uLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0eXBlb2YgdG9rZW5zW2ldID09PSAnb2JqZWN0Jykge1xuICAgICAgbWF0Y2hlc1tpXSA9IG5ldyBSZWdFeHAoJ14oPzonICsgdG9rZW5zW2ldLnBhdHRlcm4gKyAnKSQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAob2JqLCBvcHRzKSB7XG4gICAgdmFyIHBhdGggPSAnJ1xuICAgIHZhciBkYXRhID0gb2JqIHx8IHt9XG4gICAgdmFyIG9wdGlvbnMgPSBvcHRzIHx8IHt9XG4gICAgdmFyIGVuY29kZSA9IG9wdGlvbnMucHJldHR5ID8gZW5jb2RlVVJJQ29tcG9uZW50UHJldHR5IDogZW5jb2RlVVJJQ29tcG9uZW50XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHBhdGggKz0gdG9rZW5cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgdmFsdWUgPSBkYXRhW3Rva2VuLm5hbWVdXG4gICAgICB2YXIgc2VnbWVudFxuXG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgICAvLyBQcmVwZW5kIHBhcnRpYWwgc2VnbWVudCBwcmVmaXhlcy5cbiAgICAgICAgICBpZiAodG9rZW4ucGFydGlhbCkge1xuICAgICAgICAgICAgcGF0aCArPSB0b2tlbi5wcmVmaXhcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gYmUgZGVmaW5lZCcpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzYXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGlmICghdG9rZW4ucmVwZWF0KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgcmVwZWF0LCBidXQgcmVjZWl2ZWQgYCcgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgKyAnYCcpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG5vdCBiZSBlbXB0eScpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWx1ZS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHNlZ21lbnQgPSBlbmNvZGUodmFsdWVbal0pXG5cbiAgICAgICAgICBpZiAoIW1hdGNoZXNbaV0udGVzdChzZWdtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYWxsIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbWF0Y2ggXCInICsgdG9rZW4ucGF0dGVybiArICdcIiwgYnV0IHJlY2VpdmVkIGAnICsgSlNPTi5zdHJpbmdpZnkoc2VnbWVudCkgKyAnYCcpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGF0aCArPSAoaiA9PT0gMCA/IHRva2VuLnByZWZpeCA6IHRva2VuLmRlbGltaXRlcikgKyBzZWdtZW50XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBzZWdtZW50ID0gdG9rZW4uYXN0ZXJpc2sgPyBlbmNvZGVBc3Rlcmlzayh2YWx1ZSkgOiBlbmNvZGUodmFsdWUpXG5cbiAgICAgIGlmICghbWF0Y2hlc1tpXS50ZXN0KHNlZ21lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbWF0Y2ggXCInICsgdG9rZW4ucGF0dGVybiArICdcIiwgYnV0IHJlY2VpdmVkIFwiJyArIHNlZ21lbnQgKyAnXCInKVxuICAgICAgfVxuXG4gICAgICBwYXRoICs9IHRva2VuLnByZWZpeCArIHNlZ21lbnRcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aFxuICB9XG59XG5cbi8qKlxuICogRXNjYXBlIGEgcmVndWxhciBleHByZXNzaW9uIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHN0clxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmcgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbLisqPz1eIToke30oKVtcXF18XFwvXFxcXF0pL2csICdcXFxcJDEnKVxufVxuXG4vKipcbiAqIEVzY2FwZSB0aGUgY2FwdHVyaW5nIGdyb3VwIGJ5IGVzY2FwaW5nIHNwZWNpYWwgY2hhcmFjdGVycyBhbmQgbWVhbmluZy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGdyb3VwXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZUdyb3VwIChncm91cCkge1xuICByZXR1cm4gZ3JvdXAucmVwbGFjZSgvKFs9ITokXFwvKCldKS9nLCAnXFxcXCQxJylcbn1cblxuLyoqXG4gKiBBdHRhY2ggdGhlIGtleXMgYXMgYSBwcm9wZXJ0eSBvZiB0aGUgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAgeyFSZWdFeHB9IHJlXG4gKiBAcGFyYW0gIHtBcnJheX0gICBrZXlzXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBhdHRhY2hLZXlzIChyZSwga2V5cykge1xuICByZS5rZXlzID0ga2V5c1xuICByZXR1cm4gcmVcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGZsYWdzIGZvciBhIHJlZ2V4cCBmcm9tIHRoZSBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmbGFncyAob3B0aW9ucykge1xuICByZXR1cm4gb3B0aW9ucy5zZW5zaXRpdmUgPyAnJyA6ICdpJ1xufVxuXG4vKipcbiAqIFB1bGwgb3V0IGtleXMgZnJvbSBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshUmVnRXhwfSBwYXRoXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiByZWdleHBUb1JlZ2V4cCAocGF0aCwga2V5cykge1xuICAvLyBVc2UgYSBuZWdhdGl2ZSBsb29rYWhlYWQgdG8gbWF0Y2ggb25seSBjYXB0dXJpbmcgZ3JvdXBzLlxuICB2YXIgZ3JvdXBzID0gcGF0aC5zb3VyY2UubWF0Y2goL1xcKCg/IVxcPykvZylcblxuICBpZiAoZ3JvdXBzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleXMucHVzaCh7XG4gICAgICAgIG5hbWU6IGksXG4gICAgICAgIHByZWZpeDogbnVsbCxcbiAgICAgICAgZGVsaW1pdGVyOiBudWxsLFxuICAgICAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgICAgIHJlcGVhdDogZmFsc2UsXG4gICAgICAgIHBhcnRpYWw6IGZhbHNlLFxuICAgICAgICBhc3RlcmlzazogZmFsc2UsXG4gICAgICAgIHBhdHRlcm46IG51bGxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocGF0aCwga2V5cylcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm0gYW4gYXJyYXkgaW50byBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gICBrZXlzXG4gKiBAcGFyYW0gIHshT2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBhcnJheVRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIHZhciBwYXJ0cyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgcGFydHMucHVzaChwYXRoVG9SZWdleHAocGF0aFtpXSwga2V5cywgb3B0aW9ucykuc291cmNlKVxuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJyg/OicgKyBwYXJ0cy5qb2luKCd8JykgKyAnKScsIGZsYWdzKG9wdGlvbnMpKVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHJlZ2V4cCwga2V5cylcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBwYXRoIHJlZ2V4cCBmcm9tIHN0cmluZyBpbnB1dC5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBwYXRoXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHshT2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBzdHJpbmdUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgdG9rZW5zID0gcGFyc2UocGF0aClcbiAgdmFyIHJlID0gdG9rZW5zVG9SZWdFeHAodG9rZW5zLCBvcHRpb25zKVxuXG4gIC8vIEF0dGFjaCBrZXlzIGJhY2sgdG8gdGhlIHJlZ2V4cC5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGtleXMucHVzaCh0b2tlbnNbaV0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocmUsIGtleXMpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgZnVuY3Rpb24gZm9yIHRha2luZyB0b2tlbnMgYW5kIHJldHVybmluZyBhIFJlZ0V4cC5cbiAqXG4gKiBAcGFyYW0gIHshQXJyYXl9ICB0b2tlbnNcbiAqIEBwYXJhbSAge09iamVjdD19IG9wdGlvbnNcbiAqIEByZXR1cm4geyFSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvUmVnRXhwICh0b2tlbnMsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cblxuICB2YXIgc3RyaWN0ID0gb3B0aW9ucy5zdHJpY3RcbiAgdmFyIGVuZCA9IG9wdGlvbnMuZW5kICE9PSBmYWxzZVxuICB2YXIgcm91dGUgPSAnJ1xuICB2YXIgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXVxuICB2YXIgZW5kc1dpdGhTbGFzaCA9IHR5cGVvZiBsYXN0VG9rZW4gPT09ICdzdHJpbmcnICYmIC9cXC8kLy50ZXN0KGxhc3RUb2tlbilcblxuICAvLyBJdGVyYXRlIG92ZXIgdGhlIHRva2VucyBhbmQgY3JlYXRlIG91ciByZWdleHAgc3RyaW5nLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJvdXRlICs9IGVzY2FwZVN0cmluZyh0b2tlbilcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHByZWZpeCA9IGVzY2FwZVN0cmluZyh0b2tlbi5wcmVmaXgpXG4gICAgICB2YXIgY2FwdHVyZSA9ICcoPzonICsgdG9rZW4ucGF0dGVybiArICcpJ1xuXG4gICAgICBpZiAodG9rZW4ucmVwZWF0KSB7XG4gICAgICAgIGNhcHR1cmUgKz0gJyg/OicgKyBwcmVmaXggKyBjYXB0dXJlICsgJykqJ1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgaWYgKCF0b2tlbi5wYXJ0aWFsKSB7XG4gICAgICAgICAgY2FwdHVyZSA9ICcoPzonICsgcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpKT8nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FwdHVyZSA9IHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKT8nXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhcHR1cmUgPSBwcmVmaXggKyAnKCcgKyBjYXB0dXJlICsgJyknXG4gICAgICB9XG5cbiAgICAgIHJvdXRlICs9IGNhcHR1cmVcbiAgICB9XG4gIH1cblxuICAvLyBJbiBub24tc3RyaWN0IG1vZGUgd2UgYWxsb3cgYSBzbGFzaCBhdCB0aGUgZW5kIG9mIG1hdGNoLiBJZiB0aGUgcGF0aCB0b1xuICAvLyBtYXRjaCBhbHJlYWR5IGVuZHMgd2l0aCBhIHNsYXNoLCB3ZSByZW1vdmUgaXQgZm9yIGNvbnNpc3RlbmN5LiBUaGUgc2xhc2hcbiAgLy8gaXMgdmFsaWQgYXQgdGhlIGVuZCBvZiBhIHBhdGggbWF0Y2gsIG5vdCBpbiB0aGUgbWlkZGxlLiBUaGlzIGlzIGltcG9ydGFudFxuICAvLyBpbiBub24tZW5kaW5nIG1vZGUsIHdoZXJlIFwiL3Rlc3QvXCIgc2hvdWxkbid0IG1hdGNoIFwiL3Rlc3QvL3JvdXRlXCIuXG4gIGlmICghc3RyaWN0KSB7XG4gICAgcm91dGUgPSAoZW5kc1dpdGhTbGFzaCA/IHJvdXRlLnNsaWNlKDAsIC0yKSA6IHJvdXRlKSArICcoPzpcXFxcLyg/PSQpKT8nXG4gIH1cblxuICBpZiAoZW5kKSB7XG4gICAgcm91dGUgKz0gJyQnXG4gIH0gZWxzZSB7XG4gICAgLy8gSW4gbm9uLWVuZGluZyBtb2RlLCB3ZSBuZWVkIHRoZSBjYXB0dXJpbmcgZ3JvdXBzIHRvIG1hdGNoIGFzIG11Y2ggYXNcbiAgICAvLyBwb3NzaWJsZSBieSB1c2luZyBhIHBvc2l0aXZlIGxvb2thaGVhZCB0byB0aGUgZW5kIG9yIG5leHQgcGF0aCBzZWdtZW50LlxuICAgIHJvdXRlICs9IHN0cmljdCAmJiBlbmRzV2l0aFNsYXNoID8gJycgOiAnKD89XFxcXC98JCknXG4gIH1cblxuICByZXR1cm4gbmV3IFJlZ0V4cCgnXicgKyByb3V0ZSwgZmxhZ3Mob3B0aW9ucykpXG59XG5cbi8qKlxuICogTm9ybWFsaXplIHRoZSBnaXZlbiBwYXRoIHN0cmluZywgcmV0dXJuaW5nIGEgcmVndWxhciBleHByZXNzaW9uLlxuICpcbiAqIEFuIGVtcHR5IGFycmF5IGNhbiBiZSBwYXNzZWQgaW4gZm9yIHRoZSBrZXlzLCB3aGljaCB3aWxsIGhvbGQgdGhlXG4gKiBwbGFjZWhvbGRlciBrZXkgZGVzY3JpcHRpb25zLiBGb3IgZXhhbXBsZSwgdXNpbmcgYC91c2VyLzppZGAsIGBrZXlzYCB3aWxsXG4gKiBjb250YWluIGBbeyBuYW1lOiAnaWQnLCBkZWxpbWl0ZXI6ICcvJywgb3B0aW9uYWw6IGZhbHNlLCByZXBlYXQ6IGZhbHNlIH1dYC5cbiAqXG4gKiBAcGFyYW0gIHsoc3RyaW5nfFJlZ0V4cHxBcnJheSl9IHBhdGhcbiAqIEBwYXJhbSAgeyhBcnJheXxPYmplY3QpPX0gICAgICAga2V5c1xuICogQHBhcmFtICB7T2JqZWN0PX0gICAgICAgICAgICAgICBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBwYXRoVG9SZWdleHAgKHBhdGgsIGtleXMsIG9wdGlvbnMpIHtcbiAga2V5cyA9IGtleXMgfHwgW11cblxuICBpZiAoIWlzYXJyYXkoa2V5cykpIHtcbiAgICBvcHRpb25zID0gLyoqIEB0eXBlIHshT2JqZWN0fSAqLyAoa2V5cylcbiAgICBrZXlzID0gW11cbiAgfSBlbHNlIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fVxuICB9XG5cbiAgaWYgKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gcmVnZXhwVG9SZWdleHAocGF0aCwgLyoqIEB0eXBlIHshQXJyYXl9ICovIChrZXlzKSlcbiAgfVxuXG4gIGlmIChpc2FycmF5KHBhdGgpKSB7XG4gICAgcmV0dXJuIGFycmF5VG9SZWdleHAoLyoqIEB0eXBlIHshQXJyYXl9ICovIChwYXRoKSwgLyoqIEB0eXBlIHshQXJyYXl9ICovIChrZXlzKSwgb3B0aW9ucylcbiAgfVxuXG4gIHJldHVybiBzdHJpbmdUb1JlZ2V4cCgvKiogQHR5cGUge3N0cmluZ30gKi8gKHBhdGgpLCAvKiogQHR5cGUgeyFBcnJheX0gKi8gKGtleXMpLCBvcHRpb25zKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIis3WkpwMFwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cC9pbmRleC5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJyKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIrN1pKcDBcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcGF0aC10by1yZWdleHAvbm9kZV9tb2R1bGVzL2lzYXJyYXkvaW5kZXguanNcIixcIi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcGF0aC10by1yZWdleHAvbm9kZV9tb2R1bGVzL2lzYXJyYXlcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgVGhlIFBvbHltZXIgUHJvamVjdCBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyBjb2RlIG1heSBvbmx5IGJlIHVzZWQgdW5kZXIgdGhlIEJTRCBzdHlsZSBsaWNlbnNlIGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBhdXRob3JzIG1heSBiZSBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQVVUSE9SUy50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgY29udHJpYnV0b3JzIG1heSBiZSBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQ09OVFJJQlVUT1JTLnR4dFxuICogQ29kZSBkaXN0cmlidXRlZCBieSBHb29nbGUgYXMgcGFydCBvZiB0aGUgcG9seW1lciBwcm9qZWN0IGlzIGFsc29cbiAqIHN1YmplY3QgdG8gYW4gYWRkaXRpb25hbCBJUCByaWdodHMgZ3JhbnQgZm91bmQgYXQgaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL1BBVEVOVFMudHh0XG4gKi9cbi8vIEB2ZXJzaW9uIDAuNy4yMlxuKGZ1bmN0aW9uKCkge1xuICB3aW5kb3cuV2ViQ29tcG9uZW50cyA9IHdpbmRvdy5XZWJDb21wb25lbnRzIHx8IHtcbiAgICBmbGFnczoge31cbiAgfTtcbiAgdmFyIGZpbGUgPSBcIndlYmNvbXBvbmVudHMuanNcIjtcbiAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3NjcmlwdFtzcmMqPVwiJyArIGZpbGUgKyAnXCJdJyk7XG4gIHZhciBmbGFncyA9IHt9O1xuICBpZiAoIWZsYWdzLm5vT3B0cykge1xuICAgIGxvY2F0aW9uLnNlYXJjaC5zbGljZSgxKS5zcGxpdChcIiZcIikuZm9yRWFjaChmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgIHZhciBwYXJ0cyA9IG9wdGlvbi5zcGxpdChcIj1cIik7XG4gICAgICB2YXIgbWF0Y2g7XG4gICAgICBpZiAocGFydHNbMF0gJiYgKG1hdGNoID0gcGFydHNbMF0ubWF0Y2goL3djLSguKykvKSkpIHtcbiAgICAgICAgZmxhZ3NbbWF0Y2hbMV1dID0gcGFydHNbMV0gfHwgdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoc2NyaXB0KSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgYTsgYSA9IHNjcmlwdC5hdHRyaWJ1dGVzW2ldOyBpKyspIHtcbiAgICAgICAgaWYgKGEubmFtZSAhPT0gXCJzcmNcIikge1xuICAgICAgICAgIGZsYWdzW2EubmFtZV0gPSBhLnZhbHVlIHx8IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGZsYWdzLmxvZyAmJiBmbGFncy5sb2cuc3BsaXQpIHtcbiAgICAgIHZhciBwYXJ0cyA9IGZsYWdzLmxvZy5zcGxpdChcIixcIik7XG4gICAgICBmbGFncy5sb2cgPSB7fTtcbiAgICAgIHBhcnRzLmZvckVhY2goZnVuY3Rpb24oZikge1xuICAgICAgICBmbGFncy5sb2dbZl0gPSB0cnVlO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZsYWdzLmxvZyA9IHt9O1xuICAgIH1cbiAgfVxuICBmbGFncy5zaGFkb3cgPSBmbGFncy5zaGFkb3cgfHwgZmxhZ3Muc2hhZG93ZG9tIHx8IGZsYWdzLnBvbHlmaWxsO1xuICBpZiAoZmxhZ3Muc2hhZG93ID09PSBcIm5hdGl2ZVwiKSB7XG4gICAgZmxhZ3Muc2hhZG93ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgZmxhZ3Muc2hhZG93ID0gZmxhZ3Muc2hhZG93IHx8ICFIVE1MRWxlbWVudC5wcm90b3R5cGUuY3JlYXRlU2hhZG93Um9vdDtcbiAgfVxuICBpZiAoZmxhZ3MucmVnaXN0ZXIpIHtcbiAgICB3aW5kb3cuQ3VzdG9tRWxlbWVudHMgPSB3aW5kb3cuQ3VzdG9tRWxlbWVudHMgfHwge1xuICAgICAgZmxhZ3M6IHt9XG4gICAgfTtcbiAgICB3aW5kb3cuQ3VzdG9tRWxlbWVudHMuZmxhZ3MucmVnaXN0ZXIgPSBmbGFncy5yZWdpc3RlcjtcbiAgfVxuICBXZWJDb21wb25lbnRzLmZsYWdzID0gZmxhZ3M7XG59KSgpO1xuXG5pZiAoV2ViQ29tcG9uZW50cy5mbGFncy5zaGFkb3cpIHtcbiAgaWYgKHR5cGVvZiBXZWFrTWFwID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xuICAgICAgdmFyIGNvdW50ZXIgPSBEYXRlLm5vdygpICUgMWU5O1xuICAgICAgdmFyIFdlYWtNYXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gXCJfX3N0XCIgKyAoTWF0aC5yYW5kb20oKSAqIDFlOSA+Pj4gMCkgKyAoY291bnRlcisrICsgXCJfX1wiKTtcbiAgICAgIH07XG4gICAgICBXZWFrTWFwLnByb3RvdHlwZSA9IHtcbiAgICAgICAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMubmFtZV07XG4gICAgICAgICAgaWYgKGVudHJ5ICYmIGVudHJ5WzBdID09PSBrZXkpIGVudHJ5WzFdID0gdmFsdWU7IGVsc2UgZGVmaW5lUHJvcGVydHkoa2V5LCB0aGlzLm5hbWUsIHtcbiAgICAgICAgICAgIHZhbHVlOiBbIGtleSwgdmFsdWUgXSxcbiAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgdmFyIGVudHJ5O1xuICAgICAgICAgIHJldHVybiAoZW50cnkgPSBrZXlbdGhpcy5uYW1lXSkgJiYgZW50cnlbMF0gPT09IGtleSA/IGVudHJ5WzFdIDogdW5kZWZpbmVkO1xuICAgICAgICB9LFxuICAgICAgICBcImRlbGV0ZVwiOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5uYW1lXTtcbiAgICAgICAgICBpZiAoIWVudHJ5IHx8IGVudHJ5WzBdICE9PSBrZXkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBlbnRyeVswXSA9IGVudHJ5WzFdID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBoYXM6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgIHZhciBlbnRyeSA9IGtleVt0aGlzLm5hbWVdO1xuICAgICAgICAgIGlmICghZW50cnkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICByZXR1cm4gZW50cnlbMF0gPT09IGtleTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHdpbmRvdy5XZWFrTWFwID0gV2Vha01hcDtcbiAgICB9KSgpO1xuICB9XG4gIHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCA9IHt9O1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgY29uc3RydWN0b3JUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIG5hdGl2ZVByb3RvdHlwZVRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgd3JhcHBlcnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGZ1bmN0aW9uIGRldGVjdEV2YWwoKSB7XG4gICAgICBpZiAodHlwZW9mIGNocm9tZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjaHJvbWUuYXBwICYmIGNocm9tZS5hcHAucnVudGltZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAobmF2aWdhdG9yLmdldERldmljZVN0b3JhZ2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIGYgPSBuZXcgRnVuY3Rpb24oXCJyZXR1cm4gdHJ1ZTtcIik7XG4gICAgICAgIHJldHVybiBmKCk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBoYXNFdmFsID0gZGV0ZWN0RXZhbCgpO1xuICAgIGZ1bmN0aW9uIGFzc2VydChiKSB7XG4gICAgICBpZiAoIWIpIHRocm93IG5ldyBFcnJvcihcIkFzc2VydGlvbiBmYWlsZWRcIik7XG4gICAgfVxuICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcbiAgICB2YXIgZ2V0T3duUHJvcGVydHlOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzO1xuICAgIHZhciBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yO1xuICAgIGZ1bmN0aW9uIG1peGluKHRvLCBmcm9tKSB7XG4gICAgICB2YXIgbmFtZXMgPSBnZXRPd25Qcm9wZXJ0eU5hbWVzKGZyb20pO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbmFtZSA9IG5hbWVzW2ldO1xuICAgICAgICBkZWZpbmVQcm9wZXJ0eSh0bywgbmFtZSwgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGZyb20sIG5hbWUpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0bztcbiAgICB9XG4gICAgZnVuY3Rpb24gbWl4aW5TdGF0aWNzKHRvLCBmcm9tKSB7XG4gICAgICB2YXIgbmFtZXMgPSBnZXRPd25Qcm9wZXJ0eU5hbWVzKGZyb20pO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbmFtZSA9IG5hbWVzW2ldO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgIGNhc2UgXCJhcmd1bWVudHNcIjpcbiAgICAgICAgIGNhc2UgXCJjYWxsZXJcIjpcbiAgICAgICAgIGNhc2UgXCJsZW5ndGhcIjpcbiAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG4gICAgICAgICBjYXNlIFwicHJvdG90eXBlXCI6XG4gICAgICAgICBjYXNlIFwidG9TdHJpbmdcIjpcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBkZWZpbmVQcm9wZXJ0eSh0bywgbmFtZSwgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGZyb20sIG5hbWUpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0bztcbiAgICB9XG4gICAgZnVuY3Rpb24gb25lT2Yob2JqZWN0LCBwcm9wZXJ0eU5hbWVzKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BlcnR5TmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHByb3BlcnR5TmFtZXNbaV0gaW4gb2JqZWN0KSByZXR1cm4gcHJvcGVydHlOYW1lc1tpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIG5vbkVudW1lcmFibGVEYXRhRGVzY3JpcHRvciA9IHtcbiAgICAgIHZhbHVlOiB1bmRlZmluZWQsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfTtcbiAgICBmdW5jdGlvbiBkZWZpbmVOb25FbnVtZXJhYmxlRGF0YVByb3BlcnR5KG9iamVjdCwgbmFtZSwgdmFsdWUpIHtcbiAgICAgIG5vbkVudW1lcmFibGVEYXRhRGVzY3JpcHRvci52YWx1ZSA9IHZhbHVlO1xuICAgICAgZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCBub25FbnVtZXJhYmxlRGF0YURlc2NyaXB0b3IpO1xuICAgIH1cbiAgICBnZXRPd25Qcm9wZXJ0eU5hbWVzKHdpbmRvdyk7XG4gICAgZnVuY3Rpb24gZ2V0V3JhcHBlckNvbnN0cnVjdG9yKG5vZGUsIG9wdF9pbnN0YW5jZSkge1xuICAgICAgdmFyIG5hdGl2ZVByb3RvdHlwZSA9IG5vZGUuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihub2RlKTtcbiAgICAgIGlmIChpc0ZpcmVmb3gpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBnZXRPd25Qcm9wZXJ0eU5hbWVzKG5hdGl2ZVByb3RvdHlwZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgbmF0aXZlUHJvdG90eXBlID0gbmF0aXZlUHJvdG90eXBlLl9fcHJvdG9fXztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFyIHdyYXBwZXJDb25zdHJ1Y3RvciA9IGNvbnN0cnVjdG9yVGFibGUuZ2V0KG5hdGl2ZVByb3RvdHlwZSk7XG4gICAgICBpZiAod3JhcHBlckNvbnN0cnVjdG9yKSByZXR1cm4gd3JhcHBlckNvbnN0cnVjdG9yO1xuICAgICAgdmFyIHBhcmVudFdyYXBwZXJDb25zdHJ1Y3RvciA9IGdldFdyYXBwZXJDb25zdHJ1Y3RvcihuYXRpdmVQcm90b3R5cGUpO1xuICAgICAgdmFyIEdlbmVyYXRlZFdyYXBwZXIgPSBjcmVhdGVXcmFwcGVyQ29uc3RydWN0b3IocGFyZW50V3JhcHBlckNvbnN0cnVjdG9yKTtcbiAgICAgIHJlZ2lzdGVySW50ZXJuYWwobmF0aXZlUHJvdG90eXBlLCBHZW5lcmF0ZWRXcmFwcGVyLCBvcHRfaW5zdGFuY2UpO1xuICAgICAgcmV0dXJuIEdlbmVyYXRlZFdyYXBwZXI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZEZvcndhcmRpbmdQcm9wZXJ0aWVzKG5hdGl2ZVByb3RvdHlwZSwgd3JhcHBlclByb3RvdHlwZSkge1xuICAgICAgaW5zdGFsbFByb3BlcnR5KG5hdGl2ZVByb3RvdHlwZSwgd3JhcHBlclByb3RvdHlwZSwgdHJ1ZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVySW5zdGFuY2VQcm9wZXJ0aWVzKHdyYXBwZXJQcm90b3R5cGUsIGluc3RhbmNlT2JqZWN0KSB7XG4gICAgICBpbnN0YWxsUHJvcGVydHkoaW5zdGFuY2VPYmplY3QsIHdyYXBwZXJQcm90b3R5cGUsIGZhbHNlKTtcbiAgICB9XG4gICAgdmFyIGlzRmlyZWZveCA9IC9GaXJlZm94Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICAgIHZhciBkdW1teURlc2NyaXB0b3IgPSB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge30sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHt9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgIH07XG4gICAgZnVuY3Rpb24gaXNFdmVudEhhbmRsZXJOYW1lKG5hbWUpIHtcbiAgICAgIHJldHVybiAvXm9uW2Etel0rJC8udGVzdChuYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNJZGVudGlmaWVyTmFtZShuYW1lKSB7XG4gICAgICByZXR1cm4gL15bYS16QS1aXyRdW2EtekEtWl8kMC05XSokLy50ZXN0KG5hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRHZXR0ZXIobmFtZSkge1xuICAgICAgcmV0dXJuIGhhc0V2YWwgJiYgaXNJZGVudGlmaWVyTmFtZShuYW1lKSA/IG5ldyBGdW5jdGlvbihcInJldHVybiB0aGlzLl9faW1wbDRjZjFlNzgyaGdfXy5cIiArIG5hbWUpIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9faW1wbDRjZjFlNzgyaGdfX1tuYW1lXTtcbiAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFNldHRlcihuYW1lKSB7XG4gICAgICByZXR1cm4gaGFzRXZhbCAmJiBpc0lkZW50aWZpZXJOYW1lKG5hbWUpID8gbmV3IEZ1bmN0aW9uKFwidlwiLCBcInRoaXMuX19pbXBsNGNmMWU3ODJoZ19fLlwiICsgbmFtZSArIFwiID0gdlwiKSA6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgdGhpcy5fX2ltcGw0Y2YxZTc4MmhnX19bbmFtZV0gPSB2O1xuICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0TWV0aG9kKG5hbWUpIHtcbiAgICAgIHJldHVybiBoYXNFdmFsICYmIGlzSWRlbnRpZmllck5hbWUobmFtZSkgPyBuZXcgRnVuY3Rpb24oXCJyZXR1cm4gdGhpcy5fX2ltcGw0Y2YxZTc4MmhnX18uXCIgKyBuYW1lICsgXCIuYXBwbHkodGhpcy5fX2ltcGw0Y2YxZTc4MmhnX18sIGFyZ3VtZW50cylcIikgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19pbXBsNGNmMWU3ODJoZ19fW25hbWVdLmFwcGx5KHRoaXMuX19pbXBsNGNmMWU3ODJoZ19fLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0RGVzY3JpcHRvcihzb3VyY2UsIG5hbWUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNvdXJjZSwgbmFtZSk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICByZXR1cm4gZHVtbXlEZXNjcmlwdG9yO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgaXNCcm9rZW5TYWZhcmkgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBkZXNjciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoTm9kZS5wcm90b3R5cGUsIFwibm9kZVR5cGVcIik7XG4gICAgICByZXR1cm4gZGVzY3IgJiYgIWRlc2NyLmdldCAmJiAhZGVzY3Iuc2V0O1xuICAgIH0oKTtcbiAgICBmdW5jdGlvbiBpbnN0YWxsUHJvcGVydHkoc291cmNlLCB0YXJnZXQsIGFsbG93TWV0aG9kLCBvcHRfYmxhY2tsaXN0KSB7XG4gICAgICB2YXIgbmFtZXMgPSBnZXRPd25Qcm9wZXJ0eU5hbWVzKHNvdXJjZSk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgIGlmIChuYW1lID09PSBcInBvbHltZXJCbGFja0xpc3RfXCIpIGNvbnRpbnVlO1xuICAgICAgICBpZiAobmFtZSBpbiB0YXJnZXQpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoc291cmNlLnBvbHltZXJCbGFja0xpc3RfICYmIHNvdXJjZS5wb2x5bWVyQmxhY2tMaXN0X1tuYW1lXSkgY29udGludWU7XG4gICAgICAgIGlmIChpc0ZpcmVmb3gpIHtcbiAgICAgICAgICBzb3VyY2UuX19sb29rdXBHZXR0ZXJfXyhuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGVzY3JpcHRvciA9IGdldERlc2NyaXB0b3Ioc291cmNlLCBuYW1lKTtcbiAgICAgICAgdmFyIGdldHRlciwgc2V0dGVyO1xuICAgICAgICBpZiAodHlwZW9mIGRlc2NyaXB0b3IudmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIGlmIChhbGxvd01ldGhvZCkge1xuICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gZ2V0TWV0aG9kKG5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNFdmVudCA9IGlzRXZlbnRIYW5kbGVyTmFtZShuYW1lKTtcbiAgICAgICAgaWYgKGlzRXZlbnQpIGdldHRlciA9IHNjb3BlLmdldEV2ZW50SGFuZGxlckdldHRlcihuYW1lKTsgZWxzZSBnZXR0ZXIgPSBnZXRHZXR0ZXIobmFtZSk7XG4gICAgICAgIGlmIChkZXNjcmlwdG9yLndyaXRhYmxlIHx8IGRlc2NyaXB0b3Iuc2V0IHx8IGlzQnJva2VuU2FmYXJpKSB7XG4gICAgICAgICAgaWYgKGlzRXZlbnQpIHNldHRlciA9IHNjb3BlLmdldEV2ZW50SGFuZGxlclNldHRlcihuYW1lKTsgZWxzZSBzZXR0ZXIgPSBnZXRTZXR0ZXIobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNvbmZpZ3VyYWJsZSA9IGlzQnJva2VuU2FmYXJpIHx8IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlO1xuICAgICAgICBkZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIG5hbWUsIHtcbiAgICAgICAgICBnZXQ6IGdldHRlcixcbiAgICAgICAgICBzZXQ6IHNldHRlcixcbiAgICAgICAgICBjb25maWd1cmFibGU6IGNvbmZpZ3VyYWJsZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiBkZXNjcmlwdG9yLmVudW1lcmFibGVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyKG5hdGl2ZUNvbnN0cnVjdG9yLCB3cmFwcGVyQ29uc3RydWN0b3IsIG9wdF9pbnN0YW5jZSkge1xuICAgICAgaWYgKG5hdGl2ZUNvbnN0cnVjdG9yID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIG5hdGl2ZVByb3RvdHlwZSA9IG5hdGl2ZUNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgICAgIHJlZ2lzdGVySW50ZXJuYWwobmF0aXZlUHJvdG90eXBlLCB3cmFwcGVyQ29uc3RydWN0b3IsIG9wdF9pbnN0YW5jZSk7XG4gICAgICBtaXhpblN0YXRpY3Mod3JhcHBlckNvbnN0cnVjdG9yLCBuYXRpdmVDb25zdHJ1Y3Rvcik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVySW50ZXJuYWwobmF0aXZlUHJvdG90eXBlLCB3cmFwcGVyQ29uc3RydWN0b3IsIG9wdF9pbnN0YW5jZSkge1xuICAgICAgdmFyIHdyYXBwZXJQcm90b3R5cGUgPSB3cmFwcGVyQ29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgICAgYXNzZXJ0KGNvbnN0cnVjdG9yVGFibGUuZ2V0KG5hdGl2ZVByb3RvdHlwZSkgPT09IHVuZGVmaW5lZCk7XG4gICAgICBjb25zdHJ1Y3RvclRhYmxlLnNldChuYXRpdmVQcm90b3R5cGUsIHdyYXBwZXJDb25zdHJ1Y3Rvcik7XG4gICAgICBuYXRpdmVQcm90b3R5cGVUYWJsZS5zZXQod3JhcHBlclByb3RvdHlwZSwgbmF0aXZlUHJvdG90eXBlKTtcbiAgICAgIGFkZEZvcndhcmRpbmdQcm9wZXJ0aWVzKG5hdGl2ZVByb3RvdHlwZSwgd3JhcHBlclByb3RvdHlwZSk7XG4gICAgICBpZiAob3B0X2luc3RhbmNlKSByZWdpc3Rlckluc3RhbmNlUHJvcGVydGllcyh3cmFwcGVyUHJvdG90eXBlLCBvcHRfaW5zdGFuY2UpO1xuICAgICAgZGVmaW5lTm9uRW51bWVyYWJsZURhdGFQcm9wZXJ0eSh3cmFwcGVyUHJvdG90eXBlLCBcImNvbnN0cnVjdG9yXCIsIHdyYXBwZXJDb25zdHJ1Y3Rvcik7XG4gICAgICB3cmFwcGVyQ29uc3RydWN0b3IucHJvdG90eXBlID0gd3JhcHBlclByb3RvdHlwZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNXcmFwcGVyRm9yKHdyYXBwZXJDb25zdHJ1Y3RvciwgbmF0aXZlQ29uc3RydWN0b3IpIHtcbiAgICAgIHJldHVybiBjb25zdHJ1Y3RvclRhYmxlLmdldChuYXRpdmVDb25zdHJ1Y3Rvci5wcm90b3R5cGUpID09PSB3cmFwcGVyQ29uc3RydWN0b3I7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyT2JqZWN0KG9iamVjdCkge1xuICAgICAgdmFyIG5hdGl2ZVByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpO1xuICAgICAgdmFyIHN1cGVyV3JhcHBlckNvbnN0cnVjdG9yID0gZ2V0V3JhcHBlckNvbnN0cnVjdG9yKG5hdGl2ZVByb3RvdHlwZSk7XG4gICAgICB2YXIgR2VuZXJhdGVkV3JhcHBlciA9IGNyZWF0ZVdyYXBwZXJDb25zdHJ1Y3RvcihzdXBlcldyYXBwZXJDb25zdHJ1Y3Rvcik7XG4gICAgICByZWdpc3RlckludGVybmFsKG5hdGl2ZVByb3RvdHlwZSwgR2VuZXJhdGVkV3JhcHBlciwgb2JqZWN0KTtcbiAgICAgIHJldHVybiBHZW5lcmF0ZWRXcmFwcGVyO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVXcmFwcGVyQ29uc3RydWN0b3Ioc3VwZXJXcmFwcGVyQ29uc3RydWN0b3IpIHtcbiAgICAgIGZ1bmN0aW9uIEdlbmVyYXRlZFdyYXBwZXIobm9kZSkge1xuICAgICAgICBzdXBlcldyYXBwZXJDb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIG5vZGUpO1xuICAgICAgfVxuICAgICAgdmFyIHAgPSBPYmplY3QuY3JlYXRlKHN1cGVyV3JhcHBlckNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG4gICAgICBwLmNvbnN0cnVjdG9yID0gR2VuZXJhdGVkV3JhcHBlcjtcbiAgICAgIEdlbmVyYXRlZFdyYXBwZXIucHJvdG90eXBlID0gcDtcbiAgICAgIHJldHVybiBHZW5lcmF0ZWRXcmFwcGVyO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc1dyYXBwZXIob2JqZWN0KSB7XG4gICAgICByZXR1cm4gb2JqZWN0ICYmIG9iamVjdC5fX2ltcGw0Y2YxZTc4MmhnX187XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzTmF0aXZlKG9iamVjdCkge1xuICAgICAgcmV0dXJuICFpc1dyYXBwZXIob2JqZWN0KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gd3JhcChpbXBsKSB7XG4gICAgICBpZiAoaW1wbCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgICBhc3NlcnQoaXNOYXRpdmUoaW1wbCkpO1xuICAgICAgdmFyIHdyYXBwZXIgPSBpbXBsLl9fd3JhcHBlcjhlM2RkOTNhNjBfXztcbiAgICAgIGlmICh3cmFwcGVyICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBwZXI7XG4gICAgICB9XG4gICAgICByZXR1cm4gaW1wbC5fX3dyYXBwZXI4ZTNkZDkzYTYwX18gPSBuZXcgKGdldFdyYXBwZXJDb25zdHJ1Y3RvcihpbXBsLCBpbXBsKSkoaW1wbCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVud3JhcCh3cmFwcGVyKSB7XG4gICAgICBpZiAod3JhcHBlciA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgICBhc3NlcnQoaXNXcmFwcGVyKHdyYXBwZXIpKTtcbiAgICAgIHJldHVybiB3cmFwcGVyLl9faW1wbDRjZjFlNzgyaGdfXztcbiAgICB9XG4gICAgZnVuY3Rpb24gdW5zYWZlVW53cmFwKHdyYXBwZXIpIHtcbiAgICAgIHJldHVybiB3cmFwcGVyLl9faW1wbDRjZjFlNzgyaGdfXztcbiAgICB9XG4gICAgZnVuY3Rpb24gc2V0V3JhcHBlcihpbXBsLCB3cmFwcGVyKSB7XG4gICAgICB3cmFwcGVyLl9faW1wbDRjZjFlNzgyaGdfXyA9IGltcGw7XG4gICAgICBpbXBsLl9fd3JhcHBlcjhlM2RkOTNhNjBfXyA9IHdyYXBwZXI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVud3JhcElmTmVlZGVkKG9iamVjdCkge1xuICAgICAgcmV0dXJuIG9iamVjdCAmJiBpc1dyYXBwZXIob2JqZWN0KSA/IHVud3JhcChvYmplY3QpIDogb2JqZWN0O1xuICAgIH1cbiAgICBmdW5jdGlvbiB3cmFwSWZOZWVkZWQob2JqZWN0KSB7XG4gICAgICByZXR1cm4gb2JqZWN0ICYmICFpc1dyYXBwZXIob2JqZWN0KSA/IHdyYXAob2JqZWN0KSA6IG9iamVjdDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmV3cmFwKG5vZGUsIHdyYXBwZXIpIHtcbiAgICAgIGlmICh3cmFwcGVyID09PSBudWxsKSByZXR1cm47XG4gICAgICBhc3NlcnQoaXNOYXRpdmUobm9kZSkpO1xuICAgICAgYXNzZXJ0KHdyYXBwZXIgPT09IHVuZGVmaW5lZCB8fCBpc1dyYXBwZXIod3JhcHBlcikpO1xuICAgICAgbm9kZS5fX3dyYXBwZXI4ZTNkZDkzYTYwX18gPSB3cmFwcGVyO1xuICAgIH1cbiAgICB2YXIgZ2V0dGVyRGVzY3JpcHRvciA9IHtcbiAgICAgIGdldDogdW5kZWZpbmVkLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgIH07XG4gICAgZnVuY3Rpb24gZGVmaW5lR2V0dGVyKGNvbnN0cnVjdG9yLCBuYW1lLCBnZXR0ZXIpIHtcbiAgICAgIGdldHRlckRlc2NyaXB0b3IuZ2V0ID0gZ2V0dGVyO1xuICAgICAgZGVmaW5lUHJvcGVydHkoY29uc3RydWN0b3IucHJvdG90eXBlLCBuYW1lLCBnZXR0ZXJEZXNjcmlwdG9yKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGVmaW5lV3JhcEdldHRlcihjb25zdHJ1Y3RvciwgbmFtZSkge1xuICAgICAgZGVmaW5lR2V0dGVyKGNvbnN0cnVjdG9yLCBuYW1lLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodGhpcy5fX2ltcGw0Y2YxZTc4MmhnX19bbmFtZV0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZvcndhcmRNZXRob2RzVG9XcmFwcGVyKGNvbnN0cnVjdG9ycywgbmFtZXMpIHtcbiAgICAgIGNvbnN0cnVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uKGNvbnN0cnVjdG9yKSB7XG4gICAgICAgIG5hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgIGNvbnN0cnVjdG9yLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHcgPSB3cmFwSWZOZWVkZWQodGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gd1tuYW1lXS5hcHBseSh3LCBhcmd1bWVudHMpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHNjb3BlLmFkZEZvcndhcmRpbmdQcm9wZXJ0aWVzID0gYWRkRm9yd2FyZGluZ1Byb3BlcnRpZXM7XG4gICAgc2NvcGUuYXNzZXJ0ID0gYXNzZXJ0O1xuICAgIHNjb3BlLmNvbnN0cnVjdG9yVGFibGUgPSBjb25zdHJ1Y3RvclRhYmxlO1xuICAgIHNjb3BlLmRlZmluZUdldHRlciA9IGRlZmluZUdldHRlcjtcbiAgICBzY29wZS5kZWZpbmVXcmFwR2V0dGVyID0gZGVmaW5lV3JhcEdldHRlcjtcbiAgICBzY29wZS5mb3J3YXJkTWV0aG9kc1RvV3JhcHBlciA9IGZvcndhcmRNZXRob2RzVG9XcmFwcGVyO1xuICAgIHNjb3BlLmlzSWRlbnRpZmllck5hbWUgPSBpc0lkZW50aWZpZXJOYW1lO1xuICAgIHNjb3BlLmlzV3JhcHBlciA9IGlzV3JhcHBlcjtcbiAgICBzY29wZS5pc1dyYXBwZXJGb3IgPSBpc1dyYXBwZXJGb3I7XG4gICAgc2NvcGUubWl4aW4gPSBtaXhpbjtcbiAgICBzY29wZS5uYXRpdmVQcm90b3R5cGVUYWJsZSA9IG5hdGl2ZVByb3RvdHlwZVRhYmxlO1xuICAgIHNjb3BlLm9uZU9mID0gb25lT2Y7XG4gICAgc2NvcGUucmVnaXN0ZXJPYmplY3QgPSByZWdpc3Rlck9iamVjdDtcbiAgICBzY29wZS5yZWdpc3RlcldyYXBwZXIgPSByZWdpc3RlcjtcbiAgICBzY29wZS5yZXdyYXAgPSByZXdyYXA7XG4gICAgc2NvcGUuc2V0V3JhcHBlciA9IHNldFdyYXBwZXI7XG4gICAgc2NvcGUudW5zYWZlVW53cmFwID0gdW5zYWZlVW53cmFwO1xuICAgIHNjb3BlLnVud3JhcCA9IHVud3JhcDtcbiAgICBzY29wZS51bndyYXBJZk5lZWRlZCA9IHVud3JhcElmTmVlZGVkO1xuICAgIHNjb3BlLndyYXAgPSB3cmFwO1xuICAgIHNjb3BlLndyYXBJZk5lZWRlZCA9IHdyYXBJZk5lZWRlZDtcbiAgICBzY29wZS53cmFwcGVycyA9IHdyYXBwZXJzO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBuZXdTcGxpY2UoaW5kZXgsIHJlbW92ZWQsIGFkZGVkQ291bnQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgcmVtb3ZlZDogcmVtb3ZlZCxcbiAgICAgICAgYWRkZWRDb3VudDogYWRkZWRDb3VudFxuICAgICAgfTtcbiAgICB9XG4gICAgdmFyIEVESVRfTEVBVkUgPSAwO1xuICAgIHZhciBFRElUX1VQREFURSA9IDE7XG4gICAgdmFyIEVESVRfQUREID0gMjtcbiAgICB2YXIgRURJVF9ERUxFVEUgPSAzO1xuICAgIGZ1bmN0aW9uIEFycmF5U3BsaWNlKCkge31cbiAgICBBcnJheVNwbGljZS5wcm90b3R5cGUgPSB7XG4gICAgICBjYWxjRWRpdERpc3RhbmNlczogZnVuY3Rpb24oY3VycmVudCwgY3VycmVudFN0YXJ0LCBjdXJyZW50RW5kLCBvbGQsIG9sZFN0YXJ0LCBvbGRFbmQpIHtcbiAgICAgICAgdmFyIHJvd0NvdW50ID0gb2xkRW5kIC0gb2xkU3RhcnQgKyAxO1xuICAgICAgICB2YXIgY29sdW1uQ291bnQgPSBjdXJyZW50RW5kIC0gY3VycmVudFN0YXJ0ICsgMTtcbiAgICAgICAgdmFyIGRpc3RhbmNlcyA9IG5ldyBBcnJheShyb3dDb3VudCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcm93Q291bnQ7IGkrKykge1xuICAgICAgICAgIGRpc3RhbmNlc1tpXSA9IG5ldyBBcnJheShjb2x1bW5Db3VudCk7XG4gICAgICAgICAgZGlzdGFuY2VzW2ldWzBdID0gaTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNvbHVtbkNvdW50OyBqKyspIGRpc3RhbmNlc1swXVtqXSA9IGo7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcm93Q291bnQ7IGkrKykge1xuICAgICAgICAgIGZvciAodmFyIGogPSAxOyBqIDwgY29sdW1uQ291bnQ7IGorKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuZXF1YWxzKGN1cnJlbnRbY3VycmVudFN0YXJ0ICsgaiAtIDFdLCBvbGRbb2xkU3RhcnQgKyBpIC0gMV0pKSBkaXN0YW5jZXNbaV1bal0gPSBkaXN0YW5jZXNbaSAtIDFdW2ogLSAxXTsgZWxzZSB7XG4gICAgICAgICAgICAgIHZhciBub3J0aCA9IGRpc3RhbmNlc1tpIC0gMV1bal0gKyAxO1xuICAgICAgICAgICAgICB2YXIgd2VzdCA9IGRpc3RhbmNlc1tpXVtqIC0gMV0gKyAxO1xuICAgICAgICAgICAgICBkaXN0YW5jZXNbaV1bal0gPSBub3J0aCA8IHdlc3QgPyBub3J0aCA6IHdlc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkaXN0YW5jZXM7XG4gICAgICB9LFxuICAgICAgc3BsaWNlT3BlcmF0aW9uc0Zyb21FZGl0RGlzdGFuY2VzOiBmdW5jdGlvbihkaXN0YW5jZXMpIHtcbiAgICAgICAgdmFyIGkgPSBkaXN0YW5jZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIGogPSBkaXN0YW5jZXNbMF0ubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIGN1cnJlbnQgPSBkaXN0YW5jZXNbaV1bal07XG4gICAgICAgIHZhciBlZGl0cyA9IFtdO1xuICAgICAgICB3aGlsZSAoaSA+IDAgfHwgaiA+IDApIHtcbiAgICAgICAgICBpZiAoaSA9PSAwKSB7XG4gICAgICAgICAgICBlZGl0cy5wdXNoKEVESVRfQUREKTtcbiAgICAgICAgICAgIGotLTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaiA9PSAwKSB7XG4gICAgICAgICAgICBlZGl0cy5wdXNoKEVESVRfREVMRVRFKTtcbiAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgbm9ydGhXZXN0ID0gZGlzdGFuY2VzW2kgLSAxXVtqIC0gMV07XG4gICAgICAgICAgdmFyIHdlc3QgPSBkaXN0YW5jZXNbaSAtIDFdW2pdO1xuICAgICAgICAgIHZhciBub3J0aCA9IGRpc3RhbmNlc1tpXVtqIC0gMV07XG4gICAgICAgICAgdmFyIG1pbjtcbiAgICAgICAgICBpZiAod2VzdCA8IG5vcnRoKSBtaW4gPSB3ZXN0IDwgbm9ydGhXZXN0ID8gd2VzdCA6IG5vcnRoV2VzdDsgZWxzZSBtaW4gPSBub3J0aCA8IG5vcnRoV2VzdCA/IG5vcnRoIDogbm9ydGhXZXN0O1xuICAgICAgICAgIGlmIChtaW4gPT0gbm9ydGhXZXN0KSB7XG4gICAgICAgICAgICBpZiAobm9ydGhXZXN0ID09IGN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgZWRpdHMucHVzaChFRElUX0xFQVZFKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGVkaXRzLnB1c2goRURJVF9VUERBVEUpO1xuICAgICAgICAgICAgICBjdXJyZW50ID0gbm9ydGhXZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgai0tO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWluID09IHdlc3QpIHtcbiAgICAgICAgICAgIGVkaXRzLnB1c2goRURJVF9ERUxFVEUpO1xuICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgY3VycmVudCA9IHdlc3Q7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVkaXRzLnB1c2goRURJVF9BREQpO1xuICAgICAgICAgICAgai0tO1xuICAgICAgICAgICAgY3VycmVudCA9IG5vcnRoO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlZGl0cy5yZXZlcnNlKCk7XG4gICAgICAgIHJldHVybiBlZGl0cztcbiAgICAgIH0sXG4gICAgICBjYWxjU3BsaWNlczogZnVuY3Rpb24oY3VycmVudCwgY3VycmVudFN0YXJ0LCBjdXJyZW50RW5kLCBvbGQsIG9sZFN0YXJ0LCBvbGRFbmQpIHtcbiAgICAgICAgdmFyIHByZWZpeENvdW50ID0gMDtcbiAgICAgICAgdmFyIHN1ZmZpeENvdW50ID0gMDtcbiAgICAgICAgdmFyIG1pbkxlbmd0aCA9IE1hdGgubWluKGN1cnJlbnRFbmQgLSBjdXJyZW50U3RhcnQsIG9sZEVuZCAtIG9sZFN0YXJ0KTtcbiAgICAgICAgaWYgKGN1cnJlbnRTdGFydCA9PSAwICYmIG9sZFN0YXJ0ID09IDApIHByZWZpeENvdW50ID0gdGhpcy5zaGFyZWRQcmVmaXgoY3VycmVudCwgb2xkLCBtaW5MZW5ndGgpO1xuICAgICAgICBpZiAoY3VycmVudEVuZCA9PSBjdXJyZW50Lmxlbmd0aCAmJiBvbGRFbmQgPT0gb2xkLmxlbmd0aCkgc3VmZml4Q291bnQgPSB0aGlzLnNoYXJlZFN1ZmZpeChjdXJyZW50LCBvbGQsIG1pbkxlbmd0aCAtIHByZWZpeENvdW50KTtcbiAgICAgICAgY3VycmVudFN0YXJ0ICs9IHByZWZpeENvdW50O1xuICAgICAgICBvbGRTdGFydCArPSBwcmVmaXhDb3VudDtcbiAgICAgICAgY3VycmVudEVuZCAtPSBzdWZmaXhDb3VudDtcbiAgICAgICAgb2xkRW5kIC09IHN1ZmZpeENvdW50O1xuICAgICAgICBpZiAoY3VycmVudEVuZCAtIGN1cnJlbnRTdGFydCA9PSAwICYmIG9sZEVuZCAtIG9sZFN0YXJ0ID09IDApIHJldHVybiBbXTtcbiAgICAgICAgaWYgKGN1cnJlbnRTdGFydCA9PSBjdXJyZW50RW5kKSB7XG4gICAgICAgICAgdmFyIHNwbGljZSA9IG5ld1NwbGljZShjdXJyZW50U3RhcnQsIFtdLCAwKTtcbiAgICAgICAgICB3aGlsZSAob2xkU3RhcnQgPCBvbGRFbmQpIHNwbGljZS5yZW1vdmVkLnB1c2gob2xkW29sZFN0YXJ0KytdKTtcbiAgICAgICAgICByZXR1cm4gWyBzcGxpY2UgXTtcbiAgICAgICAgfSBlbHNlIGlmIChvbGRTdGFydCA9PSBvbGRFbmQpIHJldHVybiBbIG5ld1NwbGljZShjdXJyZW50U3RhcnQsIFtdLCBjdXJyZW50RW5kIC0gY3VycmVudFN0YXJ0KSBdO1xuICAgICAgICB2YXIgb3BzID0gdGhpcy5zcGxpY2VPcGVyYXRpb25zRnJvbUVkaXREaXN0YW5jZXModGhpcy5jYWxjRWRpdERpc3RhbmNlcyhjdXJyZW50LCBjdXJyZW50U3RhcnQsIGN1cnJlbnRFbmQsIG9sZCwgb2xkU3RhcnQsIG9sZEVuZCkpO1xuICAgICAgICB2YXIgc3BsaWNlID0gdW5kZWZpbmVkO1xuICAgICAgICB2YXIgc3BsaWNlcyA9IFtdO1xuICAgICAgICB2YXIgaW5kZXggPSBjdXJyZW50U3RhcnQ7XG4gICAgICAgIHZhciBvbGRJbmRleCA9IG9sZFN0YXJ0O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHN3aXRjaCAob3BzW2ldKSB7XG4gICAgICAgICAgIGNhc2UgRURJVF9MRUFWRTpcbiAgICAgICAgICAgIGlmIChzcGxpY2UpIHtcbiAgICAgICAgICAgICAgc3BsaWNlcy5wdXNoKHNwbGljZSk7XG4gICAgICAgICAgICAgIHNwbGljZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICBvbGRJbmRleCsrO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgY2FzZSBFRElUX1VQREFURTpcbiAgICAgICAgICAgIGlmICghc3BsaWNlKSBzcGxpY2UgPSBuZXdTcGxpY2UoaW5kZXgsIFtdLCAwKTtcbiAgICAgICAgICAgIHNwbGljZS5hZGRlZENvdW50Kys7XG4gICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgc3BsaWNlLnJlbW92ZWQucHVzaChvbGRbb2xkSW5kZXhdKTtcbiAgICAgICAgICAgIG9sZEluZGV4Kys7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICBjYXNlIEVESVRfQUREOlxuICAgICAgICAgICAgaWYgKCFzcGxpY2UpIHNwbGljZSA9IG5ld1NwbGljZShpbmRleCwgW10sIDApO1xuICAgICAgICAgICAgc3BsaWNlLmFkZGVkQ291bnQrKztcbiAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICBjYXNlIEVESVRfREVMRVRFOlxuICAgICAgICAgICAgaWYgKCFzcGxpY2UpIHNwbGljZSA9IG5ld1NwbGljZShpbmRleCwgW10sIDApO1xuICAgICAgICAgICAgc3BsaWNlLnJlbW92ZWQucHVzaChvbGRbb2xkSW5kZXhdKTtcbiAgICAgICAgICAgIG9sZEluZGV4Kys7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNwbGljZSkge1xuICAgICAgICAgIHNwbGljZXMucHVzaChzcGxpY2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzcGxpY2VzO1xuICAgICAgfSxcbiAgICAgIHNoYXJlZFByZWZpeDogZnVuY3Rpb24oY3VycmVudCwgb2xkLCBzZWFyY2hMZW5ndGgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWFyY2hMZW5ndGg7IGkrKykgaWYgKCF0aGlzLmVxdWFscyhjdXJyZW50W2ldLCBvbGRbaV0pKSByZXR1cm4gaTtcbiAgICAgICAgcmV0dXJuIHNlYXJjaExlbmd0aDtcbiAgICAgIH0sXG4gICAgICBzaGFyZWRTdWZmaXg6IGZ1bmN0aW9uKGN1cnJlbnQsIG9sZCwgc2VhcmNoTGVuZ3RoKSB7XG4gICAgICAgIHZhciBpbmRleDEgPSBjdXJyZW50Lmxlbmd0aDtcbiAgICAgICAgdmFyIGluZGV4MiA9IG9sZC5sZW5ndGg7XG4gICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgIHdoaWxlIChjb3VudCA8IHNlYXJjaExlbmd0aCAmJiB0aGlzLmVxdWFscyhjdXJyZW50Wy0taW5kZXgxXSwgb2xkWy0taW5kZXgyXSkpIGNvdW50Kys7XG4gICAgICAgIHJldHVybiBjb3VudDtcbiAgICAgIH0sXG4gICAgICBjYWxjdWxhdGVTcGxpY2VzOiBmdW5jdGlvbihjdXJyZW50LCBwcmV2aW91cykge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWxjU3BsaWNlcyhjdXJyZW50LCAwLCBjdXJyZW50Lmxlbmd0aCwgcHJldmlvdXMsIDAsIHByZXZpb3VzLmxlbmd0aCk7XG4gICAgICB9LFxuICAgICAgZXF1YWxzOiBmdW5jdGlvbihjdXJyZW50VmFsdWUsIHByZXZpb3VzVmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRWYWx1ZSA9PT0gcHJldmlvdXNWYWx1ZTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHNjb3BlLkFycmF5U3BsaWNlID0gQXJyYXlTcGxpY2U7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIE9yaWdpbmFsTXV0YXRpb25PYnNlcnZlciA9IHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBjYWxsYmFja3MgPSBbXTtcbiAgICB2YXIgcGVuZGluZyA9IGZhbHNlO1xuICAgIHZhciB0aW1lckZ1bmM7XG4gICAgZnVuY3Rpb24gaGFuZGxlKCkge1xuICAgICAgcGVuZGluZyA9IGZhbHNlO1xuICAgICAgdmFyIGNvcGllcyA9IGNhbGxiYWNrcy5zbGljZSgwKTtcbiAgICAgIGNhbGxiYWNrcyA9IFtdO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3BpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgKDAsIGNvcGllc1tpXSkoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKE9yaWdpbmFsTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgdmFyIGNvdW50ZXIgPSAxO1xuICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE9yaWdpbmFsTXV0YXRpb25PYnNlcnZlcihoYW5kbGUpO1xuICAgICAgdmFyIHRleHROb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY291bnRlcik7XG4gICAgICBvYnNlcnZlci5vYnNlcnZlKHRleHROb2RlLCB7XG4gICAgICAgIGNoYXJhY3RlckRhdGE6IHRydWVcbiAgICAgIH0pO1xuICAgICAgdGltZXJGdW5jID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvdW50ZXIgPSAoY291bnRlciArIDEpICUgMjtcbiAgICAgICAgdGV4dE5vZGUuZGF0YSA9IGNvdW50ZXI7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aW1lckZ1bmMgPSB3aW5kb3cuc2V0VGltZW91dDtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2V0RW5kT2ZNaWNyb3Rhc2soZnVuYykge1xuICAgICAgY2FsbGJhY2tzLnB1c2goZnVuYyk7XG4gICAgICBpZiAocGVuZGluZykgcmV0dXJuO1xuICAgICAgcGVuZGluZyA9IHRydWU7XG4gICAgICB0aW1lckZ1bmMoaGFuZGxlLCAwKTtcbiAgICB9XG4gICAgY29udGV4dC5zZXRFbmRPZk1pY3JvdGFzayA9IHNldEVuZE9mTWljcm90YXNrO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgc2V0RW5kT2ZNaWNyb3Rhc2sgPSBzY29wZS5zZXRFbmRPZk1pY3JvdGFzaztcbiAgICB2YXIgd3JhcElmTmVlZGVkID0gc2NvcGUud3JhcElmTmVlZGVkO1xuICAgIHZhciB3cmFwcGVycyA9IHNjb3BlLndyYXBwZXJzO1xuICAgIHZhciByZWdpc3RyYXRpb25zVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBnbG9iYWxNdXRhdGlvbk9ic2VydmVycyA9IFtdO1xuICAgIHZhciBpc1NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIGZ1bmN0aW9uIHNjaGVkdWxlQ2FsbGJhY2sob2JzZXJ2ZXIpIHtcbiAgICAgIGlmIChvYnNlcnZlci5zY2hlZHVsZWRfKSByZXR1cm47XG4gICAgICBvYnNlcnZlci5zY2hlZHVsZWRfID0gdHJ1ZTtcbiAgICAgIGdsb2JhbE11dGF0aW9uT2JzZXJ2ZXJzLnB1c2gob2JzZXJ2ZXIpO1xuICAgICAgaWYgKGlzU2NoZWR1bGVkKSByZXR1cm47XG4gICAgICBzZXRFbmRPZk1pY3JvdGFzayhub3RpZnlPYnNlcnZlcnMpO1xuICAgICAgaXNTY2hlZHVsZWQgPSB0cnVlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBub3RpZnlPYnNlcnZlcnMoKSB7XG4gICAgICBpc1NjaGVkdWxlZCA9IGZhbHNlO1xuICAgICAgd2hpbGUgKGdsb2JhbE11dGF0aW9uT2JzZXJ2ZXJzLmxlbmd0aCkge1xuICAgICAgICB2YXIgbm90aWZ5TGlzdCA9IGdsb2JhbE11dGF0aW9uT2JzZXJ2ZXJzO1xuICAgICAgICBnbG9iYWxNdXRhdGlvbk9ic2VydmVycyA9IFtdO1xuICAgICAgICBub3RpZnlMaXN0LnNvcnQoZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICAgIHJldHVybiB4LnVpZF8gLSB5LnVpZF87XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vdGlmeUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgbW8gPSBub3RpZnlMaXN0W2ldO1xuICAgICAgICAgIG1vLnNjaGVkdWxlZF8gPSBmYWxzZTtcbiAgICAgICAgICB2YXIgcXVldWUgPSBtby50YWtlUmVjb3JkcygpO1xuICAgICAgICAgIHJlbW92ZVRyYW5zaWVudE9ic2VydmVyc0Zvcihtbyk7XG4gICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgbW8uY2FsbGJhY2tfKHF1ZXVlLCBtbyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIE11dGF0aW9uUmVjb3JkKHR5cGUsIHRhcmdldCkge1xuICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgdGhpcy5hZGRlZE5vZGVzID0gbmV3IHdyYXBwZXJzLk5vZGVMaXN0KCk7XG4gICAgICB0aGlzLnJlbW92ZWROb2RlcyA9IG5ldyB3cmFwcGVycy5Ob2RlTGlzdCgpO1xuICAgICAgdGhpcy5wcmV2aW91c1NpYmxpbmcgPSBudWxsO1xuICAgICAgdGhpcy5uZXh0U2libGluZyA9IG51bGw7XG4gICAgICB0aGlzLmF0dHJpYnV0ZU5hbWUgPSBudWxsO1xuICAgICAgdGhpcy5hdHRyaWJ1dGVOYW1lc3BhY2UgPSBudWxsO1xuICAgICAgdGhpcy5vbGRWYWx1ZSA9IG51bGw7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyVHJhbnNpZW50T2JzZXJ2ZXJzKGFuY2VzdG9yLCBub2RlKSB7XG4gICAgICBmb3IgKDthbmNlc3RvcjsgYW5jZXN0b3IgPSBhbmNlc3Rvci5wYXJlbnROb2RlKSB7XG4gICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChhbmNlc3Rvcik7XG4gICAgICAgIGlmICghcmVnaXN0cmF0aW9ucykgY29udGludWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2ldO1xuICAgICAgICAgIGlmIChyZWdpc3RyYXRpb24ub3B0aW9ucy5zdWJ0cmVlKSByZWdpc3RyYXRpb24uYWRkVHJhbnNpZW50T2JzZXJ2ZXIobm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzRm9yKG9ic2VydmVyKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9ic2VydmVyLm5vZGVzXy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbm9kZSA9IG9ic2VydmVyLm5vZGVzX1tpXTtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIHJldHVybjtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbal07XG4gICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbi5vYnNlcnZlciA9PT0gb2JzZXJ2ZXIpIHJlZ2lzdHJhdGlvbi5yZW1vdmVUcmFuc2llbnRPYnNlcnZlcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBlbnF1ZXVlTXV0YXRpb24odGFyZ2V0LCB0eXBlLCBkYXRhKSB7XG4gICAgICB2YXIgaW50ZXJlc3RlZE9ic2VydmVycyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICB2YXIgYXNzb2NpYXRlZFN0cmluZ3MgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgZm9yICh2YXIgbm9kZSA9IHRhcmdldDsgbm9kZTsgbm9kZSA9IG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICAgIGlmICghcmVnaXN0cmF0aW9ucykgY29udGludWU7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHZhciByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2pdO1xuICAgICAgICAgIHZhciBvcHRpb25zID0gcmVnaXN0cmF0aW9uLm9wdGlvbnM7XG4gICAgICAgICAgaWYgKG5vZGUgIT09IHRhcmdldCAmJiAhb3B0aW9ucy5zdWJ0cmVlKSBjb250aW51ZTtcbiAgICAgICAgICBpZiAodHlwZSA9PT0gXCJhdHRyaWJ1dGVzXCIgJiYgIW9wdGlvbnMuYXR0cmlidXRlcykgY29udGludWU7XG4gICAgICAgICAgaWYgKHR5cGUgPT09IFwiYXR0cmlidXRlc1wiICYmIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyICYmIChkYXRhLm5hbWVzcGFjZSAhPT0gbnVsbCB8fCBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5pbmRleE9mKGRhdGEubmFtZSkgPT09IC0xKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlID09PSBcImNoYXJhY3RlckRhdGFcIiAmJiAhb3B0aW9ucy5jaGFyYWN0ZXJEYXRhKSBjb250aW51ZTtcbiAgICAgICAgICBpZiAodHlwZSA9PT0gXCJjaGlsZExpc3RcIiAmJiAhb3B0aW9ucy5jaGlsZExpc3QpIGNvbnRpbnVlO1xuICAgICAgICAgIHZhciBvYnNlcnZlciA9IHJlZ2lzdHJhdGlvbi5vYnNlcnZlcjtcbiAgICAgICAgICBpbnRlcmVzdGVkT2JzZXJ2ZXJzW29ic2VydmVyLnVpZF9dID0gb2JzZXJ2ZXI7XG4gICAgICAgICAgaWYgKHR5cGUgPT09IFwiYXR0cmlidXRlc1wiICYmIG9wdGlvbnMuYXR0cmlidXRlT2xkVmFsdWUgfHwgdHlwZSA9PT0gXCJjaGFyYWN0ZXJEYXRhXCIgJiYgb3B0aW9ucy5jaGFyYWN0ZXJEYXRhT2xkVmFsdWUpIHtcbiAgICAgICAgICAgIGFzc29jaWF0ZWRTdHJpbmdzW29ic2VydmVyLnVpZF9dID0gZGF0YS5vbGRWYWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAodmFyIHVpZCBpbiBpbnRlcmVzdGVkT2JzZXJ2ZXJzKSB7XG4gICAgICAgIHZhciBvYnNlcnZlciA9IGludGVyZXN0ZWRPYnNlcnZlcnNbdWlkXTtcbiAgICAgICAgdmFyIHJlY29yZCA9IG5ldyBNdXRhdGlvblJlY29yZCh0eXBlLCB0YXJnZXQpO1xuICAgICAgICBpZiAoXCJuYW1lXCIgaW4gZGF0YSAmJiBcIm5hbWVzcGFjZVwiIGluIGRhdGEpIHtcbiAgICAgICAgICByZWNvcmQuYXR0cmlidXRlTmFtZSA9IGRhdGEubmFtZTtcbiAgICAgICAgICByZWNvcmQuYXR0cmlidXRlTmFtZXNwYWNlID0gZGF0YS5uYW1lc3BhY2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEuYWRkZWROb2RlcykgcmVjb3JkLmFkZGVkTm9kZXMgPSBkYXRhLmFkZGVkTm9kZXM7XG4gICAgICAgIGlmIChkYXRhLnJlbW92ZWROb2RlcykgcmVjb3JkLnJlbW92ZWROb2RlcyA9IGRhdGEucmVtb3ZlZE5vZGVzO1xuICAgICAgICBpZiAoZGF0YS5wcmV2aW91c1NpYmxpbmcpIHJlY29yZC5wcmV2aW91c1NpYmxpbmcgPSBkYXRhLnByZXZpb3VzU2libGluZztcbiAgICAgICAgaWYgKGRhdGEubmV4dFNpYmxpbmcpIHJlY29yZC5uZXh0U2libGluZyA9IGRhdGEubmV4dFNpYmxpbmc7XG4gICAgICAgIGlmIChhc3NvY2lhdGVkU3RyaW5nc1t1aWRdICE9PSB1bmRlZmluZWQpIHJlY29yZC5vbGRWYWx1ZSA9IGFzc29jaWF0ZWRTdHJpbmdzW3VpZF07XG4gICAgICAgIHNjaGVkdWxlQ2FsbGJhY2sob2JzZXJ2ZXIpO1xuICAgICAgICBvYnNlcnZlci5yZWNvcmRzXy5wdXNoKHJlY29yZCk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbiAgICBmdW5jdGlvbiBNdXRhdGlvbk9ic2VydmVyT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgICB0aGlzLmNoaWxkTGlzdCA9ICEhb3B0aW9ucy5jaGlsZExpc3Q7XG4gICAgICB0aGlzLnN1YnRyZWUgPSAhIW9wdGlvbnMuc3VidHJlZTtcbiAgICAgIGlmICghKFwiYXR0cmlidXRlc1wiIGluIG9wdGlvbnMpICYmIChcImF0dHJpYnV0ZU9sZFZhbHVlXCIgaW4gb3B0aW9ucyB8fCBcImF0dHJpYnV0ZUZpbHRlclwiIGluIG9wdGlvbnMpKSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMgPSAhIW9wdGlvbnMuYXR0cmlidXRlcztcbiAgICAgIH1cbiAgICAgIGlmIChcImNoYXJhY3RlckRhdGFPbGRWYWx1ZVwiIGluIG9wdGlvbnMgJiYgIShcImNoYXJhY3RlckRhdGFcIiBpbiBvcHRpb25zKSkgdGhpcy5jaGFyYWN0ZXJEYXRhID0gdHJ1ZTsgZWxzZSB0aGlzLmNoYXJhY3RlckRhdGEgPSAhIW9wdGlvbnMuY2hhcmFjdGVyRGF0YTtcbiAgICAgIGlmICghdGhpcy5hdHRyaWJ1dGVzICYmIChvcHRpb25zLmF0dHJpYnV0ZU9sZFZhbHVlIHx8IFwiYXR0cmlidXRlRmlsdGVyXCIgaW4gb3B0aW9ucykgfHwgIXRoaXMuY2hhcmFjdGVyRGF0YSAmJiBvcHRpb25zLmNoYXJhY3RlckRhdGFPbGRWYWx1ZSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmNoYXJhY3RlckRhdGEgPSAhIW9wdGlvbnMuY2hhcmFjdGVyRGF0YTtcbiAgICAgIHRoaXMuYXR0cmlidXRlT2xkVmFsdWUgPSAhIW9wdGlvbnMuYXR0cmlidXRlT2xkVmFsdWU7XG4gICAgICB0aGlzLmNoYXJhY3RlckRhdGFPbGRWYWx1ZSA9ICEhb3B0aW9ucy5jaGFyYWN0ZXJEYXRhT2xkVmFsdWU7XG4gICAgICBpZiAoXCJhdHRyaWJ1dGVGaWx0ZXJcIiBpbiBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZUZpbHRlciA9PSBudWxsIHx8IHR5cGVvZiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlciAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmF0dHJpYnV0ZUZpbHRlciA9IHNsaWNlLmNhbGwob3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVGaWx0ZXIgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgdWlkQ291bnRlciA9IDA7XG4gICAgZnVuY3Rpb24gTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjaykge1xuICAgICAgdGhpcy5jYWxsYmFja18gPSBjYWxsYmFjaztcbiAgICAgIHRoaXMubm9kZXNfID0gW107XG4gICAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgICB0aGlzLnVpZF8gPSArK3VpZENvdW50ZXI7XG4gICAgICB0aGlzLnNjaGVkdWxlZF8gPSBmYWxzZTtcbiAgICB9XG4gICAgTXV0YXRpb25PYnNlcnZlci5wcm90b3R5cGUgPSB7XG4gICAgICBjb25zdHJ1Y3RvcjogTXV0YXRpb25PYnNlcnZlcixcbiAgICAgIG9ic2VydmU6IGZ1bmN0aW9uKHRhcmdldCwgb3B0aW9ucykge1xuICAgICAgICB0YXJnZXQgPSB3cmFwSWZOZWVkZWQodGFyZ2V0KTtcbiAgICAgICAgdmFyIG5ld09wdGlvbnMgPSBuZXcgTXV0YXRpb25PYnNlcnZlck9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIHZhciByZWdpc3RyYXRpb247XG4gICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldCh0YXJnZXQpO1xuICAgICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIHJlZ2lzdHJhdGlvbnNUYWJsZS5zZXQodGFyZ2V0LCByZWdpc3RyYXRpb25zID0gW10pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uc1tpXS5vYnNlcnZlciA9PT0gdGhpcykge1xuICAgICAgICAgICAgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tpXTtcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbi5yZW1vdmVUcmFuc2llbnRPYnNlcnZlcnMoKTtcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbi5vcHRpb25zID0gbmV3T3B0aW9ucztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFyZWdpc3RyYXRpb24pIHtcbiAgICAgICAgICByZWdpc3RyYXRpb24gPSBuZXcgUmVnaXN0cmF0aW9uKHRoaXMsIHRhcmdldCwgbmV3T3B0aW9ucyk7XG4gICAgICAgICAgcmVnaXN0cmF0aW9ucy5wdXNoKHJlZ2lzdHJhdGlvbik7XG4gICAgICAgICAgdGhpcy5ub2Rlc18ucHVzaCh0YXJnZXQpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZGlzY29ubmVjdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubm9kZXNfLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2ldO1xuICAgICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbi5vYnNlcnZlciA9PT0gdGhpcykge1xuICAgICAgICAgICAgICByZWdpc3RyYXRpb25zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgdGhpcy5yZWNvcmRzXyA9IFtdO1xuICAgICAgfSxcbiAgICAgIHRha2VSZWNvcmRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvcHlPZlJlY29yZHMgPSB0aGlzLnJlY29yZHNfO1xuICAgICAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgICAgIHJldHVybiBjb3B5T2ZSZWNvcmRzO1xuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gUmVnaXN0cmF0aW9uKG9ic2VydmVyLCB0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMub2JzZXJ2ZXIgPSBvYnNlcnZlcjtcbiAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IFtdO1xuICAgIH1cbiAgICBSZWdpc3RyYXRpb24ucHJvdG90eXBlID0ge1xuICAgICAgYWRkVHJhbnNpZW50T2JzZXJ2ZXI6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUgPT09IHRoaXMudGFyZ2V0KSByZXR1cm47XG4gICAgICAgIHNjaGVkdWxlQ2FsbGJhY2sodGhpcy5vYnNlcnZlcik7XG4gICAgICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICAgIGlmICghcmVnaXN0cmF0aW9ucykgcmVnaXN0cmF0aW9uc1RhYmxlLnNldChub2RlLCByZWdpc3RyYXRpb25zID0gW10pO1xuICAgICAgICByZWdpc3RyYXRpb25zLnB1c2godGhpcyk7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRyYW5zaWVudE9ic2VydmVkTm9kZXMgPSB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXM7XG4gICAgICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRyYW5zaWVudE9ic2VydmVkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgbm9kZSA9IHRyYW5zaWVudE9ic2VydmVkTm9kZXNbaV07XG4gICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbnNbal0gPT09IHRoaXMpIHtcbiAgICAgICAgICAgICAgcmVnaXN0cmF0aW9ucy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgc2NvcGUuZW5xdWV1ZU11dGF0aW9uID0gZW5xdWV1ZU11dGF0aW9uO1xuICAgIHNjb3BlLnJlZ2lzdGVyVHJhbnNpZW50T2JzZXJ2ZXJzID0gcmVnaXN0ZXJUcmFuc2llbnRPYnNlcnZlcnM7XG4gICAgc2NvcGUud3JhcHBlcnMuTXV0YXRpb25PYnNlcnZlciA9IE11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgc2NvcGUud3JhcHBlcnMuTXV0YXRpb25SZWNvcmQgPSBNdXRhdGlvblJlY29yZDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZnVuY3Rpb24gVHJlZVNjb3BlKHJvb3QsIHBhcmVudCkge1xuICAgICAgdGhpcy5yb290ID0gcm9vdDtcbiAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIH1cbiAgICBUcmVlU2NvcGUucHJvdG90eXBlID0ge1xuICAgICAgZ2V0IHJlbmRlcmVyKCkge1xuICAgICAgICBpZiAodGhpcy5yb290IGluc3RhbmNlb2Ygc2NvcGUud3JhcHBlcnMuU2hhZG93Um9vdCkge1xuICAgICAgICAgIHJldHVybiBzY29wZS5nZXRSZW5kZXJlckZvckhvc3QodGhpcy5yb290Lmhvc3QpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSxcbiAgICAgIGNvbnRhaW5zOiBmdW5jdGlvbih0cmVlU2NvcGUpIHtcbiAgICAgICAgZm9yICg7dHJlZVNjb3BlOyB0cmVlU2NvcGUgPSB0cmVlU2NvcGUucGFyZW50KSB7XG4gICAgICAgICAgaWYgKHRyZWVTY29wZSA9PT0gdGhpcykgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gc2V0VHJlZVNjb3BlKG5vZGUsIHRyZWVTY29wZSkge1xuICAgICAgaWYgKG5vZGUudHJlZVNjb3BlXyAhPT0gdHJlZVNjb3BlKSB7XG4gICAgICAgIG5vZGUudHJlZVNjb3BlXyA9IHRyZWVTY29wZTtcbiAgICAgICAgZm9yICh2YXIgc3IgPSBub2RlLnNoYWRvd1Jvb3Q7IHNyOyBzciA9IHNyLm9sZGVyU2hhZG93Um9vdCkge1xuICAgICAgICAgIHNyLnRyZWVTY29wZV8ucGFyZW50ID0gdHJlZVNjb3BlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgIHNldFRyZWVTY29wZShjaGlsZCwgdHJlZVNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRUcmVlU2NvcGUobm9kZSkge1xuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBzY29wZS53cmFwcGVycy5XaW5kb3cpIHtcbiAgICAgICAgZGVidWdnZXI7XG4gICAgICB9XG4gICAgICBpZiAobm9kZS50cmVlU2NvcGVfKSByZXR1cm4gbm9kZS50cmVlU2NvcGVfO1xuICAgICAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgIHZhciB0cmVlU2NvcGU7XG4gICAgICBpZiAocGFyZW50KSB0cmVlU2NvcGUgPSBnZXRUcmVlU2NvcGUocGFyZW50KTsgZWxzZSB0cmVlU2NvcGUgPSBuZXcgVHJlZVNjb3BlKG5vZGUsIG51bGwpO1xuICAgICAgcmV0dXJuIG5vZGUudHJlZVNjb3BlXyA9IHRyZWVTY29wZTtcbiAgICB9XG4gICAgc2NvcGUuVHJlZVNjb3BlID0gVHJlZVNjb3BlO1xuICAgIHNjb3BlLmdldFRyZWVTY29wZSA9IGdldFRyZWVTY29wZTtcbiAgICBzY29wZS5zZXRUcmVlU2NvcGUgPSBzZXRUcmVlU2NvcGU7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBmb3J3YXJkTWV0aG9kc1RvV3JhcHBlciA9IHNjb3BlLmZvcndhcmRNZXRob2RzVG9XcmFwcGVyO1xuICAgIHZhciBnZXRUcmVlU2NvcGUgPSBzY29wZS5nZXRUcmVlU2NvcGU7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgc2V0V3JhcHBlciA9IHNjb3BlLnNldFdyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgd3JhcHBlcnMgPSBzY29wZS53cmFwcGVycztcbiAgICB2YXIgd3JhcHBlZEZ1bnMgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBsaXN0ZW5lcnNUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIGhhbmRsZWRFdmVudHNUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIGN1cnJlbnRseURpc3BhdGNoaW5nRXZlbnRzID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgdGFyZ2V0VGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBjdXJyZW50VGFyZ2V0VGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciByZWxhdGVkVGFyZ2V0VGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBldmVudFBoYXNlVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBzdG9wUHJvcGFnYXRpb25UYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvblRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgZXZlbnRIYW5kbGVyc1RhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgZXZlbnRQYXRoVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIGZ1bmN0aW9uIGlzU2hhZG93Um9vdChub2RlKSB7XG4gICAgICByZXR1cm4gbm9kZSBpbnN0YW5jZW9mIHdyYXBwZXJzLlNoYWRvd1Jvb3Q7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJvb3RPZk5vZGUobm9kZSkge1xuICAgICAgcmV0dXJuIGdldFRyZWVTY29wZShub2RlKS5yb290O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRFdmVudFBhdGgobm9kZSwgZXZlbnQpIHtcbiAgICAgIHZhciBwYXRoID0gW107XG4gICAgICB2YXIgY3VycmVudCA9IG5vZGU7XG4gICAgICBwYXRoLnB1c2goY3VycmVudCk7XG4gICAgICB3aGlsZSAoY3VycmVudCkge1xuICAgICAgICB2YXIgZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMgPSBnZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyhjdXJyZW50KTtcbiAgICAgICAgaWYgKGRlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzICYmIGRlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaW5zZXJ0aW9uUG9pbnQgPSBkZXN0aW5hdGlvbkluc2VydGlvblBvaW50c1tpXTtcbiAgICAgICAgICAgIGlmIChpc1NoYWRvd0luc2VydGlvblBvaW50KGluc2VydGlvblBvaW50KSkge1xuICAgICAgICAgICAgICB2YXIgc2hhZG93Um9vdCA9IHJvb3RPZk5vZGUoaW5zZXJ0aW9uUG9pbnQpO1xuICAgICAgICAgICAgICB2YXIgb2xkZXJTaGFkb3dSb290ID0gc2hhZG93Um9vdC5vbGRlclNoYWRvd1Jvb3Q7XG4gICAgICAgICAgICAgIGlmIChvbGRlclNoYWRvd1Jvb3QpIHBhdGgucHVzaChvbGRlclNoYWRvd1Jvb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGF0aC5wdXNoKGluc2VydGlvblBvaW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VycmVudCA9IGRlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzW2Rlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChpc1NoYWRvd1Jvb3QoY3VycmVudCkpIHtcbiAgICAgICAgICAgIGlmIChpblNhbWVUcmVlKG5vZGUsIGN1cnJlbnQpICYmIGV2ZW50TXVzdEJlU3RvcHBlZChldmVudCkpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5ob3N0O1xuICAgICAgICAgICAgcGF0aC5wdXNoKGN1cnJlbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnQpIHBhdGgucHVzaChjdXJyZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cbiAgICBmdW5jdGlvbiBldmVudE11c3RCZVN0b3BwZWQoZXZlbnQpIHtcbiAgICAgIGlmICghZXZlbnQpIHJldHVybiBmYWxzZTtcbiAgICAgIHN3aXRjaCAoZXZlbnQudHlwZSkge1xuICAgICAgIGNhc2UgXCJhYm9ydFwiOlxuICAgICAgIGNhc2UgXCJlcnJvclwiOlxuICAgICAgIGNhc2UgXCJzZWxlY3RcIjpcbiAgICAgICBjYXNlIFwiY2hhbmdlXCI6XG4gICAgICAgY2FzZSBcImxvYWRcIjpcbiAgICAgICBjYXNlIFwicmVzZXRcIjpcbiAgICAgICBjYXNlIFwicmVzaXplXCI6XG4gICAgICAgY2FzZSBcInNjcm9sbFwiOlxuICAgICAgIGNhc2UgXCJzZWxlY3RzdGFydFwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNTaGFkb3dJbnNlcnRpb25Qb2ludChub2RlKSB7XG4gICAgICByZXR1cm4gbm9kZSBpbnN0YW5jZW9mIEhUTUxTaGFkb3dFbGVtZW50O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyhub2RlKSB7XG4gICAgICByZXR1cm4gc2NvcGUuZ2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMobm9kZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGV2ZW50UmV0YXJnZXR0aW5nKHBhdGgsIGN1cnJlbnRUYXJnZXQpIHtcbiAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGN1cnJlbnRUYXJnZXQ7XG4gICAgICBpZiAoY3VycmVudFRhcmdldCBpbnN0YW5jZW9mIHdyYXBwZXJzLldpbmRvdykgY3VycmVudFRhcmdldCA9IGN1cnJlbnRUYXJnZXQuZG9jdW1lbnQ7XG4gICAgICB2YXIgY3VycmVudFRhcmdldFRyZWUgPSBnZXRUcmVlU2NvcGUoY3VycmVudFRhcmdldCk7XG4gICAgICB2YXIgb3JpZ2luYWxUYXJnZXQgPSBwYXRoWzBdO1xuICAgICAgdmFyIG9yaWdpbmFsVGFyZ2V0VHJlZSA9IGdldFRyZWVTY29wZShvcmlnaW5hbFRhcmdldCk7XG4gICAgICB2YXIgcmVsYXRpdmVUYXJnZXRUcmVlID0gbG93ZXN0Q29tbW9uSW5jbHVzaXZlQW5jZXN0b3IoY3VycmVudFRhcmdldFRyZWUsIG9yaWdpbmFsVGFyZ2V0VHJlZSk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5vZGUgPSBwYXRoW2ldO1xuICAgICAgICBpZiAoZ2V0VHJlZVNjb3BlKG5vZGUpID09PSByZWxhdGl2ZVRhcmdldFRyZWUpIHJldHVybiBub2RlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0VHJlZVNjb3BlQW5jZXN0b3JzKHRyZWVTY29wZSkge1xuICAgICAgdmFyIGFuY2VzdG9ycyA9IFtdO1xuICAgICAgZm9yICg7dHJlZVNjb3BlOyB0cmVlU2NvcGUgPSB0cmVlU2NvcGUucGFyZW50KSB7XG4gICAgICAgIGFuY2VzdG9ycy5wdXNoKHRyZWVTY29wZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYW5jZXN0b3JzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBsb3dlc3RDb21tb25JbmNsdXNpdmVBbmNlc3Rvcih0c0EsIHRzQikge1xuICAgICAgdmFyIGFuY2VzdG9yc0EgPSBnZXRUcmVlU2NvcGVBbmNlc3RvcnModHNBKTtcbiAgICAgIHZhciBhbmNlc3RvcnNCID0gZ2V0VHJlZVNjb3BlQW5jZXN0b3JzKHRzQik7XG4gICAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICAgIHdoaWxlIChhbmNlc3RvcnNBLmxlbmd0aCA+IDAgJiYgYW5jZXN0b3JzQi5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBhID0gYW5jZXN0b3JzQS5wb3AoKTtcbiAgICAgICAgdmFyIGIgPSBhbmNlc3RvcnNCLnBvcCgpO1xuICAgICAgICBpZiAoYSA9PT0gYikgcmVzdWx0ID0gYTsgZWxzZSBicmVhaztcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFRyZWVTY29wZVJvb3QodHMpIHtcbiAgICAgIGlmICghdHMucGFyZW50KSByZXR1cm4gdHM7XG4gICAgICByZXR1cm4gZ2V0VHJlZVNjb3BlUm9vdCh0cy5wYXJlbnQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZWxhdGVkVGFyZ2V0UmVzb2x1dGlvbihldmVudCwgY3VycmVudFRhcmdldCwgcmVsYXRlZFRhcmdldCkge1xuICAgICAgaWYgKGN1cnJlbnRUYXJnZXQgaW5zdGFuY2VvZiB3cmFwcGVycy5XaW5kb3cpIGN1cnJlbnRUYXJnZXQgPSBjdXJyZW50VGFyZ2V0LmRvY3VtZW50O1xuICAgICAgdmFyIGN1cnJlbnRUYXJnZXRUcmVlID0gZ2V0VHJlZVNjb3BlKGN1cnJlbnRUYXJnZXQpO1xuICAgICAgdmFyIHJlbGF0ZWRUYXJnZXRUcmVlID0gZ2V0VHJlZVNjb3BlKHJlbGF0ZWRUYXJnZXQpO1xuICAgICAgdmFyIHJlbGF0ZWRUYXJnZXRFdmVudFBhdGggPSBnZXRFdmVudFBhdGgocmVsYXRlZFRhcmdldCwgZXZlbnQpO1xuICAgICAgdmFyIGxvd2VzdENvbW1vbkFuY2VzdG9yVHJlZTtcbiAgICAgIHZhciBsb3dlc3RDb21tb25BbmNlc3RvclRyZWUgPSBsb3dlc3RDb21tb25JbmNsdXNpdmVBbmNlc3RvcihjdXJyZW50VGFyZ2V0VHJlZSwgcmVsYXRlZFRhcmdldFRyZWUpO1xuICAgICAgaWYgKCFsb3dlc3RDb21tb25BbmNlc3RvclRyZWUpIGxvd2VzdENvbW1vbkFuY2VzdG9yVHJlZSA9IHJlbGF0ZWRUYXJnZXRUcmVlLnJvb3Q7XG4gICAgICBmb3IgKHZhciBjb21tb25BbmNlc3RvclRyZWUgPSBsb3dlc3RDb21tb25BbmNlc3RvclRyZWU7IGNvbW1vbkFuY2VzdG9yVHJlZTsgY29tbW9uQW5jZXN0b3JUcmVlID0gY29tbW9uQW5jZXN0b3JUcmVlLnBhcmVudCkge1xuICAgICAgICB2YXIgYWRqdXN0ZWRSZWxhdGVkVGFyZ2V0O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlbGF0ZWRUYXJnZXRFdmVudFBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgbm9kZSA9IHJlbGF0ZWRUYXJnZXRFdmVudFBhdGhbaV07XG4gICAgICAgICAgaWYgKGdldFRyZWVTY29wZShub2RlKSA9PT0gY29tbW9uQW5jZXN0b3JUcmVlKSByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGluU2FtZVRyZWUoYSwgYikge1xuICAgICAgcmV0dXJuIGdldFRyZWVTY29wZShhKSA9PT0gZ2V0VHJlZVNjb3BlKGIpO1xuICAgIH1cbiAgICB2YXIgTk9ORSA9IDA7XG4gICAgdmFyIENBUFRVUklOR19QSEFTRSA9IDE7XG4gICAgdmFyIEFUX1RBUkdFVCA9IDI7XG4gICAgdmFyIEJVQkJMSU5HX1BIQVNFID0gMztcbiAgICB2YXIgcGVuZGluZ0Vycm9yO1xuICAgIGZ1bmN0aW9uIGRpc3BhdGNoT3JpZ2luYWxFdmVudChvcmlnaW5hbEV2ZW50KSB7XG4gICAgICBpZiAoaGFuZGxlZEV2ZW50c1RhYmxlLmdldChvcmlnaW5hbEV2ZW50KSkgcmV0dXJuO1xuICAgICAgaGFuZGxlZEV2ZW50c1RhYmxlLnNldChvcmlnaW5hbEV2ZW50LCB0cnVlKTtcbiAgICAgIGRpc3BhdGNoRXZlbnQod3JhcChvcmlnaW5hbEV2ZW50KSwgd3JhcChvcmlnaW5hbEV2ZW50LnRhcmdldCkpO1xuICAgICAgaWYgKHBlbmRpbmdFcnJvcikge1xuICAgICAgICB2YXIgZXJyID0gcGVuZGluZ0Vycm9yO1xuICAgICAgICBwZW5kaW5nRXJyb3IgPSBudWxsO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzTG9hZExpa2VFdmVudChldmVudCkge1xuICAgICAgc3dpdGNoIChldmVudC50eXBlKSB7XG4gICAgICAgY2FzZSBcImxvYWRcIjpcbiAgICAgICBjYXNlIFwiYmVmb3JldW5sb2FkXCI6XG4gICAgICAgY2FzZSBcInVubG9hZFwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzcGF0Y2hFdmVudChldmVudCwgb3JpZ2luYWxXcmFwcGVyVGFyZ2V0KSB7XG4gICAgICBpZiAoY3VycmVudGx5RGlzcGF0Y2hpbmdFdmVudHMuZ2V0KGV2ZW50KSkgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZFN0YXRlRXJyb3JcIik7XG4gICAgICBjdXJyZW50bHlEaXNwYXRjaGluZ0V2ZW50cy5zZXQoZXZlbnQsIHRydWUpO1xuICAgICAgc2NvcGUucmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgdmFyIGV2ZW50UGF0aDtcbiAgICAgIHZhciBvdmVycmlkZVRhcmdldDtcbiAgICAgIHZhciB3aW47XG4gICAgICBpZiAoaXNMb2FkTGlrZUV2ZW50KGV2ZW50KSAmJiAhZXZlbnQuYnViYmxlcykge1xuICAgICAgICB2YXIgZG9jID0gb3JpZ2luYWxXcmFwcGVyVGFyZ2V0O1xuICAgICAgICBpZiAoZG9jIGluc3RhbmNlb2Ygd3JhcHBlcnMuRG9jdW1lbnQgJiYgKHdpbiA9IGRvYy5kZWZhdWx0VmlldykpIHtcbiAgICAgICAgICBvdmVycmlkZVRhcmdldCA9IGRvYztcbiAgICAgICAgICBldmVudFBhdGggPSBbXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFldmVudFBhdGgpIHtcbiAgICAgICAgaWYgKG9yaWdpbmFsV3JhcHBlclRhcmdldCBpbnN0YW5jZW9mIHdyYXBwZXJzLldpbmRvdykge1xuICAgICAgICAgIHdpbiA9IG9yaWdpbmFsV3JhcHBlclRhcmdldDtcbiAgICAgICAgICBldmVudFBhdGggPSBbXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBldmVudFBhdGggPSBnZXRFdmVudFBhdGgob3JpZ2luYWxXcmFwcGVyVGFyZ2V0LCBldmVudCk7XG4gICAgICAgICAgaWYgKCFpc0xvYWRMaWtlRXZlbnQoZXZlbnQpKSB7XG4gICAgICAgICAgICB2YXIgZG9jID0gZXZlbnRQYXRoW2V2ZW50UGF0aC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmIChkb2MgaW5zdGFuY2VvZiB3cmFwcGVycy5Eb2N1bWVudCkgd2luID0gZG9jLmRlZmF1bHRWaWV3O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZXZlbnRQYXRoVGFibGUuc2V0KGV2ZW50LCBldmVudFBhdGgpO1xuICAgICAgaWYgKGRpc3BhdGNoQ2FwdHVyaW5nKGV2ZW50LCBldmVudFBhdGgsIHdpbiwgb3ZlcnJpZGVUYXJnZXQpKSB7XG4gICAgICAgIGlmIChkaXNwYXRjaEF0VGFyZ2V0KGV2ZW50LCBldmVudFBhdGgsIHdpbiwgb3ZlcnJpZGVUYXJnZXQpKSB7XG4gICAgICAgICAgZGlzcGF0Y2hCdWJibGluZyhldmVudCwgZXZlbnRQYXRoLCB3aW4sIG92ZXJyaWRlVGFyZ2V0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZXZlbnRQaGFzZVRhYmxlLnNldChldmVudCwgTk9ORSk7XG4gICAgICBjdXJyZW50VGFyZ2V0VGFibGUuZGVsZXRlKGV2ZW50LCBudWxsKTtcbiAgICAgIGN1cnJlbnRseURpc3BhdGNoaW5nRXZlbnRzLmRlbGV0ZShldmVudCk7XG4gICAgICByZXR1cm4gZXZlbnQuZGVmYXVsdFByZXZlbnRlZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzcGF0Y2hDYXB0dXJpbmcoZXZlbnQsIGV2ZW50UGF0aCwgd2luLCBvdmVycmlkZVRhcmdldCkge1xuICAgICAgdmFyIHBoYXNlID0gQ0FQVFVSSU5HX1BIQVNFO1xuICAgICAgaWYgKHdpbikge1xuICAgICAgICBpZiAoIWludm9rZSh3aW4sIGV2ZW50LCBwaGFzZSwgZXZlbnRQYXRoLCBvdmVycmlkZVRhcmdldCkpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGkgPSBldmVudFBhdGgubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICBpZiAoIWludm9rZShldmVudFBhdGhbaV0sIGV2ZW50LCBwaGFzZSwgZXZlbnRQYXRoLCBvdmVycmlkZVRhcmdldCkpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkaXNwYXRjaEF0VGFyZ2V0KGV2ZW50LCBldmVudFBhdGgsIHdpbiwgb3ZlcnJpZGVUYXJnZXQpIHtcbiAgICAgIHZhciBwaGFzZSA9IEFUX1RBUkdFVDtcbiAgICAgIHZhciBjdXJyZW50VGFyZ2V0ID0gZXZlbnRQYXRoWzBdIHx8IHdpbjtcbiAgICAgIHJldHVybiBpbnZva2UoY3VycmVudFRhcmdldCwgZXZlbnQsIHBoYXNlLCBldmVudFBhdGgsIG92ZXJyaWRlVGFyZ2V0KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzcGF0Y2hCdWJibGluZyhldmVudCwgZXZlbnRQYXRoLCB3aW4sIG92ZXJyaWRlVGFyZ2V0KSB7XG4gICAgICB2YXIgcGhhc2UgPSBCVUJCTElOR19QSEFTRTtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgZXZlbnRQYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghaW52b2tlKGV2ZW50UGF0aFtpXSwgZXZlbnQsIHBoYXNlLCBldmVudFBhdGgsIG92ZXJyaWRlVGFyZ2V0KSkgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHdpbiAmJiBldmVudFBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgICBpbnZva2Uod2luLCBldmVudCwgcGhhc2UsIGV2ZW50UGF0aCwgb3ZlcnJpZGVUYXJnZXQpO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBpbnZva2UoY3VycmVudFRhcmdldCwgZXZlbnQsIHBoYXNlLCBldmVudFBhdGgsIG92ZXJyaWRlVGFyZ2V0KSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gbGlzdGVuZXJzVGFibGUuZ2V0KGN1cnJlbnRUYXJnZXQpO1xuICAgICAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybiB0cnVlO1xuICAgICAgdmFyIHRhcmdldCA9IG92ZXJyaWRlVGFyZ2V0IHx8IGV2ZW50UmV0YXJnZXR0aW5nKGV2ZW50UGF0aCwgY3VycmVudFRhcmdldCk7XG4gICAgICBpZiAodGFyZ2V0ID09PSBjdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgIGlmIChwaGFzZSA9PT0gQ0FQVFVSSU5HX1BIQVNFKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKHBoYXNlID09PSBCVUJCTElOR19QSEFTRSkgcGhhc2UgPSBBVF9UQVJHRVQ7XG4gICAgICB9IGVsc2UgaWYgKHBoYXNlID09PSBCVUJCTElOR19QSEFTRSAmJiAhZXZlbnQuYnViYmxlcykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChcInJlbGF0ZWRUYXJnZXRcIiBpbiBldmVudCkge1xuICAgICAgICB2YXIgb3JpZ2luYWxFdmVudCA9IHVud3JhcChldmVudCk7XG4gICAgICAgIHZhciB1bndyYXBwZWRSZWxhdGVkVGFyZ2V0ID0gb3JpZ2luYWxFdmVudC5yZWxhdGVkVGFyZ2V0O1xuICAgICAgICBpZiAodW53cmFwcGVkUmVsYXRlZFRhcmdldCkge1xuICAgICAgICAgIGlmICh1bndyYXBwZWRSZWxhdGVkVGFyZ2V0IGluc3RhbmNlb2YgT2JqZWN0ICYmIHVud3JhcHBlZFJlbGF0ZWRUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgdmFyIHJlbGF0ZWRUYXJnZXQgPSB3cmFwKHVud3JhcHBlZFJlbGF0ZWRUYXJnZXQpO1xuICAgICAgICAgICAgdmFyIGFkanVzdGVkID0gcmVsYXRlZFRhcmdldFJlc29sdXRpb24oZXZlbnQsIGN1cnJlbnRUYXJnZXQsIHJlbGF0ZWRUYXJnZXQpO1xuICAgICAgICAgICAgaWYgKGFkanVzdGVkID09PSB0YXJnZXQpIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhZGp1c3RlZCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlbGF0ZWRUYXJnZXRUYWJsZS5zZXQoZXZlbnQsIGFkanVzdGVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZXZlbnRQaGFzZVRhYmxlLnNldChldmVudCwgcGhhc2UpO1xuICAgICAgdmFyIHR5cGUgPSBldmVudC50eXBlO1xuICAgICAgdmFyIGFueVJlbW92ZWQgPSBmYWxzZTtcbiAgICAgIHRhcmdldFRhYmxlLnNldChldmVudCwgdGFyZ2V0KTtcbiAgICAgIGN1cnJlbnRUYXJnZXRUYWJsZS5zZXQoZXZlbnQsIGN1cnJlbnRUYXJnZXQpO1xuICAgICAgbGlzdGVuZXJzLmRlcHRoKys7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lciA9IGxpc3RlbmVyc1tpXTtcbiAgICAgICAgaWYgKGxpc3RlbmVyLnJlbW92ZWQpIHtcbiAgICAgICAgICBhbnlSZW1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGlzdGVuZXIudHlwZSAhPT0gdHlwZSB8fCAhbGlzdGVuZXIuY2FwdHVyZSAmJiBwaGFzZSA9PT0gQ0FQVFVSSU5HX1BIQVNFIHx8IGxpc3RlbmVyLmNhcHR1cmUgJiYgcGhhc2UgPT09IEJVQkJMSU5HX1BIQVNFKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyLmhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIikgbGlzdGVuZXIuaGFuZGxlci5jYWxsKGN1cnJlbnRUYXJnZXQsIGV2ZW50KTsgZWxzZSBsaXN0ZW5lci5oYW5kbGVyLmhhbmRsZUV2ZW50KGV2ZW50KTtcbiAgICAgICAgICBpZiAoc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uVGFibGUuZ2V0KGV2ZW50KSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIGlmICghcGVuZGluZ0Vycm9yKSBwZW5kaW5nRXJyb3IgPSBleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGlzdGVuZXJzLmRlcHRoLS07XG4gICAgICBpZiAoYW55UmVtb3ZlZCAmJiBsaXN0ZW5lcnMuZGVwdGggPT09IDApIHtcbiAgICAgICAgdmFyIGNvcHkgPSBsaXN0ZW5lcnMuc2xpY2UoKTtcbiAgICAgICAgbGlzdGVuZXJzLmxlbmd0aCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29weS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICghY29weVtpXS5yZW1vdmVkKSBsaXN0ZW5lcnMucHVzaChjb3B5W2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuICFzdG9wUHJvcGFnYXRpb25UYWJsZS5nZXQoZXZlbnQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCBjYXB0dXJlKSB7XG4gICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgdGhpcy5oYW5kbGVyID0gaGFuZGxlcjtcbiAgICAgIHRoaXMuY2FwdHVyZSA9IEJvb2xlYW4oY2FwdHVyZSk7XG4gICAgfVxuICAgIExpc3RlbmVyLnByb3RvdHlwZSA9IHtcbiAgICAgIGVxdWFsczogZnVuY3Rpb24odGhhdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVyID09PSB0aGF0LmhhbmRsZXIgJiYgdGhpcy50eXBlID09PSB0aGF0LnR5cGUgJiYgdGhpcy5jYXB0dXJlID09PSB0aGF0LmNhcHR1cmU7XG4gICAgICB9LFxuICAgICAgZ2V0IHJlbW92ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZXIgPT09IG51bGw7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVyID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBPcmlnaW5hbEV2ZW50ID0gd2luZG93LkV2ZW50O1xuICAgIE9yaWdpbmFsRXZlbnQucHJvdG90eXBlLnBvbHltZXJCbGFja0xpc3RfID0ge1xuICAgICAgcmV0dXJuVmFsdWU6IHRydWUsXG4gICAgICBrZXlMb2NhdGlvbjogdHJ1ZVxuICAgIH07XG4gICAgZnVuY3Rpb24gRXZlbnQodHlwZSwgb3B0aW9ucykge1xuICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBPcmlnaW5hbEV2ZW50KSB7XG4gICAgICAgIHZhciBpbXBsID0gdHlwZTtcbiAgICAgICAgaWYgKCFPcmlnaW5hbEJlZm9yZVVubG9hZEV2ZW50ICYmIGltcGwudHlwZSA9PT0gXCJiZWZvcmV1bmxvYWRcIiAmJiAhKHRoaXMgaW5zdGFuY2VvZiBCZWZvcmVVbmxvYWRFdmVudCkpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IEJlZm9yZVVubG9hZEV2ZW50KGltcGwpO1xuICAgICAgICB9XG4gICAgICAgIHNldFdyYXBwZXIoaW1wbCwgdGhpcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gd3JhcChjb25zdHJ1Y3RFdmVudChPcmlnaW5hbEV2ZW50LCBcIkV2ZW50XCIsIHR5cGUsIG9wdGlvbnMpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgRXZlbnQucHJvdG90eXBlID0ge1xuICAgICAgZ2V0IHRhcmdldCgpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldFRhYmxlLmdldCh0aGlzKTtcbiAgICAgIH0sXG4gICAgICBnZXQgY3VycmVudFRhcmdldCgpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRUYXJnZXRUYWJsZS5nZXQodGhpcyk7XG4gICAgICB9LFxuICAgICAgZ2V0IGV2ZW50UGhhc2UoKSB7XG4gICAgICAgIHJldHVybiBldmVudFBoYXNlVGFibGUuZ2V0KHRoaXMpO1xuICAgICAgfSxcbiAgICAgIGdldCBwYXRoKCkge1xuICAgICAgICB2YXIgZXZlbnRQYXRoID0gZXZlbnRQYXRoVGFibGUuZ2V0KHRoaXMpO1xuICAgICAgICBpZiAoIWV2ZW50UGF0aCkgcmV0dXJuIFtdO1xuICAgICAgICByZXR1cm4gZXZlbnRQYXRoLnNsaWNlKCk7XG4gICAgICB9LFxuICAgICAgc3RvcFByb3BhZ2F0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgc3RvcFByb3BhZ2F0aW9uVGFibGUuc2V0KHRoaXMsIHRydWUpO1xuICAgICAgfSxcbiAgICAgIHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHN0b3BQcm9wYWdhdGlvblRhYmxlLnNldCh0aGlzLCB0cnVlKTtcbiAgICAgICAgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uVGFibGUuc2V0KHRoaXMsIHRydWUpO1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIHN1cHBvcnRzRGVmYXVsdFByZXZlbnRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkV2ZW50XCIpO1xuICAgICAgZS5pbml0RXZlbnQoXCJ0ZXN0XCIsIHRydWUsIHRydWUpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuIGUuZGVmYXVsdFByZXZlbnRlZDtcbiAgICB9KCk7XG4gICAgaWYgKCFzdXBwb3J0c0RlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgIEV2ZW50LnByb3RvdHlwZS5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FuY2VsYWJsZSkgcmV0dXJuO1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZGVmYXVsdFByZXZlbnRlZFwiLCB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsRXZlbnQsIEV2ZW50LCBkb2N1bWVudC5jcmVhdGVFdmVudChcIkV2ZW50XCIpKTtcbiAgICBmdW5jdGlvbiB1bndyYXBPcHRpb25zKG9wdGlvbnMpIHtcbiAgICAgIGlmICghb3B0aW9ucyB8fCAhb3B0aW9ucy5yZWxhdGVkVGFyZ2V0KSByZXR1cm4gb3B0aW9ucztcbiAgICAgIHJldHVybiBPYmplY3QuY3JlYXRlKG9wdGlvbnMsIHtcbiAgICAgICAgcmVsYXRlZFRhcmdldDoge1xuICAgICAgICAgIHZhbHVlOiB1bndyYXAob3B0aW9ucy5yZWxhdGVkVGFyZ2V0KVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJHZW5lcmljRXZlbnQobmFtZSwgU3VwZXJFdmVudCwgcHJvdG90eXBlKSB7XG4gICAgICB2YXIgT3JpZ2luYWxFdmVudCA9IHdpbmRvd1tuYW1lXTtcbiAgICAgIHZhciBHZW5lcmljRXZlbnQgPSBmdW5jdGlvbih0eXBlLCBvcHRpb25zKSB7XG4gICAgICAgIGlmICh0eXBlIGluc3RhbmNlb2YgT3JpZ2luYWxFdmVudCkgc2V0V3JhcHBlcih0eXBlLCB0aGlzKTsgZWxzZSByZXR1cm4gd3JhcChjb25zdHJ1Y3RFdmVudChPcmlnaW5hbEV2ZW50LCBuYW1lLCB0eXBlLCBvcHRpb25zKSk7XG4gICAgICB9O1xuICAgICAgR2VuZXJpY0V2ZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3VwZXJFdmVudC5wcm90b3R5cGUpO1xuICAgICAgaWYgKHByb3RvdHlwZSkgbWl4aW4oR2VuZXJpY0V2ZW50LnByb3RvdHlwZSwgcHJvdG90eXBlKTtcbiAgICAgIGlmIChPcmlnaW5hbEV2ZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsRXZlbnQsIEdlbmVyaWNFdmVudCwgbmV3IE9yaWdpbmFsRXZlbnQoXCJ0ZW1wXCIpKTtcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxFdmVudCwgR2VuZXJpY0V2ZW50LCBkb2N1bWVudC5jcmVhdGVFdmVudChuYW1lKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBHZW5lcmljRXZlbnQ7XG4gICAgfVxuICAgIHZhciBVSUV2ZW50ID0gcmVnaXN0ZXJHZW5lcmljRXZlbnQoXCJVSUV2ZW50XCIsIEV2ZW50KTtcbiAgICB2YXIgQ3VzdG9tRXZlbnQgPSByZWdpc3RlckdlbmVyaWNFdmVudChcIkN1c3RvbUV2ZW50XCIsIEV2ZW50KTtcbiAgICB2YXIgcmVsYXRlZFRhcmdldFByb3RvID0ge1xuICAgICAgZ2V0IHJlbGF0ZWRUYXJnZXQoKSB7XG4gICAgICAgIHZhciByZWxhdGVkVGFyZ2V0ID0gcmVsYXRlZFRhcmdldFRhYmxlLmdldCh0aGlzKTtcbiAgICAgICAgaWYgKHJlbGF0ZWRUYXJnZXQgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHJlbGF0ZWRUYXJnZXQ7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5yZWxhdGVkVGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIGdldEluaXRGdW5jdGlvbihuYW1lLCByZWxhdGVkVGFyZ2V0SW5kZXgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgYXJndW1lbnRzW3JlbGF0ZWRUYXJnZXRJbmRleF0gPSB1bndyYXAoYXJndW1lbnRzW3JlbGF0ZWRUYXJnZXRJbmRleF0pO1xuICAgICAgICB2YXIgaW1wbCA9IHVud3JhcCh0aGlzKTtcbiAgICAgICAgaW1wbFtuYW1lXS5hcHBseShpbXBsLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9XG4gICAgdmFyIG1vdXNlRXZlbnRQcm90byA9IG1peGluKHtcbiAgICAgIGluaXRNb3VzZUV2ZW50OiBnZXRJbml0RnVuY3Rpb24oXCJpbml0TW91c2VFdmVudFwiLCAxNClcbiAgICB9LCByZWxhdGVkVGFyZ2V0UHJvdG8pO1xuICAgIHZhciBmb2N1c0V2ZW50UHJvdG8gPSBtaXhpbih7XG4gICAgICBpbml0Rm9jdXNFdmVudDogZ2V0SW5pdEZ1bmN0aW9uKFwiaW5pdEZvY3VzRXZlbnRcIiwgNSlcbiAgICB9LCByZWxhdGVkVGFyZ2V0UHJvdG8pO1xuICAgIHZhciBNb3VzZUV2ZW50ID0gcmVnaXN0ZXJHZW5lcmljRXZlbnQoXCJNb3VzZUV2ZW50XCIsIFVJRXZlbnQsIG1vdXNlRXZlbnRQcm90byk7XG4gICAgdmFyIEZvY3VzRXZlbnQgPSByZWdpc3RlckdlbmVyaWNFdmVudChcIkZvY3VzRXZlbnRcIiwgVUlFdmVudCwgZm9jdXNFdmVudFByb3RvKTtcbiAgICB2YXIgZGVmYXVsdEluaXREaWN0cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdmFyIHN1cHBvcnRzRXZlbnRDb25zdHJ1Y3RvcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG5ldyB3aW5kb3cuRm9jdXNFdmVudChcImZvY3VzXCIpO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSgpO1xuICAgIGZ1bmN0aW9uIGNvbnN0cnVjdEV2ZW50KE9yaWdpbmFsRXZlbnQsIG5hbWUsIHR5cGUsIG9wdGlvbnMpIHtcbiAgICAgIGlmIChzdXBwb3J0c0V2ZW50Q29uc3RydWN0b3JzKSByZXR1cm4gbmV3IE9yaWdpbmFsRXZlbnQodHlwZSwgdW53cmFwT3B0aW9ucyhvcHRpb25zKSk7XG4gICAgICB2YXIgZXZlbnQgPSB1bndyYXAoZG9jdW1lbnQuY3JlYXRlRXZlbnQobmFtZSkpO1xuICAgICAgdmFyIGRlZmF1bHREaWN0ID0gZGVmYXVsdEluaXREaWN0c1tuYW1lXTtcbiAgICAgIHZhciBhcmdzID0gWyB0eXBlIF07XG4gICAgICBPYmplY3Qua2V5cyhkZWZhdWx0RGljdCkuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIHYgPSBvcHRpb25zICE9IG51bGwgJiYga2V5IGluIG9wdGlvbnMgPyBvcHRpb25zW2tleV0gOiBkZWZhdWx0RGljdFtrZXldO1xuICAgICAgICBpZiAoa2V5ID09PSBcInJlbGF0ZWRUYXJnZXRcIikgdiA9IHVud3JhcCh2KTtcbiAgICAgICAgYXJncy5wdXNoKHYpO1xuICAgICAgfSk7XG4gICAgICBldmVudFtcImluaXRcIiArIG5hbWVdLmFwcGx5KGV2ZW50LCBhcmdzKTtcbiAgICAgIHJldHVybiBldmVudDtcbiAgICB9XG4gICAgaWYgKCFzdXBwb3J0c0V2ZW50Q29uc3RydWN0b3JzKSB7XG4gICAgICB2YXIgY29uZmlndXJlRXZlbnRDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG5hbWUsIGluaXREaWN0LCBzdXBlck5hbWUpIHtcbiAgICAgICAgaWYgKHN1cGVyTmFtZSkge1xuICAgICAgICAgIHZhciBzdXBlckRpY3QgPSBkZWZhdWx0SW5pdERpY3RzW3N1cGVyTmFtZV07XG4gICAgICAgICAgaW5pdERpY3QgPSBtaXhpbihtaXhpbih7fSwgc3VwZXJEaWN0KSwgaW5pdERpY3QpO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHRJbml0RGljdHNbbmFtZV0gPSBpbml0RGljdDtcbiAgICAgIH07XG4gICAgICBjb25maWd1cmVFdmVudENvbnN0cnVjdG9yKFwiRXZlbnRcIiwge1xuICAgICAgICBidWJibGVzOiBmYWxzZSxcbiAgICAgICAgY2FuY2VsYWJsZTogZmFsc2VcbiAgICAgIH0pO1xuICAgICAgY29uZmlndXJlRXZlbnRDb25zdHJ1Y3RvcihcIkN1c3RvbUV2ZW50XCIsIHtcbiAgICAgICAgZGV0YWlsOiBudWxsXG4gICAgICB9LCBcIkV2ZW50XCIpO1xuICAgICAgY29uZmlndXJlRXZlbnRDb25zdHJ1Y3RvcihcIlVJRXZlbnRcIiwge1xuICAgICAgICB2aWV3OiBudWxsLFxuICAgICAgICBkZXRhaWw6IDBcbiAgICAgIH0sIFwiRXZlbnRcIik7XG4gICAgICBjb25maWd1cmVFdmVudENvbnN0cnVjdG9yKFwiTW91c2VFdmVudFwiLCB7XG4gICAgICAgIHNjcmVlblg6IDAsXG4gICAgICAgIHNjcmVlblk6IDAsXG4gICAgICAgIGNsaWVudFg6IDAsXG4gICAgICAgIGNsaWVudFk6IDAsXG4gICAgICAgIGN0cmxLZXk6IGZhbHNlLFxuICAgICAgICBhbHRLZXk6IGZhbHNlLFxuICAgICAgICBzaGlmdEtleTogZmFsc2UsXG4gICAgICAgIG1ldGFLZXk6IGZhbHNlLFxuICAgICAgICBidXR0b246IDAsXG4gICAgICAgIHJlbGF0ZWRUYXJnZXQ6IG51bGxcbiAgICAgIH0sIFwiVUlFdmVudFwiKTtcbiAgICAgIGNvbmZpZ3VyZUV2ZW50Q29uc3RydWN0b3IoXCJGb2N1c0V2ZW50XCIsIHtcbiAgICAgICAgcmVsYXRlZFRhcmdldDogbnVsbFxuICAgICAgfSwgXCJVSUV2ZW50XCIpO1xuICAgIH1cbiAgICB2YXIgT3JpZ2luYWxCZWZvcmVVbmxvYWRFdmVudCA9IHdpbmRvdy5CZWZvcmVVbmxvYWRFdmVudDtcbiAgICBmdW5jdGlvbiBCZWZvcmVVbmxvYWRFdmVudChpbXBsKSB7XG4gICAgICBFdmVudC5jYWxsKHRoaXMsIGltcGwpO1xuICAgIH1cbiAgICBCZWZvcmVVbmxvYWRFdmVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oQmVmb3JlVW5sb2FkRXZlbnQucHJvdG90eXBlLCB7XG4gICAgICBnZXQgcmV0dXJuVmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykucmV0dXJuVmFsdWU7XG4gICAgICB9LFxuICAgICAgc2V0IHJldHVyblZhbHVlKHYpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnJldHVyblZhbHVlID0gdjtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoT3JpZ2luYWxCZWZvcmVVbmxvYWRFdmVudCkgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsQmVmb3JlVW5sb2FkRXZlbnQsIEJlZm9yZVVubG9hZEV2ZW50KTtcbiAgICBmdW5jdGlvbiBpc1ZhbGlkTGlzdGVuZXIoZnVuKSB7XG4gICAgICBpZiAodHlwZW9mIGZ1biA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiBmdW4gJiYgZnVuLmhhbmRsZUV2ZW50O1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc011dGF0aW9uRXZlbnQodHlwZSkge1xuICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgY2FzZSBcIkRPTUF0dHJNb2RpZmllZFwiOlxuICAgICAgIGNhc2UgXCJET01BdHRyaWJ1dGVOYW1lQ2hhbmdlZFwiOlxuICAgICAgIGNhc2UgXCJET01DaGFyYWN0ZXJEYXRhTW9kaWZpZWRcIjpcbiAgICAgICBjYXNlIFwiRE9NRWxlbWVudE5hbWVDaGFuZ2VkXCI6XG4gICAgICAgY2FzZSBcIkRPTU5vZGVJbnNlcnRlZFwiOlxuICAgICAgIGNhc2UgXCJET01Ob2RlSW5zZXJ0ZWRJbnRvRG9jdW1lbnRcIjpcbiAgICAgICBjYXNlIFwiRE9NTm9kZVJlbW92ZWRcIjpcbiAgICAgICBjYXNlIFwiRE9NTm9kZVJlbW92ZWRGcm9tRG9jdW1lbnRcIjpcbiAgICAgICBjYXNlIFwiRE9NU3VidHJlZU1vZGlmaWVkXCI6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgT3JpZ2luYWxFdmVudFRhcmdldCA9IHdpbmRvdy5FdmVudFRhcmdldDtcbiAgICBmdW5jdGlvbiBFdmVudFRhcmdldChpbXBsKSB7XG4gICAgICBzZXRXcmFwcGVyKGltcGwsIHRoaXMpO1xuICAgIH1cbiAgICB2YXIgbWV0aG9kTmFtZXMgPSBbIFwiYWRkRXZlbnRMaXN0ZW5lclwiLCBcInJlbW92ZUV2ZW50TGlzdGVuZXJcIiwgXCJkaXNwYXRjaEV2ZW50XCIgXTtcbiAgICBbIE5vZGUsIFdpbmRvdyBdLmZvckVhY2goZnVuY3Rpb24oY29uc3RydWN0b3IpIHtcbiAgICAgIHZhciBwID0gY29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgICAgbWV0aG9kTmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwLCBuYW1lICsgXCJfXCIsIHtcbiAgICAgICAgICB2YWx1ZTogcFtuYW1lXVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGZ1bmN0aW9uIGdldFRhcmdldFRvTGlzdGVuQXQod3JhcHBlcikge1xuICAgICAgaWYgKHdyYXBwZXIgaW5zdGFuY2VvZiB3cmFwcGVycy5TaGFkb3dSb290KSB3cmFwcGVyID0gd3JhcHBlci5ob3N0O1xuICAgICAgcmV0dXJuIHVud3JhcCh3cmFwcGVyKTtcbiAgICB9XG4gICAgRXZlbnRUYXJnZXQucHJvdG90eXBlID0ge1xuICAgICAgYWRkRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24odHlwZSwgZnVuLCBjYXB0dXJlKSB7XG4gICAgICAgIGlmICghaXNWYWxpZExpc3RlbmVyKGZ1bikgfHwgaXNNdXRhdGlvbkV2ZW50KHR5cGUpKSByZXR1cm47XG4gICAgICAgIHZhciBsaXN0ZW5lciA9IG5ldyBMaXN0ZW5lcih0eXBlLCBmdW4sIGNhcHR1cmUpO1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gbGlzdGVuZXJzVGFibGUuZ2V0KHRoaXMpO1xuICAgICAgICBpZiAoIWxpc3RlbmVycykge1xuICAgICAgICAgIGxpc3RlbmVycyA9IFtdO1xuICAgICAgICAgIGxpc3RlbmVycy5kZXB0aCA9IDA7XG4gICAgICAgICAgbGlzdGVuZXJzVGFibGUuc2V0KHRoaXMsIGxpc3RlbmVycyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lci5lcXVhbHMobGlzdGVuZXJzW2ldKSkgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIHZhciB0YXJnZXQgPSBnZXRUYXJnZXRUb0xpc3RlbkF0KHRoaXMpO1xuICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcl8odHlwZSwgZGlzcGF0Y2hPcmlnaW5hbEV2ZW50LCB0cnVlKTtcbiAgICAgIH0sXG4gICAgICByZW1vdmVFdmVudExpc3RlbmVyOiBmdW5jdGlvbih0eXBlLCBmdW4sIGNhcHR1cmUpIHtcbiAgICAgICAgY2FwdHVyZSA9IEJvb2xlYW4oY2FwdHVyZSk7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnNUYWJsZS5nZXQodGhpcyk7XG4gICAgICAgIGlmICghbGlzdGVuZXJzKSByZXR1cm47XG4gICAgICAgIHZhciBjb3VudCA9IDAsIGZvdW5kID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXS50eXBlID09PSB0eXBlICYmIGxpc3RlbmVyc1tpXS5jYXB0dXJlID09PSBjYXB0dXJlKSB7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXS5oYW5kbGVyID09PSBmdW4pIHtcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICBsaXN0ZW5lcnNbaV0ucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChmb3VuZCAmJiBjb3VudCA9PT0gMSkge1xuICAgICAgICAgIHZhciB0YXJnZXQgPSBnZXRUYXJnZXRUb0xpc3RlbkF0KHRoaXMpO1xuICAgICAgICAgIHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyXyh0eXBlLCBkaXNwYXRjaE9yaWdpbmFsRXZlbnQsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZGlzcGF0Y2hFdmVudDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIG5hdGl2ZUV2ZW50ID0gdW53cmFwKGV2ZW50KTtcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IG5hdGl2ZUV2ZW50LnR5cGU7XG4gICAgICAgIGhhbmRsZWRFdmVudHNUYWJsZS5zZXQobmF0aXZlRXZlbnQsIGZhbHNlKTtcbiAgICAgICAgc2NvcGUucmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgICB2YXIgdGVtcExpc3RlbmVyO1xuICAgICAgICBpZiAoIWhhc0xpc3RlbmVySW5BbmNlc3RvcnModGhpcywgZXZlbnRUeXBlKSkge1xuICAgICAgICAgIHRlbXBMaXN0ZW5lciA9IGZ1bmN0aW9uKCkge307XG4gICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGVtcExpc3RlbmVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiB1bndyYXAodGhpcykuZGlzcGF0Y2hFdmVudF8obmF0aXZlRXZlbnQpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGlmICh0ZW1wTGlzdGVuZXIpIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRlbXBMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIGhhc0xpc3RlbmVyKG5vZGUsIHR5cGUpIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICBpZiAobGlzdGVuZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKCFsaXN0ZW5lcnNbaV0ucmVtb3ZlZCAmJiBsaXN0ZW5lcnNbaV0udHlwZSA9PT0gdHlwZSkgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaGFzTGlzdGVuZXJJbkFuY2VzdG9ycyh0YXJnZXQsIHR5cGUpIHtcbiAgICAgIGZvciAodmFyIG5vZGUgPSB1bndyYXAodGFyZ2V0KTsgbm9kZTsgbm9kZSA9IG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICBpZiAoaGFzTGlzdGVuZXIod3JhcChub2RlKSwgdHlwZSkpIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoT3JpZ2luYWxFdmVudFRhcmdldCkgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsRXZlbnRUYXJnZXQsIEV2ZW50VGFyZ2V0KTtcbiAgICBmdW5jdGlvbiB3cmFwRXZlbnRUYXJnZXRNZXRob2RzKGNvbnN0cnVjdG9ycykge1xuICAgICAgZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXIoY29uc3RydWN0b3JzLCBtZXRob2ROYW1lcyk7XG4gICAgfVxuICAgIHZhciBvcmlnaW5hbEVsZW1lbnRGcm9tUG9pbnQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50O1xuICAgIGZ1bmN0aW9uIGVsZW1lbnRGcm9tUG9pbnQoc2VsZiwgZG9jdW1lbnQsIHgsIHkpIHtcbiAgICAgIHNjb3BlLnJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgIHZhciBlbGVtZW50ID0gd3JhcChvcmlnaW5hbEVsZW1lbnRGcm9tUG9pbnQuY2FsbCh1bnNhZmVVbndyYXAoZG9jdW1lbnQpLCB4LCB5KSk7XG4gICAgICBpZiAoIWVsZW1lbnQpIHJldHVybiBudWxsO1xuICAgICAgdmFyIHBhdGggPSBnZXRFdmVudFBhdGgoZWxlbWVudCwgbnVsbCk7XG4gICAgICB2YXIgaWR4ID0gcGF0aC5sYXN0SW5kZXhPZihzZWxmKTtcbiAgICAgIGlmIChpZHggPT0gLTEpIHJldHVybiBudWxsOyBlbHNlIHBhdGggPSBwYXRoLnNsaWNlKDAsIGlkeCk7XG4gICAgICByZXR1cm4gZXZlbnRSZXRhcmdldHRpbmcocGF0aCwgc2VsZik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldEV2ZW50SGFuZGxlckdldHRlcihuYW1lKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbmxpbmVFdmVudEhhbmRsZXJzID0gZXZlbnRIYW5kbGVyc1RhYmxlLmdldCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIGlubGluZUV2ZW50SGFuZGxlcnMgJiYgaW5saW5lRXZlbnRIYW5kbGVyc1tuYW1lXSAmJiBpbmxpbmVFdmVudEhhbmRsZXJzW25hbWVdLnZhbHVlIHx8IG51bGw7XG4gICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRFdmVudEhhbmRsZXJTZXR0ZXIobmFtZSkge1xuICAgICAgdmFyIGV2ZW50VHlwZSA9IG5hbWUuc2xpY2UoMik7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdmFyIGlubGluZUV2ZW50SGFuZGxlcnMgPSBldmVudEhhbmRsZXJzVGFibGUuZ2V0KHRoaXMpO1xuICAgICAgICBpZiAoIWlubGluZUV2ZW50SGFuZGxlcnMpIHtcbiAgICAgICAgICBpbmxpbmVFdmVudEhhbmRsZXJzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgICBldmVudEhhbmRsZXJzVGFibGUuc2V0KHRoaXMsIGlubGluZUV2ZW50SGFuZGxlcnMpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvbGQgPSBpbmxpbmVFdmVudEhhbmRsZXJzW25hbWVdO1xuICAgICAgICBpZiAob2xkKSB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBvbGQud3JhcHBlZCwgZmFsc2UpO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICB2YXIgd3JhcHBlZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBydiA9IHZhbHVlLmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgICBpZiAocnYgPT09IGZhbHNlKSBlLnByZXZlbnREZWZhdWx0KCk7IGVsc2UgaWYgKG5hbWUgPT09IFwib25iZWZvcmV1bmxvYWRcIiAmJiB0eXBlb2YgcnYgPT09IFwic3RyaW5nXCIpIGUucmV0dXJuVmFsdWUgPSBydjtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHdyYXBwZWQsIGZhbHNlKTtcbiAgICAgICAgICBpbmxpbmVFdmVudEhhbmRsZXJzW25hbWVdID0ge1xuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgd3JhcHBlZDogd3JhcHBlZFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICAgIHNjb3BlLmVsZW1lbnRGcm9tUG9pbnQgPSBlbGVtZW50RnJvbVBvaW50O1xuICAgIHNjb3BlLmdldEV2ZW50SGFuZGxlckdldHRlciA9IGdldEV2ZW50SGFuZGxlckdldHRlcjtcbiAgICBzY29wZS5nZXRFdmVudEhhbmRsZXJTZXR0ZXIgPSBnZXRFdmVudEhhbmRsZXJTZXR0ZXI7XG4gICAgc2NvcGUud3JhcEV2ZW50VGFyZ2V0TWV0aG9kcyA9IHdyYXBFdmVudFRhcmdldE1ldGhvZHM7XG4gICAgc2NvcGUud3JhcHBlcnMuQmVmb3JlVW5sb2FkRXZlbnQgPSBCZWZvcmVVbmxvYWRFdmVudDtcbiAgICBzY29wZS53cmFwcGVycy5DdXN0b21FdmVudCA9IEN1c3RvbUV2ZW50O1xuICAgIHNjb3BlLndyYXBwZXJzLkV2ZW50ID0gRXZlbnQ7XG4gICAgc2NvcGUud3JhcHBlcnMuRXZlbnRUYXJnZXQgPSBFdmVudFRhcmdldDtcbiAgICBzY29wZS53cmFwcGVycy5Gb2N1c0V2ZW50ID0gRm9jdXNFdmVudDtcbiAgICBzY29wZS53cmFwcGVycy5Nb3VzZUV2ZW50ID0gTW91c2VFdmVudDtcbiAgICBzY29wZS53cmFwcGVycy5VSUV2ZW50ID0gVUlFdmVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIFVJRXZlbnQgPSBzY29wZS53cmFwcGVycy5VSUV2ZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHNldFdyYXBwZXIgPSBzY29wZS5zZXRXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbFRvdWNoRXZlbnQgPSB3aW5kb3cuVG91Y2hFdmVudDtcbiAgICBpZiAoIU9yaWdpbmFsVG91Y2hFdmVudCkgcmV0dXJuO1xuICAgIHZhciBuYXRpdmVFdmVudDtcbiAgICB0cnkge1xuICAgICAgbmF0aXZlRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIlRvdWNoRXZlbnRcIik7XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG5vbkVudW1EZXNjcmlwdG9yID0ge1xuICAgICAgZW51bWVyYWJsZTogZmFsc2VcbiAgICB9O1xuICAgIGZ1bmN0aW9uIG5vbkVudW0ob2JqLCBwcm9wKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBwcm9wLCBub25FbnVtRGVzY3JpcHRvcik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIFRvdWNoKGltcGwpIHtcbiAgICAgIHNldFdyYXBwZXIoaW1wbCwgdGhpcyk7XG4gICAgfVxuICAgIFRvdWNoLnByb3RvdHlwZSA9IHtcbiAgICAgIGdldCB0YXJnZXQoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS50YXJnZXQpO1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIGRlc2NyID0ge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogbnVsbFxuICAgIH07XG4gICAgWyBcImNsaWVudFhcIiwgXCJjbGllbnRZXCIsIFwic2NyZWVuWFwiLCBcInNjcmVlbllcIiwgXCJwYWdlWFwiLCBcInBhZ2VZXCIsIFwiaWRlbnRpZmllclwiLCBcIndlYmtpdFJhZGl1c1hcIiwgXCJ3ZWJraXRSYWRpdXNZXCIsIFwid2Via2l0Um90YXRpb25BbmdsZVwiLCBcIndlYmtpdEZvcmNlXCIgXS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGRlc2NyLmdldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpW25hbWVdO1xuICAgICAgfTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShUb3VjaC5wcm90b3R5cGUsIG5hbWUsIGRlc2NyKTtcbiAgICB9KTtcbiAgICBmdW5jdGlvbiBUb3VjaExpc3QoKSB7XG4gICAgICB0aGlzLmxlbmd0aCA9IDA7XG4gICAgICBub25FbnVtKHRoaXMsIFwibGVuZ3RoXCIpO1xuICAgIH1cbiAgICBUb3VjaExpc3QucHJvdG90eXBlID0ge1xuICAgICAgaXRlbTogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbaW5kZXhdO1xuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gd3JhcFRvdWNoTGlzdChuYXRpdmVUb3VjaExpc3QpIHtcbiAgICAgIHZhciBsaXN0ID0gbmV3IFRvdWNoTGlzdCgpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYXRpdmVUb3VjaExpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGlzdFtpXSA9IG5ldyBUb3VjaChuYXRpdmVUb3VjaExpc3RbaV0pO1xuICAgICAgfVxuICAgICAgbGlzdC5sZW5ndGggPSBpO1xuICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfVxuICAgIGZ1bmN0aW9uIFRvdWNoRXZlbnQoaW1wbCkge1xuICAgICAgVUlFdmVudC5jYWxsKHRoaXMsIGltcGwpO1xuICAgIH1cbiAgICBUb3VjaEV2ZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFdmVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKFRvdWNoRXZlbnQucHJvdG90eXBlLCB7XG4gICAgICBnZXQgdG91Y2hlcygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBUb3VjaExpc3QodW5zYWZlVW53cmFwKHRoaXMpLnRvdWNoZXMpO1xuICAgICAgfSxcbiAgICAgIGdldCB0YXJnZXRUb3VjaGVzKCkge1xuICAgICAgICByZXR1cm4gd3JhcFRvdWNoTGlzdCh1bnNhZmVVbndyYXAodGhpcykudGFyZ2V0VG91Y2hlcyk7XG4gICAgICB9LFxuICAgICAgZ2V0IGNoYW5nZWRUb3VjaGVzKCkge1xuICAgICAgICByZXR1cm4gd3JhcFRvdWNoTGlzdCh1bnNhZmVVbndyYXAodGhpcykuY2hhbmdlZFRvdWNoZXMpO1xuICAgICAgfSxcbiAgICAgIGluaXRUb3VjaEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbFRvdWNoRXZlbnQsIFRvdWNoRXZlbnQsIG5hdGl2ZUV2ZW50KTtcbiAgICBzY29wZS53cmFwcGVycy5Ub3VjaCA9IFRvdWNoO1xuICAgIHNjb3BlLndyYXBwZXJzLlRvdWNoRXZlbnQgPSBUb3VjaEV2ZW50O1xuICAgIHNjb3BlLndyYXBwZXJzLlRvdWNoTGlzdCA9IFRvdWNoTGlzdDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIG5vbkVudW1EZXNjcmlwdG9yID0ge1xuICAgICAgZW51bWVyYWJsZTogZmFsc2VcbiAgICB9O1xuICAgIGZ1bmN0aW9uIG5vbkVudW0ob2JqLCBwcm9wKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBwcm9wLCBub25FbnVtRGVzY3JpcHRvcik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIE5vZGVMaXN0KCkge1xuICAgICAgdGhpcy5sZW5ndGggPSAwO1xuICAgICAgbm9uRW51bSh0aGlzLCBcImxlbmd0aFwiKTtcbiAgICB9XG4gICAgTm9kZUxpc3QucHJvdG90eXBlID0ge1xuICAgICAgaXRlbTogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbaW5kZXhdO1xuICAgICAgfVxuICAgIH07XG4gICAgbm9uRW51bShOb2RlTGlzdC5wcm90b3R5cGUsIFwiaXRlbVwiKTtcbiAgICBmdW5jdGlvbiB3cmFwTm9kZUxpc3QobGlzdCkge1xuICAgICAgaWYgKGxpc3QgPT0gbnVsbCkgcmV0dXJuIGxpc3Q7XG4gICAgICB2YXIgd3JhcHBlckxpc3QgPSBuZXcgTm9kZUxpc3QoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHdyYXBwZXJMaXN0W2ldID0gd3JhcChsaXN0W2ldKTtcbiAgICAgIH1cbiAgICAgIHdyYXBwZXJMaXN0Lmxlbmd0aCA9IGxlbmd0aDtcbiAgICAgIHJldHVybiB3cmFwcGVyTGlzdDtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkV3JhcE5vZGVMaXN0TWV0aG9kKHdyYXBwZXJDb25zdHJ1Y3RvciwgbmFtZSkge1xuICAgICAgd3JhcHBlckNvbnN0cnVjdG9yLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcE5vZGVMaXN0KHVuc2FmZVVud3JhcCh0aGlzKVtuYW1lXS5hcHBseSh1bnNhZmVVbndyYXAodGhpcyksIGFyZ3VtZW50cykpO1xuICAgICAgfTtcbiAgICB9XG4gICAgc2NvcGUud3JhcHBlcnMuTm9kZUxpc3QgPSBOb2RlTGlzdDtcbiAgICBzY29wZS5hZGRXcmFwTm9kZUxpc3RNZXRob2QgPSBhZGRXcmFwTm9kZUxpc3RNZXRob2Q7XG4gICAgc2NvcGUud3JhcE5vZGVMaXN0ID0gd3JhcE5vZGVMaXN0O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBzY29wZS53cmFwSFRNTENvbGxlY3Rpb24gPSBzY29wZS53cmFwTm9kZUxpc3Q7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTENvbGxlY3Rpb24gPSBzY29wZS53cmFwcGVycy5Ob2RlTGlzdDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEV2ZW50VGFyZ2V0ID0gc2NvcGUud3JhcHBlcnMuRXZlbnRUYXJnZXQ7XG4gICAgdmFyIE5vZGVMaXN0ID0gc2NvcGUud3JhcHBlcnMuTm9kZUxpc3Q7XG4gICAgdmFyIFRyZWVTY29wZSA9IHNjb3BlLlRyZWVTY29wZTtcbiAgICB2YXIgYXNzZXJ0ID0gc2NvcGUuYXNzZXJ0O1xuICAgIHZhciBkZWZpbmVXcmFwR2V0dGVyID0gc2NvcGUuZGVmaW5lV3JhcEdldHRlcjtcbiAgICB2YXIgZW5xdWV1ZU11dGF0aW9uID0gc2NvcGUuZW5xdWV1ZU11dGF0aW9uO1xuICAgIHZhciBnZXRUcmVlU2NvcGUgPSBzY29wZS5nZXRUcmVlU2NvcGU7XG4gICAgdmFyIGlzV3JhcHBlciA9IHNjb3BlLmlzV3JhcHBlcjtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJUcmFuc2llbnRPYnNlcnZlcnMgPSBzY29wZS5yZWdpc3RlclRyYW5zaWVudE9ic2VydmVycztcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBzZXRUcmVlU2NvcGUgPSBzY29wZS5zZXRUcmVlU2NvcGU7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB1bndyYXBJZk5lZWRlZCA9IHNjb3BlLnVud3JhcElmTmVlZGVkO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgd3JhcElmTmVlZGVkID0gc2NvcGUud3JhcElmTmVlZGVkO1xuICAgIHZhciB3cmFwcGVycyA9IHNjb3BlLndyYXBwZXJzO1xuICAgIGZ1bmN0aW9uIGFzc2VydElzTm9kZVdyYXBwZXIobm9kZSkge1xuICAgICAgYXNzZXJ0KG5vZGUgaW5zdGFuY2VvZiBOb2RlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY3JlYXRlT25lRWxlbWVudE5vZGVMaXN0KG5vZGUpIHtcbiAgICAgIHZhciBub2RlcyA9IG5ldyBOb2RlTGlzdCgpO1xuICAgICAgbm9kZXNbMF0gPSBub2RlO1xuICAgICAgbm9kZXMubGVuZ3RoID0gMTtcbiAgICAgIHJldHVybiBub2RlcztcbiAgICB9XG4gICAgdmFyIHN1cnByZXNzTXV0YXRpb25zID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gZW5xdWV1ZVJlbW92YWxGb3JJbnNlcnRlZE5vZGVzKG5vZGUsIHBhcmVudCwgbm9kZXMpIHtcbiAgICAgIGVucXVldWVNdXRhdGlvbihwYXJlbnQsIFwiY2hpbGRMaXN0XCIsIHtcbiAgICAgICAgcmVtb3ZlZE5vZGVzOiBub2RlcyxcbiAgICAgICAgcHJldmlvdXNTaWJsaW5nOiBub2RlLnByZXZpb3VzU2libGluZyxcbiAgICAgICAgbmV4dFNpYmxpbmc6IG5vZGUubmV4dFNpYmxpbmdcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBlbnF1ZXVlUmVtb3ZhbEZvckluc2VydGVkRG9jdW1lbnRGcmFnbWVudChkZiwgbm9kZXMpIHtcbiAgICAgIGVucXVldWVNdXRhdGlvbihkZiwgXCJjaGlsZExpc3RcIiwge1xuICAgICAgICByZW1vdmVkTm9kZXM6IG5vZGVzXG4gICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY29sbGVjdE5vZGVzKG5vZGUsIHBhcmVudE5vZGUsIHByZXZpb3VzTm9kZSwgbmV4dE5vZGUpIHtcbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudCkge1xuICAgICAgICB2YXIgbm9kZXMgPSBjb2xsZWN0Tm9kZXNGb3JEb2N1bWVudEZyYWdtZW50KG5vZGUpO1xuICAgICAgICBzdXJwcmVzc011dGF0aW9ucyA9IHRydWU7XG4gICAgICAgIGZvciAodmFyIGkgPSBub2Rlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZXNbaV0pO1xuICAgICAgICAgIG5vZGVzW2ldLnBhcmVudE5vZGVfID0gcGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICBzdXJwcmVzc011dGF0aW9ucyA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbm9kZXNbaV0ucHJldmlvdXNTaWJsaW5nXyA9IG5vZGVzW2kgLSAxXSB8fCBwcmV2aW91c05vZGU7XG4gICAgICAgICAgbm9kZXNbaV0ubmV4dFNpYmxpbmdfID0gbm9kZXNbaSArIDFdIHx8IG5leHROb2RlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmV2aW91c05vZGUpIHByZXZpb3VzTm9kZS5uZXh0U2libGluZ18gPSBub2Rlc1swXTtcbiAgICAgICAgaWYgKG5leHROb2RlKSBuZXh0Tm9kZS5wcmV2aW91c1NpYmxpbmdfID0gbm9kZXNbbm9kZXMubGVuZ3RoIC0gMV07XG4gICAgICAgIHJldHVybiBub2RlcztcbiAgICAgIH1cbiAgICAgIHZhciBub2RlcyA9IGNyZWF0ZU9uZUVsZW1lbnROb2RlTGlzdChub2RlKTtcbiAgICAgIHZhciBvbGRQYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICBpZiAob2xkUGFyZW50KSB7XG4gICAgICAgIG9sZFBhcmVudC5yZW1vdmVDaGlsZChub2RlKTtcbiAgICAgIH1cbiAgICAgIG5vZGUucGFyZW50Tm9kZV8gPSBwYXJlbnROb2RlO1xuICAgICAgbm9kZS5wcmV2aW91c1NpYmxpbmdfID0gcHJldmlvdXNOb2RlO1xuICAgICAgbm9kZS5uZXh0U2libGluZ18gPSBuZXh0Tm9kZTtcbiAgICAgIGlmIChwcmV2aW91c05vZGUpIHByZXZpb3VzTm9kZS5uZXh0U2libGluZ18gPSBub2RlO1xuICAgICAgaWYgKG5leHROb2RlKSBuZXh0Tm9kZS5wcmV2aW91c1NpYmxpbmdfID0gbm9kZTtcbiAgICAgIHJldHVybiBub2RlcztcbiAgICB9XG4gICAgZnVuY3Rpb24gY29sbGVjdE5vZGVzTmF0aXZlKG5vZGUpIHtcbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudCkgcmV0dXJuIGNvbGxlY3ROb2Rlc0ZvckRvY3VtZW50RnJhZ21lbnQobm9kZSk7XG4gICAgICB2YXIgbm9kZXMgPSBjcmVhdGVPbmVFbGVtZW50Tm9kZUxpc3Qobm9kZSk7XG4gICAgICB2YXIgb2xkUGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgaWYgKG9sZFBhcmVudCkgZW5xdWV1ZVJlbW92YWxGb3JJbnNlcnRlZE5vZGVzKG5vZGUsIG9sZFBhcmVudCwgbm9kZXMpO1xuICAgICAgcmV0dXJuIG5vZGVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjb2xsZWN0Tm9kZXNGb3JEb2N1bWVudEZyYWdtZW50KG5vZGUpIHtcbiAgICAgIHZhciBub2RlcyA9IG5ldyBOb2RlTGlzdCgpO1xuICAgICAgdmFyIGkgPSAwO1xuICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIG5vZGVzW2krK10gPSBjaGlsZDtcbiAgICAgIH1cbiAgICAgIG5vZGVzLmxlbmd0aCA9IGk7XG4gICAgICBlbnF1ZXVlUmVtb3ZhbEZvckluc2VydGVkRG9jdW1lbnRGcmFnbWVudChub2RlLCBub2Rlcyk7XG4gICAgICByZXR1cm4gbm9kZXM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNuYXBzaG90Tm9kZUxpc3Qobm9kZUxpc3QpIHtcbiAgICAgIHJldHVybiBub2RlTGlzdDtcbiAgICB9XG4gICAgZnVuY3Rpb24gbm9kZVdhc0FkZGVkKG5vZGUsIHRyZWVTY29wZSkge1xuICAgICAgc2V0VHJlZVNjb3BlKG5vZGUsIHRyZWVTY29wZSk7XG4gICAgICBub2RlLm5vZGVJc0luc2VydGVkXygpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBub2Rlc1dlcmVBZGRlZChub2RlcywgcGFyZW50KSB7XG4gICAgICB2YXIgdHJlZVNjb3BlID0gZ2V0VHJlZVNjb3BlKHBhcmVudCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5vZGVXYXNBZGRlZChub2Rlc1tpXSwgdHJlZVNjb3BlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gbm9kZVdhc1JlbW92ZWQobm9kZSkge1xuICAgICAgc2V0VHJlZVNjb3BlKG5vZGUsIG5ldyBUcmVlU2NvcGUobm9kZSwgbnVsbCkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBub2Rlc1dlcmVSZW1vdmVkKG5vZGVzKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5vZGVXYXNSZW1vdmVkKG5vZGVzW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZW5zdXJlU2FtZU93bmVyRG9jdW1lbnQocGFyZW50LCBjaGlsZCkge1xuICAgICAgdmFyIG93bmVyRG9jID0gcGFyZW50Lm5vZGVUeXBlID09PSBOb2RlLkRPQ1VNRU5UX05PREUgPyBwYXJlbnQgOiBwYXJlbnQub3duZXJEb2N1bWVudDtcbiAgICAgIGlmIChvd25lckRvYyAhPT0gY2hpbGQub3duZXJEb2N1bWVudCkgb3duZXJEb2MuYWRvcHROb2RlKGNoaWxkKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRvcHROb2Rlc0lmTmVlZGVkKG93bmVyLCBub2Rlcykge1xuICAgICAgaWYgKCFub2Rlcy5sZW5ndGgpIHJldHVybjtcbiAgICAgIHZhciBvd25lckRvYyA9IG93bmVyLm93bmVyRG9jdW1lbnQ7XG4gICAgICBpZiAob3duZXJEb2MgPT09IG5vZGVzWzBdLm93bmVyRG9jdW1lbnQpIHJldHVybjtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2NvcGUuYWRvcHROb2RlTm9SZW1vdmUobm9kZXNbaV0sIG93bmVyRG9jKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdW53cmFwTm9kZXNGb3JJbnNlcnRpb24ob3duZXIsIG5vZGVzKSB7XG4gICAgICBhZG9wdE5vZGVzSWZOZWVkZWQob3duZXIsIG5vZGVzKTtcbiAgICAgIHZhciBsZW5ndGggPSBub2Rlcy5sZW5ndGg7XG4gICAgICBpZiAobGVuZ3RoID09PSAxKSByZXR1cm4gdW53cmFwKG5vZGVzWzBdKTtcbiAgICAgIHZhciBkZiA9IHVud3JhcChvd25lci5vd25lckRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGRmLmFwcGVuZENoaWxkKHVud3JhcChub2Rlc1tpXSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRmO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjbGVhckNoaWxkTm9kZXMod3JhcHBlcikge1xuICAgICAgaWYgKHdyYXBwZXIuZmlyc3RDaGlsZF8gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgY2hpbGQgPSB3cmFwcGVyLmZpcnN0Q2hpbGRfO1xuICAgICAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgICAgICB2YXIgdG1wID0gY2hpbGQ7XG4gICAgICAgICAgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZ187XG4gICAgICAgICAgdG1wLnBhcmVudE5vZGVfID0gdG1wLnByZXZpb3VzU2libGluZ18gPSB0bXAubmV4dFNpYmxpbmdfID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB3cmFwcGVyLmZpcnN0Q2hpbGRfID0gd3JhcHBlci5sYXN0Q2hpbGRfID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmVBbGxDaGlsZE5vZGVzKHdyYXBwZXIpIHtcbiAgICAgIGlmICh3cmFwcGVyLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcigpKSB7XG4gICAgICAgIHZhciBjaGlsZFdyYXBwZXIgPSB3cmFwcGVyLmZpcnN0Q2hpbGQ7XG4gICAgICAgIHdoaWxlIChjaGlsZFdyYXBwZXIpIHtcbiAgICAgICAgICBhc3NlcnQoY2hpbGRXcmFwcGVyLnBhcmVudE5vZGUgPT09IHdyYXBwZXIpO1xuICAgICAgICAgIHZhciBuZXh0U2libGluZyA9IGNoaWxkV3JhcHBlci5uZXh0U2libGluZztcbiAgICAgICAgICB2YXIgY2hpbGROb2RlID0gdW53cmFwKGNoaWxkV3JhcHBlcik7XG4gICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBjaGlsZE5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICBpZiAocGFyZW50Tm9kZSkgb3JpZ2luYWxSZW1vdmVDaGlsZC5jYWxsKHBhcmVudE5vZGUsIGNoaWxkTm9kZSk7XG4gICAgICAgICAgY2hpbGRXcmFwcGVyLnByZXZpb3VzU2libGluZ18gPSBjaGlsZFdyYXBwZXIubmV4dFNpYmxpbmdfID0gY2hpbGRXcmFwcGVyLnBhcmVudE5vZGVfID0gbnVsbDtcbiAgICAgICAgICBjaGlsZFdyYXBwZXIgPSBuZXh0U2libGluZztcbiAgICAgICAgfVxuICAgICAgICB3cmFwcGVyLmZpcnN0Q2hpbGRfID0gd3JhcHBlci5sYXN0Q2hpbGRfID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBub2RlID0gdW53cmFwKHdyYXBwZXIpO1xuICAgICAgICB2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7XG4gICAgICAgIHZhciBuZXh0U2libGluZztcbiAgICAgICAgd2hpbGUgKGNoaWxkKSB7XG4gICAgICAgICAgbmV4dFNpYmxpbmcgPSBjaGlsZC5uZXh0U2libGluZztcbiAgICAgICAgICBvcmlnaW5hbFJlbW92ZUNoaWxkLmNhbGwobm9kZSwgY2hpbGQpO1xuICAgICAgICAgIGNoaWxkID0gbmV4dFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gaW52YWxpZGF0ZVBhcmVudChub2RlKSB7XG4gICAgICB2YXIgcCA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgIHJldHVybiBwICYmIHAuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNsZWFudXBOb2Rlcyhub2Rlcykge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIG47IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBuID0gbm9kZXNbaV07XG4gICAgICAgIG4ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChuKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIG9yaWdpbmFsSW1wb3J0Tm9kZSA9IGRvY3VtZW50LmltcG9ydE5vZGU7XG4gICAgdmFyIG9yaWdpbmFsQ2xvbmVOb2RlID0gd2luZG93Lk5vZGUucHJvdG90eXBlLmNsb25lTm9kZTtcbiAgICBmdW5jdGlvbiBjbG9uZU5vZGUobm9kZSwgZGVlcCwgb3B0X2RvYykge1xuICAgICAgdmFyIGNsb25lO1xuICAgICAgaWYgKG9wdF9kb2MpIGNsb25lID0gd3JhcChvcmlnaW5hbEltcG9ydE5vZGUuY2FsbChvcHRfZG9jLCB1bnNhZmVVbndyYXAobm9kZSksIGZhbHNlKSk7IGVsc2UgY2xvbmUgPSB3cmFwKG9yaWdpbmFsQ2xvbmVOb2RlLmNhbGwodW5zYWZlVW53cmFwKG5vZGUpLCBmYWxzZSkpO1xuICAgICAgaWYgKGRlZXApIHtcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgY2xvbmUuYXBwZW5kQ2hpbGQoY2xvbmVOb2RlKGNoaWxkLCB0cnVlLCBvcHRfZG9jKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiB3cmFwcGVycy5IVE1MVGVtcGxhdGVFbGVtZW50KSB7XG4gICAgICAgICAgdmFyIGNsb25lQ29udGVudCA9IGNsb25lLmNvbnRlbnQ7XG4gICAgICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmNvbnRlbnQuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICAgIGNsb25lQ29udGVudC5hcHBlbmRDaGlsZChjbG9uZU5vZGUoY2hpbGQsIHRydWUsIG9wdF9kb2MpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY29udGFpbnMoc2VsZiwgY2hpbGQpIHtcbiAgICAgIGlmICghY2hpbGQgfHwgZ2V0VHJlZVNjb3BlKHNlbGYpICE9PSBnZXRUcmVlU2NvcGUoY2hpbGQpKSByZXR1cm4gZmFsc2U7XG4gICAgICBmb3IgKHZhciBub2RlID0gY2hpbGQ7IG5vZGU7IG5vZGUgPSBub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUgPT09IHNlbGYpIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgT3JpZ2luYWxOb2RlID0gd2luZG93Lk5vZGU7XG4gICAgZnVuY3Rpb24gTm9kZShvcmlnaW5hbCkge1xuICAgICAgYXNzZXJ0KG9yaWdpbmFsIGluc3RhbmNlb2YgT3JpZ2luYWxOb2RlKTtcbiAgICAgIEV2ZW50VGFyZ2V0LmNhbGwodGhpcywgb3JpZ2luYWwpO1xuICAgICAgdGhpcy5wYXJlbnROb2RlXyA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuZmlyc3RDaGlsZF8gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLmxhc3RDaGlsZF8gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLm5leHRTaWJsaW5nXyA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMucHJldmlvdXNTaWJsaW5nXyA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMudHJlZVNjb3BlXyA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdmFyIE9yaWdpbmFsRG9jdW1lbnRGcmFnbWVudCA9IHdpbmRvdy5Eb2N1bWVudEZyYWdtZW50O1xuICAgIHZhciBvcmlnaW5hbEFwcGVuZENoaWxkID0gT3JpZ2luYWxOb2RlLnByb3RvdHlwZS5hcHBlbmRDaGlsZDtcbiAgICB2YXIgb3JpZ2luYWxDb21wYXJlRG9jdW1lbnRQb3NpdGlvbiA9IE9yaWdpbmFsTm9kZS5wcm90b3R5cGUuY29tcGFyZURvY3VtZW50UG9zaXRpb247XG4gICAgdmFyIG9yaWdpbmFsSXNFcXVhbE5vZGUgPSBPcmlnaW5hbE5vZGUucHJvdG90eXBlLmlzRXF1YWxOb2RlO1xuICAgIHZhciBvcmlnaW5hbEluc2VydEJlZm9yZSA9IE9yaWdpbmFsTm9kZS5wcm90b3R5cGUuaW5zZXJ0QmVmb3JlO1xuICAgIHZhciBvcmlnaW5hbFJlbW92ZUNoaWxkID0gT3JpZ2luYWxOb2RlLnByb3RvdHlwZS5yZW1vdmVDaGlsZDtcbiAgICB2YXIgb3JpZ2luYWxSZXBsYWNlQ2hpbGQgPSBPcmlnaW5hbE5vZGUucHJvdG90eXBlLnJlcGxhY2VDaGlsZDtcbiAgICB2YXIgaXNJRU9yRWRnZSA9IC9UcmlkZW50fEVkZ2UvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gICAgdmFyIHJlbW92ZUNoaWxkT3JpZ2luYWxIZWxwZXIgPSBpc0lFT3JFZGdlID8gZnVuY3Rpb24ocGFyZW50LCBjaGlsZCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgb3JpZ2luYWxSZW1vdmVDaGlsZC5jYWxsKHBhcmVudCwgY2hpbGQpO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgaWYgKCEocGFyZW50IGluc3RhbmNlb2YgT3JpZ2luYWxEb2N1bWVudEZyYWdtZW50KSkgdGhyb3cgZXg7XG4gICAgICB9XG4gICAgfSA6IGZ1bmN0aW9uKHBhcmVudCwgY2hpbGQpIHtcbiAgICAgIG9yaWdpbmFsUmVtb3ZlQ2hpbGQuY2FsbChwYXJlbnQsIGNoaWxkKTtcbiAgICB9O1xuICAgIE5vZGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFdmVudFRhcmdldC5wcm90b3R5cGUpO1xuICAgIG1peGluKE5vZGUucHJvdG90eXBlLCB7XG4gICAgICBhcHBlbmRDaGlsZDogZnVuY3Rpb24oY2hpbGRXcmFwcGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmluc2VydEJlZm9yZShjaGlsZFdyYXBwZXIsIG51bGwpO1xuICAgICAgfSxcbiAgICAgIGluc2VydEJlZm9yZTogZnVuY3Rpb24oY2hpbGRXcmFwcGVyLCByZWZXcmFwcGVyKSB7XG4gICAgICAgIGFzc2VydElzTm9kZVdyYXBwZXIoY2hpbGRXcmFwcGVyKTtcbiAgICAgICAgdmFyIHJlZk5vZGU7XG4gICAgICAgIGlmIChyZWZXcmFwcGVyKSB7XG4gICAgICAgICAgaWYgKGlzV3JhcHBlcihyZWZXcmFwcGVyKSkge1xuICAgICAgICAgICAgcmVmTm9kZSA9IHVud3JhcChyZWZXcmFwcGVyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVmTm9kZSA9IHJlZldyYXBwZXI7XG4gICAgICAgICAgICByZWZXcmFwcGVyID0gd3JhcChyZWZOb2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVmV3JhcHBlciA9IG51bGw7XG4gICAgICAgICAgcmVmTm9kZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmVmV3JhcHBlciAmJiBhc3NlcnQocmVmV3JhcHBlci5wYXJlbnROb2RlID09PSB0aGlzKTtcbiAgICAgICAgdmFyIG5vZGVzO1xuICAgICAgICB2YXIgcHJldmlvdXNOb2RlID0gcmVmV3JhcHBlciA/IHJlZldyYXBwZXIucHJldmlvdXNTaWJsaW5nIDogdGhpcy5sYXN0Q2hpbGQ7XG4gICAgICAgIHZhciB1c2VOYXRpdmUgPSAhdGhpcy5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIoKSAmJiAhaW52YWxpZGF0ZVBhcmVudChjaGlsZFdyYXBwZXIpO1xuICAgICAgICBpZiAodXNlTmF0aXZlKSBub2RlcyA9IGNvbGxlY3ROb2Rlc05hdGl2ZShjaGlsZFdyYXBwZXIpOyBlbHNlIG5vZGVzID0gY29sbGVjdE5vZGVzKGNoaWxkV3JhcHBlciwgdGhpcywgcHJldmlvdXNOb2RlLCByZWZXcmFwcGVyKTtcbiAgICAgICAgaWYgKHVzZU5hdGl2ZSkge1xuICAgICAgICAgIGVuc3VyZVNhbWVPd25lckRvY3VtZW50KHRoaXMsIGNoaWxkV3JhcHBlcik7XG4gICAgICAgICAgY2xlYXJDaGlsZE5vZGVzKHRoaXMpO1xuICAgICAgICAgIG9yaWdpbmFsSW5zZXJ0QmVmb3JlLmNhbGwodW5zYWZlVW53cmFwKHRoaXMpLCB1bndyYXAoY2hpbGRXcmFwcGVyKSwgcmVmTm9kZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCFwcmV2aW91c05vZGUpIHRoaXMuZmlyc3RDaGlsZF8gPSBub2Rlc1swXTtcbiAgICAgICAgICBpZiAoIXJlZldyYXBwZXIpIHtcbiAgICAgICAgICAgIHRoaXMubGFzdENoaWxkXyA9IG5vZGVzW25vZGVzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlyc3RDaGlsZF8gPT09IHVuZGVmaW5lZCkgdGhpcy5maXJzdENoaWxkXyA9IHRoaXMuZmlyc3RDaGlsZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSByZWZOb2RlID8gcmVmTm9kZS5wYXJlbnROb2RlIDogdW5zYWZlVW53cmFwKHRoaXMpO1xuICAgICAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBvcmlnaW5hbEluc2VydEJlZm9yZS5jYWxsKHBhcmVudE5vZGUsIHVud3JhcE5vZGVzRm9ySW5zZXJ0aW9uKHRoaXMsIG5vZGVzKSwgcmVmTm9kZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFkb3B0Tm9kZXNJZk5lZWRlZCh0aGlzLCBub2Rlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVucXVldWVNdXRhdGlvbih0aGlzLCBcImNoaWxkTGlzdFwiLCB7XG4gICAgICAgICAgYWRkZWROb2Rlczogbm9kZXMsXG4gICAgICAgICAgbmV4dFNpYmxpbmc6IHJlZldyYXBwZXIsXG4gICAgICAgICAgcHJldmlvdXNTaWJsaW5nOiBwcmV2aW91c05vZGVcbiAgICAgICAgfSk7XG4gICAgICAgIG5vZGVzV2VyZUFkZGVkKG5vZGVzLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGNoaWxkV3JhcHBlcjtcbiAgICAgIH0sXG4gICAgICByZW1vdmVDaGlsZDogZnVuY3Rpb24oY2hpbGRXcmFwcGVyKSB7XG4gICAgICAgIGFzc2VydElzTm9kZVdyYXBwZXIoY2hpbGRXcmFwcGVyKTtcbiAgICAgICAgaWYgKGNoaWxkV3JhcHBlci5wYXJlbnROb2RlICE9PSB0aGlzKSB7XG4gICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSB0aGlzLmNoaWxkTm9kZXM7XG4gICAgICAgICAgZm9yICh2YXIgaWVDaGlsZCA9IHRoaXMuZmlyc3RDaGlsZDsgaWVDaGlsZDsgaWVDaGlsZCA9IGllQ2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICAgIGlmIChpZUNoaWxkID09PSBjaGlsZFdyYXBwZXIpIHtcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90Rm91bmRFcnJvclwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNoaWxkTm9kZSA9IHVud3JhcChjaGlsZFdyYXBwZXIpO1xuICAgICAgICB2YXIgY2hpbGRXcmFwcGVyTmV4dFNpYmxpbmcgPSBjaGlsZFdyYXBwZXIubmV4dFNpYmxpbmc7XG4gICAgICAgIHZhciBjaGlsZFdyYXBwZXJQcmV2aW91c1NpYmxpbmcgPSBjaGlsZFdyYXBwZXIucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICBpZiAodGhpcy5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIoKSkge1xuICAgICAgICAgIHZhciB0aGlzRmlyc3RDaGlsZCA9IHRoaXMuZmlyc3RDaGlsZDtcbiAgICAgICAgICB2YXIgdGhpc0xhc3RDaGlsZCA9IHRoaXMubGFzdENoaWxkO1xuICAgICAgICAgIHZhciBwYXJlbnROb2RlID0gY2hpbGROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgaWYgKHBhcmVudE5vZGUpIHJlbW92ZUNoaWxkT3JpZ2luYWxIZWxwZXIocGFyZW50Tm9kZSwgY2hpbGROb2RlKTtcbiAgICAgICAgICBpZiAodGhpc0ZpcnN0Q2hpbGQgPT09IGNoaWxkV3JhcHBlcikgdGhpcy5maXJzdENoaWxkXyA9IGNoaWxkV3JhcHBlck5leHRTaWJsaW5nO1xuICAgICAgICAgIGlmICh0aGlzTGFzdENoaWxkID09PSBjaGlsZFdyYXBwZXIpIHRoaXMubGFzdENoaWxkXyA9IGNoaWxkV3JhcHBlclByZXZpb3VzU2libGluZztcbiAgICAgICAgICBpZiAoY2hpbGRXcmFwcGVyUHJldmlvdXNTaWJsaW5nKSBjaGlsZFdyYXBwZXJQcmV2aW91c1NpYmxpbmcubmV4dFNpYmxpbmdfID0gY2hpbGRXcmFwcGVyTmV4dFNpYmxpbmc7XG4gICAgICAgICAgaWYgKGNoaWxkV3JhcHBlck5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICBjaGlsZFdyYXBwZXJOZXh0U2libGluZy5wcmV2aW91c1NpYmxpbmdfID0gY2hpbGRXcmFwcGVyUHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjaGlsZFdyYXBwZXIucHJldmlvdXNTaWJsaW5nXyA9IGNoaWxkV3JhcHBlci5uZXh0U2libGluZ18gPSBjaGlsZFdyYXBwZXIucGFyZW50Tm9kZV8gPSB1bmRlZmluZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2xlYXJDaGlsZE5vZGVzKHRoaXMpO1xuICAgICAgICAgIHJlbW92ZUNoaWxkT3JpZ2luYWxIZWxwZXIodW5zYWZlVW53cmFwKHRoaXMpLCBjaGlsZE5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc3VycHJlc3NNdXRhdGlvbnMpIHtcbiAgICAgICAgICBlbnF1ZXVlTXV0YXRpb24odGhpcywgXCJjaGlsZExpc3RcIiwge1xuICAgICAgICAgICAgcmVtb3ZlZE5vZGVzOiBjcmVhdGVPbmVFbGVtZW50Tm9kZUxpc3QoY2hpbGRXcmFwcGVyKSxcbiAgICAgICAgICAgIG5leHRTaWJsaW5nOiBjaGlsZFdyYXBwZXJOZXh0U2libGluZyxcbiAgICAgICAgICAgIHByZXZpb3VzU2libGluZzogY2hpbGRXcmFwcGVyUHJldmlvdXNTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVnaXN0ZXJUcmFuc2llbnRPYnNlcnZlcnModGhpcywgY2hpbGRXcmFwcGVyKTtcbiAgICAgICAgcmV0dXJuIGNoaWxkV3JhcHBlcjtcbiAgICAgIH0sXG4gICAgICByZXBsYWNlQ2hpbGQ6IGZ1bmN0aW9uKG5ld0NoaWxkV3JhcHBlciwgb2xkQ2hpbGRXcmFwcGVyKSB7XG4gICAgICAgIGFzc2VydElzTm9kZVdyYXBwZXIobmV3Q2hpbGRXcmFwcGVyKTtcbiAgICAgICAgdmFyIG9sZENoaWxkTm9kZTtcbiAgICAgICAgaWYgKGlzV3JhcHBlcihvbGRDaGlsZFdyYXBwZXIpKSB7XG4gICAgICAgICAgb2xkQ2hpbGROb2RlID0gdW53cmFwKG9sZENoaWxkV3JhcHBlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb2xkQ2hpbGROb2RlID0gb2xkQ2hpbGRXcmFwcGVyO1xuICAgICAgICAgIG9sZENoaWxkV3JhcHBlciA9IHdyYXAob2xkQ2hpbGROb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob2xkQ2hpbGRXcmFwcGVyLnBhcmVudE5vZGUgIT09IHRoaXMpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3RGb3VuZEVycm9yXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuZXh0Tm9kZSA9IG9sZENoaWxkV3JhcHBlci5uZXh0U2libGluZztcbiAgICAgICAgdmFyIHByZXZpb3VzTm9kZSA9IG9sZENoaWxkV3JhcHBlci5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgIHZhciBub2RlcztcbiAgICAgICAgdmFyIHVzZU5hdGl2ZSA9ICF0aGlzLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcigpICYmICFpbnZhbGlkYXRlUGFyZW50KG5ld0NoaWxkV3JhcHBlcik7XG4gICAgICAgIGlmICh1c2VOYXRpdmUpIHtcbiAgICAgICAgICBub2RlcyA9IGNvbGxlY3ROb2Rlc05hdGl2ZShuZXdDaGlsZFdyYXBwZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChuZXh0Tm9kZSA9PT0gbmV3Q2hpbGRXcmFwcGVyKSBuZXh0Tm9kZSA9IG5ld0NoaWxkV3JhcHBlci5uZXh0U2libGluZztcbiAgICAgICAgICBub2RlcyA9IGNvbGxlY3ROb2RlcyhuZXdDaGlsZFdyYXBwZXIsIHRoaXMsIHByZXZpb3VzTm9kZSwgbmV4dE5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdXNlTmF0aXZlKSB7XG4gICAgICAgICAgaWYgKHRoaXMuZmlyc3RDaGlsZCA9PT0gb2xkQ2hpbGRXcmFwcGVyKSB0aGlzLmZpcnN0Q2hpbGRfID0gbm9kZXNbMF07XG4gICAgICAgICAgaWYgKHRoaXMubGFzdENoaWxkID09PSBvbGRDaGlsZFdyYXBwZXIpIHRoaXMubGFzdENoaWxkXyA9IG5vZGVzW25vZGVzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgIG9sZENoaWxkV3JhcHBlci5wcmV2aW91c1NpYmxpbmdfID0gb2xkQ2hpbGRXcmFwcGVyLm5leHRTaWJsaW5nXyA9IG9sZENoaWxkV3JhcHBlci5wYXJlbnROb2RlXyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAob2xkQ2hpbGROb2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIG9yaWdpbmFsUmVwbGFjZUNoaWxkLmNhbGwob2xkQ2hpbGROb2RlLnBhcmVudE5vZGUsIHVud3JhcE5vZGVzRm9ySW5zZXJ0aW9uKHRoaXMsIG5vZGVzKSwgb2xkQ2hpbGROb2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW5zdXJlU2FtZU93bmVyRG9jdW1lbnQodGhpcywgbmV3Q2hpbGRXcmFwcGVyKTtcbiAgICAgICAgICBjbGVhckNoaWxkTm9kZXModGhpcyk7XG4gICAgICAgICAgb3JpZ2luYWxSZXBsYWNlQ2hpbGQuY2FsbCh1bnNhZmVVbndyYXAodGhpcyksIHVud3JhcChuZXdDaGlsZFdyYXBwZXIpLCBvbGRDaGlsZE5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGVucXVldWVNdXRhdGlvbih0aGlzLCBcImNoaWxkTGlzdFwiLCB7XG4gICAgICAgICAgYWRkZWROb2Rlczogbm9kZXMsXG4gICAgICAgICAgcmVtb3ZlZE5vZGVzOiBjcmVhdGVPbmVFbGVtZW50Tm9kZUxpc3Qob2xkQ2hpbGRXcmFwcGVyKSxcbiAgICAgICAgICBuZXh0U2libGluZzogbmV4dE5vZGUsXG4gICAgICAgICAgcHJldmlvdXNTaWJsaW5nOiBwcmV2aW91c05vZGVcbiAgICAgICAgfSk7XG4gICAgICAgIG5vZGVXYXNSZW1vdmVkKG9sZENoaWxkV3JhcHBlcik7XG4gICAgICAgIG5vZGVzV2VyZUFkZGVkKG5vZGVzLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIG9sZENoaWxkV3JhcHBlcjtcbiAgICAgIH0sXG4gICAgICBub2RlSXNJbnNlcnRlZF86IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBjaGlsZCA9IHRoaXMuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICBjaGlsZC5ub2RlSXNJbnNlcnRlZF8oKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGhhc0NoaWxkTm9kZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5maXJzdENoaWxkICE9PSBudWxsO1xuICAgICAgfSxcbiAgICAgIGdldCBwYXJlbnROb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnROb2RlXyAhPT0gdW5kZWZpbmVkID8gdGhpcy5wYXJlbnROb2RlXyA6IHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLnBhcmVudE5vZGUpO1xuICAgICAgfSxcbiAgICAgIGdldCBmaXJzdENoaWxkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5maXJzdENoaWxkXyAhPT0gdW5kZWZpbmVkID8gdGhpcy5maXJzdENoaWxkXyA6IHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmZpcnN0Q2hpbGQpO1xuICAgICAgfSxcbiAgICAgIGdldCBsYXN0Q2hpbGQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxhc3RDaGlsZF8gIT09IHVuZGVmaW5lZCA/IHRoaXMubGFzdENoaWxkXyA6IHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmxhc3RDaGlsZCk7XG4gICAgICB9LFxuICAgICAgZ2V0IG5leHRTaWJsaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uZXh0U2libGluZ18gIT09IHVuZGVmaW5lZCA/IHRoaXMubmV4dFNpYmxpbmdfIDogd3JhcCh1bnNhZmVVbndyYXAodGhpcykubmV4dFNpYmxpbmcpO1xuICAgICAgfSxcbiAgICAgIGdldCBwcmV2aW91c1NpYmxpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnByZXZpb3VzU2libGluZ18gIT09IHVuZGVmaW5lZCA/IHRoaXMucHJldmlvdXNTaWJsaW5nXyA6IHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLnByZXZpb3VzU2libGluZyk7XG4gICAgICB9LFxuICAgICAgZ2V0IHBhcmVudEVsZW1lbnQoKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5wYXJlbnROb2RlO1xuICAgICAgICB3aGlsZSAocCAmJiBwLm5vZGVUeXBlICE9PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgIHAgPSBwLnBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHA7XG4gICAgICB9LFxuICAgICAgZ2V0IHRleHRDb250ZW50KCkge1xuICAgICAgICB2YXIgcyA9IFwiXCI7XG4gICAgICAgIGZvciAodmFyIGNoaWxkID0gdGhpcy5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSAhPSBOb2RlLkNPTU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgcyArPSBjaGlsZC50ZXh0Q29udGVudDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHM7XG4gICAgICB9LFxuICAgICAgc2V0IHRleHRDb250ZW50KHRleHRDb250ZW50KSB7XG4gICAgICAgIGlmICh0ZXh0Q29udGVudCA9PSBudWxsKSB0ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgIHZhciByZW1vdmVkTm9kZXMgPSBzbmFwc2hvdE5vZGVMaXN0KHRoaXMuY2hpbGROb2Rlcyk7XG4gICAgICAgIGlmICh0aGlzLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcigpKSB7XG4gICAgICAgICAgcmVtb3ZlQWxsQ2hpbGROb2Rlcyh0aGlzKTtcbiAgICAgICAgICBpZiAodGV4dENvbnRlbnQgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIHZhciB0ZXh0Tm9kZSA9IHVuc2FmZVVud3JhcCh0aGlzKS5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHRDb250ZW50KTtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGV4dE5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjbGVhckNoaWxkTm9kZXModGhpcyk7XG4gICAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnRleHRDb250ZW50ID0gdGV4dENvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFkZGVkTm9kZXMgPSBzbmFwc2hvdE5vZGVMaXN0KHRoaXMuY2hpbGROb2Rlcyk7XG4gICAgICAgIGVucXVldWVNdXRhdGlvbih0aGlzLCBcImNoaWxkTGlzdFwiLCB7XG4gICAgICAgICAgYWRkZWROb2RlczogYWRkZWROb2RlcyxcbiAgICAgICAgICByZW1vdmVkTm9kZXM6IHJlbW92ZWROb2Rlc1xuICAgICAgICB9KTtcbiAgICAgICAgbm9kZXNXZXJlUmVtb3ZlZChyZW1vdmVkTm9kZXMpO1xuICAgICAgICBub2Rlc1dlcmVBZGRlZChhZGRlZE5vZGVzLCB0aGlzKTtcbiAgICAgIH0sXG4gICAgICBnZXQgY2hpbGROb2RlcygpIHtcbiAgICAgICAgdmFyIHdyYXBwZXJMaXN0ID0gbmV3IE5vZGVMaXN0KCk7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgPSB0aGlzLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgd3JhcHBlckxpc3RbaSsrXSA9IGNoaWxkO1xuICAgICAgICB9XG4gICAgICAgIHdyYXBwZXJMaXN0Lmxlbmd0aCA9IGk7XG4gICAgICAgIHJldHVybiB3cmFwcGVyTGlzdDtcbiAgICAgIH0sXG4gICAgICBjbG9uZU5vZGU6IGZ1bmN0aW9uKGRlZXApIHtcbiAgICAgICAgcmV0dXJuIGNsb25lTm9kZSh0aGlzLCBkZWVwKTtcbiAgICAgIH0sXG4gICAgICBjb250YWluczogZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgcmV0dXJuIGNvbnRhaW5zKHRoaXMsIHdyYXBJZk5lZWRlZChjaGlsZCkpO1xuICAgICAgfSxcbiAgICAgIGNvbXBhcmVEb2N1bWVudFBvc2l0aW9uOiBmdW5jdGlvbihvdGhlck5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsQ29tcGFyZURvY3VtZW50UG9zaXRpb24uY2FsbCh1bnNhZmVVbndyYXAodGhpcyksIHVud3JhcElmTmVlZGVkKG90aGVyTm9kZSkpO1xuICAgICAgfSxcbiAgICAgIGlzRXF1YWxOb2RlOiBmdW5jdGlvbihvdGhlck5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsSXNFcXVhbE5vZGUuY2FsbCh1bnNhZmVVbndyYXAodGhpcyksIHVud3JhcElmTmVlZGVkKG90aGVyTm9kZSkpO1xuICAgICAgfSxcbiAgICAgIG5vcm1hbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlcyA9IHNuYXBzaG90Tm9kZUxpc3QodGhpcy5jaGlsZE5vZGVzKTtcbiAgICAgICAgdmFyIHJlbU5vZGVzID0gW107XG4gICAgICAgIHZhciBzID0gXCJcIjtcbiAgICAgICAgdmFyIG1vZE5vZGU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBuOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBuID0gbm9kZXNbaV07XG4gICAgICAgICAgaWYgKG4ubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgICAgICAgICBpZiAoIW1vZE5vZGUgJiYgIW4uZGF0YS5sZW5ndGgpIHRoaXMucmVtb3ZlQ2hpbGQobik7IGVsc2UgaWYgKCFtb2ROb2RlKSBtb2ROb2RlID0gbjsgZWxzZSB7XG4gICAgICAgICAgICAgIHMgKz0gbi5kYXRhO1xuICAgICAgICAgICAgICByZW1Ob2Rlcy5wdXNoKG4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobW9kTm9kZSAmJiByZW1Ob2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbW9kTm9kZS5kYXRhICs9IHM7XG4gICAgICAgICAgICAgIGNsZWFudXBOb2RlcyhyZW1Ob2Rlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZW1Ob2RlcyA9IFtdO1xuICAgICAgICAgICAgcyA9IFwiXCI7XG4gICAgICAgICAgICBtb2ROb2RlID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChuLmNoaWxkTm9kZXMubGVuZ3RoKSBuLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobW9kTm9kZSAmJiByZW1Ob2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgICBtb2ROb2RlLmRhdGEgKz0gcztcbiAgICAgICAgICBjbGVhbnVwTm9kZXMocmVtTm9kZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgZGVmaW5lV3JhcEdldHRlcihOb2RlLCBcIm93bmVyRG9jdW1lbnRcIik7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsTm9kZSwgTm9kZSwgZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTtcbiAgICBkZWxldGUgTm9kZS5wcm90b3R5cGUucXVlcnlTZWxlY3RvcjtcbiAgICBkZWxldGUgTm9kZS5wcm90b3R5cGUucXVlcnlTZWxlY3RvckFsbDtcbiAgICBOb2RlLnByb3RvdHlwZSA9IG1peGluKE9iamVjdC5jcmVhdGUoRXZlbnRUYXJnZXQucHJvdG90eXBlKSwgTm9kZS5wcm90b3R5cGUpO1xuICAgIHNjb3BlLmNsb25lTm9kZSA9IGNsb25lTm9kZTtcbiAgICBzY29wZS5ub2RlV2FzQWRkZWQgPSBub2RlV2FzQWRkZWQ7XG4gICAgc2NvcGUubm9kZVdhc1JlbW92ZWQgPSBub2RlV2FzUmVtb3ZlZDtcbiAgICBzY29wZS5ub2Rlc1dlcmVBZGRlZCA9IG5vZGVzV2VyZUFkZGVkO1xuICAgIHNjb3BlLm5vZGVzV2VyZVJlbW92ZWQgPSBub2Rlc1dlcmVSZW1vdmVkO1xuICAgIHNjb3BlLm9yaWdpbmFsSW5zZXJ0QmVmb3JlID0gb3JpZ2luYWxJbnNlcnRCZWZvcmU7XG4gICAgc2NvcGUub3JpZ2luYWxSZW1vdmVDaGlsZCA9IG9yaWdpbmFsUmVtb3ZlQ2hpbGQ7XG4gICAgc2NvcGUuc25hcHNob3ROb2RlTGlzdCA9IHNuYXBzaG90Tm9kZUxpc3Q7XG4gICAgc2NvcGUud3JhcHBlcnMuTm9kZSA9IE5vZGU7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MQ29sbGVjdGlvbiA9IHNjb3BlLndyYXBwZXJzLkhUTUxDb2xsZWN0aW9uO1xuICAgIHZhciBOb2RlTGlzdCA9IHNjb3BlLndyYXBwZXJzLk5vZGVMaXN0O1xuICAgIHZhciBnZXRUcmVlU2NvcGUgPSBzY29wZS5nZXRUcmVlU2NvcGU7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIG9yaWdpbmFsRG9jdW1lbnRRdWVyeVNlbGVjdG9yID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjtcbiAgICB2YXIgb3JpZ2luYWxFbGVtZW50UXVlcnlTZWxlY3RvciA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yO1xuICAgIHZhciBvcmlnaW5hbERvY3VtZW50UXVlcnlTZWxlY3RvckFsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw7XG4gICAgdmFyIG9yaWdpbmFsRWxlbWVudFF1ZXJ5U2VsZWN0b3JBbGwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbDtcbiAgICB2YXIgb3JpZ2luYWxEb2N1bWVudEdldEVsZW1lbnRzQnlUYWdOYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWU7XG4gICAgdmFyIG9yaWdpbmFsRWxlbWVudEdldEVsZW1lbnRzQnlUYWdOYW1lID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lO1xuICAgIHZhciBvcmlnaW5hbERvY3VtZW50R2V0RWxlbWVudHNCeVRhZ05hbWVOUyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lTlM7XG4gICAgdmFyIG9yaWdpbmFsRWxlbWVudEdldEVsZW1lbnRzQnlUYWdOYW1lTlMgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWVOUztcbiAgICB2YXIgT3JpZ2luYWxFbGVtZW50ID0gd2luZG93LkVsZW1lbnQ7XG4gICAgdmFyIE9yaWdpbmFsRG9jdW1lbnQgPSB3aW5kb3cuSFRNTERvY3VtZW50IHx8IHdpbmRvdy5Eb2N1bWVudDtcbiAgICBmdW5jdGlvbiBmaWx0ZXJOb2RlTGlzdChsaXN0LCBpbmRleCwgcmVzdWx0LCBkZWVwKSB7XG4gICAgICB2YXIgd3JhcHBlZEl0ZW0gPSBudWxsO1xuICAgICAgdmFyIHJvb3QgPSBudWxsO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgd3JhcHBlZEl0ZW0gPSB3cmFwKGxpc3RbaV0pO1xuICAgICAgICBpZiAoIWRlZXAgJiYgKHJvb3QgPSBnZXRUcmVlU2NvcGUod3JhcHBlZEl0ZW0pLnJvb3QpKSB7XG4gICAgICAgICAgaWYgKHJvb3QgaW5zdGFuY2VvZiBzY29wZS53cmFwcGVycy5TaGFkb3dSb290KSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0W2luZGV4KytdID0gd3JhcHBlZEl0ZW07XG4gICAgICB9XG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNoaW1TZWxlY3RvcihzZWxlY3Rvcikge1xuICAgICAgcmV0dXJuIFN0cmluZyhzZWxlY3RvcikucmVwbGFjZSgvXFwvZGVlcFxcL3w6OnNoYWRvd3w+Pj4vZywgXCIgXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzaGltTWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yKSB7XG4gICAgICByZXR1cm4gU3RyaW5nKHNlbGVjdG9yKS5yZXBsYWNlKC86aG9zdFxcKChbXlxcc10rKVxcKS9nLCBcIiQxXCIpLnJlcGxhY2UoLyhbXlxcc10pOmhvc3QvZywgXCIkMVwiKS5yZXBsYWNlKFwiOmhvc3RcIiwgXCIqXCIpLnJlcGxhY2UoL1xcXnxcXC9zaGFkb3dcXC98XFwvc2hhZG93LWRlZXBcXC98OjpzaGFkb3d8XFwvZGVlcFxcL3w6OmNvbnRlbnR8Pj4+L2csIFwiIFwiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZmluZE9uZShub2RlLCBzZWxlY3Rvcikge1xuICAgICAgdmFyIG0sIGVsID0gbm9kZS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgIHdoaWxlIChlbCkge1xuICAgICAgICBpZiAoZWwubWF0Y2hlcyhzZWxlY3RvcikpIHJldHVybiBlbDtcbiAgICAgICAgbSA9IGZpbmRPbmUoZWwsIHNlbGVjdG9yKTtcbiAgICAgICAgaWYgKG0pIHJldHVybiBtO1xuICAgICAgICBlbCA9IGVsLm5leHRFbGVtZW50U2libGluZztcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IoZWwsIHNlbGVjdG9yKSB7XG4gICAgICByZXR1cm4gZWwubWF0Y2hlcyhzZWxlY3Rvcik7XG4gICAgfVxuICAgIHZhciBYSFRNTF9OUyA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiO1xuICAgIGZ1bmN0aW9uIG1hdGNoZXNUYWdOYW1lKGVsLCBsb2NhbE5hbWUsIGxvY2FsTmFtZUxvd2VyQ2FzZSkge1xuICAgICAgdmFyIGxuID0gZWwubG9jYWxOYW1lO1xuICAgICAgcmV0dXJuIGxuID09PSBsb2NhbE5hbWUgfHwgbG4gPT09IGxvY2FsTmFtZUxvd2VyQ2FzZSAmJiBlbC5uYW1lc3BhY2VVUkkgPT09IFhIVE1MX05TO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtYXRjaGVzRXZlcnlUaGluZygpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtYXRjaGVzTG9jYWxOYW1lT25seShlbCwgbnMsIGxvY2FsTmFtZSkge1xuICAgICAgcmV0dXJuIGVsLmxvY2FsTmFtZSA9PT0gbG9jYWxOYW1lO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtYXRjaGVzTmFtZVNwYWNlKGVsLCBucykge1xuICAgICAgcmV0dXJuIGVsLm5hbWVzcGFjZVVSSSA9PT0gbnM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG1hdGNoZXNMb2NhbE5hbWVOUyhlbCwgbnMsIGxvY2FsTmFtZSkge1xuICAgICAgcmV0dXJuIGVsLm5hbWVzcGFjZVVSSSA9PT0gbnMgJiYgZWwubG9jYWxOYW1lID09PSBsb2NhbE5hbWU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZpbmRFbGVtZW50cyhub2RlLCBpbmRleCwgcmVzdWx0LCBwLCBhcmcwLCBhcmcxKSB7XG4gICAgICB2YXIgZWwgPSBub2RlLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgd2hpbGUgKGVsKSB7XG4gICAgICAgIGlmIChwKGVsLCBhcmcwLCBhcmcxKSkgcmVzdWx0W2luZGV4KytdID0gZWw7XG4gICAgICAgIGluZGV4ID0gZmluZEVsZW1lbnRzKGVsLCBpbmRleCwgcmVzdWx0LCBwLCBhcmcwLCBhcmcxKTtcbiAgICAgICAgZWwgPSBlbC5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgICB9XG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHF1ZXJ5U2VsZWN0b3JBbGxGaWx0ZXJlZChwLCBpbmRleCwgcmVzdWx0LCBzZWxlY3RvciwgZGVlcCkge1xuICAgICAgdmFyIHRhcmdldCA9IHVuc2FmZVVud3JhcCh0aGlzKTtcbiAgICAgIHZhciBsaXN0O1xuICAgICAgdmFyIHJvb3QgPSBnZXRUcmVlU2NvcGUodGhpcykucm9vdDtcbiAgICAgIGlmIChyb290IGluc3RhbmNlb2Ygc2NvcGUud3JhcHBlcnMuU2hhZG93Um9vdCkge1xuICAgICAgICByZXR1cm4gZmluZEVsZW1lbnRzKHRoaXMsIGluZGV4LCByZXN1bHQsIHAsIHNlbGVjdG9yLCBudWxsKTtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgT3JpZ2luYWxFbGVtZW50KSB7XG4gICAgICAgIGxpc3QgPSBvcmlnaW5hbEVsZW1lbnRRdWVyeVNlbGVjdG9yQWxsLmNhbGwodGFyZ2V0LCBzZWxlY3Rvcik7XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE9yaWdpbmFsRG9jdW1lbnQpIHtcbiAgICAgICAgbGlzdCA9IG9yaWdpbmFsRG9jdW1lbnRRdWVyeVNlbGVjdG9yQWxsLmNhbGwodGFyZ2V0LCBzZWxlY3Rvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmluZEVsZW1lbnRzKHRoaXMsIGluZGV4LCByZXN1bHQsIHAsIHNlbGVjdG9yLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWx0ZXJOb2RlTGlzdChsaXN0LCBpbmRleCwgcmVzdWx0LCBkZWVwKTtcbiAgICB9XG4gICAgdmFyIFNlbGVjdG9yc0ludGVyZmFjZSA9IHtcbiAgICAgIHF1ZXJ5U2VsZWN0b3I6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBzaGltbWVkID0gc2hpbVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgdmFyIGRlZXAgPSBzaGltbWVkICE9PSBzZWxlY3RvcjtcbiAgICAgICAgc2VsZWN0b3IgPSBzaGltbWVkO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdW5zYWZlVW53cmFwKHRoaXMpO1xuICAgICAgICB2YXIgd3JhcHBlZEl0ZW07XG4gICAgICAgIHZhciByb290ID0gZ2V0VHJlZVNjb3BlKHRoaXMpLnJvb3Q7XG4gICAgICAgIGlmIChyb290IGluc3RhbmNlb2Ygc2NvcGUud3JhcHBlcnMuU2hhZG93Um9vdCkge1xuICAgICAgICAgIHJldHVybiBmaW5kT25lKHRoaXMsIHNlbGVjdG9yKTtcbiAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBPcmlnaW5hbEVsZW1lbnQpIHtcbiAgICAgICAgICB3cmFwcGVkSXRlbSA9IHdyYXAob3JpZ2luYWxFbGVtZW50UXVlcnlTZWxlY3Rvci5jYWxsKHRhcmdldCwgc2VsZWN0b3IpKTtcbiAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBPcmlnaW5hbERvY3VtZW50KSB7XG4gICAgICAgICAgd3JhcHBlZEl0ZW0gPSB3cmFwKG9yaWdpbmFsRG9jdW1lbnRRdWVyeVNlbGVjdG9yLmNhbGwodGFyZ2V0LCBzZWxlY3RvcikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmaW5kT25lKHRoaXMsIHNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdyYXBwZWRJdGVtKSB7XG4gICAgICAgICAgcmV0dXJuIHdyYXBwZWRJdGVtO1xuICAgICAgICB9IGVsc2UgaWYgKCFkZWVwICYmIChyb290ID0gZ2V0VHJlZVNjb3BlKHdyYXBwZWRJdGVtKS5yb290KSkge1xuICAgICAgICAgIGlmIChyb290IGluc3RhbmNlb2Ygc2NvcGUud3JhcHBlcnMuU2hhZG93Um9vdCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRPbmUodGhpcywgc2VsZWN0b3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd3JhcHBlZEl0ZW07XG4gICAgICB9LFxuICAgICAgcXVlcnlTZWxlY3RvckFsbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIHNoaW1tZWQgPSBzaGltU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICB2YXIgZGVlcCA9IHNoaW1tZWQgIT09IHNlbGVjdG9yO1xuICAgICAgICBzZWxlY3RvciA9IHNoaW1tZWQ7XG4gICAgICAgIHZhciByZXN1bHQgPSBuZXcgTm9kZUxpc3QoKTtcbiAgICAgICAgcmVzdWx0Lmxlbmd0aCA9IHF1ZXJ5U2VsZWN0b3JBbGxGaWx0ZXJlZC5jYWxsKHRoaXMsIG1hdGNoZXNTZWxlY3RvciwgMCwgcmVzdWx0LCBzZWxlY3RvciwgZGVlcCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgTWF0Y2hlc0ludGVyZmFjZSA9IHtcbiAgICAgIG1hdGNoZXM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgICAgIHNlbGVjdG9yID0gc2hpbU1hdGNoZXNTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgIHJldHVybiBzY29wZS5vcmlnaW5hbE1hdGNoZXMuY2FsbCh1bnNhZmVVbndyYXAodGhpcyksIHNlbGVjdG9yKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIGdldEVsZW1lbnRzQnlUYWdOYW1lRmlsdGVyZWQocCwgaW5kZXgsIHJlc3VsdCwgbG9jYWxOYW1lLCBsb3dlcmNhc2UpIHtcbiAgICAgIHZhciB0YXJnZXQgPSB1bnNhZmVVbndyYXAodGhpcyk7XG4gICAgICB2YXIgbGlzdDtcbiAgICAgIHZhciByb290ID0gZ2V0VHJlZVNjb3BlKHRoaXMpLnJvb3Q7XG4gICAgICBpZiAocm9vdCBpbnN0YW5jZW9mIHNjb3BlLndyYXBwZXJzLlNoYWRvd1Jvb3QpIHtcbiAgICAgICAgcmV0dXJuIGZpbmRFbGVtZW50cyh0aGlzLCBpbmRleCwgcmVzdWx0LCBwLCBsb2NhbE5hbWUsIGxvd2VyY2FzZSk7XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE9yaWdpbmFsRWxlbWVudCkge1xuICAgICAgICBsaXN0ID0gb3JpZ2luYWxFbGVtZW50R2V0RWxlbWVudHNCeVRhZ05hbWUuY2FsbCh0YXJnZXQsIGxvY2FsTmFtZSwgbG93ZXJjYXNlKTtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgT3JpZ2luYWxEb2N1bWVudCkge1xuICAgICAgICBsaXN0ID0gb3JpZ2luYWxEb2N1bWVudEdldEVsZW1lbnRzQnlUYWdOYW1lLmNhbGwodGFyZ2V0LCBsb2NhbE5hbWUsIGxvd2VyY2FzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmluZEVsZW1lbnRzKHRoaXMsIGluZGV4LCByZXN1bHQsIHAsIGxvY2FsTmFtZSwgbG93ZXJjYXNlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWx0ZXJOb2RlTGlzdChsaXN0LCBpbmRleCwgcmVzdWx0LCBmYWxzZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldEVsZW1lbnRzQnlUYWdOYW1lTlNGaWx0ZXJlZChwLCBpbmRleCwgcmVzdWx0LCBucywgbG9jYWxOYW1lKSB7XG4gICAgICB2YXIgdGFyZ2V0ID0gdW5zYWZlVW53cmFwKHRoaXMpO1xuICAgICAgdmFyIGxpc3Q7XG4gICAgICB2YXIgcm9vdCA9IGdldFRyZWVTY29wZSh0aGlzKS5yb290O1xuICAgICAgaWYgKHJvb3QgaW5zdGFuY2VvZiBzY29wZS53cmFwcGVycy5TaGFkb3dSb290KSB7XG4gICAgICAgIHJldHVybiBmaW5kRWxlbWVudHModGhpcywgaW5kZXgsIHJlc3VsdCwgcCwgbnMsIGxvY2FsTmFtZSk7XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE9yaWdpbmFsRWxlbWVudCkge1xuICAgICAgICBsaXN0ID0gb3JpZ2luYWxFbGVtZW50R2V0RWxlbWVudHNCeVRhZ05hbWVOUy5jYWxsKHRhcmdldCwgbnMsIGxvY2FsTmFtZSk7XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE9yaWdpbmFsRG9jdW1lbnQpIHtcbiAgICAgICAgbGlzdCA9IG9yaWdpbmFsRG9jdW1lbnRHZXRFbGVtZW50c0J5VGFnTmFtZU5TLmNhbGwodGFyZ2V0LCBucywgbG9jYWxOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmaW5kRWxlbWVudHModGhpcywgaW5kZXgsIHJlc3VsdCwgcCwgbnMsIGxvY2FsTmFtZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmlsdGVyTm9kZUxpc3QobGlzdCwgaW5kZXgsIHJlc3VsdCwgZmFsc2UpO1xuICAgIH1cbiAgICB2YXIgR2V0RWxlbWVudHNCeUludGVyZmFjZSA9IHtcbiAgICAgIGdldEVsZW1lbnRzQnlUYWdOYW1lOiBmdW5jdGlvbihsb2NhbE5hbWUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBIVE1MQ29sbGVjdGlvbigpO1xuICAgICAgICB2YXIgbWF0Y2ggPSBsb2NhbE5hbWUgPT09IFwiKlwiID8gbWF0Y2hlc0V2ZXJ5VGhpbmcgOiBtYXRjaGVzVGFnTmFtZTtcbiAgICAgICAgcmVzdWx0Lmxlbmd0aCA9IGdldEVsZW1lbnRzQnlUYWdOYW1lRmlsdGVyZWQuY2FsbCh0aGlzLCBtYXRjaCwgMCwgcmVzdWx0LCBsb2NhbE5hbWUsIGxvY2FsTmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0sXG4gICAgICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lOiBmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvckFsbChcIi5cIiArIGNsYXNzTmFtZSk7XG4gICAgICB9LFxuICAgICAgZ2V0RWxlbWVudHNCeVRhZ05hbWVOUzogZnVuY3Rpb24obnMsIGxvY2FsTmFtZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IEhUTUxDb2xsZWN0aW9uKCk7XG4gICAgICAgIHZhciBtYXRjaCA9IG51bGw7XG4gICAgICAgIGlmIChucyA9PT0gXCIqXCIpIHtcbiAgICAgICAgICBtYXRjaCA9IGxvY2FsTmFtZSA9PT0gXCIqXCIgPyBtYXRjaGVzRXZlcnlUaGluZyA6IG1hdGNoZXNMb2NhbE5hbWVPbmx5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoID0gbG9jYWxOYW1lID09PSBcIipcIiA/IG1hdGNoZXNOYW1lU3BhY2UgOiBtYXRjaGVzTG9jYWxOYW1lTlM7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0Lmxlbmd0aCA9IGdldEVsZW1lbnRzQnlUYWdOYW1lTlNGaWx0ZXJlZC5jYWxsKHRoaXMsIG1hdGNoLCAwLCByZXN1bHQsIG5zIHx8IG51bGwsIGxvY2FsTmFtZSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfTtcbiAgICBzY29wZS5HZXRFbGVtZW50c0J5SW50ZXJmYWNlID0gR2V0RWxlbWVudHNCeUludGVyZmFjZTtcbiAgICBzY29wZS5TZWxlY3RvcnNJbnRlcmZhY2UgPSBTZWxlY3RvcnNJbnRlcmZhY2U7XG4gICAgc2NvcGUuTWF0Y2hlc0ludGVyZmFjZSA9IE1hdGNoZXNJbnRlcmZhY2U7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBOb2RlTGlzdCA9IHNjb3BlLndyYXBwZXJzLk5vZGVMaXN0O1xuICAgIGZ1bmN0aW9uIGZvcndhcmRFbGVtZW50KG5vZGUpIHtcbiAgICAgIHdoaWxlIChub2RlICYmIG5vZGUubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIG5vZGUgPSBub2RlLm5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGJhY2t3YXJkc0VsZW1lbnQobm9kZSkge1xuICAgICAgd2hpbGUgKG5vZGUgJiYgbm9kZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgbm9kZSA9IG5vZGUucHJldmlvdXNTaWJsaW5nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICAgIHZhciBQYXJlbnROb2RlSW50ZXJmYWNlID0ge1xuICAgICAgZ2V0IGZpcnN0RWxlbWVudENoaWxkKCkge1xuICAgICAgICByZXR1cm4gZm9yd2FyZEVsZW1lbnQodGhpcy5maXJzdENoaWxkKTtcbiAgICAgIH0sXG4gICAgICBnZXQgbGFzdEVsZW1lbnRDaGlsZCgpIHtcbiAgICAgICAgcmV0dXJuIGJhY2t3YXJkc0VsZW1lbnQodGhpcy5sYXN0Q2hpbGQpO1xuICAgICAgfSxcbiAgICAgIGdldCBjaGlsZEVsZW1lbnRDb3VudCgpIHtcbiAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgPSB0aGlzLmZpcnN0RWxlbWVudENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0RWxlbWVudFNpYmxpbmcpIHtcbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb3VudDtcbiAgICAgIH0sXG4gICAgICBnZXQgY2hpbGRyZW4oKSB7XG4gICAgICAgIHZhciB3cmFwcGVyTGlzdCA9IG5ldyBOb2RlTGlzdCgpO1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIGZvciAodmFyIGNoaWxkID0gdGhpcy5maXJzdEVsZW1lbnRDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dEVsZW1lbnRTaWJsaW5nKSB7XG4gICAgICAgICAgd3JhcHBlckxpc3RbaSsrXSA9IGNoaWxkO1xuICAgICAgICB9XG4gICAgICAgIHdyYXBwZXJMaXN0Lmxlbmd0aCA9IGk7XG4gICAgICAgIHJldHVybiB3cmFwcGVyTGlzdDtcbiAgICAgIH0sXG4gICAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICAgICAgaWYgKHApIHAucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgQ2hpbGROb2RlSW50ZXJmYWNlID0ge1xuICAgICAgZ2V0IG5leHRFbGVtZW50U2libGluZygpIHtcbiAgICAgICAgcmV0dXJuIGZvcndhcmRFbGVtZW50KHRoaXMubmV4dFNpYmxpbmcpO1xuICAgICAgfSxcbiAgICAgIGdldCBwcmV2aW91c0VsZW1lbnRTaWJsaW5nKCkge1xuICAgICAgICByZXR1cm4gYmFja3dhcmRzRWxlbWVudCh0aGlzLnByZXZpb3VzU2libGluZyk7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgTm9uRWxlbWVudFBhcmVudE5vZGVJbnRlcmZhY2UgPSB7XG4gICAgICBnZXRFbGVtZW50QnlJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgaWYgKC9bIFxcdFxcblxcclxcZl0vLnRlc3QoaWQpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcignW2lkPVwiJyArIGlkICsgJ1wiXScpO1xuICAgICAgfVxuICAgIH07XG4gICAgc2NvcGUuQ2hpbGROb2RlSW50ZXJmYWNlID0gQ2hpbGROb2RlSW50ZXJmYWNlO1xuICAgIHNjb3BlLk5vbkVsZW1lbnRQYXJlbnROb2RlSW50ZXJmYWNlID0gTm9uRWxlbWVudFBhcmVudE5vZGVJbnRlcmZhY2U7XG4gICAgc2NvcGUuUGFyZW50Tm9kZUludGVyZmFjZSA9IFBhcmVudE5vZGVJbnRlcmZhY2U7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBDaGlsZE5vZGVJbnRlcmZhY2UgPSBzY29wZS5DaGlsZE5vZGVJbnRlcmZhY2U7XG4gICAgdmFyIE5vZGUgPSBzY29wZS53cmFwcGVycy5Ob2RlO1xuICAgIHZhciBlbnF1ZXVlTXV0YXRpb24gPSBzY29wZS5lbnF1ZXVlTXV0YXRpb247XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciBPcmlnaW5hbENoYXJhY3RlckRhdGEgPSB3aW5kb3cuQ2hhcmFjdGVyRGF0YTtcbiAgICBmdW5jdGlvbiBDaGFyYWN0ZXJEYXRhKG5vZGUpIHtcbiAgICAgIE5vZGUuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE5vZGUucHJvdG90eXBlKTtcbiAgICBtaXhpbihDaGFyYWN0ZXJEYXRhLnByb3RvdHlwZSwge1xuICAgICAgZ2V0IG5vZGVWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgICAgIH0sXG4gICAgICBzZXQgbm9kZVZhbHVlKGRhdGEpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgIH0sXG4gICAgICBnZXQgdGV4dENvbnRlbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGE7XG4gICAgICB9LFxuICAgICAgc2V0IHRleHRDb250ZW50KHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IHZhbHVlO1xuICAgICAgfSxcbiAgICAgIGdldCBkYXRhKCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLmRhdGE7XG4gICAgICB9LFxuICAgICAgc2V0IGRhdGEodmFsdWUpIHtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gdW5zYWZlVW53cmFwKHRoaXMpLmRhdGE7XG4gICAgICAgIGVucXVldWVNdXRhdGlvbih0aGlzLCBcImNoYXJhY3RlckRhdGFcIiwge1xuICAgICAgICAgIG9sZFZhbHVlOiBvbGRWYWx1ZVxuICAgICAgICB9KTtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLmRhdGEgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBtaXhpbihDaGFyYWN0ZXJEYXRhLnByb3RvdHlwZSwgQ2hpbGROb2RlSW50ZXJmYWNlKTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxDaGFyYWN0ZXJEYXRhLCBDaGFyYWN0ZXJEYXRhLCBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuQ2hhcmFjdGVyRGF0YSA9IENoYXJhY3RlckRhdGE7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBDaGFyYWN0ZXJEYXRhID0gc2NvcGUud3JhcHBlcnMuQ2hhcmFjdGVyRGF0YTtcbiAgICB2YXIgZW5xdWV1ZU11dGF0aW9uID0gc2NvcGUuZW5xdWV1ZU11dGF0aW9uO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgZnVuY3Rpb24gdG9VSW50MzIoeCkge1xuICAgICAgcmV0dXJuIHggPj4+IDA7XG4gICAgfVxuICAgIHZhciBPcmlnaW5hbFRleHQgPSB3aW5kb3cuVGV4dDtcbiAgICBmdW5jdGlvbiBUZXh0KG5vZGUpIHtcbiAgICAgIENoYXJhY3RlckRhdGEuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgVGV4dC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKENoYXJhY3RlckRhdGEucHJvdG90eXBlKTtcbiAgICBtaXhpbihUZXh0LnByb3RvdHlwZSwge1xuICAgICAgc3BsaXRUZXh0OiBmdW5jdGlvbihvZmZzZXQpIHtcbiAgICAgICAgb2Zmc2V0ID0gdG9VSW50MzIob2Zmc2V0KTtcbiAgICAgICAgdmFyIHMgPSB0aGlzLmRhdGE7XG4gICAgICAgIGlmIChvZmZzZXQgPiBzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKFwiSW5kZXhTaXplRXJyb3JcIik7XG4gICAgICAgIHZhciBoZWFkID0gcy5zbGljZSgwLCBvZmZzZXQpO1xuICAgICAgICB2YXIgdGFpbCA9IHMuc2xpY2Uob2Zmc2V0KTtcbiAgICAgICAgdGhpcy5kYXRhID0gaGVhZDtcbiAgICAgICAgdmFyIG5ld1RleHROb2RlID0gdGhpcy5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRhaWwpO1xuICAgICAgICBpZiAodGhpcy5wYXJlbnROb2RlKSB0aGlzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld1RleHROb2RlLCB0aGlzLm5leHRTaWJsaW5nKTtcbiAgICAgICAgcmV0dXJuIG5ld1RleHROb2RlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbFRleHQsIFRleHQsIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5UZXh0ID0gVGV4dDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgaWYgKCF3aW5kb3cuRE9NVG9rZW5MaXN0KSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJNaXNzaW5nIERPTVRva2VuTGlzdCBwcm90b3R5cGUsIHBsZWFzZSBpbmNsdWRlIGEgXCIgKyBcImNvbXBhdGlibGUgY2xhc3NMaXN0IHBvbHlmaWxsIHN1Y2ggYXMgaHR0cDovL2dvby5nbC91VGNlcEguXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciBlbnF1ZXVlTXV0YXRpb24gPSBzY29wZS5lbnF1ZXVlTXV0YXRpb247XG4gICAgZnVuY3Rpb24gZ2V0Q2xhc3MoZWwpIHtcbiAgICAgIHJldHVybiB1bnNhZmVVbndyYXAoZWwpLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBlbnF1ZXVlQ2xhc3NBdHRyaWJ1dGVDaGFuZ2UoZWwsIG9sZFZhbHVlKSB7XG4gICAgICBlbnF1ZXVlTXV0YXRpb24oZWwsIFwiYXR0cmlidXRlc1wiLCB7XG4gICAgICAgIG5hbWU6IFwiY2xhc3NcIixcbiAgICAgICAgbmFtZXNwYWNlOiBudWxsLFxuICAgICAgICBvbGRWYWx1ZTogb2xkVmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnZhbGlkYXRlQ2xhc3MoZWwpIHtcbiAgICAgIHNjb3BlLmludmFsaWRhdGVSZW5kZXJlckJhc2VkT25BdHRyaWJ1dGUoZWwsIFwiY2xhc3NcIik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNoYW5nZUNsYXNzKHRva2VuTGlzdCwgbWV0aG9kLCBhcmdzKSB7XG4gICAgICB2YXIgb3duZXJFbGVtZW50ID0gdG9rZW5MaXN0Lm93bmVyRWxlbWVudF87XG4gICAgICBpZiAob3duZXJFbGVtZW50ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG1ldGhvZC5hcHBseSh0b2tlbkxpc3QsIGFyZ3MpO1xuICAgICAgfVxuICAgICAgdmFyIG9sZFZhbHVlID0gZ2V0Q2xhc3Mob3duZXJFbGVtZW50KTtcbiAgICAgIHZhciByZXR2ID0gbWV0aG9kLmFwcGx5KHRva2VuTGlzdCwgYXJncyk7XG4gICAgICBpZiAoZ2V0Q2xhc3Mob3duZXJFbGVtZW50KSAhPT0gb2xkVmFsdWUpIHtcbiAgICAgICAgZW5xdWV1ZUNsYXNzQXR0cmlidXRlQ2hhbmdlKG93bmVyRWxlbWVudCwgb2xkVmFsdWUpO1xuICAgICAgICBpbnZhbGlkYXRlQ2xhc3Mob3duZXJFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXR2O1xuICAgIH1cbiAgICB2YXIgb2xkQWRkID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZS5hZGQ7XG4gICAgRE9NVG9rZW5MaXN0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGNoYW5nZUNsYXNzKHRoaXMsIG9sZEFkZCwgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIHZhciBvbGRSZW1vdmUgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlLnJlbW92ZTtcbiAgICBET01Ub2tlbkxpc3QucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgY2hhbmdlQ2xhc3ModGhpcywgb2xkUmVtb3ZlLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgdmFyIG9sZFRvZ2dsZSA9IERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlO1xuICAgIERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gY2hhbmdlQ2xhc3ModGhpcywgb2xkVG9nZ2xlLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBDaGlsZE5vZGVJbnRlcmZhY2UgPSBzY29wZS5DaGlsZE5vZGVJbnRlcmZhY2U7XG4gICAgdmFyIEdldEVsZW1lbnRzQnlJbnRlcmZhY2UgPSBzY29wZS5HZXRFbGVtZW50c0J5SW50ZXJmYWNlO1xuICAgIHZhciBOb2RlID0gc2NvcGUud3JhcHBlcnMuTm9kZTtcbiAgICB2YXIgUGFyZW50Tm9kZUludGVyZmFjZSA9IHNjb3BlLlBhcmVudE5vZGVJbnRlcmZhY2U7XG4gICAgdmFyIFNlbGVjdG9yc0ludGVyZmFjZSA9IHNjb3BlLlNlbGVjdG9yc0ludGVyZmFjZTtcbiAgICB2YXIgTWF0Y2hlc0ludGVyZmFjZSA9IHNjb3BlLk1hdGNoZXNJbnRlcmZhY2U7XG4gICAgdmFyIGFkZFdyYXBOb2RlTGlzdE1ldGhvZCA9IHNjb3BlLmFkZFdyYXBOb2RlTGlzdE1ldGhvZDtcbiAgICB2YXIgZW5xdWV1ZU11dGF0aW9uID0gc2NvcGUuZW5xdWV1ZU11dGF0aW9uO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciBvbmVPZiA9IHNjb3BlLm9uZU9mO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgd3JhcHBlcnMgPSBzY29wZS53cmFwcGVycztcbiAgICB2YXIgT3JpZ2luYWxFbGVtZW50ID0gd2luZG93LkVsZW1lbnQ7XG4gICAgdmFyIG1hdGNoZXNOYW1lcyA9IFsgXCJtYXRjaGVzXCIsIFwibW96TWF0Y2hlc1NlbGVjdG9yXCIsIFwibXNNYXRjaGVzU2VsZWN0b3JcIiwgXCJ3ZWJraXRNYXRjaGVzU2VsZWN0b3JcIiBdLmZpbHRlcihmdW5jdGlvbihuYW1lKSB7XG4gICAgICByZXR1cm4gT3JpZ2luYWxFbGVtZW50LnByb3RvdHlwZVtuYW1lXTtcbiAgICB9KTtcbiAgICB2YXIgbWF0Y2hlc05hbWUgPSBtYXRjaGVzTmFtZXNbMF07XG4gICAgdmFyIG9yaWdpbmFsTWF0Y2hlcyA9IE9yaWdpbmFsRWxlbWVudC5wcm90b3R5cGVbbWF0Y2hlc05hbWVdO1xuICAgIGZ1bmN0aW9uIGludmFsaWRhdGVSZW5kZXJlckJhc2VkT25BdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSkge1xuICAgICAgdmFyIHAgPSBlbGVtZW50LnBhcmVudE5vZGU7XG4gICAgICBpZiAoIXAgfHwgIXAuc2hhZG93Um9vdCkgcmV0dXJuO1xuICAgICAgdmFyIHJlbmRlcmVyID0gc2NvcGUuZ2V0UmVuZGVyZXJGb3JIb3N0KHApO1xuICAgICAgaWYgKHJlbmRlcmVyLmRlcGVuZHNPbkF0dHJpYnV0ZShuYW1lKSkgcmVuZGVyZXIuaW52YWxpZGF0ZSgpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBlbnF1ZUF0dHJpYnV0ZUNoYW5nZShlbGVtZW50LCBuYW1lLCBvbGRWYWx1ZSkge1xuICAgICAgZW5xdWV1ZU11dGF0aW9uKGVsZW1lbnQsIFwiYXR0cmlidXRlc1wiLCB7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIG5hbWVzcGFjZTogbnVsbCxcbiAgICAgICAgb2xkVmFsdWU6IG9sZFZhbHVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgdmFyIGNsYXNzTGlzdFRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICBmdW5jdGlvbiBFbGVtZW50KG5vZGUpIHtcbiAgICAgIE5vZGUuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE5vZGUucHJvdG90eXBlKTtcbiAgICBtaXhpbihFbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgY3JlYXRlU2hhZG93Um9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBuZXdTaGFkb3dSb290ID0gbmV3IHdyYXBwZXJzLlNoYWRvd1Jvb3QodGhpcyk7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5wb2x5bWVyU2hhZG93Um9vdF8gPSBuZXdTaGFkb3dSb290O1xuICAgICAgICB2YXIgcmVuZGVyZXIgPSBzY29wZS5nZXRSZW5kZXJlckZvckhvc3QodGhpcyk7XG4gICAgICAgIHJlbmRlcmVyLmludmFsaWRhdGUoKTtcbiAgICAgICAgcmV0dXJuIG5ld1NoYWRvd1Jvb3Q7XG4gICAgICB9LFxuICAgICAgZ2V0IHNoYWRvd1Jvb3QoKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykucG9seW1lclNoYWRvd1Jvb3RfIHx8IG51bGw7XG4gICAgICB9LFxuICAgICAgc2V0QXR0cmlidXRlOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSB1bnNhZmVVbndyYXAodGhpcykuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgZW5xdWVBdHRyaWJ1dGVDaGFuZ2UodGhpcywgbmFtZSwgb2xkVmFsdWUpO1xuICAgICAgICBpbnZhbGlkYXRlUmVuZGVyZXJCYXNlZE9uQXR0cmlidXRlKHRoaXMsIG5hbWUpO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZUF0dHJpYnV0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSB1bnNhZmVVbndyYXAodGhpcykuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgICBlbnF1ZUF0dHJpYnV0ZUNoYW5nZSh0aGlzLCBuYW1lLCBvbGRWYWx1ZSk7XG4gICAgICAgIGludmFsaWRhdGVSZW5kZXJlckJhc2VkT25BdHRyaWJ1dGUodGhpcywgbmFtZSk7XG4gICAgICB9LFxuICAgICAgZ2V0IGNsYXNzTGlzdCgpIHtcbiAgICAgICAgdmFyIGxpc3QgPSBjbGFzc0xpc3RUYWJsZS5nZXQodGhpcyk7XG4gICAgICAgIGlmICghbGlzdCkge1xuICAgICAgICAgIGxpc3QgPSB1bnNhZmVVbndyYXAodGhpcykuY2xhc3NMaXN0O1xuICAgICAgICAgIGlmICghbGlzdCkgcmV0dXJuO1xuICAgICAgICAgIGxpc3Qub3duZXJFbGVtZW50XyA9IHRoaXM7XG4gICAgICAgICAgY2xhc3NMaXN0VGFibGUuc2V0KHRoaXMsIGxpc3QpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaXN0O1xuICAgICAgfSxcbiAgICAgIGdldCBjbGFzc05hbWUoKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykuY2xhc3NOYW1lO1xuICAgICAgfSxcbiAgICAgIHNldCBjbGFzc05hbWUodikge1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIHYpO1xuICAgICAgfSxcbiAgICAgIGdldCBpZCgpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5pZDtcbiAgICAgIH0sXG4gICAgICBzZXQgaWQodikge1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImlkXCIsIHYpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIG1hdGNoZXNOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGlmIChuYW1lICE9PSBcIm1hdGNoZXNcIikge1xuICAgICAgICBFbGVtZW50LnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWF0Y2hlcyhzZWxlY3Rvcik7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKE9yaWdpbmFsRWxlbWVudC5wcm90b3R5cGUud2Via2l0Q3JlYXRlU2hhZG93Um9vdCkge1xuICAgICAgRWxlbWVudC5wcm90b3R5cGUud2Via2l0Q3JlYXRlU2hhZG93Um9vdCA9IEVsZW1lbnQucHJvdG90eXBlLmNyZWF0ZVNoYWRvd1Jvb3Q7XG4gICAgfVxuICAgIG1peGluKEVsZW1lbnQucHJvdG90eXBlLCBDaGlsZE5vZGVJbnRlcmZhY2UpO1xuICAgIG1peGluKEVsZW1lbnQucHJvdG90eXBlLCBHZXRFbGVtZW50c0J5SW50ZXJmYWNlKTtcbiAgICBtaXhpbihFbGVtZW50LnByb3RvdHlwZSwgUGFyZW50Tm9kZUludGVyZmFjZSk7XG4gICAgbWl4aW4oRWxlbWVudC5wcm90b3R5cGUsIFNlbGVjdG9yc0ludGVyZmFjZSk7XG4gICAgbWl4aW4oRWxlbWVudC5wcm90b3R5cGUsIE1hdGNoZXNJbnRlcmZhY2UpO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEVsZW1lbnQsIEVsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhudWxsLCBcInhcIikpO1xuICAgIHNjb3BlLmludmFsaWRhdGVSZW5kZXJlckJhc2VkT25BdHRyaWJ1dGUgPSBpbnZhbGlkYXRlUmVuZGVyZXJCYXNlZE9uQXR0cmlidXRlO1xuICAgIHNjb3BlLm1hdGNoZXNOYW1lcyA9IG1hdGNoZXNOYW1lcztcbiAgICBzY29wZS5vcmlnaW5hbE1hdGNoZXMgPSBvcmlnaW5hbE1hdGNoZXM7XG4gICAgc2NvcGUud3JhcHBlcnMuRWxlbWVudCA9IEVsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuRWxlbWVudDtcbiAgICB2YXIgZGVmaW5lR2V0dGVyID0gc2NvcGUuZGVmaW5lR2V0dGVyO1xuICAgIHZhciBlbnF1ZXVlTXV0YXRpb24gPSBzY29wZS5lbnF1ZXVlTXV0YXRpb247XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIG5vZGVzV2VyZUFkZGVkID0gc2NvcGUubm9kZXNXZXJlQWRkZWQ7XG4gICAgdmFyIG5vZGVzV2VyZVJlbW92ZWQgPSBzY29wZS5ub2Rlc1dlcmVSZW1vdmVkO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHNuYXBzaG90Tm9kZUxpc3QgPSBzY29wZS5zbmFwc2hvdE5vZGVMaXN0O1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIHdyYXBwZXJzID0gc2NvcGUud3JhcHBlcnM7XG4gICAgdmFyIGVzY2FwZUF0dHJSZWdFeHAgPSAvWyZcXHUwMEEwXCJdL2c7XG4gICAgdmFyIGVzY2FwZURhdGFSZWdFeHAgPSAvWyZcXHUwMEEwPD5dL2c7XG4gICAgZnVuY3Rpb24gZXNjYXBlUmVwbGFjZShjKSB7XG4gICAgICBzd2l0Y2ggKGMpIHtcbiAgICAgICBjYXNlIFwiJlwiOlxuICAgICAgICByZXR1cm4gXCImYW1wO1wiO1xuXG4gICAgICAgY2FzZSBcIjxcIjpcbiAgICAgICAgcmV0dXJuIFwiJmx0O1wiO1xuXG4gICAgICAgY2FzZSBcIj5cIjpcbiAgICAgICAgcmV0dXJuIFwiJmd0O1wiO1xuXG4gICAgICAgY2FzZSAnXCInOlxuICAgICAgICByZXR1cm4gXCImcXVvdDtcIjtcblxuICAgICAgIGNhc2UgXCLCoFwiOlxuICAgICAgICByZXR1cm4gXCImbmJzcDtcIjtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZXNjYXBlQXR0cihzKSB7XG4gICAgICByZXR1cm4gcy5yZXBsYWNlKGVzY2FwZUF0dHJSZWdFeHAsIGVzY2FwZVJlcGxhY2UpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBlc2NhcGVEYXRhKHMpIHtcbiAgICAgIHJldHVybiBzLnJlcGxhY2UoZXNjYXBlRGF0YVJlZ0V4cCwgZXNjYXBlUmVwbGFjZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG1ha2VTZXQoYXJyKSB7XG4gICAgICB2YXIgc2V0ID0ge307XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICBzZXRbYXJyW2ldXSA9IHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2V0O1xuICAgIH1cbiAgICB2YXIgdm9pZEVsZW1lbnRzID0gbWFrZVNldChbIFwiYXJlYVwiLCBcImJhc2VcIiwgXCJiclwiLCBcImNvbFwiLCBcImNvbW1hbmRcIiwgXCJlbWJlZFwiLCBcImhyXCIsIFwiaW1nXCIsIFwiaW5wdXRcIiwgXCJrZXlnZW5cIiwgXCJsaW5rXCIsIFwibWV0YVwiLCBcInBhcmFtXCIsIFwic291cmNlXCIsIFwidHJhY2tcIiwgXCJ3YnJcIiBdKTtcbiAgICB2YXIgcGxhaW50ZXh0UGFyZW50cyA9IG1ha2VTZXQoWyBcInN0eWxlXCIsIFwic2NyaXB0XCIsIFwieG1wXCIsIFwiaWZyYW1lXCIsIFwibm9lbWJlZFwiLCBcIm5vZnJhbWVzXCIsIFwicGxhaW50ZXh0XCIsIFwibm9zY3JpcHRcIiBdKTtcbiAgICB2YXIgWEhUTUxfTlMgPSBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIjtcbiAgICBmdW5jdGlvbiBuZWVkc1NlbGZDbG9zaW5nU2xhc2gobm9kZSkge1xuICAgICAgaWYgKG5vZGUubmFtZXNwYWNlVVJJICE9PSBYSFRNTF9OUykgcmV0dXJuIHRydWU7XG4gICAgICB2YXIgZG9jdHlwZSA9IG5vZGUub3duZXJEb2N1bWVudC5kb2N0eXBlO1xuICAgICAgcmV0dXJuIGRvY3R5cGUgJiYgZG9jdHlwZS5wdWJsaWNJZCAmJiBkb2N0eXBlLnN5c3RlbUlkO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRPdXRlckhUTUwobm9kZSwgcGFyZW50Tm9kZSkge1xuICAgICAgc3dpdGNoIChub2RlLm5vZGVUeXBlKSB7XG4gICAgICAgY2FzZSBOb2RlLkVMRU1FTlRfTk9ERTpcbiAgICAgICAgdmFyIHRhZ05hbWUgPSBub2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdmFyIHMgPSBcIjxcIiArIHRhZ05hbWU7XG4gICAgICAgIHZhciBhdHRycyA9IG5vZGUuYXR0cmlidXRlcztcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGF0dHI7IGF0dHIgPSBhdHRyc1tpXTsgaSsrKSB7XG4gICAgICAgICAgcyArPSBcIiBcIiArIGF0dHIubmFtZSArICc9XCInICsgZXNjYXBlQXR0cihhdHRyLnZhbHVlKSArICdcIic7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZvaWRFbGVtZW50c1t0YWdOYW1lXSkge1xuICAgICAgICAgIGlmIChuZWVkc1NlbGZDbG9zaW5nU2xhc2gobm9kZSkpIHMgKz0gXCIvXCI7XG4gICAgICAgICAgcmV0dXJuIHMgKyBcIj5cIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcyArIFwiPlwiICsgZ2V0SW5uZXJIVE1MKG5vZGUpICsgXCI8L1wiICsgdGFnTmFtZSArIFwiPlwiO1xuXG4gICAgICAgY2FzZSBOb2RlLlRFWFRfTk9ERTpcbiAgICAgICAgdmFyIGRhdGEgPSBub2RlLmRhdGE7XG4gICAgICAgIGlmIChwYXJlbnROb2RlICYmIHBsYWludGV4dFBhcmVudHNbcGFyZW50Tm9kZS5sb2NhbE5hbWVdKSByZXR1cm4gZGF0YTtcbiAgICAgICAgcmV0dXJuIGVzY2FwZURhdGEoZGF0YSk7XG5cbiAgICAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgICByZXR1cm4gXCI8IS0tXCIgKyBub2RlLmRhdGEgKyBcIi0tPlwiO1xuXG4gICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5lcnJvcihub2RlKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm90IGltcGxlbWVudGVkXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRJbm5lckhUTUwobm9kZSkge1xuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiB3cmFwcGVycy5IVE1MVGVtcGxhdGVFbGVtZW50KSBub2RlID0gbm9kZS5jb250ZW50O1xuICAgICAgdmFyIHMgPSBcIlwiO1xuICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIHMgKz0gZ2V0T3V0ZXJIVE1MKGNoaWxkLCBub2RlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzZXRJbm5lckhUTUwobm9kZSwgdmFsdWUsIG9wdF90YWdOYW1lKSB7XG4gICAgICB2YXIgdGFnTmFtZSA9IG9wdF90YWdOYW1lIHx8IFwiZGl2XCI7XG4gICAgICBub2RlLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgIHZhciB0ZW1wRWxlbWVudCA9IHVud3JhcChub2RlLm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKSk7XG4gICAgICB0ZW1wRWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICAgIHZhciBmaXJzdENoaWxkO1xuICAgICAgd2hpbGUgKGZpcnN0Q2hpbGQgPSB0ZW1wRWxlbWVudC5maXJzdENoaWxkKSB7XG4gICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQod3JhcChmaXJzdENoaWxkKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBvbGRJZSA9IC9NU0lFLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICAgIHZhciBPcmlnaW5hbEhUTUxFbGVtZW50ID0gd2luZG93LkhUTUxFbGVtZW50O1xuICAgIHZhciBPcmlnaW5hbEhUTUxUZW1wbGF0ZUVsZW1lbnQgPSB3aW5kb3cuSFRNTFRlbXBsYXRlRWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MRWxlbWVudChub2RlKSB7XG4gICAgICBFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKEhUTUxFbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgZ2V0IGlubmVySFRNTCgpIHtcbiAgICAgICAgcmV0dXJuIGdldElubmVySFRNTCh0aGlzKTtcbiAgICAgIH0sXG4gICAgICBzZXQgaW5uZXJIVE1MKHZhbHVlKSB7XG4gICAgICAgIGlmIChvbGRJZSAmJiBwbGFpbnRleHRQYXJlbnRzW3RoaXMubG9jYWxOYW1lXSkge1xuICAgICAgICAgIHRoaXMudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlbW92ZWROb2RlcyA9IHNuYXBzaG90Tm9kZUxpc3QodGhpcy5jaGlsZE5vZGVzKTtcbiAgICAgICAgaWYgKHRoaXMuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKCkpIHtcbiAgICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIHdyYXBwZXJzLkhUTUxUZW1wbGF0ZUVsZW1lbnQpIHNldElubmVySFRNTCh0aGlzLmNvbnRlbnQsIHZhbHVlKTsgZWxzZSBzZXRJbm5lckhUTUwodGhpcywgdmFsdWUsIHRoaXMudGFnTmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIU9yaWdpbmFsSFRNTFRlbXBsYXRlRWxlbWVudCAmJiB0aGlzIGluc3RhbmNlb2Ygd3JhcHBlcnMuSFRNTFRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICAgIHNldElubmVySFRNTCh0aGlzLmNvbnRlbnQsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFkZGVkTm9kZXMgPSBzbmFwc2hvdE5vZGVMaXN0KHRoaXMuY2hpbGROb2Rlcyk7XG4gICAgICAgIGVucXVldWVNdXRhdGlvbih0aGlzLCBcImNoaWxkTGlzdFwiLCB7XG4gICAgICAgICAgYWRkZWROb2RlczogYWRkZWROb2RlcyxcbiAgICAgICAgICByZW1vdmVkTm9kZXM6IHJlbW92ZWROb2Rlc1xuICAgICAgICB9KTtcbiAgICAgICAgbm9kZXNXZXJlUmVtb3ZlZChyZW1vdmVkTm9kZXMpO1xuICAgICAgICBub2Rlc1dlcmVBZGRlZChhZGRlZE5vZGVzLCB0aGlzKTtcbiAgICAgIH0sXG4gICAgICBnZXQgb3V0ZXJIVE1MKCkge1xuICAgICAgICByZXR1cm4gZ2V0T3V0ZXJIVE1MKHRoaXMsIHRoaXMucGFyZW50Tm9kZSk7XG4gICAgICB9LFxuICAgICAgc2V0IG91dGVySFRNTCh2YWx1ZSkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICAgICAgaWYgKHApIHtcbiAgICAgICAgICBwLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcigpO1xuICAgICAgICAgIHZhciBkZiA9IGZyYWcocCwgdmFsdWUpO1xuICAgICAgICAgIHAucmVwbGFjZUNoaWxkKGRmLCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGluc2VydEFkamFjZW50SFRNTDogZnVuY3Rpb24ocG9zaXRpb24sIHRleHQpIHtcbiAgICAgICAgdmFyIGNvbnRleHRFbGVtZW50LCByZWZOb2RlO1xuICAgICAgICBzd2l0Y2ggKFN0cmluZyhwb3NpdGlvbikudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgY2FzZSBcImJlZm9yZWJlZ2luXCI6XG4gICAgICAgICAgY29udGV4dEVsZW1lbnQgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgICAgICAgcmVmTm9kZSA9IHRoaXM7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgIGNhc2UgXCJhZnRlcmVuZFwiOlxuICAgICAgICAgIGNvbnRleHRFbGVtZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuICAgICAgICAgIHJlZk5vZGUgPSB0aGlzLm5leHRTaWJsaW5nO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICBjYXNlIFwiYWZ0ZXJiZWdpblwiOlxuICAgICAgICAgIGNvbnRleHRFbGVtZW50ID0gdGhpcztcbiAgICAgICAgICByZWZOb2RlID0gdGhpcy5maXJzdENoaWxkO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICBjYXNlIFwiYmVmb3JlZW5kXCI6XG4gICAgICAgICAgY29udGV4dEVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgIHJlZk5vZGUgPSBudWxsO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGYgPSBmcmFnKGNvbnRleHRFbGVtZW50LCB0ZXh0KTtcbiAgICAgICAgY29udGV4dEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGRmLCByZWZOb2RlKTtcbiAgICAgIH0sXG4gICAgICBnZXQgaGlkZGVuKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oYXNBdHRyaWJ1dGUoXCJoaWRkZW5cIik7XG4gICAgICB9LFxuICAgICAgc2V0IGhpZGRlbih2KSB7XG4gICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJoaWRkZW5cIiwgXCJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoXCJoaWRkZW5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBmdW5jdGlvbiBmcmFnKGNvbnRleHRFbGVtZW50LCBodG1sKSB7XG4gICAgICB2YXIgcCA9IHVud3JhcChjb250ZXh0RWxlbWVudC5jbG9uZU5vZGUoZmFsc2UpKTtcbiAgICAgIHAuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgIHZhciBkZiA9IHVud3JhcChkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpO1xuICAgICAgdmFyIGM7XG4gICAgICB3aGlsZSAoYyA9IHAuZmlyc3RDaGlsZCkge1xuICAgICAgICBkZi5hcHBlbmRDaGlsZChjKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB3cmFwKGRmKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0dGVyKG5hbWUpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2NvcGUucmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpW25hbWVdO1xuICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0dGVyUmVxdWlyZXNSZW5kZXJpbmcobmFtZSkge1xuICAgICAgZGVmaW5lR2V0dGVyKEhUTUxFbGVtZW50LCBuYW1lLCBnZXR0ZXIobmFtZSkpO1xuICAgIH1cbiAgICBbIFwiY2xpZW50SGVpZ2h0XCIsIFwiY2xpZW50TGVmdFwiLCBcImNsaWVudFRvcFwiLCBcImNsaWVudFdpZHRoXCIsIFwib2Zmc2V0SGVpZ2h0XCIsIFwib2Zmc2V0TGVmdFwiLCBcIm9mZnNldFRvcFwiLCBcIm9mZnNldFdpZHRoXCIsIFwic2Nyb2xsSGVpZ2h0XCIsIFwic2Nyb2xsV2lkdGhcIiBdLmZvckVhY2goZ2V0dGVyUmVxdWlyZXNSZW5kZXJpbmcpO1xuICAgIGZ1bmN0aW9uIGdldHRlckFuZFNldHRlclJlcXVpcmVzUmVuZGVyaW5nKG5hbWUpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShIVE1MRWxlbWVudC5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICAgICAgZ2V0OiBnZXR0ZXIobmFtZSksXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICAgIHNjb3BlLnJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgICAgICB1bnNhZmVVbndyYXAodGhpcylbbmFtZV0gPSB2O1xuICAgICAgICB9LFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBbIFwic2Nyb2xsTGVmdFwiLCBcInNjcm9sbFRvcFwiIF0uZm9yRWFjaChnZXR0ZXJBbmRTZXR0ZXJSZXF1aXJlc1JlbmRlcmluZyk7XG4gICAgZnVuY3Rpb24gbWV0aG9kUmVxdWlyZXNSZW5kZXJpbmcobmFtZSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEhUTUxFbGVtZW50LnByb3RvdHlwZSwgbmFtZSwge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2NvcGUucmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcylbbmFtZV0uYXBwbHkodW5zYWZlVW53cmFwKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBbIFwiZm9jdXNcIiwgXCJnZXRCb3VuZGluZ0NsaWVudFJlY3RcIiwgXCJnZXRDbGllbnRSZWN0c1wiLCBcInNjcm9sbEludG9WaWV3XCIgXS5mb3JFYWNoKG1ldGhvZFJlcXVpcmVzUmVuZGVyaW5nKTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MRWxlbWVudCwgSFRNTEVsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJiXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudCA9IEhUTUxFbGVtZW50O1xuICAgIHNjb3BlLmdldElubmVySFRNTCA9IGdldElubmVySFRNTDtcbiAgICBzY29wZS5zZXRJbm5lckhUTUwgPSBzZXRJbm5lckhUTUw7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsSFRNTENhbnZhc0VsZW1lbnQgPSB3aW5kb3cuSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTENhbnZhc0VsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTENhbnZhc0VsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKEhUTUxDYW52YXNFbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgZ2V0Q29udGV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb250ZXh0ID0gdW5zYWZlVW53cmFwKHRoaXMpLmdldENvbnRleHQuYXBwbHkodW5zYWZlVW53cmFwKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gY29udGV4dCAmJiB3cmFwKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxDYW52YXNFbGVtZW50LCBIVE1MQ2FudmFzRWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTENhbnZhc0VsZW1lbnQgPSBIVE1MQ2FudmFzRWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgT3JpZ2luYWxIVE1MQ29udGVudEVsZW1lbnQgPSB3aW5kb3cuSFRNTENvbnRlbnRFbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxDb250ZW50RWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MQ29udGVudEVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKEhUTUxDb250ZW50RWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiBIVE1MQ29udGVudEVsZW1lbnQsXG4gICAgICBnZXQgc2VsZWN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoXCJzZWxlY3RcIik7XG4gICAgICB9LFxuICAgICAgc2V0IHNlbGVjdCh2YWx1ZSkge1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcInNlbGVjdFwiLCB2YWx1ZSk7XG4gICAgICB9LFxuICAgICAgc2V0QXR0cmlidXRlOiBmdW5jdGlvbihuLCB2KSB7XG4gICAgICAgIEhUTUxFbGVtZW50LnByb3RvdHlwZS5zZXRBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuLCB2KTtcbiAgICAgICAgaWYgKFN0cmluZyhuKS50b0xvd2VyQ2FzZSgpID09PSBcInNlbGVjdFwiKSB0aGlzLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcih0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoT3JpZ2luYWxIVE1MQ29udGVudEVsZW1lbnQpIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxDb250ZW50RWxlbWVudCwgSFRNTENvbnRlbnRFbGVtZW50KTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MQ29udGVudEVsZW1lbnQgPSBIVE1MQ29udGVudEVsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHdyYXBIVE1MQ29sbGVjdGlvbiA9IHNjb3BlLndyYXBIVE1MQ29sbGVjdGlvbjtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciBPcmlnaW5hbEhUTUxGb3JtRWxlbWVudCA9IHdpbmRvdy5IVE1MRm9ybUVsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTEZvcm1FbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxGb3JtRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oSFRNTEZvcm1FbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgZ2V0IGVsZW1lbnRzKCkge1xuICAgICAgICByZXR1cm4gd3JhcEhUTUxDb2xsZWN0aW9uKHVud3JhcCh0aGlzKS5lbGVtZW50cyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTEZvcm1FbGVtZW50LCBIVE1MRm9ybUVsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MRm9ybUVsZW1lbnQgPSBIVE1MRm9ybUVsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgcmV3cmFwID0gc2NvcGUucmV3cmFwO1xuICAgIHZhciBPcmlnaW5hbEhUTUxJbWFnZUVsZW1lbnQgPSB3aW5kb3cuSFRNTEltYWdlRWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MSW1hZ2VFbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxJbWFnZUVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxJbWFnZUVsZW1lbnQsIEhUTUxJbWFnZUVsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIikpO1xuICAgIGZ1bmN0aW9uIEltYWdlKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBJbWFnZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkRPTSBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgICAgIH1cbiAgICAgIHZhciBub2RlID0gdW53cmFwKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIikpO1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICAgIHJld3JhcChub2RlLCB0aGlzKTtcbiAgICAgIGlmICh3aWR0aCAhPT0gdW5kZWZpbmVkKSBub2RlLndpZHRoID0gd2lkdGg7XG4gICAgICBpZiAoaGVpZ2h0ICE9PSB1bmRlZmluZWQpIG5vZGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH1cbiAgICBJbWFnZS5wcm90b3R5cGUgPSBIVE1MSW1hZ2VFbGVtZW50LnByb3RvdHlwZTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MSW1hZ2VFbGVtZW50ID0gSFRNTEltYWdlRWxlbWVudDtcbiAgICBzY29wZS53cmFwcGVycy5JbWFnZSA9IEltYWdlO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgTm9kZUxpc3QgPSBzY29wZS53cmFwcGVycy5Ob2RlTGlzdDtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBPcmlnaW5hbEhUTUxTaGFkb3dFbGVtZW50ID0gd2luZG93LkhUTUxTaGFkb3dFbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxTaGFkb3dFbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxTaGFkb3dFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBIVE1MU2hhZG93RWxlbWVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBIVE1MU2hhZG93RWxlbWVudDtcbiAgICBpZiAoT3JpZ2luYWxIVE1MU2hhZG93RWxlbWVudCkgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTFNoYWRvd0VsZW1lbnQsIEhUTUxTaGFkb3dFbGVtZW50KTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MU2hhZG93RWxlbWVudCA9IEhUTUxTaGFkb3dFbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIGNvbnRlbnRUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIHRlbXBsYXRlQ29udGVudHNPd25lclRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICBmdW5jdGlvbiBnZXRUZW1wbGF0ZUNvbnRlbnRzT3duZXIoZG9jKSB7XG4gICAgICBpZiAoIWRvYy5kZWZhdWx0VmlldykgcmV0dXJuIGRvYztcbiAgICAgIHZhciBkID0gdGVtcGxhdGVDb250ZW50c093bmVyVGFibGUuZ2V0KGRvYyk7XG4gICAgICBpZiAoIWQpIHtcbiAgICAgICAgZCA9IGRvYy5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQoXCJcIik7XG4gICAgICAgIHdoaWxlIChkLmxhc3RDaGlsZCkge1xuICAgICAgICAgIGQucmVtb3ZlQ2hpbGQoZC5sYXN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlQ29udGVudHNPd25lclRhYmxlLnNldChkb2MsIGQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGV4dHJhY3RDb250ZW50KHRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgdmFyIGRvYyA9IGdldFRlbXBsYXRlQ29udGVudHNPd25lcih0ZW1wbGF0ZUVsZW1lbnQub3duZXJEb2N1bWVudCk7XG4gICAgICB2YXIgZGYgPSB1bndyYXAoZG9jLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSk7XG4gICAgICB2YXIgY2hpbGQ7XG4gICAgICB3aGlsZSAoY2hpbGQgPSB0ZW1wbGF0ZUVsZW1lbnQuZmlyc3RDaGlsZCkge1xuICAgICAgICBkZi5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGY7XG4gICAgfVxuICAgIHZhciBPcmlnaW5hbEhUTUxUZW1wbGF0ZUVsZW1lbnQgPSB3aW5kb3cuSFRNTFRlbXBsYXRlRWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MVGVtcGxhdGVFbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgICBpZiAoIU9yaWdpbmFsSFRNTFRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICB2YXIgY29udGVudCA9IGV4dHJhY3RDb250ZW50KG5vZGUpO1xuICAgICAgICBjb250ZW50VGFibGUuc2V0KHRoaXMsIHdyYXAoY29udGVudCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBIVE1MVGVtcGxhdGVFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihIVE1MVGVtcGxhdGVFbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IEhUTUxUZW1wbGF0ZUVsZW1lbnQsXG4gICAgICBnZXQgY29udGVudCgpIHtcbiAgICAgICAgaWYgKE9yaWdpbmFsSFRNTFRlbXBsYXRlRWxlbWVudCkgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmNvbnRlbnQpO1xuICAgICAgICByZXR1cm4gY29udGVudFRhYmxlLmdldCh0aGlzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoT3JpZ2luYWxIVE1MVGVtcGxhdGVFbGVtZW50KSByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MVGVtcGxhdGVFbGVtZW50LCBIVE1MVGVtcGxhdGVFbGVtZW50KTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MVGVtcGxhdGVFbGVtZW50ID0gSFRNTFRlbXBsYXRlRWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgT3JpZ2luYWxIVE1MTWVkaWFFbGVtZW50ID0gd2luZG93LkhUTUxNZWRpYUVsZW1lbnQ7XG4gICAgaWYgKCFPcmlnaW5hbEhUTUxNZWRpYUVsZW1lbnQpIHJldHVybjtcbiAgICBmdW5jdGlvbiBIVE1MTWVkaWFFbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxNZWRpYUVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxNZWRpYUVsZW1lbnQsIEhUTUxNZWRpYUVsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhdWRpb1wiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTE1lZGlhRWxlbWVudCA9IEhUTUxNZWRpYUVsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MTWVkaWFFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTE1lZGlhRWxlbWVudDtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHJld3JhcCA9IHNjb3BlLnJld3JhcDtcbiAgICB2YXIgT3JpZ2luYWxIVE1MQXVkaW9FbGVtZW50ID0gd2luZG93LkhUTUxBdWRpb0VsZW1lbnQ7XG4gICAgaWYgKCFPcmlnaW5hbEhUTUxBdWRpb0VsZW1lbnQpIHJldHVybjtcbiAgICBmdW5jdGlvbiBIVE1MQXVkaW9FbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxNZWRpYUVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTEF1ZGlvRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxNZWRpYUVsZW1lbnQucHJvdG90eXBlKTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MQXVkaW9FbGVtZW50LCBIVE1MQXVkaW9FbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYXVkaW9cIikpO1xuICAgIGZ1bmN0aW9uIEF1ZGlvKHNyYykge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEF1ZGlvKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRE9NIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xuICAgICAgfVxuICAgICAgdmFyIG5vZGUgPSB1bndyYXAoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF1ZGlvXCIpKTtcbiAgICAgIEhUTUxNZWRpYUVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICAgIHJld3JhcChub2RlLCB0aGlzKTtcbiAgICAgIG5vZGUuc2V0QXR0cmlidXRlKFwicHJlbG9hZFwiLCBcImF1dG9cIik7XG4gICAgICBpZiAoc3JjICE9PSB1bmRlZmluZWQpIG5vZGUuc2V0QXR0cmlidXRlKFwic3JjXCIsIHNyYyk7XG4gICAgfVxuICAgIEF1ZGlvLnByb3RvdHlwZSA9IEhUTUxBdWRpb0VsZW1lbnQucHJvdG90eXBlO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxBdWRpb0VsZW1lbnQgPSBIVE1MQXVkaW9FbGVtZW50O1xuICAgIHNjb3BlLndyYXBwZXJzLkF1ZGlvID0gQXVkaW87XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHJld3JhcCA9IHNjb3BlLnJld3JhcDtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxIVE1MT3B0aW9uRWxlbWVudCA9IHdpbmRvdy5IVE1MT3B0aW9uRWxlbWVudDtcbiAgICBmdW5jdGlvbiB0cmltVGV4dChzKSB7XG4gICAgICByZXR1cm4gcy5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIEhUTUxPcHRpb25FbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxPcHRpb25FbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihIVE1MT3B0aW9uRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGdldCB0ZXh0KCkge1xuICAgICAgICByZXR1cm4gdHJpbVRleHQodGhpcy50ZXh0Q29udGVudCk7XG4gICAgICB9LFxuICAgICAgc2V0IHRleHQodmFsdWUpIHtcbiAgICAgICAgdGhpcy50ZXh0Q29udGVudCA9IHRyaW1UZXh0KFN0cmluZyh2YWx1ZSkpO1xuICAgICAgfSxcbiAgICAgIGdldCBmb3JtKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuZm9ybSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTE9wdGlvbkVsZW1lbnQsIEhUTUxPcHRpb25FbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpKTtcbiAgICBmdW5jdGlvbiBPcHRpb24odGV4dCwgdmFsdWUsIGRlZmF1bHRTZWxlY3RlZCwgc2VsZWN0ZWQpIHtcbiAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBPcHRpb24pKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJET00gb2JqZWN0IGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBjYWxsZWQgYXMgYSBmdW5jdGlvbi5cIik7XG4gICAgICB9XG4gICAgICB2YXIgbm9kZSA9IHVud3JhcChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpKTtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgICByZXdyYXAobm9kZSwgdGhpcyk7XG4gICAgICBpZiAodGV4dCAhPT0gdW5kZWZpbmVkKSBub2RlLnRleHQgPSB0ZXh0O1xuICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIG5vZGUuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgdmFsdWUpO1xuICAgICAgaWYgKGRlZmF1bHRTZWxlY3RlZCA9PT0gdHJ1ZSkgbm9kZS5zZXRBdHRyaWJ1dGUoXCJzZWxlY3RlZFwiLCBcIlwiKTtcbiAgICAgIG5vZGUuc2VsZWN0ZWQgPSBzZWxlY3RlZCA9PT0gdHJ1ZTtcbiAgICB9XG4gICAgT3B0aW9uLnByb3RvdHlwZSA9IEhUTUxPcHRpb25FbGVtZW50LnByb3RvdHlwZTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MT3B0aW9uRWxlbWVudCA9IEhUTUxPcHRpb25FbGVtZW50O1xuICAgIHNjb3BlLndyYXBwZXJzLk9wdGlvbiA9IE9wdGlvbjtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxIVE1MU2VsZWN0RWxlbWVudCA9IHdpbmRvdy5IVE1MU2VsZWN0RWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MU2VsZWN0RWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MU2VsZWN0RWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oSFRNTFNlbGVjdEVsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBhZGQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGJlZm9yZSkge1xuICAgICAgICBpZiAodHlwZW9mIGJlZm9yZSA9PT0gXCJvYmplY3RcIikgYmVmb3JlID0gdW53cmFwKGJlZm9yZSk7XG4gICAgICAgIHVud3JhcCh0aGlzKS5hZGQodW53cmFwKGVsZW1lbnQpLCBiZWZvcmUpO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZTogZnVuY3Rpb24oaW5kZXhPck5vZGUpIHtcbiAgICAgICAgaWYgKGluZGV4T3JOb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBIVE1MRWxlbWVudC5wcm90b3R5cGUucmVtb3ZlLmNhbGwodGhpcyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaW5kZXhPck5vZGUgPT09IFwib2JqZWN0XCIpIGluZGV4T3JOb2RlID0gdW53cmFwKGluZGV4T3JOb2RlKTtcbiAgICAgICAgdW53cmFwKHRoaXMpLnJlbW92ZShpbmRleE9yTm9kZSk7XG4gICAgICB9LFxuICAgICAgZ2V0IGZvcm0oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5mb3JtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MU2VsZWN0RWxlbWVudCwgSFRNTFNlbGVjdEVsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWxlY3RcIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxTZWxlY3RFbGVtZW50ID0gSFRNTFNlbGVjdEVsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIHdyYXBIVE1MQ29sbGVjdGlvbiA9IHNjb3BlLndyYXBIVE1MQ29sbGVjdGlvbjtcbiAgICB2YXIgT3JpZ2luYWxIVE1MVGFibGVFbGVtZW50ID0gd2luZG93LkhUTUxUYWJsZUVsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTFRhYmxlRWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MVGFibGVFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihIVE1MVGFibGVFbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgZ2V0IGNhcHRpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5jYXB0aW9uKTtcbiAgICAgIH0sXG4gICAgICBjcmVhdGVDYXB0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmNyZWF0ZUNhcHRpb24oKSk7XG4gICAgICB9LFxuICAgICAgZ2V0IHRIZWFkKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykudEhlYWQpO1xuICAgICAgfSxcbiAgICAgIGNyZWF0ZVRIZWFkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmNyZWF0ZVRIZWFkKCkpO1xuICAgICAgfSxcbiAgICAgIGNyZWF0ZVRGb290OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmNyZWF0ZVRGb290KCkpO1xuICAgICAgfSxcbiAgICAgIGdldCB0Rm9vdCgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLnRGb290KTtcbiAgICAgIH0sXG4gICAgICBnZXQgdEJvZGllcygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBIVE1MQ29sbGVjdGlvbih1bndyYXAodGhpcykudEJvZGllcyk7XG4gICAgICB9LFxuICAgICAgY3JlYXRlVEJvZHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuY3JlYXRlVEJvZHkoKSk7XG4gICAgICB9LFxuICAgICAgZ2V0IHJvd3MoKSB7XG4gICAgICAgIHJldHVybiB3cmFwSFRNTENvbGxlY3Rpb24odW53cmFwKHRoaXMpLnJvd3MpO1xuICAgICAgfSxcbiAgICAgIGluc2VydFJvdzogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmluc2VydFJvdyhpbmRleCkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxUYWJsZUVsZW1lbnQsIEhUTUxUYWJsZUVsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTFRhYmxlRWxlbWVudCA9IEhUTUxUYWJsZUVsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHdyYXBIVE1MQ29sbGVjdGlvbiA9IHNjb3BlLndyYXBIVE1MQ29sbGVjdGlvbjtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxIVE1MVGFibGVTZWN0aW9uRWxlbWVudCA9IHdpbmRvdy5IVE1MVGFibGVTZWN0aW9uRWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MVGFibGVTZWN0aW9uRWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MVGFibGVTZWN0aW9uRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3RvcjogSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQsXG4gICAgICBnZXQgcm93cygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBIVE1MQ29sbGVjdGlvbih1bndyYXAodGhpcykucm93cyk7XG4gICAgICB9LFxuICAgICAgaW5zZXJ0Um93OiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuaW5zZXJ0Um93KGluZGV4KSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQsIEhUTUxUYWJsZVNlY3Rpb25FbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGhlYWRcIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxUYWJsZVNlY3Rpb25FbGVtZW50ID0gSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHdyYXBIVE1MQ29sbGVjdGlvbiA9IHNjb3BlLndyYXBIVE1MQ29sbGVjdGlvbjtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxIVE1MVGFibGVSb3dFbGVtZW50ID0gd2luZG93LkhUTUxUYWJsZVJvd0VsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTFRhYmxlUm93RWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MVGFibGVSb3dFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihIVE1MVGFibGVSb3dFbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgZ2V0IGNlbGxzKCkge1xuICAgICAgICByZXR1cm4gd3JhcEhUTUxDb2xsZWN0aW9uKHVud3JhcCh0aGlzKS5jZWxscyk7XG4gICAgICB9LFxuICAgICAgaW5zZXJ0Q2VsbDogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmluc2VydENlbGwoaW5kZXgpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MVGFibGVSb3dFbGVtZW50LCBIVE1MVGFibGVSb3dFbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxUYWJsZVJvd0VsZW1lbnQgPSBIVE1MVGFibGVSb3dFbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTENvbnRlbnRFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTENvbnRlbnRFbGVtZW50O1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBIVE1MU2hhZG93RWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxTaGFkb3dFbGVtZW50O1xuICAgIHZhciBIVE1MVGVtcGxhdGVFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTFRlbXBsYXRlRWxlbWVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBPcmlnaW5hbEhUTUxVbmtub3duRWxlbWVudCA9IHdpbmRvdy5IVE1MVW5rbm93bkVsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTFVua25vd25FbGVtZW50KG5vZGUpIHtcbiAgICAgIHN3aXRjaCAobm9kZS5sb2NhbE5hbWUpIHtcbiAgICAgICBjYXNlIFwiY29udGVudFwiOlxuICAgICAgICByZXR1cm4gbmV3IEhUTUxDb250ZW50RWxlbWVudChub2RlKTtcblxuICAgICAgIGNhc2UgXCJzaGFkb3dcIjpcbiAgICAgICAgcmV0dXJuIG5ldyBIVE1MU2hhZG93RWxlbWVudChub2RlKTtcblxuICAgICAgIGNhc2UgXCJ0ZW1wbGF0ZVwiOlxuICAgICAgICByZXR1cm4gbmV3IEhUTUxUZW1wbGF0ZUVsZW1lbnQobm9kZSk7XG4gICAgICB9XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MVW5rbm93bkVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxVbmtub3duRWxlbWVudCwgSFRNTFVua25vd25FbGVtZW50KTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MVW5rbm93bkVsZW1lbnQgPSBIVE1MVW5rbm93bkVsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuRWxlbWVudDtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBkZWZpbmVXcmFwR2V0dGVyID0gc2NvcGUuZGVmaW5lV3JhcEdldHRlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgU1ZHX05TID0gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiO1xuICAgIHZhciBPcmlnaW5hbFNWR0VsZW1lbnQgPSB3aW5kb3cuU1ZHRWxlbWVudDtcbiAgICB2YXIgc3ZnVGl0bGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFNWR19OUywgXCJ0aXRsZVwiKTtcbiAgICBpZiAoIShcImNsYXNzTGlzdFwiIGluIHN2Z1RpdGxlRWxlbWVudCkpIHtcbiAgICAgIHZhciBkZXNjciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoRWxlbWVudC5wcm90b3R5cGUsIFwiY2xhc3NMaXN0XCIpO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEhUTUxFbGVtZW50LnByb3RvdHlwZSwgXCJjbGFzc0xpc3RcIiwgZGVzY3IpO1xuICAgICAgZGVsZXRlIEVsZW1lbnQucHJvdG90eXBlLmNsYXNzTGlzdDtcbiAgICB9XG4gICAgZnVuY3Rpb24gU1ZHRWxlbWVudChub2RlKSB7XG4gICAgICBFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIFNWR0VsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oU1ZHRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGdldCBvd25lclNWR0VsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5vd25lclNWR0VsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbFNWR0VsZW1lbnQsIFNWR0VsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhTVkdfTlMsIFwidGl0bGVcIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLlNWR0VsZW1lbnQgPSBTVkdFbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbFNWR1VzZUVsZW1lbnQgPSB3aW5kb3cuU1ZHVXNlRWxlbWVudDtcbiAgICB2YXIgU1ZHX05TID0gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiO1xuICAgIHZhciBnV3JhcHBlciA9IHdyYXAoZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFNWR19OUywgXCJnXCIpKTtcbiAgICB2YXIgdXNlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhTVkdfTlMsIFwidXNlXCIpO1xuICAgIHZhciBTVkdHRWxlbWVudCA9IGdXcmFwcGVyLmNvbnN0cnVjdG9yO1xuICAgIHZhciBwYXJlbnRJbnRlcmZhY2VQcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoU1ZHR0VsZW1lbnQucHJvdG90eXBlKTtcbiAgICB2YXIgcGFyZW50SW50ZXJmYWNlID0gcGFyZW50SW50ZXJmYWNlUHJvdG90eXBlLmNvbnN0cnVjdG9yO1xuICAgIGZ1bmN0aW9uIFNWR1VzZUVsZW1lbnQoaW1wbCkge1xuICAgICAgcGFyZW50SW50ZXJmYWNlLmNhbGwodGhpcywgaW1wbCk7XG4gICAgfVxuICAgIFNWR1VzZUVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShwYXJlbnRJbnRlcmZhY2VQcm90b3R5cGUpO1xuICAgIGlmIChcImluc3RhbmNlUm9vdFwiIGluIHVzZUVsZW1lbnQpIHtcbiAgICAgIG1peGluKFNWR1VzZUVsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICAgIGdldCBpbnN0YW5jZVJvb3QoKSB7XG4gICAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmluc3RhbmNlUm9vdCk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldCBhbmltYXRlZEluc3RhbmNlUm9vdCgpIHtcbiAgICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuYW5pbWF0ZWRJbnN0YW5jZVJvb3QpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsU1ZHVXNlRWxlbWVudCwgU1ZHVXNlRWxlbWVudCwgdXNlRWxlbWVudCk7XG4gICAgc2NvcGUud3JhcHBlcnMuU1ZHVXNlRWxlbWVudCA9IFNWR1VzZUVsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBFdmVudFRhcmdldCA9IHNjb3BlLndyYXBwZXJzLkV2ZW50VGFyZ2V0O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsU1ZHRWxlbWVudEluc3RhbmNlID0gd2luZG93LlNWR0VsZW1lbnRJbnN0YW5jZTtcbiAgICBpZiAoIU9yaWdpbmFsU1ZHRWxlbWVudEluc3RhbmNlKSByZXR1cm47XG4gICAgZnVuY3Rpb24gU1ZHRWxlbWVudEluc3RhbmNlKGltcGwpIHtcbiAgICAgIEV2ZW50VGFyZ2V0LmNhbGwodGhpcywgaW1wbCk7XG4gICAgfVxuICAgIFNWR0VsZW1lbnRJbnN0YW5jZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50VGFyZ2V0LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oU1ZHRWxlbWVudEluc3RhbmNlLnByb3RvdHlwZSwge1xuICAgICAgZ2V0IGNvcnJlc3BvbmRpbmdFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuY29ycmVzcG9uZGluZ0VsZW1lbnQpO1xuICAgICAgfSxcbiAgICAgIGdldCBjb3JyZXNwb25kaW5nVXNlRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmNvcnJlc3BvbmRpbmdVc2VFbGVtZW50KTtcbiAgICAgIH0sXG4gICAgICBnZXQgcGFyZW50Tm9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLnBhcmVudE5vZGUpO1xuICAgICAgfSxcbiAgICAgIGdldCBjaGlsZE5vZGVzKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gICAgICB9LFxuICAgICAgZ2V0IGZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5maXJzdENoaWxkKTtcbiAgICAgIH0sXG4gICAgICBnZXQgbGFzdENoaWxkKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykubGFzdENoaWxkKTtcbiAgICAgIH0sXG4gICAgICBnZXQgcHJldmlvdXNTaWJsaW5nKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykucHJldmlvdXNTaWJsaW5nKTtcbiAgICAgIH0sXG4gICAgICBnZXQgbmV4dFNpYmxpbmcoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5uZXh0U2libGluZyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsU1ZHRWxlbWVudEluc3RhbmNlLCBTVkdFbGVtZW50SW5zdGFuY2UpO1xuICAgIHNjb3BlLndyYXBwZXJzLlNWR0VsZW1lbnRJbnN0YW5jZSA9IFNWR0VsZW1lbnRJbnN0YW5jZTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgc2V0V3JhcHBlciA9IHNjb3BlLnNldFdyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB1bndyYXBJZk5lZWRlZCA9IHNjb3BlLnVud3JhcElmTmVlZGVkO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgPSB3aW5kb3cuQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xuICAgIGZ1bmN0aW9uIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRChpbXBsKSB7XG4gICAgICBzZXRXcmFwcGVyKGltcGwsIHRoaXMpO1xuICAgIH1cbiAgICBtaXhpbihDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQucHJvdG90eXBlLCB7XG4gICAgICBnZXQgY2FudmFzKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuY2FudmFzKTtcbiAgICAgIH0sXG4gICAgICBkcmF3SW1hZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBhcmd1bWVudHNbMF0gPSB1bndyYXBJZk5lZWRlZChhcmd1bWVudHNbMF0pO1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuZHJhd0ltYWdlLmFwcGx5KHVuc2FmZVVud3JhcCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICAgIH0sXG4gICAgICBjcmVhdGVQYXR0ZXJuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgYXJndW1lbnRzWzBdID0gdW53cmFwKGFyZ3VtZW50c1swXSk7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykuY3JlYXRlUGF0dGVybi5hcHBseSh1bnNhZmVVbndyYXAodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIikuZ2V0Q29udGV4dChcIjJkXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgPSBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBhZGRGb3J3YXJkaW5nUHJvcGVydGllcyA9IHNjb3BlLmFkZEZvcndhcmRpbmdQcm9wZXJ0aWVzO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHNldFdyYXBwZXIgPSBzY29wZS5zZXRXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcElmTmVlZGVkID0gc2NvcGUudW53cmFwSWZOZWVkZWQ7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbFdlYkdMUmVuZGVyaW5nQ29udGV4dCA9IHdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQ7XG4gICAgaWYgKCFPcmlnaW5hbFdlYkdMUmVuZGVyaW5nQ29udGV4dCkgcmV0dXJuO1xuICAgIGZ1bmN0aW9uIFdlYkdMUmVuZGVyaW5nQ29udGV4dChpbXBsKSB7XG4gICAgICBzZXRXcmFwcGVyKGltcGwsIHRoaXMpO1xuICAgIH1cbiAgICBtaXhpbihXZWJHTFJlbmRlcmluZ0NvbnRleHQucHJvdG90eXBlLCB7XG4gICAgICBnZXQgY2FudmFzKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuY2FudmFzKTtcbiAgICAgIH0sXG4gICAgICB0ZXhJbWFnZTJEOiBmdW5jdGlvbigpIHtcbiAgICAgICAgYXJndW1lbnRzWzVdID0gdW53cmFwSWZOZWVkZWQoYXJndW1lbnRzWzVdKTtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnRleEltYWdlMkQuYXBwbHkodW5zYWZlVW53cmFwKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgICAgfSxcbiAgICAgIHRleFN1YkltYWdlMkQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBhcmd1bWVudHNbNl0gPSB1bndyYXBJZk5lZWRlZChhcmd1bWVudHNbNl0pO1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykudGV4U3ViSW1hZ2UyRC5hcHBseSh1bnNhZmVVbndyYXAodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdmFyIE9yaWdpbmFsV2ViR0xSZW5kZXJpbmdDb250ZXh0QmFzZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihPcmlnaW5hbFdlYkdMUmVuZGVyaW5nQ29udGV4dC5wcm90b3R5cGUpO1xuICAgIGlmIChPcmlnaW5hbFdlYkdMUmVuZGVyaW5nQ29udGV4dEJhc2UgIT09IE9iamVjdC5wcm90b3R5cGUpIHtcbiAgICAgIGFkZEZvcndhcmRpbmdQcm9wZXJ0aWVzKE9yaWdpbmFsV2ViR0xSZW5kZXJpbmdDb250ZXh0QmFzZSwgV2ViR0xSZW5kZXJpbmdDb250ZXh0LnByb3RvdHlwZSk7XG4gICAgfVxuICAgIHZhciBpbnN0YW5jZVByb3BlcnRpZXMgPSAvV2ViS2l0Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpID8ge1xuICAgICAgZHJhd2luZ0J1ZmZlckhlaWdodDogbnVsbCxcbiAgICAgIGRyYXdpbmdCdWZmZXJXaWR0aDogbnVsbFxuICAgIH0gOiB7fTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxXZWJHTFJlbmRlcmluZ0NvbnRleHQsIFdlYkdMUmVuZGVyaW5nQ29udGV4dCwgaW5zdGFuY2VQcm9wZXJ0aWVzKTtcbiAgICBzY29wZS53cmFwcGVycy5XZWJHTFJlbmRlcmluZ0NvbnRleHQgPSBXZWJHTFJlbmRlcmluZ0NvbnRleHQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBOb2RlID0gc2NvcGUud3JhcHBlcnMuTm9kZTtcbiAgICB2YXIgR2V0RWxlbWVudHNCeUludGVyZmFjZSA9IHNjb3BlLkdldEVsZW1lbnRzQnlJbnRlcmZhY2U7XG4gICAgdmFyIE5vbkVsZW1lbnRQYXJlbnROb2RlSW50ZXJmYWNlID0gc2NvcGUuTm9uRWxlbWVudFBhcmVudE5vZGVJbnRlcmZhY2U7XG4gICAgdmFyIFBhcmVudE5vZGVJbnRlcmZhY2UgPSBzY29wZS5QYXJlbnROb2RlSW50ZXJmYWNlO1xuICAgIHZhciBTZWxlY3RvcnNJbnRlcmZhY2UgPSBzY29wZS5TZWxlY3RvcnNJbnRlcmZhY2U7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyT2JqZWN0ID0gc2NvcGUucmVnaXN0ZXJPYmplY3Q7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgT3JpZ2luYWxEb2N1bWVudEZyYWdtZW50ID0gd2luZG93LkRvY3VtZW50RnJhZ21lbnQ7XG4gICAgZnVuY3Rpb24gRG9jdW1lbnRGcmFnbWVudChub2RlKSB7XG4gICAgICBOb2RlLmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIERvY3VtZW50RnJhZ21lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShOb2RlLnByb3RvdHlwZSk7XG4gICAgbWl4aW4oRG9jdW1lbnRGcmFnbWVudC5wcm90b3R5cGUsIFBhcmVudE5vZGVJbnRlcmZhY2UpO1xuICAgIG1peGluKERvY3VtZW50RnJhZ21lbnQucHJvdG90eXBlLCBTZWxlY3RvcnNJbnRlcmZhY2UpO1xuICAgIG1peGluKERvY3VtZW50RnJhZ21lbnQucHJvdG90eXBlLCBHZXRFbGVtZW50c0J5SW50ZXJmYWNlKTtcbiAgICBtaXhpbihEb2N1bWVudEZyYWdtZW50LnByb3RvdHlwZSwgTm9uRWxlbWVudFBhcmVudE5vZGVJbnRlcmZhY2UpO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbERvY3VtZW50RnJhZ21lbnQsIERvY3VtZW50RnJhZ21lbnQsIGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuRG9jdW1lbnRGcmFnbWVudCA9IERvY3VtZW50RnJhZ21lbnQ7XG4gICAgdmFyIENvbW1lbnQgPSByZWdpc3Rlck9iamVjdChkb2N1bWVudC5jcmVhdGVDb21tZW50KFwiXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5Db21tZW50ID0gQ29tbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIERvY3VtZW50RnJhZ21lbnQgPSBzY29wZS53cmFwcGVycy5Eb2N1bWVudEZyYWdtZW50O1xuICAgIHZhciBUcmVlU2NvcGUgPSBzY29wZS5UcmVlU2NvcGU7XG4gICAgdmFyIGVsZW1lbnRGcm9tUG9pbnQgPSBzY29wZS5lbGVtZW50RnJvbVBvaW50O1xuICAgIHZhciBnZXRJbm5lckhUTUwgPSBzY29wZS5nZXRJbm5lckhUTUw7XG4gICAgdmFyIGdldFRyZWVTY29wZSA9IHNjb3BlLmdldFRyZWVTY29wZTtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmV3cmFwID0gc2NvcGUucmV3cmFwO1xuICAgIHZhciBzZXRJbm5lckhUTUwgPSBzY29wZS5zZXRJbm5lckhUTUw7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgc2hhZG93SG9zdFRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgbmV4dE9sZGVyU2hhZG93VHJlZVRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICBmdW5jdGlvbiBTaGFkb3dSb290KGhvc3RXcmFwcGVyKSB7XG4gICAgICB2YXIgbm9kZSA9IHVud3JhcCh1bnNhZmVVbndyYXAoaG9zdFdyYXBwZXIpLm93bmVyRG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTtcbiAgICAgIERvY3VtZW50RnJhZ21lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICAgIHJld3JhcChub2RlLCB0aGlzKTtcbiAgICAgIHZhciBvbGRTaGFkb3dSb290ID0gaG9zdFdyYXBwZXIuc2hhZG93Um9vdDtcbiAgICAgIG5leHRPbGRlclNoYWRvd1RyZWVUYWJsZS5zZXQodGhpcywgb2xkU2hhZG93Um9vdCk7XG4gICAgICB0aGlzLnRyZWVTY29wZV8gPSBuZXcgVHJlZVNjb3BlKHRoaXMsIGdldFRyZWVTY29wZShvbGRTaGFkb3dSb290IHx8IGhvc3RXcmFwcGVyKSk7XG4gICAgICBzaGFkb3dIb3N0VGFibGUuc2V0KHRoaXMsIGhvc3RXcmFwcGVyKTtcbiAgICB9XG4gICAgU2hhZG93Um9vdC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKERvY3VtZW50RnJhZ21lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihTaGFkb3dSb290LnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IFNoYWRvd1Jvb3QsXG4gICAgICBnZXQgaW5uZXJIVE1MKCkge1xuICAgICAgICByZXR1cm4gZ2V0SW5uZXJIVE1MKHRoaXMpO1xuICAgICAgfSxcbiAgICAgIHNldCBpbm5lckhUTUwodmFsdWUpIHtcbiAgICAgICAgc2V0SW5uZXJIVE1MKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIoKTtcbiAgICAgIH0sXG4gICAgICBnZXQgb2xkZXJTaGFkb3dSb290KCkge1xuICAgICAgICByZXR1cm4gbmV4dE9sZGVyU2hhZG93VHJlZVRhYmxlLmdldCh0aGlzKSB8fCBudWxsO1xuICAgICAgfSxcbiAgICAgIGdldCBob3N0KCkge1xuICAgICAgICByZXR1cm4gc2hhZG93SG9zdFRhYmxlLmdldCh0aGlzKSB8fCBudWxsO1xuICAgICAgfSxcbiAgICAgIGludmFsaWRhdGVTaGFkb3dSZW5kZXJlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzaGFkb3dIb3N0VGFibGUuZ2V0KHRoaXMpLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcigpO1xuICAgICAgfSxcbiAgICAgIGVsZW1lbnRGcm9tUG9pbnQ6IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRGcm9tUG9pbnQodGhpcywgdGhpcy5vd25lckRvY3VtZW50LCB4LCB5KTtcbiAgICAgIH0sXG4gICAgICBnZXRTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICB9LFxuICAgICAgZ2V0IGFjdGl2ZUVsZW1lbnQoKSB7XG4gICAgICAgIHZhciB1bndyYXBwZWRBY3RpdmVFbGVtZW50ID0gdW53cmFwKHRoaXMpLm93bmVyRG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICAgICAgaWYgKCF1bndyYXBwZWRBY3RpdmVFbGVtZW50IHx8ICF1bndyYXBwZWRBY3RpdmVFbGVtZW50Lm5vZGVUeXBlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGFjdGl2ZUVsZW1lbnQgPSB3cmFwKHVud3JhcHBlZEFjdGl2ZUVsZW1lbnQpO1xuICAgICAgICB3aGlsZSAoIXRoaXMuY29udGFpbnMoYWN0aXZlRWxlbWVudCkpIHtcbiAgICAgICAgICB3aGlsZSAoYWN0aXZlRWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBhY3RpdmVFbGVtZW50ID0gYWN0aXZlRWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYWN0aXZlRWxlbWVudC5ob3N0KSB7XG4gICAgICAgICAgICBhY3RpdmVFbGVtZW50ID0gYWN0aXZlRWxlbWVudC5ob3N0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjdGl2ZUVsZW1lbnQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgc2NvcGUud3JhcHBlcnMuU2hhZG93Um9vdCA9IFNoYWRvd1Jvb3Q7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHNldFdyYXBwZXIgPSBzY29wZS5zZXRXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgdW53cmFwSWZOZWVkZWQgPSBzY29wZS51bndyYXBJZk5lZWRlZDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIGdldFRyZWVTY29wZSA9IHNjb3BlLmdldFRyZWVTY29wZTtcbiAgICB2YXIgT3JpZ2luYWxSYW5nZSA9IHdpbmRvdy5SYW5nZTtcbiAgICB2YXIgU2hhZG93Um9vdCA9IHNjb3BlLndyYXBwZXJzLlNoYWRvd1Jvb3Q7XG4gICAgZnVuY3Rpb24gZ2V0SG9zdChub2RlKSB7XG4gICAgICB2YXIgcm9vdCA9IGdldFRyZWVTY29wZShub2RlKS5yb290O1xuICAgICAgaWYgKHJvb3QgaW5zdGFuY2VvZiBTaGFkb3dSb290KSB7XG4gICAgICAgIHJldHVybiByb290Lmhvc3Q7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaG9zdE5vZGVUb1NoYWRvd05vZGUocmVmTm9kZSwgb2Zmc2V0KSB7XG4gICAgICBpZiAocmVmTm9kZS5zaGFkb3dSb290KSB7XG4gICAgICAgIG9mZnNldCA9IE1hdGgubWluKHJlZk5vZGUuY2hpbGROb2Rlcy5sZW5ndGggLSAxLCBvZmZzZXQpO1xuICAgICAgICB2YXIgY2hpbGQgPSByZWZOb2RlLmNoaWxkTm9kZXNbb2Zmc2V0XTtcbiAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgdmFyIGluc2VydGlvblBvaW50ID0gc2NvcGUuZ2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMoY2hpbGQpO1xuICAgICAgICAgIGlmIChpbnNlcnRpb25Qb2ludC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGluc2VydGlvblBvaW50WzBdLnBhcmVudE5vZGU7XG4gICAgICAgICAgICBpZiAocGFyZW50Tm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgICByZWZOb2RlID0gcGFyZW50Tm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZWZOb2RlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzaGFkb3dOb2RlVG9Ib3N0Tm9kZShub2RlKSB7XG4gICAgICBub2RlID0gd3JhcChub2RlKTtcbiAgICAgIHJldHVybiBnZXRIb3N0KG5vZGUpIHx8IG5vZGU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIFJhbmdlKGltcGwpIHtcbiAgICAgIHNldFdyYXBwZXIoaW1wbCwgdGhpcyk7XG4gICAgfVxuICAgIFJhbmdlLnByb3RvdHlwZSA9IHtcbiAgICAgIGdldCBzdGFydENvbnRhaW5lcigpIHtcbiAgICAgICAgcmV0dXJuIHNoYWRvd05vZGVUb0hvc3ROb2RlKHVuc2FmZVVud3JhcCh0aGlzKS5zdGFydENvbnRhaW5lcik7XG4gICAgICB9LFxuICAgICAgZ2V0IGVuZENvbnRhaW5lcigpIHtcbiAgICAgICAgcmV0dXJuIHNoYWRvd05vZGVUb0hvc3ROb2RlKHVuc2FmZVVud3JhcCh0aGlzKS5lbmRDb250YWluZXIpO1xuICAgICAgfSxcbiAgICAgIGdldCBjb21tb25BbmNlc3RvckNvbnRhaW5lcigpIHtcbiAgICAgICAgcmV0dXJuIHNoYWRvd05vZGVUb0hvc3ROb2RlKHVuc2FmZVVud3JhcCh0aGlzKS5jb21tb25BbmNlc3RvckNvbnRhaW5lcik7XG4gICAgICB9LFxuICAgICAgc2V0U3RhcnQ6IGZ1bmN0aW9uKHJlZk5vZGUsIG9mZnNldCkge1xuICAgICAgICByZWZOb2RlID0gaG9zdE5vZGVUb1NoYWRvd05vZGUocmVmTm9kZSwgb2Zmc2V0KTtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnNldFN0YXJ0KHVud3JhcElmTmVlZGVkKHJlZk5vZGUpLCBvZmZzZXQpO1xuICAgICAgfSxcbiAgICAgIHNldEVuZDogZnVuY3Rpb24ocmVmTm9kZSwgb2Zmc2V0KSB7XG4gICAgICAgIHJlZk5vZGUgPSBob3N0Tm9kZVRvU2hhZG93Tm9kZShyZWZOb2RlLCBvZmZzZXQpO1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuc2V0RW5kKHVud3JhcElmTmVlZGVkKHJlZk5vZGUpLCBvZmZzZXQpO1xuICAgICAgfSxcbiAgICAgIHNldFN0YXJ0QmVmb3JlOiBmdW5jdGlvbihyZWZOb2RlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5zZXRTdGFydEJlZm9yZSh1bndyYXBJZk5lZWRlZChyZWZOb2RlKSk7XG4gICAgICB9LFxuICAgICAgc2V0U3RhcnRBZnRlcjogZnVuY3Rpb24ocmVmTm9kZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuc2V0U3RhcnRBZnRlcih1bndyYXBJZk5lZWRlZChyZWZOb2RlKSk7XG4gICAgICB9LFxuICAgICAgc2V0RW5kQmVmb3JlOiBmdW5jdGlvbihyZWZOb2RlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5zZXRFbmRCZWZvcmUodW53cmFwSWZOZWVkZWQocmVmTm9kZSkpO1xuICAgICAgfSxcbiAgICAgIHNldEVuZEFmdGVyOiBmdW5jdGlvbihyZWZOb2RlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5zZXRFbmRBZnRlcih1bndyYXBJZk5lZWRlZChyZWZOb2RlKSk7XG4gICAgICB9LFxuICAgICAgc2VsZWN0Tm9kZTogZnVuY3Rpb24ocmVmTm9kZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuc2VsZWN0Tm9kZSh1bndyYXBJZk5lZWRlZChyZWZOb2RlKSk7XG4gICAgICB9LFxuICAgICAgc2VsZWN0Tm9kZUNvbnRlbnRzOiBmdW5jdGlvbihyZWZOb2RlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5zZWxlY3ROb2RlQ29udGVudHModW53cmFwSWZOZWVkZWQocmVmTm9kZSkpO1xuICAgICAgfSxcbiAgICAgIGNvbXBhcmVCb3VuZGFyeVBvaW50czogZnVuY3Rpb24oaG93LCBzb3VyY2VSYW5nZSkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLmNvbXBhcmVCb3VuZGFyeVBvaW50cyhob3csIHVud3JhcChzb3VyY2VSYW5nZSkpO1xuICAgICAgfSxcbiAgICAgIGV4dHJhY3RDb250ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5leHRyYWN0Q29udGVudHMoKSk7XG4gICAgICB9LFxuICAgICAgY2xvbmVDb250ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5jbG9uZUNvbnRlbnRzKCkpO1xuICAgICAgfSxcbiAgICAgIGluc2VydE5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLmluc2VydE5vZGUodW53cmFwSWZOZWVkZWQobm9kZSkpO1xuICAgICAgfSxcbiAgICAgIHN1cnJvdW5kQ29udGVudHM6IGZ1bmN0aW9uKG5ld1BhcmVudCkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuc3Vycm91bmRDb250ZW50cyh1bndyYXBJZk5lZWRlZChuZXdQYXJlbnQpKTtcbiAgICAgIH0sXG4gICAgICBjbG9uZVJhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmNsb25lUmFuZ2UoKSk7XG4gICAgICB9LFxuICAgICAgaXNQb2ludEluUmFuZ2U6IGZ1bmN0aW9uKG5vZGUsIG9mZnNldCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLmlzUG9pbnRJblJhbmdlKHVud3JhcElmTmVlZGVkKG5vZGUpLCBvZmZzZXQpO1xuICAgICAgfSxcbiAgICAgIGNvbXBhcmVQb2ludDogZnVuY3Rpb24obm9kZSwgb2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykuY29tcGFyZVBvaW50KHVud3JhcElmTmVlZGVkKG5vZGUpLCBvZmZzZXQpO1xuICAgICAgfSxcbiAgICAgIGludGVyc2VjdHNOb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykuaW50ZXJzZWN0c05vZGUodW53cmFwSWZOZWVkZWQobm9kZSkpO1xuICAgICAgfSxcbiAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS50b1N0cmluZygpO1xuICAgICAgfVxuICAgIH07XG4gICAgaWYgKE9yaWdpbmFsUmFuZ2UucHJvdG90eXBlLmNyZWF0ZUNvbnRleHR1YWxGcmFnbWVudCkge1xuICAgICAgUmFuZ2UucHJvdG90eXBlLmNyZWF0ZUNvbnRleHR1YWxGcmFnbWVudCA9IGZ1bmN0aW9uKGh0bWwpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmNyZWF0ZUNvbnRleHR1YWxGcmFnbWVudChodG1sKSk7XG4gICAgICB9O1xuICAgIH1cbiAgICByZWdpc3RlcldyYXBwZXIod2luZG93LlJhbmdlLCBSYW5nZSwgZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuUmFuZ2UgPSBSYW5nZTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5FbGVtZW50O1xuICAgIHZhciBIVE1MQ29udGVudEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MQ29udGVudEVsZW1lbnQ7XG4gICAgdmFyIEhUTUxTaGFkb3dFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTFNoYWRvd0VsZW1lbnQ7XG4gICAgdmFyIE5vZGUgPSBzY29wZS53cmFwcGVycy5Ob2RlO1xuICAgIHZhciBTaGFkb3dSb290ID0gc2NvcGUud3JhcHBlcnMuU2hhZG93Um9vdDtcbiAgICB2YXIgYXNzZXJ0ID0gc2NvcGUuYXNzZXJ0O1xuICAgIHZhciBnZXRUcmVlU2NvcGUgPSBzY29wZS5nZXRUcmVlU2NvcGU7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIG9uZU9mID0gc2NvcGUub25lT2Y7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgQXJyYXlTcGxpY2UgPSBzY29wZS5BcnJheVNwbGljZTtcbiAgICBmdW5jdGlvbiB1cGRhdGVXcmFwcGVyVXBBbmRTaWRld2F5cyh3cmFwcGVyKSB7XG4gICAgICB3cmFwcGVyLnByZXZpb3VzU2libGluZ18gPSB3cmFwcGVyLnByZXZpb3VzU2libGluZztcbiAgICAgIHdyYXBwZXIubmV4dFNpYmxpbmdfID0gd3JhcHBlci5uZXh0U2libGluZztcbiAgICAgIHdyYXBwZXIucGFyZW50Tm9kZV8gPSB3cmFwcGVyLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZVdyYXBwZXJEb3duKHdyYXBwZXIpIHtcbiAgICAgIHdyYXBwZXIuZmlyc3RDaGlsZF8gPSB3cmFwcGVyLmZpcnN0Q2hpbGQ7XG4gICAgICB3cmFwcGVyLmxhc3RDaGlsZF8gPSB3cmFwcGVyLmxhc3RDaGlsZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlQWxsQ2hpbGROb2RlcyhwYXJlbnROb2RlV3JhcHBlcikge1xuICAgICAgYXNzZXJ0KHBhcmVudE5vZGVXcmFwcGVyIGluc3RhbmNlb2YgTm9kZSk7XG4gICAgICBmb3IgKHZhciBjaGlsZFdyYXBwZXIgPSBwYXJlbnROb2RlV3JhcHBlci5maXJzdENoaWxkOyBjaGlsZFdyYXBwZXI7IGNoaWxkV3JhcHBlciA9IGNoaWxkV3JhcHBlci5uZXh0U2libGluZykge1xuICAgICAgICB1cGRhdGVXcmFwcGVyVXBBbmRTaWRld2F5cyhjaGlsZFdyYXBwZXIpO1xuICAgICAgfVxuICAgICAgdXBkYXRlV3JhcHBlckRvd24ocGFyZW50Tm9kZVdyYXBwZXIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnNlcnRCZWZvcmUocGFyZW50Tm9kZVdyYXBwZXIsIG5ld0NoaWxkV3JhcHBlciwgcmVmQ2hpbGRXcmFwcGVyKSB7XG4gICAgICB2YXIgcGFyZW50Tm9kZSA9IHVud3JhcChwYXJlbnROb2RlV3JhcHBlcik7XG4gICAgICB2YXIgbmV3Q2hpbGQgPSB1bndyYXAobmV3Q2hpbGRXcmFwcGVyKTtcbiAgICAgIHZhciByZWZDaGlsZCA9IHJlZkNoaWxkV3JhcHBlciA/IHVud3JhcChyZWZDaGlsZFdyYXBwZXIpIDogbnVsbDtcbiAgICAgIHJlbW92ZShuZXdDaGlsZFdyYXBwZXIpO1xuICAgICAgdXBkYXRlV3JhcHBlclVwQW5kU2lkZXdheXMobmV3Q2hpbGRXcmFwcGVyKTtcbiAgICAgIGlmICghcmVmQ2hpbGRXcmFwcGVyKSB7XG4gICAgICAgIHBhcmVudE5vZGVXcmFwcGVyLmxhc3RDaGlsZF8gPSBwYXJlbnROb2RlV3JhcHBlci5sYXN0Q2hpbGQ7XG4gICAgICAgIGlmIChwYXJlbnROb2RlV3JhcHBlci5sYXN0Q2hpbGQgPT09IHBhcmVudE5vZGVXcmFwcGVyLmZpcnN0Q2hpbGQpIHBhcmVudE5vZGVXcmFwcGVyLmZpcnN0Q2hpbGRfID0gcGFyZW50Tm9kZVdyYXBwZXIuZmlyc3RDaGlsZDtcbiAgICAgICAgdmFyIGxhc3RDaGlsZFdyYXBwZXIgPSB3cmFwKHBhcmVudE5vZGUubGFzdENoaWxkKTtcbiAgICAgICAgaWYgKGxhc3RDaGlsZFdyYXBwZXIpIGxhc3RDaGlsZFdyYXBwZXIubmV4dFNpYmxpbmdfID0gbGFzdENoaWxkV3JhcHBlci5uZXh0U2libGluZztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwYXJlbnROb2RlV3JhcHBlci5maXJzdENoaWxkID09PSByZWZDaGlsZFdyYXBwZXIpIHBhcmVudE5vZGVXcmFwcGVyLmZpcnN0Q2hpbGRfID0gcmVmQ2hpbGRXcmFwcGVyO1xuICAgICAgICByZWZDaGlsZFdyYXBwZXIucHJldmlvdXNTaWJsaW5nXyA9IHJlZkNoaWxkV3JhcHBlci5wcmV2aW91c1NpYmxpbmc7XG4gICAgICB9XG4gICAgICBzY29wZS5vcmlnaW5hbEluc2VydEJlZm9yZS5jYWxsKHBhcmVudE5vZGUsIG5ld0NoaWxkLCByZWZDaGlsZCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZShub2RlV3JhcHBlcikge1xuICAgICAgdmFyIG5vZGUgPSB1bndyYXAobm9kZVdyYXBwZXIpO1xuICAgICAgdmFyIHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICBpZiAoIXBhcmVudE5vZGUpIHJldHVybjtcbiAgICAgIHZhciBwYXJlbnROb2RlV3JhcHBlciA9IHdyYXAocGFyZW50Tm9kZSk7XG4gICAgICB1cGRhdGVXcmFwcGVyVXBBbmRTaWRld2F5cyhub2RlV3JhcHBlcik7XG4gICAgICBpZiAobm9kZVdyYXBwZXIucHJldmlvdXNTaWJsaW5nKSBub2RlV3JhcHBlci5wcmV2aW91c1NpYmxpbmcubmV4dFNpYmxpbmdfID0gbm9kZVdyYXBwZXI7XG4gICAgICBpZiAobm9kZVdyYXBwZXIubmV4dFNpYmxpbmcpIG5vZGVXcmFwcGVyLm5leHRTaWJsaW5nLnByZXZpb3VzU2libGluZ18gPSBub2RlV3JhcHBlcjtcbiAgICAgIGlmIChwYXJlbnROb2RlV3JhcHBlci5sYXN0Q2hpbGQgPT09IG5vZGVXcmFwcGVyKSBwYXJlbnROb2RlV3JhcHBlci5sYXN0Q2hpbGRfID0gbm9kZVdyYXBwZXI7XG4gICAgICBpZiAocGFyZW50Tm9kZVdyYXBwZXIuZmlyc3RDaGlsZCA9PT0gbm9kZVdyYXBwZXIpIHBhcmVudE5vZGVXcmFwcGVyLmZpcnN0Q2hpbGRfID0gbm9kZVdyYXBwZXI7XG4gICAgICBzY29wZS5vcmlnaW5hbFJlbW92ZUNoaWxkLmNhbGwocGFyZW50Tm9kZSwgbm9kZSk7XG4gICAgfVxuICAgIHZhciBkaXN0cmlidXRlZE5vZGVzVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBkZXN0aW5hdGlvbkluc2VydGlvblBvaW50c1RhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgcmVuZGVyZXJGb3JIb3N0VGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIGZ1bmN0aW9uIHJlc2V0RGlzdHJpYnV0ZWROb2RlcyhpbnNlcnRpb25Qb2ludCkge1xuICAgICAgZGlzdHJpYnV0ZWROb2Rlc1RhYmxlLnNldChpbnNlcnRpb25Qb2ludCwgW10pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXREaXN0cmlidXRlZE5vZGVzKGluc2VydGlvblBvaW50KSB7XG4gICAgICB2YXIgcnYgPSBkaXN0cmlidXRlZE5vZGVzVGFibGUuZ2V0KGluc2VydGlvblBvaW50KTtcbiAgICAgIGlmICghcnYpIGRpc3RyaWJ1dGVkTm9kZXNUYWJsZS5zZXQoaW5zZXJ0aW9uUG9pbnQsIHJ2ID0gW10pO1xuICAgICAgcmV0dXJuIHJ2O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRDaGlsZE5vZGVzU25hcHNob3Qobm9kZSkge1xuICAgICAgdmFyIHJlc3VsdCA9IFtdLCBpID0gMDtcbiAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICByZXN1bHRbaSsrXSA9IGNoaWxkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgdmFyIHJlcXVlc3QgPSBvbmVPZih3aW5kb3csIFsgXCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWVcIiwgXCJtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcIiwgXCJ3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcIiwgXCJzZXRUaW1lb3V0XCIgXSk7XG4gICAgdmFyIHBlbmRpbmdEaXJ0eVJlbmRlcmVycyA9IFtdO1xuICAgIHZhciByZW5kZXJUaW1lcjtcbiAgICBmdW5jdGlvbiByZW5kZXJBbGxQZW5kaW5nKCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwZW5kaW5nRGlydHlSZW5kZXJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHJlbmRlcmVyID0gcGVuZGluZ0RpcnR5UmVuZGVyZXJzW2ldO1xuICAgICAgICB2YXIgcGFyZW50UmVuZGVyZXIgPSByZW5kZXJlci5wYXJlbnRSZW5kZXJlcjtcbiAgICAgICAgaWYgKHBhcmVudFJlbmRlcmVyICYmIHBhcmVudFJlbmRlcmVyLmRpcnR5KSBjb250aW51ZTtcbiAgICAgICAgcmVuZGVyZXIucmVuZGVyKCk7XG4gICAgICB9XG4gICAgICBwZW5kaW5nRGlydHlSZW5kZXJlcnMgPSBbXTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaGFuZGxlUmVxdWVzdEFuaW1hdGlvbkZyYW1lKCkge1xuICAgICAgcmVuZGVyVGltZXIgPSBudWxsO1xuICAgICAgcmVuZGVyQWxsUGVuZGluZygpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRSZW5kZXJlckZvckhvc3QoaG9zdCkge1xuICAgICAgdmFyIHJlbmRlcmVyID0gcmVuZGVyZXJGb3JIb3N0VGFibGUuZ2V0KGhvc3QpO1xuICAgICAgaWYgKCFyZW5kZXJlcikge1xuICAgICAgICByZW5kZXJlciA9IG5ldyBTaGFkb3dSZW5kZXJlcihob3N0KTtcbiAgICAgICAgcmVuZGVyZXJGb3JIb3N0VGFibGUuc2V0KGhvc3QsIHJlbmRlcmVyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZW5kZXJlcjtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0U2hhZG93Um9vdEFuY2VzdG9yKG5vZGUpIHtcbiAgICAgIHZhciByb290ID0gZ2V0VHJlZVNjb3BlKG5vZGUpLnJvb3Q7XG4gICAgICBpZiAocm9vdCBpbnN0YW5jZW9mIFNoYWRvd1Jvb3QpIHJldHVybiByb290O1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFJlbmRlcmVyRm9yU2hhZG93Um9vdChzaGFkb3dSb290KSB7XG4gICAgICByZXR1cm4gZ2V0UmVuZGVyZXJGb3JIb3N0KHNoYWRvd1Jvb3QuaG9zdCk7XG4gICAgfVxuICAgIHZhciBzcGxpY2VEaWZmID0gbmV3IEFycmF5U3BsaWNlKCk7XG4gICAgc3BsaWNlRGlmZi5lcXVhbHMgPSBmdW5jdGlvbihyZW5kZXJOb2RlLCByYXdOb2RlKSB7XG4gICAgICByZXR1cm4gdW53cmFwKHJlbmRlck5vZGUubm9kZSkgPT09IHJhd05vZGU7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBSZW5kZXJOb2RlKG5vZGUpIHtcbiAgICAgIHRoaXMuc2tpcCA9IGZhbHNlO1xuICAgICAgdGhpcy5ub2RlID0gbm9kZTtcbiAgICAgIHRoaXMuY2hpbGROb2RlcyA9IFtdO1xuICAgIH1cbiAgICBSZW5kZXJOb2RlLnByb3RvdHlwZSA9IHtcbiAgICAgIGFwcGVuZDogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgcnYgPSBuZXcgUmVuZGVyTm9kZShub2RlKTtcbiAgICAgICAgdGhpcy5jaGlsZE5vZGVzLnB1c2gocnYpO1xuICAgICAgICByZXR1cm4gcnY7XG4gICAgICB9LFxuICAgICAgc3luYzogZnVuY3Rpb24ob3B0X2FkZGVkKSB7XG4gICAgICAgIGlmICh0aGlzLnNraXApIHJldHVybjtcbiAgICAgICAgdmFyIG5vZGVXcmFwcGVyID0gdGhpcy5ub2RlO1xuICAgICAgICB2YXIgbmV3Q2hpbGRyZW4gPSB0aGlzLmNoaWxkTm9kZXM7XG4gICAgICAgIHZhciBvbGRDaGlsZHJlbiA9IGdldENoaWxkTm9kZXNTbmFwc2hvdCh1bndyYXAobm9kZVdyYXBwZXIpKTtcbiAgICAgICAgdmFyIGFkZGVkID0gb3B0X2FkZGVkIHx8IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHZhciBzcGxpY2VzID0gc3BsaWNlRGlmZi5jYWxjdWxhdGVTcGxpY2VzKG5ld0NoaWxkcmVuLCBvbGRDaGlsZHJlbik7XG4gICAgICAgIHZhciBuZXdJbmRleCA9IDAsIG9sZEluZGV4ID0gMDtcbiAgICAgICAgdmFyIGxhc3RJbmRleCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3BsaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBzcGxpY2UgPSBzcGxpY2VzW2ldO1xuICAgICAgICAgIGZvciAoO2xhc3RJbmRleCA8IHNwbGljZS5pbmRleDsgbGFzdEluZGV4KyspIHtcbiAgICAgICAgICAgIG9sZEluZGV4Kys7XG4gICAgICAgICAgICBuZXdDaGlsZHJlbltuZXdJbmRleCsrXS5zeW5jKGFkZGVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJlbW92ZWRDb3VudCA9IHNwbGljZS5yZW1vdmVkLmxlbmd0aDtcbiAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlbW92ZWRDb3VudDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgd3JhcHBlciA9IHdyYXAob2xkQ2hpbGRyZW5bb2xkSW5kZXgrK10pO1xuICAgICAgICAgICAgaWYgKCFhZGRlZC5nZXQod3JhcHBlcikpIHJlbW92ZSh3cmFwcGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGFkZGVkQ291bnQgPSBzcGxpY2UuYWRkZWRDb3VudDtcbiAgICAgICAgICB2YXIgcmVmTm9kZSA9IG9sZENoaWxkcmVuW29sZEluZGV4XSAmJiB3cmFwKG9sZENoaWxkcmVuW29sZEluZGV4XSk7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBhZGRlZENvdW50OyBqKyspIHtcbiAgICAgICAgICAgIHZhciBuZXdDaGlsZFJlbmRlck5vZGUgPSBuZXdDaGlsZHJlbltuZXdJbmRleCsrXTtcbiAgICAgICAgICAgIHZhciBuZXdDaGlsZFdyYXBwZXIgPSBuZXdDaGlsZFJlbmRlck5vZGUubm9kZTtcbiAgICAgICAgICAgIGluc2VydEJlZm9yZShub2RlV3JhcHBlciwgbmV3Q2hpbGRXcmFwcGVyLCByZWZOb2RlKTtcbiAgICAgICAgICAgIGFkZGVkLnNldChuZXdDaGlsZFdyYXBwZXIsIHRydWUpO1xuICAgICAgICAgICAgbmV3Q2hpbGRSZW5kZXJOb2RlLnN5bmMoYWRkZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsYXN0SW5kZXggKz0gYWRkZWRDb3VudDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gbGFzdEluZGV4OyBpIDwgbmV3Q2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBuZXdDaGlsZHJlbltpXS5zeW5jKGFkZGVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gU2hhZG93UmVuZGVyZXIoaG9zdCkge1xuICAgICAgdGhpcy5ob3N0ID0gaG9zdDtcbiAgICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUF0dHJpYnV0ZXMoKTtcbiAgICAgIHRoaXMuYXNzb2NpYXRlTm9kZShob3N0KTtcbiAgICB9XG4gICAgU2hhZG93UmVuZGVyZXIucHJvdG90eXBlID0ge1xuICAgICAgcmVuZGVyOiBmdW5jdGlvbihvcHRfcmVuZGVyTm9kZSkge1xuICAgICAgICBpZiAoIXRoaXMuZGlydHkpIHJldHVybjtcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlQXR0cmlidXRlcygpO1xuICAgICAgICB2YXIgaG9zdCA9IHRoaXMuaG9zdDtcbiAgICAgICAgdGhpcy5kaXN0cmlidXRpb24oaG9zdCk7XG4gICAgICAgIHZhciByZW5kZXJOb2RlID0gb3B0X3JlbmRlck5vZGUgfHwgbmV3IFJlbmRlck5vZGUoaG9zdCk7XG4gICAgICAgIHRoaXMuYnVpbGRSZW5kZXJUcmVlKHJlbmRlck5vZGUsIGhvc3QpO1xuICAgICAgICB2YXIgdG9wTW9zdFJlbmRlcmVyID0gIW9wdF9yZW5kZXJOb2RlO1xuICAgICAgICBpZiAodG9wTW9zdFJlbmRlcmVyKSByZW5kZXJOb2RlLnN5bmMoKTtcbiAgICAgICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgICAgfSxcbiAgICAgIGdldCBwYXJlbnRSZW5kZXJlcigpIHtcbiAgICAgICAgcmV0dXJuIGdldFRyZWVTY29wZSh0aGlzLmhvc3QpLnJlbmRlcmVyO1xuICAgICAgfSxcbiAgICAgIGludmFsaWRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuZGlydHkpIHtcbiAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICB2YXIgcGFyZW50UmVuZGVyZXIgPSB0aGlzLnBhcmVudFJlbmRlcmVyO1xuICAgICAgICAgIGlmIChwYXJlbnRSZW5kZXJlcikgcGFyZW50UmVuZGVyZXIuaW52YWxpZGF0ZSgpO1xuICAgICAgICAgIHBlbmRpbmdEaXJ0eVJlbmRlcmVycy5wdXNoKHRoaXMpO1xuICAgICAgICAgIGlmIChyZW5kZXJUaW1lcikgcmV0dXJuO1xuICAgICAgICAgIHJlbmRlclRpbWVyID0gd2luZG93W3JlcXVlc3RdKGhhbmRsZVJlcXVlc3RBbmltYXRpb25GcmFtZSwgMCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBkaXN0cmlidXRpb246IGZ1bmN0aW9uKHJvb3QpIHtcbiAgICAgICAgdGhpcy5yZXNldEFsbFN1YnRyZWVzKHJvb3QpO1xuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvblJlc29sdXRpb24ocm9vdCk7XG4gICAgICB9LFxuICAgICAgcmVzZXRBbGw6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgaWYgKGlzSW5zZXJ0aW9uUG9pbnQobm9kZSkpIHJlc2V0RGlzdHJpYnV0ZWROb2Rlcyhub2RlKTsgZWxzZSByZXNldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzKG5vZGUpO1xuICAgICAgICB0aGlzLnJlc2V0QWxsU3VidHJlZXMobm9kZSk7XG4gICAgICB9LFxuICAgICAgcmVzZXRBbGxTdWJ0cmVlczogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICB0aGlzLnJlc2V0QWxsKGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5zaGFkb3dSb290KSB0aGlzLnJlc2V0QWxsKG5vZGUuc2hhZG93Um9vdCk7XG4gICAgICAgIGlmIChub2RlLm9sZGVyU2hhZG93Um9vdCkgdGhpcy5yZXNldEFsbChub2RlLm9sZGVyU2hhZG93Um9vdCk7XG4gICAgICB9LFxuICAgICAgZGlzdHJpYnV0aW9uUmVzb2x1dGlvbjogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBpZiAoaXNTaGFkb3dIb3N0KG5vZGUpKSB7XG4gICAgICAgICAgdmFyIHNoYWRvd0hvc3QgPSBub2RlO1xuICAgICAgICAgIHZhciBwb29sID0gcG9vbFBvcHVsYXRpb24oc2hhZG93SG9zdCk7XG4gICAgICAgICAgdmFyIHNoYWRvd1RyZWVzID0gZ2V0U2hhZG93VHJlZXMoc2hhZG93SG9zdCk7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaGFkb3dUcmVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5wb29sRGlzdHJpYnV0aW9uKHNoYWRvd1RyZWVzW2ldLCBwb29sKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yICh2YXIgaSA9IHNoYWRvd1RyZWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB2YXIgc2hhZG93VHJlZSA9IHNoYWRvd1RyZWVzW2ldO1xuICAgICAgICAgICAgdmFyIHNoYWRvdyA9IGdldFNoYWRvd0luc2VydGlvblBvaW50KHNoYWRvd1RyZWUpO1xuICAgICAgICAgICAgaWYgKHNoYWRvdykge1xuICAgICAgICAgICAgICB2YXIgb2xkZXJTaGFkb3dSb290ID0gc2hhZG93VHJlZS5vbGRlclNoYWRvd1Jvb3Q7XG4gICAgICAgICAgICAgIGlmIChvbGRlclNoYWRvd1Jvb3QpIHtcbiAgICAgICAgICAgICAgICBwb29sID0gcG9vbFBvcHVsYXRpb24ob2xkZXJTaGFkb3dSb290KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBvb2wubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBkZXN0cmlidXRlTm9kZUludG8ocG9vbFtqXSwgc2hhZG93KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25SZXNvbHV0aW9uKHNoYWRvd1RyZWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvblJlc29sdXRpb24oY2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcG9vbERpc3RyaWJ1dGlvbjogZnVuY3Rpb24obm9kZSwgcG9vbCkge1xuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEhUTUxTaGFkb3dFbGVtZW50KSByZXR1cm47XG4gICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgSFRNTENvbnRlbnRFbGVtZW50KSB7XG4gICAgICAgICAgdmFyIGNvbnRlbnQgPSBub2RlO1xuICAgICAgICAgIHRoaXMudXBkYXRlRGVwZW5kZW50QXR0cmlidXRlcyhjb250ZW50LmdldEF0dHJpYnV0ZShcInNlbGVjdFwiKSk7XG4gICAgICAgICAgdmFyIGFueURpc3RyaWJ1dGVkID0gZmFsc2U7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb29sLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHBvb2xbaV07XG4gICAgICAgICAgICBpZiAoIW5vZGUpIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYgKG1hdGNoZXMobm9kZSwgY29udGVudCkpIHtcbiAgICAgICAgICAgICAgZGVzdHJpYnV0ZU5vZGVJbnRvKG5vZGUsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICBwb29sW2ldID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICBhbnlEaXN0cmlidXRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghYW55RGlzdHJpYnV0ZWQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGNoaWxkID0gY29udGVudC5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgICAgICBkZXN0cmlidXRlTm9kZUludG8oY2hpbGQsIGNvbnRlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgdGhpcy5wb29sRGlzdHJpYnV0aW9uKGNoaWxkLCBwb29sKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGJ1aWxkUmVuZGVyVHJlZTogZnVuY3Rpb24ocmVuZGVyTm9kZSwgbm9kZSkge1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmNvbXBvc2Uobm9kZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICB2YXIgY2hpbGRSZW5kZXJOb2RlID0gcmVuZGVyTm9kZS5hcHBlbmQoY2hpbGQpO1xuICAgICAgICAgIHRoaXMuYnVpbGRSZW5kZXJUcmVlKGNoaWxkUmVuZGVyTm9kZSwgY2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1NoYWRvd0hvc3Qobm9kZSkpIHtcbiAgICAgICAgICB2YXIgcmVuZGVyZXIgPSBnZXRSZW5kZXJlckZvckhvc3Qobm9kZSk7XG4gICAgICAgICAgcmVuZGVyZXIuZGlydHkgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGNvbXBvc2U6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gW107XG4gICAgICAgIHZhciBwID0gbm9kZS5zaGFkb3dSb290IHx8IG5vZGU7XG4gICAgICAgIGZvciAodmFyIGNoaWxkID0gcC5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgIGlmIChpc0luc2VydGlvblBvaW50KGNoaWxkKSkge1xuICAgICAgICAgICAgdGhpcy5hc3NvY2lhdGVOb2RlKHApO1xuICAgICAgICAgICAgdmFyIGRpc3RyaWJ1dGVkTm9kZXMgPSBnZXREaXN0cmlidXRlZE5vZGVzKGNoaWxkKTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGlzdHJpYnV0ZWROb2Rlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICB2YXIgZGlzdHJpYnV0ZWROb2RlID0gZGlzdHJpYnV0ZWROb2Rlc1tqXTtcbiAgICAgICAgICAgICAgaWYgKGlzRmluYWxEZXN0aW5hdGlvbihjaGlsZCwgZGlzdHJpYnV0ZWROb2RlKSkgY2hpbGRyZW4ucHVzaChkaXN0cmlidXRlZE5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNoaWxkcmVuO1xuICAgICAgfSxcbiAgICAgIGludmFsaWRhdGVBdHRyaWJ1dGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgIH0sXG4gICAgICB1cGRhdGVEZXBlbmRlbnRBdHRyaWJ1dGVzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSByZXR1cm47XG4gICAgICAgIHZhciBhdHRyaWJ1dGVzID0gdGhpcy5hdHRyaWJ1dGVzO1xuICAgICAgICBpZiAoL1xcLlxcdysvLnRlc3Qoc2VsZWN0b3IpKSBhdHRyaWJ1dGVzW1wiY2xhc3NcIl0gPSB0cnVlO1xuICAgICAgICBpZiAoLyNcXHcrLy50ZXN0KHNlbGVjdG9yKSkgYXR0cmlidXRlc1tcImlkXCJdID0gdHJ1ZTtcbiAgICAgICAgc2VsZWN0b3IucmVwbGFjZSgvXFxbXFxzKihbXlxccz1cXHx+XFxdXSspL2csIGZ1bmN0aW9uKF8sIG5hbWUpIHtcbiAgICAgICAgICBhdHRyaWJ1dGVzW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgZGVwZW5kc09uQXR0cmlidXRlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXNbbmFtZV07XG4gICAgICB9LFxuICAgICAgYXNzb2NpYXRlTm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAobm9kZSkucG9seW1lclNoYWRvd1JlbmRlcmVyXyA9IHRoaXM7XG4gICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBwb29sUG9wdWxhdGlvbihub2RlKSB7XG4gICAgICB2YXIgcG9vbCA9IFtdO1xuICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIGlmIChpc0luc2VydGlvblBvaW50KGNoaWxkKSkge1xuICAgICAgICAgIHBvb2wucHVzaC5hcHBseShwb29sLCBnZXREaXN0cmlidXRlZE5vZGVzKGNoaWxkKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcG9vbC5wdXNoKGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHBvb2w7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFNoYWRvd0luc2VydGlvblBvaW50KG5vZGUpIHtcbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgSFRNTFNoYWRvd0VsZW1lbnQpIHJldHVybiBub2RlO1xuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBIVE1MQ29udGVudEVsZW1lbnQpIHJldHVybiBudWxsO1xuICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIHZhciByZXMgPSBnZXRTaGFkb3dJbnNlcnRpb25Qb2ludChjaGlsZCk7XG4gICAgICAgIGlmIChyZXMpIHJldHVybiByZXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGVzdHJpYnV0ZU5vZGVJbnRvKGNoaWxkLCBpbnNlcnRpb25Qb2ludCkge1xuICAgICAgZ2V0RGlzdHJpYnV0ZWROb2RlcyhpbnNlcnRpb25Qb2ludCkucHVzaChjaGlsZCk7XG4gICAgICB2YXIgcG9pbnRzID0gZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHNUYWJsZS5nZXQoY2hpbGQpO1xuICAgICAgaWYgKCFwb2ludHMpIGRlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzVGFibGUuc2V0KGNoaWxkLCBbIGluc2VydGlvblBvaW50IF0pOyBlbHNlIHBvaW50cy5wdXNoKGluc2VydGlvblBvaW50KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMobm9kZSkge1xuICAgICAgcmV0dXJuIGRlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzVGFibGUuZ2V0KG5vZGUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZXNldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzKG5vZGUpIHtcbiAgICAgIGRlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzVGFibGUuc2V0KG5vZGUsIHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHZhciBzZWxlY3RvclN0YXJ0Q2hhclJlID0gL14oOm5vdFxcKCk/WyouI1thLXpBLVpffF0vO1xuICAgIGZ1bmN0aW9uIG1hdGNoZXMobm9kZSwgY29udGVudEVsZW1lbnQpIHtcbiAgICAgIHZhciBzZWxlY3QgPSBjb250ZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJzZWxlY3RcIik7XG4gICAgICBpZiAoIXNlbGVjdCkgcmV0dXJuIHRydWU7XG4gICAgICBzZWxlY3QgPSBzZWxlY3QudHJpbSgpO1xuICAgICAgaWYgKCFzZWxlY3QpIHJldHVybiB0cnVlO1xuICAgICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQpKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoIXNlbGVjdG9yU3RhcnRDaGFyUmUudGVzdChzZWxlY3QpKSByZXR1cm4gZmFsc2U7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gbm9kZS5tYXRjaGVzKHNlbGVjdCk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzRmluYWxEZXN0aW5hdGlvbihpbnNlcnRpb25Qb2ludCwgbm9kZSkge1xuICAgICAgdmFyIHBvaW50cyA9IGdldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzKG5vZGUpO1xuICAgICAgcmV0dXJuIHBvaW50cyAmJiBwb2ludHNbcG9pbnRzLmxlbmd0aCAtIDFdID09PSBpbnNlcnRpb25Qb2ludDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNJbnNlcnRpb25Qb2ludChub2RlKSB7XG4gICAgICByZXR1cm4gbm9kZSBpbnN0YW5jZW9mIEhUTUxDb250ZW50RWxlbWVudCB8fCBub2RlIGluc3RhbmNlb2YgSFRNTFNoYWRvd0VsZW1lbnQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzU2hhZG93SG9zdChzaGFkb3dIb3N0KSB7XG4gICAgICByZXR1cm4gc2hhZG93SG9zdC5zaGFkb3dSb290O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRTaGFkb3dUcmVlcyhob3N0KSB7XG4gICAgICB2YXIgdHJlZXMgPSBbXTtcbiAgICAgIGZvciAodmFyIHRyZWUgPSBob3N0LnNoYWRvd1Jvb3Q7IHRyZWU7IHRyZWUgPSB0cmVlLm9sZGVyU2hhZG93Um9vdCkge1xuICAgICAgICB0cmVlcy5wdXNoKHRyZWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRyZWVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZW5kZXIoaG9zdCkge1xuICAgICAgbmV3IFNoYWRvd1JlbmRlcmVyKGhvc3QpLnJlbmRlcigpO1xuICAgIH1cbiAgICBOb2RlLnByb3RvdHlwZS5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIgPSBmdW5jdGlvbihmb3JjZSkge1xuICAgICAgdmFyIHJlbmRlcmVyID0gdW5zYWZlVW53cmFwKHRoaXMpLnBvbHltZXJTaGFkb3dSZW5kZXJlcl87XG4gICAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgcmVuZGVyZXIuaW52YWxpZGF0ZSgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIEhUTUxDb250ZW50RWxlbWVudC5wcm90b3R5cGUuZ2V0RGlzdHJpYnV0ZWROb2RlcyA9IEhUTUxTaGFkb3dFbGVtZW50LnByb3RvdHlwZS5nZXREaXN0cmlidXRlZE5vZGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICByZXR1cm4gZ2V0RGlzdHJpYnV0ZWROb2Rlcyh0aGlzKTtcbiAgICB9O1xuICAgIEVsZW1lbnQucHJvdG90eXBlLmdldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICByZXR1cm4gZ2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHModGhpcykgfHwgW107XG4gICAgfTtcbiAgICBIVE1MQ29udGVudEVsZW1lbnQucHJvdG90eXBlLm5vZGVJc0luc2VydGVkXyA9IEhUTUxTaGFkb3dFbGVtZW50LnByb3RvdHlwZS5ub2RlSXNJbnNlcnRlZF8gPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKCk7XG4gICAgICB2YXIgc2hhZG93Um9vdCA9IGdldFNoYWRvd1Jvb3RBbmNlc3Rvcih0aGlzKTtcbiAgICAgIHZhciByZW5kZXJlcjtcbiAgICAgIGlmIChzaGFkb3dSb290KSByZW5kZXJlciA9IGdldFJlbmRlcmVyRm9yU2hhZG93Um9vdChzaGFkb3dSb290KTtcbiAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5wb2x5bWVyU2hhZG93UmVuZGVyZXJfID0gcmVuZGVyZXI7XG4gICAgICBpZiAocmVuZGVyZXIpIHJlbmRlcmVyLmludmFsaWRhdGUoKTtcbiAgICB9O1xuICAgIHNjb3BlLmdldFJlbmRlcmVyRm9ySG9zdCA9IGdldFJlbmRlcmVyRm9ySG9zdDtcbiAgICBzY29wZS5nZXRTaGFkb3dUcmVlcyA9IGdldFNoYWRvd1RyZWVzO1xuICAgIHNjb3BlLnJlbmRlckFsbFBlbmRpbmcgPSByZW5kZXJBbGxQZW5kaW5nO1xuICAgIHNjb3BlLmdldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzID0gZ2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHM7XG4gICAgc2NvcGUudmlzdWFsID0ge1xuICAgICAgaW5zZXJ0QmVmb3JlOiBpbnNlcnRCZWZvcmUsXG4gICAgICByZW1vdmU6IHJlbW92ZVxuICAgIH07XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBhc3NlcnQgPSBzY29wZS5hc3NlcnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgZWxlbWVudHNXaXRoRm9ybVByb3BlcnR5ID0gWyBcIkhUTUxCdXR0b25FbGVtZW50XCIsIFwiSFRNTEZpZWxkU2V0RWxlbWVudFwiLCBcIkhUTUxJbnB1dEVsZW1lbnRcIiwgXCJIVE1MS2V5Z2VuRWxlbWVudFwiLCBcIkhUTUxMYWJlbEVsZW1lbnRcIiwgXCJIVE1MTGVnZW5kRWxlbWVudFwiLCBcIkhUTUxPYmplY3RFbGVtZW50XCIsIFwiSFRNTE91dHB1dEVsZW1lbnRcIiwgXCJIVE1MVGV4dEFyZWFFbGVtZW50XCIgXTtcbiAgICBmdW5jdGlvbiBjcmVhdGVXcmFwcGVyQ29uc3RydWN0b3IobmFtZSkge1xuICAgICAgaWYgKCF3aW5kb3dbbmFtZV0pIHJldHVybjtcbiAgICAgIGFzc2VydCghc2NvcGUud3JhcHBlcnNbbmFtZV0pO1xuICAgICAgdmFyIEdlbmVyYXRlZFdyYXBwZXIgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgICB9O1xuICAgICAgR2VuZXJhdGVkV3JhcHBlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgICBtaXhpbihHZW5lcmF0ZWRXcmFwcGVyLnByb3RvdHlwZSwge1xuICAgICAgICBnZXQgZm9ybSgpIHtcbiAgICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuZm9ybSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmVnaXN0ZXJXcmFwcGVyKHdpbmRvd1tuYW1lXSwgR2VuZXJhdGVkV3JhcHBlciwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lLnNsaWNlKDQsIC03KSkpO1xuICAgICAgc2NvcGUud3JhcHBlcnNbbmFtZV0gPSBHZW5lcmF0ZWRXcmFwcGVyO1xuICAgIH1cbiAgICBlbGVtZW50c1dpdGhGb3JtUHJvcGVydHkuZm9yRWFjaChjcmVhdGVXcmFwcGVyQ29uc3RydWN0b3IpO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBzZXRXcmFwcGVyID0gc2NvcGUuc2V0V3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHVud3JhcElmTmVlZGVkID0gc2NvcGUudW53cmFwSWZOZWVkZWQ7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbFNlbGVjdGlvbiA9IHdpbmRvdy5TZWxlY3Rpb247XG4gICAgZnVuY3Rpb24gU2VsZWN0aW9uKGltcGwpIHtcbiAgICAgIHNldFdyYXBwZXIoaW1wbCwgdGhpcyk7XG4gICAgfVxuICAgIFNlbGVjdGlvbi5wcm90b3R5cGUgPSB7XG4gICAgICBnZXQgYW5jaG9yTm9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmFuY2hvck5vZGUpO1xuICAgICAgfSxcbiAgICAgIGdldCBmb2N1c05vZGUoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5mb2N1c05vZGUpO1xuICAgICAgfSxcbiAgICAgIGFkZFJhbmdlOiBmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuYWRkUmFuZ2UodW53cmFwSWZOZWVkZWQocmFuZ2UpKTtcbiAgICAgIH0sXG4gICAgICBjb2xsYXBzZTogZnVuY3Rpb24obm9kZSwgaW5kZXgpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLmNvbGxhcHNlKHVud3JhcElmTmVlZGVkKG5vZGUpLCBpbmRleCk7XG4gICAgICB9LFxuICAgICAgY29udGFpbnNOb2RlOiBmdW5jdGlvbihub2RlLCBhbGxvd1BhcnRpYWwpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5jb250YWluc05vZGUodW53cmFwSWZOZWVkZWQobm9kZSksIGFsbG93UGFydGlhbCk7XG4gICAgICB9LFxuICAgICAgZ2V0UmFuZ2VBdDogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmdldFJhbmdlQXQoaW5kZXgpKTtcbiAgICAgIH0sXG4gICAgICByZW1vdmVSYW5nZTogZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnJlbW92ZVJhbmdlKHVud3JhcChyYW5nZSkpO1xuICAgICAgfSxcbiAgICAgIHNlbGVjdEFsbENoaWxkcmVuOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5zZWxlY3RBbGxDaGlsZHJlbihub2RlIGluc3RhbmNlb2YgU2hhZG93Um9vdCA/IHVuc2FmZVVud3JhcChub2RlLmhvc3QpIDogdW53cmFwSWZOZWVkZWQobm9kZSkpO1xuICAgICAgfSxcbiAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS50b1N0cmluZygpO1xuICAgICAgfVxuICAgIH07XG4gICAgaWYgKE9yaWdpbmFsU2VsZWN0aW9uLnByb3RvdHlwZS5leHRlbmQpIHtcbiAgICAgIFNlbGVjdGlvbi5wcm90b3R5cGUuZXh0ZW5kID0gZnVuY3Rpb24obm9kZSwgb2Zmc2V0KSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5leHRlbmQodW53cmFwSWZOZWVkZWQobm9kZSksIG9mZnNldCk7XG4gICAgICB9O1xuICAgIH1cbiAgICByZWdpc3RlcldyYXBwZXIod2luZG93LlNlbGVjdGlvbiwgU2VsZWN0aW9uLCB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkpO1xuICAgIHNjb3BlLndyYXBwZXJzLlNlbGVjdGlvbiA9IFNlbGVjdGlvbjtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgc2V0V3JhcHBlciA9IHNjb3BlLnNldFdyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwSWZOZWVkZWQgPSBzY29wZS51bndyYXBJZk5lZWRlZDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsVHJlZVdhbGtlciA9IHdpbmRvdy5UcmVlV2Fsa2VyO1xuICAgIGZ1bmN0aW9uIFRyZWVXYWxrZXIoaW1wbCkge1xuICAgICAgc2V0V3JhcHBlcihpbXBsLCB0aGlzKTtcbiAgICB9XG4gICAgVHJlZVdhbGtlci5wcm90b3R5cGUgPSB7XG4gICAgICBnZXQgcm9vdCgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLnJvb3QpO1xuICAgICAgfSxcbiAgICAgIGdldCBjdXJyZW50Tm9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmN1cnJlbnROb2RlKTtcbiAgICAgIH0sXG4gICAgICBzZXQgY3VycmVudE5vZGUobm9kZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuY3VycmVudE5vZGUgPSB1bndyYXBJZk5lZWRlZChub2RlKTtcbiAgICAgIH0sXG4gICAgICBnZXQgZmlsdGVyKCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLmZpbHRlcjtcbiAgICAgIH0sXG4gICAgICBwYXJlbnROb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLnBhcmVudE5vZGUoKSk7XG4gICAgICB9LFxuICAgICAgZmlyc3RDaGlsZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5maXJzdENoaWxkKCkpO1xuICAgICAgfSxcbiAgICAgIGxhc3RDaGlsZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5sYXN0Q2hpbGQoKSk7XG4gICAgICB9LFxuICAgICAgcHJldmlvdXNTaWJsaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLnByZXZpb3VzU2libGluZygpKTtcbiAgICAgIH0sXG4gICAgICBwcmV2aW91c05vZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykucHJldmlvdXNOb2RlKCkpO1xuICAgICAgfSxcbiAgICAgIG5leHROb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLm5leHROb2RlKCkpO1xuICAgICAgfVxuICAgIH07XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsVHJlZVdhbGtlciwgVHJlZVdhbGtlcik7XG4gICAgc2NvcGUud3JhcHBlcnMuVHJlZVdhbGtlciA9IFRyZWVXYWxrZXI7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBHZXRFbGVtZW50c0J5SW50ZXJmYWNlID0gc2NvcGUuR2V0RWxlbWVudHNCeUludGVyZmFjZTtcbiAgICB2YXIgTm9kZSA9IHNjb3BlLndyYXBwZXJzLk5vZGU7XG4gICAgdmFyIFBhcmVudE5vZGVJbnRlcmZhY2UgPSBzY29wZS5QYXJlbnROb2RlSW50ZXJmYWNlO1xuICAgIHZhciBOb25FbGVtZW50UGFyZW50Tm9kZUludGVyZmFjZSA9IHNjb3BlLk5vbkVsZW1lbnRQYXJlbnROb2RlSW50ZXJmYWNlO1xuICAgIHZhciBTZWxlY3Rpb24gPSBzY29wZS53cmFwcGVycy5TZWxlY3Rpb247XG4gICAgdmFyIFNlbGVjdG9yc0ludGVyZmFjZSA9IHNjb3BlLlNlbGVjdG9yc0ludGVyZmFjZTtcbiAgICB2YXIgU2hhZG93Um9vdCA9IHNjb3BlLndyYXBwZXJzLlNoYWRvd1Jvb3Q7XG4gICAgdmFyIFRyZWVTY29wZSA9IHNjb3BlLlRyZWVTY29wZTtcbiAgICB2YXIgY2xvbmVOb2RlID0gc2NvcGUuY2xvbmVOb2RlO1xuICAgIHZhciBkZWZpbmVHZXR0ZXIgPSBzY29wZS5kZWZpbmVHZXR0ZXI7XG4gICAgdmFyIGRlZmluZVdyYXBHZXR0ZXIgPSBzY29wZS5kZWZpbmVXcmFwR2V0dGVyO1xuICAgIHZhciBlbGVtZW50RnJvbVBvaW50ID0gc2NvcGUuZWxlbWVudEZyb21Qb2ludDtcbiAgICB2YXIgZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXIgPSBzY29wZS5mb3J3YXJkTWV0aG9kc1RvV3JhcHBlcjtcbiAgICB2YXIgbWF0Y2hlc05hbWVzID0gc2NvcGUubWF0Y2hlc05hbWVzO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHJlbmRlckFsbFBlbmRpbmcgPSBzY29wZS5yZW5kZXJBbGxQZW5kaW5nO1xuICAgIHZhciByZXdyYXAgPSBzY29wZS5yZXdyYXA7XG4gICAgdmFyIHNldFdyYXBwZXIgPSBzY29wZS5zZXRXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIHdyYXBFdmVudFRhcmdldE1ldGhvZHMgPSBzY29wZS53cmFwRXZlbnRUYXJnZXRNZXRob2RzO1xuICAgIHZhciB3cmFwTm9kZUxpc3QgPSBzY29wZS53cmFwTm9kZUxpc3Q7XG4gICAgdmFyIGltcGxlbWVudGF0aW9uVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIGZ1bmN0aW9uIERvY3VtZW50KG5vZGUpIHtcbiAgICAgIE5vZGUuY2FsbCh0aGlzLCBub2RlKTtcbiAgICAgIHRoaXMudHJlZVNjb3BlXyA9IG5ldyBUcmVlU2NvcGUodGhpcywgbnVsbCk7XG4gICAgfVxuICAgIERvY3VtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTm9kZS5wcm90b3R5cGUpO1xuICAgIGRlZmluZVdyYXBHZXR0ZXIoRG9jdW1lbnQsIFwiZG9jdW1lbnRFbGVtZW50XCIpO1xuICAgIGRlZmluZVdyYXBHZXR0ZXIoRG9jdW1lbnQsIFwiYm9keVwiKTtcbiAgICBkZWZpbmVXcmFwR2V0dGVyKERvY3VtZW50LCBcImhlYWRcIik7XG4gICAgZGVmaW5lR2V0dGVyKERvY3VtZW50LCBcImFjdGl2ZUVsZW1lbnRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdW53cmFwcGVkQWN0aXZlRWxlbWVudCA9IHVud3JhcCh0aGlzKS5hY3RpdmVFbGVtZW50O1xuICAgICAgaWYgKCF1bndyYXBwZWRBY3RpdmVFbGVtZW50IHx8ICF1bndyYXBwZWRBY3RpdmVFbGVtZW50Lm5vZGVUeXBlKSByZXR1cm4gbnVsbDtcbiAgICAgIHZhciBhY3RpdmVFbGVtZW50ID0gd3JhcCh1bndyYXBwZWRBY3RpdmVFbGVtZW50KTtcbiAgICAgIHdoaWxlICghdGhpcy5jb250YWlucyhhY3RpdmVFbGVtZW50KSkge1xuICAgICAgICB3aGlsZSAoYWN0aXZlRWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgYWN0aXZlRWxlbWVudCA9IGFjdGl2ZUVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYWN0aXZlRWxlbWVudC5ob3N0KSB7XG4gICAgICAgICAgYWN0aXZlRWxlbWVudCA9IGFjdGl2ZUVsZW1lbnQuaG9zdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGFjdGl2ZUVsZW1lbnQ7XG4gICAgfSk7XG4gICAgZnVuY3Rpb24gd3JhcE1ldGhvZChuYW1lKSB7XG4gICAgICB2YXIgb3JpZ2luYWwgPSBkb2N1bWVudFtuYW1lXTtcbiAgICAgIERvY3VtZW50LnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcChvcmlnaW5hbC5hcHBseSh1bnNhZmVVbndyYXAodGhpcyksIGFyZ3VtZW50cykpO1xuICAgICAgfTtcbiAgICB9XG4gICAgWyBcImNyZWF0ZUNvbW1lbnRcIiwgXCJjcmVhdGVEb2N1bWVudEZyYWdtZW50XCIsIFwiY3JlYXRlRWxlbWVudFwiLCBcImNyZWF0ZUVsZW1lbnROU1wiLCBcImNyZWF0ZUV2ZW50XCIsIFwiY3JlYXRlRXZlbnROU1wiLCBcImNyZWF0ZVJhbmdlXCIsIFwiY3JlYXRlVGV4dE5vZGVcIiBdLmZvckVhY2god3JhcE1ldGhvZCk7XG4gICAgdmFyIG9yaWdpbmFsQWRvcHROb2RlID0gZG9jdW1lbnQuYWRvcHROb2RlO1xuICAgIGZ1bmN0aW9uIGFkb3B0Tm9kZU5vUmVtb3ZlKG5vZGUsIGRvYykge1xuICAgICAgb3JpZ2luYWxBZG9wdE5vZGUuY2FsbCh1bnNhZmVVbndyYXAoZG9jKSwgdW53cmFwKG5vZGUpKTtcbiAgICAgIGFkb3B0U3VidHJlZShub2RlLCBkb2MpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhZG9wdFN1YnRyZWUobm9kZSwgZG9jKSB7XG4gICAgICBpZiAobm9kZS5zaGFkb3dSb290KSBkb2MuYWRvcHROb2RlKG5vZGUuc2hhZG93Um9vdCk7XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIFNoYWRvd1Jvb3QpIGFkb3B0T2xkZXJTaGFkb3dSb290cyhub2RlLCBkb2MpO1xuICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIGFkb3B0U3VidHJlZShjaGlsZCwgZG9jKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gYWRvcHRPbGRlclNoYWRvd1Jvb3RzKHNoYWRvd1Jvb3QsIGRvYykge1xuICAgICAgdmFyIG9sZFNoYWRvd1Jvb3QgPSBzaGFkb3dSb290Lm9sZGVyU2hhZG93Um9vdDtcbiAgICAgIGlmIChvbGRTaGFkb3dSb290KSBkb2MuYWRvcHROb2RlKG9sZFNoYWRvd1Jvb3QpO1xuICAgIH1cbiAgICB2YXIgb3JpZ2luYWxHZXRTZWxlY3Rpb24gPSBkb2N1bWVudC5nZXRTZWxlY3Rpb247XG4gICAgbWl4aW4oRG9jdW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBhZG9wdE5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUucGFyZW50Tm9kZSkgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICBhZG9wdE5vZGVOb1JlbW92ZShub2RlLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICB9LFxuICAgICAgZWxlbWVudEZyb21Qb2ludDogZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICByZXR1cm4gZWxlbWVudEZyb21Qb2ludCh0aGlzLCB0aGlzLCB4LCB5KTtcbiAgICAgIH0sXG4gICAgICBpbXBvcnROb2RlOiBmdW5jdGlvbihub2RlLCBkZWVwKSB7XG4gICAgICAgIHJldHVybiBjbG9uZU5vZGUobm9kZSwgZGVlcCwgdW5zYWZlVW53cmFwKHRoaXMpKTtcbiAgICAgIH0sXG4gICAgICBnZXRTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICAgIHJldHVybiBuZXcgU2VsZWN0aW9uKG9yaWdpbmFsR2V0U2VsZWN0aW9uLmNhbGwodW53cmFwKHRoaXMpKSk7XG4gICAgICB9LFxuICAgICAgZ2V0RWxlbWVudHNCeU5hbWU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIFNlbGVjdG9yc0ludGVyZmFjZS5xdWVyeVNlbGVjdG9yQWxsLmNhbGwodGhpcywgXCJbbmFtZT1cIiArIEpTT04uc3RyaW5naWZ5KFN0cmluZyhuYW1lKSkgKyBcIl1cIik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdmFyIG9yaWdpbmFsQ3JlYXRlVHJlZVdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXI7XG4gICAgdmFyIFRyZWVXYWxrZXJXcmFwcGVyID0gc2NvcGUud3JhcHBlcnMuVHJlZVdhbGtlcjtcbiAgICBEb2N1bWVudC5wcm90b3R5cGUuY3JlYXRlVHJlZVdhbGtlciA9IGZ1bmN0aW9uKHJvb3QsIHdoYXRUb1Nob3csIGZpbHRlciwgZXhwYW5kRW50aXR5UmVmZXJlbmNlcykge1xuICAgICAgdmFyIG5ld0ZpbHRlciA9IG51bGw7XG4gICAgICBpZiAoZmlsdGVyKSB7XG4gICAgICAgIGlmIChmaWx0ZXIuYWNjZXB0Tm9kZSAmJiB0eXBlb2YgZmlsdGVyLmFjY2VwdE5vZGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIG5ld0ZpbHRlciA9IHtcbiAgICAgICAgICAgIGFjY2VwdE5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlci5hY2NlcHROb2RlKHdyYXAobm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGZpbHRlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgbmV3RmlsdGVyID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlcih3cmFwKG5vZGUpKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFRyZWVXYWxrZXJXcmFwcGVyKG9yaWdpbmFsQ3JlYXRlVHJlZVdhbGtlci5jYWxsKHVud3JhcCh0aGlzKSwgdW53cmFwKHJvb3QpLCB3aGF0VG9TaG93LCBuZXdGaWx0ZXIsIGV4cGFuZEVudGl0eVJlZmVyZW5jZXMpKTtcbiAgICB9O1xuICAgIGlmIChkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQpIHtcbiAgICAgIHZhciBvcmlnaW5hbFJlZ2lzdGVyRWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudDtcbiAgICAgIERvY3VtZW50LnByb3RvdHlwZS5yZWdpc3RlckVsZW1lbnQgPSBmdW5jdGlvbih0YWdOYW1lLCBvYmplY3QpIHtcbiAgICAgICAgdmFyIHByb3RvdHlwZSwgZXh0ZW5kc09wdGlvbjtcbiAgICAgICAgaWYgKG9iamVjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcHJvdG90eXBlID0gb2JqZWN0LnByb3RvdHlwZTtcbiAgICAgICAgICBleHRlbmRzT3B0aW9uID0gb2JqZWN0LmV4dGVuZHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwcm90b3R5cGUpIHByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICAgICAgaWYgKHNjb3BlLm5hdGl2ZVByb3RvdHlwZVRhYmxlLmdldChwcm90b3R5cGUpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90U3VwcG9ydGVkRXJyb3JcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvdHlwZSk7XG4gICAgICAgIHZhciBuYXRpdmVQcm90b3R5cGU7XG4gICAgICAgIHZhciBwcm90b3R5cGVzID0gW107XG4gICAgICAgIHdoaWxlIChwcm90bykge1xuICAgICAgICAgIG5hdGl2ZVByb3RvdHlwZSA9IHNjb3BlLm5hdGl2ZVByb3RvdHlwZVRhYmxlLmdldChwcm90byk7XG4gICAgICAgICAgaWYgKG5hdGl2ZVByb3RvdHlwZSkgYnJlYWs7XG4gICAgICAgICAgcHJvdG90eXBlcy5wdXNoKHByb3RvKTtcbiAgICAgICAgICBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90byk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFuYXRpdmVQcm90b3R5cGUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3RTdXBwb3J0ZWRFcnJvclwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmV3UHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShuYXRpdmVQcm90b3R5cGUpO1xuICAgICAgICBmb3IgKHZhciBpID0gcHJvdG90eXBlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgIG5ld1Byb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobmV3UHJvdG90eXBlKTtcbiAgICAgICAgfVxuICAgICAgICBbIFwiY3JlYXRlZENhbGxiYWNrXCIsIFwiYXR0YWNoZWRDYWxsYmFja1wiLCBcImRldGFjaGVkQ2FsbGJhY2tcIiwgXCJhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2tcIiBdLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgIHZhciBmID0gcHJvdG90eXBlW25hbWVdO1xuICAgICAgICAgIGlmICghZikgcmV0dXJuO1xuICAgICAgICAgIG5ld1Byb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCEod3JhcCh0aGlzKSBpbnN0YW5jZW9mIEN1c3RvbUVsZW1lbnRDb25zdHJ1Y3RvcikpIHtcbiAgICAgICAgICAgICAgcmV3cmFwKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZi5hcHBseSh3cmFwKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgcCA9IHtcbiAgICAgICAgICBwcm90b3R5cGU6IG5ld1Byb3RvdHlwZVxuICAgICAgICB9O1xuICAgICAgICBpZiAoZXh0ZW5kc09wdGlvbikgcC5leHRlbmRzID0gZXh0ZW5kc09wdGlvbjtcbiAgICAgICAgZnVuY3Rpb24gQ3VzdG9tRWxlbWVudENvbnN0cnVjdG9yKG5vZGUpIHtcbiAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGlmIChleHRlbmRzT3B0aW9uKSB7XG4gICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGV4dGVuZHNPcHRpb24sIHRhZ05hbWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHNldFdyYXBwZXIobm9kZSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgQ3VzdG9tRWxlbWVudENvbnN0cnVjdG9yLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICAgICAgQ3VzdG9tRWxlbWVudENvbnN0cnVjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEN1c3RvbUVsZW1lbnRDb25zdHJ1Y3RvcjtcbiAgICAgICAgc2NvcGUuY29uc3RydWN0b3JUYWJsZS5zZXQobmV3UHJvdG90eXBlLCBDdXN0b21FbGVtZW50Q29uc3RydWN0b3IpO1xuICAgICAgICBzY29wZS5uYXRpdmVQcm90b3R5cGVUYWJsZS5zZXQocHJvdG90eXBlLCBuZXdQcm90b3R5cGUpO1xuICAgICAgICB2YXIgbmF0aXZlQ29uc3RydWN0b3IgPSBvcmlnaW5hbFJlZ2lzdGVyRWxlbWVudC5jYWxsKHVud3JhcCh0aGlzKSwgdGFnTmFtZSwgcCk7XG4gICAgICAgIHJldHVybiBDdXN0b21FbGVtZW50Q29uc3RydWN0b3I7XG4gICAgICB9O1xuICAgICAgZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXIoWyB3aW5kb3cuSFRNTERvY3VtZW50IHx8IHdpbmRvdy5Eb2N1bWVudCBdLCBbIFwicmVnaXN0ZXJFbGVtZW50XCIgXSk7XG4gICAgfVxuICAgIGZvcndhcmRNZXRob2RzVG9XcmFwcGVyKFsgd2luZG93LkhUTUxCb2R5RWxlbWVudCwgd2luZG93LkhUTUxEb2N1bWVudCB8fCB3aW5kb3cuRG9jdW1lbnQsIHdpbmRvdy5IVE1MSGVhZEVsZW1lbnQsIHdpbmRvdy5IVE1MSHRtbEVsZW1lbnQgXSwgWyBcImFwcGVuZENoaWxkXCIsIFwiY29tcGFyZURvY3VtZW50UG9zaXRpb25cIiwgXCJjb250YWluc1wiLCBcImdldEVsZW1lbnRzQnlDbGFzc05hbWVcIiwgXCJnZXRFbGVtZW50c0J5VGFnTmFtZVwiLCBcImdldEVsZW1lbnRzQnlUYWdOYW1lTlNcIiwgXCJpbnNlcnRCZWZvcmVcIiwgXCJxdWVyeVNlbGVjdG9yXCIsIFwicXVlcnlTZWxlY3RvckFsbFwiLCBcInJlbW92ZUNoaWxkXCIsIFwicmVwbGFjZUNoaWxkXCIgXSk7XG4gICAgZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXIoWyB3aW5kb3cuSFRNTEJvZHlFbGVtZW50LCB3aW5kb3cuSFRNTEhlYWRFbGVtZW50LCB3aW5kb3cuSFRNTEh0bWxFbGVtZW50IF0sIG1hdGNoZXNOYW1lcyk7XG4gICAgZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXIoWyB3aW5kb3cuSFRNTERvY3VtZW50IHx8IHdpbmRvdy5Eb2N1bWVudCBdLCBbIFwiYWRvcHROb2RlXCIsIFwiaW1wb3J0Tm9kZVwiLCBcImNvbnRhaW5zXCIsIFwiY3JlYXRlQ29tbWVudFwiLCBcImNyZWF0ZURvY3VtZW50RnJhZ21lbnRcIiwgXCJjcmVhdGVFbGVtZW50XCIsIFwiY3JlYXRlRWxlbWVudE5TXCIsIFwiY3JlYXRlRXZlbnRcIiwgXCJjcmVhdGVFdmVudE5TXCIsIFwiY3JlYXRlUmFuZ2VcIiwgXCJjcmVhdGVUZXh0Tm9kZVwiLCBcImNyZWF0ZVRyZWVXYWxrZXJcIiwgXCJlbGVtZW50RnJvbVBvaW50XCIsIFwiZ2V0RWxlbWVudEJ5SWRcIiwgXCJnZXRFbGVtZW50c0J5TmFtZVwiLCBcImdldFNlbGVjdGlvblwiIF0pO1xuICAgIG1peGluKERvY3VtZW50LnByb3RvdHlwZSwgR2V0RWxlbWVudHNCeUludGVyZmFjZSk7XG4gICAgbWl4aW4oRG9jdW1lbnQucHJvdG90eXBlLCBQYXJlbnROb2RlSW50ZXJmYWNlKTtcbiAgICBtaXhpbihEb2N1bWVudC5wcm90b3R5cGUsIFNlbGVjdG9yc0ludGVyZmFjZSk7XG4gICAgbWl4aW4oRG9jdW1lbnQucHJvdG90eXBlLCBOb25FbGVtZW50UGFyZW50Tm9kZUludGVyZmFjZSk7XG4gICAgbWl4aW4oRG9jdW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBnZXQgaW1wbGVtZW50YXRpb24oKSB7XG4gICAgICAgIHZhciBpbXBsZW1lbnRhdGlvbiA9IGltcGxlbWVudGF0aW9uVGFibGUuZ2V0KHRoaXMpO1xuICAgICAgICBpZiAoaW1wbGVtZW50YXRpb24pIHJldHVybiBpbXBsZW1lbnRhdGlvbjtcbiAgICAgICAgaW1wbGVtZW50YXRpb24gPSBuZXcgRE9NSW1wbGVtZW50YXRpb24odW53cmFwKHRoaXMpLmltcGxlbWVudGF0aW9uKTtcbiAgICAgICAgaW1wbGVtZW50YXRpb25UYWJsZS5zZXQodGhpcywgaW1wbGVtZW50YXRpb24pO1xuICAgICAgICByZXR1cm4gaW1wbGVtZW50YXRpb247XG4gICAgICB9LFxuICAgICAgZ2V0IGRlZmF1bHRWaWV3KCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuZGVmYXVsdFZpZXcpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcih3aW5kb3cuRG9jdW1lbnQsIERvY3VtZW50LCBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQoXCJcIikpO1xuICAgIGlmICh3aW5kb3cuSFRNTERvY3VtZW50KSByZWdpc3RlcldyYXBwZXIod2luZG93LkhUTUxEb2N1bWVudCwgRG9jdW1lbnQpO1xuICAgIHdyYXBFdmVudFRhcmdldE1ldGhvZHMoWyB3aW5kb3cuSFRNTEJvZHlFbGVtZW50LCB3aW5kb3cuSFRNTERvY3VtZW50IHx8IHdpbmRvdy5Eb2N1bWVudCwgd2luZG93LkhUTUxIZWFkRWxlbWVudCBdKTtcbiAgICBmdW5jdGlvbiBET01JbXBsZW1lbnRhdGlvbihpbXBsKSB7XG4gICAgICBzZXRXcmFwcGVyKGltcGwsIHRoaXMpO1xuICAgIH1cbiAgICB2YXIgb3JpZ2luYWxDcmVhdGVEb2N1bWVudCA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZURvY3VtZW50O1xuICAgIERPTUltcGxlbWVudGF0aW9uLnByb3RvdHlwZS5jcmVhdGVEb2N1bWVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgYXJndW1lbnRzWzJdID0gdW53cmFwKGFyZ3VtZW50c1syXSk7XG4gICAgICByZXR1cm4gd3JhcChvcmlnaW5hbENyZWF0ZURvY3VtZW50LmFwcGx5KHVuc2FmZVVud3JhcCh0aGlzKSwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiB3cmFwSW1wbE1ldGhvZChjb25zdHJ1Y3RvciwgbmFtZSkge1xuICAgICAgdmFyIG9yaWdpbmFsID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb25bbmFtZV07XG4gICAgICBjb25zdHJ1Y3Rvci5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAob3JpZ2luYWwuYXBwbHkodW5zYWZlVW53cmFwKHRoaXMpLCBhcmd1bWVudHMpKTtcbiAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZvcndhcmRJbXBsTWV0aG9kKGNvbnN0cnVjdG9yLCBuYW1lKSB7XG4gICAgICB2YXIgb3JpZ2luYWwgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbltuYW1lXTtcbiAgICAgIGNvbnN0cnVjdG9yLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gb3JpZ2luYWwuYXBwbHkodW5zYWZlVW53cmFwKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9XG4gICAgd3JhcEltcGxNZXRob2QoRE9NSW1wbGVtZW50YXRpb24sIFwiY3JlYXRlRG9jdW1lbnRUeXBlXCIpO1xuICAgIHdyYXBJbXBsTWV0aG9kKERPTUltcGxlbWVudGF0aW9uLCBcImNyZWF0ZUhUTUxEb2N1bWVudFwiKTtcbiAgICBmb3J3YXJkSW1wbE1ldGhvZChET01JbXBsZW1lbnRhdGlvbiwgXCJoYXNGZWF0dXJlXCIpO1xuICAgIHJlZ2lzdGVyV3JhcHBlcih3aW5kb3cuRE9NSW1wbGVtZW50YXRpb24sIERPTUltcGxlbWVudGF0aW9uKTtcbiAgICBmb3J3YXJkTWV0aG9kc1RvV3JhcHBlcihbIHdpbmRvdy5ET01JbXBsZW1lbnRhdGlvbiBdLCBbIFwiY3JlYXRlRG9jdW1lbnRcIiwgXCJjcmVhdGVEb2N1bWVudFR5cGVcIiwgXCJjcmVhdGVIVE1MRG9jdW1lbnRcIiwgXCJoYXNGZWF0dXJlXCIgXSk7XG4gICAgc2NvcGUuYWRvcHROb2RlTm9SZW1vdmUgPSBhZG9wdE5vZGVOb1JlbW92ZTtcbiAgICBzY29wZS53cmFwcGVycy5ET01JbXBsZW1lbnRhdGlvbiA9IERPTUltcGxlbWVudGF0aW9uO1xuICAgIHNjb3BlLndyYXBwZXJzLkRvY3VtZW50ID0gRG9jdW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBFdmVudFRhcmdldCA9IHNjb3BlLndyYXBwZXJzLkV2ZW50VGFyZ2V0O1xuICAgIHZhciBTZWxlY3Rpb24gPSBzY29wZS53cmFwcGVycy5TZWxlY3Rpb247XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgcmVuZGVyQWxsUGVuZGluZyA9IHNjb3BlLnJlbmRlckFsbFBlbmRpbmc7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgdW53cmFwSWZOZWVkZWQgPSBzY29wZS51bndyYXBJZk5lZWRlZDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsV2luZG93ID0gd2luZG93LldpbmRvdztcbiAgICB2YXIgb3JpZ2luYWxHZXRDb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGU7XG4gICAgdmFyIG9yaWdpbmFsR2V0RGVmYXVsdENvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0RGVmYXVsdENvbXB1dGVkU3R5bGU7XG4gICAgdmFyIG9yaWdpbmFsR2V0U2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbjtcbiAgICBmdW5jdGlvbiBXaW5kb3coaW1wbCkge1xuICAgICAgRXZlbnRUYXJnZXQuY2FsbCh0aGlzLCBpbXBsKTtcbiAgICB9XG4gICAgV2luZG93LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZlbnRUYXJnZXQucHJvdG90eXBlKTtcbiAgICBPcmlnaW5hbFdpbmRvdy5wcm90b3R5cGUuZ2V0Q29tcHV0ZWRTdHlsZSA9IGZ1bmN0aW9uKGVsLCBwc2V1ZG8pIHtcbiAgICAgIHJldHVybiB3cmFwKHRoaXMgfHwgd2luZG93KS5nZXRDb21wdXRlZFN0eWxlKHVud3JhcElmTmVlZGVkKGVsKSwgcHNldWRvKTtcbiAgICB9O1xuICAgIGlmIChvcmlnaW5hbEdldERlZmF1bHRDb21wdXRlZFN0eWxlKSB7XG4gICAgICBPcmlnaW5hbFdpbmRvdy5wcm90b3R5cGUuZ2V0RGVmYXVsdENvbXB1dGVkU3R5bGUgPSBmdW5jdGlvbihlbCwgcHNldWRvKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHRoaXMgfHwgd2luZG93KS5nZXREZWZhdWx0Q29tcHV0ZWRTdHlsZSh1bndyYXBJZk5lZWRlZChlbCksIHBzZXVkbyk7XG4gICAgICB9O1xuICAgIH1cbiAgICBPcmlnaW5hbFdpbmRvdy5wcm90b3R5cGUuZ2V0U2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd3JhcCh0aGlzIHx8IHdpbmRvdykuZ2V0U2VsZWN0aW9uKCk7XG4gICAgfTtcbiAgICBkZWxldGUgd2luZG93LmdldENvbXB1dGVkU3R5bGU7XG4gICAgZGVsZXRlIHdpbmRvdy5nZXREZWZhdWx0Q29tcHV0ZWRTdHlsZTtcbiAgICBkZWxldGUgd2luZG93LmdldFNlbGVjdGlvbjtcbiAgICBbIFwiYWRkRXZlbnRMaXN0ZW5lclwiLCBcInJlbW92ZUV2ZW50TGlzdGVuZXJcIiwgXCJkaXNwYXRjaEV2ZW50XCIgXS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIE9yaWdpbmFsV2luZG93LnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdyA9IHdyYXAodGhpcyB8fCB3aW5kb3cpO1xuICAgICAgICByZXR1cm4gd1tuYW1lXS5hcHBseSh3LCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICAgIGRlbGV0ZSB3aW5kb3dbbmFtZV07XG4gICAgfSk7XG4gICAgbWl4aW4oV2luZG93LnByb3RvdHlwZSwge1xuICAgICAgZ2V0Q29tcHV0ZWRTdHlsZTogZnVuY3Rpb24oZWwsIHBzZXVkbykge1xuICAgICAgICByZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICAgIHJldHVybiBvcmlnaW5hbEdldENvbXB1dGVkU3R5bGUuY2FsbCh1bndyYXAodGhpcyksIHVud3JhcElmTmVlZGVkKGVsKSwgcHNldWRvKTtcbiAgICAgIH0sXG4gICAgICBnZXRTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICAgIHJldHVybiBuZXcgU2VsZWN0aW9uKG9yaWdpbmFsR2V0U2VsZWN0aW9uLmNhbGwodW53cmFwKHRoaXMpKSk7XG4gICAgICB9LFxuICAgICAgZ2V0IGRvY3VtZW50KCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuZG9jdW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChvcmlnaW5hbEdldERlZmF1bHRDb21wdXRlZFN0eWxlKSB7XG4gICAgICBXaW5kb3cucHJvdG90eXBlLmdldERlZmF1bHRDb21wdXRlZFN0eWxlID0gZnVuY3Rpb24oZWwsIHBzZXVkbykge1xuICAgICAgICByZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICAgIHJldHVybiBvcmlnaW5hbEdldERlZmF1bHRDb21wdXRlZFN0eWxlLmNhbGwodW53cmFwKHRoaXMpLCB1bndyYXBJZk5lZWRlZChlbCksIHBzZXVkbyk7XG4gICAgICB9O1xuICAgIH1cbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxXaW5kb3csIFdpbmRvdywgd2luZG93KTtcbiAgICBzY29wZS53cmFwcGVycy5XaW5kb3cgPSBXaW5kb3c7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIE9yaWdpbmFsRGF0YVRyYW5zZmVyID0gd2luZG93LkRhdGFUcmFuc2ZlciB8fCB3aW5kb3cuQ2xpcGJvYXJkO1xuICAgIHZhciBPcmlnaW5hbERhdGFUcmFuc2ZlclNldERyYWdJbWFnZSA9IE9yaWdpbmFsRGF0YVRyYW5zZmVyLnByb3RvdHlwZS5zZXREcmFnSW1hZ2U7XG4gICAgaWYgKE9yaWdpbmFsRGF0YVRyYW5zZmVyU2V0RHJhZ0ltYWdlKSB7XG4gICAgICBPcmlnaW5hbERhdGFUcmFuc2Zlci5wcm90b3R5cGUuc2V0RHJhZ0ltYWdlID0gZnVuY3Rpb24oaW1hZ2UsIHgsIHkpIHtcbiAgICAgICAgT3JpZ2luYWxEYXRhVHJhbnNmZXJTZXREcmFnSW1hZ2UuY2FsbCh0aGlzLCB1bndyYXAoaW1hZ2UpLCB4LCB5KTtcbiAgICAgIH07XG4gICAgfVxuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBzZXRXcmFwcGVyID0gc2NvcGUuc2V0V3JhcHBlcjtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciBPcmlnaW5hbEZvcm1EYXRhID0gd2luZG93LkZvcm1EYXRhO1xuICAgIGlmICghT3JpZ2luYWxGb3JtRGF0YSkgcmV0dXJuO1xuICAgIGZ1bmN0aW9uIEZvcm1EYXRhKGZvcm1FbGVtZW50KSB7XG4gICAgICB2YXIgaW1wbDtcbiAgICAgIGlmIChmb3JtRWxlbWVudCBpbnN0YW5jZW9mIE9yaWdpbmFsRm9ybURhdGEpIHtcbiAgICAgICAgaW1wbCA9IGZvcm1FbGVtZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW1wbCA9IG5ldyBPcmlnaW5hbEZvcm1EYXRhKGZvcm1FbGVtZW50ICYmIHVud3JhcChmb3JtRWxlbWVudCkpO1xuICAgICAgfVxuICAgICAgc2V0V3JhcHBlcihpbXBsLCB0aGlzKTtcbiAgICB9XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsRm9ybURhdGEsIEZvcm1EYXRhLCBuZXcgT3JpZ2luYWxGb3JtRGF0YSgpKTtcbiAgICBzY29wZS53cmFwcGVycy5Gb3JtRGF0YSA9IEZvcm1EYXRhO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgdW53cmFwSWZOZWVkZWQgPSBzY29wZS51bndyYXBJZk5lZWRlZDtcbiAgICB2YXIgb3JpZ2luYWxTZW5kID0gWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLnNlbmQ7XG4gICAgWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvcmlnaW5hbFNlbmQuY2FsbCh0aGlzLCB1bndyYXBJZk5lZWRlZChvYmopKTtcbiAgICB9O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgaXNXcmFwcGVyRm9yID0gc2NvcGUuaXNXcmFwcGVyRm9yO1xuICAgIHZhciBlbGVtZW50cyA9IHtcbiAgICAgIGE6IFwiSFRNTEFuY2hvckVsZW1lbnRcIixcbiAgICAgIGFyZWE6IFwiSFRNTEFyZWFFbGVtZW50XCIsXG4gICAgICBhdWRpbzogXCJIVE1MQXVkaW9FbGVtZW50XCIsXG4gICAgICBiYXNlOiBcIkhUTUxCYXNlRWxlbWVudFwiLFxuICAgICAgYm9keTogXCJIVE1MQm9keUVsZW1lbnRcIixcbiAgICAgIGJyOiBcIkhUTUxCUkVsZW1lbnRcIixcbiAgICAgIGJ1dHRvbjogXCJIVE1MQnV0dG9uRWxlbWVudFwiLFxuICAgICAgY2FudmFzOiBcIkhUTUxDYW52YXNFbGVtZW50XCIsXG4gICAgICBjYXB0aW9uOiBcIkhUTUxUYWJsZUNhcHRpb25FbGVtZW50XCIsXG4gICAgICBjb2w6IFwiSFRNTFRhYmxlQ29sRWxlbWVudFwiLFxuICAgICAgY29udGVudDogXCJIVE1MQ29udGVudEVsZW1lbnRcIixcbiAgICAgIGRhdGE6IFwiSFRNTERhdGFFbGVtZW50XCIsXG4gICAgICBkYXRhbGlzdDogXCJIVE1MRGF0YUxpc3RFbGVtZW50XCIsXG4gICAgICBkZWw6IFwiSFRNTE1vZEVsZW1lbnRcIixcbiAgICAgIGRpcjogXCJIVE1MRGlyZWN0b3J5RWxlbWVudFwiLFxuICAgICAgZGl2OiBcIkhUTUxEaXZFbGVtZW50XCIsXG4gICAgICBkbDogXCJIVE1MRExpc3RFbGVtZW50XCIsXG4gICAgICBlbWJlZDogXCJIVE1MRW1iZWRFbGVtZW50XCIsXG4gICAgICBmaWVsZHNldDogXCJIVE1MRmllbGRTZXRFbGVtZW50XCIsXG4gICAgICBmb250OiBcIkhUTUxGb250RWxlbWVudFwiLFxuICAgICAgZm9ybTogXCJIVE1MRm9ybUVsZW1lbnRcIixcbiAgICAgIGZyYW1lOiBcIkhUTUxGcmFtZUVsZW1lbnRcIixcbiAgICAgIGZyYW1lc2V0OiBcIkhUTUxGcmFtZVNldEVsZW1lbnRcIixcbiAgICAgIGgxOiBcIkhUTUxIZWFkaW5nRWxlbWVudFwiLFxuICAgICAgaGVhZDogXCJIVE1MSGVhZEVsZW1lbnRcIixcbiAgICAgIGhyOiBcIkhUTUxIUkVsZW1lbnRcIixcbiAgICAgIGh0bWw6IFwiSFRNTEh0bWxFbGVtZW50XCIsXG4gICAgICBpZnJhbWU6IFwiSFRNTElGcmFtZUVsZW1lbnRcIixcbiAgICAgIGltZzogXCJIVE1MSW1hZ2VFbGVtZW50XCIsXG4gICAgICBpbnB1dDogXCJIVE1MSW5wdXRFbGVtZW50XCIsXG4gICAgICBrZXlnZW46IFwiSFRNTEtleWdlbkVsZW1lbnRcIixcbiAgICAgIGxhYmVsOiBcIkhUTUxMYWJlbEVsZW1lbnRcIixcbiAgICAgIGxlZ2VuZDogXCJIVE1MTGVnZW5kRWxlbWVudFwiLFxuICAgICAgbGk6IFwiSFRNTExJRWxlbWVudFwiLFxuICAgICAgbGluazogXCJIVE1MTGlua0VsZW1lbnRcIixcbiAgICAgIG1hcDogXCJIVE1MTWFwRWxlbWVudFwiLFxuICAgICAgbWFycXVlZTogXCJIVE1MTWFycXVlZUVsZW1lbnRcIixcbiAgICAgIG1lbnU6IFwiSFRNTE1lbnVFbGVtZW50XCIsXG4gICAgICBtZW51aXRlbTogXCJIVE1MTWVudUl0ZW1FbGVtZW50XCIsXG4gICAgICBtZXRhOiBcIkhUTUxNZXRhRWxlbWVudFwiLFxuICAgICAgbWV0ZXI6IFwiSFRNTE1ldGVyRWxlbWVudFwiLFxuICAgICAgb2JqZWN0OiBcIkhUTUxPYmplY3RFbGVtZW50XCIsXG4gICAgICBvbDogXCJIVE1MT0xpc3RFbGVtZW50XCIsXG4gICAgICBvcHRncm91cDogXCJIVE1MT3B0R3JvdXBFbGVtZW50XCIsXG4gICAgICBvcHRpb246IFwiSFRNTE9wdGlvbkVsZW1lbnRcIixcbiAgICAgIG91dHB1dDogXCJIVE1MT3V0cHV0RWxlbWVudFwiLFxuICAgICAgcDogXCJIVE1MUGFyYWdyYXBoRWxlbWVudFwiLFxuICAgICAgcGFyYW06IFwiSFRNTFBhcmFtRWxlbWVudFwiLFxuICAgICAgcHJlOiBcIkhUTUxQcmVFbGVtZW50XCIsXG4gICAgICBwcm9ncmVzczogXCJIVE1MUHJvZ3Jlc3NFbGVtZW50XCIsXG4gICAgICBxOiBcIkhUTUxRdW90ZUVsZW1lbnRcIixcbiAgICAgIHNjcmlwdDogXCJIVE1MU2NyaXB0RWxlbWVudFwiLFxuICAgICAgc2VsZWN0OiBcIkhUTUxTZWxlY3RFbGVtZW50XCIsXG4gICAgICBzaGFkb3c6IFwiSFRNTFNoYWRvd0VsZW1lbnRcIixcbiAgICAgIHNvdXJjZTogXCJIVE1MU291cmNlRWxlbWVudFwiLFxuICAgICAgc3BhbjogXCJIVE1MU3BhbkVsZW1lbnRcIixcbiAgICAgIHN0eWxlOiBcIkhUTUxTdHlsZUVsZW1lbnRcIixcbiAgICAgIHRhYmxlOiBcIkhUTUxUYWJsZUVsZW1lbnRcIixcbiAgICAgIHRib2R5OiBcIkhUTUxUYWJsZVNlY3Rpb25FbGVtZW50XCIsXG4gICAgICB0ZW1wbGF0ZTogXCJIVE1MVGVtcGxhdGVFbGVtZW50XCIsXG4gICAgICB0ZXh0YXJlYTogXCJIVE1MVGV4dEFyZWFFbGVtZW50XCIsXG4gICAgICB0aGVhZDogXCJIVE1MVGFibGVTZWN0aW9uRWxlbWVudFwiLFxuICAgICAgdGltZTogXCJIVE1MVGltZUVsZW1lbnRcIixcbiAgICAgIHRpdGxlOiBcIkhUTUxUaXRsZUVsZW1lbnRcIixcbiAgICAgIHRyOiBcIkhUTUxUYWJsZVJvd0VsZW1lbnRcIixcbiAgICAgIHRyYWNrOiBcIkhUTUxUcmFja0VsZW1lbnRcIixcbiAgICAgIHVsOiBcIkhUTUxVTGlzdEVsZW1lbnRcIixcbiAgICAgIHZpZGVvOiBcIkhUTUxWaWRlb0VsZW1lbnRcIlxuICAgIH07XG4gICAgZnVuY3Rpb24gb3ZlcnJpZGVDb25zdHJ1Y3Rvcih0YWdOYW1lKSB7XG4gICAgICB2YXIgbmF0aXZlQ29uc3RydWN0b3JOYW1lID0gZWxlbWVudHNbdGFnTmFtZV07XG4gICAgICB2YXIgbmF0aXZlQ29uc3RydWN0b3IgPSB3aW5kb3dbbmF0aXZlQ29uc3RydWN0b3JOYW1lXTtcbiAgICAgIGlmICghbmF0aXZlQ29uc3RydWN0b3IpIHJldHVybjtcbiAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbiAgICAgIHZhciB3cmFwcGVyQ29uc3RydWN0b3IgPSBlbGVtZW50LmNvbnN0cnVjdG9yO1xuICAgICAgd2luZG93W25hdGl2ZUNvbnN0cnVjdG9yTmFtZV0gPSB3cmFwcGVyQ29uc3RydWN0b3I7XG4gICAgfVxuICAgIE9iamVjdC5rZXlzKGVsZW1lbnRzKS5mb3JFYWNoKG92ZXJyaWRlQ29uc3RydWN0b3IpO1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHNjb3BlLndyYXBwZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHdpbmRvd1tuYW1lXSA9IHNjb3BlLndyYXBwZXJzW25hbWVdO1xuICAgIH0pO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICB2YXIgU2hhZG93Q1NTID0ge1xuICAgICAgc3RyaWN0U3R5bGluZzogZmFsc2UsXG4gICAgICByZWdpc3RyeToge30sXG4gICAgICBzaGltU3R5bGluZzogZnVuY3Rpb24ocm9vdCwgbmFtZSwgZXh0ZW5kc05hbWUpIHtcbiAgICAgICAgdmFyIHNjb3BlU3R5bGVzID0gdGhpcy5wcmVwYXJlUm9vdChyb290LCBuYW1lLCBleHRlbmRzTmFtZSk7XG4gICAgICAgIHZhciB0eXBlRXh0ZW5zaW9uID0gdGhpcy5pc1R5cGVFeHRlbnNpb24oZXh0ZW5kc05hbWUpO1xuICAgICAgICB2YXIgc2NvcGVTZWxlY3RvciA9IHRoaXMubWFrZVNjb3BlU2VsZWN0b3IobmFtZSwgdHlwZUV4dGVuc2lvbik7XG4gICAgICAgIHZhciBjc3NUZXh0ID0gc3R5bGVzVG9Dc3NUZXh0KHNjb3BlU3R5bGVzLCB0cnVlKTtcbiAgICAgICAgY3NzVGV4dCA9IHRoaXMuc2NvcGVDc3NUZXh0KGNzc1RleHQsIHNjb3BlU2VsZWN0b3IpO1xuICAgICAgICBpZiAocm9vdCkge1xuICAgICAgICAgIHJvb3Quc2hpbW1lZFN0eWxlID0gY3NzVGV4dDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFkZENzc1RvRG9jdW1lbnQoY3NzVGV4dCwgbmFtZSk7XG4gICAgICB9LFxuICAgICAgc2hpbVN0eWxlOiBmdW5jdGlvbihzdHlsZSwgc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2hpbUNzc1RleHQoc3R5bGUudGV4dENvbnRlbnQsIHNlbGVjdG9yKTtcbiAgICAgIH0sXG4gICAgICBzaGltQ3NzVGV4dDogZnVuY3Rpb24oY3NzVGV4dCwgc2VsZWN0b3IpIHtcbiAgICAgICAgY3NzVGV4dCA9IHRoaXMuaW5zZXJ0RGlyZWN0aXZlcyhjc3NUZXh0KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NvcGVDc3NUZXh0KGNzc1RleHQsIHNlbGVjdG9yKTtcbiAgICAgIH0sXG4gICAgICBtYWtlU2NvcGVTZWxlY3RvcjogZnVuY3Rpb24obmFtZSwgdHlwZUV4dGVuc2lvbikge1xuICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgIHJldHVybiB0eXBlRXh0ZW5zaW9uID8gXCJbaXM9XCIgKyBuYW1lICsgXCJdXCIgOiBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfSxcbiAgICAgIGlzVHlwZUV4dGVuc2lvbjogZnVuY3Rpb24oZXh0ZW5kc05hbWUpIHtcbiAgICAgICAgcmV0dXJuIGV4dGVuZHNOYW1lICYmIGV4dGVuZHNOYW1lLmluZGV4T2YoXCItXCIpIDwgMDtcbiAgICAgIH0sXG4gICAgICBwcmVwYXJlUm9vdDogZnVuY3Rpb24ocm9vdCwgbmFtZSwgZXh0ZW5kc05hbWUpIHtcbiAgICAgICAgdmFyIGRlZiA9IHRoaXMucmVnaXN0ZXJSb290KHJvb3QsIG5hbWUsIGV4dGVuZHNOYW1lKTtcbiAgICAgICAgdGhpcy5yZXBsYWNlVGV4dEluU3R5bGVzKGRlZi5yb290U3R5bGVzLCB0aGlzLmluc2VydERpcmVjdGl2ZXMpO1xuICAgICAgICB0aGlzLnJlbW92ZVN0eWxlcyhyb290LCBkZWYucm9vdFN0eWxlcyk7XG4gICAgICAgIGlmICh0aGlzLnN0cmljdFN0eWxpbmcpIHtcbiAgICAgICAgICB0aGlzLmFwcGx5U2NvcGVUb0NvbnRlbnQocm9vdCwgbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZi5zY29wZVN0eWxlcztcbiAgICAgIH0sXG4gICAgICByZW1vdmVTdHlsZXM6IGZ1bmN0aW9uKHJvb3QsIHN0eWxlcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHN0eWxlcy5sZW5ndGgsIHM7IGkgPCBsICYmIChzID0gc3R5bGVzW2ldKTsgaSsrKSB7XG4gICAgICAgICAgcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHMpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcmVnaXN0ZXJSb290OiBmdW5jdGlvbihyb290LCBuYW1lLCBleHRlbmRzTmFtZSkge1xuICAgICAgICB2YXIgZGVmID0gdGhpcy5yZWdpc3RyeVtuYW1lXSA9IHtcbiAgICAgICAgICByb290OiByb290LFxuICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgZXh0ZW5kc05hbWU6IGV4dGVuZHNOYW1lXG4gICAgICAgIH07XG4gICAgICAgIHZhciBzdHlsZXMgPSB0aGlzLmZpbmRTdHlsZXMocm9vdCk7XG4gICAgICAgIGRlZi5yb290U3R5bGVzID0gc3R5bGVzO1xuICAgICAgICBkZWYuc2NvcGVTdHlsZXMgPSBkZWYucm9vdFN0eWxlcztcbiAgICAgICAgdmFyIGV4dGVuZGVlID0gdGhpcy5yZWdpc3RyeVtkZWYuZXh0ZW5kc05hbWVdO1xuICAgICAgICBpZiAoZXh0ZW5kZWUpIHtcbiAgICAgICAgICBkZWYuc2NvcGVTdHlsZXMgPSBleHRlbmRlZS5zY29wZVN0eWxlcy5jb25jYXQoZGVmLnNjb3BlU3R5bGVzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmO1xuICAgICAgfSxcbiAgICAgIGZpbmRTdHlsZXM6IGZ1bmN0aW9uKHJvb3QpIHtcbiAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdHlsZXMgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwoXCJzdHlsZVwiKTtcbiAgICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5maWx0ZXIuY2FsbChzdHlsZXMsIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICByZXR1cm4gIXMuaGFzQXR0cmlidXRlKE5PX1NISU1fQVRUUklCVVRFKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgYXBwbHlTY29wZVRvQ29udGVudDogZnVuY3Rpb24ocm9vdCwgbmFtZSkge1xuICAgICAgICBpZiAocm9vdCkge1xuICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwocm9vdC5xdWVyeVNlbGVjdG9yQWxsKFwiKlwiKSwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUobmFtZSwgXCJcIik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChyb290LnF1ZXJ5U2VsZWN0b3JBbGwoXCJ0ZW1wbGF0ZVwiKSwgZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwbHlTY29wZVRvQ29udGVudCh0ZW1wbGF0ZS5jb250ZW50LCBuYW1lKTtcbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGluc2VydERpcmVjdGl2ZXM6IGZ1bmN0aW9uKGNzc1RleHQpIHtcbiAgICAgICAgY3NzVGV4dCA9IHRoaXMuaW5zZXJ0UG9seWZpbGxEaXJlY3RpdmVzSW5Dc3NUZXh0KGNzc1RleHQpO1xuICAgICAgICByZXR1cm4gdGhpcy5pbnNlcnRQb2x5ZmlsbFJ1bGVzSW5Dc3NUZXh0KGNzc1RleHQpO1xuICAgICAgfSxcbiAgICAgIGluc2VydFBvbHlmaWxsRGlyZWN0aXZlc0luQ3NzVGV4dDogZnVuY3Rpb24oY3NzVGV4dCkge1xuICAgICAgICBjc3NUZXh0ID0gY3NzVGV4dC5yZXBsYWNlKGNzc0NvbW1lbnROZXh0U2VsZWN0b3JSZSwgZnVuY3Rpb24obWF0Y2gsIHAxKSB7XG4gICAgICAgICAgcmV0dXJuIHAxLnNsaWNlKDAsIC0yKSArIFwie1wiO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGNzc1RleHQucmVwbGFjZShjc3NDb250ZW50TmV4dFNlbGVjdG9yUmUsIGZ1bmN0aW9uKG1hdGNoLCBwMSkge1xuICAgICAgICAgIHJldHVybiBwMSArIFwiIHtcIjtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgaW5zZXJ0UG9seWZpbGxSdWxlc0luQ3NzVGV4dDogZnVuY3Rpb24oY3NzVGV4dCkge1xuICAgICAgICBjc3NUZXh0ID0gY3NzVGV4dC5yZXBsYWNlKGNzc0NvbW1lbnRSdWxlUmUsIGZ1bmN0aW9uKG1hdGNoLCBwMSkge1xuICAgICAgICAgIHJldHVybiBwMS5zbGljZSgwLCAtMSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY3NzVGV4dC5yZXBsYWNlKGNzc0NvbnRlbnRSdWxlUmUsIGZ1bmN0aW9uKG1hdGNoLCBwMSwgcDIsIHAzKSB7XG4gICAgICAgICAgdmFyIHJ1bGUgPSBtYXRjaC5yZXBsYWNlKHAxLCBcIlwiKS5yZXBsYWNlKHAyLCBcIlwiKTtcbiAgICAgICAgICByZXR1cm4gcDMgKyBydWxlO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBzY29wZUNzc1RleHQ6IGZ1bmN0aW9uKGNzc1RleHQsIHNjb3BlU2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIHVuc2NvcGVkID0gdGhpcy5leHRyYWN0VW5zY29wZWRSdWxlc0Zyb21Dc3NUZXh0KGNzc1RleHQpO1xuICAgICAgICBjc3NUZXh0ID0gdGhpcy5pbnNlcnRQb2x5ZmlsbEhvc3RJbkNzc1RleHQoY3NzVGV4dCk7XG4gICAgICAgIGNzc1RleHQgPSB0aGlzLmNvbnZlcnRDb2xvbkhvc3QoY3NzVGV4dCk7XG4gICAgICAgIGNzc1RleHQgPSB0aGlzLmNvbnZlcnRDb2xvbkhvc3RDb250ZXh0KGNzc1RleHQpO1xuICAgICAgICBjc3NUZXh0ID0gdGhpcy5jb252ZXJ0U2hhZG93RE9NU2VsZWN0b3JzKGNzc1RleHQpO1xuICAgICAgICBpZiAoc2NvcGVTZWxlY3Rvcikge1xuICAgICAgICAgIHZhciBzZWxmID0gdGhpcywgY3NzVGV4dDtcbiAgICAgICAgICB3aXRoQ3NzUnVsZXMoY3NzVGV4dCwgZnVuY3Rpb24ocnVsZXMpIHtcbiAgICAgICAgICAgIGNzc1RleHQgPSBzZWxmLnNjb3BlUnVsZXMocnVsZXMsIHNjb3BlU2VsZWN0b3IpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNzc1RleHQgPSBjc3NUZXh0ICsgXCJcXG5cIiArIHVuc2NvcGVkO1xuICAgICAgICByZXR1cm4gY3NzVGV4dC50cmltKCk7XG4gICAgICB9LFxuICAgICAgZXh0cmFjdFVuc2NvcGVkUnVsZXNGcm9tQ3NzVGV4dDogZnVuY3Rpb24oY3NzVGV4dCkge1xuICAgICAgICB2YXIgciA9IFwiXCIsIG07XG4gICAgICAgIHdoaWxlIChtID0gY3NzQ29tbWVudFVuc2NvcGVkUnVsZVJlLmV4ZWMoY3NzVGV4dCkpIHtcbiAgICAgICAgICByICs9IG1bMV0uc2xpY2UoMCwgLTEpICsgXCJcXG5cXG5cIjtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAobSA9IGNzc0NvbnRlbnRVbnNjb3BlZFJ1bGVSZS5leGVjKGNzc1RleHQpKSB7XG4gICAgICAgICAgciArPSBtWzBdLnJlcGxhY2UobVsyXSwgXCJcIikucmVwbGFjZShtWzFdLCBtWzNdKSArIFwiXFxuXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHI7XG4gICAgICB9LFxuICAgICAgY29udmVydENvbG9uSG9zdDogZnVuY3Rpb24oY3NzVGV4dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb252ZXJ0Q29sb25SdWxlKGNzc1RleHQsIGNzc0NvbG9uSG9zdFJlLCB0aGlzLmNvbG9uSG9zdFBhcnRSZXBsYWNlcik7XG4gICAgICB9LFxuICAgICAgY29udmVydENvbG9uSG9zdENvbnRleHQ6IGZ1bmN0aW9uKGNzc1RleHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udmVydENvbG9uUnVsZShjc3NUZXh0LCBjc3NDb2xvbkhvc3RDb250ZXh0UmUsIHRoaXMuY29sb25Ib3N0Q29udGV4dFBhcnRSZXBsYWNlcik7XG4gICAgICB9LFxuICAgICAgY29udmVydENvbG9uUnVsZTogZnVuY3Rpb24oY3NzVGV4dCwgcmVnRXhwLCBwYXJ0UmVwbGFjZXIpIHtcbiAgICAgICAgcmV0dXJuIGNzc1RleHQucmVwbGFjZShyZWdFeHAsIGZ1bmN0aW9uKG0sIHAxLCBwMiwgcDMpIHtcbiAgICAgICAgICBwMSA9IHBvbHlmaWxsSG9zdE5vQ29tYmluYXRvcjtcbiAgICAgICAgICBpZiAocDIpIHtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHAyLnNwbGl0KFwiLFwiKSwgciA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJ0cy5sZW5ndGgsIHA7IGkgPCBsICYmIChwID0gcGFydHNbaV0pOyBpKyspIHtcbiAgICAgICAgICAgICAgcCA9IHAudHJpbSgpO1xuICAgICAgICAgICAgICByLnB1c2gocGFydFJlcGxhY2VyKHAxLCBwLCBwMykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHIuam9pbihcIixcIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwMSArIHAzO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgY29sb25Ib3N0Q29udGV4dFBhcnRSZXBsYWNlcjogZnVuY3Rpb24oaG9zdCwgcGFydCwgc3VmZml4KSB7XG4gICAgICAgIGlmIChwYXJ0Lm1hdGNoKHBvbHlmaWxsSG9zdCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jb2xvbkhvc3RQYXJ0UmVwbGFjZXIoaG9zdCwgcGFydCwgc3VmZml4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gaG9zdCArIHBhcnQgKyBzdWZmaXggKyBcIiwgXCIgKyBwYXJ0ICsgXCIgXCIgKyBob3N0ICsgc3VmZml4O1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgY29sb25Ib3N0UGFydFJlcGxhY2VyOiBmdW5jdGlvbihob3N0LCBwYXJ0LCBzdWZmaXgpIHtcbiAgICAgICAgcmV0dXJuIGhvc3QgKyBwYXJ0LnJlcGxhY2UocG9seWZpbGxIb3N0LCBcIlwiKSArIHN1ZmZpeDtcbiAgICAgIH0sXG4gICAgICBjb252ZXJ0U2hhZG93RE9NU2VsZWN0b3JzOiBmdW5jdGlvbihjc3NUZXh0KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2hhZG93RE9NU2VsZWN0b3JzUmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjc3NUZXh0ID0gY3NzVGV4dC5yZXBsYWNlKHNoYWRvd0RPTVNlbGVjdG9yc1JlW2ldLCBcIiBcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNzc1RleHQ7XG4gICAgICB9LFxuICAgICAgc2NvcGVSdWxlczogZnVuY3Rpb24oY3NzUnVsZXMsIHNjb3BlU2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIGNzc1RleHQgPSBcIlwiO1xuICAgICAgICBpZiAoY3NzUnVsZXMpIHtcbiAgICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGNzc1J1bGVzLCBmdW5jdGlvbihydWxlKSB7XG4gICAgICAgICAgICBpZiAocnVsZS5zZWxlY3RvclRleHQgJiYgKHJ1bGUuc3R5bGUgJiYgcnVsZS5zdHlsZS5jc3NUZXh0ICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICAgIGNzc1RleHQgKz0gdGhpcy5zY29wZVNlbGVjdG9yKHJ1bGUuc2VsZWN0b3JUZXh0LCBzY29wZVNlbGVjdG9yLCB0aGlzLnN0cmljdFN0eWxpbmcpICsgXCIge1xcblx0XCI7XG4gICAgICAgICAgICAgIGNzc1RleHQgKz0gdGhpcy5wcm9wZXJ0aWVzRnJvbVJ1bGUocnVsZSkgKyBcIlxcbn1cXG5cXG5cIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocnVsZS50eXBlID09PSBDU1NSdWxlLk1FRElBX1JVTEUpIHtcbiAgICAgICAgICAgICAgY3NzVGV4dCArPSBcIkBtZWRpYSBcIiArIHJ1bGUubWVkaWEubWVkaWFUZXh0ICsgXCIge1xcblwiO1xuICAgICAgICAgICAgICBjc3NUZXh0ICs9IHRoaXMuc2NvcGVSdWxlcyhydWxlLmNzc1J1bGVzLCBzY29wZVNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgY3NzVGV4dCArPSBcIlxcbn1cXG5cXG5cIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHJ1bGUuY3NzVGV4dCkge1xuICAgICAgICAgICAgICAgICAgY3NzVGV4dCArPSBydWxlLmNzc1RleHQgKyBcIlxcblxcblwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBjYXRjaCAoeCkge1xuICAgICAgICAgICAgICAgIGlmIChydWxlLnR5cGUgPT09IENTU1J1bGUuS0VZRlJBTUVTX1JVTEUgJiYgcnVsZS5jc3NSdWxlcykge1xuICAgICAgICAgICAgICAgICAgY3NzVGV4dCArPSB0aGlzLmllU2FmZUNzc1RleHRGcm9tS2V5RnJhbWVSdWxlKHJ1bGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjc3NUZXh0O1xuICAgICAgfSxcbiAgICAgIGllU2FmZUNzc1RleHRGcm9tS2V5RnJhbWVSdWxlOiBmdW5jdGlvbihydWxlKSB7XG4gICAgICAgIHZhciBjc3NUZXh0ID0gXCJAa2V5ZnJhbWVzIFwiICsgcnVsZS5uYW1lICsgXCIge1wiO1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHJ1bGUuY3NzUnVsZXMsIGZ1bmN0aW9uKHJ1bGUpIHtcbiAgICAgICAgICBjc3NUZXh0ICs9IFwiIFwiICsgcnVsZS5rZXlUZXh0ICsgXCIge1wiICsgcnVsZS5zdHlsZS5jc3NUZXh0ICsgXCJ9XCI7XG4gICAgICAgIH0pO1xuICAgICAgICBjc3NUZXh0ICs9IFwiIH1cIjtcbiAgICAgICAgcmV0dXJuIGNzc1RleHQ7XG4gICAgICB9LFxuICAgICAgc2NvcGVTZWxlY3RvcjogZnVuY3Rpb24oc2VsZWN0b3IsIHNjb3BlU2VsZWN0b3IsIHN0cmljdCkge1xuICAgICAgICB2YXIgciA9IFtdLCBwYXJ0cyA9IHNlbGVjdG9yLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgcGFydHMuZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgICAgICAgcCA9IHAudHJpbSgpO1xuICAgICAgICAgIGlmICh0aGlzLnNlbGVjdG9yTmVlZHNTY29waW5nKHAsIHNjb3BlU2VsZWN0b3IpKSB7XG4gICAgICAgICAgICBwID0gc3RyaWN0ICYmICFwLm1hdGNoKHBvbHlmaWxsSG9zdE5vQ29tYmluYXRvcikgPyB0aGlzLmFwcGx5U3RyaWN0U2VsZWN0b3JTY29wZShwLCBzY29wZVNlbGVjdG9yKSA6IHRoaXMuYXBwbHlTZWxlY3RvclNjb3BlKHAsIHNjb3BlU2VsZWN0b3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByLnB1c2gocCk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gci5qb2luKFwiLCBcIik7XG4gICAgICB9LFxuICAgICAgc2VsZWN0b3JOZWVkc1Njb3Bpbmc6IGZ1bmN0aW9uKHNlbGVjdG9yLCBzY29wZVNlbGVjdG9yKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjb3BlU2VsZWN0b3IpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlID0gdGhpcy5tYWtlU2NvcGVNYXRjaGVyKHNjb3BlU2VsZWN0b3IpO1xuICAgICAgICByZXR1cm4gIXNlbGVjdG9yLm1hdGNoKHJlKTtcbiAgICAgIH0sXG4gICAgICBtYWtlU2NvcGVNYXRjaGVyOiBmdW5jdGlvbihzY29wZVNlbGVjdG9yKSB7XG4gICAgICAgIHNjb3BlU2VsZWN0b3IgPSBzY29wZVNlbGVjdG9yLnJlcGxhY2UoL1xcWy9nLCBcIlxcXFxbXCIpLnJlcGxhY2UoL1xcXS9nLCBcIlxcXFxdXCIpO1xuICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChcIl4oXCIgKyBzY29wZVNlbGVjdG9yICsgXCIpXCIgKyBzZWxlY3RvclJlU3VmZml4LCBcIm1cIik7XG4gICAgICB9LFxuICAgICAgYXBwbHlTZWxlY3RvclNjb3BlOiBmdW5jdGlvbihzZWxlY3Rvciwgc2VsZWN0b3JTY29wZSkge1xuICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShzZWxlY3RvclNjb3BlKSA/IHRoaXMuYXBwbHlTZWxlY3RvclNjb3BlTGlzdChzZWxlY3Rvciwgc2VsZWN0b3JTY29wZSkgOiB0aGlzLmFwcGx5U2ltcGxlU2VsZWN0b3JTY29wZShzZWxlY3Rvciwgc2VsZWN0b3JTY29wZSk7XG4gICAgICB9LFxuICAgICAgYXBwbHlTZWxlY3RvclNjb3BlTGlzdDogZnVuY3Rpb24oc2VsZWN0b3IsIHNjb3BlU2VsZWN0b3JMaXN0KSB7XG4gICAgICAgIHZhciByID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBzOyBzID0gc2NvcGVTZWxlY3Rvckxpc3RbaV07IGkrKykge1xuICAgICAgICAgIHIucHVzaCh0aGlzLmFwcGx5U2ltcGxlU2VsZWN0b3JTY29wZShzZWxlY3RvciwgcykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByLmpvaW4oXCIsIFwiKTtcbiAgICAgIH0sXG4gICAgICBhcHBseVNpbXBsZVNlbGVjdG9yU2NvcGU6IGZ1bmN0aW9uKHNlbGVjdG9yLCBzY29wZVNlbGVjdG9yKSB7XG4gICAgICAgIGlmIChzZWxlY3Rvci5tYXRjaChwb2x5ZmlsbEhvc3RSZSkpIHtcbiAgICAgICAgICBzZWxlY3RvciA9IHNlbGVjdG9yLnJlcGxhY2UocG9seWZpbGxIb3N0Tm9Db21iaW5hdG9yLCBzY29wZVNlbGVjdG9yKTtcbiAgICAgICAgICByZXR1cm4gc2VsZWN0b3IucmVwbGFjZShwb2x5ZmlsbEhvc3RSZSwgc2NvcGVTZWxlY3RvciArIFwiIFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc2NvcGVTZWxlY3RvciArIFwiIFwiICsgc2VsZWN0b3I7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBhcHBseVN0cmljdFNlbGVjdG9yU2NvcGU6IGZ1bmN0aW9uKHNlbGVjdG9yLCBzY29wZVNlbGVjdG9yKSB7XG4gICAgICAgIHNjb3BlU2VsZWN0b3IgPSBzY29wZVNlbGVjdG9yLnJlcGxhY2UoL1xcW2lzPShbXlxcXV0qKVxcXS9nLCBcIiQxXCIpO1xuICAgICAgICB2YXIgc3BsaXRzID0gWyBcIiBcIiwgXCI+XCIsIFwiK1wiLCBcIn5cIiBdLCBzY29wZWQgPSBzZWxlY3RvciwgYXR0ck5hbWUgPSBcIltcIiArIHNjb3BlU2VsZWN0b3IgKyBcIl1cIjtcbiAgICAgICAgc3BsaXRzLmZvckVhY2goZnVuY3Rpb24oc2VwKSB7XG4gICAgICAgICAgdmFyIHBhcnRzID0gc2NvcGVkLnNwbGl0KHNlcCk7XG4gICAgICAgICAgc2NvcGVkID0gcGFydHMubWFwKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgICAgIHZhciB0ID0gcC50cmltKCkucmVwbGFjZShwb2x5ZmlsbEhvc3RSZSwgXCJcIik7XG4gICAgICAgICAgICBpZiAodCAmJiBzcGxpdHMuaW5kZXhPZih0KSA8IDAgJiYgdC5pbmRleE9mKGF0dHJOYW1lKSA8IDApIHtcbiAgICAgICAgICAgICAgcCA9IHQucmVwbGFjZSgvKFteOl0qKSg6KikoLiopLywgXCIkMVwiICsgYXR0ck5hbWUgKyBcIiQyJDNcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgICB9KS5qb2luKHNlcCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc2NvcGVkO1xuICAgICAgfSxcbiAgICAgIGluc2VydFBvbHlmaWxsSG9zdEluQ3NzVGV4dDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHNlbGVjdG9yLnJlcGxhY2UoY29sb25Ib3N0Q29udGV4dFJlLCBwb2x5ZmlsbEhvc3RDb250ZXh0KS5yZXBsYWNlKGNvbG9uSG9zdFJlLCBwb2x5ZmlsbEhvc3QpO1xuICAgICAgfSxcbiAgICAgIHByb3BlcnRpZXNGcm9tUnVsZTogZnVuY3Rpb24ocnVsZSkge1xuICAgICAgICB2YXIgY3NzVGV4dCA9IHJ1bGUuc3R5bGUuY3NzVGV4dDtcbiAgICAgICAgaWYgKHJ1bGUuc3R5bGUuY29udGVudCAmJiAhcnVsZS5zdHlsZS5jb250ZW50Lm1hdGNoKC9bJ1wiXSt8YXR0ci8pKSB7XG4gICAgICAgICAgY3NzVGV4dCA9IGNzc1RleHQucmVwbGFjZSgvY29udGVudDpbXjtdKjsvZywgXCJjb250ZW50OiAnXCIgKyBydWxlLnN0eWxlLmNvbnRlbnQgKyBcIic7XCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdHlsZSA9IHJ1bGUuc3R5bGU7XG4gICAgICAgIGZvciAodmFyIGkgaW4gc3R5bGUpIHtcbiAgICAgICAgICBpZiAoc3R5bGVbaV0gPT09IFwiaW5pdGlhbFwiKSB7XG4gICAgICAgICAgICBjc3NUZXh0ICs9IGkgKyBcIjogaW5pdGlhbDsgXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjc3NUZXh0O1xuICAgICAgfSxcbiAgICAgIHJlcGxhY2VUZXh0SW5TdHlsZXM6IGZ1bmN0aW9uKHN0eWxlcywgYWN0aW9uKSB7XG4gICAgICAgIGlmIChzdHlsZXMgJiYgYWN0aW9uKSB7XG4gICAgICAgICAgaWYgKCEoc3R5bGVzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICBzdHlsZXMgPSBbIHN0eWxlcyBdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHN0eWxlcywgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgcy50ZXh0Q29udGVudCA9IGFjdGlvbi5jYWxsKHRoaXMsIHMudGV4dENvbnRlbnQpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgYWRkQ3NzVG9Eb2N1bWVudDogZnVuY3Rpb24oY3NzVGV4dCwgbmFtZSkge1xuICAgICAgICBpZiAoY3NzVGV4dC5tYXRjaChcIkBpbXBvcnRcIikpIHtcbiAgICAgICAgICBhZGRPd25TaGVldChjc3NUZXh0LCBuYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhZGRDc3NUb0RvY3VtZW50KGNzc1RleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgc2VsZWN0b3JSZSA9IC8oW157XSopKHtbXFxzXFxTXSo/fSkvZ2ltLCBjc3NDb21tZW50UmUgPSAvXFwvXFwqW14qXSpcXCorKFteXFwvKl1bXipdKlxcKispKlxcLy9naW0sIGNzc0NvbW1lbnROZXh0U2VsZWN0b3JSZSA9IC9cXC9cXCpcXHMqQHBvbHlmaWxsIChbXipdKlxcKisoW15cXC8qXVteKl0qXFwqKykqXFwvKShbXntdKj8pey9naW0sIGNzc0NvbnRlbnROZXh0U2VsZWN0b3JSZSA9IC9wb2x5ZmlsbC1uZXh0LXNlbGVjdG9yW159XSpjb250ZW50XFw6W1xcc10qP1snXCJdKC4qPylbJ1wiXVs7XFxzXSp9KFtee10qPyl7L2dpbSwgY3NzQ29tbWVudFJ1bGVSZSA9IC9cXC9cXCpcXHNAcG9seWZpbGwtcnVsZShbXipdKlxcKisoW15cXC8qXVteKl0qXFwqKykqKVxcLy9naW0sIGNzc0NvbnRlbnRSdWxlUmUgPSAvKHBvbHlmaWxsLXJ1bGUpW159XSooY29udGVudFxcOltcXHNdKlsnXCJdKC4qPylbJ1wiXSlbO1xcc10qW159XSp9L2dpbSwgY3NzQ29tbWVudFVuc2NvcGVkUnVsZVJlID0gL1xcL1xcKlxcc0Bwb2x5ZmlsbC11bnNjb3BlZC1ydWxlKFteKl0qXFwqKyhbXlxcLypdW14qXSpcXCorKSopXFwvL2dpbSwgY3NzQ29udGVudFVuc2NvcGVkUnVsZVJlID0gLyhwb2x5ZmlsbC11bnNjb3BlZC1ydWxlKVtefV0qKGNvbnRlbnRcXDpbXFxzXSpbJ1wiXSguKj8pWydcIl0pWztcXHNdKltefV0qfS9naW0sIGNzc1BzZXVkb1JlID0gLzo6KHgtW15cXHN7LChdKikvZ2ltLCBjc3NQYXJ0UmUgPSAvOjpwYXJ0XFwoKFteKV0qKVxcKS9naW0sIHBvbHlmaWxsSG9zdCA9IFwiLXNoYWRvd2Nzc2hvc3RcIiwgcG9seWZpbGxIb3N0Q29udGV4dCA9IFwiLXNoYWRvd2Nzc2NvbnRleHRcIiwgcGFyZW5TdWZmaXggPSBcIikoPzpcXFxcKChcIiArIFwiKD86XFxcXChbXikoXSpcXFxcKXxbXikoXSopKz9cIiArIFwiKVxcXFwpKT8oW14se10qKVwiO1xuICAgIHZhciBjc3NDb2xvbkhvc3RSZSA9IG5ldyBSZWdFeHAoXCIoXCIgKyBwb2x5ZmlsbEhvc3QgKyBwYXJlblN1ZmZpeCwgXCJnaW1cIiksIGNzc0NvbG9uSG9zdENvbnRleHRSZSA9IG5ldyBSZWdFeHAoXCIoXCIgKyBwb2x5ZmlsbEhvc3RDb250ZXh0ICsgcGFyZW5TdWZmaXgsIFwiZ2ltXCIpLCBzZWxlY3RvclJlU3VmZml4ID0gXCIoWz5cXFxcc34rWy4sezpdW1xcXFxzXFxcXFNdKik/JFwiLCBjb2xvbkhvc3RSZSA9IC9cXDpob3N0L2dpbSwgY29sb25Ib3N0Q29udGV4dFJlID0gL1xcOmhvc3QtY29udGV4dC9naW0sIHBvbHlmaWxsSG9zdE5vQ29tYmluYXRvciA9IHBvbHlmaWxsSG9zdCArIFwiLW5vLWNvbWJpbmF0b3JcIiwgcG9seWZpbGxIb3N0UmUgPSBuZXcgUmVnRXhwKHBvbHlmaWxsSG9zdCwgXCJnaW1cIiksIHBvbHlmaWxsSG9zdENvbnRleHRSZSA9IG5ldyBSZWdFeHAocG9seWZpbGxIb3N0Q29udGV4dCwgXCJnaW1cIiksIHNoYWRvd0RPTVNlbGVjdG9yc1JlID0gWyAvPj4+L2csIC86OnNoYWRvdy9nLCAvOjpjb250ZW50L2csIC9cXC9kZWVwXFwvL2csIC9cXC9zaGFkb3dcXC8vZywgL1xcL3NoYWRvdy1kZWVwXFwvL2csIC9cXF5cXF4vZywgL1xcXi9nIF07XG4gICAgZnVuY3Rpb24gc3R5bGVzVG9Dc3NUZXh0KHN0eWxlcywgcHJlc2VydmVDb21tZW50cykge1xuICAgICAgdmFyIGNzc1RleHQgPSBcIlwiO1xuICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChzdHlsZXMsIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgY3NzVGV4dCArPSBzLnRleHRDb250ZW50ICsgXCJcXG5cXG5cIjtcbiAgICAgIH0pO1xuICAgICAgaWYgKCFwcmVzZXJ2ZUNvbW1lbnRzKSB7XG4gICAgICAgIGNzc1RleHQgPSBjc3NUZXh0LnJlcGxhY2UoY3NzQ29tbWVudFJlLCBcIlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjc3NUZXh0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBjc3NUZXh0VG9TdHlsZShjc3NUZXh0KSB7XG4gICAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICBzdHlsZS50ZXh0Q29udGVudCA9IGNzc1RleHQ7XG4gICAgICByZXR1cm4gc3R5bGU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNzc1RvUnVsZXMoY3NzVGV4dCkge1xuICAgICAgdmFyIHN0eWxlID0gY3NzVGV4dFRvU3R5bGUoY3NzVGV4dCk7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICAgIHZhciBydWxlcyA9IFtdO1xuICAgICAgaWYgKHN0eWxlLnNoZWV0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcnVsZXMgPSBzdHlsZS5zaGVldC5jc3NSdWxlcztcbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcInNoZWV0IG5vdCBmb3VuZFwiLCBzdHlsZSk7XG4gICAgICB9XG4gICAgICBzdHlsZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHN0eWxlKTtcbiAgICAgIHJldHVybiBydWxlcztcbiAgICB9XG4gICAgdmFyIGZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcbiAgICBmcmFtZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgZnVuY3Rpb24gaW5pdEZyYW1lKCkge1xuICAgICAgZnJhbWUuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmcmFtZSk7XG4gICAgICB2YXIgZG9jID0gZnJhbWUuY29udGVudERvY3VtZW50O1xuICAgICAgdmFyIGJhc2UgPSBkb2MuY3JlYXRlRWxlbWVudChcImJhc2VcIik7XG4gICAgICBiYXNlLmhyZWYgPSBkb2N1bWVudC5iYXNlVVJJO1xuICAgICAgZG9jLmhlYWQuYXBwZW5kQ2hpbGQoYmFzZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGluRnJhbWUoZm4pIHtcbiAgICAgIGlmICghZnJhbWUuaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgaW5pdEZyYW1lKCk7XG4gICAgICB9XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGZyYW1lKTtcbiAgICAgIGZuKGZyYW1lLmNvbnRlbnREb2N1bWVudCk7XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGZyYW1lKTtcbiAgICB9XG4gICAgdmFyIGlzQ2hyb21lID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaChcIkNocm9tZVwiKTtcbiAgICBmdW5jdGlvbiB3aXRoQ3NzUnVsZXMoY3NzVGV4dCwgY2FsbGJhY2spIHtcbiAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIHJ1bGVzO1xuICAgICAgaWYgKGNzc1RleHQubWF0Y2goXCJAaW1wb3J0XCIpICYmIGlzQ2hyb21lKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IGNzc1RleHRUb1N0eWxlKGNzc1RleHQpO1xuICAgICAgICBpbkZyYW1lKGZ1bmN0aW9uKGRvYykge1xuICAgICAgICAgIGRvYy5oZWFkLmFwcGVuZENoaWxkKHN0eWxlLmltcGwpO1xuICAgICAgICAgIHJ1bGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoc3R5bGUuc2hlZXQuY3NzUnVsZXMsIDApO1xuICAgICAgICAgIGNhbGxiYWNrKHJ1bGVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBydWxlcyA9IGNzc1RvUnVsZXMoY3NzVGV4dCk7XG4gICAgICAgIGNhbGxiYWNrKHJ1bGVzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcnVsZXNUb0Nzcyhjc3NSdWxlcykge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGNzcyA9IFtdOyBpIDwgY3NzUnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3NzLnB1c2goY3NzUnVsZXNbaV0uY3NzVGV4dCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3NzLmpvaW4oXCJcXG5cXG5cIik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZENzc1RvRG9jdW1lbnQoY3NzVGV4dCkge1xuICAgICAgaWYgKGNzc1RleHQpIHtcbiAgICAgICAgZ2V0U2hlZXQoKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3NUZXh0KSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZE93blNoZWV0KGNzc1RleHQsIG5hbWUpIHtcbiAgICAgIHZhciBzdHlsZSA9IGNzc1RleHRUb1N0eWxlKGNzc1RleHQpO1xuICAgICAgc3R5bGUuc2V0QXR0cmlidXRlKG5hbWUsIFwiXCIpO1xuICAgICAgc3R5bGUuc2V0QXR0cmlidXRlKFNISU1NRURfQVRUUklCVVRFLCBcIlwiKTtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgIH1cbiAgICB2YXIgU0hJTV9BVFRSSUJVVEUgPSBcInNoaW0tc2hhZG93ZG9tXCI7XG4gICAgdmFyIFNISU1NRURfQVRUUklCVVRFID0gXCJzaGltLXNoYWRvd2RvbS1jc3NcIjtcbiAgICB2YXIgTk9fU0hJTV9BVFRSSUJVVEUgPSBcIm5vLXNoaW1cIjtcbiAgICB2YXIgc2hlZXQ7XG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoKSB7XG4gICAgICBpZiAoIXNoZWV0KSB7XG4gICAgICAgIHNoZWV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgICAgICBzaGVldC5zZXRBdHRyaWJ1dGUoU0hJTU1FRF9BVFRSSUJVVEUsIFwiXCIpO1xuICAgICAgICBzaGVldFtTSElNTUVEX0FUVFJJQlVURV0gPSB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNoZWV0O1xuICAgIH1cbiAgICBpZiAod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKSB7XG4gICAgICBhZGRDc3NUb0RvY3VtZW50KFwic3R5bGUgeyBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH1cXG5cIik7XG4gICAgICB2YXIgZG9jID0gU2hhZG93RE9NUG9seWZpbGwud3JhcChkb2N1bWVudCk7XG4gICAgICB2YXIgaGVhZCA9IGRvYy5xdWVyeVNlbGVjdG9yKFwiaGVhZFwiKTtcbiAgICAgIGhlYWQuaW5zZXJ0QmVmb3JlKGdldFNoZWV0KCksIGhlYWQuY2hpbGROb2Rlc1swXSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHVybFJlc29sdmVyID0gc2NvcGUudXJsUmVzb2x2ZXI7XG4gICAgICAgIGlmICh3aW5kb3cuSFRNTEltcG9ydHMgJiYgIUhUTUxJbXBvcnRzLnVzZU5hdGl2ZSkge1xuICAgICAgICAgIHZhciBTSElNX1NIRUVUX1NFTEVDVE9SID0gXCJsaW5rW3JlbD1zdHlsZXNoZWV0XVwiICsgXCJbXCIgKyBTSElNX0FUVFJJQlVURSArIFwiXVwiO1xuICAgICAgICAgIHZhciBTSElNX1NUWUxFX1NFTEVDVE9SID0gXCJzdHlsZVtcIiArIFNISU1fQVRUUklCVVRFICsgXCJdXCI7XG4gICAgICAgICAgSFRNTEltcG9ydHMuaW1wb3J0ZXIuZG9jdW1lbnRQcmVsb2FkU2VsZWN0b3JzICs9IFwiLFwiICsgU0hJTV9TSEVFVF9TRUxFQ1RPUjtcbiAgICAgICAgICBIVE1MSW1wb3J0cy5pbXBvcnRlci5pbXBvcnRzUHJlbG9hZFNlbGVjdG9ycyArPSBcIixcIiArIFNISU1fU0hFRVRfU0VMRUNUT1I7XG4gICAgICAgICAgSFRNTEltcG9ydHMucGFyc2VyLmRvY3VtZW50U2VsZWN0b3JzID0gWyBIVE1MSW1wb3J0cy5wYXJzZXIuZG9jdW1lbnRTZWxlY3RvcnMsIFNISU1fU0hFRVRfU0VMRUNUT1IsIFNISU1fU1RZTEVfU0VMRUNUT1IgXS5qb2luKFwiLFwiKTtcbiAgICAgICAgICB2YXIgb3JpZ2luYWxQYXJzZUdlbmVyaWMgPSBIVE1MSW1wb3J0cy5wYXJzZXIucGFyc2VHZW5lcmljO1xuICAgICAgICAgIEhUTUxJbXBvcnRzLnBhcnNlci5wYXJzZUdlbmVyaWMgPSBmdW5jdGlvbihlbHQpIHtcbiAgICAgICAgICAgIGlmIChlbHRbU0hJTU1FRF9BVFRSSUJVVEVdKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzdHlsZSA9IGVsdC5fX2ltcG9ydEVsZW1lbnQgfHwgZWx0O1xuICAgICAgICAgICAgaWYgKCFzdHlsZS5oYXNBdHRyaWJ1dGUoU0hJTV9BVFRSSUJVVEUpKSB7XG4gICAgICAgICAgICAgIG9yaWdpbmFsUGFyc2VHZW5lcmljLmNhbGwodGhpcywgZWx0KTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsdC5fX3Jlc291cmNlKSB7XG4gICAgICAgICAgICAgIHN0eWxlID0gZWx0Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgICAgICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IGVsdC5fX3Jlc291cmNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgSFRNTEltcG9ydHMucGF0aC5yZXNvbHZlVXJsc0luU3R5bGUoc3R5bGUsIGVsdC5ocmVmKTtcbiAgICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gU2hhZG93Q1NTLnNoaW1TdHlsZShzdHlsZSk7XG4gICAgICAgICAgICBzdHlsZS5yZW1vdmVBdHRyaWJ1dGUoU0hJTV9BVFRSSUJVVEUsIFwiXCIpO1xuICAgICAgICAgICAgc3R5bGUuc2V0QXR0cmlidXRlKFNISU1NRURfQVRUUklCVVRFLCBcIlwiKTtcbiAgICAgICAgICAgIHN0eWxlW1NISU1NRURfQVRUUklCVVRFXSA9IHRydWU7XG4gICAgICAgICAgICBpZiAoc3R5bGUucGFyZW50Tm9kZSAhPT0gaGVhZCkge1xuICAgICAgICAgICAgICBpZiAoZWx0LnBhcmVudE5vZGUgPT09IGhlYWQpIHtcbiAgICAgICAgICAgICAgICBoZWFkLnJlcGxhY2VDaGlsZChzdHlsZSwgZWx0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0RvY3VtZW50KHN0eWxlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3R5bGUuX19pbXBvcnRQYXJzZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5tYXJrUGFyc2luZ0NvbXBsZXRlKGVsdCk7XG4gICAgICAgICAgICB0aGlzLnBhcnNlTmV4dCgpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgdmFyIGhhc1Jlc291cmNlID0gSFRNTEltcG9ydHMucGFyc2VyLmhhc1Jlc291cmNlO1xuICAgICAgICAgIEhUTUxJbXBvcnRzLnBhcnNlci5oYXNSZXNvdXJjZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChub2RlLmxvY2FsTmFtZSA9PT0gXCJsaW5rXCIgJiYgbm9kZS5yZWwgPT09IFwic3R5bGVzaGVldFwiICYmIG5vZGUuaGFzQXR0cmlidXRlKFNISU1fQVRUUklCVVRFKSkge1xuICAgICAgICAgICAgICByZXR1cm4gbm9kZS5fX3Jlc291cmNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGhhc1Jlc291cmNlLmNhbGwodGhpcywgbm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIHNjb3BlLlNoYWRvd0NTUyA9IFNoYWRvd0NTUztcbiAgfSkod2luZG93LldlYkNvbXBvbmVudHMpO1xufVxuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgaWYgKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCkge1xuICAgIHdpbmRvdy53cmFwID0gU2hhZG93RE9NUG9seWZpbGwud3JhcElmTmVlZGVkO1xuICAgIHdpbmRvdy51bndyYXAgPSBTaGFkb3dET01Qb2x5ZmlsbC51bndyYXBJZk5lZWRlZDtcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cud3JhcCA9IHdpbmRvdy51bndyYXAgPSBmdW5jdGlvbihuKSB7XG4gICAgICByZXR1cm4gbjtcbiAgICB9O1xuICB9XG59KSh3aW5kb3cuV2ViQ29tcG9uZW50cyk7XG5cbihmdW5jdGlvbihzY29wZSkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIGhhc1dvcmtpbmdVcmwgPSBmYWxzZTtcbiAgaWYgKCFzY29wZS5mb3JjZUpVUkwpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHUgPSBuZXcgVVJMKFwiYlwiLCBcImh0dHA6Ly9hXCIpO1xuICAgICAgdS5wYXRobmFtZSA9IFwiYyUyMGRcIjtcbiAgICAgIGhhc1dvcmtpbmdVcmwgPSB1LmhyZWYgPT09IFwiaHR0cDovL2EvYyUyMGRcIjtcbiAgICB9IGNhdGNoIChlKSB7fVxuICB9XG4gIGlmIChoYXNXb3JraW5nVXJsKSByZXR1cm47XG4gIHZhciByZWxhdGl2ZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHJlbGF0aXZlW1wiZnRwXCJdID0gMjE7XG4gIHJlbGF0aXZlW1wiZmlsZVwiXSA9IDA7XG4gIHJlbGF0aXZlW1wiZ29waGVyXCJdID0gNzA7XG4gIHJlbGF0aXZlW1wiaHR0cFwiXSA9IDgwO1xuICByZWxhdGl2ZVtcImh0dHBzXCJdID0gNDQzO1xuICByZWxhdGl2ZVtcIndzXCJdID0gODA7XG4gIHJlbGF0aXZlW1wid3NzXCJdID0gNDQzO1xuICB2YXIgcmVsYXRpdmVQYXRoRG90TWFwcGluZyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHJlbGF0aXZlUGF0aERvdE1hcHBpbmdbXCIlMmVcIl0gPSBcIi5cIjtcbiAgcmVsYXRpdmVQYXRoRG90TWFwcGluZ1tcIi4lMmVcIl0gPSBcIi4uXCI7XG4gIHJlbGF0aXZlUGF0aERvdE1hcHBpbmdbXCIlMmUuXCJdID0gXCIuLlwiO1xuICByZWxhdGl2ZVBhdGhEb3RNYXBwaW5nW1wiJTJlJTJlXCJdID0gXCIuLlwiO1xuICBmdW5jdGlvbiBpc1JlbGF0aXZlU2NoZW1lKHNjaGVtZSkge1xuICAgIHJldHVybiByZWxhdGl2ZVtzY2hlbWVdICE9PSB1bmRlZmluZWQ7XG4gIH1cbiAgZnVuY3Rpb24gaW52YWxpZCgpIHtcbiAgICBjbGVhci5jYWxsKHRoaXMpO1xuICAgIHRoaXMuX2lzSW52YWxpZCA9IHRydWU7XG4gIH1cbiAgZnVuY3Rpb24gSUROQVRvQVNDSUkoaCkge1xuICAgIGlmIChcIlwiID09IGgpIHtcbiAgICAgIGludmFsaWQuY2FsbCh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIGgudG9Mb3dlckNhc2UoKTtcbiAgfVxuICBmdW5jdGlvbiBwZXJjZW50RXNjYXBlKGMpIHtcbiAgICB2YXIgdW5pY29kZSA9IGMuY2hhckNvZGVBdCgwKTtcbiAgICBpZiAodW5pY29kZSA+IDMyICYmIHVuaWNvZGUgPCAxMjcgJiYgWyAzNCwgMzUsIDYwLCA2MiwgNjMsIDk2IF0uaW5kZXhPZih1bmljb2RlKSA9PSAtMSkge1xuICAgICAgcmV0dXJuIGM7XG4gICAgfVxuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoYyk7XG4gIH1cbiAgZnVuY3Rpb24gcGVyY2VudEVzY2FwZVF1ZXJ5KGMpIHtcbiAgICB2YXIgdW5pY29kZSA9IGMuY2hhckNvZGVBdCgwKTtcbiAgICBpZiAodW5pY29kZSA+IDMyICYmIHVuaWNvZGUgPCAxMjcgJiYgWyAzNCwgMzUsIDYwLCA2MiwgOTYgXS5pbmRleE9mKHVuaWNvZGUpID09IC0xKSB7XG4gICAgICByZXR1cm4gYztcbiAgICB9XG4gICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChjKTtcbiAgfVxuICB2YXIgRU9GID0gdW5kZWZpbmVkLCBBTFBIQSA9IC9bYS16QS1aXS8sIEFMUEhBTlVNRVJJQyA9IC9bYS16QS1aMC05XFwrXFwtXFwuXS87XG4gIGZ1bmN0aW9uIHBhcnNlKGlucHV0LCBzdGF0ZU92ZXJyaWRlLCBiYXNlKSB7XG4gICAgZnVuY3Rpb24gZXJyKG1lc3NhZ2UpIHtcbiAgICAgIGVycm9ycy5wdXNoKG1lc3NhZ2UpO1xuICAgIH1cbiAgICB2YXIgc3RhdGUgPSBzdGF0ZU92ZXJyaWRlIHx8IFwic2NoZW1lIHN0YXJ0XCIsIGN1cnNvciA9IDAsIGJ1ZmZlciA9IFwiXCIsIHNlZW5BdCA9IGZhbHNlLCBzZWVuQnJhY2tldCA9IGZhbHNlLCBlcnJvcnMgPSBbXTtcbiAgICBsb29wOiB3aGlsZSAoKGlucHV0W2N1cnNvciAtIDFdICE9IEVPRiB8fCBjdXJzb3IgPT0gMCkgJiYgIXRoaXMuX2lzSW52YWxpZCkge1xuICAgICAgdmFyIGMgPSBpbnB1dFtjdXJzb3JdO1xuICAgICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgIGNhc2UgXCJzY2hlbWUgc3RhcnRcIjpcbiAgICAgICAgaWYgKGMgJiYgQUxQSEEudGVzdChjKSkge1xuICAgICAgICAgIGJ1ZmZlciArPSBjLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgc3RhdGUgPSBcInNjaGVtZVwiO1xuICAgICAgICB9IGVsc2UgaWYgKCFzdGF0ZU92ZXJyaWRlKSB7XG4gICAgICAgICAgYnVmZmVyID0gXCJcIjtcbiAgICAgICAgICBzdGF0ZSA9IFwibm8gc2NoZW1lXCI7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyKFwiSW52YWxpZCBzY2hlbWUuXCIpO1xuICAgICAgICAgIGJyZWFrIGxvb3A7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwic2NoZW1lXCI6XG4gICAgICAgIGlmIChjICYmIEFMUEhBTlVNRVJJQy50ZXN0KGMpKSB7XG4gICAgICAgICAgYnVmZmVyICs9IGMudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfSBlbHNlIGlmIChcIjpcIiA9PSBjKSB7XG4gICAgICAgICAgdGhpcy5fc2NoZW1lID0gYnVmZmVyO1xuICAgICAgICAgIGJ1ZmZlciA9IFwiXCI7XG4gICAgICAgICAgaWYgKHN0YXRlT3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIGJyZWFrIGxvb3A7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc1JlbGF0aXZlU2NoZW1lKHRoaXMuX3NjaGVtZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2lzUmVsYXRpdmUgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoXCJmaWxlXCIgPT0gdGhpcy5fc2NoZW1lKSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmVcIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2lzUmVsYXRpdmUgJiYgYmFzZSAmJiBiYXNlLl9zY2hlbWUgPT0gdGhpcy5fc2NoZW1lKSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmUgb3IgYXV0aG9yaXR5XCI7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9pc1JlbGF0aXZlKSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFwiYXV0aG9yaXR5IGZpcnN0IHNsYXNoXCI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlID0gXCJzY2hlbWUgZGF0YVwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghc3RhdGVPdmVycmlkZSkge1xuICAgICAgICAgIGJ1ZmZlciA9IFwiXCI7XG4gICAgICAgICAgY3Vyc29yID0gMDtcbiAgICAgICAgICBzdGF0ZSA9IFwibm8gc2NoZW1lXCI7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSBpZiAoRU9GID09IGMpIHtcbiAgICAgICAgICBicmVhayBsb29wO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVycihcIkNvZGUgcG9pbnQgbm90IGFsbG93ZWQgaW4gc2NoZW1lOiBcIiArIGMpO1xuICAgICAgICAgIGJyZWFrIGxvb3A7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwic2NoZW1lIGRhdGFcIjpcbiAgICAgICAgaWYgKFwiP1wiID09IGMpIHtcbiAgICAgICAgICB0aGlzLl9xdWVyeSA9IFwiP1wiO1xuICAgICAgICAgIHN0YXRlID0gXCJxdWVyeVwiO1xuICAgICAgICB9IGVsc2UgaWYgKFwiI1wiID09IGMpIHtcbiAgICAgICAgICB0aGlzLl9mcmFnbWVudCA9IFwiI1wiO1xuICAgICAgICAgIHN0YXRlID0gXCJmcmFnbWVudFwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChFT0YgIT0gYyAmJiBcIlx0XCIgIT0gYyAmJiBcIlxcblwiICE9IGMgJiYgXCJcXHJcIiAhPSBjKSB7XG4gICAgICAgICAgICB0aGlzLl9zY2hlbWVEYXRhICs9IHBlcmNlbnRFc2NhcGUoYyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcIm5vIHNjaGVtZVwiOlxuICAgICAgICBpZiAoIWJhc2UgfHwgIWlzUmVsYXRpdmVTY2hlbWUoYmFzZS5fc2NoZW1lKSkge1xuICAgICAgICAgIGVycihcIk1pc3Npbmcgc2NoZW1lLlwiKTtcbiAgICAgICAgICBpbnZhbGlkLmNhbGwodGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlXCI7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwicmVsYXRpdmUgb3IgYXV0aG9yaXR5XCI6XG4gICAgICAgIGlmIChcIi9cIiA9PSBjICYmIFwiL1wiID09IGlucHV0W2N1cnNvciArIDFdKSB7XG4gICAgICAgICAgc3RhdGUgPSBcImF1dGhvcml0eSBpZ25vcmUgc2xhc2hlc1wiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVycihcIkV4cGVjdGVkIC8sIGdvdDogXCIgKyBjKTtcbiAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmVcIjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJyZWxhdGl2ZVwiOlxuICAgICAgICB0aGlzLl9pc1JlbGF0aXZlID0gdHJ1ZTtcbiAgICAgICAgaWYgKFwiZmlsZVwiICE9IHRoaXMuX3NjaGVtZSkgdGhpcy5fc2NoZW1lID0gYmFzZS5fc2NoZW1lO1xuICAgICAgICBpZiAoRU9GID09IGMpIHtcbiAgICAgICAgICB0aGlzLl9ob3N0ID0gYmFzZS5faG9zdDtcbiAgICAgICAgICB0aGlzLl9wb3J0ID0gYmFzZS5fcG9ydDtcbiAgICAgICAgICB0aGlzLl9wYXRoID0gYmFzZS5fcGF0aC5zbGljZSgpO1xuICAgICAgICAgIHRoaXMuX3F1ZXJ5ID0gYmFzZS5fcXVlcnk7XG4gICAgICAgICAgdGhpcy5fdXNlcm5hbWUgPSBiYXNlLl91c2VybmFtZTtcbiAgICAgICAgICB0aGlzLl9wYXNzd29yZCA9IGJhc2UuX3Bhc3N3b3JkO1xuICAgICAgICAgIGJyZWFrIGxvb3A7XG4gICAgICAgIH0gZWxzZSBpZiAoXCIvXCIgPT0gYyB8fCBcIlxcXFxcIiA9PSBjKSB7XG4gICAgICAgICAgaWYgKFwiXFxcXFwiID09IGMpIGVycihcIlxcXFwgaXMgYW4gaW52YWxpZCBjb2RlIHBvaW50LlwiKTtcbiAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmUgc2xhc2hcIjtcbiAgICAgICAgfSBlbHNlIGlmIChcIj9cIiA9PSBjKSB7XG4gICAgICAgICAgdGhpcy5faG9zdCA9IGJhc2UuX2hvc3Q7XG4gICAgICAgICAgdGhpcy5fcG9ydCA9IGJhc2UuX3BvcnQ7XG4gICAgICAgICAgdGhpcy5fcGF0aCA9IGJhc2UuX3BhdGguc2xpY2UoKTtcbiAgICAgICAgICB0aGlzLl9xdWVyeSA9IFwiP1wiO1xuICAgICAgICAgIHRoaXMuX3VzZXJuYW1lID0gYmFzZS5fdXNlcm5hbWU7XG4gICAgICAgICAgdGhpcy5fcGFzc3dvcmQgPSBiYXNlLl9wYXNzd29yZDtcbiAgICAgICAgICBzdGF0ZSA9IFwicXVlcnlcIjtcbiAgICAgICAgfSBlbHNlIGlmIChcIiNcIiA9PSBjKSB7XG4gICAgICAgICAgdGhpcy5faG9zdCA9IGJhc2UuX2hvc3Q7XG4gICAgICAgICAgdGhpcy5fcG9ydCA9IGJhc2UuX3BvcnQ7XG4gICAgICAgICAgdGhpcy5fcGF0aCA9IGJhc2UuX3BhdGguc2xpY2UoKTtcbiAgICAgICAgICB0aGlzLl9xdWVyeSA9IGJhc2UuX3F1ZXJ5O1xuICAgICAgICAgIHRoaXMuX2ZyYWdtZW50ID0gXCIjXCI7XG4gICAgICAgICAgdGhpcy5fdXNlcm5hbWUgPSBiYXNlLl91c2VybmFtZTtcbiAgICAgICAgICB0aGlzLl9wYXNzd29yZCA9IGJhc2UuX3Bhc3N3b3JkO1xuICAgICAgICAgIHN0YXRlID0gXCJmcmFnbWVudFwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBuZXh0QyA9IGlucHV0W2N1cnNvciArIDFdO1xuICAgICAgICAgIHZhciBuZXh0TmV4dEMgPSBpbnB1dFtjdXJzb3IgKyAyXTtcbiAgICAgICAgICBpZiAoXCJmaWxlXCIgIT0gdGhpcy5fc2NoZW1lIHx8ICFBTFBIQS50ZXN0KGMpIHx8IG5leHRDICE9IFwiOlwiICYmIG5leHRDICE9IFwifFwiIHx8IEVPRiAhPSBuZXh0TmV4dEMgJiYgXCIvXCIgIT0gbmV4dE5leHRDICYmIFwiXFxcXFwiICE9IG5leHROZXh0QyAmJiBcIj9cIiAhPSBuZXh0TmV4dEMgJiYgXCIjXCIgIT0gbmV4dE5leHRDKSB7XG4gICAgICAgICAgICB0aGlzLl9ob3N0ID0gYmFzZS5faG9zdDtcbiAgICAgICAgICAgIHRoaXMuX3BvcnQgPSBiYXNlLl9wb3J0O1xuICAgICAgICAgICAgdGhpcy5fdXNlcm5hbWUgPSBiYXNlLl91c2VybmFtZTtcbiAgICAgICAgICAgIHRoaXMuX3Bhc3N3b3JkID0gYmFzZS5fcGFzc3dvcmQ7XG4gICAgICAgICAgICB0aGlzLl9wYXRoID0gYmFzZS5fcGF0aC5zbGljZSgpO1xuICAgICAgICAgICAgdGhpcy5fcGF0aC5wb3AoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlIHBhdGhcIjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJyZWxhdGl2ZSBzbGFzaFwiOlxuICAgICAgICBpZiAoXCIvXCIgPT0gYyB8fCBcIlxcXFxcIiA9PSBjKSB7XG4gICAgICAgICAgaWYgKFwiXFxcXFwiID09IGMpIHtcbiAgICAgICAgICAgIGVycihcIlxcXFwgaXMgYW4gaW52YWxpZCBjb2RlIHBvaW50LlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKFwiZmlsZVwiID09IHRoaXMuX3NjaGVtZSkge1xuICAgICAgICAgICAgc3RhdGUgPSBcImZpbGUgaG9zdFwiO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFwiYXV0aG9yaXR5IGlnbm9yZSBzbGFzaGVzXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChcImZpbGVcIiAhPSB0aGlzLl9zY2hlbWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2hvc3QgPSBiYXNlLl9ob3N0O1xuICAgICAgICAgICAgdGhpcy5fcG9ydCA9IGJhc2UuX3BvcnQ7XG4gICAgICAgICAgICB0aGlzLl91c2VybmFtZSA9IGJhc2UuX3VzZXJuYW1lO1xuICAgICAgICAgICAgdGhpcy5fcGFzc3dvcmQgPSBiYXNlLl9wYXNzd29yZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlIHBhdGhcIjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJhdXRob3JpdHkgZmlyc3Qgc2xhc2hcIjpcbiAgICAgICAgaWYgKFwiL1wiID09IGMpIHtcbiAgICAgICAgICBzdGF0ZSA9IFwiYXV0aG9yaXR5IHNlY29uZCBzbGFzaFwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVycihcIkV4cGVjdGVkICcvJywgZ290OiBcIiArIGMpO1xuICAgICAgICAgIHN0YXRlID0gXCJhdXRob3JpdHkgaWdub3JlIHNsYXNoZXNcIjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJhdXRob3JpdHkgc2Vjb25kIHNsYXNoXCI6XG4gICAgICAgIHN0YXRlID0gXCJhdXRob3JpdHkgaWdub3JlIHNsYXNoZXNcIjtcbiAgICAgICAgaWYgKFwiL1wiICE9IGMpIHtcbiAgICAgICAgICBlcnIoXCJFeHBlY3RlZCAnLycsIGdvdDogXCIgKyBjKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJhdXRob3JpdHkgaWdub3JlIHNsYXNoZXNcIjpcbiAgICAgICAgaWYgKFwiL1wiICE9IGMgJiYgXCJcXFxcXCIgIT0gYykge1xuICAgICAgICAgIHN0YXRlID0gXCJhdXRob3JpdHlcIjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlcnIoXCJFeHBlY3RlZCBhdXRob3JpdHksIGdvdDogXCIgKyBjKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJhdXRob3JpdHlcIjpcbiAgICAgICAgaWYgKFwiQFwiID09IGMpIHtcbiAgICAgICAgICBpZiAoc2VlbkF0KSB7XG4gICAgICAgICAgICBlcnIoXCJAIGFscmVhZHkgc2Vlbi5cIik7XG4gICAgICAgICAgICBidWZmZXIgKz0gXCIlNDBcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2VlbkF0ID0gdHJ1ZTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1ZmZlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNwID0gYnVmZmVyW2ldO1xuICAgICAgICAgICAgaWYgKFwiXHRcIiA9PSBjcCB8fCBcIlxcblwiID09IGNwIHx8IFwiXFxyXCIgPT0gY3ApIHtcbiAgICAgICAgICAgICAgZXJyKFwiSW52YWxpZCB3aGl0ZXNwYWNlIGluIGF1dGhvcml0eS5cIik7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFwiOlwiID09IGNwICYmIG51bGwgPT09IHRoaXMuX3Bhc3N3b3JkKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3Bhc3N3b3JkID0gXCJcIjtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdGVtcEMgPSBwZXJjZW50RXNjYXBlKGNwKTtcbiAgICAgICAgICAgIG51bGwgIT09IHRoaXMuX3Bhc3N3b3JkID8gdGhpcy5fcGFzc3dvcmQgKz0gdGVtcEMgOiB0aGlzLl91c2VybmFtZSArPSB0ZW1wQztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnVmZmVyID0gXCJcIjtcbiAgICAgICAgfSBlbHNlIGlmIChFT0YgPT0gYyB8fCBcIi9cIiA9PSBjIHx8IFwiXFxcXFwiID09IGMgfHwgXCI/XCIgPT0gYyB8fCBcIiNcIiA9PSBjKSB7XG4gICAgICAgICAgY3Vyc29yIC09IGJ1ZmZlci5sZW5ndGg7XG4gICAgICAgICAgYnVmZmVyID0gXCJcIjtcbiAgICAgICAgICBzdGF0ZSA9IFwiaG9zdFwiO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJ1ZmZlciArPSBjO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcImZpbGUgaG9zdFwiOlxuICAgICAgICBpZiAoRU9GID09IGMgfHwgXCIvXCIgPT0gYyB8fCBcIlxcXFxcIiA9PSBjIHx8IFwiP1wiID09IGMgfHwgXCIjXCIgPT0gYykge1xuICAgICAgICAgIGlmIChidWZmZXIubGVuZ3RoID09IDIgJiYgQUxQSEEudGVzdChidWZmZXJbMF0pICYmIChidWZmZXJbMV0gPT0gXCI6XCIgfHwgYnVmZmVyWzFdID09IFwifFwiKSkge1xuICAgICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlIHBhdGhcIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGJ1ZmZlci5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlIHBhdGggc3RhcnRcIjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faG9zdCA9IElETkFUb0FTQ0lJLmNhbGwodGhpcywgYnVmZmVyKTtcbiAgICAgICAgICAgIGJ1ZmZlciA9IFwiXCI7XG4gICAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmUgcGF0aCBzdGFydFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIGlmIChcIlx0XCIgPT0gYyB8fCBcIlxcblwiID09IGMgfHwgXCJcXHJcIiA9PSBjKSB7XG4gICAgICAgICAgZXJyKFwiSW52YWxpZCB3aGl0ZXNwYWNlIGluIGZpbGUgaG9zdC5cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVmZmVyICs9IGM7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiaG9zdFwiOlxuICAgICAgIGNhc2UgXCJob3N0bmFtZVwiOlxuICAgICAgICBpZiAoXCI6XCIgPT0gYyAmJiAhc2VlbkJyYWNrZXQpIHtcbiAgICAgICAgICB0aGlzLl9ob3N0ID0gSUROQVRvQVNDSUkuY2FsbCh0aGlzLCBidWZmZXIpO1xuICAgICAgICAgIGJ1ZmZlciA9IFwiXCI7XG4gICAgICAgICAgc3RhdGUgPSBcInBvcnRcIjtcbiAgICAgICAgICBpZiAoXCJob3N0bmFtZVwiID09IHN0YXRlT3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIGJyZWFrIGxvb3A7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKEVPRiA9PSBjIHx8IFwiL1wiID09IGMgfHwgXCJcXFxcXCIgPT0gYyB8fCBcIj9cIiA9PSBjIHx8IFwiI1wiID09IGMpIHtcbiAgICAgICAgICB0aGlzLl9ob3N0ID0gSUROQVRvQVNDSUkuY2FsbCh0aGlzLCBidWZmZXIpO1xuICAgICAgICAgIGJ1ZmZlciA9IFwiXCI7XG4gICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlIHBhdGggc3RhcnRcIjtcbiAgICAgICAgICBpZiAoc3RhdGVPdmVycmlkZSkge1xuICAgICAgICAgICAgYnJlYWsgbG9vcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJcdFwiICE9IGMgJiYgXCJcXG5cIiAhPSBjICYmIFwiXFxyXCIgIT0gYykge1xuICAgICAgICAgIGlmIChcIltcIiA9PSBjKSB7XG4gICAgICAgICAgICBzZWVuQnJhY2tldCA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChcIl1cIiA9PSBjKSB7XG4gICAgICAgICAgICBzZWVuQnJhY2tldCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBidWZmZXIgKz0gYztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlcnIoXCJJbnZhbGlkIGNvZGUgcG9pbnQgaW4gaG9zdC9ob3N0bmFtZTogXCIgKyBjKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJwb3J0XCI6XG4gICAgICAgIGlmICgvWzAtOV0vLnRlc3QoYykpIHtcbiAgICAgICAgICBidWZmZXIgKz0gYztcbiAgICAgICAgfSBlbHNlIGlmIChFT0YgPT0gYyB8fCBcIi9cIiA9PSBjIHx8IFwiXFxcXFwiID09IGMgfHwgXCI/XCIgPT0gYyB8fCBcIiNcIiA9PSBjIHx8IHN0YXRlT3ZlcnJpZGUpIHtcbiAgICAgICAgICBpZiAoXCJcIiAhPSBidWZmZXIpIHtcbiAgICAgICAgICAgIHZhciB0ZW1wID0gcGFyc2VJbnQoYnVmZmVyLCAxMCk7XG4gICAgICAgICAgICBpZiAodGVtcCAhPSByZWxhdGl2ZVt0aGlzLl9zY2hlbWVdKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3BvcnQgPSB0ZW1wICsgXCJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1ZmZlciA9IFwiXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdGF0ZU92ZXJyaWRlKSB7XG4gICAgICAgICAgICBicmVhayBsb29wO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmUgcGF0aCBzdGFydFwiO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKFwiXHRcIiA9PSBjIHx8IFwiXFxuXCIgPT0gYyB8fCBcIlxcclwiID09IGMpIHtcbiAgICAgICAgICBlcnIoXCJJbnZhbGlkIGNvZGUgcG9pbnQgaW4gcG9ydDogXCIgKyBjKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbnZhbGlkLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwicmVsYXRpdmUgcGF0aCBzdGFydFwiOlxuICAgICAgICBpZiAoXCJcXFxcXCIgPT0gYykgZXJyKFwiJ1xcXFwnIG5vdCBhbGxvd2VkIGluIHBhdGguXCIpO1xuICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmUgcGF0aFwiO1xuICAgICAgICBpZiAoXCIvXCIgIT0gYyAmJiBcIlxcXFxcIiAhPSBjKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwicmVsYXRpdmUgcGF0aFwiOlxuICAgICAgICBpZiAoRU9GID09IGMgfHwgXCIvXCIgPT0gYyB8fCBcIlxcXFxcIiA9PSBjIHx8ICFzdGF0ZU92ZXJyaWRlICYmIChcIj9cIiA9PSBjIHx8IFwiI1wiID09IGMpKSB7XG4gICAgICAgICAgaWYgKFwiXFxcXFwiID09IGMpIHtcbiAgICAgICAgICAgIGVycihcIlxcXFwgbm90IGFsbG93ZWQgaW4gcmVsYXRpdmUgcGF0aC5cIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciB0bXA7XG4gICAgICAgICAgaWYgKHRtcCA9IHJlbGF0aXZlUGF0aERvdE1hcHBpbmdbYnVmZmVyLnRvTG93ZXJDYXNlKCldKSB7XG4gICAgICAgICAgICBidWZmZXIgPSB0bXA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChcIi4uXCIgPT0gYnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9wYXRoLnBvcCgpO1xuICAgICAgICAgICAgaWYgKFwiL1wiICE9IGMgJiYgXCJcXFxcXCIgIT0gYykge1xuICAgICAgICAgICAgICB0aGlzLl9wYXRoLnB1c2goXCJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChcIi5cIiA9PSBidWZmZXIgJiYgXCIvXCIgIT0gYyAmJiBcIlxcXFxcIiAhPSBjKSB7XG4gICAgICAgICAgICB0aGlzLl9wYXRoLnB1c2goXCJcIik7XG4gICAgICAgICAgfSBlbHNlIGlmIChcIi5cIiAhPSBidWZmZXIpIHtcbiAgICAgICAgICAgIGlmIChcImZpbGVcIiA9PSB0aGlzLl9zY2hlbWUgJiYgdGhpcy5fcGF0aC5sZW5ndGggPT0gMCAmJiBidWZmZXIubGVuZ3RoID09IDIgJiYgQUxQSEEudGVzdChidWZmZXJbMF0pICYmIGJ1ZmZlclsxXSA9PSBcInxcIikge1xuICAgICAgICAgICAgICBidWZmZXIgPSBidWZmZXJbMF0gKyBcIjpcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3BhdGgucHVzaChidWZmZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBidWZmZXIgPSBcIlwiO1xuICAgICAgICAgIGlmIChcIj9cIiA9PSBjKSB7XG4gICAgICAgICAgICB0aGlzLl9xdWVyeSA9IFwiP1wiO1xuICAgICAgICAgICAgc3RhdGUgPSBcInF1ZXJ5XCI7XG4gICAgICAgICAgfSBlbHNlIGlmIChcIiNcIiA9PSBjKSB7XG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudCA9IFwiI1wiO1xuICAgICAgICAgICAgc3RhdGUgPSBcImZyYWdtZW50XCI7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFwiXHRcIiAhPSBjICYmIFwiXFxuXCIgIT0gYyAmJiBcIlxcclwiICE9IGMpIHtcbiAgICAgICAgICBidWZmZXIgKz0gcGVyY2VudEVzY2FwZShjKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJxdWVyeVwiOlxuICAgICAgICBpZiAoIXN0YXRlT3ZlcnJpZGUgJiYgXCIjXCIgPT0gYykge1xuICAgICAgICAgIHRoaXMuX2ZyYWdtZW50ID0gXCIjXCI7XG4gICAgICAgICAgc3RhdGUgPSBcImZyYWdtZW50XCI7XG4gICAgICAgIH0gZWxzZSBpZiAoRU9GICE9IGMgJiYgXCJcdFwiICE9IGMgJiYgXCJcXG5cIiAhPSBjICYmIFwiXFxyXCIgIT0gYykge1xuICAgICAgICAgIHRoaXMuX3F1ZXJ5ICs9IHBlcmNlbnRFc2NhcGVRdWVyeShjKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJmcmFnbWVudFwiOlxuICAgICAgICBpZiAoRU9GICE9IGMgJiYgXCJcdFwiICE9IGMgJiYgXCJcXG5cIiAhPSBjICYmIFwiXFxyXCIgIT0gYykge1xuICAgICAgICAgIHRoaXMuX2ZyYWdtZW50ICs9IGM7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjdXJzb3IrKztcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdGhpcy5fc2NoZW1lID0gXCJcIjtcbiAgICB0aGlzLl9zY2hlbWVEYXRhID0gXCJcIjtcbiAgICB0aGlzLl91c2VybmFtZSA9IFwiXCI7XG4gICAgdGhpcy5fcGFzc3dvcmQgPSBudWxsO1xuICAgIHRoaXMuX2hvc3QgPSBcIlwiO1xuICAgIHRoaXMuX3BvcnQgPSBcIlwiO1xuICAgIHRoaXMuX3BhdGggPSBbXTtcbiAgICB0aGlzLl9xdWVyeSA9IFwiXCI7XG4gICAgdGhpcy5fZnJhZ21lbnQgPSBcIlwiO1xuICAgIHRoaXMuX2lzSW52YWxpZCA9IGZhbHNlO1xuICAgIHRoaXMuX2lzUmVsYXRpdmUgPSBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiBqVVJMKHVybCwgYmFzZSkge1xuICAgIGlmIChiYXNlICE9PSB1bmRlZmluZWQgJiYgIShiYXNlIGluc3RhbmNlb2YgalVSTCkpIGJhc2UgPSBuZXcgalVSTChTdHJpbmcoYmFzZSkpO1xuICAgIHRoaXMuX3VybCA9IHVybDtcbiAgICBjbGVhci5jYWxsKHRoaXMpO1xuICAgIHZhciBpbnB1dCA9IHVybC5yZXBsYWNlKC9eWyBcXHRcXHJcXG5cXGZdK3xbIFxcdFxcclxcblxcZl0rJC9nLCBcIlwiKTtcbiAgICBwYXJzZS5jYWxsKHRoaXMsIGlucHV0LCBudWxsLCBiYXNlKTtcbiAgfVxuICBqVVJMLnByb3RvdHlwZSA9IHtcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5ocmVmO1xuICAgIH0sXG4gICAgZ2V0IGhyZWYoKSB7XG4gICAgICBpZiAodGhpcy5faXNJbnZhbGlkKSByZXR1cm4gdGhpcy5fdXJsO1xuICAgICAgdmFyIGF1dGhvcml0eSA9IFwiXCI7XG4gICAgICBpZiAoXCJcIiAhPSB0aGlzLl91c2VybmFtZSB8fCBudWxsICE9IHRoaXMuX3Bhc3N3b3JkKSB7XG4gICAgICAgIGF1dGhvcml0eSA9IHRoaXMuX3VzZXJuYW1lICsgKG51bGwgIT0gdGhpcy5fcGFzc3dvcmQgPyBcIjpcIiArIHRoaXMuX3Bhc3N3b3JkIDogXCJcIikgKyBcIkBcIjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnByb3RvY29sICsgKHRoaXMuX2lzUmVsYXRpdmUgPyBcIi8vXCIgKyBhdXRob3JpdHkgKyB0aGlzLmhvc3QgOiBcIlwiKSArIHRoaXMucGF0aG5hbWUgKyB0aGlzLl9xdWVyeSArIHRoaXMuX2ZyYWdtZW50O1xuICAgIH0sXG4gICAgc2V0IGhyZWYoaHJlZikge1xuICAgICAgY2xlYXIuY2FsbCh0aGlzKTtcbiAgICAgIHBhcnNlLmNhbGwodGhpcywgaHJlZik7XG4gICAgfSxcbiAgICBnZXQgcHJvdG9jb2woKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc2NoZW1lICsgXCI6XCI7XG4gICAgfSxcbiAgICBzZXQgcHJvdG9jb2wocHJvdG9jb2wpIHtcbiAgICAgIGlmICh0aGlzLl9pc0ludmFsaWQpIHJldHVybjtcbiAgICAgIHBhcnNlLmNhbGwodGhpcywgcHJvdG9jb2wgKyBcIjpcIiwgXCJzY2hlbWUgc3RhcnRcIik7XG4gICAgfSxcbiAgICBnZXQgaG9zdCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pc0ludmFsaWQgPyBcIlwiIDogdGhpcy5fcG9ydCA/IHRoaXMuX2hvc3QgKyBcIjpcIiArIHRoaXMuX3BvcnQgOiB0aGlzLl9ob3N0O1xuICAgIH0sXG4gICAgc2V0IGhvc3QoaG9zdCkge1xuICAgICAgaWYgKHRoaXMuX2lzSW52YWxpZCB8fCAhdGhpcy5faXNSZWxhdGl2ZSkgcmV0dXJuO1xuICAgICAgcGFyc2UuY2FsbCh0aGlzLCBob3N0LCBcImhvc3RcIik7XG4gICAgfSxcbiAgICBnZXQgaG9zdG5hbWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5faG9zdDtcbiAgICB9LFxuICAgIHNldCBob3N0bmFtZShob3N0bmFtZSkge1xuICAgICAgaWYgKHRoaXMuX2lzSW52YWxpZCB8fCAhdGhpcy5faXNSZWxhdGl2ZSkgcmV0dXJuO1xuICAgICAgcGFyc2UuY2FsbCh0aGlzLCBob3N0bmFtZSwgXCJob3N0bmFtZVwiKTtcbiAgICB9LFxuICAgIGdldCBwb3J0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BvcnQ7XG4gICAgfSxcbiAgICBzZXQgcG9ydChwb3J0KSB7XG4gICAgICBpZiAodGhpcy5faXNJbnZhbGlkIHx8ICF0aGlzLl9pc1JlbGF0aXZlKSByZXR1cm47XG4gICAgICBwYXJzZS5jYWxsKHRoaXMsIHBvcnQsIFwicG9ydFwiKTtcbiAgICB9LFxuICAgIGdldCBwYXRobmFtZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pc0ludmFsaWQgPyBcIlwiIDogdGhpcy5faXNSZWxhdGl2ZSA/IFwiL1wiICsgdGhpcy5fcGF0aC5qb2luKFwiL1wiKSA6IHRoaXMuX3NjaGVtZURhdGE7XG4gICAgfSxcbiAgICBzZXQgcGF0aG5hbWUocGF0aG5hbWUpIHtcbiAgICAgIGlmICh0aGlzLl9pc0ludmFsaWQgfHwgIXRoaXMuX2lzUmVsYXRpdmUpIHJldHVybjtcbiAgICAgIHRoaXMuX3BhdGggPSBbXTtcbiAgICAgIHBhcnNlLmNhbGwodGhpcywgcGF0aG5hbWUsIFwicmVsYXRpdmUgcGF0aCBzdGFydFwiKTtcbiAgICB9LFxuICAgIGdldCBzZWFyY2goKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXNJbnZhbGlkIHx8ICF0aGlzLl9xdWVyeSB8fCBcIj9cIiA9PSB0aGlzLl9xdWVyeSA/IFwiXCIgOiB0aGlzLl9xdWVyeTtcbiAgICB9LFxuICAgIHNldCBzZWFyY2goc2VhcmNoKSB7XG4gICAgICBpZiAodGhpcy5faXNJbnZhbGlkIHx8ICF0aGlzLl9pc1JlbGF0aXZlKSByZXR1cm47XG4gICAgICB0aGlzLl9xdWVyeSA9IFwiP1wiO1xuICAgICAgaWYgKFwiP1wiID09IHNlYXJjaFswXSkgc2VhcmNoID0gc2VhcmNoLnNsaWNlKDEpO1xuICAgICAgcGFyc2UuY2FsbCh0aGlzLCBzZWFyY2gsIFwicXVlcnlcIik7XG4gICAgfSxcbiAgICBnZXQgaGFzaCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pc0ludmFsaWQgfHwgIXRoaXMuX2ZyYWdtZW50IHx8IFwiI1wiID09IHRoaXMuX2ZyYWdtZW50ID8gXCJcIiA6IHRoaXMuX2ZyYWdtZW50O1xuICAgIH0sXG4gICAgc2V0IGhhc2goaGFzaCkge1xuICAgICAgaWYgKHRoaXMuX2lzSW52YWxpZCkgcmV0dXJuO1xuICAgICAgdGhpcy5fZnJhZ21lbnQgPSBcIiNcIjtcbiAgICAgIGlmIChcIiNcIiA9PSBoYXNoWzBdKSBoYXNoID0gaGFzaC5zbGljZSgxKTtcbiAgICAgIHBhcnNlLmNhbGwodGhpcywgaGFzaCwgXCJmcmFnbWVudFwiKTtcbiAgICB9LFxuICAgIGdldCBvcmlnaW4oKSB7XG4gICAgICB2YXIgaG9zdDtcbiAgICAgIGlmICh0aGlzLl9pc0ludmFsaWQgfHwgIXRoaXMuX3NjaGVtZSkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAodGhpcy5fc2NoZW1lKSB7XG4gICAgICAgY2FzZSBcImRhdGFcIjpcbiAgICAgICBjYXNlIFwiZmlsZVwiOlxuICAgICAgIGNhc2UgXCJqYXZhc2NyaXB0XCI6XG4gICAgICAgY2FzZSBcIm1haWx0b1wiOlxuICAgICAgICByZXR1cm4gXCJudWxsXCI7XG4gICAgICB9XG4gICAgICBob3N0ID0gdGhpcy5ob3N0O1xuICAgICAgaWYgKCFob3N0KSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3NjaGVtZSArIFwiOi8vXCIgKyBob3N0O1xuICAgIH1cbiAgfTtcbiAgdmFyIE9yaWdpbmFsVVJMID0gc2NvcGUuVVJMO1xuICBpZiAoT3JpZ2luYWxVUkwpIHtcbiAgICBqVVJMLmNyZWF0ZU9iamVjdFVSTCA9IGZ1bmN0aW9uKGJsb2IpIHtcbiAgICAgIHJldHVybiBPcmlnaW5hbFVSTC5jcmVhdGVPYmplY3RVUkwuYXBwbHkoT3JpZ2luYWxVUkwsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBqVVJMLnJldm9rZU9iamVjdFVSTCA9IGZ1bmN0aW9uKHVybCkge1xuICAgICAgT3JpZ2luYWxVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG4gICAgfTtcbiAgfVxuICBzY29wZS5VUkwgPSBqVVJMO1xufSkoc2VsZik7XG5cbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgaWYgKGdsb2JhbC5Kc011dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIHJlZ2lzdHJhdGlvbnNUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gIHZhciBzZXRJbW1lZGlhdGU7XG4gIGlmICgvVHJpZGVudHxFZGdlLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgc2V0SW1tZWRpYXRlID0gc2V0VGltZW91dDtcbiAgfSBlbHNlIGlmICh3aW5kb3cuc2V0SW1tZWRpYXRlKSB7XG4gICAgc2V0SW1tZWRpYXRlID0gd2luZG93LnNldEltbWVkaWF0ZTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2V0SW1tZWRpYXRlUXVldWUgPSBbXTtcbiAgICB2YXIgc2VudGluZWwgPSBTdHJpbmcoTWF0aC5yYW5kb20oKSk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChlLmRhdGEgPT09IHNlbnRpbmVsKSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IHNldEltbWVkaWF0ZVF1ZXVlO1xuICAgICAgICBzZXRJbW1lZGlhdGVRdWV1ZSA9IFtdO1xuICAgICAgICBxdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgICBmdW5jKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHNldEltbWVkaWF0ZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgIHNldEltbWVkaWF0ZVF1ZXVlLnB1c2goZnVuYyk7XG4gICAgICB3aW5kb3cucG9zdE1lc3NhZ2Uoc2VudGluZWwsIFwiKlwiKTtcbiAgICB9O1xuICB9XG4gIHZhciBpc1NjaGVkdWxlZCA9IGZhbHNlO1xuICB2YXIgc2NoZWR1bGVkT2JzZXJ2ZXJzID0gW107XG4gIGZ1bmN0aW9uIHNjaGVkdWxlQ2FsbGJhY2sob2JzZXJ2ZXIpIHtcbiAgICBzY2hlZHVsZWRPYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XG4gICAgaWYgKCFpc1NjaGVkdWxlZCkge1xuICAgICAgaXNTY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgc2V0SW1tZWRpYXRlKGRpc3BhdGNoQ2FsbGJhY2tzKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gd3JhcElmTmVlZGVkKG5vZGUpIHtcbiAgICByZXR1cm4gd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsICYmIHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbC53cmFwSWZOZWVkZWQobm9kZSkgfHwgbm9kZTtcbiAgfVxuICBmdW5jdGlvbiBkaXNwYXRjaENhbGxiYWNrcygpIHtcbiAgICBpc1NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIHZhciBvYnNlcnZlcnMgPSBzY2hlZHVsZWRPYnNlcnZlcnM7XG4gICAgc2NoZWR1bGVkT2JzZXJ2ZXJzID0gW107XG4gICAgb2JzZXJ2ZXJzLnNvcnQoZnVuY3Rpb24obzEsIG8yKSB7XG4gICAgICByZXR1cm4gbzEudWlkXyAtIG8yLnVpZF87XG4gICAgfSk7XG4gICAgdmFyIGFueU5vbkVtcHR5ID0gZmFsc2U7XG4gICAgb2JzZXJ2ZXJzLmZvckVhY2goZnVuY3Rpb24ob2JzZXJ2ZXIpIHtcbiAgICAgIHZhciBxdWV1ZSA9IG9ic2VydmVyLnRha2VSZWNvcmRzKCk7XG4gICAgICByZW1vdmVUcmFuc2llbnRPYnNlcnZlcnNGb3Iob2JzZXJ2ZXIpO1xuICAgICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBvYnNlcnZlci5jYWxsYmFja18ocXVldWUsIG9ic2VydmVyKTtcbiAgICAgICAgYW55Tm9uRW1wdHkgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChhbnlOb25FbXB0eSkgZGlzcGF0Y2hDYWxsYmFja3MoKTtcbiAgfVxuICBmdW5jdGlvbiByZW1vdmVUcmFuc2llbnRPYnNlcnZlcnNGb3Iob2JzZXJ2ZXIpIHtcbiAgICBvYnNlcnZlci5ub2Rlc18uZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIHJldHVybjtcbiAgICAgIHJlZ2lzdHJhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihyZWdpc3RyYXRpb24pIHtcbiAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbi5vYnNlcnZlciA9PT0gb2JzZXJ2ZXIpIHJlZ2lzdHJhdGlvbi5yZW1vdmVUcmFuc2llbnRPYnNlcnZlcnMoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZCh0YXJnZXQsIGNhbGxiYWNrKSB7XG4gICAgZm9yICh2YXIgbm9kZSA9IHRhcmdldDsgbm9kZTsgbm9kZSA9IG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgaWYgKHJlZ2lzdHJhdGlvbnMpIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbal07XG4gICAgICAgICAgdmFyIG9wdGlvbnMgPSByZWdpc3RyYXRpb24ub3B0aW9ucztcbiAgICAgICAgICBpZiAobm9kZSAhPT0gdGFyZ2V0ICYmICFvcHRpb25zLnN1YnRyZWUpIGNvbnRpbnVlO1xuICAgICAgICAgIHZhciByZWNvcmQgPSBjYWxsYmFjayhvcHRpb25zKTtcbiAgICAgICAgICBpZiAocmVjb3JkKSByZWdpc3RyYXRpb24uZW5xdWV1ZShyZWNvcmQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHZhciB1aWRDb3VudGVyID0gMDtcbiAgZnVuY3Rpb24gSnNNdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5jYWxsYmFja18gPSBjYWxsYmFjaztcbiAgICB0aGlzLm5vZGVzXyA9IFtdO1xuICAgIHRoaXMucmVjb3Jkc18gPSBbXTtcbiAgICB0aGlzLnVpZF8gPSArK3VpZENvdW50ZXI7XG4gIH1cbiAgSnNNdXRhdGlvbk9ic2VydmVyLnByb3RvdHlwZSA9IHtcbiAgICBvYnNlcnZlOiBmdW5jdGlvbih0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICAgIHRhcmdldCA9IHdyYXBJZk5lZWRlZCh0YXJnZXQpO1xuICAgICAgaWYgKCFvcHRpb25zLmNoaWxkTGlzdCAmJiAhb3B0aW9ucy5hdHRyaWJ1dGVzICYmICFvcHRpb25zLmNoYXJhY3RlckRhdGEgfHwgb3B0aW9ucy5hdHRyaWJ1dGVPbGRWYWx1ZSAmJiAhb3B0aW9ucy5hdHRyaWJ1dGVzIHx8IG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyICYmIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyLmxlbmd0aCAmJiAhb3B0aW9ucy5hdHRyaWJ1dGVzIHx8IG9wdGlvbnMuY2hhcmFjdGVyRGF0YU9sZFZhbHVlICYmICFvcHRpb25zLmNoYXJhY3RlckRhdGEpIHtcbiAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKCk7XG4gICAgICB9XG4gICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQodGFyZ2V0KTtcbiAgICAgIGlmICghcmVnaXN0cmF0aW9ucykgcmVnaXN0cmF0aW9uc1RhYmxlLnNldCh0YXJnZXQsIHJlZ2lzdHJhdGlvbnMgPSBbXSk7XG4gICAgICB2YXIgcmVnaXN0cmF0aW9uO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChyZWdpc3RyYXRpb25zW2ldLm9ic2VydmVyID09PSB0aGlzKSB7XG4gICAgICAgICAgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tpXTtcbiAgICAgICAgICByZWdpc3RyYXRpb24ucmVtb3ZlTGlzdGVuZXJzKCk7XG4gICAgICAgICAgcmVnaXN0cmF0aW9uLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIXJlZ2lzdHJhdGlvbikge1xuICAgICAgICByZWdpc3RyYXRpb24gPSBuZXcgUmVnaXN0cmF0aW9uKHRoaXMsIHRhcmdldCwgb3B0aW9ucyk7XG4gICAgICAgIHJlZ2lzdHJhdGlvbnMucHVzaChyZWdpc3RyYXRpb24pO1xuICAgICAgICB0aGlzLm5vZGVzXy5wdXNoKHRhcmdldCk7XG4gICAgICB9XG4gICAgICByZWdpc3RyYXRpb24uYWRkTGlzdGVuZXJzKCk7XG4gICAgfSxcbiAgICBkaXNjb25uZWN0OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMubm9kZXNfLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2ldO1xuICAgICAgICAgIGlmIChyZWdpc3RyYXRpb24ub2JzZXJ2ZXIgPT09IHRoaXMpIHtcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbi5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LCB0aGlzKTtcbiAgICAgIHRoaXMucmVjb3Jkc18gPSBbXTtcbiAgICB9LFxuICAgIHRha2VSZWNvcmRzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjb3B5T2ZSZWNvcmRzID0gdGhpcy5yZWNvcmRzXztcbiAgICAgIHRoaXMucmVjb3Jkc18gPSBbXTtcbiAgICAgIHJldHVybiBjb3B5T2ZSZWNvcmRzO1xuICAgIH1cbiAgfTtcbiAgZnVuY3Rpb24gTXV0YXRpb25SZWNvcmQodHlwZSwgdGFyZ2V0KSB7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLmFkZGVkTm9kZXMgPSBbXTtcbiAgICB0aGlzLnJlbW92ZWROb2RlcyA9IFtdO1xuICAgIHRoaXMucHJldmlvdXNTaWJsaW5nID0gbnVsbDtcbiAgICB0aGlzLm5leHRTaWJsaW5nID0gbnVsbDtcbiAgICB0aGlzLmF0dHJpYnV0ZU5hbWUgPSBudWxsO1xuICAgIHRoaXMuYXR0cmlidXRlTmFtZXNwYWNlID0gbnVsbDtcbiAgICB0aGlzLm9sZFZhbHVlID0gbnVsbDtcbiAgfVxuICBmdW5jdGlvbiBjb3B5TXV0YXRpb25SZWNvcmQob3JpZ2luYWwpIHtcbiAgICB2YXIgcmVjb3JkID0gbmV3IE11dGF0aW9uUmVjb3JkKG9yaWdpbmFsLnR5cGUsIG9yaWdpbmFsLnRhcmdldCk7XG4gICAgcmVjb3JkLmFkZGVkTm9kZXMgPSBvcmlnaW5hbC5hZGRlZE5vZGVzLnNsaWNlKCk7XG4gICAgcmVjb3JkLnJlbW92ZWROb2RlcyA9IG9yaWdpbmFsLnJlbW92ZWROb2Rlcy5zbGljZSgpO1xuICAgIHJlY29yZC5wcmV2aW91c1NpYmxpbmcgPSBvcmlnaW5hbC5wcmV2aW91c1NpYmxpbmc7XG4gICAgcmVjb3JkLm5leHRTaWJsaW5nID0gb3JpZ2luYWwubmV4dFNpYmxpbmc7XG4gICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWUgPSBvcmlnaW5hbC5hdHRyaWJ1dGVOYW1lO1xuICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lc3BhY2UgPSBvcmlnaW5hbC5hdHRyaWJ1dGVOYW1lc3BhY2U7XG4gICAgcmVjb3JkLm9sZFZhbHVlID0gb3JpZ2luYWwub2xkVmFsdWU7XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuICB2YXIgY3VycmVudFJlY29yZCwgcmVjb3JkV2l0aE9sZFZhbHVlO1xuICBmdW5jdGlvbiBnZXRSZWNvcmQodHlwZSwgdGFyZ2V0KSB7XG4gICAgcmV0dXJuIGN1cnJlbnRSZWNvcmQgPSBuZXcgTXV0YXRpb25SZWNvcmQodHlwZSwgdGFyZ2V0KTtcbiAgfVxuICBmdW5jdGlvbiBnZXRSZWNvcmRXaXRoT2xkVmFsdWUob2xkVmFsdWUpIHtcbiAgICBpZiAocmVjb3JkV2l0aE9sZFZhbHVlKSByZXR1cm4gcmVjb3JkV2l0aE9sZFZhbHVlO1xuICAgIHJlY29yZFdpdGhPbGRWYWx1ZSA9IGNvcHlNdXRhdGlvblJlY29yZChjdXJyZW50UmVjb3JkKTtcbiAgICByZWNvcmRXaXRoT2xkVmFsdWUub2xkVmFsdWUgPSBvbGRWYWx1ZTtcbiAgICByZXR1cm4gcmVjb3JkV2l0aE9sZFZhbHVlO1xuICB9XG4gIGZ1bmN0aW9uIGNsZWFyUmVjb3JkcygpIHtcbiAgICBjdXJyZW50UmVjb3JkID0gcmVjb3JkV2l0aE9sZFZhbHVlID0gdW5kZWZpbmVkO1xuICB9XG4gIGZ1bmN0aW9uIHJlY29yZFJlcHJlc2VudHNDdXJyZW50TXV0YXRpb24ocmVjb3JkKSB7XG4gICAgcmV0dXJuIHJlY29yZCA9PT0gcmVjb3JkV2l0aE9sZFZhbHVlIHx8IHJlY29yZCA9PT0gY3VycmVudFJlY29yZDtcbiAgfVxuICBmdW5jdGlvbiBzZWxlY3RSZWNvcmQobGFzdFJlY29yZCwgbmV3UmVjb3JkKSB7XG4gICAgaWYgKGxhc3RSZWNvcmQgPT09IG5ld1JlY29yZCkgcmV0dXJuIGxhc3RSZWNvcmQ7XG4gICAgaWYgKHJlY29yZFdpdGhPbGRWYWx1ZSAmJiByZWNvcmRSZXByZXNlbnRzQ3VycmVudE11dGF0aW9uKGxhc3RSZWNvcmQpKSByZXR1cm4gcmVjb3JkV2l0aE9sZFZhbHVlO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGZ1bmN0aW9uIFJlZ2lzdHJhdGlvbihvYnNlcnZlciwgdGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgdGhpcy5vYnNlcnZlciA9IG9ic2VydmVyO1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzID0gW107XG4gIH1cbiAgUmVnaXN0cmF0aW9uLnByb3RvdHlwZSA9IHtcbiAgICBlbnF1ZXVlOiBmdW5jdGlvbihyZWNvcmQpIHtcbiAgICAgIHZhciByZWNvcmRzID0gdGhpcy5vYnNlcnZlci5yZWNvcmRzXztcbiAgICAgIHZhciBsZW5ndGggPSByZWNvcmRzLmxlbmd0aDtcbiAgICAgIGlmIChyZWNvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGxhc3RSZWNvcmQgPSByZWNvcmRzW2xlbmd0aCAtIDFdO1xuICAgICAgICB2YXIgcmVjb3JkVG9SZXBsYWNlTGFzdCA9IHNlbGVjdFJlY29yZChsYXN0UmVjb3JkLCByZWNvcmQpO1xuICAgICAgICBpZiAocmVjb3JkVG9SZXBsYWNlTGFzdCkge1xuICAgICAgICAgIHJlY29yZHNbbGVuZ3RoIC0gMV0gPSByZWNvcmRUb1JlcGxhY2VMYXN0O1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZWR1bGVDYWxsYmFjayh0aGlzLm9ic2VydmVyKTtcbiAgICAgIH1cbiAgICAgIHJlY29yZHNbbGVuZ3RoXSA9IHJlY29yZDtcbiAgICB9LFxuICAgIGFkZExpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmFkZExpc3RlbmVyc18odGhpcy50YXJnZXQpO1xuICAgIH0sXG4gICAgYWRkTGlzdGVuZXJzXzogZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzKSBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJET01BdHRyTW9kaWZpZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGFyYWN0ZXJEYXRhKSBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJET01DaGFyYWN0ZXJEYXRhTW9kaWZpZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QpIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTU5vZGVJbnNlcnRlZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoaWxkTGlzdCB8fCBvcHRpb25zLnN1YnRyZWUpIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTU5vZGVSZW1vdmVkXCIsIHRoaXMsIHRydWUpO1xuICAgIH0sXG4gICAgcmVtb3ZlTGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzXyh0aGlzLnRhcmdldCk7XG4gICAgfSxcbiAgICByZW1vdmVMaXN0ZW5lcnNfOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZXMpIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIkRPTUF0dHJNb2RpZmllZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoYXJhY3RlckRhdGEpIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIkRPTUNoYXJhY3RlckRhdGFNb2RpZmllZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoaWxkTGlzdCkgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NTm9kZUluc2VydGVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hpbGRMaXN0IHx8IG9wdGlvbnMuc3VidHJlZSkgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NTm9kZVJlbW92ZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgfSxcbiAgICBhZGRUcmFuc2llbnRPYnNlcnZlcjogZnVuY3Rpb24obm9kZSkge1xuICAgICAgaWYgKG5vZGUgPT09IHRoaXMudGFyZ2V0KSByZXR1cm47XG4gICAgICB0aGlzLmFkZExpc3RlbmVyc18obm9kZSk7XG4gICAgICB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXMucHVzaChub2RlKTtcbiAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgIGlmICghcmVnaXN0cmF0aW9ucykgcmVnaXN0cmF0aW9uc1RhYmxlLnNldChub2RlLCByZWdpc3RyYXRpb25zID0gW10pO1xuICAgICAgcmVnaXN0cmF0aW9ucy5wdXNoKHRoaXMpO1xuICAgIH0sXG4gICAgcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0cmFuc2llbnRPYnNlcnZlZE5vZGVzID0gdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzO1xuICAgICAgdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzID0gW107XG4gICAgICB0cmFuc2llbnRPYnNlcnZlZE5vZGVzLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyc18obm9kZSk7XG4gICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbnNbaV0gPT09IHRoaXMpIHtcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LCB0aGlzKTtcbiAgICB9LFxuICAgIGhhbmRsZUV2ZW50OiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgICBjYXNlIFwiRE9NQXR0ck1vZGlmaWVkXCI6XG4gICAgICAgIHZhciBuYW1lID0gZS5hdHRyTmFtZTtcbiAgICAgICAgdmFyIG5hbWVzcGFjZSA9IGUucmVsYXRlZE5vZGUubmFtZXNwYWNlVVJJO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgIHZhciByZWNvcmQgPSBuZXcgZ2V0UmVjb3JkKFwiYXR0cmlidXRlc1wiLCB0YXJnZXQpO1xuICAgICAgICByZWNvcmQuYXR0cmlidXRlTmFtZSA9IG5hbWU7XG4gICAgICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHZhciBvbGRWYWx1ZSA9IGUuYXR0ckNoYW5nZSA9PT0gTXV0YXRpb25FdmVudC5BRERJVElPTiA/IG51bGwgOiBlLnByZXZWYWx1ZTtcbiAgICAgICAgZm9yRWFjaEFuY2VzdG9yQW5kT2JzZXJ2ZXJFbnF1ZXVlUmVjb3JkKHRhcmdldCwgZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAgIGlmICghb3B0aW9ucy5hdHRyaWJ1dGVzKSByZXR1cm47XG4gICAgICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyICYmIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyLmxlbmd0aCAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5pbmRleE9mKG5hbWUpID09PSAtMSAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5pbmRleE9mKG5hbWVzcGFjZSkgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZU9sZFZhbHVlKSByZXR1cm4gZ2V0UmVjb3JkV2l0aE9sZFZhbHVlKG9sZFZhbHVlKTtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkO1xuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiRE9NQ2hhcmFjdGVyRGF0YU1vZGlmaWVkXCI6XG4gICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgdmFyIHJlY29yZCA9IGdldFJlY29yZChcImNoYXJhY3RlckRhdGFcIiwgdGFyZ2V0KTtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gZS5wcmV2VmFsdWU7XG4gICAgICAgIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZCh0YXJnZXQsIGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICBpZiAoIW9wdGlvbnMuY2hhcmFjdGVyRGF0YSkgcmV0dXJuO1xuICAgICAgICAgIGlmIChvcHRpb25zLmNoYXJhY3RlckRhdGFPbGRWYWx1ZSkgcmV0dXJuIGdldFJlY29yZFdpdGhPbGRWYWx1ZShvbGRWYWx1ZSk7XG4gICAgICAgICAgcmV0dXJuIHJlY29yZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcIkRPTU5vZGVSZW1vdmVkXCI6XG4gICAgICAgIHRoaXMuYWRkVHJhbnNpZW50T2JzZXJ2ZXIoZS50YXJnZXQpO1xuXG4gICAgICAgY2FzZSBcIkRPTU5vZGVJbnNlcnRlZFwiOlxuICAgICAgICB2YXIgY2hhbmdlZE5vZGUgPSBlLnRhcmdldDtcbiAgICAgICAgdmFyIGFkZGVkTm9kZXMsIHJlbW92ZWROb2RlcztcbiAgICAgICAgaWYgKGUudHlwZSA9PT0gXCJET01Ob2RlSW5zZXJ0ZWRcIikge1xuICAgICAgICAgIGFkZGVkTm9kZXMgPSBbIGNoYW5nZWROb2RlIF07XG4gICAgICAgICAgcmVtb3ZlZE5vZGVzID0gW107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWRkZWROb2RlcyA9IFtdO1xuICAgICAgICAgIHJlbW92ZWROb2RlcyA9IFsgY2hhbmdlZE5vZGUgXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHJldmlvdXNTaWJsaW5nID0gY2hhbmdlZE5vZGUucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICB2YXIgbmV4dFNpYmxpbmcgPSBjaGFuZ2VkTm9kZS5uZXh0U2libGluZztcbiAgICAgICAgdmFyIHJlY29yZCA9IGdldFJlY29yZChcImNoaWxkTGlzdFwiLCBlLnRhcmdldC5wYXJlbnROb2RlKTtcbiAgICAgICAgcmVjb3JkLmFkZGVkTm9kZXMgPSBhZGRlZE5vZGVzO1xuICAgICAgICByZWNvcmQucmVtb3ZlZE5vZGVzID0gcmVtb3ZlZE5vZGVzO1xuICAgICAgICByZWNvcmQucHJldmlvdXNTaWJsaW5nID0gcHJldmlvdXNTaWJsaW5nO1xuICAgICAgICByZWNvcmQubmV4dFNpYmxpbmcgPSBuZXh0U2libGluZztcbiAgICAgICAgZm9yRWFjaEFuY2VzdG9yQW5kT2JzZXJ2ZXJFbnF1ZXVlUmVjb3JkKGUucmVsYXRlZE5vZGUsIGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICBpZiAoIW9wdGlvbnMuY2hpbGRMaXN0KSByZXR1cm47XG4gICAgICAgICAgcmV0dXJuIHJlY29yZDtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjbGVhclJlY29yZHMoKTtcbiAgICB9XG4gIH07XG4gIGdsb2JhbC5Kc011dGF0aW9uT2JzZXJ2ZXIgPSBKc011dGF0aW9uT2JzZXJ2ZXI7XG4gIGlmICghZ2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICBnbG9iYWwuTXV0YXRpb25PYnNlcnZlciA9IEpzTXV0YXRpb25PYnNlcnZlcjtcbiAgICBKc011dGF0aW9uT2JzZXJ2ZXIuX2lzUG9seWZpbGxlZCA9IHRydWU7XG4gIH1cbn0pKHNlbGYpO1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIGlmICghd2luZG93LnBlcmZvcm1hbmNlKSB7XG4gICAgdmFyIHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UgPSB7XG4gICAgICBub3c6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gRGF0ZS5ub3coKSAtIHN0YXJ0O1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgaWYgKCF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5hdGl2ZVJhZiA9IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgICAgIHJldHVybiBuYXRpdmVSYWYgPyBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gbmF0aXZlUmFmKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNhbGxiYWNrKHBlcmZvcm1hbmNlLm5vdygpKTtcbiAgICAgICAgfSk7XG4gICAgICB9IDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxZTMgLyA2MCk7XG4gICAgICB9O1xuICAgIH0oKTtcbiAgfVxuICBpZiAoIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHdpbmRvdy53ZWJraXRDYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICAgIH07XG4gICAgfSgpO1xuICB9XG4gIHZhciB3b3JraW5nRGVmYXVsdFByZXZlbnRlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKTtcbiAgICBlLmluaXRFdmVudChcImZvb1wiLCB0cnVlLCB0cnVlKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgcmV0dXJuIGUuZGVmYXVsdFByZXZlbnRlZDtcbiAgfSgpO1xuICBpZiAoIXdvcmtpbmdEZWZhdWx0UHJldmVudGVkKSB7XG4gICAgdmFyIG9yaWdQcmV2ZW50RGVmYXVsdCA9IEV2ZW50LnByb3RvdHlwZS5wcmV2ZW50RGVmYXVsdDtcbiAgICBFdmVudC5wcm90b3R5cGUucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5jYW5jZWxhYmxlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIG9yaWdQcmV2ZW50RGVmYXVsdC5jYWxsKHRoaXMpO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZGVmYXVsdFByZXZlbnRlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuICB2YXIgaXNJRSA9IC9UcmlkZW50Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICBpZiAoIXdpbmRvdy5DdXN0b21FdmVudCB8fCBpc0lFICYmIHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHdpbmRvdy5DdXN0b21FdmVudCA9IGZ1bmN0aW9uKGluVHlwZSwgcGFyYW1zKSB7XG4gICAgICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG4gICAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiQ3VzdG9tRXZlbnRcIik7XG4gICAgICBlLmluaXRDdXN0b21FdmVudChpblR5cGUsIEJvb2xlYW4ocGFyYW1zLmJ1YmJsZXMpLCBCb29sZWFuKHBhcmFtcy5jYW5jZWxhYmxlKSwgcGFyYW1zLmRldGFpbCk7XG4gICAgICByZXR1cm4gZTtcbiAgICB9O1xuICAgIHdpbmRvdy5DdXN0b21FdmVudC5wcm90b3R5cGUgPSB3aW5kb3cuRXZlbnQucHJvdG90eXBlO1xuICB9XG4gIGlmICghd2luZG93LkV2ZW50IHx8IGlzSUUgJiYgdHlwZW9mIHdpbmRvdy5FdmVudCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdmFyIG9yaWdFdmVudCA9IHdpbmRvdy5FdmVudDtcbiAgICB3aW5kb3cuRXZlbnQgPSBmdW5jdGlvbihpblR5cGUsIHBhcmFtcykge1xuICAgICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkV2ZW50XCIpO1xuICAgICAgZS5pbml0RXZlbnQoaW5UeXBlLCBCb29sZWFuKHBhcmFtcy5idWJibGVzKSwgQm9vbGVhbihwYXJhbXMuY2FuY2VsYWJsZSkpO1xuICAgICAgcmV0dXJuIGU7XG4gICAgfTtcbiAgICB3aW5kb3cuRXZlbnQucHJvdG90eXBlID0gb3JpZ0V2ZW50LnByb3RvdHlwZTtcbiAgfVxufSkod2luZG93LldlYkNvbXBvbmVudHMpO1xuXG53aW5kb3cuSFRNTEltcG9ydHMgPSB3aW5kb3cuSFRNTEltcG9ydHMgfHwge1xuICBmbGFnczoge31cbn07XG5cbihmdW5jdGlvbihzY29wZSkge1xuICB2YXIgSU1QT1JUX0xJTktfVFlQRSA9IFwiaW1wb3J0XCI7XG4gIHZhciB1c2VOYXRpdmUgPSBCb29sZWFuKElNUE9SVF9MSU5LX1RZUEUgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpbmtcIikpO1xuICB2YXIgaGFzU2hhZG93RE9NUG9seWZpbGwgPSBCb29sZWFuKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIHZhciB3cmFwID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHJldHVybiBoYXNTaGFkb3dET01Qb2x5ZmlsbCA/IHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbC53cmFwSWZOZWVkZWQobm9kZSkgOiBub2RlO1xuICB9O1xuICB2YXIgcm9vdERvY3VtZW50ID0gd3JhcChkb2N1bWVudCk7XG4gIHZhciBjdXJyZW50U2NyaXB0RGVzY3JpcHRvciA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNjcmlwdCA9IHdpbmRvdy5IVE1MSW1wb3J0cy5jdXJyZW50U2NyaXB0IHx8IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQgfHwgKGRvY3VtZW50LnJlYWR5U3RhdGUgIT09IFwiY29tcGxldGVcIiA/IGRvY3VtZW50LnNjcmlwdHNbZG9jdW1lbnQuc2NyaXB0cy5sZW5ndGggLSAxXSA6IG51bGwpO1xuICAgICAgcmV0dXJuIHdyYXAoc2NyaXB0KTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9O1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZG9jdW1lbnQsIFwiX2N1cnJlbnRTY3JpcHRcIiwgY3VycmVudFNjcmlwdERlc2NyaXB0b3IpO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocm9vdERvY3VtZW50LCBcIl9jdXJyZW50U2NyaXB0XCIsIGN1cnJlbnRTY3JpcHREZXNjcmlwdG9yKTtcbiAgdmFyIGlzSUUgPSAvVHJpZGVudC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgZnVuY3Rpb24gd2hlblJlYWR5KGNhbGxiYWNrLCBkb2MpIHtcbiAgICBkb2MgPSBkb2MgfHwgcm9vdERvY3VtZW50O1xuICAgIHdoZW5Eb2N1bWVudFJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgd2F0Y2hJbXBvcnRzTG9hZChjYWxsYmFjaywgZG9jKTtcbiAgICB9LCBkb2MpO1xuICB9XG4gIHZhciByZXF1aXJlZFJlYWR5U3RhdGUgPSBpc0lFID8gXCJjb21wbGV0ZVwiIDogXCJpbnRlcmFjdGl2ZVwiO1xuICB2YXIgUkVBRFlfRVZFTlQgPSBcInJlYWR5c3RhdGVjaGFuZ2VcIjtcbiAgZnVuY3Rpb24gaXNEb2N1bWVudFJlYWR5KGRvYykge1xuICAgIHJldHVybiBkb2MucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiIHx8IGRvYy5yZWFkeVN0YXRlID09PSByZXF1aXJlZFJlYWR5U3RhdGU7XG4gIH1cbiAgZnVuY3Rpb24gd2hlbkRvY3VtZW50UmVhZHkoY2FsbGJhY2ssIGRvYykge1xuICAgIGlmICghaXNEb2N1bWVudFJlYWR5KGRvYykpIHtcbiAgICAgIHZhciBjaGVja1JlYWR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChkb2MucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiIHx8IGRvYy5yZWFkeVN0YXRlID09PSByZXF1aXJlZFJlYWR5U3RhdGUpIHtcbiAgICAgICAgICBkb2MucmVtb3ZlRXZlbnRMaXN0ZW5lcihSRUFEWV9FVkVOVCwgY2hlY2tSZWFkeSk7XG4gICAgICAgICAgd2hlbkRvY3VtZW50UmVhZHkoY2FsbGJhY2ssIGRvYyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lcihSRUFEWV9FVkVOVCwgY2hlY2tSZWFkeSk7XG4gICAgfSBlbHNlIGlmIChjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbWFya1RhcmdldExvYWRlZChldmVudCkge1xuICAgIGV2ZW50LnRhcmdldC5fX2xvYWRlZCA9IHRydWU7XG4gIH1cbiAgZnVuY3Rpb24gd2F0Y2hJbXBvcnRzTG9hZChjYWxsYmFjaywgZG9jKSB7XG4gICAgdmFyIGltcG9ydHMgPSBkb2MucXVlcnlTZWxlY3RvckFsbChcImxpbmtbcmVsPWltcG9ydF1cIik7XG4gICAgdmFyIHBhcnNlZENvdW50ID0gMCwgaW1wb3J0Q291bnQgPSBpbXBvcnRzLmxlbmd0aCwgbmV3SW1wb3J0cyA9IFtdLCBlcnJvckltcG9ydHMgPSBbXTtcbiAgICBmdW5jdGlvbiBjaGVja0RvbmUoKSB7XG4gICAgICBpZiAocGFyc2VkQ291bnQgPT0gaW1wb3J0Q291bnQgJiYgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soe1xuICAgICAgICAgIGFsbEltcG9ydHM6IGltcG9ydHMsXG4gICAgICAgICAgbG9hZGVkSW1wb3J0czogbmV3SW1wb3J0cyxcbiAgICAgICAgICBlcnJvckltcG9ydHM6IGVycm9ySW1wb3J0c1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gbG9hZGVkSW1wb3J0KGUpIHtcbiAgICAgIG1hcmtUYXJnZXRMb2FkZWQoZSk7XG4gICAgICBuZXdJbXBvcnRzLnB1c2godGhpcyk7XG4gICAgICBwYXJzZWRDb3VudCsrO1xuICAgICAgY2hlY2tEb25lKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVycm9yTG9hZGluZ0ltcG9ydChlKSB7XG4gICAgICBlcnJvckltcG9ydHMucHVzaCh0aGlzKTtcbiAgICAgIHBhcnNlZENvdW50Kys7XG4gICAgICBjaGVja0RvbmUoKTtcbiAgICB9XG4gICAgaWYgKGltcG9ydENvdW50KSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgaW1wOyBpIDwgaW1wb3J0Q291bnQgJiYgKGltcCA9IGltcG9ydHNbaV0pOyBpKyspIHtcbiAgICAgICAgaWYgKGlzSW1wb3J0TG9hZGVkKGltcCkpIHtcbiAgICAgICAgICBuZXdJbXBvcnRzLnB1c2godGhpcyk7XG4gICAgICAgICAgcGFyc2VkQ291bnQrKztcbiAgICAgICAgICBjaGVja0RvbmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbXAuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgbG9hZGVkSW1wb3J0KTtcbiAgICAgICAgICBpbXAuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIGVycm9yTG9hZGluZ0ltcG9ydCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY2hlY2tEb25lKCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGlzSW1wb3J0TG9hZGVkKGxpbmspIHtcbiAgICByZXR1cm4gdXNlTmF0aXZlID8gbGluay5fX2xvYWRlZCB8fCBsaW5rLmltcG9ydCAmJiBsaW5rLmltcG9ydC5yZWFkeVN0YXRlICE9PSBcImxvYWRpbmdcIiA6IGxpbmsuX19pbXBvcnRQYXJzZWQ7XG4gIH1cbiAgaWYgKHVzZU5hdGl2ZSkge1xuICAgIG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG14bnMpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbXhucy5sZW5ndGgsIG07IGkgPCBsICYmIChtID0gbXhuc1tpXSk7IGkrKykge1xuICAgICAgICBpZiAobS5hZGRlZE5vZGVzKSB7XG4gICAgICAgICAgaGFuZGxlSW1wb3J0cyhtLmFkZGVkTm9kZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkub2JzZXJ2ZShkb2N1bWVudC5oZWFkLCB7XG4gICAgICBjaGlsZExpc3Q6IHRydWVcbiAgICB9KTtcbiAgICBmdW5jdGlvbiBoYW5kbGVJbXBvcnRzKG5vZGVzKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5vZGVzLmxlbmd0aCwgbjsgaSA8IGwgJiYgKG4gPSBub2Rlc1tpXSk7IGkrKykge1xuICAgICAgICBpZiAoaXNJbXBvcnQobikpIHtcbiAgICAgICAgICBoYW5kbGVJbXBvcnQobik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gaXNJbXBvcnQoZWxlbWVudCkge1xuICAgICAgcmV0dXJuIGVsZW1lbnQubG9jYWxOYW1lID09PSBcImxpbmtcIiAmJiBlbGVtZW50LnJlbCA9PT0gXCJpbXBvcnRcIjtcbiAgICB9XG4gICAgZnVuY3Rpb24gaGFuZGxlSW1wb3J0KGVsZW1lbnQpIHtcbiAgICAgIHZhciBsb2FkZWQgPSBlbGVtZW50LmltcG9ydDtcbiAgICAgIGlmIChsb2FkZWQpIHtcbiAgICAgICAgbWFya1RhcmdldExvYWRlZCh7XG4gICAgICAgICAgdGFyZ2V0OiBlbGVtZW50XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBtYXJrVGFyZ2V0TG9hZGVkKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgbWFya1RhcmdldExvYWRlZCk7XG4gICAgICB9XG4gICAgfVxuICAgIChmdW5jdGlvbigpIHtcbiAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImxvYWRpbmdcIikge1xuICAgICAgICB2YXIgaW1wb3J0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJsaW5rW3JlbD1pbXBvcnRdXCIpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGltcG9ydHMubGVuZ3RoLCBpbXA7IGkgPCBsICYmIChpbXAgPSBpbXBvcnRzW2ldKTsgaSsrKSB7XG4gICAgICAgICAgaGFuZGxlSW1wb3J0KGltcCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSgpO1xuICB9XG4gIHdoZW5SZWFkeShmdW5jdGlvbihkZXRhaWwpIHtcbiAgICB3aW5kb3cuSFRNTEltcG9ydHMucmVhZHkgPSB0cnVlO1xuICAgIHdpbmRvdy5IVE1MSW1wb3J0cy5yZWFkeVRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB2YXIgZXZ0ID0gcm9vdERvY3VtZW50LmNyZWF0ZUV2ZW50KFwiQ3VzdG9tRXZlbnRcIik7XG4gICAgZXZ0LmluaXRDdXN0b21FdmVudChcIkhUTUxJbXBvcnRzTG9hZGVkXCIsIHRydWUsIHRydWUsIGRldGFpbCk7XG4gICAgcm9vdERvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAgfSk7XG4gIHNjb3BlLklNUE9SVF9MSU5LX1RZUEUgPSBJTVBPUlRfTElOS19UWVBFO1xuICBzY29wZS51c2VOYXRpdmUgPSB1c2VOYXRpdmU7XG4gIHNjb3BlLnJvb3REb2N1bWVudCA9IHJvb3REb2N1bWVudDtcbiAgc2NvcGUud2hlblJlYWR5ID0gd2hlblJlYWR5O1xuICBzY29wZS5pc0lFID0gaXNJRTtcbn0pKHdpbmRvdy5IVE1MSW1wb3J0cyk7XG5cbihmdW5jdGlvbihzY29wZSkge1xuICB2YXIgbW9kdWxlcyA9IFtdO1xuICB2YXIgYWRkTW9kdWxlID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gICAgbW9kdWxlcy5wdXNoKG1vZHVsZSk7XG4gIH07XG4gIHZhciBpbml0aWFsaXplTW9kdWxlcyA9IGZ1bmN0aW9uKCkge1xuICAgIG1vZHVsZXMuZm9yRWFjaChmdW5jdGlvbihtb2R1bGUpIHtcbiAgICAgIG1vZHVsZShzY29wZSk7XG4gICAgfSk7XG4gIH07XG4gIHNjb3BlLmFkZE1vZHVsZSA9IGFkZE1vZHVsZTtcbiAgc2NvcGUuaW5pdGlhbGl6ZU1vZHVsZXMgPSBpbml0aWFsaXplTW9kdWxlcztcbn0pKHdpbmRvdy5IVE1MSW1wb3J0cyk7XG5cbndpbmRvdy5IVE1MSW1wb3J0cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIENTU19VUkxfUkVHRVhQID0gLyh1cmxcXCgpKFteKV0qKShcXCkpL2c7XG4gIHZhciBDU1NfSU1QT1JUX1JFR0VYUCA9IC8oQGltcG9ydFtcXHNdKyg/IXVybFxcKCkpKFteO10qKSg7KS9nO1xuICB2YXIgcGF0aCA9IHtcbiAgICByZXNvbHZlVXJsc0luU3R5bGU6IGZ1bmN0aW9uKHN0eWxlLCBsaW5rVXJsKSB7XG4gICAgICB2YXIgZG9jID0gc3R5bGUub3duZXJEb2N1bWVudDtcbiAgICAgIHZhciByZXNvbHZlciA9IGRvYy5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gdGhpcy5yZXNvbHZlVXJsc0luQ3NzVGV4dChzdHlsZS50ZXh0Q29udGVudCwgbGlua1VybCwgcmVzb2x2ZXIpO1xuICAgICAgcmV0dXJuIHN0eWxlO1xuICAgIH0sXG4gICAgcmVzb2x2ZVVybHNJbkNzc1RleHQ6IGZ1bmN0aW9uKGNzc1RleHQsIGxpbmtVcmwsIHVybE9iaikge1xuICAgICAgdmFyIHIgPSB0aGlzLnJlcGxhY2VVcmxzKGNzc1RleHQsIHVybE9iaiwgbGlua1VybCwgQ1NTX1VSTF9SRUdFWFApO1xuICAgICAgciA9IHRoaXMucmVwbGFjZVVybHMociwgdXJsT2JqLCBsaW5rVXJsLCBDU1NfSU1QT1JUX1JFR0VYUCk7XG4gICAgICByZXR1cm4gcjtcbiAgICB9LFxuICAgIHJlcGxhY2VVcmxzOiBmdW5jdGlvbih0ZXh0LCB1cmxPYmosIGxpbmtVcmwsIHJlZ2V4cCkge1xuICAgICAgcmV0dXJuIHRleHQucmVwbGFjZShyZWdleHAsIGZ1bmN0aW9uKG0sIHByZSwgdXJsLCBwb3N0KSB7XG4gICAgICAgIHZhciB1cmxQYXRoID0gdXJsLnJlcGxhY2UoL1tcIiddL2csIFwiXCIpO1xuICAgICAgICBpZiAobGlua1VybCkge1xuICAgICAgICAgIHVybFBhdGggPSBuZXcgVVJMKHVybFBhdGgsIGxpbmtVcmwpLmhyZWY7XG4gICAgICAgIH1cbiAgICAgICAgdXJsT2JqLmhyZWYgPSB1cmxQYXRoO1xuICAgICAgICB1cmxQYXRoID0gdXJsT2JqLmhyZWY7XG4gICAgICAgIHJldHVybiBwcmUgKyBcIidcIiArIHVybFBhdGggKyBcIidcIiArIHBvc3Q7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG4gIHNjb3BlLnBhdGggPSBwYXRoO1xufSk7XG5cbndpbmRvdy5IVE1MSW1wb3J0cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIHhociA9IHtcbiAgICBhc3luYzogdHJ1ZSxcbiAgICBvazogZnVuY3Rpb24ocmVxdWVzdCkge1xuICAgICAgcmV0dXJuIHJlcXVlc3Quc3RhdHVzID49IDIwMCAmJiByZXF1ZXN0LnN0YXR1cyA8IDMwMCB8fCByZXF1ZXN0LnN0YXR1cyA9PT0gMzA0IHx8IHJlcXVlc3Quc3RhdHVzID09PSAwO1xuICAgIH0sXG4gICAgbG9hZDogZnVuY3Rpb24odXJsLCBuZXh0LCBuZXh0Q29udGV4dCkge1xuICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIGlmIChzY29wZS5mbGFncy5kZWJ1ZyB8fCBzY29wZS5mbGFncy5idXN0KSB7XG4gICAgICAgIHVybCArPSBcIj9cIiArIE1hdGgucmFuZG9tKCk7XG4gICAgICB9XG4gICAgICByZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgdXJsLCB4aHIuYXN5bmMpO1xuICAgICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKFwicmVhZHlzdGF0ZWNoYW5nZVwiLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICB2YXIgcmVkaXJlY3RlZFVybCA9IG51bGw7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbkhlYWRlciA9IHJlcXVlc3QuZ2V0UmVzcG9uc2VIZWFkZXIoXCJMb2NhdGlvblwiKTtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbkhlYWRlcikge1xuICAgICAgICAgICAgICByZWRpcmVjdGVkVXJsID0gbG9jYXRpb25IZWFkZXIuc3Vic3RyKDAsIDEpID09PSBcIi9cIiA/IGxvY2F0aW9uLm9yaWdpbiArIGxvY2F0aW9uSGVhZGVyIDogbG9jYXRpb25IZWFkZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZXh0LmNhbGwobmV4dENvbnRleHQsICF4aHIub2socmVxdWVzdCkgJiYgcmVxdWVzdCwgcmVxdWVzdC5yZXNwb25zZSB8fCByZXF1ZXN0LnJlc3BvbnNlVGV4dCwgcmVkaXJlY3RlZFVybCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICB9LFxuICAgIGxvYWREb2N1bWVudDogZnVuY3Rpb24odXJsLCBuZXh0LCBuZXh0Q29udGV4dCkge1xuICAgICAgdGhpcy5sb2FkKHVybCwgbmV4dCwgbmV4dENvbnRleHQpLnJlc3BvbnNlVHlwZSA9IFwiZG9jdW1lbnRcIjtcbiAgICB9XG4gIH07XG4gIHNjb3BlLnhociA9IHhocjtcbn0pO1xuXG53aW5kb3cuSFRNTEltcG9ydHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciB4aHIgPSBzY29wZS54aHI7XG4gIHZhciBmbGFncyA9IHNjb3BlLmZsYWdzO1xuICB2YXIgTG9hZGVyID0gZnVuY3Rpb24ob25Mb2FkLCBvbkNvbXBsZXRlKSB7XG4gICAgdGhpcy5jYWNoZSA9IHt9O1xuICAgIHRoaXMub25sb2FkID0gb25Mb2FkO1xuICAgIHRoaXMub25jb21wbGV0ZSA9IG9uQ29tcGxldGU7XG4gICAgdGhpcy5pbmZsaWdodCA9IDA7XG4gICAgdGhpcy5wZW5kaW5nID0ge307XG4gIH07XG4gIExvYWRlci5wcm90b3R5cGUgPSB7XG4gICAgYWRkTm9kZXM6IGZ1bmN0aW9uKG5vZGVzKSB7XG4gICAgICB0aGlzLmluZmxpZ2h0ICs9IG5vZGVzLmxlbmd0aDtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbm9kZXMubGVuZ3RoLCBuOyBpIDwgbCAmJiAobiA9IG5vZGVzW2ldKTsgaSsrKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZShuKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY2hlY2tEb25lKCk7XG4gICAgfSxcbiAgICBhZGROb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICB0aGlzLmluZmxpZ2h0Kys7XG4gICAgICB0aGlzLnJlcXVpcmUobm9kZSk7XG4gICAgICB0aGlzLmNoZWNrRG9uZSgpO1xuICAgIH0sXG4gICAgcmVxdWlyZTogZnVuY3Rpb24oZWx0KSB7XG4gICAgICB2YXIgdXJsID0gZWx0LnNyYyB8fCBlbHQuaHJlZjtcbiAgICAgIGVsdC5fX25vZGVVcmwgPSB1cmw7XG4gICAgICBpZiAoIXRoaXMuZGVkdXBlKHVybCwgZWx0KSkge1xuICAgICAgICB0aGlzLmZldGNoKHVybCwgZWx0KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGRlZHVwZTogZnVuY3Rpb24odXJsLCBlbHQpIHtcbiAgICAgIGlmICh0aGlzLnBlbmRpbmdbdXJsXSkge1xuICAgICAgICB0aGlzLnBlbmRpbmdbdXJsXS5wdXNoKGVsdCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdmFyIHJlc291cmNlO1xuICAgICAgaWYgKHRoaXMuY2FjaGVbdXJsXSkge1xuICAgICAgICB0aGlzLm9ubG9hZCh1cmwsIGVsdCwgdGhpcy5jYWNoZVt1cmxdKTtcbiAgICAgICAgdGhpcy50YWlsKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5wZW5kaW5nW3VybF0gPSBbIGVsdCBdO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG4gICAgZmV0Y2g6IGZ1bmN0aW9uKHVybCwgZWx0KSB7XG4gICAgICBmbGFncy5sb2FkICYmIGNvbnNvbGUubG9nKFwiZmV0Y2hcIiwgdXJsLCBlbHQpO1xuICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICB0aGlzLnJlY2VpdmUodXJsLCBlbHQsIHtcbiAgICAgICAgICAgIGVycm9yOiBcImhyZWYgbXVzdCBiZSBzcGVjaWZpZWRcIlxuICAgICAgICAgIH0sIG51bGwpO1xuICAgICAgICB9LmJpbmQodGhpcyksIDApO1xuICAgICAgfSBlbHNlIGlmICh1cmwubWF0Y2goL15kYXRhOi8pKSB7XG4gICAgICAgIHZhciBwaWVjZXMgPSB1cmwuc3BsaXQoXCIsXCIpO1xuICAgICAgICB2YXIgaGVhZGVyID0gcGllY2VzWzBdO1xuICAgICAgICB2YXIgYm9keSA9IHBpZWNlc1sxXTtcbiAgICAgICAgaWYgKGhlYWRlci5pbmRleE9mKFwiO2Jhc2U2NFwiKSA+IC0xKSB7XG4gICAgICAgICAgYm9keSA9IGF0b2IoYm9keSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYm9keSA9IGRlY29kZVVSSUNvbXBvbmVudChib2R5KTtcbiAgICAgICAgfVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRoaXMucmVjZWl2ZSh1cmwsIGVsdCwgbnVsbCwgYm9keSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSwgMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcmVjZWl2ZVhociA9IGZ1bmN0aW9uKGVyciwgcmVzb3VyY2UsIHJlZGlyZWN0ZWRVcmwpIHtcbiAgICAgICAgICB0aGlzLnJlY2VpdmUodXJsLCBlbHQsIGVyciwgcmVzb3VyY2UsIHJlZGlyZWN0ZWRVcmwpO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgIHhoci5sb2FkKHVybCwgcmVjZWl2ZVhocik7XG4gICAgICB9XG4gICAgfSxcbiAgICByZWNlaXZlOiBmdW5jdGlvbih1cmwsIGVsdCwgZXJyLCByZXNvdXJjZSwgcmVkaXJlY3RlZFVybCkge1xuICAgICAgdGhpcy5jYWNoZVt1cmxdID0gcmVzb3VyY2U7XG4gICAgICB2YXIgJHAgPSB0aGlzLnBlbmRpbmdbdXJsXTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gJHAubGVuZ3RoLCBwOyBpIDwgbCAmJiAocCA9ICRwW2ldKTsgaSsrKSB7XG4gICAgICAgIHRoaXMub25sb2FkKHVybCwgcCwgcmVzb3VyY2UsIGVyciwgcmVkaXJlY3RlZFVybCk7XG4gICAgICAgIHRoaXMudGFpbCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5wZW5kaW5nW3VybF0gPSBudWxsO1xuICAgIH0sXG4gICAgdGFpbDogZnVuY3Rpb24oKSB7XG4gICAgICAtLXRoaXMuaW5mbGlnaHQ7XG4gICAgICB0aGlzLmNoZWNrRG9uZSgpO1xuICAgIH0sXG4gICAgY2hlY2tEb25lOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5pbmZsaWdodCkge1xuICAgICAgICB0aGlzLm9uY29tcGxldGUoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHNjb3BlLkxvYWRlciA9IExvYWRlcjtcbn0pO1xuXG53aW5kb3cuSFRNTEltcG9ydHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBPYnNlcnZlciA9IGZ1bmN0aW9uKGFkZENhbGxiYWNrKSB7XG4gICAgdGhpcy5hZGRDYWxsYmFjayA9IGFkZENhbGxiYWNrO1xuICAgIHRoaXMubW8gPSBuZXcgTXV0YXRpb25PYnNlcnZlcih0aGlzLmhhbmRsZXIuYmluZCh0aGlzKSk7XG4gIH07XG4gIE9ic2VydmVyLnByb3RvdHlwZSA9IHtcbiAgICBoYW5kbGVyOiBmdW5jdGlvbihtdXRhdGlvbnMpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbXV0YXRpb25zLmxlbmd0aCwgbTsgaSA8IGwgJiYgKG0gPSBtdXRhdGlvbnNbaV0pOyBpKyspIHtcbiAgICAgICAgaWYgKG0udHlwZSA9PT0gXCJjaGlsZExpc3RcIiAmJiBtLmFkZGVkTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5hZGRlZE5vZGVzKG0uYWRkZWROb2Rlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGFkZGVkTm9kZXM6IGZ1bmN0aW9uKG5vZGVzKSB7XG4gICAgICBpZiAodGhpcy5hZGRDYWxsYmFjaykge1xuICAgICAgICB0aGlzLmFkZENhbGxiYWNrKG5vZGVzKTtcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbm9kZXMubGVuZ3RoLCBuLCBsb2FkaW5nOyBpIDwgbCAmJiAobiA9IG5vZGVzW2ldKTsgaSsrKSB7XG4gICAgICAgIGlmIChuLmNoaWxkcmVuICYmIG4uY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5hZGRlZE5vZGVzKG4uY2hpbGRyZW4pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBvYnNlcnZlOiBmdW5jdGlvbihyb290KSB7XG4gICAgICB0aGlzLm1vLm9ic2VydmUocm9vdCwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgc2NvcGUuT2JzZXJ2ZXIgPSBPYnNlcnZlcjtcbn0pO1xuXG53aW5kb3cuSFRNTEltcG9ydHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBwYXRoID0gc2NvcGUucGF0aDtcbiAgdmFyIHJvb3REb2N1bWVudCA9IHNjb3BlLnJvb3REb2N1bWVudDtcbiAgdmFyIGZsYWdzID0gc2NvcGUuZmxhZ3M7XG4gIHZhciBpc0lFID0gc2NvcGUuaXNJRTtcbiAgdmFyIElNUE9SVF9MSU5LX1RZUEUgPSBzY29wZS5JTVBPUlRfTElOS19UWVBFO1xuICB2YXIgSU1QT1JUX1NFTEVDVE9SID0gXCJsaW5rW3JlbD1cIiArIElNUE9SVF9MSU5LX1RZUEUgKyBcIl1cIjtcbiAgdmFyIGltcG9ydFBhcnNlciA9IHtcbiAgICBkb2N1bWVudFNlbGVjdG9yczogSU1QT1JUX1NFTEVDVE9SLFxuICAgIGltcG9ydHNTZWxlY3RvcnM6IFsgSU1QT1JUX1NFTEVDVE9SLCBcImxpbmtbcmVsPXN0eWxlc2hlZXRdOm5vdChbdHlwZV0pXCIsIFwic3R5bGU6bm90KFt0eXBlXSlcIiwgXCJzY3JpcHQ6bm90KFt0eXBlXSlcIiwgJ3NjcmlwdFt0eXBlPVwiYXBwbGljYXRpb24vamF2YXNjcmlwdFwiXScsICdzY3JpcHRbdHlwZT1cInRleHQvamF2YXNjcmlwdFwiXScgXS5qb2luKFwiLFwiKSxcbiAgICBtYXA6IHtcbiAgICAgIGxpbms6IFwicGFyc2VMaW5rXCIsXG4gICAgICBzY3JpcHQ6IFwicGFyc2VTY3JpcHRcIixcbiAgICAgIHN0eWxlOiBcInBhcnNlU3R5bGVcIlxuICAgIH0sXG4gICAgZHluYW1pY0VsZW1lbnRzOiBbXSxcbiAgICBwYXJzZU5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5leHQgPSB0aGlzLm5leHRUb1BhcnNlKCk7XG4gICAgICBpZiAobmV4dCkge1xuICAgICAgICB0aGlzLnBhcnNlKG5leHQpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFyc2U6IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgaWYgKHRoaXMuaXNQYXJzZWQoZWx0KSkge1xuICAgICAgICBmbGFncy5wYXJzZSAmJiBjb25zb2xlLmxvZyhcIlslc10gaXMgYWxyZWFkeSBwYXJzZWRcIiwgZWx0LmxvY2FsTmFtZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBmbiA9IHRoaXNbdGhpcy5tYXBbZWx0LmxvY2FsTmFtZV1dO1xuICAgICAgaWYgKGZuKSB7XG4gICAgICAgIHRoaXMubWFya1BhcnNpbmcoZWx0KTtcbiAgICAgICAgZm4uY2FsbCh0aGlzLCBlbHQpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFyc2VEeW5hbWljOiBmdW5jdGlvbihlbHQsIHF1aWV0KSB7XG4gICAgICB0aGlzLmR5bmFtaWNFbGVtZW50cy5wdXNoKGVsdCk7XG4gICAgICBpZiAoIXF1aWV0KSB7XG4gICAgICAgIHRoaXMucGFyc2VOZXh0KCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBtYXJrUGFyc2luZzogZnVuY3Rpb24oZWx0KSB7XG4gICAgICBmbGFncy5wYXJzZSAmJiBjb25zb2xlLmxvZyhcInBhcnNpbmdcIiwgZWx0KTtcbiAgICAgIHRoaXMucGFyc2luZ0VsZW1lbnQgPSBlbHQ7XG4gICAgfSxcbiAgICBtYXJrUGFyc2luZ0NvbXBsZXRlOiBmdW5jdGlvbihlbHQpIHtcbiAgICAgIGVsdC5fX2ltcG9ydFBhcnNlZCA9IHRydWU7XG4gICAgICB0aGlzLm1hcmtEeW5hbWljUGFyc2luZ0NvbXBsZXRlKGVsdCk7XG4gICAgICBpZiAoZWx0Ll9faW1wb3J0RWxlbWVudCkge1xuICAgICAgICBlbHQuX19pbXBvcnRFbGVtZW50Ll9faW1wb3J0UGFyc2VkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5tYXJrRHluYW1pY1BhcnNpbmdDb21wbGV0ZShlbHQuX19pbXBvcnRFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGFyc2luZ0VsZW1lbnQgPSBudWxsO1xuICAgICAgZmxhZ3MucGFyc2UgJiYgY29uc29sZS5sb2coXCJjb21wbGV0ZWRcIiwgZWx0KTtcbiAgICB9LFxuICAgIG1hcmtEeW5hbWljUGFyc2luZ0NvbXBsZXRlOiBmdW5jdGlvbihlbHQpIHtcbiAgICAgIHZhciBpID0gdGhpcy5keW5hbWljRWxlbWVudHMuaW5kZXhPZihlbHQpO1xuICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICB0aGlzLmR5bmFtaWNFbGVtZW50cy5zcGxpY2UoaSwgMSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBwYXJzZUltcG9ydDogZnVuY3Rpb24oZWx0KSB7XG4gICAgICBlbHQuaW1wb3J0ID0gZWx0Ll9fZG9jO1xuICAgICAgaWYgKHdpbmRvdy5IVE1MSW1wb3J0cy5fX2ltcG9ydHNQYXJzaW5nSG9vaykge1xuICAgICAgICB3aW5kb3cuSFRNTEltcG9ydHMuX19pbXBvcnRzUGFyc2luZ0hvb2soZWx0KTtcbiAgICAgIH1cbiAgICAgIGlmIChlbHQuaW1wb3J0KSB7XG4gICAgICAgIGVsdC5pbXBvcnQuX19pbXBvcnRQYXJzZWQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5tYXJrUGFyc2luZ0NvbXBsZXRlKGVsdCk7XG4gICAgICBpZiAoZWx0Ll9fcmVzb3VyY2UgJiYgIWVsdC5fX2Vycm9yKSB7XG4gICAgICAgIGVsdC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImxvYWRcIiwge1xuICAgICAgICAgIGJ1YmJsZXM6IGZhbHNlXG4gICAgICAgIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsdC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImVycm9yXCIsIHtcbiAgICAgICAgICBidWJibGVzOiBmYWxzZVxuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICBpZiAoZWx0Ll9fcGVuZGluZykge1xuICAgICAgICB2YXIgZm47XG4gICAgICAgIHdoaWxlIChlbHQuX19wZW5kaW5nLmxlbmd0aCkge1xuICAgICAgICAgIGZuID0gZWx0Ll9fcGVuZGluZy5zaGlmdCgpO1xuICAgICAgICAgIGlmIChmbikge1xuICAgICAgICAgICAgZm4oe1xuICAgICAgICAgICAgICB0YXJnZXQ6IGVsdFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnBhcnNlTmV4dCgpO1xuICAgIH0sXG4gICAgcGFyc2VMaW5rOiBmdW5jdGlvbihsaW5rRWx0KSB7XG4gICAgICBpZiAobm9kZUlzSW1wb3J0KGxpbmtFbHQpKSB7XG4gICAgICAgIHRoaXMucGFyc2VJbXBvcnQobGlua0VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaW5rRWx0LmhyZWYgPSBsaW5rRWx0LmhyZWY7XG4gICAgICAgIHRoaXMucGFyc2VHZW5lcmljKGxpbmtFbHQpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFyc2VTdHlsZTogZnVuY3Rpb24oZWx0KSB7XG4gICAgICB2YXIgc3JjID0gZWx0O1xuICAgICAgZWx0ID0gY2xvbmVTdHlsZShlbHQpO1xuICAgICAgc3JjLl9fYXBwbGllZEVsZW1lbnQgPSBlbHQ7XG4gICAgICBlbHQuX19pbXBvcnRFbGVtZW50ID0gc3JjO1xuICAgICAgdGhpcy5wYXJzZUdlbmVyaWMoZWx0KTtcbiAgICB9LFxuICAgIHBhcnNlR2VuZXJpYzogZnVuY3Rpb24oZWx0KSB7XG4gICAgICB0aGlzLnRyYWNrRWxlbWVudChlbHQpO1xuICAgICAgdGhpcy5hZGRFbGVtZW50VG9Eb2N1bWVudChlbHQpO1xuICAgIH0sXG4gICAgcm9vdEltcG9ydEZvckVsZW1lbnQ6IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgdmFyIG4gPSBlbHQ7XG4gICAgICB3aGlsZSAobi5vd25lckRvY3VtZW50Ll9faW1wb3J0TGluaykge1xuICAgICAgICBuID0gbi5vd25lckRvY3VtZW50Ll9faW1wb3J0TGluaztcbiAgICAgIH1cbiAgICAgIHJldHVybiBuO1xuICAgIH0sXG4gICAgYWRkRWxlbWVudFRvRG9jdW1lbnQ6IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgdmFyIHBvcnQgPSB0aGlzLnJvb3RJbXBvcnRGb3JFbGVtZW50KGVsdC5fX2ltcG9ydEVsZW1lbnQgfHwgZWx0KTtcbiAgICAgIHBvcnQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWx0LCBwb3J0KTtcbiAgICB9LFxuICAgIHRyYWNrRWxlbWVudDogZnVuY3Rpb24oZWx0LCBjYWxsYmFjaykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGRvbmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGVsdC5yZW1vdmVFdmVudExpc3RlbmVyKFwibG9hZFwiLCBkb25lKTtcbiAgICAgICAgZWx0LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCBkb25lKTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgY2FsbGJhY2soZSk7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5tYXJrUGFyc2luZ0NvbXBsZXRlKGVsdCk7XG4gICAgICAgIHNlbGYucGFyc2VOZXh0KCk7XG4gICAgICB9O1xuICAgICAgZWx0LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGRvbmUpO1xuICAgICAgZWx0LmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCBkb25lKTtcbiAgICAgIGlmIChpc0lFICYmIGVsdC5sb2NhbE5hbWUgPT09IFwic3R5bGVcIikge1xuICAgICAgICB2YXIgZmFrZUxvYWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKGVsdC50ZXh0Q29udGVudC5pbmRleE9mKFwiQGltcG9ydFwiKSA9PSAtMSkge1xuICAgICAgICAgIGZha2VMb2FkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChlbHQuc2hlZXQpIHtcbiAgICAgICAgICBmYWtlTG9hZCA9IHRydWU7XG4gICAgICAgICAgdmFyIGNzciA9IGVsdC5zaGVldC5jc3NSdWxlcztcbiAgICAgICAgICB2YXIgbGVuID0gY3NyID8gY3NyLmxlbmd0aCA6IDA7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCBsZW4gJiYgKHIgPSBjc3JbaV0pOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChyLnR5cGUgPT09IENTU1J1bGUuSU1QT1JUX1JVTEUpIHtcbiAgICAgICAgICAgICAgZmFrZUxvYWQgPSBmYWtlTG9hZCAmJiBCb29sZWFuKHIuc3R5bGVTaGVldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChmYWtlTG9hZCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBlbHQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJsb2FkXCIsIHtcbiAgICAgICAgICAgICAgYnViYmxlczogZmFsc2VcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgcGFyc2VTY3JpcHQ6IGZ1bmN0aW9uKHNjcmlwdEVsdCkge1xuICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG4gICAgICBzY3JpcHQuX19pbXBvcnRFbGVtZW50ID0gc2NyaXB0RWx0O1xuICAgICAgc2NyaXB0LnNyYyA9IHNjcmlwdEVsdC5zcmMgPyBzY3JpcHRFbHQuc3JjIDogZ2VuZXJhdGVTY3JpcHREYXRhVXJsKHNjcmlwdEVsdCk7XG4gICAgICBzY29wZS5jdXJyZW50U2NyaXB0ID0gc2NyaXB0RWx0O1xuICAgICAgdGhpcy50cmFja0VsZW1lbnQoc2NyaXB0LCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChzY3JpcHQucGFyZW50Tm9kZSkge1xuICAgICAgICAgIHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XG4gICAgICAgIH1cbiAgICAgICAgc2NvcGUuY3VycmVudFNjcmlwdCA9IG51bGw7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuYWRkRWxlbWVudFRvRG9jdW1lbnQoc2NyaXB0KTtcbiAgICB9LFxuICAgIG5leHRUb1BhcnNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX21heVBhcnNlID0gW107XG4gICAgICByZXR1cm4gIXRoaXMucGFyc2luZ0VsZW1lbnQgJiYgKHRoaXMubmV4dFRvUGFyc2VJbkRvYyhyb290RG9jdW1lbnQpIHx8IHRoaXMubmV4dFRvUGFyc2VEeW5hbWljKCkpO1xuICAgIH0sXG4gICAgbmV4dFRvUGFyc2VJbkRvYzogZnVuY3Rpb24oZG9jLCBsaW5rKSB7XG4gICAgICBpZiAoZG9jICYmIHRoaXMuX21heVBhcnNlLmluZGV4T2YoZG9jKSA8IDApIHtcbiAgICAgICAgdGhpcy5fbWF5UGFyc2UucHVzaChkb2MpO1xuICAgICAgICB2YXIgbm9kZXMgPSBkb2MucXVlcnlTZWxlY3RvckFsbCh0aGlzLnBhcnNlU2VsZWN0b3JzRm9yTm9kZShkb2MpKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBub2Rlcy5sZW5ndGgsIG47IGkgPCBsICYmIChuID0gbm9kZXNbaV0pOyBpKyspIHtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNQYXJzZWQobikpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhhc1Jlc291cmNlKG4pKSB7XG4gICAgICAgICAgICAgIHJldHVybiBub2RlSXNJbXBvcnQobikgPyB0aGlzLm5leHRUb1BhcnNlSW5Eb2Mobi5fX2RvYywgbikgOiBuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGxpbms7XG4gICAgfSxcbiAgICBuZXh0VG9QYXJzZUR5bmFtaWM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZHluYW1pY0VsZW1lbnRzWzBdO1xuICAgIH0sXG4gICAgcGFyc2VTZWxlY3RvcnNGb3JOb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICB2YXIgZG9jID0gbm9kZS5vd25lckRvY3VtZW50IHx8IG5vZGU7XG4gICAgICByZXR1cm4gZG9jID09PSByb290RG9jdW1lbnQgPyB0aGlzLmRvY3VtZW50U2VsZWN0b3JzIDogdGhpcy5pbXBvcnRzU2VsZWN0b3JzO1xuICAgIH0sXG4gICAgaXNQYXJzZWQ6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlLl9faW1wb3J0UGFyc2VkO1xuICAgIH0sXG4gICAgbmVlZHNEeW5hbWljUGFyc2luZzogZnVuY3Rpb24oZWx0KSB7XG4gICAgICByZXR1cm4gdGhpcy5keW5hbWljRWxlbWVudHMuaW5kZXhPZihlbHQpID49IDA7XG4gICAgfSxcbiAgICBoYXNSZXNvdXJjZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgaWYgKG5vZGVJc0ltcG9ydChub2RlKSAmJiBub2RlLl9fZG9jID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBub2RlSXNJbXBvcnQoZWx0KSB7XG4gICAgcmV0dXJuIGVsdC5sb2NhbE5hbWUgPT09IFwibGlua1wiICYmIGVsdC5yZWwgPT09IElNUE9SVF9MSU5LX1RZUEU7XG4gIH1cbiAgZnVuY3Rpb24gZ2VuZXJhdGVTY3JpcHREYXRhVXJsKHNjcmlwdCkge1xuICAgIHZhciBzY3JpcHRDb250ZW50ID0gZ2VuZXJhdGVTY3JpcHRDb250ZW50KHNjcmlwdCk7XG4gICAgcmV0dXJuIFwiZGF0YTp0ZXh0L2phdmFzY3JpcHQ7Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChzY3JpcHRDb250ZW50KTtcbiAgfVxuICBmdW5jdGlvbiBnZW5lcmF0ZVNjcmlwdENvbnRlbnQoc2NyaXB0KSB7XG4gICAgcmV0dXJuIHNjcmlwdC50ZXh0Q29udGVudCArIGdlbmVyYXRlU291cmNlTWFwSGludChzY3JpcHQpO1xuICB9XG4gIGZ1bmN0aW9uIGdlbmVyYXRlU291cmNlTWFwSGludChzY3JpcHQpIHtcbiAgICB2YXIgb3duZXIgPSBzY3JpcHQub3duZXJEb2N1bWVudDtcbiAgICBvd25lci5fX2ltcG9ydGVkU2NyaXB0cyA9IG93bmVyLl9faW1wb3J0ZWRTY3JpcHRzIHx8IDA7XG4gICAgdmFyIG1vbmlrZXIgPSBzY3JpcHQub3duZXJEb2N1bWVudC5iYXNlVVJJO1xuICAgIHZhciBudW0gPSBvd25lci5fX2ltcG9ydGVkU2NyaXB0cyA/IFwiLVwiICsgb3duZXIuX19pbXBvcnRlZFNjcmlwdHMgOiBcIlwiO1xuICAgIG93bmVyLl9faW1wb3J0ZWRTY3JpcHRzKys7XG4gICAgcmV0dXJuIFwiXFxuLy8jIHNvdXJjZVVSTD1cIiArIG1vbmlrZXIgKyBudW0gKyBcIi5qc1xcblwiO1xuICB9XG4gIGZ1bmN0aW9uIGNsb25lU3R5bGUoc3R5bGUpIHtcbiAgICB2YXIgY2xvbmUgPSBzdHlsZS5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICBjbG9uZS50ZXh0Q29udGVudCA9IHN0eWxlLnRleHRDb250ZW50O1xuICAgIHBhdGgucmVzb2x2ZVVybHNJblN0eWxlKGNsb25lKTtcbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cbiAgc2NvcGUucGFyc2VyID0gaW1wb3J0UGFyc2VyO1xuICBzY29wZS5JTVBPUlRfU0VMRUNUT1IgPSBJTVBPUlRfU0VMRUNUT1I7XG59KTtcblxud2luZG93LkhUTUxJbXBvcnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgZmxhZ3MgPSBzY29wZS5mbGFncztcbiAgdmFyIElNUE9SVF9MSU5LX1RZUEUgPSBzY29wZS5JTVBPUlRfTElOS19UWVBFO1xuICB2YXIgSU1QT1JUX1NFTEVDVE9SID0gc2NvcGUuSU1QT1JUX1NFTEVDVE9SO1xuICB2YXIgcm9vdERvY3VtZW50ID0gc2NvcGUucm9vdERvY3VtZW50O1xuICB2YXIgTG9hZGVyID0gc2NvcGUuTG9hZGVyO1xuICB2YXIgT2JzZXJ2ZXIgPSBzY29wZS5PYnNlcnZlcjtcbiAgdmFyIHBhcnNlciA9IHNjb3BlLnBhcnNlcjtcbiAgdmFyIGltcG9ydGVyID0ge1xuICAgIGRvY3VtZW50czoge30sXG4gICAgZG9jdW1lbnRQcmVsb2FkU2VsZWN0b3JzOiBJTVBPUlRfU0VMRUNUT1IsXG4gICAgaW1wb3J0c1ByZWxvYWRTZWxlY3RvcnM6IFsgSU1QT1JUX1NFTEVDVE9SIF0uam9pbihcIixcIiksXG4gICAgbG9hZE5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIGltcG9ydExvYWRlci5hZGROb2RlKG5vZGUpO1xuICAgIH0sXG4gICAgbG9hZFN1YnRyZWU6IGZ1bmN0aW9uKHBhcmVudCkge1xuICAgICAgdmFyIG5vZGVzID0gdGhpcy5tYXJzaGFsTm9kZXMocGFyZW50KTtcbiAgICAgIGltcG9ydExvYWRlci5hZGROb2Rlcyhub2Rlcyk7XG4gICAgfSxcbiAgICBtYXJzaGFsTm9kZXM6IGZ1bmN0aW9uKHBhcmVudCkge1xuICAgICAgcmV0dXJuIHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMubG9hZFNlbGVjdG9yc0Zvck5vZGUocGFyZW50KSk7XG4gICAgfSxcbiAgICBsb2FkU2VsZWN0b3JzRm9yTm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIGRvYyA9IG5vZGUub3duZXJEb2N1bWVudCB8fCBub2RlO1xuICAgICAgcmV0dXJuIGRvYyA9PT0gcm9vdERvY3VtZW50ID8gdGhpcy5kb2N1bWVudFByZWxvYWRTZWxlY3RvcnMgOiB0aGlzLmltcG9ydHNQcmVsb2FkU2VsZWN0b3JzO1xuICAgIH0sXG4gICAgbG9hZGVkOiBmdW5jdGlvbih1cmwsIGVsdCwgcmVzb3VyY2UsIGVyciwgcmVkaXJlY3RlZFVybCkge1xuICAgICAgZmxhZ3MubG9hZCAmJiBjb25zb2xlLmxvZyhcImxvYWRlZFwiLCB1cmwsIGVsdCk7XG4gICAgICBlbHQuX19yZXNvdXJjZSA9IHJlc291cmNlO1xuICAgICAgZWx0Ll9fZXJyb3IgPSBlcnI7XG4gICAgICBpZiAoaXNJbXBvcnRMaW5rKGVsdCkpIHtcbiAgICAgICAgdmFyIGRvYyA9IHRoaXMuZG9jdW1lbnRzW3VybF07XG4gICAgICAgIGlmIChkb2MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGRvYyA9IGVyciA/IG51bGwgOiBtYWtlRG9jdW1lbnQocmVzb3VyY2UsIHJlZGlyZWN0ZWRVcmwgfHwgdXJsKTtcbiAgICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgICBkb2MuX19pbXBvcnRMaW5rID0gZWx0O1xuICAgICAgICAgICAgdGhpcy5ib290RG9jdW1lbnQoZG9jKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5kb2N1bWVudHNbdXJsXSA9IGRvYztcbiAgICAgICAgfVxuICAgICAgICBlbHQuX19kb2MgPSBkb2M7XG4gICAgICB9XG4gICAgICBwYXJzZXIucGFyc2VOZXh0KCk7XG4gICAgfSxcbiAgICBib290RG9jdW1lbnQ6IGZ1bmN0aW9uKGRvYykge1xuICAgICAgdGhpcy5sb2FkU3VidHJlZShkb2MpO1xuICAgICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKGRvYyk7XG4gICAgICBwYXJzZXIucGFyc2VOZXh0KCk7XG4gICAgfSxcbiAgICBsb2FkZWRBbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgcGFyc2VyLnBhcnNlTmV4dCgpO1xuICAgIH1cbiAgfTtcbiAgdmFyIGltcG9ydExvYWRlciA9IG5ldyBMb2FkZXIoaW1wb3J0ZXIubG9hZGVkLmJpbmQoaW1wb3J0ZXIpLCBpbXBvcnRlci5sb2FkZWRBbGwuYmluZChpbXBvcnRlcikpO1xuICBpbXBvcnRlci5vYnNlcnZlciA9IG5ldyBPYnNlcnZlcigpO1xuICBmdW5jdGlvbiBpc0ltcG9ydExpbmsoZWx0KSB7XG4gICAgcmV0dXJuIGlzTGlua1JlbChlbHQsIElNUE9SVF9MSU5LX1RZUEUpO1xuICB9XG4gIGZ1bmN0aW9uIGlzTGlua1JlbChlbHQsIHJlbCkge1xuICAgIHJldHVybiBlbHQubG9jYWxOYW1lID09PSBcImxpbmtcIiAmJiBlbHQuZ2V0QXR0cmlidXRlKFwicmVsXCIpID09PSByZWw7XG4gIH1cbiAgZnVuY3Rpb24gaGFzQmFzZVVSSUFjY2Vzc29yKGRvYykge1xuICAgIHJldHVybiAhIU9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZG9jLCBcImJhc2VVUklcIik7XG4gIH1cbiAgZnVuY3Rpb24gbWFrZURvY3VtZW50KHJlc291cmNlLCB1cmwpIHtcbiAgICB2YXIgZG9jID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KElNUE9SVF9MSU5LX1RZUEUpO1xuICAgIGRvYy5fVVJMID0gdXJsO1xuICAgIHZhciBiYXNlID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJiYXNlXCIpO1xuICAgIGJhc2Uuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCB1cmwpO1xuICAgIGlmICghZG9jLmJhc2VVUkkgJiYgIWhhc0Jhc2VVUklBY2Nlc3Nvcihkb2MpKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZG9jLCBcImJhc2VVUklcIiwge1xuICAgICAgICB2YWx1ZTogdXJsXG4gICAgICB9KTtcbiAgICB9XG4gICAgdmFyIG1ldGEgPSBkb2MuY3JlYXRlRWxlbWVudChcIm1ldGFcIik7XG4gICAgbWV0YS5zZXRBdHRyaWJ1dGUoXCJjaGFyc2V0XCIsIFwidXRmLThcIik7XG4gICAgZG9jLmhlYWQuYXBwZW5kQ2hpbGQobWV0YSk7XG4gICAgZG9jLmhlYWQuYXBwZW5kQ2hpbGQoYmFzZSk7XG4gICAgZG9jLmJvZHkuaW5uZXJIVE1MID0gcmVzb3VyY2U7XG4gICAgaWYgKHdpbmRvdy5IVE1MVGVtcGxhdGVFbGVtZW50ICYmIEhUTUxUZW1wbGF0ZUVsZW1lbnQuYm9vdHN0cmFwKSB7XG4gICAgICBIVE1MVGVtcGxhdGVFbGVtZW50LmJvb3RzdHJhcChkb2MpO1xuICAgIH1cbiAgICByZXR1cm4gZG9jO1xuICB9XG4gIGlmICghZG9jdW1lbnQuYmFzZVVSSSkge1xuICAgIHZhciBiYXNlVVJJRGVzY3JpcHRvciA9IHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBiYXNlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImJhc2VcIik7XG4gICAgICAgIHJldHVybiBiYXNlID8gYmFzZS5ocmVmIDogd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZG9jdW1lbnQsIFwiYmFzZVVSSVwiLCBiYXNlVVJJRGVzY3JpcHRvcik7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHJvb3REb2N1bWVudCwgXCJiYXNlVVJJXCIsIGJhc2VVUklEZXNjcmlwdG9yKTtcbiAgfVxuICBzY29wZS5pbXBvcnRlciA9IGltcG9ydGVyO1xuICBzY29wZS5pbXBvcnRMb2FkZXIgPSBpbXBvcnRMb2FkZXI7XG59KTtcblxud2luZG93LkhUTUxJbXBvcnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgcGFyc2VyID0gc2NvcGUucGFyc2VyO1xuICB2YXIgaW1wb3J0ZXIgPSBzY29wZS5pbXBvcnRlcjtcbiAgdmFyIGR5bmFtaWMgPSB7XG4gICAgYWRkZWQ6IGZ1bmN0aW9uKG5vZGVzKSB7XG4gICAgICB2YXIgb3duZXIsIHBhcnNlZCwgbG9hZGluZztcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbm9kZXMubGVuZ3RoLCBuOyBpIDwgbCAmJiAobiA9IG5vZGVzW2ldKTsgaSsrKSB7XG4gICAgICAgIGlmICghb3duZXIpIHtcbiAgICAgICAgICBvd25lciA9IG4ub3duZXJEb2N1bWVudDtcbiAgICAgICAgICBwYXJzZWQgPSBwYXJzZXIuaXNQYXJzZWQob3duZXIpO1xuICAgICAgICB9XG4gICAgICAgIGxvYWRpbmcgPSB0aGlzLnNob3VsZExvYWROb2RlKG4pO1xuICAgICAgICBpZiAobG9hZGluZykge1xuICAgICAgICAgIGltcG9ydGVyLmxvYWROb2RlKG4pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnNob3VsZFBhcnNlTm9kZShuKSAmJiBwYXJzZWQpIHtcbiAgICAgICAgICBwYXJzZXIucGFyc2VEeW5hbWljKG4sIGxvYWRpbmcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBzaG91bGRMb2FkTm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDEgJiYgbWF0Y2hlcy5jYWxsKG5vZGUsIGltcG9ydGVyLmxvYWRTZWxlY3RvcnNGb3JOb2RlKG5vZGUpKTtcbiAgICB9LFxuICAgIHNob3VsZFBhcnNlTm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDEgJiYgbWF0Y2hlcy5jYWxsKG5vZGUsIHBhcnNlci5wYXJzZVNlbGVjdG9yc0Zvck5vZGUobm9kZSkpO1xuICAgIH1cbiAgfTtcbiAgaW1wb3J0ZXIub2JzZXJ2ZXIuYWRkQ2FsbGJhY2sgPSBkeW5hbWljLmFkZGVkLmJpbmQoZHluYW1pYyk7XG4gIHZhciBtYXRjaGVzID0gSFRNTEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXMgfHwgSFRNTEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXNTZWxlY3RvciB8fCBIVE1MRWxlbWVudC5wcm90b3R5cGUud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IEhUTUxFbGVtZW50LnByb3RvdHlwZS5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgSFRNTEVsZW1lbnQucHJvdG90eXBlLm1zTWF0Y2hlc1NlbGVjdG9yO1xufSk7XG5cbihmdW5jdGlvbihzY29wZSkge1xuICB2YXIgaW5pdGlhbGl6ZU1vZHVsZXMgPSBzY29wZS5pbml0aWFsaXplTW9kdWxlcztcbiAgdmFyIGlzSUUgPSBzY29wZS5pc0lFO1xuICBpZiAoc2NvcGUudXNlTmF0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGluaXRpYWxpemVNb2R1bGVzKCk7XG4gIHZhciByb290RG9jdW1lbnQgPSBzY29wZS5yb290RG9jdW1lbnQ7XG4gIGZ1bmN0aW9uIGJvb3RzdHJhcCgpIHtcbiAgICB3aW5kb3cuSFRNTEltcG9ydHMuaW1wb3J0ZXIuYm9vdERvY3VtZW50KHJvb3REb2N1bWVudCk7XG4gIH1cbiAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIiB8fCBkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImludGVyYWN0aXZlXCIgJiYgIXdpbmRvdy5hdHRhY2hFdmVudCkge1xuICAgIGJvb3RzdHJhcCgpO1xuICB9IGVsc2Uge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGJvb3RzdHJhcCk7XG4gIH1cbn0pKHdpbmRvdy5IVE1MSW1wb3J0cyk7XG5cbndpbmRvdy5DdXN0b21FbGVtZW50cyA9IHdpbmRvdy5DdXN0b21FbGVtZW50cyB8fCB7XG4gIGZsYWdzOiB7fVxufTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBmbGFncyA9IHNjb3BlLmZsYWdzO1xuICB2YXIgbW9kdWxlcyA9IFtdO1xuICB2YXIgYWRkTW9kdWxlID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gICAgbW9kdWxlcy5wdXNoKG1vZHVsZSk7XG4gIH07XG4gIHZhciBpbml0aWFsaXplTW9kdWxlcyA9IGZ1bmN0aW9uKCkge1xuICAgIG1vZHVsZXMuZm9yRWFjaChmdW5jdGlvbihtb2R1bGUpIHtcbiAgICAgIG1vZHVsZShzY29wZSk7XG4gICAgfSk7XG4gIH07XG4gIHNjb3BlLmFkZE1vZHVsZSA9IGFkZE1vZHVsZTtcbiAgc2NvcGUuaW5pdGlhbGl6ZU1vZHVsZXMgPSBpbml0aWFsaXplTW9kdWxlcztcbiAgc2NvcGUuaGFzTmF0aXZlID0gQm9vbGVhbihkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQpO1xuICBzY29wZS5pc0lFID0gL1RyaWRlbnQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gIHNjb3BlLnVzZU5hdGl2ZSA9ICFmbGFncy5yZWdpc3RlciAmJiBzY29wZS5oYXNOYXRpdmUgJiYgIXdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCAmJiAoIXdpbmRvdy5IVE1MSW1wb3J0cyB8fCB3aW5kb3cuSFRNTEltcG9ydHMudXNlTmF0aXZlKTtcbn0pKHdpbmRvdy5DdXN0b21FbGVtZW50cyk7XG5cbndpbmRvdy5DdXN0b21FbGVtZW50cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIElNUE9SVF9MSU5LX1RZUEUgPSB3aW5kb3cuSFRNTEltcG9ydHMgPyB3aW5kb3cuSFRNTEltcG9ydHMuSU1QT1JUX0xJTktfVFlQRSA6IFwibm9uZVwiO1xuICBmdW5jdGlvbiBmb3JTdWJ0cmVlKG5vZGUsIGNiKSB7XG4gICAgZmluZEFsbEVsZW1lbnRzKG5vZGUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChjYihlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGZvclJvb3RzKGUsIGNiKTtcbiAgICB9KTtcbiAgICBmb3JSb290cyhub2RlLCBjYik7XG4gIH1cbiAgZnVuY3Rpb24gZmluZEFsbEVsZW1lbnRzKG5vZGUsIGZpbmQsIGRhdGEpIHtcbiAgICB2YXIgZSA9IG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgaWYgKCFlKSB7XG4gICAgICBlID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgd2hpbGUgKGUgJiYgZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgZSA9IGUubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgfVxuICAgIHdoaWxlIChlKSB7XG4gICAgICBpZiAoZmluZChlLCBkYXRhKSAhPT0gdHJ1ZSkge1xuICAgICAgICBmaW5kQWxsRWxlbWVudHMoZSwgZmluZCwgZGF0YSk7XG4gICAgICB9XG4gICAgICBlID0gZS5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGZ1bmN0aW9uIGZvclJvb3RzKG5vZGUsIGNiKSB7XG4gICAgdmFyIHJvb3QgPSBub2RlLnNoYWRvd1Jvb3Q7XG4gICAgd2hpbGUgKHJvb3QpIHtcbiAgICAgIGZvclN1YnRyZWUocm9vdCwgY2IpO1xuICAgICAgcm9vdCA9IHJvb3Qub2xkZXJTaGFkb3dSb290O1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBmb3JEb2N1bWVudFRyZWUoZG9jLCBjYikge1xuICAgIF9mb3JEb2N1bWVudFRyZWUoZG9jLCBjYiwgW10pO1xuICB9XG4gIGZ1bmN0aW9uIF9mb3JEb2N1bWVudFRyZWUoZG9jLCBjYiwgcHJvY2Vzc2luZ0RvY3VtZW50cykge1xuICAgIGRvYyA9IHdpbmRvdy53cmFwKGRvYyk7XG4gICAgaWYgKHByb2Nlc3NpbmdEb2N1bWVudHMuaW5kZXhPZihkb2MpID49IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcHJvY2Vzc2luZ0RvY3VtZW50cy5wdXNoKGRvYyk7XG4gICAgdmFyIGltcG9ydHMgPSBkb2MucXVlcnlTZWxlY3RvckFsbChcImxpbmtbcmVsPVwiICsgSU1QT1JUX0xJTktfVFlQRSArIFwiXVwiKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGltcG9ydHMubGVuZ3RoLCBuOyBpIDwgbCAmJiAobiA9IGltcG9ydHNbaV0pOyBpKyspIHtcbiAgICAgIGlmIChuLmltcG9ydCkge1xuICAgICAgICBfZm9yRG9jdW1lbnRUcmVlKG4uaW1wb3J0LCBjYiwgcHJvY2Vzc2luZ0RvY3VtZW50cyk7XG4gICAgICB9XG4gICAgfVxuICAgIGNiKGRvYyk7XG4gIH1cbiAgc2NvcGUuZm9yRG9jdW1lbnRUcmVlID0gZm9yRG9jdW1lbnRUcmVlO1xuICBzY29wZS5mb3JTdWJ0cmVlID0gZm9yU3VidHJlZTtcbn0pO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBmbGFncyA9IHNjb3BlLmZsYWdzO1xuICB2YXIgZm9yU3VidHJlZSA9IHNjb3BlLmZvclN1YnRyZWU7XG4gIHZhciBmb3JEb2N1bWVudFRyZWUgPSBzY29wZS5mb3JEb2N1bWVudFRyZWU7XG4gIGZ1bmN0aW9uIGFkZGVkTm9kZShub2RlLCBpc0F0dGFjaGVkKSB7XG4gICAgcmV0dXJuIGFkZGVkKG5vZGUsIGlzQXR0YWNoZWQpIHx8IGFkZGVkU3VidHJlZShub2RlLCBpc0F0dGFjaGVkKTtcbiAgfVxuICBmdW5jdGlvbiBhZGRlZChub2RlLCBpc0F0dGFjaGVkKSB7XG4gICAgaWYgKHNjb3BlLnVwZ3JhZGUobm9kZSwgaXNBdHRhY2hlZCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoaXNBdHRhY2hlZCkge1xuICAgICAgYXR0YWNoZWQobm9kZSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGFkZGVkU3VidHJlZShub2RlLCBpc0F0dGFjaGVkKSB7XG4gICAgZm9yU3VidHJlZShub2RlLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoYWRkZWQoZSwgaXNBdHRhY2hlZCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgdmFyIGhhc1Rocm90dGxlZEF0dGFjaGVkID0gd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIuX2lzUG9seWZpbGxlZCAmJiBmbGFnc1tcInRocm90dGxlLWF0dGFjaGVkXCJdO1xuICBzY29wZS5oYXNQb2x5ZmlsbE11dGF0aW9ucyA9IGhhc1Rocm90dGxlZEF0dGFjaGVkO1xuICBzY29wZS5oYXNUaHJvdHRsZWRBdHRhY2hlZCA9IGhhc1Rocm90dGxlZEF0dGFjaGVkO1xuICB2YXIgaXNQZW5kaW5nTXV0YXRpb25zID0gZmFsc2U7XG4gIHZhciBwZW5kaW5nTXV0YXRpb25zID0gW107XG4gIGZ1bmN0aW9uIGRlZmVyTXV0YXRpb24oZm4pIHtcbiAgICBwZW5kaW5nTXV0YXRpb25zLnB1c2goZm4pO1xuICAgIGlmICghaXNQZW5kaW5nTXV0YXRpb25zKSB7XG4gICAgICBpc1BlbmRpbmdNdXRhdGlvbnMgPSB0cnVlO1xuICAgICAgc2V0VGltZW91dCh0YWtlTXV0YXRpb25zKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gdGFrZU11dGF0aW9ucygpIHtcbiAgICBpc1BlbmRpbmdNdXRhdGlvbnMgPSBmYWxzZTtcbiAgICB2YXIgJHAgPSBwZW5kaW5nTXV0YXRpb25zO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gJHAubGVuZ3RoLCBwOyBpIDwgbCAmJiAocCA9ICRwW2ldKTsgaSsrKSB7XG4gICAgICBwKCk7XG4gICAgfVxuICAgIHBlbmRpbmdNdXRhdGlvbnMgPSBbXTtcbiAgfVxuICBmdW5jdGlvbiBhdHRhY2hlZChlbGVtZW50KSB7XG4gICAgaWYgKGhhc1Rocm90dGxlZEF0dGFjaGVkKSB7XG4gICAgICBkZWZlck11dGF0aW9uKGZ1bmN0aW9uKCkge1xuICAgICAgICBfYXR0YWNoZWQoZWxlbWVudCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgX2F0dGFjaGVkKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBfYXR0YWNoZWQoZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50Ll9fdXBncmFkZWRfXyAmJiAhZWxlbWVudC5fX2F0dGFjaGVkKSB7XG4gICAgICBlbGVtZW50Ll9fYXR0YWNoZWQgPSB0cnVlO1xuICAgICAgaWYgKGVsZW1lbnQuYXR0YWNoZWRDYWxsYmFjaykge1xuICAgICAgICBlbGVtZW50LmF0dGFjaGVkQ2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZGV0YWNoZWROb2RlKG5vZGUpIHtcbiAgICBkZXRhY2hlZChub2RlKTtcbiAgICBmb3JTdWJ0cmVlKG5vZGUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGRldGFjaGVkKGUpO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGRldGFjaGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoaGFzVGhyb3R0bGVkQXR0YWNoZWQpIHtcbiAgICAgIGRlZmVyTXV0YXRpb24oZnVuY3Rpb24oKSB7XG4gICAgICAgIF9kZXRhY2hlZChlbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBfZGV0YWNoZWQoZWxlbWVudCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIF9kZXRhY2hlZChlbGVtZW50KSB7XG4gICAgaWYgKGVsZW1lbnQuX191cGdyYWRlZF9fICYmIGVsZW1lbnQuX19hdHRhY2hlZCkge1xuICAgICAgZWxlbWVudC5fX2F0dGFjaGVkID0gZmFsc2U7XG4gICAgICBpZiAoZWxlbWVudC5kZXRhY2hlZENhbGxiYWNrKSB7XG4gICAgICAgIGVsZW1lbnQuZGV0YWNoZWRDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBpbkRvY3VtZW50KGVsZW1lbnQpIHtcbiAgICB2YXIgcCA9IGVsZW1lbnQ7XG4gICAgdmFyIGRvYyA9IHdpbmRvdy53cmFwKGRvY3VtZW50KTtcbiAgICB3aGlsZSAocCkge1xuICAgICAgaWYgKHAgPT0gZG9jKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcCA9IHAucGFyZW50Tm9kZSB8fCBwLm5vZGVUeXBlID09PSBOb2RlLkRPQ1VNRU5UX0ZSQUdNRU5UX05PREUgJiYgcC5ob3N0O1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB3YXRjaFNoYWRvdyhub2RlKSB7XG4gICAgaWYgKG5vZGUuc2hhZG93Um9vdCAmJiAhbm9kZS5zaGFkb3dSb290Ll9fd2F0Y2hlZCkge1xuICAgICAgZmxhZ3MuZG9tICYmIGNvbnNvbGUubG9nKFwid2F0Y2hpbmcgc2hhZG93LXJvb3QgZm9yOiBcIiwgbm9kZS5sb2NhbE5hbWUpO1xuICAgICAgdmFyIHJvb3QgPSBub2RlLnNoYWRvd1Jvb3Q7XG4gICAgICB3aGlsZSAocm9vdCkge1xuICAgICAgICBvYnNlcnZlKHJvb3QpO1xuICAgICAgICByb290ID0gcm9vdC5vbGRlclNoYWRvd1Jvb3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGhhbmRsZXIocm9vdCwgbXV0YXRpb25zKSB7XG4gICAgaWYgKGZsYWdzLmRvbSkge1xuICAgICAgdmFyIG14ID0gbXV0YXRpb25zWzBdO1xuICAgICAgaWYgKG14ICYmIG14LnR5cGUgPT09IFwiY2hpbGRMaXN0XCIgJiYgbXguYWRkZWROb2Rlcykge1xuICAgICAgICBpZiAobXguYWRkZWROb2Rlcykge1xuICAgICAgICAgIHZhciBkID0gbXguYWRkZWROb2Rlc1swXTtcbiAgICAgICAgICB3aGlsZSAoZCAmJiBkICE9PSBkb2N1bWVudCAmJiAhZC5ob3N0KSB7XG4gICAgICAgICAgICBkID0gZC5wYXJlbnROb2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgdSA9IGQgJiYgKGQuVVJMIHx8IGQuX1VSTCB8fCBkLmhvc3QgJiYgZC5ob3N0LmxvY2FsTmFtZSkgfHwgXCJcIjtcbiAgICAgICAgICB1ID0gdS5zcGxpdChcIi8/XCIpLnNoaWZ0KCkuc3BsaXQoXCIvXCIpLnBvcCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zb2xlLmdyb3VwKFwibXV0YXRpb25zICglZCkgWyVzXVwiLCBtdXRhdGlvbnMubGVuZ3RoLCB1IHx8IFwiXCIpO1xuICAgIH1cbiAgICB2YXIgaXNBdHRhY2hlZCA9IGluRG9jdW1lbnQocm9vdCk7XG4gICAgbXV0YXRpb25zLmZvckVhY2goZnVuY3Rpb24obXgpIHtcbiAgICAgIGlmIChteC50eXBlID09PSBcImNoaWxkTGlzdFwiKSB7XG4gICAgICAgIGZvckVhY2gobXguYWRkZWROb2RlcywgZnVuY3Rpb24obikge1xuICAgICAgICAgIGlmICghbi5sb2NhbE5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYWRkZWROb2RlKG4sIGlzQXR0YWNoZWQpO1xuICAgICAgICB9KTtcbiAgICAgICAgZm9yRWFjaChteC5yZW1vdmVkTm9kZXMsIGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICBpZiAoIW4ubG9jYWxOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGRldGFjaGVkTm9kZShuKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZmxhZ3MuZG9tICYmIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgfVxuICBmdW5jdGlvbiB0YWtlUmVjb3Jkcyhub2RlKSB7XG4gICAgbm9kZSA9IHdpbmRvdy53cmFwKG5vZGUpO1xuICAgIGlmICghbm9kZSkge1xuICAgICAgbm9kZSA9IHdpbmRvdy53cmFwKGRvY3VtZW50KTtcbiAgICB9XG4gICAgd2hpbGUgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICB9XG4gICAgdmFyIG9ic2VydmVyID0gbm9kZS5fX29ic2VydmVyO1xuICAgIGlmIChvYnNlcnZlcikge1xuICAgICAgaGFuZGxlcihub2RlLCBvYnNlcnZlci50YWtlUmVjb3JkcygpKTtcbiAgICAgIHRha2VNdXRhdGlvbnMoKTtcbiAgICB9XG4gIH1cbiAgdmFyIGZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsLmJpbmQoQXJyYXkucHJvdG90eXBlLmZvckVhY2gpO1xuICBmdW5jdGlvbiBvYnNlcnZlKGluUm9vdCkge1xuICAgIGlmIChpblJvb3QuX19vYnNlcnZlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihoYW5kbGVyLmJpbmQodGhpcywgaW5Sb290KSk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShpblJvb3QsIHtcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgIHN1YnRyZWU6IHRydWVcbiAgICB9KTtcbiAgICBpblJvb3QuX19vYnNlcnZlciA9IG9ic2VydmVyO1xuICB9XG4gIGZ1bmN0aW9uIHVwZ3JhZGVEb2N1bWVudChkb2MpIHtcbiAgICBkb2MgPSB3aW5kb3cud3JhcChkb2MpO1xuICAgIGZsYWdzLmRvbSAmJiBjb25zb2xlLmdyb3VwKFwidXBncmFkZURvY3VtZW50OiBcIiwgZG9jLmJhc2VVUkkuc3BsaXQoXCIvXCIpLnBvcCgpKTtcbiAgICB2YXIgaXNNYWluRG9jdW1lbnQgPSBkb2MgPT09IHdpbmRvdy53cmFwKGRvY3VtZW50KTtcbiAgICBhZGRlZE5vZGUoZG9jLCBpc01haW5Eb2N1bWVudCk7XG4gICAgb2JzZXJ2ZShkb2MpO1xuICAgIGZsYWdzLmRvbSAmJiBjb25zb2xlLmdyb3VwRW5kKCk7XG4gIH1cbiAgZnVuY3Rpb24gdXBncmFkZURvY3VtZW50VHJlZShkb2MpIHtcbiAgICBmb3JEb2N1bWVudFRyZWUoZG9jLCB1cGdyYWRlRG9jdW1lbnQpO1xuICB9XG4gIHZhciBvcmlnaW5hbENyZWF0ZVNoYWRvd1Jvb3QgPSBFbGVtZW50LnByb3RvdHlwZS5jcmVhdGVTaGFkb3dSb290O1xuICBpZiAob3JpZ2luYWxDcmVhdGVTaGFkb3dSb290KSB7XG4gICAgRWxlbWVudC5wcm90b3R5cGUuY3JlYXRlU2hhZG93Um9vdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJvb3QgPSBvcmlnaW5hbENyZWF0ZVNoYWRvd1Jvb3QuY2FsbCh0aGlzKTtcbiAgICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cy53YXRjaFNoYWRvdyh0aGlzKTtcbiAgICAgIHJldHVybiByb290O1xuICAgIH07XG4gIH1cbiAgc2NvcGUud2F0Y2hTaGFkb3cgPSB3YXRjaFNoYWRvdztcbiAgc2NvcGUudXBncmFkZURvY3VtZW50VHJlZSA9IHVwZ3JhZGVEb2N1bWVudFRyZWU7XG4gIHNjb3BlLnVwZ3JhZGVEb2N1bWVudCA9IHVwZ3JhZGVEb2N1bWVudDtcbiAgc2NvcGUudXBncmFkZVN1YnRyZWUgPSBhZGRlZFN1YnRyZWU7XG4gIHNjb3BlLnVwZ3JhZGVBbGwgPSBhZGRlZE5vZGU7XG4gIHNjb3BlLmF0dGFjaGVkID0gYXR0YWNoZWQ7XG4gIHNjb3BlLnRha2VSZWNvcmRzID0gdGFrZVJlY29yZHM7XG59KTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgZmxhZ3MgPSBzY29wZS5mbGFncztcbiAgZnVuY3Rpb24gdXBncmFkZShub2RlLCBpc0F0dGFjaGVkKSB7XG4gICAgaWYgKG5vZGUubG9jYWxOYW1lID09PSBcInRlbXBsYXRlXCIpIHtcbiAgICAgIGlmICh3aW5kb3cuSFRNTFRlbXBsYXRlRWxlbWVudCAmJiBIVE1MVGVtcGxhdGVFbGVtZW50LmRlY29yYXRlKSB7XG4gICAgICAgIEhUTUxUZW1wbGF0ZUVsZW1lbnQuZGVjb3JhdGUobm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghbm9kZS5fX3VwZ3JhZGVkX18gJiYgbm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgIHZhciBpcyA9IG5vZGUuZ2V0QXR0cmlidXRlKFwiaXNcIik7XG4gICAgICB2YXIgZGVmaW5pdGlvbiA9IHNjb3BlLmdldFJlZ2lzdGVyZWREZWZpbml0aW9uKG5vZGUubG9jYWxOYW1lKSB8fCBzY29wZS5nZXRSZWdpc3RlcmVkRGVmaW5pdGlvbihpcyk7XG4gICAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBpZiAoaXMgJiYgZGVmaW5pdGlvbi50YWcgPT0gbm9kZS5sb2NhbE5hbWUgfHwgIWlzICYmICFkZWZpbml0aW9uLmV4dGVuZHMpIHtcbiAgICAgICAgICByZXR1cm4gdXBncmFkZVdpdGhEZWZpbml0aW9uKG5vZGUsIGRlZmluaXRpb24sIGlzQXR0YWNoZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHVwZ3JhZGVXaXRoRGVmaW5pdGlvbihlbGVtZW50LCBkZWZpbml0aW9uLCBpc0F0dGFjaGVkKSB7XG4gICAgZmxhZ3MudXBncmFkZSAmJiBjb25zb2xlLmdyb3VwKFwidXBncmFkZTpcIiwgZWxlbWVudC5sb2NhbE5hbWUpO1xuICAgIGlmIChkZWZpbml0aW9uLmlzKSB7XG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImlzXCIsIGRlZmluaXRpb24uaXMpO1xuICAgIH1cbiAgICBpbXBsZW1lbnRQcm90b3R5cGUoZWxlbWVudCwgZGVmaW5pdGlvbik7XG4gICAgZWxlbWVudC5fX3VwZ3JhZGVkX18gPSB0cnVlO1xuICAgIGNyZWF0ZWQoZWxlbWVudCk7XG4gICAgaWYgKGlzQXR0YWNoZWQpIHtcbiAgICAgIHNjb3BlLmF0dGFjaGVkKGVsZW1lbnQpO1xuICAgIH1cbiAgICBzY29wZS51cGdyYWRlU3VidHJlZShlbGVtZW50LCBpc0F0dGFjaGVkKTtcbiAgICBmbGFncy51cGdyYWRlICYmIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuICBmdW5jdGlvbiBpbXBsZW1lbnRQcm90b3R5cGUoZWxlbWVudCwgZGVmaW5pdGlvbikge1xuICAgIGlmIChPYmplY3QuX19wcm90b19fKSB7XG4gICAgICBlbGVtZW50Ll9fcHJvdG9fXyA9IGRlZmluaXRpb24ucHJvdG90eXBlO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXN0b21NaXhpbihlbGVtZW50LCBkZWZpbml0aW9uLnByb3RvdHlwZSwgZGVmaW5pdGlvbi5uYXRpdmUpO1xuICAgICAgZWxlbWVudC5fX3Byb3RvX18gPSBkZWZpbml0aW9uLnByb3RvdHlwZTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gY3VzdG9tTWl4aW4oaW5UYXJnZXQsIGluU3JjLCBpbk5hdGl2ZSkge1xuICAgIHZhciB1c2VkID0ge307XG4gICAgdmFyIHAgPSBpblNyYztcbiAgICB3aGlsZSAocCAhPT0gaW5OYXRpdmUgJiYgcCAhPT0gSFRNTEVsZW1lbnQucHJvdG90eXBlKSB7XG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHApO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGs7IGsgPSBrZXlzW2ldOyBpKyspIHtcbiAgICAgICAgaWYgKCF1c2VkW2tdKSB7XG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGluVGFyZ2V0LCBrLCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHAsIGspKTtcbiAgICAgICAgICB1c2VkW2tdID0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gY3JlYXRlZChlbGVtZW50KSB7XG4gICAgaWYgKGVsZW1lbnQuY3JlYXRlZENhbGxiYWNrKSB7XG4gICAgICBlbGVtZW50LmNyZWF0ZWRDYWxsYmFjaygpO1xuICAgIH1cbiAgfVxuICBzY29wZS51cGdyYWRlID0gdXBncmFkZTtcbiAgc2NvcGUudXBncmFkZVdpdGhEZWZpbml0aW9uID0gdXBncmFkZVdpdGhEZWZpbml0aW9uO1xuICBzY29wZS5pbXBsZW1lbnRQcm90b3R5cGUgPSBpbXBsZW1lbnRQcm90b3R5cGU7XG59KTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgaXNJRSA9IHNjb3BlLmlzSUU7XG4gIHZhciB1cGdyYWRlRG9jdW1lbnRUcmVlID0gc2NvcGUudXBncmFkZURvY3VtZW50VHJlZTtcbiAgdmFyIHVwZ3JhZGVBbGwgPSBzY29wZS51cGdyYWRlQWxsO1xuICB2YXIgdXBncmFkZVdpdGhEZWZpbml0aW9uID0gc2NvcGUudXBncmFkZVdpdGhEZWZpbml0aW9uO1xuICB2YXIgaW1wbGVtZW50UHJvdG90eXBlID0gc2NvcGUuaW1wbGVtZW50UHJvdG90eXBlO1xuICB2YXIgdXNlTmF0aXZlID0gc2NvcGUudXNlTmF0aXZlO1xuICBmdW5jdGlvbiByZWdpc3RlcihuYW1lLCBvcHRpb25zKSB7XG4gICAgdmFyIGRlZmluaXRpb24gPSBvcHRpb25zIHx8IHt9O1xuICAgIGlmICghbmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50OiBmaXJzdCBhcmd1bWVudCBgbmFtZWAgbXVzdCBub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuICAgIGlmIChuYW1lLmluZGV4T2YoXCItXCIpIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50OiBmaXJzdCBhcmd1bWVudCAoJ25hbWUnKSBtdXN0IGNvbnRhaW4gYSBkYXNoICgnLScpLiBBcmd1bWVudCBwcm92aWRlZCB3YXMgJ1wiICsgU3RyaW5nKG5hbWUpICsgXCInLlwiKTtcbiAgICB9XG4gICAgaWYgKGlzUmVzZXJ2ZWRUYWcobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBleGVjdXRlICdyZWdpc3RlckVsZW1lbnQnIG9uICdEb2N1bWVudCc6IFJlZ2lzdHJhdGlvbiBmYWlsZWQgZm9yIHR5cGUgJ1wiICsgU3RyaW5nKG5hbWUpICsgXCInLiBUaGUgdHlwZSBuYW1lIGlzIGludmFsaWQuXCIpO1xuICAgIH1cbiAgICBpZiAoZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24obmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkR1cGxpY2F0ZURlZmluaXRpb25FcnJvcjogYSB0eXBlIHdpdGggbmFtZSAnXCIgKyBTdHJpbmcobmFtZSkgKyBcIicgaXMgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBpZiAoIWRlZmluaXRpb24ucHJvdG90eXBlKSB7XG4gICAgICBkZWZpbml0aW9uLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICB9XG4gICAgZGVmaW5pdGlvbi5fX25hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGRlZmluaXRpb24uZXh0ZW5kcykge1xuICAgICAgZGVmaW5pdGlvbi5leHRlbmRzID0gZGVmaW5pdGlvbi5leHRlbmRzLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuICAgIGRlZmluaXRpb24ubGlmZWN5Y2xlID0gZGVmaW5pdGlvbi5saWZlY3ljbGUgfHwge307XG4gICAgZGVmaW5pdGlvbi5hbmNlc3RyeSA9IGFuY2VzdHJ5KGRlZmluaXRpb24uZXh0ZW5kcyk7XG4gICAgcmVzb2x2ZVRhZ05hbWUoZGVmaW5pdGlvbik7XG4gICAgcmVzb2x2ZVByb3RvdHlwZUNoYWluKGRlZmluaXRpb24pO1xuICAgIG92ZXJyaWRlQXR0cmlidXRlQXBpKGRlZmluaXRpb24ucHJvdG90eXBlKTtcbiAgICByZWdpc3RlckRlZmluaXRpb24oZGVmaW5pdGlvbi5fX25hbWUsIGRlZmluaXRpb24pO1xuICAgIGRlZmluaXRpb24uY3RvciA9IGdlbmVyYXRlQ29uc3RydWN0b3IoZGVmaW5pdGlvbik7XG4gICAgZGVmaW5pdGlvbi5jdG9yLnByb3RvdHlwZSA9IGRlZmluaXRpb24ucHJvdG90eXBlO1xuICAgIGRlZmluaXRpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gZGVmaW5pdGlvbi5jdG9yO1xuICAgIGlmIChzY29wZS5yZWFkeSkge1xuICAgICAgdXBncmFkZURvY3VtZW50VHJlZShkb2N1bWVudCk7XG4gICAgfVxuICAgIHJldHVybiBkZWZpbml0aW9uLmN0b3I7XG4gIH1cbiAgZnVuY3Rpb24gb3ZlcnJpZGVBdHRyaWJ1dGVBcGkocHJvdG90eXBlKSB7XG4gICAgaWYgKHByb3RvdHlwZS5zZXRBdHRyaWJ1dGUuX3BvbHlmaWxsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHNldEF0dHJpYnV0ZSA9IHByb3RvdHlwZS5zZXRBdHRyaWJ1dGU7XG4gICAgcHJvdG90eXBlLnNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICBjaGFuZ2VBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lLCB2YWx1ZSwgc2V0QXR0cmlidXRlKTtcbiAgICB9O1xuICAgIHZhciByZW1vdmVBdHRyaWJ1dGUgPSBwcm90b3R5cGUucmVtb3ZlQXR0cmlidXRlO1xuICAgIHByb3RvdHlwZS5yZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBjaGFuZ2VBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lLCBudWxsLCByZW1vdmVBdHRyaWJ1dGUpO1xuICAgIH07XG4gICAgcHJvdG90eXBlLnNldEF0dHJpYnV0ZS5fcG9seWZpbGxlZCA9IHRydWU7XG4gIH1cbiAgZnVuY3Rpb24gY2hhbmdlQXR0cmlidXRlKG5hbWUsIHZhbHVlLCBvcGVyYXRpb24pIHtcbiAgICBuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgIG9wZXJhdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgIGlmICh0aGlzLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayAmJiBuZXdWYWx1ZSAhPT0gb2xkVmFsdWUpIHtcbiAgICAgIHRoaXMuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGlzUmVzZXJ2ZWRUYWcobmFtZSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzZXJ2ZWRUYWdMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobmFtZSA9PT0gcmVzZXJ2ZWRUYWdMaXN0W2ldKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB2YXIgcmVzZXJ2ZWRUYWdMaXN0ID0gWyBcImFubm90YXRpb24teG1sXCIsIFwiY29sb3ItcHJvZmlsZVwiLCBcImZvbnQtZmFjZVwiLCBcImZvbnQtZmFjZS1zcmNcIiwgXCJmb250LWZhY2UtdXJpXCIsIFwiZm9udC1mYWNlLWZvcm1hdFwiLCBcImZvbnQtZmFjZS1uYW1lXCIsIFwibWlzc2luZy1nbHlwaFwiIF07XG4gIGZ1bmN0aW9uIGFuY2VzdHJ5KGV4dG5kcykge1xuICAgIHZhciBleHRlbmRlZSA9IGdldFJlZ2lzdGVyZWREZWZpbml0aW9uKGV4dG5kcyk7XG4gICAgaWYgKGV4dGVuZGVlKSB7XG4gICAgICByZXR1cm4gYW5jZXN0cnkoZXh0ZW5kZWUuZXh0ZW5kcykuY29uY2F0KFsgZXh0ZW5kZWUgXSk7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxuICBmdW5jdGlvbiByZXNvbHZlVGFnTmFtZShkZWZpbml0aW9uKSB7XG4gICAgdmFyIGJhc2VUYWcgPSBkZWZpbml0aW9uLmV4dGVuZHM7XG4gICAgZm9yICh2YXIgaSA9IDAsIGE7IGEgPSBkZWZpbml0aW9uLmFuY2VzdHJ5W2ldOyBpKyspIHtcbiAgICAgIGJhc2VUYWcgPSBhLmlzICYmIGEudGFnO1xuICAgIH1cbiAgICBkZWZpbml0aW9uLnRhZyA9IGJhc2VUYWcgfHwgZGVmaW5pdGlvbi5fX25hbWU7XG4gICAgaWYgKGJhc2VUYWcpIHtcbiAgICAgIGRlZmluaXRpb24uaXMgPSBkZWZpbml0aW9uLl9fbmFtZTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVzb2x2ZVByb3RvdHlwZUNoYWluKGRlZmluaXRpb24pIHtcbiAgICBpZiAoIU9iamVjdC5fX3Byb3RvX18pIHtcbiAgICAgIHZhciBuYXRpdmVQcm90b3R5cGUgPSBIVE1MRWxlbWVudC5wcm90b3R5cGU7XG4gICAgICBpZiAoZGVmaW5pdGlvbi5pcykge1xuICAgICAgICB2YXIgaW5zdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZGVmaW5pdGlvbi50YWcpO1xuICAgICAgICBuYXRpdmVQcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoaW5zdCk7XG4gICAgICB9XG4gICAgICB2YXIgcHJvdG8gPSBkZWZpbml0aW9uLnByb3RvdHlwZSwgYW5jZXN0b3I7XG4gICAgICB2YXIgZm91bmRQcm90b3R5cGUgPSBmYWxzZTtcbiAgICAgIHdoaWxlIChwcm90bykge1xuICAgICAgICBpZiAocHJvdG8gPT0gbmF0aXZlUHJvdG90eXBlKSB7XG4gICAgICAgICAgZm91bmRQcm90b3R5cGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGFuY2VzdG9yID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvKTtcbiAgICAgICAgaWYgKGFuY2VzdG9yKSB7XG4gICAgICAgICAgcHJvdG8uX19wcm90b19fID0gYW5jZXN0b3I7XG4gICAgICAgIH1cbiAgICAgICAgcHJvdG8gPSBhbmNlc3RvcjtcbiAgICAgIH1cbiAgICAgIGlmICghZm91bmRQcm90b3R5cGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGRlZmluaXRpb24udGFnICsgXCIgcHJvdG90eXBlIG5vdCBmb3VuZCBpbiBwcm90b3R5cGUgY2hhaW4gZm9yIFwiICsgZGVmaW5pdGlvbi5pcyk7XG4gICAgICB9XG4gICAgICBkZWZpbml0aW9uLm5hdGl2ZSA9IG5hdGl2ZVByb3RvdHlwZTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaW5zdGFudGlhdGUoZGVmaW5pdGlvbikge1xuICAgIHJldHVybiB1cGdyYWRlV2l0aERlZmluaXRpb24oZG9tQ3JlYXRlRWxlbWVudChkZWZpbml0aW9uLnRhZyksIGRlZmluaXRpb24pO1xuICB9XG4gIHZhciByZWdpc3RyeSA9IHt9O1xuICBmdW5jdGlvbiBnZXRSZWdpc3RlcmVkRGVmaW5pdGlvbihuYW1lKSB7XG4gICAgaWYgKG5hbWUpIHtcbiAgICAgIHJldHVybiByZWdpc3RyeVtuYW1lLnRvTG93ZXJDYXNlKCldO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZWdpc3RlckRlZmluaXRpb24obmFtZSwgZGVmaW5pdGlvbikge1xuICAgIHJlZ2lzdHJ5W25hbWVdID0gZGVmaW5pdGlvbjtcbiAgfVxuICBmdW5jdGlvbiBnZW5lcmF0ZUNvbnN0cnVjdG9yKGRlZmluaXRpb24pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gaW5zdGFudGlhdGUoZGVmaW5pdGlvbik7XG4gICAgfTtcbiAgfVxuICB2YXIgSFRNTF9OQU1FU1BBQ0UgPSBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIjtcbiAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnLCB0eXBlRXh0ZW5zaW9uKSB7XG4gICAgaWYgKG5hbWVzcGFjZSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50KHRhZywgdHlwZUV4dGVuc2lvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBkb21DcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCB0YWcpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHRhZywgdHlwZUV4dGVuc2lvbikge1xuICAgIGlmICh0YWcpIHtcbiAgICAgIHRhZyA9IHRhZy50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgICBpZiAodHlwZUV4dGVuc2lvbikge1xuICAgICAgdHlwZUV4dGVuc2lvbiA9IHR5cGVFeHRlbnNpb24udG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgdmFyIGRlZmluaXRpb24gPSBnZXRSZWdpc3RlcmVkRGVmaW5pdGlvbih0eXBlRXh0ZW5zaW9uIHx8IHRhZyk7XG4gICAgaWYgKGRlZmluaXRpb24pIHtcbiAgICAgIGlmICh0YWcgPT0gZGVmaW5pdGlvbi50YWcgJiYgdHlwZUV4dGVuc2lvbiA9PSBkZWZpbml0aW9uLmlzKSB7XG4gICAgICAgIHJldHVybiBuZXcgZGVmaW5pdGlvbi5jdG9yKCk7XG4gICAgICB9XG4gICAgICBpZiAoIXR5cGVFeHRlbnNpb24gJiYgIWRlZmluaXRpb24uaXMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBkZWZpbml0aW9uLmN0b3IoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGVsZW1lbnQ7XG4gICAgaWYgKHR5cGVFeHRlbnNpb24pIHtcbiAgICAgIGVsZW1lbnQgPSBjcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImlzXCIsIHR5cGVFeHRlbnNpb24pO1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuICAgIGVsZW1lbnQgPSBkb21DcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgaWYgKHRhZy5pbmRleE9mKFwiLVwiKSA+PSAwKSB7XG4gICAgICBpbXBsZW1lbnRQcm90b3R5cGUoZWxlbWVudCwgSFRNTEVsZW1lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuICB2YXIgZG9tQ3JlYXRlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQuYmluZChkb2N1bWVudCk7XG4gIHZhciBkb21DcmVhdGVFbGVtZW50TlMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMuYmluZChkb2N1bWVudCk7XG4gIHZhciBpc0luc3RhbmNlO1xuICBpZiAoIU9iamVjdC5fX3Byb3RvX18gJiYgIXVzZU5hdGl2ZSkge1xuICAgIGlzSW5zdGFuY2UgPSBmdW5jdGlvbihvYmosIGN0b3IpIHtcbiAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBjdG9yKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdmFyIHAgPSBvYmo7XG4gICAgICB3aGlsZSAocCkge1xuICAgICAgICBpZiAocCA9PT0gY3Rvci5wcm90b3R5cGUpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBwID0gcC5fX3Byb3RvX187XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBpc0luc3RhbmNlID0gZnVuY3Rpb24ob2JqLCBiYXNlKSB7XG4gICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgYmFzZTtcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIHdyYXBEb21NZXRob2RUb0ZvcmNlVXBncmFkZShvYmosIG1ldGhvZE5hbWUpIHtcbiAgICB2YXIgb3JpZyA9IG9ialttZXRob2ROYW1lXTtcbiAgICBvYmpbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBuID0gb3JpZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgdXBncmFkZUFsbChuKTtcbiAgICAgIHJldHVybiBuO1xuICAgIH07XG4gIH1cbiAgd3JhcERvbU1ldGhvZFRvRm9yY2VVcGdyYWRlKE5vZGUucHJvdG90eXBlLCBcImNsb25lTm9kZVwiKTtcbiAgd3JhcERvbU1ldGhvZFRvRm9yY2VVcGdyYWRlKGRvY3VtZW50LCBcImltcG9ydE5vZGVcIik7XG4gIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCA9IHJlZ2lzdGVyO1xuICBkb2N1bWVudC5jcmVhdGVFbGVtZW50ID0gY3JlYXRlRWxlbWVudDtcbiAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TID0gY3JlYXRlRWxlbWVudE5TO1xuICBzY29wZS5yZWdpc3RyeSA9IHJlZ2lzdHJ5O1xuICBzY29wZS5pbnN0YW5jZW9mID0gaXNJbnN0YW5jZTtcbiAgc2NvcGUucmVzZXJ2ZWRUYWdMaXN0ID0gcmVzZXJ2ZWRUYWdMaXN0O1xuICBzY29wZS5nZXRSZWdpc3RlcmVkRGVmaW5pdGlvbiA9IGdldFJlZ2lzdGVyZWREZWZpbml0aW9uO1xuICBkb2N1bWVudC5yZWdpc3RlciA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudDtcbn0pO1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIHVzZU5hdGl2ZSA9IHNjb3BlLnVzZU5hdGl2ZTtcbiAgdmFyIGluaXRpYWxpemVNb2R1bGVzID0gc2NvcGUuaW5pdGlhbGl6ZU1vZHVsZXM7XG4gIHZhciBpc0lFID0gc2NvcGUuaXNJRTtcbiAgaWYgKHVzZU5hdGl2ZSkge1xuICAgIHZhciBub3AgPSBmdW5jdGlvbigpIHt9O1xuICAgIHNjb3BlLndhdGNoU2hhZG93ID0gbm9wO1xuICAgIHNjb3BlLnVwZ3JhZGUgPSBub3A7XG4gICAgc2NvcGUudXBncmFkZUFsbCA9IG5vcDtcbiAgICBzY29wZS51cGdyYWRlRG9jdW1lbnRUcmVlID0gbm9wO1xuICAgIHNjb3BlLnVwZ3JhZGVTdWJ0cmVlID0gbm9wO1xuICAgIHNjb3BlLnRha2VSZWNvcmRzID0gbm9wO1xuICAgIHNjb3BlLmluc3RhbmNlb2YgPSBmdW5jdGlvbihvYmosIGJhc2UpIHtcbiAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBiYXNlO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgaW5pdGlhbGl6ZU1vZHVsZXMoKTtcbiAgfVxuICB2YXIgdXBncmFkZURvY3VtZW50VHJlZSA9IHNjb3BlLnVwZ3JhZGVEb2N1bWVudFRyZWU7XG4gIHZhciB1cGdyYWRlRG9jdW1lbnQgPSBzY29wZS51cGdyYWRlRG9jdW1lbnQ7XG4gIGlmICghd2luZG93LndyYXApIHtcbiAgICBpZiAod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKSB7XG4gICAgICB3aW5kb3cud3JhcCA9IHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbC53cmFwSWZOZWVkZWQ7XG4gICAgICB3aW5kb3cudW53cmFwID0gd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsLnVud3JhcElmTmVlZGVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cud3JhcCA9IHdpbmRvdy51bndyYXAgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgaWYgKHdpbmRvdy5IVE1MSW1wb3J0cykge1xuICAgIHdpbmRvdy5IVE1MSW1wb3J0cy5fX2ltcG9ydHNQYXJzaW5nSG9vayA9IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgaWYgKGVsdC5pbXBvcnQpIHtcbiAgICAgICAgdXBncmFkZURvY3VtZW50KHdyYXAoZWx0LmltcG9ydCkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gYm9vdHN0cmFwKCkge1xuICAgIHVwZ3JhZGVEb2N1bWVudFRyZWUod2luZG93LndyYXAoZG9jdW1lbnQpKTtcbiAgICB3aW5kb3cuQ3VzdG9tRWxlbWVudHMucmVhZHkgPSB0cnVlO1xuICAgIHZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IGZ1bmN0aW9uKGYpIHtcbiAgICAgIHNldFRpbWVvdXQoZiwgMTYpO1xuICAgIH07XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgd2luZG93LkN1c3RvbUVsZW1lbnRzLnJlYWR5VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIGlmICh3aW5kb3cuSFRNTEltcG9ydHMpIHtcbiAgICAgICAgICB3aW5kb3cuQ3VzdG9tRWxlbWVudHMuZWxhcHNlZCA9IHdpbmRvdy5DdXN0b21FbGVtZW50cy5yZWFkeVRpbWUgLSB3aW5kb3cuSFRNTEltcG9ydHMucmVhZHlUaW1lO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwiV2ViQ29tcG9uZW50c1JlYWR5XCIsIHtcbiAgICAgICAgICBidWJibGVzOiB0cnVlXG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIgfHwgc2NvcGUuZmxhZ3MuZWFnZXIpIHtcbiAgICBib290c3RyYXAoKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImludGVyYWN0aXZlXCIgJiYgIXdpbmRvdy5hdHRhY2hFdmVudCAmJiAoIXdpbmRvdy5IVE1MSW1wb3J0cyB8fCB3aW5kb3cuSFRNTEltcG9ydHMucmVhZHkpKSB7XG4gICAgYm9vdHN0cmFwKCk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxvYWRFdmVudCA9IHdpbmRvdy5IVE1MSW1wb3J0cyAmJiAhd2luZG93LkhUTUxJbXBvcnRzLnJlYWR5ID8gXCJIVE1MSW1wb3J0c0xvYWRlZFwiIDogXCJET01Db250ZW50TG9hZGVkXCI7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIobG9hZEV2ZW50LCBib290c3RyYXApO1xuICB9XG59KSh3aW5kb3cuQ3VzdG9tRWxlbWVudHMpO1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgaWYgKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xuICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24oc2NvcGUpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MyID0gYXJncy5zbGljZSgpO1xuICAgICAgICBhcmdzMi5wdXNoLmFwcGx5KGFyZ3MyLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gc2VsZi5hcHBseShzY29wZSwgYXJnczIpO1xuICAgICAgfTtcbiAgICB9O1xuICB9XG59KSh3aW5kb3cuV2ViQ29tcG9uZW50cyk7XG5cbihmdW5jdGlvbihzY29wZSkge1xuICB2YXIgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gXCJcIiArIFwiYm9keSB7XCIgKyBcInRyYW5zaXRpb246IG9wYWNpdHkgZWFzZS1pbiAwLjJzO1wiICsgXCIgfSBcXG5cIiArIFwiYm9keVt1bnJlc29sdmVkXSB7XCIgKyBcIm9wYWNpdHk6IDA7IGRpc3BsYXk6IGJsb2NrOyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7XCIgKyBcIiB9IFxcblwiO1xuICB2YXIgaGVhZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJoZWFkXCIpO1xuICBoZWFkLmluc2VydEJlZm9yZShzdHlsZSwgaGVhZC5maXJzdENoaWxkKTtcbn0pKHdpbmRvdy5XZWJDb21wb25lbnRzKTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHdpbmRvdy5QbGF0Zm9ybSA9IHNjb3BlO1xufSkod2luZG93LldlYkNvbXBvbmVudHMpO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIrN1pKcDBcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvd2ViY29tcG9uZW50cy5qcy93ZWJjb21wb25lbnRzLmpzXCIsXCIvLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3dlYmNvbXBvbmVudHMuanNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgUG5CYXNlRWxlbWVudCA9IHt9O1xudmFyIGVsZW1lbnRzID0ge307XG5cblBuQmFzZUVsZW1lbnQuY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucG9seW1lck5hdGl2ZSA9IHt9O1xuICAgIHRoaXMucG9seW1lck5hdGl2ZS5pZCA9IHBvbHltZXJOYXRpdmVDbGllbnQudXRpbHMuZ2V0TmV4dElkKCk7XG4gICAgZWxlbWVudHNbdGhpcy5wb2x5bWVyTmF0aXZlLmlkXSA9IHRoaXM7XG59XG5cblBuQmFzZUVsZW1lbnQuYXR0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYudXBkYXRlU2VyaWFsaXplZFByb3BlcnRpZXMoKTtcbiAgICAgICAgaWYgKHdpbmRvdy5wb2x5bWVyTmF0aXZlSG9zdCkge1xuICAgICAgICAgICAgc2VsZi5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgICAgICAgICBwb2x5bWVyTmF0aXZlSG9zdC5jcmVhdGVFbGVtZW50KHNlbGYucG9seW1lck5hdGl2ZS5zZXJpYWxpemVkUHJvcGVydGllcyk7XG4gICAgICAgIH1cbiAgICB9LCAwKTtcbn1cblxuUG5CYXNlRWxlbWVudC5kZXRhY2hlZENhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh3aW5kb3cucG9seW1lck5hdGl2ZUhvc3QpIHtcbiAgICAgICAgcG9seW1lck5hdGl2ZUhvc3QucmVtb3ZlRWxlbWVudCh0aGlzLnBvbHltZXJOYXRpdmUuaWQpO1xuICAgIH1cbn1cblxuUG5CYXNlRWxlbWVudC51cGRhdGUgPSBmdW5jdGlvbiAocmVjdXJzaXZlKSB7XG4gICAgdGhpcy51cGRhdGVTZXJpYWxpemVkUHJvcGVydGllcygpO1xuICAgIGlmICh3aW5kb3cucG9seW1lck5hdGl2ZUhvc3QpIHtcbiAgICAgICAgcG9seW1lck5hdGl2ZUhvc3QudXBkYXRlRWxlbWVudCh0aGlzLnBvbHltZXJOYXRpdmUuc2VyaWFsaXplZFByb3BlcnRpZXMpO1xuICAgIH1cbiAgICBpZiAocmVjdXJzaXZlKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGROb2RlID0gdGhpcy5jaGlsZE5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKGNoaWxkTm9kZS5wb2x5bWVyTmF0aXZlKSB7XG4gICAgICAgICAgICAgICAgY2hpbGROb2RlLnVwZGF0ZShyZWN1cnNpdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5QbkJhc2VFbGVtZW50LnVwZGF0ZVNlcmlhbGl6ZWRQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucG9seW1lck5hdGl2ZS5zZXJpYWxpemVkUHJvcGVydGllcyA9IEpTT04uc3RyaW5naWZ5KHBvbHltZXJOYXRpdmVDbGllbnQudXRpbHMuZ2V0RWxlbWVudFByb3BlcnRpZXModGhpcykpO1xufVxuXG5QbkJhc2VFbGVtZW50LmdldFBOUGFyZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzO1xuXG4gICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcblxuICAgICAgICBpZiAocGFyZW50ICYmIHBhcmVudC5wb2x5bWVyTmF0aXZlKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyZW50O1xuICAgICAgICB9IGVsc2UgaWYgKHBhcmVudCA9PT0gd2luZG93LmRvY3VtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxud2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudCB8fCB7fTtcbndpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50LmVsZW1lbnRzID0gZWxlbWVudHM7XG53aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC5QbkJhc2VFbGVtZW50ID0gUG5CYXNlRWxlbWVudDtcblxuXG4vL0dsb2JhbCBvYnNlcnZlcnNcblxuUG5CYXNlRWxlbWVudC5vblJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGZvciAodmFyIGVsZW1lbnRJZCBpbiB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC5lbGVtZW50cykge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC5lbGVtZW50c1tlbGVtZW50SWRdO1xuICAgICAgICAgICAgZWxlbWVudC51cGRhdGUoKTtcbiAgICAgICAgfVxuICAgIH0sIDApO1xufVxuXG5QbkJhc2VFbGVtZW50Lm9uTXV0YXRpb25zID0gZnVuY3Rpb24gKG11dGF0aW9ucykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBtdXRhdGlvbiA9IG11dGF0aW9uc1tpXTtcblxuICAgICAgICBjb25zb2xlLmxvZygnTXV0YXRlZCAnICsgbXV0YXRpb24udGFyZ2V0LnRhZ05hbWUpO1xuXG4gICAgICAgIHZhciBzdHJ1Y3R1cmVDaGFuZ2VkID0gbXV0YXRpb24ucmVtb3ZlZE5vZGVzLmxlbmd0aCB8fCBtdXRhdGlvbi5hZGRlZE5vZGVzLmxlbmd0aDtcbiAgICAgICAgbXV0YXRpb24udGFyZ2V0LnVwZGF0ZShzdHJ1Y3R1cmVDaGFuZ2VkKTtcbiAgICB9XG59XG5cblBuQmFzZUVsZW1lbnQuaW5pdGlhbGl6ZU9ic2VydmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgY29uZmlnID0ge1xuICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZSxcbiAgICAgICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICAgICAgYXR0cmlidXRlRmlsdGVyOiBbJ3N0eWxlJ11cbiAgICAgICAgfTtcblxuICAgIHRoaXMub2JzZXJ2ZXIgPSB0aGlzLm9ic2VydmVyIHx8IG5ldyBNdXRhdGlvbk9ic2VydmVyKFBuQmFzZUVsZW1lbnQub25NdXRhdGlvbnMpO1xuICAgIHRoaXMub2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCBjb25maWcpO1xufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIFBuQmFzZUVsZW1lbnQuaW5pdGlhbGl6ZU9ic2VydmVyKTtcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIFBuQmFzZUVsZW1lbnQub25SZXNpemUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBuQmFzZUVsZW1lbnQ7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIis3WkpwMFwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2VsZW1lbnRzL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzXCIsXCIvZWxlbWVudHMvYmFzZVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBQbkJhc2VFbGVtZW50ID0gcmVxdWlyZSgnLi9wbi1iYXNlLWVsZW1lbnQuanMnKTtcbnZhciBQblV0aWxzID0gcmVxdWlyZSgnLi4vLi4vcG4tdXRpbHMuanMnKTtcblxudmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRGl2RWxlbWVudC5wcm90b3R5cGUpO1xucHJvdG8gPSBPYmplY3QuYXNzaWduKHByb3RvLCBQbkJhc2VFbGVtZW50KTtcblxuUG5VdGlscy5yZWdpc3RlcigndmlldycsIHtcbiAgICBwcm90b3R5cGU6IHByb3RvXG59KTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiKzdaSnAwXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZWxlbWVudHMvYmFzZS9wbi12aWV3LmpzXCIsXCIvZWxlbWVudHMvYmFzZVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBQbkJhc2VFbGVtZW50ID0gcmVxdWlyZSgnLi9iYXNlL3BuLWJhc2UtZWxlbWVudC5qcycpO1xudmFyIFBuVXRpbHMgPSByZXF1aXJlKCcuLi9wbi11dGlscy5qcycpO1xuXG52YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxCdXR0b25FbGVtZW50LnByb3RvdHlwZSk7XG5wcm90byA9IE9iamVjdC5hc3NpZ24ocHJvdG8sIFBuQmFzZUVsZW1lbnQpO1xuXG5QblV0aWxzLnJlZ2lzdGVyKCdidXR0b24nLCB7XG4gICAgZXh0ZW5kczogJ2J1dHRvbicsXG4gICAgcHJvdG90eXBlOiBwcm90b1xufSk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIis3WkpwMFwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2VsZW1lbnRzL3BuLWJ1dHRvbi5qc1wiLFwiL2VsZW1lbnRzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzJyk7XG52YXIgUG5VdGlscyA9IHJlcXVpcmUoJy4uL3BuLXV0aWxzLmpzJyk7XG5cbnZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTElucHV0RWxlbWVudC5wcm90b3R5cGUpO1xucHJvdG8gPSBPYmplY3QuYXNzaWduKHByb3RvLCBQbkJhc2VFbGVtZW50KTtcblxuUG5VdGlscy5yZWdpc3RlcignY2hlY2tib3gnLCB7XG4gICAgZXh0ZW5kczogJ2lucHV0JyxcbiAgICBwcm90b3R5cGU6IHByb3RvXG59KTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiKzdaSnAwXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZWxlbWVudHMvcG4tY2hlY2tib3guanNcIixcIi9lbGVtZW50c1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBQbkJhc2VFbGVtZW50ID0gcmVxdWlyZSgnLi9iYXNlL3BuLWJhc2UtZWxlbWVudC5qcycpO1xudmFyIFBuVXRpbHMgPSByZXF1aXJlKCcuLi9wbi11dGlscy5qcycpO1xuXG52YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxJbWFnZUVsZW1lbnQucHJvdG90eXBlKTtcbnByb3RvID0gT2JqZWN0LmFzc2lnbihwcm90bywgUG5CYXNlRWxlbWVudCk7XG5cblBuVXRpbHMucmVnaXN0ZXIoJ2ltZycsIHtcbiAgICBleHRlbmRzOiAnaW1nJyxcbiAgICBwcm90b3R5cGU6IHByb3RvXG59KTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiKzdaSnAwXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZWxlbWVudHMvcG4taW1nLmpzXCIsXCIvZWxlbWVudHNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgUG5CYXNlRWxlbWVudCA9IHJlcXVpcmUoJy4vYmFzZS9wbi1iYXNlLWVsZW1lbnQuanMnKTtcbnZhciBQblV0aWxzID0gcmVxdWlyZSgnLi4vcG4tdXRpbHMuanMnKTtcblxudmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MSW5wdXRFbGVtZW50LnByb3RvdHlwZSk7XG5wcm90byA9IE9iamVjdC5hc3NpZ24ocHJvdG8sIFBuQmFzZUVsZW1lbnQpO1xuXG5wcm90by5zZXRWYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn1cblxuUG5VdGlscy5yZWdpc3RlcignaW5wdXQnLCB7XG4gICAgZXh0ZW5kczogJ2lucHV0JyxcbiAgICBwcm90b3R5cGU6IHByb3RvXG59KTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiKzdaSnAwXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZWxlbWVudHMvcG4taW5wdXQuanNcIixcIi9lbGVtZW50c1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBQbkJhc2VFbGVtZW50ID0gcmVxdWlyZSgnLi9iYXNlL3BuLWJhc2UtZWxlbWVudC5qcycpO1xudmFyIFBuVXRpbHMgPSByZXF1aXJlKCcuLi9wbi11dGlscy5qcycpO1xuXG52YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxEaXZFbGVtZW50LnByb3RvdHlwZSk7XG5wcm90byA9IE9iamVjdC5hc3NpZ24ocHJvdG8sIFBuQmFzZUVsZW1lbnQpO1xuXG5QblV0aWxzLnJlZ2lzdGVyKCdsYWJlbCcsIHtcbiAgICBwcm90b3R5cGU6IHByb3RvXG59KTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiKzdaSnAwXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZWxlbWVudHMvcG4tbGFiZWwuanNcIixcIi9lbGVtZW50c1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBQbkJhc2VFbGVtZW50ID0gcmVxdWlyZSgnLi9iYXNlL3BuLWJhc2UtZWxlbWVudC5qcycpO1xudmFyIFBuVXRpbHMgPSByZXF1aXJlKCcuLi9wbi11dGlscy5qcycpO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCl7XG5cbiAgICB2YXIgYm9keUVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xuICAgIGJvZHlFbGVtZW50LnBvbHltZXJOYXRpdmUgPSB7fTtcbiAgICBib2R5RWxlbWVudC5wb2x5bWVyTmF0aXZlLmlkID0gJ3Jvb3QnO1xuXG4gICAgdmFyIGJvZHlQcm9wcyA9IFBuVXRpbHMuZ2V0RWxlbWVudFByb3BlcnRpZXMoYm9keUVsZW1lbnQpO1xuICAgIGJvZHlQcm9wcy50YWdOYW1lID0gJ3BuLXJvb3QnO1xuXG4gICAgY29uc29sZS5sb2coJ1VwZGF0aW5nIHJvb3QgdmlldycpO1xuXG4gICAgaWYgKHdpbmRvdy5wb2x5bWVyTmF0aXZlSG9zdCkge1xuICAgICAgICBwb2x5bWVyTmF0aXZlSG9zdC51cGRhdGVFbGVtZW50KEpTT04uc3RyaW5naWZ5KGJvZHlQcm9wcykpO1xuICAgIH1cblxuICAgIHdpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50LmVsZW1lbnRzWydyb290J10gPSB0aGlzO1xufSk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIis3WkpwMFwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2VsZW1lbnRzL3BuLXJvb3R2aWV3LmpzXCIsXCIvZWxlbWVudHNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgUmViZWxSb3V0ZSA9IHJlcXVpcmUoJy4uLy4uLy4uLy4uLy4uLy4uL3JlYmVsLXJvdXRlci9lczUvcmViZWwtcm91dGVyLmpzJykuUmViZWxSb3V0ZTtcbnZhciBwYXRoVG9SZWdleHAgPSByZXF1aXJlKCdwYXRoLXRvLXJlZ2V4cCcpO1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuLi9iYXNlL3BuLWJhc2UtZWxlbWVudC5qcycpO1xudmFyIFBuVXRpbHMgPSByZXF1aXJlKCcuLi8uLi9wbi11dGlscy5qcycpO1xuXG5cbnZhciBSb3V0ZSA9IChmdW5jdGlvbiAoX1JlYmVsUm91dGUpIHtcblxuICAgIFJvdXRlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoX1JlYmVsUm91dGVyICYmIF9SZWJlbFJvdXRlci5wcm90b3R5cGUpO1xuXG4gICAgZnVuY3Rpb24gUm91dGUoKSB7XG5cbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZihSb3V0ZSkuYXBwbHkodGhpcyk7XG4gICAgfVxuXG4gICAgUm91dGUucHJvdG90eXBlLmNyZWF0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUm91dGUucHJvdG90eXBlKS5jcmVhdGVkQ2FsbGJhY2suY2FsbCh0aGlzLCBcIm5hdGl2ZVwiKTtcbiAgICAgICAgUG5CYXNlRWxlbWVudC5jcmVhdGVkQ2FsbGJhY2soKTtcbiAgICB9O1xuXG4gICAgUm91dGUucHJvdG90eXBlLmF0dGFjaGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgT2JqZWN0LmdldFByb3RvdHlwZU9mKFJvdXRlLnByb3RvdHlwZSkuYXR0YWNoZWRDYWxsYmFjay5jYWxsKHRoaXMsIFwibmF0aXZlXCIpO1xuICAgICAgICBQbkJhc2VFbGVtZW50LmF0dGFjaGVkQ2FsbGJhY2soKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFJvdXRlO1xuXG59KShSZWJlbFJvdXRlcik7XG5cbnZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTERpdkVsZW1lbnQucHJvdG90eXBlKTtcbnByb3RvID0gT2JqZWN0LmFzc2lnbihwcm90bywgUG5CYXNlRWxlbWVudCk7XG5cbnByb3RvLmNyZWF0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZyhcIkNSRUFURUQ/XCIpO1xuICAgIFBuQmFzZUVsZW1lbnQuY3JlYXRlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuYWN0aXZhdGlvblByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgc2VsZi5hY3RpdmF0aW9uUHJvbWlzZVJlc29sdmUgPSByZXNvbHZlO1xuICAgIH0pO1xufVxuXG5wcm90by5hdHRhY2hlZENhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIFBuQmFzZUVsZW1lbnQuYXR0YWNoZWRDYWxsYmFjay5hcHBseSh0aGlzKTtcbiAgICAvL3RoaXMuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcblxuICAgIHRoaXMuaW5pdFBhdGhSZWdleHAoKTtcbiAgICAvL3RoaXMucm91dGVyID0gdGhpcy5maW5kUm91dGVyKCk7XG4gICAgLy90aGlzLnJvdXRlci5yZWdpc3RlclJvdXRlKHRoaXMpO1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBzZWxmLmFjdGl2YXRpb25Qcm9taXNlUmVzb2x2ZSgpO1xuICAgIH0sIDEwMCk7XG59XG5cbnByb3RvLmFjdGl2YXRlID0gZnVuY3Rpb24gKHNraXBOYXRpdmUpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLmFjdGl2YXRpb25Qcm9taXNlLnRoZW4oZnVuY3Rpb24oKXtcbiAgICAgICAgY29uc29sZS5sb2coJ0FjdGl2YXRpbmcgJyArIHNlbGYuaWQgKyAnICwgc2tpcHBpbmcgbmF0aXZlID0gJyArIHNraXBOYXRpdmUpO1xuICAgICAgICBpZiAod2luZG93LnBvbHltZXJOYXRpdmVIb3N0KSB7XG4gICAgICAgICAgICBpZiAoIXNraXBOYXRpdmUpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cucG9seW1lck5hdGl2ZUhvc3QuYWN0aXZhdGVSb3V0ZShzZWxmLnBvbHltZXJOYXRpdmUuaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbnByb3RvLmRlYWN0aXZhdGUgPSBmdW5jdGlvbiAoc2tpcE5hdGl2ZSkge1xuICAgIGNvbnNvbGUubG9nKCdEZWFjdGl2YXRpbmcgJyArIHRoaXMuaWQgKyAnICwgc2tpcHBpbmcgbmF0aXZlID0gJyArIHNraXBOYXRpdmUpO1xuICAgIGlmICghd2luZG93LnBvbHltZXJOYXRpdmVIb3N0ICYmICFza2lwTmF0aXZlKSB7XG4gICAgICAgIHRoaXMuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIH1cbn1cblxucHJvdG8uaW5pdFBhdGhSZWdleHAgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBhdGggPSB0aGlzLmdldEF0dHJpYnV0ZSgncGF0aCcpO1xuXG4gICAgaWYgKHBhdGgpIHtcbiAgICAgICAgdGhpcy5wYXRoUmVnZXhwID0gcGF0aFRvUmVnZXhwKHBhdGgpO1xuICAgIH1cbn1cblxucHJvdG8uZmluZFJvdXRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcGFyZW50ID0gdGhpcztcblxuICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG5cbiAgICAgICAgaWYgKHBhcmVudCAmJiBwYXJlbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnbmF0aXZlLXJvdXRlcicpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJlbnQ7XG4gICAgICAgIH0gZWxzZSBpZiAocGFyZW50ID09PSB3aW5kb3cuZG9jdW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5QblV0aWxzLnJlZ2lzdGVyKCdyb3V0ZScsIHtcbiAgICBwcm90b3R5cGU6IHByb3RvXG59KTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiKzdaSnAwXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZWxlbWVudHMvcm91dGVyL3BuLXJvdXRlLmpzXCIsXCIvZWxlbWVudHMvcm91dGVyXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFJlYmVsUm91dGVyID0gcmVxdWlyZSgnLi4vLi4vLi4vLi4vLi4vLi4vcmViZWwtcm91dGVyL2VzNS9yZWJlbC1yb3V0ZXIuanMnKS5SZWJlbFJvdXRlcjtcbi8vIHZhciBIaXN0b3J5ID0gcmVxdWlyZSgnaGlzdG9yeScpO1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuLi9iYXNlL3BuLWJhc2UtZWxlbWVudC5qcycpO1xudmFyIFBuVXRpbHMgPSByZXF1aXJlKCcuLi8uLi9wbi11dGlscy5qcycpO1xuXG4vL3BvbHltZXJOYXRpdmVDbGllbnQgc2hvdWxkIGJlIGdsb2JhbCB0byBiZSBhYmxlIHRvIGNhbGwgaXQgZnJvbSBuYXRpdmUgY29kZVxud2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudCB8fCB7fTtcblxudmFyIHN5bmNpbmdIaXN0b3J5V2l0aE5hdGl2ZSA9IGZhbHNlO1xuXG52YXIgUm91dGVyID0gKGZ1bmN0aW9uIChfUmViZWxSb3V0ZXIpIHtcblxuICAgIFJvdXRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKF9SZWJlbFJvdXRlciAmJiBfUmViZWxSb3V0ZXIucHJvdG90eXBlKTtcblxuICAgIGZ1bmN0aW9uIFJvdXRlcigpIHtcblxuICAgICAgICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKFJvdXRlcikuYXBwbHkodGhpcyk7XG4gICAgfVxuXG4gICAgUm91dGVyLnByb3RvdHlwZS5jcmVhdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgT2JqZWN0LmdldFByb3RvdHlwZU9mKFJvdXRlci5wcm90b3R5cGUpLmNyZWF0ZWRDYWxsYmFjay5jYWxsKHRoaXMsIFwibmF0aXZlXCIpO1xuICAgICAgICBQbkJhc2VFbGVtZW50LmNyZWF0ZWRDYWxsYmFjaygpO1xuICAgIH07XG5cbiAgICBSb3V0ZXIucHJvdG90eXBlLmF0dGFjaGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgT2JqZWN0LmdldFByb3RvdHlwZU9mKFJvdXRlci5wcm90b3R5cGUpLmF0dGFjaGVkQ2FsbGJhY2suY2FsbCh0aGlzLCBcIm5hdGl2ZVwiKTtcbiAgICAgICAgUG5CYXNlRWxlbWVudC5hdHRhY2hlZENhbGxiYWNrKCk7XG4gICAgfTtcblxuICAgIHJldHVybiBSb3V0ZXI7XG5cbn0pKFJlYmVsUm91dGVyKTtcblxuXG5cblxuLy8gdmFyIHByb3RvID0ge307XG4vL1xuLy8gLy9PYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4vLyBwcm90by5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlYmVsUm91dGVyICYmIFJlYmVsUm91dGVyLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogcHJvdG8sIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7XG4vLyBjb25zb2xlLmxvZyhcIlBST1RPOlwiLCBwcm90byk7XG4vLyAvL3Byb3RvID0gT2JqZWN0LmFzc2lnbihwcm90bywgUG5CYXNlRWxlbWVudCk7XG4vLyBwcm90by5jcmVhdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4vLyAgICAgT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvLnByb3RvdHlwZSkuY3JlYXRlZENhbGxiYWNrLmNhbGwodGhpcyk7XG4vLyAgICAgLy90aGlzLnByb3RvdHlwZS5jcmVhdGVkQ2FsbGJhY2suYXBwbHkodGhpcy5wcm90b3R5cGUpO1xuLy8gICAgIC8vUmViZWxSb3V0ZXIuY3JlYXRlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xuLy8gICAgIC8vdGhpcy5wcm90b3R5cGUuY3JlYXRlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xuLy8gICAgIC8vY29uc29sZS5sb2coKTtcbi8vICAgICAvL3RoaXMucHJvdG90eXBlLmNyZWF0ZWRDYWxsYmFjaygpO1xuLy8gICAgIC8vY29uc29sZS5sb2coXCJQTiBDUkVBVEVEIVwiKTtcbi8vICAgICAvL1BuQmFzZUVsZW1lbnQuY3JlYXRlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xuLy8gICAgIC8vdGhpcy5hY3RpdmVSb3V0ZSA9IG51bGw7XG4vLyAgICAgLy90aGlzLmluaXRIaXN0b3J5KCk7XG4vLyB9XG4vLyAvL1xuLy8gLy8gcHJvdG8uYXR0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbi8vIC8vICAgICAvL1BuQmFzZUVsZW1lbnQuYXR0YWNoZWRDYWxsYmFjay5hcHBseSh0aGlzKTtcbi8vIC8vICAgICAvL3RoaXMuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcbi8vIC8vIH1cbi8vXG4vLyAvLyBwcm90by5pbml0SGlzdG9yeSA9IGZ1bmN0aW9uICgpIHtcbi8vIC8vICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCB0aGlzLm9uSGlzdG9yeUNoYW5nZWQuYmluZCh0aGlzKSk7XG4vLyAvLyB9XG4vLyAvL1xuLy8gLy8gcHJvdG8ub25IaXN0b3J5Q2hhbmdlZCA9IGZ1bmN0aW9uIChoaXN0b3J5U3RhdGUsIHJvdXRlKSB7XG4vLyAvLyAgICAgdmFyIHJlc3VsdCA9IG51bGw7XG4vLyAvLyAgICAgdmFyIHJvdXRlVG9BY3RpdmF0ZSA9IG51bGw7XG4vLyAvL1xuLy8gLy8gICAgIGlmIChyb3V0ZSkge1xuLy8gLy8gICAgICAgICByZXN1bHQgPSBsb2NhdGlvbi5oYXNoLm1hdGNoKHJvdXRlLnBhdGhSZWdleHApO1xuLy8gLy8gICAgICAgICByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCAmJiAocm91dGVUb0FjdGl2YXRlID0gcm91dGUpO1xuLy8gLy8gICAgIH0gZWxzZSBpZiAodGhpcy5yb3V0ZXMpIHtcbi8vIC8vICAgICAgICAgdGhpcy5yb3V0ZXMuZm9yRWFjaChmdW5jdGlvbiAocm91dGUpIHtcbi8vIC8vICAgICAgICAgICAgIHJlc3VsdCA9IGxvY2F0aW9uLmhhc2gubWF0Y2gocm91dGUucGF0aFJlZ2V4cCk7XG4vLyAvLyAgICAgICAgICAgICByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCAmJiAocm91dGVUb0FjdGl2YXRlID0gcm91dGUpO1xuLy8gLy8gICAgICAgICB9KTtcbi8vIC8vICAgICB9XG4vLyAvL1xuLy8gLy8gICAgIHJvdXRlVG9BY3RpdmF0ZSAmJiB0aGlzLmFjdGl2YXRlUm91dGUocm91dGVUb0FjdGl2YXRlKTtcbi8vIC8vXG4vLyAvLyAgICAgdGhpcy5oaXN0b3J5U3RhdGUgPSBoaXN0b3J5U3RhdGU7XG4vLyAvLyB9XG4vLyAvL1xuLy8gLy8gcHJvdG8ucmVnaXN0ZXJSb3V0ZSA9IGZ1bmN0aW9uIChyb3V0ZSkge1xuLy8gLy8gICAgIHRoaXMucm91dGVzID0gdGhpcy5yb3V0ZXMgfHwgW107XG4vLyAvLyAgICAgdGhpcy5yb3V0ZXMucHVzaChyb3V0ZSk7XG4vLyAvLyAgICAgdGhpcy5vbkhpc3RvcnlDaGFuZ2VkKHRoaXMuaGlzdG9yeVN0YXRlLCByb3V0ZSk7XG4vLyAvLyB9XG4vLyAvL1xuLy8gLy8gcHJvdG8uYWN0aXZhdGVSb3V0ZSA9IGZ1bmN0aW9uIChyb3V0ZSkge1xuLy8gLy8gICAgIHZhciBzZWxmID0gdGhpcztcbi8vIC8vXG4vLyAvLyAgICAgdGhpcy5yb3V0ZXMuZm9yRWFjaChmdW5jdGlvbiAocm91dGVJdGVyYXRvcikge1xuLy8gLy8gICAgICAgICBpZiAocm91dGUgPT09IHJvdXRlSXRlcmF0b3IpIHtcbi8vIC8vICAgICAgICAgICAgIGlmIChzZWxmLmFjdGl2ZVJvdXRlICE9PSByb3V0ZSkge1xuLy8gLy8gICAgICAgICAgICAgICAgIHNlbGYuYWN0aXZlUm91dGUgPSByb3V0ZTtcbi8vIC8vICAgICAgICAgICAgICAgICByb3V0ZS5hY3RpdmF0ZShzeW5jaW5nSGlzdG9yeVdpdGhOYXRpdmUpO1xuLy8gLy8gICAgICAgICAgICAgfVxuLy8gLy8gICAgICAgICB9IGVsc2Uge1xuLy8gLy8gICAgICAgICAgICAgcm91dGVJdGVyYXRvci5kZWFjdGl2YXRlKHN5bmNpbmdIaXN0b3J5V2l0aE5hdGl2ZSk7XG4vLyAvLyAgICAgICAgIH1cbi8vIC8vICAgICB9KTtcbi8vIC8vIH1cblxud2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQuYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICBzeW5jaW5nSGlzdG9yeVdpdGhOYXRpdmUgPSB0cnVlO1xuICAgIHdpbmRvdy5oaXN0b3J5LmJhY2soKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIHN5bmNpbmdIaXN0b3J5V2l0aE5hdGl2ZSA9IGZhbHNlO1xuICAgIH0sIDApO1xufVxuXG5QblV0aWxzLnJlZ2lzdGVyKCdyb3V0ZXInLCB7XG4gICAgcHJvdG90eXBlOiBSb3V0ZXIucHJvdG90eXBlXG59KTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiKzdaSnAwXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZWxlbWVudHMvcm91dGVyL3BuLXJvdXRlci5qc1wiLFwiL2VsZW1lbnRzL3JvdXRlclwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnJlcXVpcmUoJ3dlYmNvbXBvbmVudHMuanMnKTtcbnJlcXVpcmUoJy4vcG4tdXRpbHMuanMnKTtcbnJlcXVpcmUoJy4vZWxlbWVudHMvYmFzZS9wbi1iYXNlLWVsZW1lbnQuanMnKTtcbnJlcXVpcmUoJy4vZWxlbWVudHMvYmFzZS9wbi12aWV3LmpzJyk7XG5yZXF1aXJlKCcuL2VsZW1lbnRzL3BuLXJvb3R2aWV3LmpzJyk7XG5yZXF1aXJlKCcuL2VsZW1lbnRzL3BuLWltZy5qcycpO1xucmVxdWlyZSgnLi9lbGVtZW50cy9wbi1sYWJlbC5qcycpO1xucmVxdWlyZSgnLi9lbGVtZW50cy9wbi1idXR0b24uanMnKTtcbnJlcXVpcmUoJy4vZWxlbWVudHMvcG4taW5wdXQuanMnKTtcbnJlcXVpcmUoJy4vZWxlbWVudHMvcG4tY2hlY2tib3guanMnKTtcbnJlcXVpcmUoJy4vZWxlbWVudHMvcm91dGVyL3BuLXJvdXRlLmpzJyk7XG5yZXF1aXJlKCcuL2VsZW1lbnRzL3JvdXRlci9wbi1yb3V0ZXIuanMnKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiKzdaSnAwXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZmFrZV84YzljNWI0NS5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBwb2x5bWVyTmF0aXZlT2JqZWN0SWQgPSAwO1xuXG52YXIgdXRpbHMgPSB7XG5cbiAgICBkcm9wSWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG9seW1lck5hdGl2ZU9iamVjdElkID0gMDtcbiAgICB9LFxuXG4gICAgZ2V0TmV4dElkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBwb2x5bWVyTmF0aXZlT2JqZWN0SWQrKyArICcnO1xuICAgIH0sXG5cbiAgICBnZXRFbGVtZW50UHJvcGVydGllczogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGlkID0gZWxlbWVudC5wb2x5bWVyTmF0aXZlLmlkO1xuICAgICAgICB2YXIgdGFnTmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdpcycpIHx8IGVsZW1lbnQudGFnTmFtZTtcbiAgICAgICAgdmFyIHBhcmVudCA9IGVsZW1lbnQuZ2V0UE5QYXJlbnQgJiYgZWxlbWVudC5nZXRQTlBhcmVudCgpO1xuICAgICAgICB2YXIgcGFyZW50SWQgPSBwYXJlbnQgPyBwYXJlbnQucG9seW1lck5hdGl2ZS5pZCA6IG51bGw7XG4gICAgICAgIHZhciBib3VuZHMgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB2YXIgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcbiAgICAgICAgdmFyIHRleHQgPSBlbGVtZW50LnRleHRDb250ZW50LnJlcGxhY2UoL1xcc3syLH0vZywnJyk7XG4gICAgICAgIHZhciBzcmMgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgIHZhciB2YWx1ZSA9IGVsZW1lbnQudmFsdWU7XG4gICAgICAgIHZhciBwbGFjZWhvbGRlciA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpO1xuICAgICAgICB2YXIgYXR0cmlidXRlcyA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudC5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYXR0cmlidXRlTmFtZSA9IGVsZW1lbnQuYXR0cmlidXRlc1tpXS5uYW1lO1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgIT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXR0cmlidXRlVmFsdWUgPSBlbGVtZW50LmF0dHJpYnV0ZXNbaV0udmFsdWU7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSA9IGF0dHJpYnV0ZVZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coJ1VwZGF0aW5nICcgKyBlbGVtZW50LnRhZ05hbWUgKyAnLCBpZD0nICsgaWQgKyAnLCB0byAnICsgKHBhcmVudCA/IHBhcmVudC50YWdOYW1lIDogJ3Jvb3QnKSArICcgJyArIHBhcmVudElkICsgJywgc2l6ZT0nICsgYm91bmRzLndpZHRoICsgJ3gnICsgYm91bmRzLmhlaWdodCk7XG5cbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudEJvdW5kcyA9IHBhcmVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGJvdW5kcyA9IHtcbiAgICAgICAgICAgICAgICB3aWR0aDogYm91bmRzLndpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogYm91bmRzLmhlaWdodCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBib3VuZHMubGVmdCAtIHBhcmVudEJvdW5kcy5sZWZ0LFxuICAgICAgICAgICAgICAgIHRvcDogYm91bmRzLnRvcCAtIHBhcmVudEJvdW5kcy50b3BcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgICAgICAgICAgYm91bmRzOiBib3VuZHMsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBzdHlsZS5kaXNwbGF5LFxuICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6IHN0eWxlLnZpc2liaWxpdHksXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBzdHlsZS5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlOiBzdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPT09ICdub25lJyA/IHVuZGVmaW5lZCA6IHN0eWxlLmJhY2tncm91bmRJbWFnZS5yZXBsYWNlKCd1cmwoJywnJykucmVwbGFjZSgnKScsJycpLFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiBzdHlsZS5mb250U2l6ZSxcbiAgICAgICAgICAgICAgICBjb2xvcjogc3R5bGUuY29sb3IsXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiBzdHlsZS5ib3JkZXJSYWRpdXMsXG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6IHN0eWxlLmJvcmRlckNvbG9yLFxuICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOiBzdHlsZS5ib3JkZXJXaWR0aCxcbiAgICAgICAgICAgICAgICB0ZXh0QWxpZ246IHN0eWxlLnRleHRBbGlnblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRleHQ6IHRleHQsXG4gICAgICAgICAgICBzcmM6IHNyYyxcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBwbGFjZWhvbGRlcixcbiAgICAgICAgICAgIHBhcmVudElkOiBwYXJlbnRJZFxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldEVsZW1lbnRCeUlkOiBmdW5jdGlvbiAoZWxlbWVudElkKSB7XG4gICAgICAgIHJldHVybiBwb2x5bWVyTmF0aXZlQ2xpZW50LmVsZW1lbnRzW2VsZW1lbnRJZF07XG4gICAgfSxcblxuICAgIGNhbGxNZXRob2Q6IGZ1bmN0aW9uIChlbGVtZW50SWQsIG1ldGhvZE5hbWUsIGFyZ3VtZW50KSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gd2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQudXRpbHMuZ2V0RWxlbWVudEJ5SWQoZWxlbWVudElkKTtcbiAgICAgICAgZWxlbWVudFttZXRob2ROYW1lXS5jYWxsKGVsZW1lbnQsIGFyZ3VtZW50KTtcbiAgICB9LFxuXG4gICAgZGlzcGF0Y2hFdmVudDogZnVuY3Rpb24gKGVsZW1lbnRJZCwgZXZlbnROYW1lLCBkYXRhKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gd2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQudXRpbHMuZ2V0RWxlbWVudEJ5SWQoZWxlbWVudElkKTtcbiAgICAgICAgd2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQudXRpbHMuZmlyZUV2ZW50KGVsZW1lbnQsIGV2ZW50TmFtZSk7XG4gICAgfSxcblxuICAgIGZpcmVFdmVudDogZnVuY3Rpb24gKG5vZGUsIGV2ZW50TmFtZSkge1xuICAgICAgICAvLyBNYWtlIHN1cmUgd2UgdXNlIHRoZSBvd25lckRvY3VtZW50IGZyb20gdGhlIHByb3ZpZGVkIG5vZGUgdG8gYXZvaWQgY3Jvc3Mtd2luZG93IHByb2JsZW1zXG4gICAgICAgIHZhciBkb2M7XG4gICAgICAgIGlmIChub2RlLm93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgIGRvYyA9IG5vZGUub3duZXJEb2N1bWVudDtcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm5vZGVUeXBlID09IDkpIHtcbiAgICAgICAgICAgIC8vIHRoZSBub2RlIG1heSBiZSB0aGUgZG9jdW1lbnQgaXRzZWxmLCBub2RlVHlwZSA5ID0gRE9DVU1FTlRfTk9ERVxuICAgICAgICAgICAgZG9jID0gbm9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgbm9kZSBwYXNzZWQgdG8gZmlyZUV2ZW50OiBcIiArIG5vZGUuaWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vZGUuZGlzcGF0Y2hFdmVudCkge1xuICAgICAgICAgICAgLy8gR2Vja28tc3R5bGUgYXBwcm9hY2ggKG5vdyB0aGUgc3RhbmRhcmQpIHRha2VzIG1vcmUgd29ya1xuICAgICAgICAgICAgdmFyIGV2ZW50Q2xhc3MgPSBcIlwiO1xuXG4gICAgICAgICAgICAvLyBEaWZmZXJlbnQgZXZlbnRzIGhhdmUgZGlmZmVyZW50IGV2ZW50IGNsYXNzZXMuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIHN3aXRjaCBzdGF0ZW1lbnQgY2FuJ3QgbWFwIGFuIGV2ZW50TmFtZSB0byBhbiBldmVudENsYXNzLFxuICAgICAgICAgICAgLy8gdGhlIGV2ZW50IGZpcmluZyBpcyBnb2luZyB0byBmYWlsLlxuICAgICAgICAgICAgc3dpdGNoIChldmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiY2xpY2tcIjogLy8gRGlzcGF0Y2hpbmcgb2YgJ2NsaWNrJyBhcHBlYXJzIHRvIG5vdCB3b3JrIGNvcnJlY3RseSBpbiBTYWZhcmkuIFVzZSAnbW91c2Vkb3duJyBvciAnbW91c2V1cCcgaW5zdGVhZC5cbiAgICAgICAgICAgICAgICBjYXNlIFwibW91c2Vkb3duXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIm1vdXNldXBcIjpcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRDbGFzcyA9IFwiTW91c2VFdmVudHNcIjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIFwiZm9jdXNcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiY2hhbmdlXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcImJsdXJcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwic2VsZWN0XCI6XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50Q2xhc3MgPSBcIkhUTUxFdmVudHNcIjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcImZpcmVFdmVudDogQ291bGRuJ3QgZmluZCBhbiBldmVudCBjbGFzcyBmb3IgZXZlbnQgJ1wiICsgZXZlbnROYW1lICsgXCInLlwiO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBldmVudCA9IGRvYy5jcmVhdGVFdmVudChldmVudENsYXNzKTtcbiAgICAgICAgICAgIGV2ZW50LmluaXRFdmVudChldmVudE5hbWUsIHRydWUsIHRydWUpOyAvLyBBbGwgZXZlbnRzIGNyZWF0ZWQgYXMgYnViYmxpbmcgYW5kIGNhbmNlbGFibGUuXG5cbiAgICAgICAgICAgIGV2ZW50LnN5bnRoZXRpYyA9IHRydWU7IC8vIGFsbG93IGRldGVjdGlvbiBvZiBzeW50aGV0aWMgZXZlbnRzXG4gICAgICAgICAgICAvLyBUaGUgc2Vjb25kIHBhcmFtZXRlciBzYXlzIGdvIGFoZWFkIHdpdGggdGhlIGRlZmF1bHQgYWN0aW9uXG4gICAgICAgICAgICBub2RlLmRpc3BhdGNoRXZlbnQoZXZlbnQsIHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKG5vZGUuZmlyZUV2ZW50KSB7XG4gICAgICAgICAgICAvLyBJRS1vbGQgc2Nob29sIHN0eWxlXG4gICAgICAgICAgICB2YXIgZXZlbnQgPSBkb2MuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgICAgICAgICAgIGV2ZW50LnN5bnRoZXRpYyA9IHRydWU7IC8vIGFsbG93IGRldGVjdGlvbiBvZiBzeW50aGV0aWMgZXZlbnRzXG4gICAgICAgICAgICBub2RlLmZpcmVFdmVudChcIm9uXCIgKyBldmVudE5hbWUsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uIChuYW1lLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHZhciB0YWdOYW1lID0gJ25hdGl2ZS0nICsgbmFtZTtcbiAgICAgICAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KHRhZ05hbWUsIHByb3BlcnRpZXMpO1xuICAgIH1cbn07XG5cbndpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50ID0gd2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQgfHwge307XG53aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC51dGlscyA9IHV0aWxzO1xud2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQuZGlzcGF0Y2hFdmVudCA9IHV0aWxzLmRpc3BhdGNoRXZlbnQ7XG53aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC5jYWxsTWV0aG9kID0gdXRpbHMuY2FsbE1ldGhvZDtcblxuaWYgKHdpbmRvdy5wb2x5bWVyTmF0aXZlSG9zdCkge1xuICAgIHdpbmRvdy5hbGVydCA9IHBvbHltZXJOYXRpdmVIb3N0LmFsZXJ0O1xuICAgIHdpbmRvdy5jb25zb2xlLmxvZyA9IHBvbHltZXJOYXRpdmVIb3N0LmxvZztcbn1cblxuXG5pZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gIT0gJ2Z1bmN0aW9uJykge1xuICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24gPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgICAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQgfHwgdGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSBPYmplY3QodGFyZ2V0KTtcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMTsgaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZSAhPT0gdW5kZWZpbmVkICYmIHNvdXJjZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuZXh0S2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShuZXh0S2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFtuZXh0S2V5XSA9IHNvdXJjZVtuZXh0S2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH07XG4gICAgfSkoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB1dGlscztcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiKzdaSnAwXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvcG4tdXRpbHMuanNcIixcIi9cIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG5cInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKCFzZWxmKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gY2FsbCAmJiAodHlwZW9mIGNhbGwgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikgPyBjYWxsIDogc2VsZjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxuLyoqXG4gKiBDcmVhdGVkIGJ5IExlb24gUmV2aWxsIG9uIDE1LzEyLzIwMTUuXG4gKiBCbG9nOiBibG9nLnJldmlsbHdlYi5jb21cbiAqIEdpdEh1YjogaHR0cHM6Ly9naXRodWIuY29tL1JldmlsbFdlYlxuICogVHdpdHRlcjogQFJldmlsbFdlYlxuICovXG5cbi8qKlxuICogVGhlIG1haW4gcm91dGVyIGNsYXNzIGFuZCBlbnRyeSBwb2ludCB0byB0aGUgcm91dGVyLlxuICovXG5cbnZhciBSZWJlbFJvdXRlciA9IGV4cG9ydHMuUmViZWxSb3V0ZXIgPSAoZnVuY3Rpb24gKF9IVE1MRWxlbWVudCkge1xuICAgIF9pbmhlcml0cyhSZWJlbFJvdXRlciwgX0hUTUxFbGVtZW50KTtcblxuICAgIGZ1bmN0aW9uIFJlYmVsUm91dGVyKCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgUmViZWxSb3V0ZXIpO1xuXG4gICAgICAgIHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUmViZWxSb3V0ZXIpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhSZWJlbFJvdXRlciwgW3tcbiAgICAgICAga2V5OiBcImNyZWF0ZWRDYWxsYmFja1wiLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYWluIGluaXRpYWxpc2F0aW9uIHBvaW50IG9mIHJlYmVsLXJvdXRlclxuICAgICAgICAgKiBAcGFyYW0gcHJlZml4IC0gSWYgZXh0ZW5kaW5nIHJlYmVsLXJvdXRlciB5b3UgY2FuIHNwZWNpZnkgYSBwcmVmaXggd2hlbiBjYWxsaW5nIGNyZWF0ZWRDYWxsYmFjayBpbiBjYXNlIHlvdXIgZWxlbWVudHMgbmVlZCB0byBiZSBuYW1lZCBkaWZmZXJlbnRseVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZWRDYWxsYmFjayhwcmVmaXgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YXIgX3ByZWZpeCA9IHByZWZpeCB8fCBcInJlYmVsXCI7XG5cbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNQYXRoID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuYmFzZVBhdGggPSBudWxsO1xuXG4gICAgICAgICAgICAvL0dldCBvcHRpb25zXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgXCJhbmltYXRpb25cIjogdGhpcy5nZXRBdHRyaWJ1dGUoXCJhbmltYXRpb25cIikgPT0gXCJ0cnVlXCIsXG4gICAgICAgICAgICAgICAgXCJzaGFkb3dSb290XCI6IHRoaXMuZ2V0QXR0cmlidXRlKFwic2hhZG93XCIpID09IFwidHJ1ZVwiLFxuICAgICAgICAgICAgICAgIFwiaW5oZXJpdFwiOiB0aGlzLmdldEF0dHJpYnV0ZShcImluaGVyaXRcIikgIT0gXCJmYWxzZVwiXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvL0dldCByb3V0ZXNcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaW5oZXJpdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIC8vSWYgdGhpcyBpcyBhIG5lc3RlZCByb3V0ZXIgdGhlbiB3ZSBuZWVkIHRvIGdvIGFuZCBnZXQgdGhlIHBhcmVudCBwYXRoXG4gICAgICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICAgICAgICB3aGlsZSAoJGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAkZWxlbWVudCA9ICRlbGVtZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09IF9wcmVmaXggKyBcIi1yb3V0ZXJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSAkZWxlbWVudC5jdXJyZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJhc2VQYXRoID0gY3VycmVudC5yb3V0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yb3V0ZXMgPSB7fTtcbiAgICAgICAgICAgIHZhciAkY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgJGNoaWxkID0gJGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIHZhciBwYXRoID0gJGNoaWxkLmdldEF0dHJpYnV0ZShcInBhdGhcIik7XG4gICAgICAgICAgICAgICAgc3dpdGNoICgkY2hpbGQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIF9wcmVmaXggKyBcIi1kZWZhdWx0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gXCIqXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBfcHJlZml4ICsgXCItcm91dGVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSB0aGlzLmJhc2VQYXRoICE9PSBudWxsID8gdGhpcy5iYXNlUGF0aCArIHBhdGggOiBwYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChwYXRoICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm91dGVzW3BhdGhdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjb21wb25lbnRcIjogJGNoaWxkLmdldEF0dHJpYnV0ZShcImNvbXBvbmVudFwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGVtcGxhdGVcIjogJGNoaWxkLmlubmVySFRNTCB8fCBudWxsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL0FmdGVyIHdlIGhhdmUgY29sbGVjdGVkIGFsbCBjb25maWd1cmF0aW9uIGNsZWFyIGlubmVySFRNTFxuICAgICAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBcIlwiO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNoYWRvd1Jvb3QgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZVNoYWRvd1Jvb3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJvb3QgPSB0aGlzLnNoYWRvd1Jvb3Q7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucm9vdCA9IHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdEFuaW1hdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICAgIFJlYmVsUm91dGVyLnBhdGhDaGFuZ2UoZnVuY3Rpb24gKGlzQmFjaykge1xuICAgICAgICAgICAgICAgIGlmIChfdGhpczIub3B0aW9ucy5hbmltYXRpb24gPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzQmFjayA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMyLmNsYXNzTGlzdC5hZGQoXCJyYmwtYmFja1wiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzMi5jbGFzc0xpc3QucmVtb3ZlKFwicmJsLWJhY2tcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3RoaXMyLnJlbmRlcigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogRnVuY3Rpb24gdXNlZCB0byBpbml0aWFsaXNlIHRoZSBhbmltYXRpb24gbWVjaGFuaWNzIGlmIGFuaW1hdGlvbiBpcyB0dXJuZWQgb25cbiAgICAgICAgICovXG5cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJpbml0QW5pbWF0aW9uXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBpbml0QW5pbWF0aW9uKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIChtdXRhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IG11dGF0aW9uc1swXS5hZGRlZE5vZGVzWzBdO1xuICAgICAgICAgICAgICAgIGlmIChub2RlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvdGhlckNoaWxkcmVuID0gX3RoaXMzLmdldE90aGVyQ2hpbGRyZW4obm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNsYXNzTGlzdC5hZGQoXCJyZWJlbC1hbmltYXRlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jbGFzc0xpc3QuYWRkKFwiZW50ZXJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3RoZXJDaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG90aGVyQ2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmNsYXNzTGlzdC5hZGQoXCJleGl0XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuY2xhc3NMaXN0LmFkZChcImNvbXBsZXRlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2xhc3NMaXN0LmFkZChcImNvbXBsZXRlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbmltYXRpb25FbmQgPSBmdW5jdGlvbiBhbmltYXRpb25FbmQoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LmNsYXNzTmFtZS5pbmRleE9mKFwiZXhpdFwiKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzMy5yb290LnJlbW92ZUNoaWxkKGV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgYW5pbWF0aW9uRW5kKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImFuaW1hdGlvbmVuZFwiLCBhbmltYXRpb25FbmQpO1xuICAgICAgICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLCB7IGNoaWxkTGlzdDogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNZXRob2QgdXNlZCB0byBnZXQgdGhlIGN1cnJlbnQgcm91dGUgb2JqZWN0XG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImN1cnJlbnRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGN1cnJlbnQoKSB7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IFJlYmVsUm91dGVyLmdldFBhdGhGcm9tVXJsKCk7XG4gICAgICAgICAgICBmb3IgKHZhciByb3V0ZSBpbiB0aGlzLnJvdXRlcykge1xuICAgICAgICAgICAgICAgIGlmIChyb3V0ZSAhPT0gXCIqXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2V4U3RyaW5nID0gXCJeXCIgKyByb3V0ZS5yZXBsYWNlKC97XFx3K31cXC8/L2csIFwiKFxcXFx3KylcXC8/XCIpO1xuICAgICAgICAgICAgICAgICAgICByZWdleFN0cmluZyArPSByZWdleFN0cmluZy5pbmRleE9mKFwiXFxcXC8/XCIpID4gLTEgPyBcIlwiIDogXCJcXFxcLz9cIiArIFwiKFs/PSYtXFwvXFxcXHcrXSspPyRcIjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleFN0cmluZyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWdleC50ZXN0KHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3JvdXRlUmVzdWx0KHRoaXMucm91dGVzW3JvdXRlXSwgcm91dGUsIHJlZ2V4LCBwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJvdXRlc1tcIipcIl0gIT09IHVuZGVmaW5lZCA/IF9yb3V0ZVJlc3VsdCh0aGlzLnJvdXRlc1tcIipcIl0sIFwiKlwiLCBudWxsLCBwYXRoKSA6IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogTWV0aG9kIGNhbGxlZCB0byByZW5kZXIgdGhlIGN1cnJlbnQgdmlld1xuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInJlbmRlclwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuY3VycmVudCgpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQucGF0aCAhPT0gdGhpcy5wcmV2aW91c1BhdGggfHwgdGhpcy5vcHRpb25zLmFuaW1hdGlvbiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbiAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yb290LmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5jb21wb25lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkY29tcG9uZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChyZXN1bHQuY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiByZXN1bHQucGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gcmVzdWx0LnBhcmFtc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJPYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBKU09OLnBhcnNlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkNvdWxkbid0IHBhcnNlIHBhcmFtIHZhbHVlOlwiLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkY29tcG9uZW50LnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucm9vdC5hcHBlbmRDaGlsZCgkY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkdGVtcGxhdGUgPSByZXN1bHQudGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1RPRE86IEZpbmQgYSBmYXN0ZXIgYWx0ZXJuYXRpdmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkdGVtcGxhdGUuaW5kZXhPZihcIiR7XCIpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGVtcGxhdGUgPSAkdGVtcGxhdGUucmVwbGFjZSgvXFwkeyhbXnt9XSopfS9nLCBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgciA9IHJlc3VsdC5wYXJhbXNbYl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgciA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHIgPT09ICdudW1iZXInID8gciA6IGE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJvb3QuaW5uZXJIVE1MID0gXCI8ZGl2PlwiICsgJHRlbXBsYXRlICsgXCI8L2Rpdj5cIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzUGF0aCA9IHJlc3VsdC5wYXRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gbm9kZSAtIFVzZWQgd2l0aCB0aGUgYW5pbWF0aW9uIG1lY2hhbmljcyB0byBnZXQgYWxsIG90aGVyIHZpZXcgY2hpbGRyZW4gZXhjZXB0IGl0c2VsZlxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0T3RoZXJDaGlsZHJlblwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0T3RoZXJDaGlsZHJlbihub2RlKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLnJvb3QuY2hpbGRyZW47XG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZCAhPSBub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgIH1cbiAgICB9XSwgW3tcbiAgICAgICAga2V5OiBcInBhcnNlUXVlcnlTdHJpbmdcIixcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RhdGljIGhlbHBlciBtZXRob2QgdG8gcGFyc2UgdGhlIHF1ZXJ5IHN0cmluZyBmcm9tIGEgdXJsIGludG8gYW4gb2JqZWN0LlxuICAgICAgICAgKiBAcGFyYW0gdXJsXG4gICAgICAgICAqIEByZXR1cm5zIHt7fX1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nKHVybCkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgaWYgKHVybCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHF1ZXJ5U3RyaW5nID0gdXJsLmluZGV4T2YoXCI/XCIpID4gLTEgPyB1cmwuc3Vic3RyKHVybC5pbmRleE9mKFwiP1wiKSArIDEsIHVybC5sZW5ndGgpIDogbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAocXVlcnlTdHJpbmcgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcXVlcnlTdHJpbmcuc3BsaXQoXCImXCIpLmZvckVhY2goZnVuY3Rpb24gKHBhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGFydCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFydCA9IHBhcnQucmVwbGFjZShcIitcIiwgXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVxID0gcGFydC5pbmRleE9mKFwiPVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBlcSA+IC0xID8gcGFydC5zdWJzdHIoMCwgZXEpIDogcGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWwgPSBlcSA+IC0xID8gZGVjb2RlVVJJQ29tcG9uZW50KHBhcnQuc3Vic3RyKGVxICsgMSkpIDogXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmcm9tID0ga2V5LmluZGV4T2YoXCJbXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZyb20gPT0gLTEpIHJlc3VsdFtkZWNvZGVVUklDb21wb25lbnQoa2V5KV0gPSB2YWw7ZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvID0ga2V5LmluZGV4T2YoXCJdXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGRlY29kZVVSSUNvbXBvbmVudChrZXkuc3Vic3RyaW5nKGZyb20gKyAxLCB0bykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChrZXkuc3Vic3RyaW5nKDAsIGZyb20pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdFtrZXldKSByZXN1bHRba2V5XSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaW5kZXgpIHJlc3VsdFtrZXldLnB1c2godmFsKTtlbHNlIHJlc3VsdFtrZXldW2luZGV4XSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdGF0aWMgaGVscGVyIG1ldGhvZCB0byBjb252ZXJ0IGEgY2xhc3MgbmFtZSB0byBhIHZhbGlkIGVsZW1lbnQgbmFtZS5cbiAgICAgICAgICogQHBhcmFtIENsYXNzXG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY2xhc3NUb1RhZ1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY2xhc3NUb1RhZyhDbGFzcykge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDbGFzcy5uYW1lIHdvdWxkIGJlIGJldHRlciBidXQgdGhpcyBpc24ndCBzdXBwb3J0ZWQgaW4gSUUgMTEuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBDbGFzcy50b1N0cmluZygpLm1hdGNoKC9eZnVuY3Rpb25cXHMqKFteXFxzKF0rKS8pWzFdLnJlcGxhY2UoL1xcVysvZywgJy0nKS5yZXBsYWNlKC8oW2EtelxcZF0pKFtBLVowLTldKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkbid0IHBhcnNlIGNsYXNzIG5hbWU6XCIsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFJlYmVsUm91dGVyLnZhbGlkRWxlbWVudFRhZyhuYW1lKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDbGFzcyBuYW1lIGNvdWxkbid0IGJlIHRyYW5zbGF0ZWQgdG8gdGFnLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0YXRpYyBoZWxwZXIgbWV0aG9kIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIGFuIGVsZW1lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWUgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLlxuICAgICAgICAgKiBAcGFyYW0gbmFtZVxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgICAgICovXG5cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJpc1JlZ2lzdGVyZWRFbGVtZW50XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBpc1JlZ2lzdGVyZWRFbGVtZW50KG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpLmNvbnN0cnVjdG9yICE9PSBIVE1MRWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdGF0aWMgaGVscGVyIG1ldGhvZCB0byB0YWtlIGEgd2ViIGNvbXBvbmVudCBjbGFzcywgY3JlYXRlIGFuIGVsZW1lbnQgbmFtZSBhbmQgcmVnaXN0ZXIgdGhlIG5ldyBlbGVtZW50IG9uIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICogQHBhcmFtIENsYXNzXG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3JlYXRlRWxlbWVudFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlRWxlbWVudChDbGFzcykge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSBSZWJlbFJvdXRlci5jbGFzc1RvVGFnKENsYXNzKTtcbiAgICAgICAgICAgIGlmIChSZWJlbFJvdXRlci5pc1JlZ2lzdGVyZWRFbGVtZW50KG5hbWUpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIENsYXNzLnByb3RvdHlwZS5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQobmFtZSwgQ2xhc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2ltcGxlIHN0YXRpYyBoZWxwZXIgbWV0aG9kIGNvbnRhaW5pbmcgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gdmFsaWRhdGUgYW4gZWxlbWVudCBuYW1lXG4gICAgICAgICAqIEBwYXJhbSB0YWdcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwidmFsaWRFbGVtZW50VGFnXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB2YWxpZEVsZW1lbnRUYWcodGFnKSB7XG4gICAgICAgICAgICByZXR1cm4gKC9eW2EtejAtOVxcLV0rJC8udGVzdCh0YWcpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1ldGhvZCB1c2VkIHRvIHJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIFVSTCBwYXRoIGNoYW5nZXMuXG4gICAgICAgICAqIEBwYXJhbSBjYWxsYmFja1xuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInBhdGhDaGFuZ2VcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHBhdGhDaGFuZ2UoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChSZWJlbFJvdXRlci5jaGFuZ2VDYWxsYmFja3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFJlYmVsUm91dGVyLmNoYW5nZUNhbGxiYWNrcyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgUmViZWxSb3V0ZXIuY2hhbmdlQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgdmFyIGNoYW5nZUhhbmRsZXIgPSBmdW5jdGlvbiBjaGFuZ2VIYW5kbGVyKCkge1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqICBldmVudC5vbGRVUkwgYW5kIGV2ZW50Lm5ld1VSTCB3b3VsZCBiZSBiZXR0ZXIgaGVyZSBidXQgdGhpcyBkb2Vzbid0IHdvcmsgaW4gSUUgOihcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLmhyZWYgIT0gUmViZWxSb3V0ZXIub2xkVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIFJlYmVsUm91dGVyLmNoYW5nZUNhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soUmViZWxSb3V0ZXIuaXNCYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIFJlYmVsUm91dGVyLmlzQmFjayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBSZWJlbFJvdXRlci5vbGRVUkwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAod2luZG93Lm9uaGFzaGNoYW5nZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmJsYmFja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIFJlYmVsUm91dGVyLmlzQmFjayA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aW5kb3cub25oYXNoY2hhbmdlID0gY2hhbmdlSGFuZGxlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdGF0aWMgaGVscGVyIG1ldGhvZCB1c2VkIHRvIGdldCB0aGUgcGFyYW1ldGVycyBmcm9tIHRoZSBwcm92aWRlZCByb3V0ZS5cbiAgICAgICAgICogQHBhcmFtIHJlZ2V4XG4gICAgICAgICAqIEBwYXJhbSByb3V0ZVxuICAgICAgICAgKiBAcGFyYW0gcGF0aFxuICAgICAgICAgKiBAcmV0dXJucyB7e319XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0UGFyYW1zRnJvbVVybFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0UGFyYW1zRnJvbVVybChyZWdleCwgcm91dGUsIHBhdGgpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBSZWJlbFJvdXRlci5wYXJzZVF1ZXJ5U3RyaW5nKHBhdGgpO1xuICAgICAgICAgICAgdmFyIHJlID0gL3soXFx3Kyl9L2c7XG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgdmFyIG1hdGNoID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgd2hpbGUgKG1hdGNoID0gcmUuZXhlYyhyb3V0ZSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobWF0Y2hbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlZ2V4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdHMyID0gcmVnZXguZXhlYyhwYXRoKTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0sIGlkeCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbaXRlbV0gPSByZXN1bHRzMltpZHggKyAxXTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RhdGljIGhlbHBlciBtZXRob2QgdXNlZCB0byBnZXQgdGhlIHBhdGggZnJvbSB0aGUgY3VycmVudCBVUkwuXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldFBhdGhGcm9tVXJsXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRQYXRoRnJvbVVybCgpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5tYXRjaCgvIyguKikkLyk7XG4gICAgICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBSZWJlbFJvdXRlcjtcbn0pKEhUTUxFbGVtZW50KTtcblxuZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwicmViZWwtcm91dGVyXCIsIFJlYmVsUm91dGVyKTtcblxuLyoqXG4gKiBDbGFzcyB3aGljaCByZXByZXNlbnRzIHRoZSByZWJlbC1yb3V0ZSBjdXN0b20gZWxlbWVudFxuICovXG5cbnZhciBSZWJlbFJvdXRlID0gKGZ1bmN0aW9uIChfSFRNTEVsZW1lbnQyKSB7XG4gICAgX2luaGVyaXRzKFJlYmVsUm91dGUsIF9IVE1MRWxlbWVudDIpO1xuXG4gICAgZnVuY3Rpb24gUmViZWxSb3V0ZSgpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFJlYmVsUm91dGUpO1xuXG4gICAgICAgIHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUmViZWxSb3V0ZSkuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFJlYmVsUm91dGU7XG59KShIVE1MRWxlbWVudCk7XG5cbmRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcInJlYmVsLXJvdXRlXCIsIFJlYmVsUm91dGUpO1xuXG4vKipcbiAqIENsYXNzIHdoaWNoIHJlcHJlc2VudHMgdGhlIHJlYmVsLWRlZmF1bHQgY3VzdG9tIGVsZW1lbnRcbiAqL1xuXG52YXIgUmViZWxEZWZhdWx0ID0gKGZ1bmN0aW9uIChfSFRNTEVsZW1lbnQzKSB7XG4gICAgX2luaGVyaXRzKFJlYmVsRGVmYXVsdCwgX0hUTUxFbGVtZW50Myk7XG5cbiAgICBmdW5jdGlvbiBSZWJlbERlZmF1bHQoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBSZWJlbERlZmF1bHQpO1xuXG4gICAgICAgIHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUmViZWxEZWZhdWx0KS5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUmViZWxEZWZhdWx0O1xufSkoSFRNTEVsZW1lbnQpO1xuXG5kb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJyZWJlbC1kZWZhdWx0XCIsIFJlYmVsRGVmYXVsdCk7XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgcHJvdG90eXBlIGZvciBhbiBhbmNob3IgZWxlbWVudCB3aGljaCBhZGRlZCBmdW5jdGlvbmFsaXR5IHRvIHBlcmZvcm0gYSBiYWNrIHRyYW5zaXRpb24uXG4gKi9cblxudmFyIFJlYmVsQmFja0EgPSAoZnVuY3Rpb24gKF9IVE1MQW5jaG9yRWxlbWVudCkge1xuICAgIF9pbmhlcml0cyhSZWJlbEJhY2tBLCBfSFRNTEFuY2hvckVsZW1lbnQpO1xuXG4gICAgZnVuY3Rpb24gUmViZWxCYWNrQSgpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFJlYmVsQmFja0EpO1xuXG4gICAgICAgIHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUmViZWxCYWNrQSkuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNsYXNzKFJlYmVsQmFja0EsIFt7XG4gICAgICAgIGtleTogXCJhdHRhY2hlZENhbGxiYWNrXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzNyA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRoID0gX3RoaXM3LmdldEF0dHJpYnV0ZShcImhyZWZcIik7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgncmJsYmFjaycpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBwYXRoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gUmViZWxCYWNrQTtcbn0pKEhUTUxBbmNob3JFbGVtZW50KTtcbi8qKlxuICogUmVnaXN0ZXIgdGhlIGJhY2sgYnV0dG9uIGN1c3RvbSBlbGVtZW50XG4gKi9cblxuZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwicmViZWwtYmFjay1hXCIsIHtcbiAgICBleHRlbmRzOiBcImFcIixcbiAgICBwcm90b3R5cGU6IFJlYmVsQmFja0EucHJvdG90eXBlXG59KTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm91dGUgb2JqZWN0XG4gKiBAcGFyYW0gb2JqIC0gdGhlIGNvbXBvbmVudCBuYW1lIG9yIHRoZSBIVE1MIHRlbXBsYXRlXG4gKiBAcGFyYW0gcm91dGVcbiAqIEBwYXJhbSByZWdleFxuICogQHBhcmFtIHBhdGhcbiAqIEByZXR1cm5zIHt7fX1cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIF9yb3V0ZVJlc3VsdChvYmosIHJvdXRlLCByZWdleCwgcGF0aCkge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICByZXN1bHQuY29tcG9uZW50ID0gb2JqLmNvbXBvbmVudDtcbiAgICByZXN1bHQudGVtcGxhdGUgPSBvYmoudGVtcGxhdGU7XG4gICAgcmVzdWx0LnJvdXRlID0gcm91dGU7XG4gICAgcmVzdWx0LnBhdGggPSBwYXRoO1xuICAgIHJlc3VsdC5wYXJhbXMgPSBSZWJlbFJvdXRlci5nZXRQYXJhbXNGcm9tVXJsKHJlZ2V4LCByb3V0ZSwgcGF0aCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIrN1pKcDBcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi8uLi8uLi9yZWJlbC1yb3V0ZXIvZXM1L3JlYmVsLXJvdXRlci5qc1wiLFwiLy4uLy4uLy4uLy4uL3JlYmVsLXJvdXRlci9lczVcIikiXX0=

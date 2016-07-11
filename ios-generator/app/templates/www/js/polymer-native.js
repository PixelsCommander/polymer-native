(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/gulp-browserify/node_modules/base64-js/lib/b64.js","/../../../node_modules/gulp-browserify/node_modules/base64-js/lib")
},{"buffer":2,"km4Umf":3}],2:[function(require,module,exports){
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

}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/gulp-browserify/node_modules/buffer/index.js","/../../../node_modules/gulp-browserify/node_modules/buffer")
},{"base64-js":1,"buffer":2,"ieee754":4,"km4Umf":3}],3:[function(require,module,exports){
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

}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/gulp-browserify/node_modules/process/browser.js","/../../../node_modules/gulp-browserify/node_modules/process")
},{"buffer":2,"km4Umf":3}],4:[function(require,module,exports){
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

}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/ieee754/index.js","/../../../node_modules/ieee754")
},{"buffer":2,"km4Umf":3}],5:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/isarray/index.js","/../../../node_modules/isarray")
},{"buffer":2,"km4Umf":3}],6:[function(require,module,exports){
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

}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/path-to-regexp/index.js","/../../../node_modules/path-to-regexp")
},{"buffer":2,"isarray":5,"km4Umf":3}],7:[function(require,module,exports){
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
                    var $template = null;
                    if ($child.innerHTML) {
                        $template = "<" + _prefix + "-route>" + $child.innerHTML + "</" + _prefix + "-route>";
                    }
                    this.routes[path] = {
                        "component": $child.getAttribute("component"),
                        "template": $template
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
                        this.root.innerHTML = $template;
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

var RebelRoute = exports.RebelRoute = (function (_HTMLElement2) {
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
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
    }
    result.route = route;
    result.path = path;
    result.params = RebelRouter.getParamsFromUrl(regex, route, path);
    return result;
}

}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/rebel-router/es5/rebel-router.js","/../../../node_modules/rebel-router/es5")
},{"buffer":2,"km4Umf":3}],8:[function(require,module,exports){
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
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../../node_modules/webcomponents.js/webcomponents.js","/../../../node_modules/webcomponents.js")
},{"buffer":2,"km4Umf":3}],9:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = {};
var elements = {};

PnBaseElement.createdCallback = function () {
    this.polymerNative = {};
    this.polymerNative.id = polymerNativeClient.utils.getNextId();
    elements[this.polymerNative.id] = this;
};

PnBaseElement.attachedCallback = function () {
    var self = this;
    self.updateSerializedProperties();
    if (window.polymerNativeHost) {
        self.style.visibility = 'hidden';
        polymerNativeHost.createElement(self.polymerNative.serializedProperties);
    }
};

PnBaseElement.detachedCallback = function () {
    if (window.polymerNativeHost) {
        polymerNativeHost.removeElement(this.polymerNative.id);
    }
};

PnBaseElement.update = function (recursive) {
    var self = this;

    setTimeout(function () {
        self.updateSerializedProperties();
        if (window.polymerNativeHost) {
            polymerNativeHost.updateElement(self.polymerNative.serializedProperties);
        }
        if (recursive) {
            for (var i = 0; i < self.childNodes.length; i++) {
                var childNode = self.childNodes[i];
                if (childNode.polymerNative) {
                    childNode.update(recursive);
                }
            }
        }
    }, 0)
};

PnBaseElement.updateSerializedProperties = function () {
    this.polymerNative.serializedProperties = JSON.stringify(polymerNativeClient.utils.getElementProperties(this));
};

PnBaseElement.getPNParent = function () {
    return this.getParent(function(parent){
        return parent && parent.polymerNative;
    });
};

PnBaseElement.getParent = function (predicate) {
    var parent = this;

    while (parent) {
        parent = parent.parentNode;

        if (predicate(parent)) {
            return parent;
        } else if (parent === window.document) {
            return null;
        }
    }
};

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
};

PnBaseElement.onMutations = function (mutations) {
    console.log('Get mutations');
    for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];

        console.log('Mutated ' + mutation.target.tagName);

        var structureChanged = mutation.removedNodes.length || mutation.addedNodes.length;

        if (mutation.target.polymerNative) {
            mutation.target.update(structureChanged);
        }
    }
};

PnBaseElement.initializeObserver = function () {
    var self = this,
        config = {
            childList: true,
            characterData: true,
            subtree: true,
            attributes: true
        };

    this.observer = this.observer || new MutationObserver(PnBaseElement.onMutations);
    this.observer.observe(document.body, config);
};

window.addEventListener('load', PnBaseElement.initializeObserver);
window.addEventListener('orientationchange', PnBaseElement.onResize);

module.exports = PnBaseElement;
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/base/pn-base-element.js","/elements/base")
},{"buffer":2,"km4Umf":3}],10:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

var proto = Object.create(HTMLDivElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('view', {
    prototype: proto
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/base/pn-view.js","/elements/base")
},{"../../pn-utils.js":21,"./pn-base-element.js":9,"buffer":2,"km4Umf":3}],11:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLButtonElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('button', {
    extends: 'button',
    prototype: proto
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-button.js","/elements")
},{"../pn-utils.js":21,"./base/pn-base-element.js":9,"buffer":2,"km4Umf":3}],12:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLInputElement.prototype);
proto = Object.assign(proto, PnBaseElement);

proto.createdCallback = function () {
    PnBaseElement.createdCallback.apply(this);
}

proto.attachedCallback = function () {
    PnBaseElement.attachedCallback.apply(this);
}

proto.setChecked = function (value) {
    this.checked = value;
}

PnUtils.register('checkbox', {
    extends: 'input',
    prototype: proto
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-checkbox.js","/elements")
},{"../pn-utils.js":21,"./base/pn-base-element.js":9,"buffer":2,"km4Umf":3}],13:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLImageElement.prototype);
proto = Object.assign(proto, PnBaseElement);

proto.createdCallback = function () {
    PnBaseElement.createdCallback.apply(this);
}

proto.attachedCallback = function () {

    PnBaseElement.attachedCallback.apply(this);
    self.addEventListener('load', PnBaseElement.attachedCallback.bind(this));
}

PnUtils.register('image', {
    extends: 'img',
    prototype: proto
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-img.js","/elements")
},{"../pn-utils.js":21,"./base/pn-base-element.js":9,"buffer":2,"km4Umf":3}],14:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLInputElement.prototype);
proto = Object.assign(proto, PnBaseElement);

proto.createdCallback = function () {
    PnBaseElement.createdCallback.apply(this);
}

proto.setValue = function (value) {
    this.value = value;
}

proto.setFocus = function () {
    console.log('Focused ' + this.polymerNative.id);
    this.focus();
    this.update();
}

PnUtils.register('input', {
    extends: 'input',
    prototype: proto
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-input.js","/elements")
},{"../pn-utils.js":21,"./base/pn-base-element.js":9,"buffer":2,"km4Umf":3}],15:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLDivElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('label', {
    prototype: proto
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-label.js","/elements")
},{"../pn-utils.js":21,"./base/pn-base-element.js":9,"buffer":2,"km4Umf":3}],16:[function(require,module,exports){
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
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-rootview.js","/elements")
},{"../pn-utils.js":21,"./base/pn-base-element.js":9,"buffer":2,"km4Umf":3}],17:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var pathToRegexp = require('path-to-regexp');
var PnBaseElement = require('../base/pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

var proto = Object.create(HTMLDivElement.prototype);
proto = Object.assign(proto, PnBaseElement);

proto.createdCallback = function () {
    PnBaseElement.createdCallback.apply(this);
    //this.style.display = 'none';
}

PnUtils.register('navbar', {
    prototype: proto
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/router/pn-navbar.js","/elements/router")
},{"../../pn-utils.js":21,"../base/pn-base-element.js":9,"buffer":2,"km4Umf":3,"path-to-regexp":6}],18:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var RebelRoute = require('../../../../../node_modules/rebel-router/es5/rebel-router.js').RebelRoute;
var PnBaseElement = require('../base/pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

var Route = (function (_RebelRoute) {

    Route.prototype = Object.create(_RebelRoute.prototype);
    Route.prototype = Object.assign(Route.prototype, PnBaseElement);

    function Route() {
        return Object.getPrototypeOf(Route).apply(this);
    }

    Route.prototype.createdCallback = function() {
        PnBaseElement.createdCallback.apply(this);
    };

    Route.prototype.attachedCallback = function() {
        var $scope = this;
        PnBaseElement.attachedCallback.apply(this);
        if (window.polymerNativeHost) {
            window.polymerNativeHost.activateRoute($scope.polymerNative.id);
        }
    };

    Route.prototype.detachedCallback = function() {
        PnBaseElement.detachedCallback.apply(this);
    };

    return Route;

})(RebelRoute);

PnUtils.register('route', {
    prototype: Route.prototype
});


}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/router/pn-route.js","/elements/router")
},{"../../../../../node_modules/rebel-router/es5/rebel-router.js":7,"../../pn-utils.js":21,"../base/pn-base-element.js":9,"buffer":2,"km4Umf":3}],19:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var RebelRouter = require('../../../../../node_modules/rebel-router/es5/rebel-router.js').RebelRouter;
var PnBaseElement = require('../base/pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

//polymerNativeClient should be global to be able to call it from native code
window.polymerNativeClient = window.polymerNativeClient || {};

var Router = (function (_RebelRouter) {

    Router.prototype = Object.create(_RebelRouter.prototype);
    Router.prototype = Object.assign(Router.prototype, PnBaseElement);

    function Router() {
        return Object.getPrototypeOf(Router).apply(this);
    }

    Router.prototype.createdCallback = function() {
        PnBaseElement.createdCallback.apply(this);
        Object.getPrototypeOf(Router.prototype).createdCallback.call(this, "native");
    };

    Router.prototype.attachedCallback = function() {
        PnBaseElement.attachedCallback.apply(this);
    };

    return Router;

})(RebelRouter);

var syncingHistoryWithNative = false;
window.polymerNativeClient.back = function () {
    syncingHistoryWithNative = true;
    window.history.back();
    setTimeout(function(){
        syncingHistoryWithNative = false;
    }, 0);
};

PnUtils.register('router', {
    prototype: Router.prototype
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/router/pn-router.js","/elements/router")
},{"../../../../../node_modules/rebel-router/es5/rebel-router.js":7,"../../pn-utils.js":21,"../base/pn-base-element.js":9,"buffer":2,"km4Umf":3}],20:[function(require,module,exports){
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
require('./elements/router/pn-navbar.js');
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_1bcb9a86.js","/")
},{"./elements/base/pn-base-element.js":9,"./elements/base/pn-view.js":10,"./elements/pn-button.js":11,"./elements/pn-checkbox.js":12,"./elements/pn-img.js":13,"./elements/pn-input.js":14,"./elements/pn-label.js":15,"./elements/pn-rootview.js":16,"./elements/router/pn-navbar.js":17,"./elements/router/pn-route.js":18,"./elements/router/pn-router.js":19,"./pn-utils.js":21,"buffer":2,"km4Umf":3,"webcomponents.js":8}],21:[function(require,module,exports){
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

        if (parent) {
            var parentBounds = parent.getBoundingClientRect();
            bounds = {
                width: bounds.width,
                height: bounds.height,
                left: style.position === 'fixed' ? bounds.left : bounds.left - parentBounds.left,
                top: style.position === 'fixed' ? bounds.top : bounds.top - parentBounds.top
            }
        }

        console.log('Updating ' + element.tagName + ', id=' + id + ', to ' + (parent ? parent.tagName : 'root') + ' ' + parentId + ', size=' + bounds.width + 'x' + bounds.height + ', position=' + bounds.left + ',' + bounds.top);

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
                textAlign: style.textAlign,
                position: style.position,
                paddingLeft: style.paddingLeft,
                paddingRight: style.paddingRight,
                paddingTop: style.paddingTop,
                paddingBottom: style.paddingBottom
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
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/pn-utils.js","/")
},{"buffer":2,"km4Umf":3}]},{},[20])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qcyIsIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvbm9kZV9tb2R1bGVzL3BhdGgtdG8tcmVnZXhwL2luZGV4LmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9ub2RlX21vZHVsZXMvcmViZWwtcm91dGVyL2VzNS9yZWJlbC1yb3V0ZXIuanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL25vZGVfbW9kdWxlcy93ZWJjb21wb25lbnRzLmpzL3dlYmNvbXBvbmVudHMuanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL3BhcnRpYWxzL2pzLWxpYnJhcnkvc3JjL2VsZW1lbnRzL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9lbGVtZW50cy9iYXNlL3BuLXZpZXcuanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL3BhcnRpYWxzL2pzLWxpYnJhcnkvc3JjL2VsZW1lbnRzL3BuLWJ1dHRvbi5qcyIsIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvcG4tY2hlY2tib3guanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL3BhcnRpYWxzL2pzLWxpYnJhcnkvc3JjL2VsZW1lbnRzL3BuLWltZy5qcyIsIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvcG4taW5wdXQuanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL3BhcnRpYWxzL2pzLWxpYnJhcnkvc3JjL2VsZW1lbnRzL3BuLWxhYmVsLmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9lbGVtZW50cy9wbi1yb290dmlldy5qcyIsIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvcm91dGVyL3BuLW5hdmJhci5qcyIsIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvcm91dGVyL3BuLXJvdXRlLmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9lbGVtZW50cy9yb3V0ZXIvcG4tcm91dGVyLmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9mYWtlXzFiY2I5YTg2LmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9wbi11dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Z0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmlPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgbG9va3VwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuXG47KGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuICB2YXIgQXJyID0gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJylcbiAgICA/IFVpbnQ4QXJyYXlcbiAgICA6IEFycmF5XG5cblx0dmFyIFBMVVMgICA9ICcrJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSCAgPSAnLycuY2hhckNvZGVBdCgwKVxuXHR2YXIgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIExPV0VSICA9ICdhJy5jaGFyQ29kZUF0KDApXG5cdHZhciBVUFBFUiAgPSAnQScuY2hhckNvZGVBdCgwKVxuXHR2YXIgUExVU19VUkxfU0FGRSA9ICctJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSF9VUkxfU0FGRSA9ICdfJy5jaGFyQ29kZUF0KDApXG5cblx0ZnVuY3Rpb24gZGVjb2RlIChlbHQpIHtcblx0XHR2YXIgY29kZSA9IGVsdC5jaGFyQ29kZUF0KDApXG5cdFx0aWYgKGNvZGUgPT09IFBMVVMgfHxcblx0XHQgICAgY29kZSA9PT0gUExVU19VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MiAvLyAnKydcblx0XHRpZiAoY29kZSA9PT0gU0xBU0ggfHxcblx0XHQgICAgY29kZSA9PT0gU0xBU0hfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjMgLy8gJy8nXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIpXG5cdFx0XHRyZXR1cm4gLTEgLy9ubyBtYXRjaFxuXHRcdGlmIChjb2RlIDwgTlVNQkVSICsgMTApXG5cdFx0XHRyZXR1cm4gY29kZSAtIE5VTUJFUiArIDI2ICsgMjZcblx0XHRpZiAoY29kZSA8IFVQUEVSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIFVQUEVSXG5cdFx0aWYgKGNvZGUgPCBMT1dFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBMT1dFUiArIDI2XG5cdH1cblxuXHRmdW5jdGlvbiBiNjRUb0J5dGVBcnJheSAoYjY0KSB7XG5cdFx0dmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcblxuXHRcdGlmIChiNjQubGVuZ3RoICUgNCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG5cdFx0fVxuXG5cdFx0Ly8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcblx0XHQvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG5cdFx0Ly8gcmVwcmVzZW50IG9uZSBieXRlXG5cdFx0Ly8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuXHRcdHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cdFx0cGxhY2VIb2xkZXJzID0gJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDIpID8gMiA6ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAxKSA/IDEgOiAwXG5cblx0XHQvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcblx0XHRhcnIgPSBuZXcgQXJyKGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycylcblxuXHRcdC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcblx0XHRsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aFxuXG5cdFx0dmFyIEwgPSAwXG5cblx0XHRmdW5jdGlvbiBwdXNoICh2KSB7XG5cdFx0XHRhcnJbTCsrXSA9IHZcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDE4KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDEyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpIDw8IDYpIHwgZGVjb2RlKGI2NC5jaGFyQXQoaSArIDMpKVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwKSA+PiA4KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA+PiA0KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDEwKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDQpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPj4gMilcblx0XHRcdHB1c2goKHRtcCA+PiA4KSAmIDB4RkYpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFyclxuXHR9XG5cblx0ZnVuY3Rpb24gdWludDhUb0Jhc2U2NCAodWludDgpIHtcblx0XHR2YXIgaSxcblx0XHRcdGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzLCAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuXHRcdFx0b3V0cHV0ID0gXCJcIixcblx0XHRcdHRlbXAsIGxlbmd0aFxuXG5cdFx0ZnVuY3Rpb24gZW5jb2RlIChudW0pIHtcblx0XHRcdHJldHVybiBsb29rdXAuY2hhckF0KG51bSlcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuXHRcdFx0cmV0dXJuIGVuY29kZShudW0gPj4gMTggJiAweDNGKSArIGVuY29kZShudW0gPj4gMTIgJiAweDNGKSArIGVuY29kZShudW0gPj4gNiAmIDB4M0YpICsgZW5jb2RlKG51bSAmIDB4M0YpXG5cdFx0fVxuXG5cdFx0Ly8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuXHRcdGZvciAoaSA9IDAsIGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7IGkgPCBsZW5ndGg7IGkgKz0gMykge1xuXHRcdFx0dGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSlcblx0XHRcdG91dHB1dCArPSB0cmlwbGV0VG9CYXNlNjQodGVtcClcblx0XHR9XG5cblx0XHQvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG5cdFx0c3dpdGNoIChleHRyYUJ5dGVzKSB7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPT0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRcdHRlbXAgPSAodWludDhbdWludDgubGVuZ3RoIC0gMl0gPDwgOCkgKyAodWludDhbdWludDgubGVuZ3RoIC0gMV0pXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAxMClcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA+PiA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgMikgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dFxuXHR9XG5cblx0ZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5XG5cdGV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjRcbn0odHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKHRoaXMuYmFzZTY0anMgPSB7fSkgOiBleHBvcnRzKSlcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5fdXNlVHlwZWRBcnJheXNgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAoY29tcGF0aWJsZSBkb3duIHRvIElFNilcbiAqL1xuQnVmZmVyLl91c2VUeXBlZEFycmF5cyA9IChmdW5jdGlvbiAoKSB7XG4gIC8vIERldGVjdCBpZiBicm93c2VyIHN1cHBvcnRzIFR5cGVkIEFycmF5cy4gU3VwcG9ydGVkIGJyb3dzZXJzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssXG4gIC8vIENocm9tZSA3KywgU2FmYXJpIDUuMSssIE9wZXJhIDExLjYrLCBpT1MgNC4yKy4gSWYgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBhZGRpbmdcbiAgLy8gcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLCB0aGVuIHRoYXQncyB0aGUgc2FtZSBhcyBubyBgVWludDhBcnJheWAgc3VwcG9ydFxuICAvLyBiZWNhdXNlIHdlIG5lZWQgdG8gYmUgYWJsZSB0byBhZGQgYWxsIHRoZSBub2RlIEJ1ZmZlciBBUEkgbWV0aG9kcy4gVGhpcyBpcyBhbiBpc3N1ZVxuICAvLyBpbiBGaXJlZm94IDQtMjkuIE5vdyBmaXhlZDogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4XG4gIHRyeSB7XG4gICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcigwKVxuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheShidWYpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICByZXR1cm4gNDIgPT09IGFyci5mb28oKSAmJlxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nIC8vIENocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn0pKClcblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKVxuXG4gIHZhciB0eXBlID0gdHlwZW9mIHN1YmplY3RcblxuICAvLyBXb3JrYXJvdW5kOiBub2RlJ3MgYmFzZTY0IGltcGxlbWVudGF0aW9uIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBzdHJpbmdzXG4gIC8vIHdoaWxlIGJhc2U2NC1qcyBkb2VzIG5vdC5cbiAgaWYgKGVuY29kaW5nID09PSAnYmFzZTY0JyAmJiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgIHN1YmplY3QgPSBzdHJpbmd0cmltKHN1YmplY3QpXG4gICAgd2hpbGUgKHN1YmplY3QubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgICAgc3ViamVjdCA9IHN1YmplY3QgKyAnPSdcbiAgICB9XG4gIH1cblxuICAvLyBGaW5kIHRoZSBsZW5ndGhcbiAgdmFyIGxlbmd0aFxuICBpZiAodHlwZSA9PT0gJ251bWJlcicpXG4gICAgbGVuZ3RoID0gY29lcmNlKHN1YmplY3QpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKVxuICAgIGxlbmd0aCA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHN1YmplY3QsIGVuY29kaW5nKVxuICBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0JylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdC5sZW5ndGgpIC8vIGFzc3VtZSB0aGF0IG9iamVjdCBpcyBhcnJheS1saWtlXG4gIGVsc2VcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG5lZWRzIHRvIGJlIGEgbnVtYmVyLCBhcnJheSBvciBzdHJpbmcuJylcblxuICB2YXIgYnVmXG4gIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgLy8gUHJlZmVycmVkOiBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGJ1ZiA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gVEhJUyBpbnN0YW5jZSBvZiBCdWZmZXIgKGNyZWF0ZWQgYnkgYG5ld2ApXG4gICAgYnVmID0gdGhpc1xuICAgIGJ1Zi5sZW5ndGggPSBsZW5ndGhcbiAgICBidWYuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMgJiYgdHlwZW9mIHN1YmplY3QuYnl0ZUxlbmd0aCA9PT0gJ251bWJlcicpIHtcbiAgICAvLyBTcGVlZCBvcHRpbWl6YXRpb24gLS0gdXNlIHNldCBpZiB3ZSdyZSBjb3B5aW5nIGZyb20gYSB0eXBlZCBhcnJheVxuICAgIGJ1Zi5fc2V0KHN1YmplY3QpXG4gIH0gZWxzZSBpZiAoaXNBcnJheWlzaChzdWJqZWN0KSkge1xuICAgIC8vIFRyZWF0IGFycmF5LWlzaCBvYmplY3RzIGFzIGEgYnl0ZSBhcnJheVxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSlcbiAgICAgICAgYnVmW2ldID0gc3ViamVjdC5yZWFkVUludDgoaSlcbiAgICAgIGVsc2VcbiAgICAgICAgYnVmW2ldID0gc3ViamVjdFtpXVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGJ1Zi53cml0ZShzdWJqZWN0LCAwLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiAhQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiAhbm9aZXJvKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBidWZbaV0gPSAwXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG4vLyBTVEFUSUMgTUVUSE9EU1xuLy8gPT09PT09PT09PT09PT1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIChiKSB7XG4gIHJldHVybiAhIShiICE9PSBudWxsICYmIGIgIT09IHVuZGVmaW5lZCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmJ5dGVMZW5ndGggPSBmdW5jdGlvbiAoc3RyLCBlbmNvZGluZykge1xuICB2YXIgcmV0XG4gIHN0ciA9IHN0ciArICcnXG4gIHN3aXRjaCAoZW5jb2RpbmcgfHwgJ3V0ZjgnKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggLyAyXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoICogMlxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiAobGlzdCwgdG90YWxMZW5ndGgpIHtcbiAgYXNzZXJ0KGlzQXJyYXkobGlzdCksICdVc2FnZTogQnVmZmVyLmNvbmNhdChsaXN0LCBbdG90YWxMZW5ndGhdKVxcbicgK1xuICAgICAgJ2xpc3Qgc2hvdWxkIGJlIGFuIEFycmF5LicpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfSBlbHNlIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBsaXN0WzBdXG4gIH1cblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHRvdGFsTGVuZ3RoICE9PSAnbnVtYmVyJykge1xuICAgIHRvdGFsTGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0b3RhbExlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHRvdGFsTGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbi8vIEJVRkZFUiBJTlNUQU5DRSBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBfaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBhc3NlcnQoc3RyTGVuICUgMiA9PT0gMCwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBieXRlID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGFzc2VydCghaXNOYU4oYnl0ZSksICdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IGJ5dGVcbiAgfVxuICBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9IGkgKiAyXG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIF91dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBfYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBfYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gX2FzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBfYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF91dGYxNmxlV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIFN1cHBvcnQgYm90aCAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpXG4gIC8vIGFuZCB0aGUgbGVnYWN5IChzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBpZiAoIWlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7ICAvLyBsZWdhY3lcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGhcbiAgICBsZW5ndGggPSBzd2FwXG4gIH1cblxuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBfaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gX3V0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBfYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gX2JpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBfYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IF91dGYxNmxlV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuXG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuICBzdGFydCA9IE51bWJlcihzdGFydCkgfHwgMFxuICBlbmQgPSAoZW5kICE9PSB1bmRlZmluZWQpXG4gICAgPyBOdW1iZXIoZW5kKVxuICAgIDogZW5kID0gc2VsZi5sZW5ndGhcblxuICAvLyBGYXN0cGF0aCBlbXB0eSBzdHJpbmdzXG4gIGlmIChlbmQgPT09IHN0YXJ0KVxuICAgIHJldHVybiAnJ1xuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBfaGV4U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gX3V0ZjhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBfYXNjaWlTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gX2JpbmFyeVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBfYmFzZTY0U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IF91dGYxNmxlU2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAodGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNvdXJjZSA9IHRoaXNcblxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoIXRhcmdldF9zdGFydCkgdGFyZ2V0X3N0YXJ0ID0gMFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHNvdXJjZS5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgYXNzZXJ0KGVuZCA+PSBzdGFydCwgJ3NvdXJjZUVuZCA8IHNvdXJjZVN0YXJ0JylcbiAgYXNzZXJ0KHRhcmdldF9zdGFydCA+PSAwICYmIHRhcmdldF9zdGFydCA8IHRhcmdldC5sZW5ndGgsXG4gICAgICAndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChzdGFydCA+PSAwICYmIHN0YXJ0IDwgc291cmNlLmxlbmd0aCwgJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHNvdXJjZS5sZW5ndGgsICdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKVxuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0IDwgZW5kIC0gc3RhcnQpXG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldF9zdGFydCArIHN0YXJ0XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKGxlbiA8IDEwMCB8fCAhQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICB0YXJnZXRbaSArIHRhcmdldF9zdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldF9zdGFydClcbiAgfVxufVxuXG5mdW5jdGlvbiBfYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIF91dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmVzID0gJydcbiAgdmFyIHRtcCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGlmIChidWZbaV0gPD0gMHg3Rikge1xuICAgICAgcmVzICs9IGRlY29kZVV0ZjhDaGFyKHRtcCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgICAgIHRtcCA9ICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIHRtcCArPSAnJScgKyBidWZbaV0udG9TdHJpbmcoMTYpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcyArIGRlY29kZVV0ZjhDaGFyKHRtcClcbn1cblxuZnVuY3Rpb24gX2FzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKVxuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBfYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICByZXR1cm4gX2FzY2lpU2xpY2UoYnVmLCBzdGFydCwgZW5kKVxufVxuXG5mdW5jdGlvbiBfaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiBfdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpKzFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IGNsYW1wKHN0YXJ0LCBsZW4sIDApXG4gIGVuZCA9IGNsYW1wKGVuZCwgbGVuLCBsZW4pXG5cbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICByZXR1cm4gQnVmZmVyLl9hdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICB2YXIgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkLCB0cnVlKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICAgIHJldHVybiBuZXdCdWZcbiAgfVxufVxuXG4vLyBgZ2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuZnVuY3Rpb24gX3JlYWRVSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gIH0gZWxzZSB7XG4gICAgdmFsID0gYnVmW29mZnNldF0gPDwgOFxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MTYodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkVUludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbFxuICBpZiAobGl0dGxlRW5kaWFuKSB7XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgPSBidWZbb2Zmc2V0ICsgMl0gPDwgMTZcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV0gPDwgOFxuICAgIHZhbCB8PSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAzIDwgbGVuKVxuICAgICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXQgKyAzXSA8PCAyNCA+Pj4gMClcbiAgfSBlbHNlIHtcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAxXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAyIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAyXSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDNdXG4gICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXRdIDw8IDI0ID4+PiAwKVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MzIodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHZhciBuZWcgPSB0aGlzW29mZnNldF0gJiAweDgwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiBfcmVhZEludDE2IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IF9yZWFkVUludDE2KGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDE2KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRJbnQzMiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWwgPSBfcmVhZFVJbnQzMihidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCB0cnVlKVxuICB2YXIgbmVnID0gdmFsICYgMHg4MDAwMDAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDMyKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRGbG9hdCAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRmxvYXQodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEZsb2F0KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZERvdWJsZSAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmYpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm5cblxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxufVxuXG5mdW5jdGlvbiBfd3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgICAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmZmZmZilcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4obGVuIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9XG4gICAgICAgICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZiwgLTB4ODApXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIHRoaXMud3JpdGVVSW50OCh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydClcbiAgZWxzZVxuICAgIHRoaXMud3JpdGVVSW50OCgweGZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmZmYsIC0weDgwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICBfd3JpdGVVSW50MTYoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgX3dyaXRlVUludDE2KGJ1ZiwgMHhmZmZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgX3dyaXRlVUludDMyKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbiAgZWxzZVxuICAgIF93cml0ZVVJbnQzMihidWYsIDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDcgPCBidWYubGVuZ3RoLFxuICAgICAgICAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZklFRUU3NTQodmFsdWUsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLmNoYXJDb2RlQXQoMClcbiAgfVxuXG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmICFpc05hTih2YWx1ZSksICd2YWx1ZSBpcyBub3QgYSBudW1iZXInKVxuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCB0aGlzLmxlbmd0aCwgJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHRoaXMubGVuZ3RoLCAnZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdGhpc1tpXSA9IHZhbHVlXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgb3V0ID0gW11cbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBvdXRbaV0gPSB0b0hleCh0aGlzW2ldKVxuICAgIGlmIChpID09PSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTKSB7XG4gICAgICBvdXRbaSArIDFdID0gJy4uLidcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgb3V0LmpvaW4oJyAnKSArICc+J1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgICAgcmV0dXJuIChuZXcgQnVmZmVyKHRoaXMpKS5idWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSlcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCdWZmZXIudG9BcnJheUJ1ZmZlciBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlcicpXG4gIH1cbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG52YXIgQlAgPSBCdWZmZXIucHJvdG90eXBlXG5cbi8qKlxuICogQXVnbWVudCBhIFVpbnQ4QXJyYXkgKmluc3RhbmNlKiAobm90IHRoZSBVaW50OEFycmF5IGNsYXNzISkgd2l0aCBCdWZmZXIgbWV0aG9kc1xuICovXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBnZXQvc2V0IG1ldGhvZHMgYmVmb3JlIG92ZXJ3cml0aW5nXG4gIGFyci5fZ2V0ID0gYXJyLmdldFxuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkLCB3aWxsIGJlIHJlbW92ZWQgaW4gbm9kZSAwLjEzK1xuICBhcnIuZ2V0ID0gQlAuZ2V0XG4gIGFyci5zZXQgPSBCUC5zZXRcblxuICBhcnIud3JpdGUgPSBCUC53cml0ZVxuICBhcnIudG9TdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9Mb2NhbGVTdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9KU09OID0gQlAudG9KU09OXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnQ4ID0gQlAucmVhZFVJbnQ4XG4gIGFyci5yZWFkVUludDE2TEUgPSBCUC5yZWFkVUludDE2TEVcbiAgYXJyLnJlYWRVSW50MTZCRSA9IEJQLnJlYWRVSW50MTZCRVxuICBhcnIucmVhZFVJbnQzMkxFID0gQlAucmVhZFVJbnQzMkxFXG4gIGFyci5yZWFkVUludDMyQkUgPSBCUC5yZWFkVUludDMyQkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50OCA9IEJQLndyaXRlSW50OFxuICBhcnIud3JpdGVJbnQxNkxFID0gQlAud3JpdGVJbnQxNkxFXG4gIGFyci53cml0ZUludDE2QkUgPSBCUC53cml0ZUludDE2QkVcbiAgYXJyLndyaXRlSW50MzJMRSA9IEJQLndyaXRlSW50MzJMRVxuICBhcnIud3JpdGVJbnQzMkJFID0gQlAud3JpdGVJbnQzMkJFXG4gIGFyci53cml0ZUZsb2F0TEUgPSBCUC53cml0ZUZsb2F0TEVcbiAgYXJyLndyaXRlRmxvYXRCRSA9IEJQLndyaXRlRmxvYXRCRVxuICBhcnIud3JpdGVEb3VibGVMRSA9IEJQLndyaXRlRG91YmxlTEVcbiAgYXJyLndyaXRlRG91YmxlQkUgPSBCUC53cml0ZURvdWJsZUJFXG4gIGFyci5maWxsID0gQlAuZmlsbFxuICBhcnIuaW5zcGVjdCA9IEJQLmluc3BlY3RcbiAgYXJyLnRvQXJyYXlCdWZmZXIgPSBCUC50b0FycmF5QnVmZmVyXG5cbiAgcmV0dXJuIGFyclxufVxuXG4vLyBzbGljZShzdGFydCwgZW5kKVxuZnVuY3Rpb24gY2xhbXAgKGluZGV4LCBsZW4sIGRlZmF1bHRWYWx1ZSkge1xuICBpZiAodHlwZW9mIGluZGV4ICE9PSAnbnVtYmVyJykgcmV0dXJuIGRlZmF1bHRWYWx1ZVxuICBpbmRleCA9IH5+aW5kZXg7ICAvLyBDb2VyY2UgdG8gaW50ZWdlci5cbiAgaWYgKGluZGV4ID49IGxlbikgcmV0dXJuIGxlblxuICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIGluZGV4XG4gIGluZGV4ICs9IGxlblxuICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIGluZGV4XG4gIHJldHVybiAwXG59XG5cbmZ1bmN0aW9uIGNvZXJjZSAobGVuZ3RoKSB7XG4gIC8vIENvZXJjZSBsZW5ndGggdG8gYSBudW1iZXIgKHBvc3NpYmx5IE5hTiksIHJvdW5kIHVwXG4gIC8vIGluIGNhc2UgaXQncyBmcmFjdGlvbmFsIChlLmcuIDEyMy40NTYpIHRoZW4gZG8gYVxuICAvLyBkb3VibGUgbmVnYXRlIHRvIGNvZXJjZSBhIE5hTiB0byAwLiBFYXN5LCByaWdodD9cbiAgbGVuZ3RoID0gfn5NYXRoLmNlaWwoK2xlbmd0aClcbiAgcmV0dXJuIGxlbmd0aCA8IDAgPyAwIDogbGVuZ3RoXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkgKHN1YmplY3QpIHtcbiAgcmV0dXJuIChBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChzdWJqZWN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzdWJqZWN0KSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICB9KShzdWJqZWN0KVxufVxuXG5mdW5jdGlvbiBpc0FycmF5aXNoIChzdWJqZWN0KSB7XG4gIHJldHVybiBpc0FycmF5KHN1YmplY3QpIHx8IEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSB8fFxuICAgICAgc3ViamVjdCAmJiB0eXBlb2Ygc3ViamVjdCA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZiBzdWJqZWN0Lmxlbmd0aCA9PT0gJ251bWJlcidcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIHZhciBiID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBpZiAoYiA8PSAweDdGKVxuICAgICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkpXG4gICAgZWxzZSB7XG4gICAgICB2YXIgc3RhcnQgPSBpXG4gICAgICBpZiAoYiA+PSAweEQ4MDAgJiYgYiA8PSAweERGRkYpIGkrK1xuICAgICAgdmFyIGggPSBlbmNvZGVVUklDb21wb25lbnQoc3RyLnNsaWNlKHN0YXJ0LCBpKzEpKS5zdWJzdHIoMSkuc3BsaXQoJyUnKVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBoLmxlbmd0aDsgaisrKVxuICAgICAgICBieXRlQXJyYXkucHVzaChwYXJzZUludChoW2pdLCAxNikpXG4gICAgfVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KHN0cilcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBwb3NcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSlcbiAgICAgIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gZGVjb2RlVXRmOENoYXIgKHN0cikge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyKVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSgweEZGRkQpIC8vIFVURiA4IGludmFsaWQgY2hhclxuICB9XG59XG5cbi8qXG4gKiBXZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSB2YWx1ZSBpcyBhIHZhbGlkIGludGVnZXIuIFRoaXMgbWVhbnMgdGhhdCBpdFxuICogaXMgbm9uLW5lZ2F0aXZlLiBJdCBoYXMgbm8gZnJhY3Rpb25hbCBjb21wb25lbnQgYW5kIHRoYXQgaXQgZG9lcyBub3RcbiAqIGV4Y2VlZCB0aGUgbWF4aW11bSBhbGxvd2VkIHZhbHVlLlxuICovXG5mdW5jdGlvbiB2ZXJpZnVpbnQgKHZhbHVlLCBtYXgpIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlID49IDAsICdzcGVjaWZpZWQgYSBuZWdhdGl2ZSB2YWx1ZSBmb3Igd3JpdGluZyBhbiB1bnNpZ25lZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBpcyBsYXJnZXIgdGhhbiBtYXhpbXVtIHZhbHVlIGZvciB0eXBlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZzaW50ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZJRUVFNzU0ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbn1cblxuZnVuY3Rpb24gYXNzZXJ0ICh0ZXN0LCBtZXNzYWdlKSB7XG4gIGlmICghdGVzdCkgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UgfHwgJ0ZhaWxlZCBhc3NlcnRpb24nKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlclwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3NcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG5leHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9pZWVlNzU0XCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xubW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9pc2FycmF5L2luZGV4LmpzXCIsXCIvLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2lzYXJyYXlcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgaXNhcnJheSA9IHJlcXVpcmUoJ2lzYXJyYXknKVxuXG4vKipcbiAqIEV4cG9zZSBgcGF0aFRvUmVnZXhwYC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBwYXRoVG9SZWdleHBcbm1vZHVsZS5leHBvcnRzLnBhcnNlID0gcGFyc2Vcbm1vZHVsZS5leHBvcnRzLmNvbXBpbGUgPSBjb21waWxlXG5tb2R1bGUuZXhwb3J0cy50b2tlbnNUb0Z1bmN0aW9uID0gdG9rZW5zVG9GdW5jdGlvblxubW9kdWxlLmV4cG9ydHMudG9rZW5zVG9SZWdFeHAgPSB0b2tlbnNUb1JlZ0V4cFxuXG4vKipcbiAqIFRoZSBtYWluIHBhdGggbWF0Y2hpbmcgcmVnZXhwIHV0aWxpdHkuXG4gKlxuICogQHR5cGUge1JlZ0V4cH1cbiAqL1xudmFyIFBBVEhfUkVHRVhQID0gbmV3IFJlZ0V4cChbXG4gIC8vIE1hdGNoIGVzY2FwZWQgY2hhcmFjdGVycyB0aGF0IHdvdWxkIG90aGVyd2lzZSBhcHBlYXIgaW4gZnV0dXJlIG1hdGNoZXMuXG4gIC8vIFRoaXMgYWxsb3dzIHRoZSB1c2VyIHRvIGVzY2FwZSBzcGVjaWFsIGNoYXJhY3RlcnMgdGhhdCB3b24ndCB0cmFuc2Zvcm0uXG4gICcoXFxcXFxcXFwuKScsXG4gIC8vIE1hdGNoIEV4cHJlc3Mtc3R5bGUgcGFyYW1ldGVycyBhbmQgdW4tbmFtZWQgcGFyYW1ldGVycyB3aXRoIGEgcHJlZml4XG4gIC8vIGFuZCBvcHRpb25hbCBzdWZmaXhlcy4gTWF0Y2hlcyBhcHBlYXIgYXM6XG4gIC8vXG4gIC8vIFwiLzp0ZXN0KFxcXFxkKyk/XCIgPT4gW1wiL1wiLCBcInRlc3RcIiwgXCJcXGQrXCIsIHVuZGVmaW5lZCwgXCI/XCIsIHVuZGVmaW5lZF1cbiAgLy8gXCIvcm91dGUoXFxcXGQrKVwiICA9PiBbdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgXCJcXGQrXCIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkXVxuICAvLyBcIi8qXCIgICAgICAgICAgICA9PiBbXCIvXCIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgXCIqXCJdXG4gICcoW1xcXFwvLl0pPyg/Oig/OlxcXFw6KFxcXFx3KykoPzpcXFxcKCgoPzpcXFxcXFxcXC58W15cXFxcXFxcXCgpXSkrKVxcXFwpKT98XFxcXCgoKD86XFxcXFxcXFwufFteXFxcXFxcXFwoKV0pKylcXFxcKSkoWysqP10pP3woXFxcXCopKSdcbl0uam9pbignfCcpLCAnZycpXG5cbi8qKlxuICogUGFyc2UgYSBzdHJpbmcgZm9yIHRoZSByYXcgdG9rZW5zLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHshQXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHBhcnNlIChzdHIpIHtcbiAgdmFyIHRva2VucyA9IFtdXG4gIHZhciBrZXkgPSAwXG4gIHZhciBpbmRleCA9IDBcbiAgdmFyIHBhdGggPSAnJ1xuICB2YXIgcmVzXG5cbiAgd2hpbGUgKChyZXMgPSBQQVRIX1JFR0VYUC5leGVjKHN0cikpICE9IG51bGwpIHtcbiAgICB2YXIgbSA9IHJlc1swXVxuICAgIHZhciBlc2NhcGVkID0gcmVzWzFdXG4gICAgdmFyIG9mZnNldCA9IHJlcy5pbmRleFxuICAgIHBhdGggKz0gc3RyLnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgaW5kZXggPSBvZmZzZXQgKyBtLmxlbmd0aFxuXG4gICAgLy8gSWdub3JlIGFscmVhZHkgZXNjYXBlZCBzZXF1ZW5jZXMuXG4gICAgaWYgKGVzY2FwZWQpIHtcbiAgICAgIHBhdGggKz0gZXNjYXBlZFsxXVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICB2YXIgbmV4dCA9IHN0cltpbmRleF1cbiAgICB2YXIgcHJlZml4ID0gcmVzWzJdXG4gICAgdmFyIG5hbWUgPSByZXNbM11cbiAgICB2YXIgY2FwdHVyZSA9IHJlc1s0XVxuICAgIHZhciBncm91cCA9IHJlc1s1XVxuICAgIHZhciBtb2RpZmllciA9IHJlc1s2XVxuICAgIHZhciBhc3RlcmlzayA9IHJlc1s3XVxuXG4gICAgLy8gUHVzaCB0aGUgY3VycmVudCBwYXRoIG9udG8gdGhlIHRva2Vucy5cbiAgICBpZiAocGF0aCkge1xuICAgICAgdG9rZW5zLnB1c2gocGF0aClcbiAgICAgIHBhdGggPSAnJ1xuICAgIH1cblxuICAgIHZhciBwYXJ0aWFsID0gcHJlZml4ICE9IG51bGwgJiYgbmV4dCAhPSBudWxsICYmIG5leHQgIT09IHByZWZpeFxuICAgIHZhciByZXBlYXQgPSBtb2RpZmllciA9PT0gJysnIHx8IG1vZGlmaWVyID09PSAnKidcbiAgICB2YXIgb3B0aW9uYWwgPSBtb2RpZmllciA9PT0gJz8nIHx8IG1vZGlmaWVyID09PSAnKidcbiAgICB2YXIgZGVsaW1pdGVyID0gcmVzWzJdIHx8ICcvJ1xuICAgIHZhciBwYXR0ZXJuID0gY2FwdHVyZSB8fCBncm91cCB8fCAoYXN0ZXJpc2sgPyAnLionIDogJ1teJyArIGRlbGltaXRlciArICddKz8nKVxuXG4gICAgdG9rZW5zLnB1c2goe1xuICAgICAgbmFtZTogbmFtZSB8fCBrZXkrKyxcbiAgICAgIHByZWZpeDogcHJlZml4IHx8ICcnLFxuICAgICAgZGVsaW1pdGVyOiBkZWxpbWl0ZXIsXG4gICAgICBvcHRpb25hbDogb3B0aW9uYWwsXG4gICAgICByZXBlYXQ6IHJlcGVhdCxcbiAgICAgIHBhcnRpYWw6IHBhcnRpYWwsXG4gICAgICBhc3RlcmlzazogISFhc3RlcmlzayxcbiAgICAgIHBhdHRlcm46IGVzY2FwZUdyb3VwKHBhdHRlcm4pXG4gICAgfSlcbiAgfVxuXG4gIC8vIE1hdGNoIGFueSBjaGFyYWN0ZXJzIHN0aWxsIHJlbWFpbmluZy5cbiAgaWYgKGluZGV4IDwgc3RyLmxlbmd0aCkge1xuICAgIHBhdGggKz0gc3RyLnN1YnN0cihpbmRleClcbiAgfVxuXG4gIC8vIElmIHRoZSBwYXRoIGV4aXN0cywgcHVzaCBpdCBvbnRvIHRoZSBlbmQuXG4gIGlmIChwYXRoKSB7XG4gICAgdG9rZW5zLnB1c2gocGF0aClcbiAgfVxuXG4gIHJldHVybiB0b2tlbnNcbn1cblxuLyoqXG4gKiBDb21waWxlIGEgc3RyaW5nIHRvIGEgdGVtcGxhdGUgZnVuY3Rpb24gZm9yIHRoZSBwYXRoLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgc3RyXG4gKiBAcmV0dXJuIHshZnVuY3Rpb24oT2JqZWN0PSwgT2JqZWN0PSl9XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHN0cikge1xuICByZXR1cm4gdG9rZW5zVG9GdW5jdGlvbihwYXJzZShzdHIpKVxufVxuXG4vKipcbiAqIFByZXR0aWVyIGVuY29kaW5nIG9mIFVSSSBwYXRoIHNlZ21lbnRzLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ31cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZW5jb2RlVVJJQ29tcG9uZW50UHJldHR5IChzdHIpIHtcbiAgcmV0dXJuIGVuY29kZVVSSShzdHIpLnJlcGxhY2UoL1tcXC8/I10vZywgZnVuY3Rpb24gKGMpIHtcbiAgICByZXR1cm4gJyUnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gIH0pXG59XG5cbi8qKlxuICogRW5jb2RlIHRoZSBhc3RlcmlzayBwYXJhbWV0ZXIuIFNpbWlsYXIgdG8gYHByZXR0eWAsIGJ1dCBhbGxvd3Mgc2xhc2hlcy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVuY29kZUFzdGVyaXNrIChzdHIpIHtcbiAgcmV0dXJuIGVuY29kZVVSSShzdHIpLnJlcGxhY2UoL1s/I10vZywgZnVuY3Rpb24gKGMpIHtcbiAgICByZXR1cm4gJyUnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gIH0pXG59XG5cbi8qKlxuICogRXhwb3NlIGEgbWV0aG9kIGZvciB0cmFuc2Zvcm1pbmcgdG9rZW5zIGludG8gdGhlIHBhdGggZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvRnVuY3Rpb24gKHRva2Vucykge1xuICAvLyBDb21waWxlIGFsbCB0aGUgdG9rZW5zIGludG8gcmVnZXhwcy5cbiAgdmFyIG1hdGNoZXMgPSBuZXcgQXJyYXkodG9rZW5zLmxlbmd0aClcblxuICAvLyBDb21waWxlIGFsbCB0aGUgcGF0dGVybnMgYmVmb3JlIGNvbXBpbGF0aW9uLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0eXBlb2YgdG9rZW5zW2ldID09PSAnb2JqZWN0Jykge1xuICAgICAgbWF0Y2hlc1tpXSA9IG5ldyBSZWdFeHAoJ14oPzonICsgdG9rZW5zW2ldLnBhdHRlcm4gKyAnKSQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAob2JqLCBvcHRzKSB7XG4gICAgdmFyIHBhdGggPSAnJ1xuICAgIHZhciBkYXRhID0gb2JqIHx8IHt9XG4gICAgdmFyIG9wdGlvbnMgPSBvcHRzIHx8IHt9XG4gICAgdmFyIGVuY29kZSA9IG9wdGlvbnMucHJldHR5ID8gZW5jb2RlVVJJQ29tcG9uZW50UHJldHR5IDogZW5jb2RlVVJJQ29tcG9uZW50XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHBhdGggKz0gdG9rZW5cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgdmFsdWUgPSBkYXRhW3Rva2VuLm5hbWVdXG4gICAgICB2YXIgc2VnbWVudFxuXG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgICAvLyBQcmVwZW5kIHBhcnRpYWwgc2VnbWVudCBwcmVmaXhlcy5cbiAgICAgICAgICBpZiAodG9rZW4ucGFydGlhbCkge1xuICAgICAgICAgICAgcGF0aCArPSB0b2tlbi5wcmVmaXhcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gYmUgZGVmaW5lZCcpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzYXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGlmICghdG9rZW4ucmVwZWF0KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgcmVwZWF0LCBidXQgcmVjZWl2ZWQgYCcgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgKyAnYCcpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG5vdCBiZSBlbXB0eScpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWx1ZS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHNlZ21lbnQgPSBlbmNvZGUodmFsdWVbal0pXG5cbiAgICAgICAgICBpZiAoIW1hdGNoZXNbaV0udGVzdChzZWdtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYWxsIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbWF0Y2ggXCInICsgdG9rZW4ucGF0dGVybiArICdcIiwgYnV0IHJlY2VpdmVkIGAnICsgSlNPTi5zdHJpbmdpZnkoc2VnbWVudCkgKyAnYCcpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGF0aCArPSAoaiA9PT0gMCA/IHRva2VuLnByZWZpeCA6IHRva2VuLmRlbGltaXRlcikgKyBzZWdtZW50XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBzZWdtZW50ID0gdG9rZW4uYXN0ZXJpc2sgPyBlbmNvZGVBc3Rlcmlzayh2YWx1ZSkgOiBlbmNvZGUodmFsdWUpXG5cbiAgICAgIGlmICghbWF0Y2hlc1tpXS50ZXN0KHNlZ21lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbWF0Y2ggXCInICsgdG9rZW4ucGF0dGVybiArICdcIiwgYnV0IHJlY2VpdmVkIFwiJyArIHNlZ21lbnQgKyAnXCInKVxuICAgICAgfVxuXG4gICAgICBwYXRoICs9IHRva2VuLnByZWZpeCArIHNlZ21lbnRcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aFxuICB9XG59XG5cbi8qKlxuICogRXNjYXBlIGEgcmVndWxhciBleHByZXNzaW9uIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHN0clxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmcgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbLisqPz1eIToke30oKVtcXF18XFwvXFxcXF0pL2csICdcXFxcJDEnKVxufVxuXG4vKipcbiAqIEVzY2FwZSB0aGUgY2FwdHVyaW5nIGdyb3VwIGJ5IGVzY2FwaW5nIHNwZWNpYWwgY2hhcmFjdGVycyBhbmQgbWVhbmluZy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGdyb3VwXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZUdyb3VwIChncm91cCkge1xuICByZXR1cm4gZ3JvdXAucmVwbGFjZSgvKFs9ITokXFwvKCldKS9nLCAnXFxcXCQxJylcbn1cblxuLyoqXG4gKiBBdHRhY2ggdGhlIGtleXMgYXMgYSBwcm9wZXJ0eSBvZiB0aGUgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAgeyFSZWdFeHB9IHJlXG4gKiBAcGFyYW0gIHtBcnJheX0gICBrZXlzXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBhdHRhY2hLZXlzIChyZSwga2V5cykge1xuICByZS5rZXlzID0ga2V5c1xuICByZXR1cm4gcmVcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGZsYWdzIGZvciBhIHJlZ2V4cCBmcm9tIHRoZSBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmbGFncyAob3B0aW9ucykge1xuICByZXR1cm4gb3B0aW9ucy5zZW5zaXRpdmUgPyAnJyA6ICdpJ1xufVxuXG4vKipcbiAqIFB1bGwgb3V0IGtleXMgZnJvbSBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshUmVnRXhwfSBwYXRoXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiByZWdleHBUb1JlZ2V4cCAocGF0aCwga2V5cykge1xuICAvLyBVc2UgYSBuZWdhdGl2ZSBsb29rYWhlYWQgdG8gbWF0Y2ggb25seSBjYXB0dXJpbmcgZ3JvdXBzLlxuICB2YXIgZ3JvdXBzID0gcGF0aC5zb3VyY2UubWF0Y2goL1xcKCg/IVxcPykvZylcblxuICBpZiAoZ3JvdXBzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleXMucHVzaCh7XG4gICAgICAgIG5hbWU6IGksXG4gICAgICAgIHByZWZpeDogbnVsbCxcbiAgICAgICAgZGVsaW1pdGVyOiBudWxsLFxuICAgICAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgICAgIHJlcGVhdDogZmFsc2UsXG4gICAgICAgIHBhcnRpYWw6IGZhbHNlLFxuICAgICAgICBhc3RlcmlzazogZmFsc2UsXG4gICAgICAgIHBhdHRlcm46IG51bGxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocGF0aCwga2V5cylcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm0gYW4gYXJyYXkgaW50byBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gICBrZXlzXG4gKiBAcGFyYW0gIHshT2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBhcnJheVRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIHZhciBwYXJ0cyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgcGFydHMucHVzaChwYXRoVG9SZWdleHAocGF0aFtpXSwga2V5cywgb3B0aW9ucykuc291cmNlKVxuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJyg/OicgKyBwYXJ0cy5qb2luKCd8JykgKyAnKScsIGZsYWdzKG9wdGlvbnMpKVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHJlZ2V4cCwga2V5cylcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBwYXRoIHJlZ2V4cCBmcm9tIHN0cmluZyBpbnB1dC5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBwYXRoXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHshT2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBzdHJpbmdUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgdG9rZW5zID0gcGFyc2UocGF0aClcbiAgdmFyIHJlID0gdG9rZW5zVG9SZWdFeHAodG9rZW5zLCBvcHRpb25zKVxuXG4gIC8vIEF0dGFjaCBrZXlzIGJhY2sgdG8gdGhlIHJlZ2V4cC5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGtleXMucHVzaCh0b2tlbnNbaV0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocmUsIGtleXMpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgZnVuY3Rpb24gZm9yIHRha2luZyB0b2tlbnMgYW5kIHJldHVybmluZyBhIFJlZ0V4cC5cbiAqXG4gKiBAcGFyYW0gIHshQXJyYXl9ICB0b2tlbnNcbiAqIEBwYXJhbSAge09iamVjdD19IG9wdGlvbnNcbiAqIEByZXR1cm4geyFSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvUmVnRXhwICh0b2tlbnMsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cblxuICB2YXIgc3RyaWN0ID0gb3B0aW9ucy5zdHJpY3RcbiAgdmFyIGVuZCA9IG9wdGlvbnMuZW5kICE9PSBmYWxzZVxuICB2YXIgcm91dGUgPSAnJ1xuICB2YXIgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXVxuICB2YXIgZW5kc1dpdGhTbGFzaCA9IHR5cGVvZiBsYXN0VG9rZW4gPT09ICdzdHJpbmcnICYmIC9cXC8kLy50ZXN0KGxhc3RUb2tlbilcblxuICAvLyBJdGVyYXRlIG92ZXIgdGhlIHRva2VucyBhbmQgY3JlYXRlIG91ciByZWdleHAgc3RyaW5nLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJvdXRlICs9IGVzY2FwZVN0cmluZyh0b2tlbilcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHByZWZpeCA9IGVzY2FwZVN0cmluZyh0b2tlbi5wcmVmaXgpXG4gICAgICB2YXIgY2FwdHVyZSA9ICcoPzonICsgdG9rZW4ucGF0dGVybiArICcpJ1xuXG4gICAgICBpZiAodG9rZW4ucmVwZWF0KSB7XG4gICAgICAgIGNhcHR1cmUgKz0gJyg/OicgKyBwcmVmaXggKyBjYXB0dXJlICsgJykqJ1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgaWYgKCF0b2tlbi5wYXJ0aWFsKSB7XG4gICAgICAgICAgY2FwdHVyZSA9ICcoPzonICsgcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpKT8nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FwdHVyZSA9IHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKT8nXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhcHR1cmUgPSBwcmVmaXggKyAnKCcgKyBjYXB0dXJlICsgJyknXG4gICAgICB9XG5cbiAgICAgIHJvdXRlICs9IGNhcHR1cmVcbiAgICB9XG4gIH1cblxuICAvLyBJbiBub24tc3RyaWN0IG1vZGUgd2UgYWxsb3cgYSBzbGFzaCBhdCB0aGUgZW5kIG9mIG1hdGNoLiBJZiB0aGUgcGF0aCB0b1xuICAvLyBtYXRjaCBhbHJlYWR5IGVuZHMgd2l0aCBhIHNsYXNoLCB3ZSByZW1vdmUgaXQgZm9yIGNvbnNpc3RlbmN5LiBUaGUgc2xhc2hcbiAgLy8gaXMgdmFsaWQgYXQgdGhlIGVuZCBvZiBhIHBhdGggbWF0Y2gsIG5vdCBpbiB0aGUgbWlkZGxlLiBUaGlzIGlzIGltcG9ydGFudFxuICAvLyBpbiBub24tZW5kaW5nIG1vZGUsIHdoZXJlIFwiL3Rlc3QvXCIgc2hvdWxkbid0IG1hdGNoIFwiL3Rlc3QvL3JvdXRlXCIuXG4gIGlmICghc3RyaWN0KSB7XG4gICAgcm91dGUgPSAoZW5kc1dpdGhTbGFzaCA/IHJvdXRlLnNsaWNlKDAsIC0yKSA6IHJvdXRlKSArICcoPzpcXFxcLyg/PSQpKT8nXG4gIH1cblxuICBpZiAoZW5kKSB7XG4gICAgcm91dGUgKz0gJyQnXG4gIH0gZWxzZSB7XG4gICAgLy8gSW4gbm9uLWVuZGluZyBtb2RlLCB3ZSBuZWVkIHRoZSBjYXB0dXJpbmcgZ3JvdXBzIHRvIG1hdGNoIGFzIG11Y2ggYXNcbiAgICAvLyBwb3NzaWJsZSBieSB1c2luZyBhIHBvc2l0aXZlIGxvb2thaGVhZCB0byB0aGUgZW5kIG9yIG5leHQgcGF0aCBzZWdtZW50LlxuICAgIHJvdXRlICs9IHN0cmljdCAmJiBlbmRzV2l0aFNsYXNoID8gJycgOiAnKD89XFxcXC98JCknXG4gIH1cblxuICByZXR1cm4gbmV3IFJlZ0V4cCgnXicgKyByb3V0ZSwgZmxhZ3Mob3B0aW9ucykpXG59XG5cbi8qKlxuICogTm9ybWFsaXplIHRoZSBnaXZlbiBwYXRoIHN0cmluZywgcmV0dXJuaW5nIGEgcmVndWxhciBleHByZXNzaW9uLlxuICpcbiAqIEFuIGVtcHR5IGFycmF5IGNhbiBiZSBwYXNzZWQgaW4gZm9yIHRoZSBrZXlzLCB3aGljaCB3aWxsIGhvbGQgdGhlXG4gKiBwbGFjZWhvbGRlciBrZXkgZGVzY3JpcHRpb25zLiBGb3IgZXhhbXBsZSwgdXNpbmcgYC91c2VyLzppZGAsIGBrZXlzYCB3aWxsXG4gKiBjb250YWluIGBbeyBuYW1lOiAnaWQnLCBkZWxpbWl0ZXI6ICcvJywgb3B0aW9uYWw6IGZhbHNlLCByZXBlYXQ6IGZhbHNlIH1dYC5cbiAqXG4gKiBAcGFyYW0gIHsoc3RyaW5nfFJlZ0V4cHxBcnJheSl9IHBhdGhcbiAqIEBwYXJhbSAgeyhBcnJheXxPYmplY3QpPX0gICAgICAga2V5c1xuICogQHBhcmFtICB7T2JqZWN0PX0gICAgICAgICAgICAgICBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBwYXRoVG9SZWdleHAgKHBhdGgsIGtleXMsIG9wdGlvbnMpIHtcbiAga2V5cyA9IGtleXMgfHwgW11cblxuICBpZiAoIWlzYXJyYXkoa2V5cykpIHtcbiAgICBvcHRpb25zID0gLyoqIEB0eXBlIHshT2JqZWN0fSAqLyAoa2V5cylcbiAgICBrZXlzID0gW11cbiAgfSBlbHNlIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fVxuICB9XG5cbiAgaWYgKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gcmVnZXhwVG9SZWdleHAocGF0aCwgLyoqIEB0eXBlIHshQXJyYXl9ICovIChrZXlzKSlcbiAgfVxuXG4gIGlmIChpc2FycmF5KHBhdGgpKSB7XG4gICAgcmV0dXJuIGFycmF5VG9SZWdleHAoLyoqIEB0eXBlIHshQXJyYXl9ICovIChwYXRoKSwgLyoqIEB0eXBlIHshQXJyYXl9ICovIChrZXlzKSwgb3B0aW9ucylcbiAgfVxuXG4gIHJldHVybiBzdHJpbmdUb1JlZ2V4cCgvKiogQHR5cGUge3N0cmluZ30gKi8gKHBhdGgpLCAvKiogQHR5cGUgeyFBcnJheX0gKi8gKGtleXMpLCBvcHRpb25zKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cC9pbmRleC5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoIXNlbGYpIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBjYWxsICYmICh0eXBlb2YgY2FsbCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSA/IGNhbGwgOiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90IFwiICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG4vKipcbiAqIENyZWF0ZWQgYnkgTGVvbiBSZXZpbGwgb24gMTUvMTIvMjAxNS5cbiAqIEJsb2c6IGJsb2cucmV2aWxsd2ViLmNvbVxuICogR2l0SHViOiBodHRwczovL2dpdGh1Yi5jb20vUmV2aWxsV2ViXG4gKiBUd2l0dGVyOiBAUmV2aWxsV2ViXG4gKi9cblxuLyoqXG4gKiBUaGUgbWFpbiByb3V0ZXIgY2xhc3MgYW5kIGVudHJ5IHBvaW50IHRvIHRoZSByb3V0ZXIuXG4gKi9cblxudmFyIFJlYmVsUm91dGVyID0gZXhwb3J0cy5SZWJlbFJvdXRlciA9IChmdW5jdGlvbiAoX0hUTUxFbGVtZW50KSB7XG4gICAgX2luaGVyaXRzKFJlYmVsUm91dGVyLCBfSFRNTEVsZW1lbnQpO1xuXG4gICAgZnVuY3Rpb24gUmViZWxSb3V0ZXIoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBSZWJlbFJvdXRlcik7XG5cbiAgICAgICAgcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIE9iamVjdC5nZXRQcm90b3R5cGVPZihSZWJlbFJvdXRlcikuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNsYXNzKFJlYmVsUm91dGVyLCBbe1xuICAgICAgICBrZXk6IFwiY3JlYXRlZENhbGxiYWNrXCIsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1haW4gaW5pdGlhbGlzYXRpb24gcG9pbnQgb2YgcmViZWwtcm91dGVyXG4gICAgICAgICAqIEBwYXJhbSBwcmVmaXggLSBJZiBleHRlbmRpbmcgcmViZWwtcm91dGVyIHlvdSBjYW4gc3BlY2lmeSBhIHByZWZpeCB3aGVuIGNhbGxpbmcgY3JlYXRlZENhbGxiYWNrIGluIGNhc2UgeW91ciBlbGVtZW50cyBuZWVkIHRvIGJlIG5hbWVkIGRpZmZlcmVudGx5XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlZENhbGxiYWNrKHByZWZpeCkge1xuICAgICAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciBfcHJlZml4ID0gcHJlZml4IHx8IFwicmViZWxcIjtcblxuICAgICAgICAgICAgdGhpcy5wcmV2aW91c1BhdGggPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5iYXNlUGF0aCA9IG51bGw7XG5cbiAgICAgICAgICAgIC8vR2V0IG9wdGlvbnNcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBcImFuaW1hdGlvblwiOiB0aGlzLmdldEF0dHJpYnV0ZShcImFuaW1hdGlvblwiKSA9PSBcInRydWVcIixcbiAgICAgICAgICAgICAgICBcInNoYWRvd1Jvb3RcIjogdGhpcy5nZXRBdHRyaWJ1dGUoXCJzaGFkb3dcIikgPT0gXCJ0cnVlXCIsXG4gICAgICAgICAgICAgICAgXCJpbmhlcml0XCI6IHRoaXMuZ2V0QXR0cmlidXRlKFwiaW5oZXJpdFwiKSAhPSBcImZhbHNlXCJcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vR2V0IHJvdXRlc1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5pbmhlcml0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgLy9JZiB0aGlzIGlzIGEgbmVzdGVkIHJvdXRlciB0aGVuIHdlIG5lZWQgdG8gZ28gYW5kIGdldCB0aGUgcGFyZW50IHBhdGhcbiAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHdoaWxlICgkZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICRlbGVtZW50ID0gJGVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT0gX3ByZWZpeCArIFwiLXJvdXRlclwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudCA9ICRlbGVtZW50LmN1cnJlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYmFzZVBhdGggPSBjdXJyZW50LnJvdXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJvdXRlcyA9IHt9O1xuICAgICAgICAgICAgdmFyICRjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW47XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciAkY2hpbGQgPSAkY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSAkY2hpbGQuZ2V0QXR0cmlidXRlKFwicGF0aFwiKTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKCRjaGlsZC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgX3ByZWZpeCArIFwiLWRlZmF1bHRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBcIipcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIF9wcmVmaXggKyBcIi1yb3V0ZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHRoaXMuYmFzZVBhdGggIT09IG51bGwgPyB0aGlzLmJhc2VQYXRoICsgcGF0aCA6IHBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHBhdGggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyICR0ZW1wbGF0ZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkY2hpbGQuaW5uZXJIVE1MKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdGVtcGxhdGUgPSBcIjxcIiArIF9wcmVmaXggKyBcIi1yb3V0ZT5cIiArICRjaGlsZC5pbm5lckhUTUwgKyBcIjwvXCIgKyBfcHJlZml4ICsgXCItcm91dGU+XCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yb3V0ZXNbcGF0aF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbXBvbmVudFwiOiAkY2hpbGQuZ2V0QXR0cmlidXRlKFwiY29tcG9uZW50XCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZW1wbGF0ZVwiOiAkdGVtcGxhdGVcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vQWZ0ZXIgd2UgaGF2ZSBjb2xsZWN0ZWQgYWxsIGNvbmZpZ3VyYXRpb24gY2xlYXIgaW5uZXJIVE1MXG4gICAgICAgICAgICB0aGlzLmlubmVySFRNTCA9IFwiXCI7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hhZG93Um9vdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlU2hhZG93Um9vdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMucm9vdCA9IHRoaXMuc2hhZG93Um9vdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yb290ID0gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0QW5pbWF0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgICAgUmViZWxSb3V0ZXIucGF0aENoYW5nZShmdW5jdGlvbiAoaXNCYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKF90aGlzMi5vcHRpb25zLmFuaW1hdGlvbiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNCYWNrID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpczIuY2xhc3NMaXN0LmFkZChcInJibC1iYWNrXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMyLmNsYXNzTGlzdC5yZW1vdmUoXCJyYmwtYmFja1wiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfdGhpczIucmVuZGVyKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGdW5jdGlvbiB1c2VkIHRvIGluaXRpYWxpc2UgdGhlIGFuaW1hdGlvbiBtZWNoYW5pY3MgaWYgYW5pbWF0aW9uIGlzIHR1cm5lZCBvblxuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImluaXRBbmltYXRpb25cIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGluaXRBbmltYXRpb24oKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKG11dGF0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gbXV0YXRpb25zWzBdLmFkZGVkTm9kZXNbMF07XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG90aGVyQ2hpbGRyZW4gPSBfdGhpczMuZ2V0T3RoZXJDaGlsZHJlbihub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2xhc3NMaXN0LmFkZChcInJlYmVsLWFuaW1hdGVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNsYXNzTGlzdC5hZGQoXCJlbnRlclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvdGhlckNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3RoZXJDaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuY2xhc3NMaXN0LmFkZChcImV4aXRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5jbGFzc0xpc3QuYWRkKFwiY29tcGxldGVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAxMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jbGFzc0xpc3QuYWRkKFwiY29tcGxldGVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFuaW1hdGlvbkVuZCA9IGZ1bmN0aW9uIGFuaW1hdGlvbkVuZChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQuY2xhc3NOYW1lLmluZGV4T2YoXCJleGl0XCIpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMzLnJvb3QucmVtb3ZlQ2hpbGQoZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBhbmltYXRpb25FbmQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiYW5pbWF0aW9uZW5kXCIsIGFuaW1hdGlvbkVuZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKHRoaXMsIHsgY2hpbGRMaXN0OiB0cnVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1ldGhvZCB1c2VkIHRvIGdldCB0aGUgY3VycmVudCByb3V0ZSBvYmplY3RcbiAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3VycmVudFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3VycmVudCgpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gUmViZWxSb3V0ZXIuZ2V0UGF0aEZyb21VcmwoKTtcbiAgICAgICAgICAgIGZvciAodmFyIHJvdXRlIGluIHRoaXMucm91dGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJvdXRlICE9PSBcIipcIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnZXhTdHJpbmcgPSBcIl5cIiArIHJvdXRlLnJlcGxhY2UoL3tcXHcrfVxcLz8vZywgXCIoXFxcXHcrKVxcLz9cIik7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4U3RyaW5nICs9IHJlZ2V4U3RyaW5nLmluZGV4T2YoXCJcXFxcLz9cIikgPiAtMSA/IFwiXCIgOiBcIlxcXFwvP1wiICsgXCIoWz89Ji1cXC9cXFxcdytdKyk/JFwiO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZ2V4LnRlc3QocGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfcm91dGVSZXN1bHQodGhpcy5yb3V0ZXNbcm91dGVdLCByb3V0ZSwgcmVnZXgsIHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucm91dGVzW1wiKlwiXSAhPT0gdW5kZWZpbmVkID8gX3JvdXRlUmVzdWx0KHRoaXMucm91dGVzW1wiKlwiXSwgXCIqXCIsIG51bGwsIHBhdGgpIDogbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNZXRob2QgY2FsbGVkIHRvIHJlbmRlciB0aGUgY3VycmVudCB2aWV3XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicmVuZGVyXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5jdXJyZW50KCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5wYXRoICE9PSB0aGlzLnByZXZpb3VzUGF0aCB8fCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJvb3QuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmNvbXBvbmVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRjb21wb25lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHJlc3VsdC5jb21wb25lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHJlc3VsdC5wYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSByZXN1bHQucGFyYW1zW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIk9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IEpTT04ucGFyc2UodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGRuJ3QgcGFyc2UgcGFyYW0gdmFsdWU6XCIsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRjb21wb25lbnQuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yb290LmFwcGVuZENoaWxkKCRjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICR0ZW1wbGF0ZSA9IHJlc3VsdC50ZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vVE9ETzogRmluZCBhIGZhc3RlciBhbHRlcm5hdGl2ZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCR0ZW1wbGF0ZS5pbmRleE9mKFwiJHtcIikgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0ZW1wbGF0ZSA9ICR0ZW1wbGF0ZS5yZXBsYWNlKC9cXCR7KFtee31dKil9L2csIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByID0gcmVzdWx0LnBhcmFtc1tiXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiByID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgciA9PT0gJ251bWJlcicgPyByIDogYTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucm9vdC5pbm5lckhUTUwgPSAkdGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2aW91c1BhdGggPSByZXN1bHQucGF0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIG5vZGUgLSBVc2VkIHdpdGggdGhlIGFuaW1hdGlvbiBtZWNoYW5pY3MgdG8gZ2V0IGFsbCBvdGhlciB2aWV3IGNoaWxkcmVuIGV4Y2VwdCBpdHNlbGZcbiAgICAgICAgICogQHJldHVybnMge0FycmF5fVxuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldE90aGVyQ2hpbGRyZW5cIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldE90aGVyQ2hpbGRyZW4obm9kZSkge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5yb290LmNoaWxkcmVuO1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQgIT0gbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICB9XG4gICAgfV0sIFt7XG4gICAgICAgIGtleTogXCJwYXJzZVF1ZXJ5U3RyaW5nXCIsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0YXRpYyBoZWxwZXIgbWV0aG9kIHRvIHBhcnNlIHRoZSBxdWVyeSBzdHJpbmcgZnJvbSBhIHVybCBpbnRvIGFuIG9iamVjdC5cbiAgICAgICAgICogQHBhcmFtIHVybFxuICAgICAgICAgKiBAcmV0dXJucyB7e319XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcGFyc2VRdWVyeVN0cmluZyh1cmwpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgIGlmICh1cmwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhciBxdWVyeVN0cmluZyA9IHVybC5pbmRleE9mKFwiP1wiKSA+IC0xID8gdXJsLnN1YnN0cih1cmwuaW5kZXhPZihcIj9cIikgKyAxLCB1cmwubGVuZ3RoKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXJ5U3RyaW5nICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5U3RyaW5nLnNwbGl0KFwiJlwiKS5mb3JFYWNoKGZ1bmN0aW9uIChwYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcnQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnQgPSBwYXJ0LnJlcGxhY2UoXCIrXCIsIFwiIFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlcSA9IHBhcnQuaW5kZXhPZihcIj1cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gZXEgPiAtMSA/IHBhcnQuc3Vic3RyKDAsIGVxKSA6IHBhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsID0gZXEgPiAtMSA/IGRlY29kZVVSSUNvbXBvbmVudChwYXJ0LnN1YnN0cihlcSArIDEpKSA6IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnJvbSA9IGtleS5pbmRleE9mKFwiW1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmcm9tID09IC0xKSByZXN1bHRbZGVjb2RlVVJJQ29tcG9uZW50KGtleSldID0gdmFsO2Vsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0byA9IGtleS5pbmRleE9mKFwiXVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBkZWNvZGVVUklDb21wb25lbnQoa2V5LnN1YnN0cmluZyhmcm9tICsgMSwgdG8pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQoa2V5LnN1YnN0cmluZygwLCBmcm9tKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXN1bHRba2V5XSkgcmVzdWx0W2tleV0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWluZGV4KSByZXN1bHRba2V5XS5wdXNoKHZhbCk7ZWxzZSByZXN1bHRba2V5XVtpbmRleF0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RhdGljIGhlbHBlciBtZXRob2QgdG8gY29udmVydCBhIGNsYXNzIG5hbWUgdG8gYSB2YWxpZCBlbGVtZW50IG5hbWUuXG4gICAgICAgICAqIEBwYXJhbSBDbGFzc1xuICAgICAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNsYXNzVG9UYWdcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsYXNzVG9UYWcoQ2xhc3MpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2xhc3MubmFtZSB3b3VsZCBiZSBiZXR0ZXIgYnV0IHRoaXMgaXNuJ3Qgc3VwcG9ydGVkIGluIElFIDExLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gQ2xhc3MudG9TdHJpbmcoKS5tYXRjaCgvXmZ1bmN0aW9uXFxzKihbXlxccyhdKykvKVsxXS5yZXBsYWNlKC9cXFcrL2csICctJykucmVwbGFjZSgvKFthLXpcXGRdKShbQS1aMC05XSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZG4ndCBwYXJzZSBjbGFzcyBuYW1lOlwiLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChSZWJlbFJvdXRlci52YWxpZEVsZW1lbnRUYWcobmFtZSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2xhc3MgbmFtZSBjb3VsZG4ndCBiZSB0cmFuc2xhdGVkIHRvIHRhZy5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdGF0aWMgaGVscGVyIG1ldGhvZCB1c2VkIHRvIGRldGVybWluZSBpZiBhbiBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCBuYW1lIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZC5cbiAgICAgICAgICogQHBhcmFtIG5hbWVcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaXNSZWdpc3RlcmVkRWxlbWVudFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaXNSZWdpc3RlcmVkRWxlbWVudChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKS5jb25zdHJ1Y3RvciAhPT0gSFRNTEVsZW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RhdGljIGhlbHBlciBtZXRob2QgdG8gdGFrZSBhIHdlYiBjb21wb25lbnQgY2xhc3MsIGNyZWF0ZSBhbiBlbGVtZW50IG5hbWUgYW5kIHJlZ2lzdGVyIHRoZSBuZXcgZWxlbWVudCBvbiB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSBDbGFzc1xuICAgICAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNyZWF0ZUVsZW1lbnRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQoQ2xhc3MpIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gUmViZWxSb3V0ZXIuY2xhc3NUb1RhZyhDbGFzcyk7XG4gICAgICAgICAgICBpZiAoUmViZWxSb3V0ZXIuaXNSZWdpc3RlcmVkRWxlbWVudChuYW1lKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBDbGFzcy5wcm90b3R5cGUubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KG5hbWUsIENsYXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNpbXBsZSBzdGF0aWMgaGVscGVyIG1ldGhvZCBjb250YWluaW5nIGEgcmVndWxhciBleHByZXNzaW9uIHRvIHZhbGlkYXRlIGFuIGVsZW1lbnQgbmFtZVxuICAgICAgICAgKiBAcGFyYW0gdGFnXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInZhbGlkRWxlbWVudFRhZ1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdmFsaWRFbGVtZW50VGFnKHRhZykge1xuICAgICAgICAgICAgcmV0dXJuICgvXlthLXowLTlcXC1dKyQvLnRlc3QodGFnKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNZXRob2QgdXNlZCB0byByZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBVUkwgcGF0aCBjaGFuZ2VzLlxuICAgICAgICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICAgICAgICovXG5cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJwYXRoQ2hhbmdlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYXRoQ2hhbmdlKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoUmViZWxSb3V0ZXIuY2hhbmdlQ2FsbGJhY2tzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBSZWJlbFJvdXRlci5jaGFuZ2VDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFJlYmVsUm91dGVyLmNoYW5nZUNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHZhciBjaGFuZ2VIYW5kbGVyID0gZnVuY3Rpb24gY2hhbmdlSGFuZGxlcigpIHtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiAgZXZlbnQub2xkVVJMIGFuZCBldmVudC5uZXdVUkwgd291bGQgYmUgYmV0dGVyIGhlcmUgYnV0IHRoaXMgZG9lc24ndCB3b3JrIGluIElFIDooXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ocmVmICE9IFJlYmVsUm91dGVyLm9sZFVSTCkge1xuICAgICAgICAgICAgICAgICAgICBSZWJlbFJvdXRlci5jaGFuZ2VDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKFJlYmVsUm91dGVyLmlzQmFjayk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBSZWJlbFJvdXRlci5pc0JhY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgUmViZWxSb3V0ZXIub2xkVVJMID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5vbmhhc2hjaGFuZ2UgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJibGJhY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBSZWJlbFJvdXRlci5pc0JhY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2luZG93Lm9uaGFzaGNoYW5nZSA9IGNoYW5nZUhhbmRsZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RhdGljIGhlbHBlciBtZXRob2QgdXNlZCB0byBnZXQgdGhlIHBhcmFtZXRlcnMgZnJvbSB0aGUgcHJvdmlkZWQgcm91dGUuXG4gICAgICAgICAqIEBwYXJhbSByZWdleFxuICAgICAgICAgKiBAcGFyYW0gcm91dGVcbiAgICAgICAgICogQHBhcmFtIHBhdGhcbiAgICAgICAgICogQHJldHVybnMge3t9fVxuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldFBhcmFtc0Zyb21VcmxcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFBhcmFtc0Zyb21VcmwocmVnZXgsIHJvdXRlLCBwYXRoKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gUmViZWxSb3V0ZXIucGFyc2VRdWVyeVN0cmluZyhwYXRoKTtcbiAgICAgICAgICAgIHZhciByZSA9IC97KFxcdyspfS9nO1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHdoaWxlIChtYXRjaCA9IHJlLmV4ZWMocm91dGUpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG1hdGNoWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZWdleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHRzMiA9IHJlZ2V4LmV4ZWMocGF0aCk7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtLCBpZHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2l0ZW1dID0gcmVzdWx0czJbaWR4ICsgMV07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0YXRpYyBoZWxwZXIgbWV0aG9kIHVzZWQgdG8gZ2V0IHRoZSBwYXRoIGZyb20gdGhlIGN1cnJlbnQgVVJMLlxuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICovXG5cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRQYXRoRnJvbVVybFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0UGF0aEZyb21VcmwoKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gd2luZG93LmxvY2F0aW9uLmhyZWYubWF0Y2goLyMoLiopJC8pO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRbMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gUmViZWxSb3V0ZXI7XG59KShIVE1MRWxlbWVudCk7XG5cbmRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcInJlYmVsLXJvdXRlclwiLCBSZWJlbFJvdXRlcik7XG5cbi8qKlxuICogQ2xhc3Mgd2hpY2ggcmVwcmVzZW50cyB0aGUgcmViZWwtcm91dGUgY3VzdG9tIGVsZW1lbnRcbiAqL1xuXG52YXIgUmViZWxSb3V0ZSA9IGV4cG9ydHMuUmViZWxSb3V0ZSA9IChmdW5jdGlvbiAoX0hUTUxFbGVtZW50Mikge1xuICAgIF9pbmhlcml0cyhSZWJlbFJvdXRlLCBfSFRNTEVsZW1lbnQyKTtcblxuICAgIGZ1bmN0aW9uIFJlYmVsUm91dGUoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBSZWJlbFJvdXRlKTtcblxuICAgICAgICByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgT2JqZWN0LmdldFByb3RvdHlwZU9mKFJlYmVsUm91dGUpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH1cblxuICAgIHJldHVybiBSZWJlbFJvdXRlO1xufSkoSFRNTEVsZW1lbnQpO1xuXG5kb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJyZWJlbC1yb3V0ZVwiLCBSZWJlbFJvdXRlKTtcblxuLyoqXG4gKiBDbGFzcyB3aGljaCByZXByZXNlbnRzIHRoZSByZWJlbC1kZWZhdWx0IGN1c3RvbSBlbGVtZW50XG4gKi9cblxudmFyIFJlYmVsRGVmYXVsdCA9IChmdW5jdGlvbiAoX0hUTUxFbGVtZW50Mykge1xuICAgIF9pbmhlcml0cyhSZWJlbERlZmF1bHQsIF9IVE1MRWxlbWVudDMpO1xuXG4gICAgZnVuY3Rpb24gUmViZWxEZWZhdWx0KCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgUmViZWxEZWZhdWx0KTtcblxuICAgICAgICByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgT2JqZWN0LmdldFByb3RvdHlwZU9mKFJlYmVsRGVmYXVsdCkuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFJlYmVsRGVmYXVsdDtcbn0pKEhUTUxFbGVtZW50KTtcblxuZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwicmViZWwtZGVmYXVsdFwiLCBSZWJlbERlZmF1bHQpO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIHByb3RvdHlwZSBmb3IgYW4gYW5jaG9yIGVsZW1lbnQgd2hpY2ggYWRkZWQgZnVuY3Rpb25hbGl0eSB0byBwZXJmb3JtIGEgYmFjayB0cmFuc2l0aW9uLlxuICovXG5cbnZhciBSZWJlbEJhY2tBID0gKGZ1bmN0aW9uIChfSFRNTEFuY2hvckVsZW1lbnQpIHtcbiAgICBfaW5oZXJpdHMoUmViZWxCYWNrQSwgX0hUTUxBbmNob3JFbGVtZW50KTtcblxuICAgIGZ1bmN0aW9uIFJlYmVsQmFja0EoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBSZWJlbEJhY2tBKTtcblxuICAgICAgICByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgT2JqZWN0LmdldFByb3RvdHlwZU9mKFJlYmVsQmFja0EpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhSZWJlbEJhY2tBLCBbe1xuICAgICAgICBrZXk6IFwiYXR0YWNoZWRDYWxsYmFja1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczcgPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aCA9IF90aGlzNy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpO1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3JibGJhY2snKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gcGF0aDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFJlYmVsQmFja0E7XG59KShIVE1MQW5jaG9yRWxlbWVudCk7XG4vKipcbiAqIFJlZ2lzdGVyIHRoZSBiYWNrIGJ1dHRvbiBjdXN0b20gZWxlbWVudFxuICovXG5cbmRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcInJlYmVsLWJhY2stYVwiLCB7XG4gICAgZXh0ZW5kczogXCJhXCIsXG4gICAgcHJvdG90eXBlOiBSZWJlbEJhY2tBLnByb3RvdHlwZVxufSk7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdXRlIG9iamVjdFxuICogQHBhcmFtIG9iaiAtIHRoZSBjb21wb25lbnQgbmFtZSBvciB0aGUgSFRNTCB0ZW1wbGF0ZVxuICogQHBhcmFtIHJvdXRlXG4gKiBAcGFyYW0gcmVnZXhcbiAqIEBwYXJhbSBwYXRoXG4gKiBAcmV0dXJucyB7e319XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBfcm91dGVSZXN1bHQob2JqLCByb3V0ZSwgcmVnZXgsIHBhdGgpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHJlc3VsdFtrZXldID0gb2JqW2tleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVzdWx0LnJvdXRlID0gcm91dGU7XG4gICAgcmVzdWx0LnBhdGggPSBwYXRoO1xuICAgIHJlc3VsdC5wYXJhbXMgPSBSZWJlbFJvdXRlci5nZXRQYXJhbXNGcm9tVXJsKHJlZ2V4LCByb3V0ZSwgcGF0aCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcmViZWwtcm91dGVyL2VzNS9yZWJlbC1yb3V0ZXIuanNcIixcIi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcmViZWwtcm91dGVyL2VzNVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxNCBUaGUgUG9seW1lciBQcm9qZWN0IEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGNvZGUgbWF5IG9ubHkgYmUgdXNlZCB1bmRlciB0aGUgQlNEIHN0eWxlIGxpY2Vuc2UgZm91bmQgYXQgaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0xJQ0VOU0UudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9BVVRIT1JTLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBjb250cmlidXRvcnMgbWF5IGJlIGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9DT05UUklCVVRPUlMudHh0XG4gKiBDb2RlIGRpc3RyaWJ1dGVkIGJ5IEdvb2dsZSBhcyBwYXJ0IG9mIHRoZSBwb2x5bWVyIHByb2plY3QgaXMgYWxzb1xuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcbiAqL1xuLy8gQHZlcnNpb24gMC43LjIyXG4oZnVuY3Rpb24oKSB7XG4gIHdpbmRvdy5XZWJDb21wb25lbnRzID0gd2luZG93LldlYkNvbXBvbmVudHMgfHwge1xuICAgIGZsYWdzOiB7fVxuICB9O1xuICB2YXIgZmlsZSA9IFwid2ViY29tcG9uZW50cy5qc1wiO1xuICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcignc2NyaXB0W3NyYyo9XCInICsgZmlsZSArICdcIl0nKTtcbiAgdmFyIGZsYWdzID0ge307XG4gIGlmICghZmxhZ3Mubm9PcHRzKSB7XG4gICAgbG9jYXRpb24uc2VhcmNoLnNsaWNlKDEpLnNwbGl0KFwiJlwiKS5mb3JFYWNoKGZ1bmN0aW9uKG9wdGlvbikge1xuICAgICAgdmFyIHBhcnRzID0gb3B0aW9uLnNwbGl0KFwiPVwiKTtcbiAgICAgIHZhciBtYXRjaDtcbiAgICAgIGlmIChwYXJ0c1swXSAmJiAobWF0Y2ggPSBwYXJ0c1swXS5tYXRjaCgvd2MtKC4rKS8pKSkge1xuICAgICAgICBmbGFnc1ttYXRjaFsxXV0gPSBwYXJ0c1sxXSB8fCB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChzY3JpcHQpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBhOyBhID0gc2NyaXB0LmF0dHJpYnV0ZXNbaV07IGkrKykge1xuICAgICAgICBpZiAoYS5uYW1lICE9PSBcInNyY1wiKSB7XG4gICAgICAgICAgZmxhZ3NbYS5uYW1lXSA9IGEudmFsdWUgfHwgdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZmxhZ3MubG9nICYmIGZsYWdzLmxvZy5zcGxpdCkge1xuICAgICAgdmFyIHBhcnRzID0gZmxhZ3MubG9nLnNwbGl0KFwiLFwiKTtcbiAgICAgIGZsYWdzLmxvZyA9IHt9O1xuICAgICAgcGFydHMuZm9yRWFjaChmdW5jdGlvbihmKSB7XG4gICAgICAgIGZsYWdzLmxvZ1tmXSA9IHRydWU7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxhZ3MubG9nID0ge307XG4gICAgfVxuICB9XG4gIGZsYWdzLnNoYWRvdyA9IGZsYWdzLnNoYWRvdyB8fCBmbGFncy5zaGFkb3dkb20gfHwgZmxhZ3MucG9seWZpbGw7XG4gIGlmIChmbGFncy5zaGFkb3cgPT09IFwibmF0aXZlXCIpIHtcbiAgICBmbGFncy5zaGFkb3cgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBmbGFncy5zaGFkb3cgPSBmbGFncy5zaGFkb3cgfHwgIUhUTUxFbGVtZW50LnByb3RvdHlwZS5jcmVhdGVTaGFkb3dSb290O1xuICB9XG4gIGlmIChmbGFncy5yZWdpc3Rlcikge1xuICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cyA9IHdpbmRvdy5DdXN0b21FbGVtZW50cyB8fCB7XG4gICAgICBmbGFnczoge31cbiAgICB9O1xuICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cy5mbGFncy5yZWdpc3RlciA9IGZsYWdzLnJlZ2lzdGVyO1xuICB9XG4gIFdlYkNvbXBvbmVudHMuZmxhZ3MgPSBmbGFncztcbn0pKCk7XG5cbmlmIChXZWJDb21wb25lbnRzLmZsYWdzLnNoYWRvdykge1xuICBpZiAodHlwZW9mIFdlYWtNYXAgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG4gICAgICB2YXIgY291bnRlciA9IERhdGUubm93KCkgJSAxZTk7XG4gICAgICB2YXIgV2Vha01hcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm5hbWUgPSBcIl9fc3RcIiArIChNYXRoLnJhbmRvbSgpICogMWU5ID4+PiAwKSArIChjb3VudGVyKysgKyBcIl9fXCIpO1xuICAgICAgfTtcbiAgICAgIFdlYWtNYXAucHJvdG90eXBlID0ge1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5uYW1lXTtcbiAgICAgICAgICBpZiAoZW50cnkgJiYgZW50cnlbMF0gPT09IGtleSkgZW50cnlbMV0gPSB2YWx1ZTsgZWxzZSBkZWZpbmVQcm9wZXJ0eShrZXksIHRoaXMubmFtZSwge1xuICAgICAgICAgICAgdmFsdWU6IFsga2V5LCB2YWx1ZSBdLFxuICAgICAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICB2YXIgZW50cnk7XG4gICAgICAgICAgcmV0dXJuIChlbnRyeSA9IGtleVt0aGlzLm5hbWVdKSAmJiBlbnRyeVswXSA9PT0ga2V5ID8gZW50cnlbMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlXCI6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgIHZhciBlbnRyeSA9IGtleVt0aGlzLm5hbWVdO1xuICAgICAgICAgIGlmICghZW50cnkgfHwgZW50cnlbMF0gIT09IGtleSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIGVudHJ5WzBdID0gZW50cnlbMV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIGhhczogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMubmFtZV07XG4gICAgICAgICAgaWYgKCFlbnRyeSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHJldHVybiBlbnRyeVswXSA9PT0ga2V5O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgd2luZG93LldlYWtNYXAgPSBXZWFrTWFwO1xuICAgIH0pKCk7XG4gIH1cbiAgd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsID0ge307XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBjb25zdHJ1Y3RvclRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgbmF0aXZlUHJvdG90eXBlVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciB3cmFwcGVycyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgZnVuY3Rpb24gZGV0ZWN0RXZhbCgpIHtcbiAgICAgIGlmICh0eXBlb2YgY2hyb21lICE9PSBcInVuZGVmaW5lZFwiICYmIGNocm9tZS5hcHAgJiYgY2hyb21lLmFwcC5ydW50aW1lKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChuYXZpZ2F0b3IuZ2V0RGV2aWNlU3RvcmFnZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgZiA9IG5ldyBGdW5jdGlvbihcInJldHVybiB0cnVlO1wiKTtcbiAgICAgICAgcmV0dXJuIGYoKTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGhhc0V2YWwgPSBkZXRlY3RFdmFsKCk7XG4gICAgZnVuY3Rpb24gYXNzZXJ0KGIpIHtcbiAgICAgIGlmICghYikgdGhyb3cgbmV3IEVycm9yKFwiQXNzZXJ0aW9uIGZhaWxlZFwiKTtcbiAgICB9XG4gICAgdmFyIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xuICAgIHZhciBnZXRPd25Qcm9wZXJ0eU5hbWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXM7XG4gICAgdmFyIGdldE93blByb3BlcnR5RGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG4gICAgZnVuY3Rpb24gbWl4aW4odG8sIGZyb20pIHtcbiAgICAgIHZhciBuYW1lcyA9IGdldE93blByb3BlcnR5TmFtZXMoZnJvbSk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgIGRlZmluZVByb3BlcnR5KHRvLCBuYW1lLCBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZnJvbSwgbmFtZSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRvO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtaXhpblN0YXRpY3ModG8sIGZyb20pIHtcbiAgICAgIHZhciBuYW1lcyA9IGdldE93blByb3BlcnR5TmFtZXMoZnJvbSk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgY2FzZSBcImFyZ3VtZW50c1wiOlxuICAgICAgICAgY2FzZSBcImNhbGxlclwiOlxuICAgICAgICAgY2FzZSBcImxlbmd0aFwiOlxuICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgIGNhc2UgXCJwcm90b3R5cGVcIjpcbiAgICAgICAgIGNhc2UgXCJ0b1N0cmluZ1wiOlxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGRlZmluZVByb3BlcnR5KHRvLCBuYW1lLCBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZnJvbSwgbmFtZSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRvO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvbmVPZihvYmplY3QsIHByb3BlcnR5TmFtZXMpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcGVydHlOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocHJvcGVydHlOYW1lc1tpXSBpbiBvYmplY3QpIHJldHVybiBwcm9wZXJ0eU5hbWVzW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgbm9uRW51bWVyYWJsZURhdGFEZXNjcmlwdG9yID0ge1xuICAgICAgdmFsdWU6IHVuZGVmaW5lZCxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGRlZmluZU5vbkVudW1lcmFibGVEYXRhUHJvcGVydHkob2JqZWN0LCBuYW1lLCB2YWx1ZSkge1xuICAgICAgbm9uRW51bWVyYWJsZURhdGFEZXNjcmlwdG9yLnZhbHVlID0gdmFsdWU7XG4gICAgICBkZWZpbmVQcm9wZXJ0eShvYmplY3QsIG5hbWUsIG5vbkVudW1lcmFibGVEYXRhRGVzY3JpcHRvcik7XG4gICAgfVxuICAgIGdldE93blByb3BlcnR5TmFtZXMod2luZG93KTtcbiAgICBmdW5jdGlvbiBnZXRXcmFwcGVyQ29uc3RydWN0b3Iobm9kZSwgb3B0X2luc3RhbmNlKSB7XG4gICAgICB2YXIgbmF0aXZlUHJvdG90eXBlID0gbm9kZS5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG5vZGUpO1xuICAgICAgaWYgKGlzRmlyZWZveCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGdldE93blByb3BlcnR5TmFtZXMobmF0aXZlUHJvdG90eXBlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBuYXRpdmVQcm90b3R5cGUgPSBuYXRpdmVQcm90b3R5cGUuX19wcm90b19fO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgd3JhcHBlckNvbnN0cnVjdG9yID0gY29uc3RydWN0b3JUYWJsZS5nZXQobmF0aXZlUHJvdG90eXBlKTtcbiAgICAgIGlmICh3cmFwcGVyQ29uc3RydWN0b3IpIHJldHVybiB3cmFwcGVyQ29uc3RydWN0b3I7XG4gICAgICB2YXIgcGFyZW50V3JhcHBlckNvbnN0cnVjdG9yID0gZ2V0V3JhcHBlckNvbnN0cnVjdG9yKG5hdGl2ZVByb3RvdHlwZSk7XG4gICAgICB2YXIgR2VuZXJhdGVkV3JhcHBlciA9IGNyZWF0ZVdyYXBwZXJDb25zdHJ1Y3RvcihwYXJlbnRXcmFwcGVyQ29uc3RydWN0b3IpO1xuICAgICAgcmVnaXN0ZXJJbnRlcm5hbChuYXRpdmVQcm90b3R5cGUsIEdlbmVyYXRlZFdyYXBwZXIsIG9wdF9pbnN0YW5jZSk7XG4gICAgICByZXR1cm4gR2VuZXJhdGVkV3JhcHBlcjtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkRm9yd2FyZGluZ1Byb3BlcnRpZXMobmF0aXZlUHJvdG90eXBlLCB3cmFwcGVyUHJvdG90eXBlKSB7XG4gICAgICBpbnN0YWxsUHJvcGVydHkobmF0aXZlUHJvdG90eXBlLCB3cmFwcGVyUHJvdG90eXBlLCB0cnVlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJJbnN0YW5jZVByb3BlcnRpZXMod3JhcHBlclByb3RvdHlwZSwgaW5zdGFuY2VPYmplY3QpIHtcbiAgICAgIGluc3RhbGxQcm9wZXJ0eShpbnN0YW5jZU9iamVjdCwgd3JhcHBlclByb3RvdHlwZSwgZmFsc2UpO1xuICAgIH1cbiAgICB2YXIgaXNGaXJlZm94ID0gL0ZpcmVmb3gvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gICAgdmFyIGR1bW15RGVzY3JpcHRvciA9IHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7fSxcbiAgICAgIHNldDogZnVuY3Rpb24odikge30sXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfTtcbiAgICBmdW5jdGlvbiBpc0V2ZW50SGFuZGxlck5hbWUobmFtZSkge1xuICAgICAgcmV0dXJuIC9eb25bYS16XSskLy50ZXN0KG5hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc0lkZW50aWZpZXJOYW1lKG5hbWUpIHtcbiAgICAgIHJldHVybiAvXlthLXpBLVpfJF1bYS16QS1aXyQwLTldKiQvLnRlc3QobmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldEdldHRlcihuYW1lKSB7XG4gICAgICByZXR1cm4gaGFzRXZhbCAmJiBpc0lkZW50aWZpZXJOYW1lKG5hbWUpID8gbmV3IEZ1bmN0aW9uKFwicmV0dXJuIHRoaXMuX19pbXBsNGNmMWU3ODJoZ19fLlwiICsgbmFtZSkgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19pbXBsNGNmMWU3ODJoZ19fW25hbWVdO1xuICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0U2V0dGVyKG5hbWUpIHtcbiAgICAgIHJldHVybiBoYXNFdmFsICYmIGlzSWRlbnRpZmllck5hbWUobmFtZSkgPyBuZXcgRnVuY3Rpb24oXCJ2XCIsIFwidGhpcy5fX2ltcGw0Y2YxZTc4MmhnX18uXCIgKyBuYW1lICsgXCIgPSB2XCIpIDogZnVuY3Rpb24odikge1xuICAgICAgICB0aGlzLl9faW1wbDRjZjFlNzgyaGdfX1tuYW1lXSA9IHY7XG4gICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRNZXRob2QobmFtZSkge1xuICAgICAgcmV0dXJuIGhhc0V2YWwgJiYgaXNJZGVudGlmaWVyTmFtZShuYW1lKSA/IG5ldyBGdW5jdGlvbihcInJldHVybiB0aGlzLl9faW1wbDRjZjFlNzgyaGdfXy5cIiArIG5hbWUgKyBcIi5hcHBseSh0aGlzLl9faW1wbDRjZjFlNzgyaGdfXywgYXJndW1lbnRzKVwiKSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX2ltcGw0Y2YxZTc4MmhnX19bbmFtZV0uYXBwbHkodGhpcy5fX2ltcGw0Y2YxZTc4MmhnX18sIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXREZXNjcmlwdG9yKHNvdXJjZSwgbmFtZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc291cmNlLCBuYW1lKTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIHJldHVybiBkdW1teURlc2NyaXB0b3I7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBpc0Jyb2tlblNhZmFyaSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGRlc2NyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihOb2RlLnByb3RvdHlwZSwgXCJub2RlVHlwZVwiKTtcbiAgICAgIHJldHVybiBkZXNjciAmJiAhZGVzY3IuZ2V0ICYmICFkZXNjci5zZXQ7XG4gICAgfSgpO1xuICAgIGZ1bmN0aW9uIGluc3RhbGxQcm9wZXJ0eShzb3VyY2UsIHRhcmdldCwgYWxsb3dNZXRob2QsIG9wdF9ibGFja2xpc3QpIHtcbiAgICAgIHZhciBuYW1lcyA9IGdldE93blByb3BlcnR5TmFtZXMoc291cmNlKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgaWYgKG5hbWUgPT09IFwicG9seW1lckJsYWNrTGlzdF9cIikgY29udGludWU7XG4gICAgICAgIGlmIChuYW1lIGluIHRhcmdldCkgY29udGludWU7XG4gICAgICAgIGlmIChzb3VyY2UucG9seW1lckJsYWNrTGlzdF8gJiYgc291cmNlLnBvbHltZXJCbGFja0xpc3RfW25hbWVdKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGlzRmlyZWZveCkge1xuICAgICAgICAgIHNvdXJjZS5fX2xvb2t1cEdldHRlcl9fKG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkZXNjcmlwdG9yID0gZ2V0RGVzY3JpcHRvcihzb3VyY2UsIG5hbWUpO1xuICAgICAgICB2YXIgZ2V0dGVyLCBzZXR0ZXI7XG4gICAgICAgIGlmICh0eXBlb2YgZGVzY3JpcHRvci52YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgaWYgKGFsbG93TWV0aG9kKSB7XG4gICAgICAgICAgICB0YXJnZXRbbmFtZV0gPSBnZXRNZXRob2QobmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc0V2ZW50ID0gaXNFdmVudEhhbmRsZXJOYW1lKG5hbWUpO1xuICAgICAgICBpZiAoaXNFdmVudCkgZ2V0dGVyID0gc2NvcGUuZ2V0RXZlbnRIYW5kbGVyR2V0dGVyKG5hbWUpOyBlbHNlIGdldHRlciA9IGdldEdldHRlcihuYW1lKTtcbiAgICAgICAgaWYgKGRlc2NyaXB0b3Iud3JpdGFibGUgfHwgZGVzY3JpcHRvci5zZXQgfHwgaXNCcm9rZW5TYWZhcmkpIHtcbiAgICAgICAgICBpZiAoaXNFdmVudCkgc2V0dGVyID0gc2NvcGUuZ2V0RXZlbnRIYW5kbGVyU2V0dGVyKG5hbWUpOyBlbHNlIHNldHRlciA9IGdldFNldHRlcihuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY29uZmlndXJhYmxlID0gaXNCcm9rZW5TYWZhcmkgfHwgZGVzY3JpcHRvci5jb25maWd1cmFibGU7XG4gICAgICAgIGRlZmluZVByb3BlcnR5KHRhcmdldCwgbmFtZSwge1xuICAgICAgICAgIGdldDogZ2V0dGVyLFxuICAgICAgICAgIHNldDogc2V0dGVyLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogY29uZmlndXJhYmxlLFxuICAgICAgICAgIGVudW1lcmFibGU6IGRlc2NyaXB0b3IuZW51bWVyYWJsZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcmVnaXN0ZXIobmF0aXZlQ29uc3RydWN0b3IsIHdyYXBwZXJDb25zdHJ1Y3Rvciwgb3B0X2luc3RhbmNlKSB7XG4gICAgICBpZiAobmF0aXZlQ29uc3RydWN0b3IgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgbmF0aXZlUHJvdG90eXBlID0gbmF0aXZlQ29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgICAgcmVnaXN0ZXJJbnRlcm5hbChuYXRpdmVQcm90b3R5cGUsIHdyYXBwZXJDb25zdHJ1Y3Rvciwgb3B0X2luc3RhbmNlKTtcbiAgICAgIG1peGluU3RhdGljcyh3cmFwcGVyQ29uc3RydWN0b3IsIG5hdGl2ZUNvbnN0cnVjdG9yKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJJbnRlcm5hbChuYXRpdmVQcm90b3R5cGUsIHdyYXBwZXJDb25zdHJ1Y3Rvciwgb3B0X2luc3RhbmNlKSB7XG4gICAgICB2YXIgd3JhcHBlclByb3RvdHlwZSA9IHdyYXBwZXJDb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgICBhc3NlcnQoY29uc3RydWN0b3JUYWJsZS5nZXQobmF0aXZlUHJvdG90eXBlKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgIGNvbnN0cnVjdG9yVGFibGUuc2V0KG5hdGl2ZVByb3RvdHlwZSwgd3JhcHBlckNvbnN0cnVjdG9yKTtcbiAgICAgIG5hdGl2ZVByb3RvdHlwZVRhYmxlLnNldCh3cmFwcGVyUHJvdG90eXBlLCBuYXRpdmVQcm90b3R5cGUpO1xuICAgICAgYWRkRm9yd2FyZGluZ1Byb3BlcnRpZXMobmF0aXZlUHJvdG90eXBlLCB3cmFwcGVyUHJvdG90eXBlKTtcbiAgICAgIGlmIChvcHRfaW5zdGFuY2UpIHJlZ2lzdGVySW5zdGFuY2VQcm9wZXJ0aWVzKHdyYXBwZXJQcm90b3R5cGUsIG9wdF9pbnN0YW5jZSk7XG4gICAgICBkZWZpbmVOb25FbnVtZXJhYmxlRGF0YVByb3BlcnR5KHdyYXBwZXJQcm90b3R5cGUsIFwiY29uc3RydWN0b3JcIiwgd3JhcHBlckNvbnN0cnVjdG9yKTtcbiAgICAgIHdyYXBwZXJDb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSB3cmFwcGVyUHJvdG90eXBlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc1dyYXBwZXJGb3Iod3JhcHBlckNvbnN0cnVjdG9yLCBuYXRpdmVDb25zdHJ1Y3Rvcikge1xuICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yVGFibGUuZ2V0KG5hdGl2ZUNvbnN0cnVjdG9yLnByb3RvdHlwZSkgPT09IHdyYXBwZXJDb25zdHJ1Y3RvcjtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJPYmplY3Qob2JqZWN0KSB7XG4gICAgICB2YXIgbmF0aXZlUHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCk7XG4gICAgICB2YXIgc3VwZXJXcmFwcGVyQ29uc3RydWN0b3IgPSBnZXRXcmFwcGVyQ29uc3RydWN0b3IobmF0aXZlUHJvdG90eXBlKTtcbiAgICAgIHZhciBHZW5lcmF0ZWRXcmFwcGVyID0gY3JlYXRlV3JhcHBlckNvbnN0cnVjdG9yKHN1cGVyV3JhcHBlckNvbnN0cnVjdG9yKTtcbiAgICAgIHJlZ2lzdGVySW50ZXJuYWwobmF0aXZlUHJvdG90eXBlLCBHZW5lcmF0ZWRXcmFwcGVyLCBvYmplY3QpO1xuICAgICAgcmV0dXJuIEdlbmVyYXRlZFdyYXBwZXI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZVdyYXBwZXJDb25zdHJ1Y3RvcihzdXBlcldyYXBwZXJDb25zdHJ1Y3Rvcikge1xuICAgICAgZnVuY3Rpb24gR2VuZXJhdGVkV3JhcHBlcihub2RlKSB7XG4gICAgICAgIHN1cGVyV3JhcHBlckNvbnN0cnVjdG9yLmNhbGwodGhpcywgbm9kZSk7XG4gICAgICB9XG4gICAgICB2YXIgcCA9IE9iamVjdC5jcmVhdGUoc3VwZXJXcmFwcGVyQ29uc3RydWN0b3IucHJvdG90eXBlKTtcbiAgICAgIHAuY29uc3RydWN0b3IgPSBHZW5lcmF0ZWRXcmFwcGVyO1xuICAgICAgR2VuZXJhdGVkV3JhcHBlci5wcm90b3R5cGUgPSBwO1xuICAgICAgcmV0dXJuIEdlbmVyYXRlZFdyYXBwZXI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzV3JhcHBlcihvYmplY3QpIHtcbiAgICAgIHJldHVybiBvYmplY3QgJiYgb2JqZWN0Ll9faW1wbDRjZjFlNzgyaGdfXztcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNOYXRpdmUob2JqZWN0KSB7XG4gICAgICByZXR1cm4gIWlzV3JhcHBlcihvYmplY3QpO1xuICAgIH1cbiAgICBmdW5jdGlvbiB3cmFwKGltcGwpIHtcbiAgICAgIGlmIChpbXBsID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICAgIGFzc2VydChpc05hdGl2ZShpbXBsKSk7XG4gICAgICB2YXIgd3JhcHBlciA9IGltcGwuX193cmFwcGVyOGUzZGQ5M2E2MF9fO1xuICAgICAgaWYgKHdyYXBwZXIgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gd3JhcHBlcjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpbXBsLl9fd3JhcHBlcjhlM2RkOTNhNjBfXyA9IG5ldyAoZ2V0V3JhcHBlckNvbnN0cnVjdG9yKGltcGwsIGltcGwpKShpbXBsKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdW53cmFwKHdyYXBwZXIpIHtcbiAgICAgIGlmICh3cmFwcGVyID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICAgIGFzc2VydChpc1dyYXBwZXIod3JhcHBlcikpO1xuICAgICAgcmV0dXJuIHdyYXBwZXIuX19pbXBsNGNmMWU3ODJoZ19fO1xuICAgIH1cbiAgICBmdW5jdGlvbiB1bnNhZmVVbndyYXAod3JhcHBlcikge1xuICAgICAgcmV0dXJuIHdyYXBwZXIuX19pbXBsNGNmMWU3ODJoZ19fO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzZXRXcmFwcGVyKGltcGwsIHdyYXBwZXIpIHtcbiAgICAgIHdyYXBwZXIuX19pbXBsNGNmMWU3ODJoZ19fID0gaW1wbDtcbiAgICAgIGltcGwuX193cmFwcGVyOGUzZGQ5M2E2MF9fID0gd3JhcHBlcjtcbiAgICB9XG4gICAgZnVuY3Rpb24gdW53cmFwSWZOZWVkZWQob2JqZWN0KSB7XG4gICAgICByZXR1cm4gb2JqZWN0ICYmIGlzV3JhcHBlcihvYmplY3QpID8gdW53cmFwKG9iamVjdCkgOiBvYmplY3Q7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHdyYXBJZk5lZWRlZChvYmplY3QpIHtcbiAgICAgIHJldHVybiBvYmplY3QgJiYgIWlzV3JhcHBlcihvYmplY3QpID8gd3JhcChvYmplY3QpIDogb2JqZWN0O1xuICAgIH1cbiAgICBmdW5jdGlvbiByZXdyYXAobm9kZSwgd3JhcHBlcikge1xuICAgICAgaWYgKHdyYXBwZXIgPT09IG51bGwpIHJldHVybjtcbiAgICAgIGFzc2VydChpc05hdGl2ZShub2RlKSk7XG4gICAgICBhc3NlcnQod3JhcHBlciA9PT0gdW5kZWZpbmVkIHx8IGlzV3JhcHBlcih3cmFwcGVyKSk7XG4gICAgICBub2RlLl9fd3JhcHBlcjhlM2RkOTNhNjBfXyA9IHdyYXBwZXI7XG4gICAgfVxuICAgIHZhciBnZXR0ZXJEZXNjcmlwdG9yID0ge1xuICAgICAgZ2V0OiB1bmRlZmluZWQsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfTtcbiAgICBmdW5jdGlvbiBkZWZpbmVHZXR0ZXIoY29uc3RydWN0b3IsIG5hbWUsIGdldHRlcikge1xuICAgICAgZ2V0dGVyRGVzY3JpcHRvci5nZXQgPSBnZXR0ZXI7XG4gICAgICBkZWZpbmVQcm9wZXJ0eShjb25zdHJ1Y3Rvci5wcm90b3R5cGUsIG5hbWUsIGdldHRlckRlc2NyaXB0b3IpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkZWZpbmVXcmFwR2V0dGVyKGNvbnN0cnVjdG9yLCBuYW1lKSB7XG4gICAgICBkZWZpbmVHZXR0ZXIoY29uc3RydWN0b3IsIG5hbWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLl9faW1wbDRjZjFlNzgyaGdfX1tuYW1lXSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXIoY29uc3RydWN0b3JzLCBuYW1lcykge1xuICAgICAgY29uc3RydWN0b3JzLmZvckVhY2goZnVuY3Rpb24oY29uc3RydWN0b3IpIHtcbiAgICAgICAgbmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgY29uc3RydWN0b3IucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdyA9IHdyYXBJZk5lZWRlZCh0aGlzKTtcbiAgICAgICAgICAgIHJldHVybiB3W25hbWVdLmFwcGx5KHcsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgc2NvcGUuYWRkRm9yd2FyZGluZ1Byb3BlcnRpZXMgPSBhZGRGb3J3YXJkaW5nUHJvcGVydGllcztcbiAgICBzY29wZS5hc3NlcnQgPSBhc3NlcnQ7XG4gICAgc2NvcGUuY29uc3RydWN0b3JUYWJsZSA9IGNvbnN0cnVjdG9yVGFibGU7XG4gICAgc2NvcGUuZGVmaW5lR2V0dGVyID0gZGVmaW5lR2V0dGVyO1xuICAgIHNjb3BlLmRlZmluZVdyYXBHZXR0ZXIgPSBkZWZpbmVXcmFwR2V0dGVyO1xuICAgIHNjb3BlLmZvcndhcmRNZXRob2RzVG9XcmFwcGVyID0gZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXI7XG4gICAgc2NvcGUuaXNJZGVudGlmaWVyTmFtZSA9IGlzSWRlbnRpZmllck5hbWU7XG4gICAgc2NvcGUuaXNXcmFwcGVyID0gaXNXcmFwcGVyO1xuICAgIHNjb3BlLmlzV3JhcHBlckZvciA9IGlzV3JhcHBlckZvcjtcbiAgICBzY29wZS5taXhpbiA9IG1peGluO1xuICAgIHNjb3BlLm5hdGl2ZVByb3RvdHlwZVRhYmxlID0gbmF0aXZlUHJvdG90eXBlVGFibGU7XG4gICAgc2NvcGUub25lT2YgPSBvbmVPZjtcbiAgICBzY29wZS5yZWdpc3Rlck9iamVjdCA9IHJlZ2lzdGVyT2JqZWN0O1xuICAgIHNjb3BlLnJlZ2lzdGVyV3JhcHBlciA9IHJlZ2lzdGVyO1xuICAgIHNjb3BlLnJld3JhcCA9IHJld3JhcDtcbiAgICBzY29wZS5zZXRXcmFwcGVyID0gc2V0V3JhcHBlcjtcbiAgICBzY29wZS51bnNhZmVVbndyYXAgPSB1bnNhZmVVbndyYXA7XG4gICAgc2NvcGUudW53cmFwID0gdW53cmFwO1xuICAgIHNjb3BlLnVud3JhcElmTmVlZGVkID0gdW53cmFwSWZOZWVkZWQ7XG4gICAgc2NvcGUud3JhcCA9IHdyYXA7XG4gICAgc2NvcGUud3JhcElmTmVlZGVkID0gd3JhcElmTmVlZGVkO1xuICAgIHNjb3BlLndyYXBwZXJzID0gd3JhcHBlcnM7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uIG5ld1NwbGljZShpbmRleCwgcmVtb3ZlZCwgYWRkZWRDb3VudCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICByZW1vdmVkOiByZW1vdmVkLFxuICAgICAgICBhZGRlZENvdW50OiBhZGRlZENvdW50XG4gICAgICB9O1xuICAgIH1cbiAgICB2YXIgRURJVF9MRUFWRSA9IDA7XG4gICAgdmFyIEVESVRfVVBEQVRFID0gMTtcbiAgICB2YXIgRURJVF9BREQgPSAyO1xuICAgIHZhciBFRElUX0RFTEVURSA9IDM7XG4gICAgZnVuY3Rpb24gQXJyYXlTcGxpY2UoKSB7fVxuICAgIEFycmF5U3BsaWNlLnByb3RvdHlwZSA9IHtcbiAgICAgIGNhbGNFZGl0RGlzdGFuY2VzOiBmdW5jdGlvbihjdXJyZW50LCBjdXJyZW50U3RhcnQsIGN1cnJlbnRFbmQsIG9sZCwgb2xkU3RhcnQsIG9sZEVuZCkge1xuICAgICAgICB2YXIgcm93Q291bnQgPSBvbGRFbmQgLSBvbGRTdGFydCArIDE7XG4gICAgICAgIHZhciBjb2x1bW5Db3VudCA9IGN1cnJlbnRFbmQgLSBjdXJyZW50U3RhcnQgKyAxO1xuICAgICAgICB2YXIgZGlzdGFuY2VzID0gbmV3IEFycmF5KHJvd0NvdW50KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByb3dDb3VudDsgaSsrKSB7XG4gICAgICAgICAgZGlzdGFuY2VzW2ldID0gbmV3IEFycmF5KGNvbHVtbkNvdW50KTtcbiAgICAgICAgICBkaXN0YW5jZXNbaV1bMF0gPSBpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY29sdW1uQ291bnQ7IGorKykgZGlzdGFuY2VzWzBdW2pdID0gajtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCByb3dDb3VudDsgaSsrKSB7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDE7IGogPCBjb2x1bW5Db3VudDsgaisrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lcXVhbHMoY3VycmVudFtjdXJyZW50U3RhcnQgKyBqIC0gMV0sIG9sZFtvbGRTdGFydCArIGkgLSAxXSkpIGRpc3RhbmNlc1tpXVtqXSA9IGRpc3RhbmNlc1tpIC0gMV1baiAtIDFdOyBlbHNlIHtcbiAgICAgICAgICAgICAgdmFyIG5vcnRoID0gZGlzdGFuY2VzW2kgLSAxXVtqXSArIDE7XG4gICAgICAgICAgICAgIHZhciB3ZXN0ID0gZGlzdGFuY2VzW2ldW2ogLSAxXSArIDE7XG4gICAgICAgICAgICAgIGRpc3RhbmNlc1tpXVtqXSA9IG5vcnRoIDwgd2VzdCA/IG5vcnRoIDogd2VzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRpc3RhbmNlcztcbiAgICAgIH0sXG4gICAgICBzcGxpY2VPcGVyYXRpb25zRnJvbUVkaXREaXN0YW5jZXM6IGZ1bmN0aW9uKGRpc3RhbmNlcykge1xuICAgICAgICB2YXIgaSA9IGRpc3RhbmNlcy5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgaiA9IGRpc3RhbmNlc1swXS5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgY3VycmVudCA9IGRpc3RhbmNlc1tpXVtqXTtcbiAgICAgICAgdmFyIGVkaXRzID0gW107XG4gICAgICAgIHdoaWxlIChpID4gMCB8fCBqID4gMCkge1xuICAgICAgICAgIGlmIChpID09IDApIHtcbiAgICAgICAgICAgIGVkaXRzLnB1c2goRURJVF9BREQpO1xuICAgICAgICAgICAgai0tO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChqID09IDApIHtcbiAgICAgICAgICAgIGVkaXRzLnB1c2goRURJVF9ERUxFVEUpO1xuICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBub3J0aFdlc3QgPSBkaXN0YW5jZXNbaSAtIDFdW2ogLSAxXTtcbiAgICAgICAgICB2YXIgd2VzdCA9IGRpc3RhbmNlc1tpIC0gMV1bal07XG4gICAgICAgICAgdmFyIG5vcnRoID0gZGlzdGFuY2VzW2ldW2ogLSAxXTtcbiAgICAgICAgICB2YXIgbWluO1xuICAgICAgICAgIGlmICh3ZXN0IDwgbm9ydGgpIG1pbiA9IHdlc3QgPCBub3J0aFdlc3QgPyB3ZXN0IDogbm9ydGhXZXN0OyBlbHNlIG1pbiA9IG5vcnRoIDwgbm9ydGhXZXN0ID8gbm9ydGggOiBub3J0aFdlc3Q7XG4gICAgICAgICAgaWYgKG1pbiA9PSBub3J0aFdlc3QpIHtcbiAgICAgICAgICAgIGlmIChub3J0aFdlc3QgPT0gY3VycmVudCkge1xuICAgICAgICAgICAgICBlZGl0cy5wdXNoKEVESVRfTEVBVkUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZWRpdHMucHVzaChFRElUX1VQREFURSk7XG4gICAgICAgICAgICAgIGN1cnJlbnQgPSBub3J0aFdlc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpLS07XG4gICAgICAgICAgICBqLS07XG4gICAgICAgICAgfSBlbHNlIGlmIChtaW4gPT0gd2VzdCkge1xuICAgICAgICAgICAgZWRpdHMucHVzaChFRElUX0RFTEVURSk7XG4gICAgICAgICAgICBpLS07XG4gICAgICAgICAgICBjdXJyZW50ID0gd2VzdDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWRpdHMucHVzaChFRElUX0FERCk7XG4gICAgICAgICAgICBqLS07XG4gICAgICAgICAgICBjdXJyZW50ID0gbm9ydGg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVkaXRzLnJldmVyc2UoKTtcbiAgICAgICAgcmV0dXJuIGVkaXRzO1xuICAgICAgfSxcbiAgICAgIGNhbGNTcGxpY2VzOiBmdW5jdGlvbihjdXJyZW50LCBjdXJyZW50U3RhcnQsIGN1cnJlbnRFbmQsIG9sZCwgb2xkU3RhcnQsIG9sZEVuZCkge1xuICAgICAgICB2YXIgcHJlZml4Q291bnQgPSAwO1xuICAgICAgICB2YXIgc3VmZml4Q291bnQgPSAwO1xuICAgICAgICB2YXIgbWluTGVuZ3RoID0gTWF0aC5taW4oY3VycmVudEVuZCAtIGN1cnJlbnRTdGFydCwgb2xkRW5kIC0gb2xkU3RhcnQpO1xuICAgICAgICBpZiAoY3VycmVudFN0YXJ0ID09IDAgJiYgb2xkU3RhcnQgPT0gMCkgcHJlZml4Q291bnQgPSB0aGlzLnNoYXJlZFByZWZpeChjdXJyZW50LCBvbGQsIG1pbkxlbmd0aCk7XG4gICAgICAgIGlmIChjdXJyZW50RW5kID09IGN1cnJlbnQubGVuZ3RoICYmIG9sZEVuZCA9PSBvbGQubGVuZ3RoKSBzdWZmaXhDb3VudCA9IHRoaXMuc2hhcmVkU3VmZml4KGN1cnJlbnQsIG9sZCwgbWluTGVuZ3RoIC0gcHJlZml4Q291bnQpO1xuICAgICAgICBjdXJyZW50U3RhcnQgKz0gcHJlZml4Q291bnQ7XG4gICAgICAgIG9sZFN0YXJ0ICs9IHByZWZpeENvdW50O1xuICAgICAgICBjdXJyZW50RW5kIC09IHN1ZmZpeENvdW50O1xuICAgICAgICBvbGRFbmQgLT0gc3VmZml4Q291bnQ7XG4gICAgICAgIGlmIChjdXJyZW50RW5kIC0gY3VycmVudFN0YXJ0ID09IDAgJiYgb2xkRW5kIC0gb2xkU3RhcnQgPT0gMCkgcmV0dXJuIFtdO1xuICAgICAgICBpZiAoY3VycmVudFN0YXJ0ID09IGN1cnJlbnRFbmQpIHtcbiAgICAgICAgICB2YXIgc3BsaWNlID0gbmV3U3BsaWNlKGN1cnJlbnRTdGFydCwgW10sIDApO1xuICAgICAgICAgIHdoaWxlIChvbGRTdGFydCA8IG9sZEVuZCkgc3BsaWNlLnJlbW92ZWQucHVzaChvbGRbb2xkU3RhcnQrK10pO1xuICAgICAgICAgIHJldHVybiBbIHNwbGljZSBdO1xuICAgICAgICB9IGVsc2UgaWYgKG9sZFN0YXJ0ID09IG9sZEVuZCkgcmV0dXJuIFsgbmV3U3BsaWNlKGN1cnJlbnRTdGFydCwgW10sIGN1cnJlbnRFbmQgLSBjdXJyZW50U3RhcnQpIF07XG4gICAgICAgIHZhciBvcHMgPSB0aGlzLnNwbGljZU9wZXJhdGlvbnNGcm9tRWRpdERpc3RhbmNlcyh0aGlzLmNhbGNFZGl0RGlzdGFuY2VzKGN1cnJlbnQsIGN1cnJlbnRTdGFydCwgY3VycmVudEVuZCwgb2xkLCBvbGRTdGFydCwgb2xkRW5kKSk7XG4gICAgICAgIHZhciBzcGxpY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIHZhciBzcGxpY2VzID0gW107XG4gICAgICAgIHZhciBpbmRleCA9IGN1cnJlbnRTdGFydDtcbiAgICAgICAgdmFyIG9sZEluZGV4ID0gb2xkU3RhcnQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgc3dpdGNoIChvcHNbaV0pIHtcbiAgICAgICAgICAgY2FzZSBFRElUX0xFQVZFOlxuICAgICAgICAgICAgaWYgKHNwbGljZSkge1xuICAgICAgICAgICAgICBzcGxpY2VzLnB1c2goc3BsaWNlKTtcbiAgICAgICAgICAgICAgc3BsaWNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgIG9sZEluZGV4Kys7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICBjYXNlIEVESVRfVVBEQVRFOlxuICAgICAgICAgICAgaWYgKCFzcGxpY2UpIHNwbGljZSA9IG5ld1NwbGljZShpbmRleCwgW10sIDApO1xuICAgICAgICAgICAgc3BsaWNlLmFkZGVkQ291bnQrKztcbiAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICBzcGxpY2UucmVtb3ZlZC5wdXNoKG9sZFtvbGRJbmRleF0pO1xuICAgICAgICAgICAgb2xkSW5kZXgrKztcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgIGNhc2UgRURJVF9BREQ6XG4gICAgICAgICAgICBpZiAoIXNwbGljZSkgc3BsaWNlID0gbmV3U3BsaWNlKGluZGV4LCBbXSwgMCk7XG4gICAgICAgICAgICBzcGxpY2UuYWRkZWRDb3VudCsrO1xuICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgIGNhc2UgRURJVF9ERUxFVEU6XG4gICAgICAgICAgICBpZiAoIXNwbGljZSkgc3BsaWNlID0gbmV3U3BsaWNlKGluZGV4LCBbXSwgMCk7XG4gICAgICAgICAgICBzcGxpY2UucmVtb3ZlZC5wdXNoKG9sZFtvbGRJbmRleF0pO1xuICAgICAgICAgICAgb2xkSW5kZXgrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc3BsaWNlKSB7XG4gICAgICAgICAgc3BsaWNlcy5wdXNoKHNwbGljZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNwbGljZXM7XG4gICAgICB9LFxuICAgICAgc2hhcmVkUHJlZml4OiBmdW5jdGlvbihjdXJyZW50LCBvbGQsIHNlYXJjaExlbmd0aCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlYXJjaExlbmd0aDsgaSsrKSBpZiAoIXRoaXMuZXF1YWxzKGN1cnJlbnRbaV0sIG9sZFtpXSkpIHJldHVybiBpO1xuICAgICAgICByZXR1cm4gc2VhcmNoTGVuZ3RoO1xuICAgICAgfSxcbiAgICAgIHNoYXJlZFN1ZmZpeDogZnVuY3Rpb24oY3VycmVudCwgb2xkLCBzZWFyY2hMZW5ndGgpIHtcbiAgICAgICAgdmFyIGluZGV4MSA9IGN1cnJlbnQubGVuZ3RoO1xuICAgICAgICB2YXIgaW5kZXgyID0gb2xkLmxlbmd0aDtcbiAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgd2hpbGUgKGNvdW50IDwgc2VhcmNoTGVuZ3RoICYmIHRoaXMuZXF1YWxzKGN1cnJlbnRbLS1pbmRleDFdLCBvbGRbLS1pbmRleDJdKSkgY291bnQrKztcbiAgICAgICAgcmV0dXJuIGNvdW50O1xuICAgICAgfSxcbiAgICAgIGNhbGN1bGF0ZVNwbGljZXM6IGZ1bmN0aW9uKGN1cnJlbnQsIHByZXZpb3VzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbGNTcGxpY2VzKGN1cnJlbnQsIDAsIGN1cnJlbnQubGVuZ3RoLCBwcmV2aW91cywgMCwgcHJldmlvdXMubGVuZ3RoKTtcbiAgICAgIH0sXG4gICAgICBlcXVhbHM6IGZ1bmN0aW9uKGN1cnJlbnRWYWx1ZSwgcHJldmlvdXNWYWx1ZSkge1xuICAgICAgICByZXR1cm4gY3VycmVudFZhbHVlID09PSBwcmV2aW91c1ZhbHVlO1xuICAgICAgfVxuICAgIH07XG4gICAgc2NvcGUuQXJyYXlTcGxpY2UgPSBBcnJheVNwbGljZTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgT3JpZ2luYWxNdXRhdGlvbk9ic2VydmVyID0gd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGNhbGxiYWNrcyA9IFtdO1xuICAgIHZhciBwZW5kaW5nID0gZmFsc2U7XG4gICAgdmFyIHRpbWVyRnVuYztcbiAgICBmdW5jdGlvbiBoYW5kbGUoKSB7XG4gICAgICBwZW5kaW5nID0gZmFsc2U7XG4gICAgICB2YXIgY29waWVzID0gY2FsbGJhY2tzLnNsaWNlKDApO1xuICAgICAgY2FsbGJhY2tzID0gW107XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvcGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAoMCwgY29waWVzW2ldKSgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoT3JpZ2luYWxNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICB2YXIgY291bnRlciA9IDE7XG4gICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgT3JpZ2luYWxNdXRhdGlvbk9ic2VydmVyKGhhbmRsZSk7XG4gICAgICB2YXIgdGV4dE5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjb3VudGVyKTtcbiAgICAgIG9ic2VydmVyLm9ic2VydmUodGV4dE5vZGUsIHtcbiAgICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZVxuICAgICAgfSk7XG4gICAgICB0aW1lckZ1bmMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY291bnRlciA9IChjb3VudGVyICsgMSkgJSAyO1xuICAgICAgICB0ZXh0Tm9kZS5kYXRhID0gY291bnRlcjtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRpbWVyRnVuYyA9IHdpbmRvdy5zZXRUaW1lb3V0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBzZXRFbmRPZk1pY3JvdGFzayhmdW5jKSB7XG4gICAgICBjYWxsYmFja3MucHVzaChmdW5jKTtcbiAgICAgIGlmIChwZW5kaW5nKSByZXR1cm47XG4gICAgICBwZW5kaW5nID0gdHJ1ZTtcbiAgICAgIHRpbWVyRnVuYyhoYW5kbGUsIDApO1xuICAgIH1cbiAgICBjb250ZXh0LnNldEVuZE9mTWljcm90YXNrID0gc2V0RW5kT2ZNaWNyb3Rhc2s7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBzZXRFbmRPZk1pY3JvdGFzayA9IHNjb3BlLnNldEVuZE9mTWljcm90YXNrO1xuICAgIHZhciB3cmFwSWZOZWVkZWQgPSBzY29wZS53cmFwSWZOZWVkZWQ7XG4gICAgdmFyIHdyYXBwZXJzID0gc2NvcGUud3JhcHBlcnM7XG4gICAgdmFyIHJlZ2lzdHJhdGlvbnNUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIGdsb2JhbE11dGF0aW9uT2JzZXJ2ZXJzID0gW107XG4gICAgdmFyIGlzU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gc2NoZWR1bGVDYWxsYmFjayhvYnNlcnZlcikge1xuICAgICAgaWYgKG9ic2VydmVyLnNjaGVkdWxlZF8pIHJldHVybjtcbiAgICAgIG9ic2VydmVyLnNjaGVkdWxlZF8gPSB0cnVlO1xuICAgICAgZ2xvYmFsTXV0YXRpb25PYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XG4gICAgICBpZiAoaXNTY2hlZHVsZWQpIHJldHVybjtcbiAgICAgIHNldEVuZE9mTWljcm90YXNrKG5vdGlmeU9ic2VydmVycyk7XG4gICAgICBpc1NjaGVkdWxlZCA9IHRydWU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5vdGlmeU9ic2VydmVycygpIHtcbiAgICAgIGlzU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgICB3aGlsZSAoZ2xvYmFsTXV0YXRpb25PYnNlcnZlcnMubGVuZ3RoKSB7XG4gICAgICAgIHZhciBub3RpZnlMaXN0ID0gZ2xvYmFsTXV0YXRpb25PYnNlcnZlcnM7XG4gICAgICAgIGdsb2JhbE11dGF0aW9uT2JzZXJ2ZXJzID0gW107XG4gICAgICAgIG5vdGlmeUxpc3Quc29ydChmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgICAgcmV0dXJuIHgudWlkXyAtIHkudWlkXztcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm90aWZ5TGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBtbyA9IG5vdGlmeUxpc3RbaV07XG4gICAgICAgICAgbW8uc2NoZWR1bGVkXyA9IGZhbHNlO1xuICAgICAgICAgIHZhciBxdWV1ZSA9IG1vLnRha2VSZWNvcmRzKCk7XG4gICAgICAgICAgcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzRm9yKG1vKTtcbiAgICAgICAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICBtby5jYWxsYmFja18ocXVldWUsIG1vKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gTXV0YXRpb25SZWNvcmQodHlwZSwgdGFyZ2V0KSB7XG4gICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICB0aGlzLmFkZGVkTm9kZXMgPSBuZXcgd3JhcHBlcnMuTm9kZUxpc3QoKTtcbiAgICAgIHRoaXMucmVtb3ZlZE5vZGVzID0gbmV3IHdyYXBwZXJzLk5vZGVMaXN0KCk7XG4gICAgICB0aGlzLnByZXZpb3VzU2libGluZyA9IG51bGw7XG4gICAgICB0aGlzLm5leHRTaWJsaW5nID0gbnVsbDtcbiAgICAgIHRoaXMuYXR0cmlidXRlTmFtZSA9IG51bGw7XG4gICAgICB0aGlzLmF0dHJpYnV0ZU5hbWVzcGFjZSA9IG51bGw7XG4gICAgICB0aGlzLm9sZFZhbHVlID0gbnVsbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJUcmFuc2llbnRPYnNlcnZlcnMoYW5jZXN0b3IsIG5vZGUpIHtcbiAgICAgIGZvciAoO2FuY2VzdG9yOyBhbmNlc3RvciA9IGFuY2VzdG9yLnBhcmVudE5vZGUpIHtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KGFuY2VzdG9yKTtcbiAgICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSBjb250aW51ZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbaV07XG4gICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbi5vcHRpb25zLnN1YnRyZWUpIHJlZ2lzdHJhdGlvbi5hZGRUcmFuc2llbnRPYnNlcnZlcihub2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmVUcmFuc2llbnRPYnNlcnZlcnNGb3Iob2JzZXJ2ZXIpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JzZXJ2ZXIubm9kZXNfLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBub2RlID0gb2JzZXJ2ZXIubm9kZXNfW2ldO1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICAgIGlmICghcmVnaXN0cmF0aW9ucykgcmV0dXJuO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tqXTtcbiAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9ic2VydmVyID09PSBvYnNlcnZlcikgcmVnaXN0cmF0aW9uLnJlbW92ZVRyYW5zaWVudE9ic2VydmVycygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVucXVldWVNdXRhdGlvbih0YXJnZXQsIHR5cGUsIGRhdGEpIHtcbiAgICAgIHZhciBpbnRlcmVzdGVkT2JzZXJ2ZXJzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgIHZhciBhc3NvY2lhdGVkU3RyaW5ncyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICBmb3IgKHZhciBub2RlID0gdGFyZ2V0OyBub2RlOyBub2RlID0gbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSBjb250aW51ZTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbal07XG4gICAgICAgICAgdmFyIG9wdGlvbnMgPSByZWdpc3RyYXRpb24ub3B0aW9ucztcbiAgICAgICAgICBpZiAobm9kZSAhPT0gdGFyZ2V0ICYmICFvcHRpb25zLnN1YnRyZWUpIGNvbnRpbnVlO1xuICAgICAgICAgIGlmICh0eXBlID09PSBcImF0dHJpYnV0ZXNcIiAmJiAhb3B0aW9ucy5hdHRyaWJ1dGVzKSBjb250aW51ZTtcbiAgICAgICAgICBpZiAodHlwZSA9PT0gXCJhdHRyaWJ1dGVzXCIgJiYgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIgJiYgKGRhdGEubmFtZXNwYWNlICE9PSBudWxsIHx8IG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyLmluZGV4T2YoZGF0YS5uYW1lKSA9PT0gLTEpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGUgPT09IFwiY2hhcmFjdGVyRGF0YVwiICYmICFvcHRpb25zLmNoYXJhY3RlckRhdGEpIGNvbnRpbnVlO1xuICAgICAgICAgIGlmICh0eXBlID09PSBcImNoaWxkTGlzdFwiICYmICFvcHRpb25zLmNoaWxkTGlzdCkgY29udGludWU7XG4gICAgICAgICAgdmFyIG9ic2VydmVyID0gcmVnaXN0cmF0aW9uLm9ic2VydmVyO1xuICAgICAgICAgIGludGVyZXN0ZWRPYnNlcnZlcnNbb2JzZXJ2ZXIudWlkX10gPSBvYnNlcnZlcjtcbiAgICAgICAgICBpZiAodHlwZSA9PT0gXCJhdHRyaWJ1dGVzXCIgJiYgb3B0aW9ucy5hdHRyaWJ1dGVPbGRWYWx1ZSB8fCB0eXBlID09PSBcImNoYXJhY3RlckRhdGFcIiAmJiBvcHRpb25zLmNoYXJhY3RlckRhdGFPbGRWYWx1ZSkge1xuICAgICAgICAgICAgYXNzb2NpYXRlZFN0cmluZ3Nbb2JzZXJ2ZXIudWlkX10gPSBkYXRhLm9sZFZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZm9yICh2YXIgdWlkIGluIGludGVyZXN0ZWRPYnNlcnZlcnMpIHtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gaW50ZXJlc3RlZE9ic2VydmVyc1t1aWRdO1xuICAgICAgICB2YXIgcmVjb3JkID0gbmV3IE11dGF0aW9uUmVjb3JkKHR5cGUsIHRhcmdldCk7XG4gICAgICAgIGlmIChcIm5hbWVcIiBpbiBkYXRhICYmIFwibmFtZXNwYWNlXCIgaW4gZGF0YSkge1xuICAgICAgICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lID0gZGF0YS5uYW1lO1xuICAgICAgICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lc3BhY2UgPSBkYXRhLm5hbWVzcGFjZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YS5hZGRlZE5vZGVzKSByZWNvcmQuYWRkZWROb2RlcyA9IGRhdGEuYWRkZWROb2RlcztcbiAgICAgICAgaWYgKGRhdGEucmVtb3ZlZE5vZGVzKSByZWNvcmQucmVtb3ZlZE5vZGVzID0gZGF0YS5yZW1vdmVkTm9kZXM7XG4gICAgICAgIGlmIChkYXRhLnByZXZpb3VzU2libGluZykgcmVjb3JkLnByZXZpb3VzU2libGluZyA9IGRhdGEucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICBpZiAoZGF0YS5uZXh0U2libGluZykgcmVjb3JkLm5leHRTaWJsaW5nID0gZGF0YS5uZXh0U2libGluZztcbiAgICAgICAgaWYgKGFzc29jaWF0ZWRTdHJpbmdzW3VpZF0gIT09IHVuZGVmaW5lZCkgcmVjb3JkLm9sZFZhbHVlID0gYXNzb2NpYXRlZFN0cmluZ3NbdWlkXTtcbiAgICAgICAgc2NoZWR1bGVDYWxsYmFjayhvYnNlcnZlcik7XG4gICAgICAgIG9ic2VydmVyLnJlY29yZHNfLnB1c2gocmVjb3JkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuICAgIGZ1bmN0aW9uIE11dGF0aW9uT2JzZXJ2ZXJPcHRpb25zKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuY2hpbGRMaXN0ID0gISFvcHRpb25zLmNoaWxkTGlzdDtcbiAgICAgIHRoaXMuc3VidHJlZSA9ICEhb3B0aW9ucy5zdWJ0cmVlO1xuICAgICAgaWYgKCEoXCJhdHRyaWJ1dGVzXCIgaW4gb3B0aW9ucykgJiYgKFwiYXR0cmlidXRlT2xkVmFsdWVcIiBpbiBvcHRpb25zIHx8IFwiYXR0cmlidXRlRmlsdGVyXCIgaW4gb3B0aW9ucykpIHtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9ICEhb3B0aW9ucy5hdHRyaWJ1dGVzO1xuICAgICAgfVxuICAgICAgaWYgKFwiY2hhcmFjdGVyRGF0YU9sZFZhbHVlXCIgaW4gb3B0aW9ucyAmJiAhKFwiY2hhcmFjdGVyRGF0YVwiIGluIG9wdGlvbnMpKSB0aGlzLmNoYXJhY3RlckRhdGEgPSB0cnVlOyBlbHNlIHRoaXMuY2hhcmFjdGVyRGF0YSA9ICEhb3B0aW9ucy5jaGFyYWN0ZXJEYXRhO1xuICAgICAgaWYgKCF0aGlzLmF0dHJpYnV0ZXMgJiYgKG9wdGlvbnMuYXR0cmlidXRlT2xkVmFsdWUgfHwgXCJhdHRyaWJ1dGVGaWx0ZXJcIiBpbiBvcHRpb25zKSB8fCAhdGhpcy5jaGFyYWN0ZXJEYXRhICYmIG9wdGlvbnMuY2hhcmFjdGVyRGF0YU9sZFZhbHVlKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY2hhcmFjdGVyRGF0YSA9ICEhb3B0aW9ucy5jaGFyYWN0ZXJEYXRhO1xuICAgICAgdGhpcy5hdHRyaWJ1dGVPbGRWYWx1ZSA9ICEhb3B0aW9ucy5hdHRyaWJ1dGVPbGRWYWx1ZTtcbiAgICAgIHRoaXMuY2hhcmFjdGVyRGF0YU9sZFZhbHVlID0gISFvcHRpb25zLmNoYXJhY3RlckRhdGFPbGRWYWx1ZTtcbiAgICAgIGlmIChcImF0dHJpYnV0ZUZpbHRlclwiIGluIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyID09IG51bGwgfHwgdHlwZW9mIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXR0cmlidXRlRmlsdGVyID0gc2xpY2UuY2FsbChvcHRpb25zLmF0dHJpYnV0ZUZpbHRlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZUZpbHRlciA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciB1aWRDb3VudGVyID0gMDtcbiAgICBmdW5jdGlvbiBNdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKSB7XG4gICAgICB0aGlzLmNhbGxiYWNrXyA9IGNhbGxiYWNrO1xuICAgICAgdGhpcy5ub2Rlc18gPSBbXTtcbiAgICAgIHRoaXMucmVjb3Jkc18gPSBbXTtcbiAgICAgIHRoaXMudWlkXyA9ICsrdWlkQ291bnRlcjtcbiAgICAgIHRoaXMuc2NoZWR1bGVkXyA9IGZhbHNlO1xuICAgIH1cbiAgICBNdXRhdGlvbk9ic2VydmVyLnByb3RvdHlwZSA9IHtcbiAgICAgIGNvbnN0cnVjdG9yOiBNdXRhdGlvbk9ic2VydmVyLFxuICAgICAgb2JzZXJ2ZTogZnVuY3Rpb24odGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgICAgIHRhcmdldCA9IHdyYXBJZk5lZWRlZCh0YXJnZXQpO1xuICAgICAgICB2YXIgbmV3T3B0aW9ucyA9IG5ldyBNdXRhdGlvbk9ic2VydmVyT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbjtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KHRhcmdldCk7XG4gICAgICAgIGlmICghcmVnaXN0cmF0aW9ucykgcmVnaXN0cmF0aW9uc1RhYmxlLnNldCh0YXJnZXQsIHJlZ2lzdHJhdGlvbnMgPSBbXSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChyZWdpc3RyYXRpb25zW2ldLm9ic2VydmVyID09PSB0aGlzKSB7XG4gICAgICAgICAgICByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2ldO1xuICAgICAgICAgICAgcmVnaXN0cmF0aW9uLnJlbW92ZVRyYW5zaWVudE9ic2VydmVycygpO1xuICAgICAgICAgICAgcmVnaXN0cmF0aW9uLm9wdGlvbnMgPSBuZXdPcHRpb25zO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXJlZ2lzdHJhdGlvbikge1xuICAgICAgICAgIHJlZ2lzdHJhdGlvbiA9IG5ldyBSZWdpc3RyYXRpb24odGhpcywgdGFyZ2V0LCBuZXdPcHRpb25zKTtcbiAgICAgICAgICByZWdpc3RyYXRpb25zLnB1c2gocmVnaXN0cmF0aW9uKTtcbiAgICAgICAgICB0aGlzLm5vZGVzXy5wdXNoKHRhcmdldCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBkaXNjb25uZWN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5ub2Rlc18uZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbaV07XG4gICAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9ic2VydmVyID09PSB0aGlzKSB7XG4gICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgICB9LFxuICAgICAgdGFrZVJlY29yZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29weU9mUmVjb3JkcyA9IHRoaXMucmVjb3Jkc187XG4gICAgICAgIHRoaXMucmVjb3Jkc18gPSBbXTtcbiAgICAgICAgcmV0dXJuIGNvcHlPZlJlY29yZHM7XG4gICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBSZWdpc3RyYXRpb24ob2JzZXJ2ZXIsIHRhcmdldCwgb3B0aW9ucykge1xuICAgICAgdGhpcy5vYnNlcnZlciA9IG9ic2VydmVyO1xuICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzID0gW107XG4gICAgfVxuICAgIFJlZ2lzdHJhdGlvbi5wcm90b3R5cGUgPSB7XG4gICAgICBhZGRUcmFuc2llbnRPYnNlcnZlcjogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBpZiAobm9kZSA9PT0gdGhpcy50YXJnZXQpIHJldHVybjtcbiAgICAgICAgc2NoZWR1bGVDYWxsYmFjayh0aGlzLm9ic2VydmVyKTtcbiAgICAgICAgdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSByZWdpc3RyYXRpb25zVGFibGUuc2V0KG5vZGUsIHJlZ2lzdHJhdGlvbnMgPSBbXSk7XG4gICAgICAgIHJlZ2lzdHJhdGlvbnMucHVzaCh0aGlzKTtcbiAgICAgIH0sXG4gICAgICByZW1vdmVUcmFuc2llbnRPYnNlcnZlcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcztcbiAgICAgICAgdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJhbnNpZW50T2JzZXJ2ZWROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBub2RlID0gdHJhbnNpZW50T2JzZXJ2ZWROb2Rlc1tpXTtcbiAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uc1tqXSA9PT0gdGhpcykge1xuICAgICAgICAgICAgICByZWdpc3RyYXRpb25zLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBzY29wZS5lbnF1ZXVlTXV0YXRpb24gPSBlbnF1ZXVlTXV0YXRpb247XG4gICAgc2NvcGUucmVnaXN0ZXJUcmFuc2llbnRPYnNlcnZlcnMgPSByZWdpc3RlclRyYW5zaWVudE9ic2VydmVycztcbiAgICBzY29wZS53cmFwcGVycy5NdXRhdGlvbk9ic2VydmVyID0gTXV0YXRpb25PYnNlcnZlcjtcbiAgICBzY29wZS53cmFwcGVycy5NdXRhdGlvblJlY29yZCA9IE11dGF0aW9uUmVjb3JkO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBUcmVlU2NvcGUocm9vdCwgcGFyZW50KSB7XG4gICAgICB0aGlzLnJvb3QgPSByb290O1xuICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgfVxuICAgIFRyZWVTY29wZS5wcm90b3R5cGUgPSB7XG4gICAgICBnZXQgcmVuZGVyZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLnJvb3QgaW5zdGFuY2VvZiBzY29wZS53cmFwcGVycy5TaGFkb3dSb290KSB7XG4gICAgICAgICAgcmV0dXJuIHNjb3BlLmdldFJlbmRlcmVyRm9ySG9zdCh0aGlzLnJvb3QuaG9zdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9LFxuICAgICAgY29udGFpbnM6IGZ1bmN0aW9uKHRyZWVTY29wZSkge1xuICAgICAgICBmb3IgKDt0cmVlU2NvcGU7IHRyZWVTY29wZSA9IHRyZWVTY29wZS5wYXJlbnQpIHtcbiAgICAgICAgICBpZiAodHJlZVNjb3BlID09PSB0aGlzKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBzZXRUcmVlU2NvcGUobm9kZSwgdHJlZVNjb3BlKSB7XG4gICAgICBpZiAobm9kZS50cmVlU2NvcGVfICE9PSB0cmVlU2NvcGUpIHtcbiAgICAgICAgbm9kZS50cmVlU2NvcGVfID0gdHJlZVNjb3BlO1xuICAgICAgICBmb3IgKHZhciBzciA9IG5vZGUuc2hhZG93Um9vdDsgc3I7IHNyID0gc3Iub2xkZXJTaGFkb3dSb290KSB7XG4gICAgICAgICAgc3IudHJlZVNjb3BlXy5wYXJlbnQgPSB0cmVlU2NvcGU7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgc2V0VHJlZVNjb3BlKGNoaWxkLCB0cmVlU2NvcGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFRyZWVTY29wZShub2RlKSB7XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIHNjb3BlLndyYXBwZXJzLldpbmRvdykge1xuICAgICAgICBkZWJ1Z2dlcjtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlLnRyZWVTY29wZV8pIHJldHVybiBub2RlLnRyZWVTY29wZV87XG4gICAgICB2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgdmFyIHRyZWVTY29wZTtcbiAgICAgIGlmIChwYXJlbnQpIHRyZWVTY29wZSA9IGdldFRyZWVTY29wZShwYXJlbnQpOyBlbHNlIHRyZWVTY29wZSA9IG5ldyBUcmVlU2NvcGUobm9kZSwgbnVsbCk7XG4gICAgICByZXR1cm4gbm9kZS50cmVlU2NvcGVfID0gdHJlZVNjb3BlO1xuICAgIH1cbiAgICBzY29wZS5UcmVlU2NvcGUgPSBUcmVlU2NvcGU7XG4gICAgc2NvcGUuZ2V0VHJlZVNjb3BlID0gZ2V0VHJlZVNjb3BlO1xuICAgIHNjb3BlLnNldFRyZWVTY29wZSA9IHNldFRyZWVTY29wZTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIGZvcndhcmRNZXRob2RzVG9XcmFwcGVyID0gc2NvcGUuZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXI7XG4gICAgdmFyIGdldFRyZWVTY29wZSA9IHNjb3BlLmdldFRyZWVTY29wZTtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBzZXRXcmFwcGVyID0gc2NvcGUuc2V0V3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciB3cmFwcGVycyA9IHNjb3BlLndyYXBwZXJzO1xuICAgIHZhciB3cmFwcGVkRnVucyA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIGxpc3RlbmVyc1RhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgaGFuZGxlZEV2ZW50c1RhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgY3VycmVudGx5RGlzcGF0Y2hpbmdFdmVudHMgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciB0YXJnZXRUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIGN1cnJlbnRUYXJnZXRUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIHJlbGF0ZWRUYXJnZXRUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIGV2ZW50UGhhc2VUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIHN0b3BQcm9wYWdhdGlvblRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBldmVudEhhbmRsZXJzVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBldmVudFBhdGhUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgZnVuY3Rpb24gaXNTaGFkb3dSb290KG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlIGluc3RhbmNlb2Ygd3JhcHBlcnMuU2hhZG93Um9vdDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcm9vdE9mTm9kZShub2RlKSB7XG4gICAgICByZXR1cm4gZ2V0VHJlZVNjb3BlKG5vZGUpLnJvb3Q7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldEV2ZW50UGF0aChub2RlLCBldmVudCkge1xuICAgICAgdmFyIHBhdGggPSBbXTtcbiAgICAgIHZhciBjdXJyZW50ID0gbm9kZTtcbiAgICAgIHBhdGgucHVzaChjdXJyZW50KTtcbiAgICAgIHdoaWxlIChjdXJyZW50KSB7XG4gICAgICAgIHZhciBkZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyA9IGdldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzKGN1cnJlbnQpO1xuICAgICAgICBpZiAoZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMgJiYgZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpbnNlcnRpb25Qb2ludCA9IGRlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzW2ldO1xuICAgICAgICAgICAgaWYgKGlzU2hhZG93SW5zZXJ0aW9uUG9pbnQoaW5zZXJ0aW9uUG9pbnQpKSB7XG4gICAgICAgICAgICAgIHZhciBzaGFkb3dSb290ID0gcm9vdE9mTm9kZShpbnNlcnRpb25Qb2ludCk7XG4gICAgICAgICAgICAgIHZhciBvbGRlclNoYWRvd1Jvb3QgPSBzaGFkb3dSb290Lm9sZGVyU2hhZG93Um9vdDtcbiAgICAgICAgICAgICAgaWYgKG9sZGVyU2hhZG93Um9vdCkgcGF0aC5wdXNoKG9sZGVyU2hhZG93Um9vdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXRoLnB1c2goaW5zZXJ0aW9uUG9pbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJyZW50ID0gZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHNbZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMubGVuZ3RoIC0gMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGlzU2hhZG93Um9vdChjdXJyZW50KSkge1xuICAgICAgICAgICAgaWYgKGluU2FtZVRyZWUobm9kZSwgY3VycmVudCkgJiYgZXZlbnRNdXN0QmVTdG9wcGVkKGV2ZW50KSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50Lmhvc3Q7XG4gICAgICAgICAgICBwYXRoLnB1c2goY3VycmVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICBpZiAoY3VycmVudCkgcGF0aC5wdXNoKGN1cnJlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGV2ZW50TXVzdEJlU3RvcHBlZChldmVudCkge1xuICAgICAgaWYgKCFldmVudCkgcmV0dXJuIGZhbHNlO1xuICAgICAgc3dpdGNoIChldmVudC50eXBlKSB7XG4gICAgICAgY2FzZSBcImFib3J0XCI6XG4gICAgICAgY2FzZSBcImVycm9yXCI6XG4gICAgICAgY2FzZSBcInNlbGVjdFwiOlxuICAgICAgIGNhc2UgXCJjaGFuZ2VcIjpcbiAgICAgICBjYXNlIFwibG9hZFwiOlxuICAgICAgIGNhc2UgXCJyZXNldFwiOlxuICAgICAgIGNhc2UgXCJyZXNpemVcIjpcbiAgICAgICBjYXNlIFwic2Nyb2xsXCI6XG4gICAgICAgY2FzZSBcInNlbGVjdHN0YXJ0XCI6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc1NoYWRvd0luc2VydGlvblBvaW50KG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlIGluc3RhbmNlb2YgSFRNTFNoYWRvd0VsZW1lbnQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzKG5vZGUpIHtcbiAgICAgIHJldHVybiBzY29wZS5nZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyhub2RlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZXZlbnRSZXRhcmdldHRpbmcocGF0aCwgY3VycmVudFRhcmdldCkge1xuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gY3VycmVudFRhcmdldDtcbiAgICAgIGlmIChjdXJyZW50VGFyZ2V0IGluc3RhbmNlb2Ygd3JhcHBlcnMuV2luZG93KSBjdXJyZW50VGFyZ2V0ID0gY3VycmVudFRhcmdldC5kb2N1bWVudDtcbiAgICAgIHZhciBjdXJyZW50VGFyZ2V0VHJlZSA9IGdldFRyZWVTY29wZShjdXJyZW50VGFyZ2V0KTtcbiAgICAgIHZhciBvcmlnaW5hbFRhcmdldCA9IHBhdGhbMF07XG4gICAgICB2YXIgb3JpZ2luYWxUYXJnZXRUcmVlID0gZ2V0VHJlZVNjb3BlKG9yaWdpbmFsVGFyZ2V0KTtcbiAgICAgIHZhciByZWxhdGl2ZVRhcmdldFRyZWUgPSBsb3dlc3RDb21tb25JbmNsdXNpdmVBbmNlc3RvcihjdXJyZW50VGFyZ2V0VHJlZSwgb3JpZ2luYWxUYXJnZXRUcmVlKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbm9kZSA9IHBhdGhbaV07XG4gICAgICAgIGlmIChnZXRUcmVlU2NvcGUobm9kZSkgPT09IHJlbGF0aXZlVGFyZ2V0VHJlZSkgcmV0dXJuIG5vZGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGF0aFtwYXRoLmxlbmd0aCAtIDFdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRUcmVlU2NvcGVBbmNlc3RvcnModHJlZVNjb3BlKSB7XG4gICAgICB2YXIgYW5jZXN0b3JzID0gW107XG4gICAgICBmb3IgKDt0cmVlU2NvcGU7IHRyZWVTY29wZSA9IHRyZWVTY29wZS5wYXJlbnQpIHtcbiAgICAgICAgYW5jZXN0b3JzLnB1c2godHJlZVNjb3BlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhbmNlc3RvcnM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGxvd2VzdENvbW1vbkluY2x1c2l2ZUFuY2VzdG9yKHRzQSwgdHNCKSB7XG4gICAgICB2YXIgYW5jZXN0b3JzQSA9IGdldFRyZWVTY29wZUFuY2VzdG9ycyh0c0EpO1xuICAgICAgdmFyIGFuY2VzdG9yc0IgPSBnZXRUcmVlU2NvcGVBbmNlc3RvcnModHNCKTtcbiAgICAgIHZhciByZXN1bHQgPSBudWxsO1xuICAgICAgd2hpbGUgKGFuY2VzdG9yc0EubGVuZ3RoID4gMCAmJiBhbmNlc3RvcnNCLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGEgPSBhbmNlc3RvcnNBLnBvcCgpO1xuICAgICAgICB2YXIgYiA9IGFuY2VzdG9yc0IucG9wKCk7XG4gICAgICAgIGlmIChhID09PSBiKSByZXN1bHQgPSBhOyBlbHNlIGJyZWFrO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0VHJlZVNjb3BlUm9vdCh0cykge1xuICAgICAgaWYgKCF0cy5wYXJlbnQpIHJldHVybiB0cztcbiAgICAgIHJldHVybiBnZXRUcmVlU2NvcGVSb290KHRzLnBhcmVudCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbGF0ZWRUYXJnZXRSZXNvbHV0aW9uKGV2ZW50LCBjdXJyZW50VGFyZ2V0LCByZWxhdGVkVGFyZ2V0KSB7XG4gICAgICBpZiAoY3VycmVudFRhcmdldCBpbnN0YW5jZW9mIHdyYXBwZXJzLldpbmRvdykgY3VycmVudFRhcmdldCA9IGN1cnJlbnRUYXJnZXQuZG9jdW1lbnQ7XG4gICAgICB2YXIgY3VycmVudFRhcmdldFRyZWUgPSBnZXRUcmVlU2NvcGUoY3VycmVudFRhcmdldCk7XG4gICAgICB2YXIgcmVsYXRlZFRhcmdldFRyZWUgPSBnZXRUcmVlU2NvcGUocmVsYXRlZFRhcmdldCk7XG4gICAgICB2YXIgcmVsYXRlZFRhcmdldEV2ZW50UGF0aCA9IGdldEV2ZW50UGF0aChyZWxhdGVkVGFyZ2V0LCBldmVudCk7XG4gICAgICB2YXIgbG93ZXN0Q29tbW9uQW5jZXN0b3JUcmVlO1xuICAgICAgdmFyIGxvd2VzdENvbW1vbkFuY2VzdG9yVHJlZSA9IGxvd2VzdENvbW1vbkluY2x1c2l2ZUFuY2VzdG9yKGN1cnJlbnRUYXJnZXRUcmVlLCByZWxhdGVkVGFyZ2V0VHJlZSk7XG4gICAgICBpZiAoIWxvd2VzdENvbW1vbkFuY2VzdG9yVHJlZSkgbG93ZXN0Q29tbW9uQW5jZXN0b3JUcmVlID0gcmVsYXRlZFRhcmdldFRyZWUucm9vdDtcbiAgICAgIGZvciAodmFyIGNvbW1vbkFuY2VzdG9yVHJlZSA9IGxvd2VzdENvbW1vbkFuY2VzdG9yVHJlZTsgY29tbW9uQW5jZXN0b3JUcmVlOyBjb21tb25BbmNlc3RvclRyZWUgPSBjb21tb25BbmNlc3RvclRyZWUucGFyZW50KSB7XG4gICAgICAgIHZhciBhZGp1c3RlZFJlbGF0ZWRUYXJnZXQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVsYXRlZFRhcmdldEV2ZW50UGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBub2RlID0gcmVsYXRlZFRhcmdldEV2ZW50UGF0aFtpXTtcbiAgICAgICAgICBpZiAoZ2V0VHJlZVNjb3BlKG5vZGUpID09PSBjb21tb25BbmNlc3RvclRyZWUpIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW5TYW1lVHJlZShhLCBiKSB7XG4gICAgICByZXR1cm4gZ2V0VHJlZVNjb3BlKGEpID09PSBnZXRUcmVlU2NvcGUoYik7XG4gICAgfVxuICAgIHZhciBOT05FID0gMDtcbiAgICB2YXIgQ0FQVFVSSU5HX1BIQVNFID0gMTtcbiAgICB2YXIgQVRfVEFSR0VUID0gMjtcbiAgICB2YXIgQlVCQkxJTkdfUEhBU0UgPSAzO1xuICAgIHZhciBwZW5kaW5nRXJyb3I7XG4gICAgZnVuY3Rpb24gZGlzcGF0Y2hPcmlnaW5hbEV2ZW50KG9yaWdpbmFsRXZlbnQpIHtcbiAgICAgIGlmIChoYW5kbGVkRXZlbnRzVGFibGUuZ2V0KG9yaWdpbmFsRXZlbnQpKSByZXR1cm47XG4gICAgICBoYW5kbGVkRXZlbnRzVGFibGUuc2V0KG9yaWdpbmFsRXZlbnQsIHRydWUpO1xuICAgICAgZGlzcGF0Y2hFdmVudCh3cmFwKG9yaWdpbmFsRXZlbnQpLCB3cmFwKG9yaWdpbmFsRXZlbnQudGFyZ2V0KSk7XG4gICAgICBpZiAocGVuZGluZ0Vycm9yKSB7XG4gICAgICAgIHZhciBlcnIgPSBwZW5kaW5nRXJyb3I7XG4gICAgICAgIHBlbmRpbmdFcnJvciA9IG51bGw7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gaXNMb2FkTGlrZUV2ZW50KGV2ZW50KSB7XG4gICAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgICBjYXNlIFwibG9hZFwiOlxuICAgICAgIGNhc2UgXCJiZWZvcmV1bmxvYWRcIjpcbiAgICAgICBjYXNlIFwidW5sb2FkXCI6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkaXNwYXRjaEV2ZW50KGV2ZW50LCBvcmlnaW5hbFdyYXBwZXJUYXJnZXQpIHtcbiAgICAgIGlmIChjdXJyZW50bHlEaXNwYXRjaGluZ0V2ZW50cy5nZXQoZXZlbnQpKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkU3RhdGVFcnJvclwiKTtcbiAgICAgIGN1cnJlbnRseURpc3BhdGNoaW5nRXZlbnRzLnNldChldmVudCwgdHJ1ZSk7XG4gICAgICBzY29wZS5yZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICB2YXIgZXZlbnRQYXRoO1xuICAgICAgdmFyIG92ZXJyaWRlVGFyZ2V0O1xuICAgICAgdmFyIHdpbjtcbiAgICAgIGlmIChpc0xvYWRMaWtlRXZlbnQoZXZlbnQpICYmICFldmVudC5idWJibGVzKSB7XG4gICAgICAgIHZhciBkb2MgPSBvcmlnaW5hbFdyYXBwZXJUYXJnZXQ7XG4gICAgICAgIGlmIChkb2MgaW5zdGFuY2VvZiB3cmFwcGVycy5Eb2N1bWVudCAmJiAod2luID0gZG9jLmRlZmF1bHRWaWV3KSkge1xuICAgICAgICAgIG92ZXJyaWRlVGFyZ2V0ID0gZG9jO1xuICAgICAgICAgIGV2ZW50UGF0aCA9IFtdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWV2ZW50UGF0aCkge1xuICAgICAgICBpZiAob3JpZ2luYWxXcmFwcGVyVGFyZ2V0IGluc3RhbmNlb2Ygd3JhcHBlcnMuV2luZG93KSB7XG4gICAgICAgICAgd2luID0gb3JpZ2luYWxXcmFwcGVyVGFyZ2V0O1xuICAgICAgICAgIGV2ZW50UGF0aCA9IFtdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV2ZW50UGF0aCA9IGdldEV2ZW50UGF0aChvcmlnaW5hbFdyYXBwZXJUYXJnZXQsIGV2ZW50KTtcbiAgICAgICAgICBpZiAoIWlzTG9hZExpa2VFdmVudChldmVudCkpIHtcbiAgICAgICAgICAgIHZhciBkb2MgPSBldmVudFBhdGhbZXZlbnRQYXRoLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgaWYgKGRvYyBpbnN0YW5jZW9mIHdyYXBwZXJzLkRvY3VtZW50KSB3aW4gPSBkb2MuZGVmYXVsdFZpZXc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBldmVudFBhdGhUYWJsZS5zZXQoZXZlbnQsIGV2ZW50UGF0aCk7XG4gICAgICBpZiAoZGlzcGF0Y2hDYXB0dXJpbmcoZXZlbnQsIGV2ZW50UGF0aCwgd2luLCBvdmVycmlkZVRhcmdldCkpIHtcbiAgICAgICAgaWYgKGRpc3BhdGNoQXRUYXJnZXQoZXZlbnQsIGV2ZW50UGF0aCwgd2luLCBvdmVycmlkZVRhcmdldCkpIHtcbiAgICAgICAgICBkaXNwYXRjaEJ1YmJsaW5nKGV2ZW50LCBldmVudFBhdGgsIHdpbiwgb3ZlcnJpZGVUYXJnZXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBldmVudFBoYXNlVGFibGUuc2V0KGV2ZW50LCBOT05FKTtcbiAgICAgIGN1cnJlbnRUYXJnZXRUYWJsZS5kZWxldGUoZXZlbnQsIG51bGwpO1xuICAgICAgY3VycmVudGx5RGlzcGF0Y2hpbmdFdmVudHMuZGVsZXRlKGV2ZW50KTtcbiAgICAgIHJldHVybiBldmVudC5kZWZhdWx0UHJldmVudGVkO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkaXNwYXRjaENhcHR1cmluZyhldmVudCwgZXZlbnRQYXRoLCB3aW4sIG92ZXJyaWRlVGFyZ2V0KSB7XG4gICAgICB2YXIgcGhhc2UgPSBDQVBUVVJJTkdfUEhBU0U7XG4gICAgICBpZiAod2luKSB7XG4gICAgICAgIGlmICghaW52b2tlKHdpbiwgZXZlbnQsIHBoYXNlLCBldmVudFBhdGgsIG92ZXJyaWRlVGFyZ2V0KSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgZm9yICh2YXIgaSA9IGV2ZW50UGF0aC5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIGlmICghaW52b2tlKGV2ZW50UGF0aFtpXSwgZXZlbnQsIHBoYXNlLCBldmVudFBhdGgsIG92ZXJyaWRlVGFyZ2V0KSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoQXRUYXJnZXQoZXZlbnQsIGV2ZW50UGF0aCwgd2luLCBvdmVycmlkZVRhcmdldCkge1xuICAgICAgdmFyIHBoYXNlID0gQVRfVEFSR0VUO1xuICAgICAgdmFyIGN1cnJlbnRUYXJnZXQgPSBldmVudFBhdGhbMF0gfHwgd2luO1xuICAgICAgcmV0dXJuIGludm9rZShjdXJyZW50VGFyZ2V0LCBldmVudCwgcGhhc2UsIGV2ZW50UGF0aCwgb3ZlcnJpZGVUYXJnZXQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkaXNwYXRjaEJ1YmJsaW5nKGV2ZW50LCBldmVudFBhdGgsIHdpbiwgb3ZlcnJpZGVUYXJnZXQpIHtcbiAgICAgIHZhciBwaGFzZSA9IEJVQkJMSU5HX1BIQVNFO1xuICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBldmVudFBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFpbnZva2UoZXZlbnRQYXRoW2ldLCBldmVudCwgcGhhc2UsIGV2ZW50UGF0aCwgb3ZlcnJpZGVUYXJnZXQpKSByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAod2luICYmIGV2ZW50UGF0aC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGludm9rZSh3aW4sIGV2ZW50LCBwaGFzZSwgZXZlbnRQYXRoLCBvdmVycmlkZVRhcmdldCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludm9rZShjdXJyZW50VGFyZ2V0LCBldmVudCwgcGhhc2UsIGV2ZW50UGF0aCwgb3ZlcnJpZGVUYXJnZXQpIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnNUYWJsZS5nZXQoY3VycmVudFRhcmdldCk7XG4gICAgICBpZiAoIWxpc3RlbmVycykgcmV0dXJuIHRydWU7XG4gICAgICB2YXIgdGFyZ2V0ID0gb3ZlcnJpZGVUYXJnZXQgfHwgZXZlbnRSZXRhcmdldHRpbmcoZXZlbnRQYXRoLCBjdXJyZW50VGFyZ2V0KTtcbiAgICAgIGlmICh0YXJnZXQgPT09IGN1cnJlbnRUYXJnZXQpIHtcbiAgICAgICAgaWYgKHBoYXNlID09PSBDQVBUVVJJTkdfUEhBU0UpIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAocGhhc2UgPT09IEJVQkJMSU5HX1BIQVNFKSBwaGFzZSA9IEFUX1RBUkdFVDtcbiAgICAgIH0gZWxzZSBpZiAocGhhc2UgPT09IEJVQkJMSU5HX1BIQVNFICYmICFldmVudC5idWJibGVzKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKFwicmVsYXRlZFRhcmdldFwiIGluIGV2ZW50KSB7XG4gICAgICAgIHZhciBvcmlnaW5hbEV2ZW50ID0gdW53cmFwKGV2ZW50KTtcbiAgICAgICAgdmFyIHVud3JhcHBlZFJlbGF0ZWRUYXJnZXQgPSBvcmlnaW5hbEV2ZW50LnJlbGF0ZWRUYXJnZXQ7XG4gICAgICAgIGlmICh1bndyYXBwZWRSZWxhdGVkVGFyZ2V0KSB7XG4gICAgICAgICAgaWYgKHVud3JhcHBlZFJlbGF0ZWRUYXJnZXQgaW5zdGFuY2VvZiBPYmplY3QgJiYgdW53cmFwcGVkUmVsYXRlZFRhcmdldC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICB2YXIgcmVsYXRlZFRhcmdldCA9IHdyYXAodW53cmFwcGVkUmVsYXRlZFRhcmdldCk7XG4gICAgICAgICAgICB2YXIgYWRqdXN0ZWQgPSByZWxhdGVkVGFyZ2V0UmVzb2x1dGlvbihldmVudCwgY3VycmVudFRhcmdldCwgcmVsYXRlZFRhcmdldCk7XG4gICAgICAgICAgICBpZiAoYWRqdXN0ZWQgPT09IHRhcmdldCkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFkanVzdGVkID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVsYXRlZFRhcmdldFRhYmxlLnNldChldmVudCwgYWRqdXN0ZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBldmVudFBoYXNlVGFibGUuc2V0KGV2ZW50LCBwaGFzZSk7XG4gICAgICB2YXIgdHlwZSA9IGV2ZW50LnR5cGU7XG4gICAgICB2YXIgYW55UmVtb3ZlZCA9IGZhbHNlO1xuICAgICAgdGFyZ2V0VGFibGUuc2V0KGV2ZW50LCB0YXJnZXQpO1xuICAgICAgY3VycmVudFRhcmdldFRhYmxlLnNldChldmVudCwgY3VycmVudFRhcmdldCk7XG4gICAgICBsaXN0ZW5lcnMuZGVwdGgrKztcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIGxpc3RlbmVyID0gbGlzdGVuZXJzW2ldO1xuICAgICAgICBpZiAobGlzdGVuZXIucmVtb3ZlZCkge1xuICAgICAgICAgIGFueVJlbW92ZWQgPSB0cnVlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaXN0ZW5lci50eXBlICE9PSB0eXBlIHx8ICFsaXN0ZW5lci5jYXB0dXJlICYmIHBoYXNlID09PSBDQVBUVVJJTkdfUEhBU0UgfHwgbGlzdGVuZXIuY2FwdHVyZSAmJiBwaGFzZSA9PT0gQlVCQkxJTkdfUEhBU0UpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIuaGFuZGxlciA9PT0gXCJmdW5jdGlvblwiKSBsaXN0ZW5lci5oYW5kbGVyLmNhbGwoY3VycmVudFRhcmdldCwgZXZlbnQpOyBlbHNlIGxpc3RlbmVyLmhhbmRsZXIuaGFuZGxlRXZlbnQoZXZlbnQpO1xuICAgICAgICAgIGlmIChzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb25UYWJsZS5nZXQoZXZlbnQpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgaWYgKCFwZW5kaW5nRXJyb3IpIHBlbmRpbmdFcnJvciA9IGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsaXN0ZW5lcnMuZGVwdGgtLTtcbiAgICAgIGlmIChhbnlSZW1vdmVkICYmIGxpc3RlbmVycy5kZXB0aCA9PT0gMCkge1xuICAgICAgICB2YXIgY29weSA9IGxpc3RlbmVycy5zbGljZSgpO1xuICAgICAgICBsaXN0ZW5lcnMubGVuZ3RoID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3B5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKCFjb3B5W2ldLnJlbW92ZWQpIGxpc3RlbmVycy5wdXNoKGNvcHlbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gIXN0b3BQcm9wYWdhdGlvblRhYmxlLmdldChldmVudCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGNhcHR1cmUpIHtcbiAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICB0aGlzLmhhbmRsZXIgPSBoYW5kbGVyO1xuICAgICAgdGhpcy5jYXB0dXJlID0gQm9vbGVhbihjYXB0dXJlKTtcbiAgICB9XG4gICAgTGlzdGVuZXIucHJvdG90eXBlID0ge1xuICAgICAgZXF1YWxzOiBmdW5jdGlvbih0aGF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZXIgPT09IHRoYXQuaGFuZGxlciAmJiB0aGlzLnR5cGUgPT09IHRoYXQudHlwZSAmJiB0aGlzLmNhcHR1cmUgPT09IHRoYXQuY2FwdHVyZTtcbiAgICAgIH0sXG4gICAgICBnZXQgcmVtb3ZlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlciA9PT0gbnVsbDtcbiAgICAgIH0sXG4gICAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmhhbmRsZXIgPSBudWxsO1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIE9yaWdpbmFsRXZlbnQgPSB3aW5kb3cuRXZlbnQ7XG4gICAgT3JpZ2luYWxFdmVudC5wcm90b3R5cGUucG9seW1lckJsYWNrTGlzdF8gPSB7XG4gICAgICByZXR1cm5WYWx1ZTogdHJ1ZSxcbiAgICAgIGtleUxvY2F0aW9uOiB0cnVlXG4gICAgfTtcbiAgICBmdW5jdGlvbiBFdmVudCh0eXBlLCBvcHRpb25zKSB7XG4gICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIE9yaWdpbmFsRXZlbnQpIHtcbiAgICAgICAgdmFyIGltcGwgPSB0eXBlO1xuICAgICAgICBpZiAoIU9yaWdpbmFsQmVmb3JlVW5sb2FkRXZlbnQgJiYgaW1wbC50eXBlID09PSBcImJlZm9yZXVubG9hZFwiICYmICEodGhpcyBpbnN0YW5jZW9mIEJlZm9yZVVubG9hZEV2ZW50KSkge1xuICAgICAgICAgIHJldHVybiBuZXcgQmVmb3JlVW5sb2FkRXZlbnQoaW1wbCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0V3JhcHBlcihpbXBsLCB0aGlzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB3cmFwKGNvbnN0cnVjdEV2ZW50KE9yaWdpbmFsRXZlbnQsIFwiRXZlbnRcIiwgdHlwZSwgb3B0aW9ucykpO1xuICAgICAgfVxuICAgIH1cbiAgICBFdmVudC5wcm90b3R5cGUgPSB7XG4gICAgICBnZXQgdGFyZ2V0KCkge1xuICAgICAgICByZXR1cm4gdGFyZ2V0VGFibGUuZ2V0KHRoaXMpO1xuICAgICAgfSxcbiAgICAgIGdldCBjdXJyZW50VGFyZ2V0KCkge1xuICAgICAgICByZXR1cm4gY3VycmVudFRhcmdldFRhYmxlLmdldCh0aGlzKTtcbiAgICAgIH0sXG4gICAgICBnZXQgZXZlbnRQaGFzZSgpIHtcbiAgICAgICAgcmV0dXJuIGV2ZW50UGhhc2VUYWJsZS5nZXQodGhpcyk7XG4gICAgICB9LFxuICAgICAgZ2V0IHBhdGgoKSB7XG4gICAgICAgIHZhciBldmVudFBhdGggPSBldmVudFBhdGhUYWJsZS5nZXQodGhpcyk7XG4gICAgICAgIGlmICghZXZlbnRQYXRoKSByZXR1cm4gW107XG4gICAgICAgIHJldHVybiBldmVudFBhdGguc2xpY2UoKTtcbiAgICAgIH0sXG4gICAgICBzdG9wUHJvcGFnYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICBzdG9wUHJvcGFnYXRpb25UYWJsZS5zZXQodGhpcywgdHJ1ZSk7XG4gICAgICB9LFxuICAgICAgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgc3RvcFByb3BhZ2F0aW9uVGFibGUuc2V0KHRoaXMsIHRydWUpO1xuICAgICAgICBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb25UYWJsZS5zZXQodGhpcywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgc3VwcG9ydHNEZWZhdWx0UHJldmVudGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiRXZlbnRcIik7XG4gICAgICBlLmluaXRFdmVudChcInRlc3RcIiwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm4gZS5kZWZhdWx0UHJldmVudGVkO1xuICAgIH0oKTtcbiAgICBpZiAoIXN1cHBvcnRzRGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgRXZlbnQucHJvdG90eXBlLnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5jYW5jZWxhYmxlKSByZXR1cm47XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJkZWZhdWx0UHJldmVudGVkXCIsIHtcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1cbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxFdmVudCwgRXZlbnQsIGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiRXZlbnRcIikpO1xuICAgIGZ1bmN0aW9uIHVud3JhcE9wdGlvbnMob3B0aW9ucykge1xuICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnJlbGF0ZWRUYXJnZXQpIHJldHVybiBvcHRpb25zO1xuICAgICAgcmV0dXJuIE9iamVjdC5jcmVhdGUob3B0aW9ucywge1xuICAgICAgICByZWxhdGVkVGFyZ2V0OiB7XG4gICAgICAgICAgdmFsdWU6IHVud3JhcChvcHRpb25zLnJlbGF0ZWRUYXJnZXQpXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZWdpc3RlckdlbmVyaWNFdmVudChuYW1lLCBTdXBlckV2ZW50LCBwcm90b3R5cGUpIHtcbiAgICAgIHZhciBPcmlnaW5hbEV2ZW50ID0gd2luZG93W25hbWVdO1xuICAgICAgdmFyIEdlbmVyaWNFdmVudCA9IGZ1bmN0aW9uKHR5cGUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBPcmlnaW5hbEV2ZW50KSBzZXRXcmFwcGVyKHR5cGUsIHRoaXMpOyBlbHNlIHJldHVybiB3cmFwKGNvbnN0cnVjdEV2ZW50KE9yaWdpbmFsRXZlbnQsIG5hbWUsIHR5cGUsIG9wdGlvbnMpKTtcbiAgICAgIH07XG4gICAgICBHZW5lcmljRXZlbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdXBlckV2ZW50LnByb3RvdHlwZSk7XG4gICAgICBpZiAocHJvdG90eXBlKSBtaXhpbihHZW5lcmljRXZlbnQucHJvdG90eXBlLCBwcm90b3R5cGUpO1xuICAgICAgaWYgKE9yaWdpbmFsRXZlbnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxFdmVudCwgR2VuZXJpY0V2ZW50LCBuZXcgT3JpZ2luYWxFdmVudChcInRlbXBcIikpO1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEV2ZW50LCBHZW5lcmljRXZlbnQsIGRvY3VtZW50LmNyZWF0ZUV2ZW50KG5hbWUpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIEdlbmVyaWNFdmVudDtcbiAgICB9XG4gICAgdmFyIFVJRXZlbnQgPSByZWdpc3RlckdlbmVyaWNFdmVudChcIlVJRXZlbnRcIiwgRXZlbnQpO1xuICAgIHZhciBDdXN0b21FdmVudCA9IHJlZ2lzdGVyR2VuZXJpY0V2ZW50KFwiQ3VzdG9tRXZlbnRcIiwgRXZlbnQpO1xuICAgIHZhciByZWxhdGVkVGFyZ2V0UHJvdG8gPSB7XG4gICAgICBnZXQgcmVsYXRlZFRhcmdldCgpIHtcbiAgICAgICAgdmFyIHJlbGF0ZWRUYXJnZXQgPSByZWxhdGVkVGFyZ2V0VGFibGUuZ2V0KHRoaXMpO1xuICAgICAgICBpZiAocmVsYXRlZFRhcmdldCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcmVsYXRlZFRhcmdldDtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLnJlbGF0ZWRUYXJnZXQpO1xuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gZ2V0SW5pdEZ1bmN0aW9uKG5hbWUsIHJlbGF0ZWRUYXJnZXRJbmRleCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBhcmd1bWVudHNbcmVsYXRlZFRhcmdldEluZGV4XSA9IHVud3JhcChhcmd1bWVudHNbcmVsYXRlZFRhcmdldEluZGV4XSk7XG4gICAgICAgIHZhciBpbXBsID0gdW53cmFwKHRoaXMpO1xuICAgICAgICBpbXBsW25hbWVdLmFwcGx5KGltcGwsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH1cbiAgICB2YXIgbW91c2VFdmVudFByb3RvID0gbWl4aW4oe1xuICAgICAgaW5pdE1vdXNlRXZlbnQ6IGdldEluaXRGdW5jdGlvbihcImluaXRNb3VzZUV2ZW50XCIsIDE0KVxuICAgIH0sIHJlbGF0ZWRUYXJnZXRQcm90byk7XG4gICAgdmFyIGZvY3VzRXZlbnRQcm90byA9IG1peGluKHtcbiAgICAgIGluaXRGb2N1c0V2ZW50OiBnZXRJbml0RnVuY3Rpb24oXCJpbml0Rm9jdXNFdmVudFwiLCA1KVxuICAgIH0sIHJlbGF0ZWRUYXJnZXRQcm90byk7XG4gICAgdmFyIE1vdXNlRXZlbnQgPSByZWdpc3RlckdlbmVyaWNFdmVudChcIk1vdXNlRXZlbnRcIiwgVUlFdmVudCwgbW91c2VFdmVudFByb3RvKTtcbiAgICB2YXIgRm9jdXNFdmVudCA9IHJlZ2lzdGVyR2VuZXJpY0V2ZW50KFwiRm9jdXNFdmVudFwiLCBVSUV2ZW50LCBmb2N1c0V2ZW50UHJvdG8pO1xuICAgIHZhciBkZWZhdWx0SW5pdERpY3RzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB2YXIgc3VwcG9ydHNFdmVudENvbnN0cnVjdG9ycyA9IGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbmV3IHdpbmRvdy5Gb2N1c0V2ZW50KFwiZm9jdXNcIik7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KCk7XG4gICAgZnVuY3Rpb24gY29uc3RydWN0RXZlbnQoT3JpZ2luYWxFdmVudCwgbmFtZSwgdHlwZSwgb3B0aW9ucykge1xuICAgICAgaWYgKHN1cHBvcnRzRXZlbnRDb25zdHJ1Y3RvcnMpIHJldHVybiBuZXcgT3JpZ2luYWxFdmVudCh0eXBlLCB1bndyYXBPcHRpb25zKG9wdGlvbnMpKTtcbiAgICAgIHZhciBldmVudCA9IHVud3JhcChkb2N1bWVudC5jcmVhdGVFdmVudChuYW1lKSk7XG4gICAgICB2YXIgZGVmYXVsdERpY3QgPSBkZWZhdWx0SW5pdERpY3RzW25hbWVdO1xuICAgICAgdmFyIGFyZ3MgPSBbIHR5cGUgXTtcbiAgICAgIE9iamVjdC5rZXlzKGRlZmF1bHREaWN0KS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgdiA9IG9wdGlvbnMgIT0gbnVsbCAmJiBrZXkgaW4gb3B0aW9ucyA/IG9wdGlvbnNba2V5XSA6IGRlZmF1bHREaWN0W2tleV07XG4gICAgICAgIGlmIChrZXkgPT09IFwicmVsYXRlZFRhcmdldFwiKSB2ID0gdW53cmFwKHYpO1xuICAgICAgICBhcmdzLnB1c2godik7XG4gICAgICB9KTtcbiAgICAgIGV2ZW50W1wiaW5pdFwiICsgbmFtZV0uYXBwbHkoZXZlbnQsIGFyZ3MpO1xuICAgICAgcmV0dXJuIGV2ZW50O1xuICAgIH1cbiAgICBpZiAoIXN1cHBvcnRzRXZlbnRDb25zdHJ1Y3RvcnMpIHtcbiAgICAgIHZhciBjb25maWd1cmVFdmVudENvbnN0cnVjdG9yID0gZnVuY3Rpb24obmFtZSwgaW5pdERpY3QsIHN1cGVyTmFtZSkge1xuICAgICAgICBpZiAoc3VwZXJOYW1lKSB7XG4gICAgICAgICAgdmFyIHN1cGVyRGljdCA9IGRlZmF1bHRJbml0RGljdHNbc3VwZXJOYW1lXTtcbiAgICAgICAgICBpbml0RGljdCA9IG1peGluKG1peGluKHt9LCBzdXBlckRpY3QpLCBpbml0RGljdCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdEluaXREaWN0c1tuYW1lXSA9IGluaXREaWN0O1xuICAgICAgfTtcbiAgICAgIGNvbmZpZ3VyZUV2ZW50Q29uc3RydWN0b3IoXCJFdmVudFwiLCB7XG4gICAgICAgIGJ1YmJsZXM6IGZhbHNlLFxuICAgICAgICBjYW5jZWxhYmxlOiBmYWxzZVxuICAgICAgfSk7XG4gICAgICBjb25maWd1cmVFdmVudENvbnN0cnVjdG9yKFwiQ3VzdG9tRXZlbnRcIiwge1xuICAgICAgICBkZXRhaWw6IG51bGxcbiAgICAgIH0sIFwiRXZlbnRcIik7XG4gICAgICBjb25maWd1cmVFdmVudENvbnN0cnVjdG9yKFwiVUlFdmVudFwiLCB7XG4gICAgICAgIHZpZXc6IG51bGwsXG4gICAgICAgIGRldGFpbDogMFxuICAgICAgfSwgXCJFdmVudFwiKTtcbiAgICAgIGNvbmZpZ3VyZUV2ZW50Q29uc3RydWN0b3IoXCJNb3VzZUV2ZW50XCIsIHtcbiAgICAgICAgc2NyZWVuWDogMCxcbiAgICAgICAgc2NyZWVuWTogMCxcbiAgICAgICAgY2xpZW50WDogMCxcbiAgICAgICAgY2xpZW50WTogMCxcbiAgICAgICAgY3RybEtleTogZmFsc2UsXG4gICAgICAgIGFsdEtleTogZmFsc2UsXG4gICAgICAgIHNoaWZ0S2V5OiBmYWxzZSxcbiAgICAgICAgbWV0YUtleTogZmFsc2UsXG4gICAgICAgIGJ1dHRvbjogMCxcbiAgICAgICAgcmVsYXRlZFRhcmdldDogbnVsbFxuICAgICAgfSwgXCJVSUV2ZW50XCIpO1xuICAgICAgY29uZmlndXJlRXZlbnRDb25zdHJ1Y3RvcihcIkZvY3VzRXZlbnRcIiwge1xuICAgICAgICByZWxhdGVkVGFyZ2V0OiBudWxsXG4gICAgICB9LCBcIlVJRXZlbnRcIik7XG4gICAgfVxuICAgIHZhciBPcmlnaW5hbEJlZm9yZVVubG9hZEV2ZW50ID0gd2luZG93LkJlZm9yZVVubG9hZEV2ZW50O1xuICAgIGZ1bmN0aW9uIEJlZm9yZVVubG9hZEV2ZW50KGltcGwpIHtcbiAgICAgIEV2ZW50LmNhbGwodGhpcywgaW1wbCk7XG4gICAgfVxuICAgIEJlZm9yZVVubG9hZEV2ZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZlbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihCZWZvcmVVbmxvYWRFdmVudC5wcm90b3R5cGUsIHtcbiAgICAgIGdldCByZXR1cm5WYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5yZXR1cm5WYWx1ZTtcbiAgICAgIH0sXG4gICAgICBzZXQgcmV0dXJuVmFsdWUodikge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykucmV0dXJuVmFsdWUgPSB2O1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChPcmlnaW5hbEJlZm9yZVVubG9hZEV2ZW50KSByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxCZWZvcmVVbmxvYWRFdmVudCwgQmVmb3JlVW5sb2FkRXZlbnQpO1xuICAgIGZ1bmN0aW9uIGlzVmFsaWRMaXN0ZW5lcihmdW4pIHtcbiAgICAgIGlmICh0eXBlb2YgZnVuID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuIGZ1biAmJiBmdW4uaGFuZGxlRXZlbnQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzTXV0YXRpb25FdmVudCh0eXBlKSB7XG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICBjYXNlIFwiRE9NQXR0ck1vZGlmaWVkXCI6XG4gICAgICAgY2FzZSBcIkRPTUF0dHJpYnV0ZU5hbWVDaGFuZ2VkXCI6XG4gICAgICAgY2FzZSBcIkRPTUNoYXJhY3RlckRhdGFNb2RpZmllZFwiOlxuICAgICAgIGNhc2UgXCJET01FbGVtZW50TmFtZUNoYW5nZWRcIjpcbiAgICAgICBjYXNlIFwiRE9NTm9kZUluc2VydGVkXCI6XG4gICAgICAgY2FzZSBcIkRPTU5vZGVJbnNlcnRlZEludG9Eb2N1bWVudFwiOlxuICAgICAgIGNhc2UgXCJET01Ob2RlUmVtb3ZlZFwiOlxuICAgICAgIGNhc2UgXCJET01Ob2RlUmVtb3ZlZEZyb21Eb2N1bWVudFwiOlxuICAgICAgIGNhc2UgXCJET01TdWJ0cmVlTW9kaWZpZWRcIjpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBPcmlnaW5hbEV2ZW50VGFyZ2V0ID0gd2luZG93LkV2ZW50VGFyZ2V0O1xuICAgIGZ1bmN0aW9uIEV2ZW50VGFyZ2V0KGltcGwpIHtcbiAgICAgIHNldFdyYXBwZXIoaW1wbCwgdGhpcyk7XG4gICAgfVxuICAgIHZhciBtZXRob2ROYW1lcyA9IFsgXCJhZGRFdmVudExpc3RlbmVyXCIsIFwicmVtb3ZlRXZlbnRMaXN0ZW5lclwiLCBcImRpc3BhdGNoRXZlbnRcIiBdO1xuICAgIFsgTm9kZSwgV2luZG93IF0uZm9yRWFjaChmdW5jdGlvbihjb25zdHJ1Y3Rvcikge1xuICAgICAgdmFyIHAgPSBjb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgICBtZXRob2ROYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHAsIG5hbWUgKyBcIl9cIiwge1xuICAgICAgICAgIHZhbHVlOiBwW25hbWVdXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZnVuY3Rpb24gZ2V0VGFyZ2V0VG9MaXN0ZW5BdCh3cmFwcGVyKSB7XG4gICAgICBpZiAod3JhcHBlciBpbnN0YW5jZW9mIHdyYXBwZXJzLlNoYWRvd1Jvb3QpIHdyYXBwZXIgPSB3cmFwcGVyLmhvc3Q7XG4gICAgICByZXR1cm4gdW53cmFwKHdyYXBwZXIpO1xuICAgIH1cbiAgICBFdmVudFRhcmdldC5wcm90b3R5cGUgPSB7XG4gICAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbih0eXBlLCBmdW4sIGNhcHR1cmUpIHtcbiAgICAgICAgaWYgKCFpc1ZhbGlkTGlzdGVuZXIoZnVuKSB8fCBpc011dGF0aW9uRXZlbnQodHlwZSkpIHJldHVybjtcbiAgICAgICAgdmFyIGxpc3RlbmVyID0gbmV3IExpc3RlbmVyKHR5cGUsIGZ1biwgY2FwdHVyZSk7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnNUYWJsZS5nZXQodGhpcyk7XG4gICAgICAgIGlmICghbGlzdGVuZXJzKSB7XG4gICAgICAgICAgbGlzdGVuZXJzID0gW107XG4gICAgICAgICAgbGlzdGVuZXJzLmRlcHRoID0gMDtcbiAgICAgICAgICBsaXN0ZW5lcnNUYWJsZS5zZXQodGhpcywgbGlzdGVuZXJzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyLmVxdWFscyhsaXN0ZW5lcnNbaV0pKSByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGdldFRhcmdldFRvTGlzdGVuQXQodGhpcyk7XG4gICAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyXyh0eXBlLCBkaXNwYXRjaE9yaWdpbmFsRXZlbnQsIHRydWUpO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKHR5cGUsIGZ1biwgY2FwdHVyZSkge1xuICAgICAgICBjYXB0dXJlID0gQm9vbGVhbihjYXB0dXJlKTtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IGxpc3RlbmVyc1RhYmxlLmdldCh0aGlzKTtcbiAgICAgICAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybjtcbiAgICAgICAgdmFyIGNvdW50ID0gMCwgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldLnR5cGUgPT09IHR5cGUgJiYgbGlzdGVuZXJzW2ldLmNhcHR1cmUgPT09IGNhcHR1cmUpIHtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldLmhhbmRsZXIgPT09IGZ1bikge1xuICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5yZW1vdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvdW5kICYmIGNvdW50ID09PSAxKSB7XG4gICAgICAgICAgdmFyIHRhcmdldCA9IGdldFRhcmdldFRvTGlzdGVuQXQodGhpcyk7XG4gICAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXJfKHR5cGUsIGRpc3BhdGNoT3JpZ2luYWxFdmVudCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBkaXNwYXRjaEV2ZW50OiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgbmF0aXZlRXZlbnQgPSB1bndyYXAoZXZlbnQpO1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gbmF0aXZlRXZlbnQudHlwZTtcbiAgICAgICAgaGFuZGxlZEV2ZW50c1RhYmxlLnNldChuYXRpdmVFdmVudCwgZmFsc2UpO1xuICAgICAgICBzY29wZS5yZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICAgIHZhciB0ZW1wTGlzdGVuZXI7XG4gICAgICAgIGlmICghaGFzTGlzdGVuZXJJbkFuY2VzdG9ycyh0aGlzLCBldmVudFR5cGUpKSB7XG4gICAgICAgICAgdGVtcExpc3RlbmVyID0gZnVuY3Rpb24oKSB7fTtcbiAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0ZW1wTGlzdGVuZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIHVud3JhcCh0aGlzKS5kaXNwYXRjaEV2ZW50XyhuYXRpdmVFdmVudCk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgaWYgKHRlbXBMaXN0ZW5lcikgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGVtcExpc3RlbmVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gaGFzTGlzdGVuZXIobm9kZSwgdHlwZSkge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IGxpc3RlbmVyc1RhYmxlLmdldChub2RlKTtcbiAgICAgIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoIWxpc3RlbmVyc1tpXS5yZW1vdmVkICYmIGxpc3RlbmVyc1tpXS50eXBlID09PSB0eXBlKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBoYXNMaXN0ZW5lckluQW5jZXN0b3JzKHRhcmdldCwgdHlwZSkge1xuICAgICAgZm9yICh2YXIgbm9kZSA9IHVud3JhcCh0YXJnZXQpOyBub2RlOyBub2RlID0gbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgIGlmIChoYXNMaXN0ZW5lcih3cmFwKG5vZGUpLCB0eXBlKSkgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChPcmlnaW5hbEV2ZW50VGFyZ2V0KSByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxFdmVudFRhcmdldCwgRXZlbnRUYXJnZXQpO1xuICAgIGZ1bmN0aW9uIHdyYXBFdmVudFRhcmdldE1ldGhvZHMoY29uc3RydWN0b3JzKSB7XG4gICAgICBmb3J3YXJkTWV0aG9kc1RvV3JhcHBlcihjb25zdHJ1Y3RvcnMsIG1ldGhvZE5hbWVzKTtcbiAgICB9XG4gICAgdmFyIG9yaWdpbmFsRWxlbWVudEZyb21Qb2ludCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQ7XG4gICAgZnVuY3Rpb24gZWxlbWVudEZyb21Qb2ludChzZWxmLCBkb2N1bWVudCwgeCwgeSkge1xuICAgICAgc2NvcGUucmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgdmFyIGVsZW1lbnQgPSB3cmFwKG9yaWdpbmFsRWxlbWVudEZyb21Qb2ludC5jYWxsKHVuc2FmZVVud3JhcChkb2N1bWVudCksIHgsIHkpKTtcbiAgICAgIGlmICghZWxlbWVudCkgcmV0dXJuIG51bGw7XG4gICAgICB2YXIgcGF0aCA9IGdldEV2ZW50UGF0aChlbGVtZW50LCBudWxsKTtcbiAgICAgIHZhciBpZHggPSBwYXRoLmxhc3RJbmRleE9mKHNlbGYpO1xuICAgICAgaWYgKGlkeCA9PSAtMSkgcmV0dXJuIG51bGw7IGVsc2UgcGF0aCA9IHBhdGguc2xpY2UoMCwgaWR4KTtcbiAgICAgIHJldHVybiBldmVudFJldGFyZ2V0dGluZyhwYXRoLCBzZWxmKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0RXZlbnRIYW5kbGVyR2V0dGVyKG5hbWUpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlubGluZUV2ZW50SGFuZGxlcnMgPSBldmVudEhhbmRsZXJzVGFibGUuZ2V0KHRoaXMpO1xuICAgICAgICByZXR1cm4gaW5saW5lRXZlbnRIYW5kbGVycyAmJiBpbmxpbmVFdmVudEhhbmRsZXJzW25hbWVdICYmIGlubGluZUV2ZW50SGFuZGxlcnNbbmFtZV0udmFsdWUgfHwgbnVsbDtcbiAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldEV2ZW50SGFuZGxlclNldHRlcihuYW1lKSB7XG4gICAgICB2YXIgZXZlbnRUeXBlID0gbmFtZS5zbGljZSgyKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB2YXIgaW5saW5lRXZlbnRIYW5kbGVycyA9IGV2ZW50SGFuZGxlcnNUYWJsZS5nZXQodGhpcyk7XG4gICAgICAgIGlmICghaW5saW5lRXZlbnRIYW5kbGVycykge1xuICAgICAgICAgIGlubGluZUV2ZW50SGFuZGxlcnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICAgIGV2ZW50SGFuZGxlcnNUYWJsZS5zZXQodGhpcywgaW5saW5lRXZlbnRIYW5kbGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9sZCA9IGlubGluZUV2ZW50SGFuZGxlcnNbbmFtZV07XG4gICAgICAgIGlmIChvbGQpIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIG9sZC53cmFwcGVkLCBmYWxzZSk7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIHZhciB3cmFwcGVkID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHJ2ID0gdmFsdWUuY2FsbCh0aGlzLCBlKTtcbiAgICAgICAgICAgIGlmIChydiA9PT0gZmFsc2UpIGUucHJldmVudERlZmF1bHQoKTsgZWxzZSBpZiAobmFtZSA9PT0gXCJvbmJlZm9yZXVubG9hZFwiICYmIHR5cGVvZiBydiA9PT0gXCJzdHJpbmdcIikgZS5yZXR1cm5WYWx1ZSA9IHJ2O1xuICAgICAgICAgIH07XG4gICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgd3JhcHBlZCwgZmFsc2UpO1xuICAgICAgICAgIGlubGluZUV2ZW50SGFuZGxlcnNbbmFtZV0gPSB7XG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICB3cmFwcGVkOiB3cmFwcGVkXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gICAgc2NvcGUuZWxlbWVudEZyb21Qb2ludCA9IGVsZW1lbnRGcm9tUG9pbnQ7XG4gICAgc2NvcGUuZ2V0RXZlbnRIYW5kbGVyR2V0dGVyID0gZ2V0RXZlbnRIYW5kbGVyR2V0dGVyO1xuICAgIHNjb3BlLmdldEV2ZW50SGFuZGxlclNldHRlciA9IGdldEV2ZW50SGFuZGxlclNldHRlcjtcbiAgICBzY29wZS53cmFwRXZlbnRUYXJnZXRNZXRob2RzID0gd3JhcEV2ZW50VGFyZ2V0TWV0aG9kcztcbiAgICBzY29wZS53cmFwcGVycy5CZWZvcmVVbmxvYWRFdmVudCA9IEJlZm9yZVVubG9hZEV2ZW50O1xuICAgIHNjb3BlLndyYXBwZXJzLkN1c3RvbUV2ZW50ID0gQ3VzdG9tRXZlbnQ7XG4gICAgc2NvcGUud3JhcHBlcnMuRXZlbnQgPSBFdmVudDtcbiAgICBzY29wZS53cmFwcGVycy5FdmVudFRhcmdldCA9IEV2ZW50VGFyZ2V0O1xuICAgIHNjb3BlLndyYXBwZXJzLkZvY3VzRXZlbnQgPSBGb2N1c0V2ZW50O1xuICAgIHNjb3BlLndyYXBwZXJzLk1vdXNlRXZlbnQgPSBNb3VzZUV2ZW50O1xuICAgIHNjb3BlLndyYXBwZXJzLlVJRXZlbnQgPSBVSUV2ZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgVUlFdmVudCA9IHNjb3BlLndyYXBwZXJzLlVJRXZlbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgc2V0V3JhcHBlciA9IHNjb3BlLnNldFdyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsVG91Y2hFdmVudCA9IHdpbmRvdy5Ub3VjaEV2ZW50O1xuICAgIGlmICghT3JpZ2luYWxUb3VjaEV2ZW50KSByZXR1cm47XG4gICAgdmFyIG5hdGl2ZUV2ZW50O1xuICAgIHRyeSB7XG4gICAgICBuYXRpdmVFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiVG91Y2hFdmVudFwiKTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbm9uRW51bURlc2NyaXB0b3IgPSB7XG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICAgIH07XG4gICAgZnVuY3Rpb24gbm9uRW51bShvYmosIHByb3ApIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIHByb3AsIG5vbkVudW1EZXNjcmlwdG9yKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gVG91Y2goaW1wbCkge1xuICAgICAgc2V0V3JhcHBlcihpbXBsLCB0aGlzKTtcbiAgICB9XG4gICAgVG91Y2gucHJvdG90eXBlID0ge1xuICAgICAgZ2V0IHRhcmdldCgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLnRhcmdldCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgZGVzY3IgPSB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBudWxsXG4gICAgfTtcbiAgICBbIFwiY2xpZW50WFwiLCBcImNsaWVudFlcIiwgXCJzY3JlZW5YXCIsIFwic2NyZWVuWVwiLCBcInBhZ2VYXCIsIFwicGFnZVlcIiwgXCJpZGVudGlmaWVyXCIsIFwid2Via2l0UmFkaXVzWFwiLCBcIndlYmtpdFJhZGl1c1lcIiwgXCJ3ZWJraXRSb3RhdGlvbkFuZ2xlXCIsIFwid2Via2l0Rm9yY2VcIiBdLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgZGVzY3IuZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcylbbmFtZV07XG4gICAgICB9O1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFRvdWNoLnByb3RvdHlwZSwgbmFtZSwgZGVzY3IpO1xuICAgIH0pO1xuICAgIGZ1bmN0aW9uIFRvdWNoTGlzdCgpIHtcbiAgICAgIHRoaXMubGVuZ3RoID0gMDtcbiAgICAgIG5vbkVudW0odGhpcywgXCJsZW5ndGhcIik7XG4gICAgfVxuICAgIFRvdWNoTGlzdC5wcm90b3R5cGUgPSB7XG4gICAgICBpdGVtOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpc1tpbmRleF07XG4gICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiB3cmFwVG91Y2hMaXN0KG5hdGl2ZVRvdWNoTGlzdCkge1xuICAgICAgdmFyIGxpc3QgPSBuZXcgVG91Y2hMaXN0KCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hdGl2ZVRvdWNoTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBsaXN0W2ldID0gbmV3IFRvdWNoKG5hdGl2ZVRvdWNoTGlzdFtpXSk7XG4gICAgICB9XG4gICAgICBsaXN0Lmxlbmd0aCA9IGk7XG4gICAgICByZXR1cm4gbGlzdDtcbiAgICB9XG4gICAgZnVuY3Rpb24gVG91Y2hFdmVudChpbXBsKSB7XG4gICAgICBVSUV2ZW50LmNhbGwodGhpcywgaW1wbCk7XG4gICAgfVxuICAgIFRvdWNoRXZlbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUV2ZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oVG91Y2hFdmVudC5wcm90b3R5cGUsIHtcbiAgICAgIGdldCB0b3VjaGVzKCkge1xuICAgICAgICByZXR1cm4gd3JhcFRvdWNoTGlzdCh1bnNhZmVVbndyYXAodGhpcykudG91Y2hlcyk7XG4gICAgICB9LFxuICAgICAgZ2V0IHRhcmdldFRvdWNoZXMoKSB7XG4gICAgICAgIHJldHVybiB3cmFwVG91Y2hMaXN0KHVuc2FmZVVud3JhcCh0aGlzKS50YXJnZXRUb3VjaGVzKTtcbiAgICAgIH0sXG4gICAgICBnZXQgY2hhbmdlZFRvdWNoZXMoKSB7XG4gICAgICAgIHJldHVybiB3cmFwVG91Y2hMaXN0KHVuc2FmZVVud3JhcCh0aGlzKS5jaGFuZ2VkVG91Y2hlcyk7XG4gICAgICB9LFxuICAgICAgaW5pdFRvdWNoRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsVG91Y2hFdmVudCwgVG91Y2hFdmVudCwgbmF0aXZlRXZlbnQpO1xuICAgIHNjb3BlLndyYXBwZXJzLlRvdWNoID0gVG91Y2g7XG4gICAgc2NvcGUud3JhcHBlcnMuVG91Y2hFdmVudCA9IFRvdWNoRXZlbnQ7XG4gICAgc2NvcGUud3JhcHBlcnMuVG91Y2hMaXN0ID0gVG91Y2hMaXN0O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgbm9uRW51bURlc2NyaXB0b3IgPSB7XG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICAgIH07XG4gICAgZnVuY3Rpb24gbm9uRW51bShvYmosIHByb3ApIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIHByb3AsIG5vbkVudW1EZXNjcmlwdG9yKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gTm9kZUxpc3QoKSB7XG4gICAgICB0aGlzLmxlbmd0aCA9IDA7XG4gICAgICBub25FbnVtKHRoaXMsIFwibGVuZ3RoXCIpO1xuICAgIH1cbiAgICBOb2RlTGlzdC5wcm90b3R5cGUgPSB7XG4gICAgICBpdGVtOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpc1tpbmRleF07XG4gICAgICB9XG4gICAgfTtcbiAgICBub25FbnVtKE5vZGVMaXN0LnByb3RvdHlwZSwgXCJpdGVtXCIpO1xuICAgIGZ1bmN0aW9uIHdyYXBOb2RlTGlzdChsaXN0KSB7XG4gICAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4gbGlzdDtcbiAgICAgIHZhciB3cmFwcGVyTGlzdCA9IG5ldyBOb2RlTGlzdCgpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgd3JhcHBlckxpc3RbaV0gPSB3cmFwKGxpc3RbaV0pO1xuICAgICAgfVxuICAgICAgd3JhcHBlckxpc3QubGVuZ3RoID0gbGVuZ3RoO1xuICAgICAgcmV0dXJuIHdyYXBwZXJMaXN0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBhZGRXcmFwTm9kZUxpc3RNZXRob2Qod3JhcHBlckNvbnN0cnVjdG9yLCBuYW1lKSB7XG4gICAgICB3cmFwcGVyQ29uc3RydWN0b3IucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwTm9kZUxpc3QodW5zYWZlVW53cmFwKHRoaXMpW25hbWVdLmFwcGx5KHVuc2FmZVVud3JhcCh0aGlzKSwgYXJndW1lbnRzKSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBzY29wZS53cmFwcGVycy5Ob2RlTGlzdCA9IE5vZGVMaXN0O1xuICAgIHNjb3BlLmFkZFdyYXBOb2RlTGlzdE1ldGhvZCA9IGFkZFdyYXBOb2RlTGlzdE1ldGhvZDtcbiAgICBzY29wZS53cmFwTm9kZUxpc3QgPSB3cmFwTm9kZUxpc3Q7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHNjb3BlLndyYXBIVE1MQ29sbGVjdGlvbiA9IHNjb3BlLndyYXBOb2RlTGlzdDtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MQ29sbGVjdGlvbiA9IHNjb3BlLndyYXBwZXJzLk5vZGVMaXN0O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgRXZlbnRUYXJnZXQgPSBzY29wZS53cmFwcGVycy5FdmVudFRhcmdldDtcbiAgICB2YXIgTm9kZUxpc3QgPSBzY29wZS53cmFwcGVycy5Ob2RlTGlzdDtcbiAgICB2YXIgVHJlZVNjb3BlID0gc2NvcGUuVHJlZVNjb3BlO1xuICAgIHZhciBhc3NlcnQgPSBzY29wZS5hc3NlcnQ7XG4gICAgdmFyIGRlZmluZVdyYXBHZXR0ZXIgPSBzY29wZS5kZWZpbmVXcmFwR2V0dGVyO1xuICAgIHZhciBlbnF1ZXVlTXV0YXRpb24gPSBzY29wZS5lbnF1ZXVlTXV0YXRpb247XG4gICAgdmFyIGdldFRyZWVTY29wZSA9IHNjb3BlLmdldFRyZWVTY29wZTtcbiAgICB2YXIgaXNXcmFwcGVyID0gc2NvcGUuaXNXcmFwcGVyO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlclRyYW5zaWVudE9ic2VydmVycyA9IHNjb3BlLnJlZ2lzdGVyVHJhbnNpZW50T2JzZXJ2ZXJzO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHNldFRyZWVTY29wZSA9IHNjb3BlLnNldFRyZWVTY29wZTtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHVud3JhcElmTmVlZGVkID0gc2NvcGUudW53cmFwSWZOZWVkZWQ7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciB3cmFwSWZOZWVkZWQgPSBzY29wZS53cmFwSWZOZWVkZWQ7XG4gICAgdmFyIHdyYXBwZXJzID0gc2NvcGUud3JhcHBlcnM7XG4gICAgZnVuY3Rpb24gYXNzZXJ0SXNOb2RlV3JhcHBlcihub2RlKSB7XG4gICAgICBhc3NlcnQobm9kZSBpbnN0YW5jZW9mIE5vZGUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVPbmVFbGVtZW50Tm9kZUxpc3Qobm9kZSkge1xuICAgICAgdmFyIG5vZGVzID0gbmV3IE5vZGVMaXN0KCk7XG4gICAgICBub2Rlc1swXSA9IG5vZGU7XG4gICAgICBub2Rlcy5sZW5ndGggPSAxO1xuICAgICAgcmV0dXJuIG5vZGVzO1xuICAgIH1cbiAgICB2YXIgc3VycHJlc3NNdXRhdGlvbnMgPSBmYWxzZTtcbiAgICBmdW5jdGlvbiBlbnF1ZXVlUmVtb3ZhbEZvckluc2VydGVkTm9kZXMobm9kZSwgcGFyZW50LCBub2Rlcykge1xuICAgICAgZW5xdWV1ZU11dGF0aW9uKHBhcmVudCwgXCJjaGlsZExpc3RcIiwge1xuICAgICAgICByZW1vdmVkTm9kZXM6IG5vZGVzLFxuICAgICAgICBwcmV2aW91c1NpYmxpbmc6IG5vZGUucHJldmlvdXNTaWJsaW5nLFxuICAgICAgICBuZXh0U2libGluZzogbm9kZS5uZXh0U2libGluZ1xuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVucXVldWVSZW1vdmFsRm9ySW5zZXJ0ZWREb2N1bWVudEZyYWdtZW50KGRmLCBub2Rlcykge1xuICAgICAgZW5xdWV1ZU11dGF0aW9uKGRmLCBcImNoaWxkTGlzdFwiLCB7XG4gICAgICAgIHJlbW92ZWROb2Rlczogbm9kZXNcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjb2xsZWN0Tm9kZXMobm9kZSwgcGFyZW50Tm9kZSwgcHJldmlvdXNOb2RlLCBuZXh0Tm9kZSkge1xuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50KSB7XG4gICAgICAgIHZhciBub2RlcyA9IGNvbGxlY3ROb2Rlc0ZvckRvY3VtZW50RnJhZ21lbnQobm9kZSk7XG4gICAgICAgIHN1cnByZXNzTXV0YXRpb25zID0gdHJ1ZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IG5vZGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChub2Rlc1tpXSk7XG4gICAgICAgICAgbm9kZXNbaV0ucGFyZW50Tm9kZV8gPSBwYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIHN1cnByZXNzTXV0YXRpb25zID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBub2Rlc1tpXS5wcmV2aW91c1NpYmxpbmdfID0gbm9kZXNbaSAtIDFdIHx8IHByZXZpb3VzTm9kZTtcbiAgICAgICAgICBub2Rlc1tpXS5uZXh0U2libGluZ18gPSBub2Rlc1tpICsgMV0gfHwgbmV4dE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZXZpb3VzTm9kZSkgcHJldmlvdXNOb2RlLm5leHRTaWJsaW5nXyA9IG5vZGVzWzBdO1xuICAgICAgICBpZiAobmV4dE5vZGUpIG5leHROb2RlLnByZXZpb3VzU2libGluZ18gPSBub2Rlc1tub2Rlcy5sZW5ndGggLSAxXTtcbiAgICAgICAgcmV0dXJuIG5vZGVzO1xuICAgICAgfVxuICAgICAgdmFyIG5vZGVzID0gY3JlYXRlT25lRWxlbWVudE5vZGVMaXN0KG5vZGUpO1xuICAgICAgdmFyIG9sZFBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgIGlmIChvbGRQYXJlbnQpIHtcbiAgICAgICAgb2xkUGFyZW50LnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgfVxuICAgICAgbm9kZS5wYXJlbnROb2RlXyA9IHBhcmVudE5vZGU7XG4gICAgICBub2RlLnByZXZpb3VzU2libGluZ18gPSBwcmV2aW91c05vZGU7XG4gICAgICBub2RlLm5leHRTaWJsaW5nXyA9IG5leHROb2RlO1xuICAgICAgaWYgKHByZXZpb3VzTm9kZSkgcHJldmlvdXNOb2RlLm5leHRTaWJsaW5nXyA9IG5vZGU7XG4gICAgICBpZiAobmV4dE5vZGUpIG5leHROb2RlLnByZXZpb3VzU2libGluZ18gPSBub2RlO1xuICAgICAgcmV0dXJuIG5vZGVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjb2xsZWN0Tm9kZXNOYXRpdmUobm9kZSkge1xuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50KSByZXR1cm4gY29sbGVjdE5vZGVzRm9yRG9jdW1lbnRGcmFnbWVudChub2RlKTtcbiAgICAgIHZhciBub2RlcyA9IGNyZWF0ZU9uZUVsZW1lbnROb2RlTGlzdChub2RlKTtcbiAgICAgIHZhciBvbGRQYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICBpZiAob2xkUGFyZW50KSBlbnF1ZXVlUmVtb3ZhbEZvckluc2VydGVkTm9kZXMobm9kZSwgb2xkUGFyZW50LCBub2Rlcyk7XG4gICAgICByZXR1cm4gbm9kZXM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNvbGxlY3ROb2Rlc0ZvckRvY3VtZW50RnJhZ21lbnQobm9kZSkge1xuICAgICAgdmFyIG5vZGVzID0gbmV3IE5vZGVMaXN0KCk7XG4gICAgICB2YXIgaSA9IDA7XG4gICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgbm9kZXNbaSsrXSA9IGNoaWxkO1xuICAgICAgfVxuICAgICAgbm9kZXMubGVuZ3RoID0gaTtcbiAgICAgIGVucXVldWVSZW1vdmFsRm9ySW5zZXJ0ZWREb2N1bWVudEZyYWdtZW50KG5vZGUsIG5vZGVzKTtcbiAgICAgIHJldHVybiBub2RlcztcbiAgICB9XG4gICAgZnVuY3Rpb24gc25hcHNob3ROb2RlTGlzdChub2RlTGlzdCkge1xuICAgICAgcmV0dXJuIG5vZGVMaXN0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBub2RlV2FzQWRkZWQobm9kZSwgdHJlZVNjb3BlKSB7XG4gICAgICBzZXRUcmVlU2NvcGUobm9kZSwgdHJlZVNjb3BlKTtcbiAgICAgIG5vZGUubm9kZUlzSW5zZXJ0ZWRfKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5vZGVzV2VyZUFkZGVkKG5vZGVzLCBwYXJlbnQpIHtcbiAgICAgIHZhciB0cmVlU2NvcGUgPSBnZXRUcmVlU2NvcGUocGFyZW50KTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbm9kZVdhc0FkZGVkKG5vZGVzW2ldLCB0cmVlU2NvcGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBub2RlV2FzUmVtb3ZlZChub2RlKSB7XG4gICAgICBzZXRUcmVlU2NvcGUobm9kZSwgbmV3IFRyZWVTY29wZShub2RlLCBudWxsKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5vZGVzV2VyZVJlbW92ZWQobm9kZXMpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbm9kZVdhc1JlbW92ZWQobm9kZXNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBlbnN1cmVTYW1lT3duZXJEb2N1bWVudChwYXJlbnQsIGNoaWxkKSB7XG4gICAgICB2YXIgb3duZXJEb2MgPSBwYXJlbnQubm9kZVR5cGUgPT09IE5vZGUuRE9DVU1FTlRfTk9ERSA/IHBhcmVudCA6IHBhcmVudC5vd25lckRvY3VtZW50O1xuICAgICAgaWYgKG93bmVyRG9jICE9PSBjaGlsZC5vd25lckRvY3VtZW50KSBvd25lckRvYy5hZG9wdE5vZGUoY2hpbGQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhZG9wdE5vZGVzSWZOZWVkZWQob3duZXIsIG5vZGVzKSB7XG4gICAgICBpZiAoIW5vZGVzLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgdmFyIG93bmVyRG9jID0gb3duZXIub3duZXJEb2N1bWVudDtcbiAgICAgIGlmIChvd25lckRvYyA9PT0gbm9kZXNbMF0ub3duZXJEb2N1bWVudCkgcmV0dXJuO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBzY29wZS5hZG9wdE5vZGVOb1JlbW92ZShub2Rlc1tpXSwgb3duZXJEb2MpO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiB1bndyYXBOb2Rlc0Zvckluc2VydGlvbihvd25lciwgbm9kZXMpIHtcbiAgICAgIGFkb3B0Tm9kZXNJZk5lZWRlZChvd25lciwgbm9kZXMpO1xuICAgICAgdmFyIGxlbmd0aCA9IG5vZGVzLmxlbmd0aDtcbiAgICAgIGlmIChsZW5ndGggPT09IDEpIHJldHVybiB1bndyYXAobm9kZXNbMF0pO1xuICAgICAgdmFyIGRmID0gdW53cmFwKG93bmVyLm93bmVyRG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGYuYXBwZW5kQ2hpbGQodW53cmFwKG5vZGVzW2ldKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGY7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNsZWFyQ2hpbGROb2Rlcyh3cmFwcGVyKSB7XG4gICAgICBpZiAod3JhcHBlci5maXJzdENoaWxkXyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IHdyYXBwZXIuZmlyc3RDaGlsZF87XG4gICAgICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgICAgIHZhciB0bXAgPSBjaGlsZDtcbiAgICAgICAgICBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nXztcbiAgICAgICAgICB0bXAucGFyZW50Tm9kZV8gPSB0bXAucHJldmlvdXNTaWJsaW5nXyA9IHRtcC5uZXh0U2libGluZ18gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHdyYXBwZXIuZmlyc3RDaGlsZF8gPSB3cmFwcGVyLmxhc3RDaGlsZF8gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZUFsbENoaWxkTm9kZXMod3JhcHBlcikge1xuICAgICAgaWYgKHdyYXBwZXIuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKCkpIHtcbiAgICAgICAgdmFyIGNoaWxkV3JhcHBlciA9IHdyYXBwZXIuZmlyc3RDaGlsZDtcbiAgICAgICAgd2hpbGUgKGNoaWxkV3JhcHBlcikge1xuICAgICAgICAgIGFzc2VydChjaGlsZFdyYXBwZXIucGFyZW50Tm9kZSA9PT0gd3JhcHBlcik7XG4gICAgICAgICAgdmFyIG5leHRTaWJsaW5nID0gY2hpbGRXcmFwcGVyLm5leHRTaWJsaW5nO1xuICAgICAgICAgIHZhciBjaGlsZE5vZGUgPSB1bndyYXAoY2hpbGRXcmFwcGVyKTtcbiAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGNoaWxkTm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgIGlmIChwYXJlbnROb2RlKSBvcmlnaW5hbFJlbW92ZUNoaWxkLmNhbGwocGFyZW50Tm9kZSwgY2hpbGROb2RlKTtcbiAgICAgICAgICBjaGlsZFdyYXBwZXIucHJldmlvdXNTaWJsaW5nXyA9IGNoaWxkV3JhcHBlci5uZXh0U2libGluZ18gPSBjaGlsZFdyYXBwZXIucGFyZW50Tm9kZV8gPSBudWxsO1xuICAgICAgICAgIGNoaWxkV3JhcHBlciA9IG5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgICAgIHdyYXBwZXIuZmlyc3RDaGlsZF8gPSB3cmFwcGVyLmxhc3RDaGlsZF8gPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG5vZGUgPSB1bndyYXAod3JhcHBlcik7XG4gICAgICAgIHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDtcbiAgICAgICAgdmFyIG5leHRTaWJsaW5nO1xuICAgICAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgICAgICBuZXh0U2libGluZyA9IGNoaWxkLm5leHRTaWJsaW5nO1xuICAgICAgICAgIG9yaWdpbmFsUmVtb3ZlQ2hpbGQuY2FsbChub2RlLCBjaGlsZCk7XG4gICAgICAgICAgY2hpbGQgPSBuZXh0U2libGluZztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBpbnZhbGlkYXRlUGFyZW50KG5vZGUpIHtcbiAgICAgIHZhciBwID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgcmV0dXJuIHAgJiYgcC5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY2xlYW51cE5vZGVzKG5vZGVzKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbjsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG4gPSBub2Rlc1tpXTtcbiAgICAgICAgbi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG4pO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgb3JpZ2luYWxJbXBvcnROb2RlID0gZG9jdW1lbnQuaW1wb3J0Tm9kZTtcbiAgICB2YXIgb3JpZ2luYWxDbG9uZU5vZGUgPSB3aW5kb3cuTm9kZS5wcm90b3R5cGUuY2xvbmVOb2RlO1xuICAgIGZ1bmN0aW9uIGNsb25lTm9kZShub2RlLCBkZWVwLCBvcHRfZG9jKSB7XG4gICAgICB2YXIgY2xvbmU7XG4gICAgICBpZiAob3B0X2RvYykgY2xvbmUgPSB3cmFwKG9yaWdpbmFsSW1wb3J0Tm9kZS5jYWxsKG9wdF9kb2MsIHVuc2FmZVVud3JhcChub2RlKSwgZmFsc2UpKTsgZWxzZSBjbG9uZSA9IHdyYXAob3JpZ2luYWxDbG9uZU5vZGUuY2FsbCh1bnNhZmVVbndyYXAobm9kZSksIGZhbHNlKSk7XG4gICAgICBpZiAoZGVlcCkge1xuICAgICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICBjbG9uZS5hcHBlbmRDaGlsZChjbG9uZU5vZGUoY2hpbGQsIHRydWUsIG9wdF9kb2MpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIHdyYXBwZXJzLkhUTUxUZW1wbGF0ZUVsZW1lbnQpIHtcbiAgICAgICAgICB2YXIgY2xvbmVDb250ZW50ID0gY2xvbmUuY29udGVudDtcbiAgICAgICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuY29udGVudC5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgICAgY2xvbmVDb250ZW50LmFwcGVuZENoaWxkKGNsb25lTm9kZShjaGlsZCwgdHJ1ZSwgb3B0X2RvYykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjb250YWlucyhzZWxmLCBjaGlsZCkge1xuICAgICAgaWYgKCFjaGlsZCB8fCBnZXRUcmVlU2NvcGUoc2VsZikgIT09IGdldFRyZWVTY29wZShjaGlsZCkpIHJldHVybiBmYWxzZTtcbiAgICAgIGZvciAodmFyIG5vZGUgPSBjaGlsZDsgbm9kZTsgbm9kZSA9IG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICBpZiAobm9kZSA9PT0gc2VsZikgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBPcmlnaW5hbE5vZGUgPSB3aW5kb3cuTm9kZTtcbiAgICBmdW5jdGlvbiBOb2RlKG9yaWdpbmFsKSB7XG4gICAgICBhc3NlcnQob3JpZ2luYWwgaW5zdGFuY2VvZiBPcmlnaW5hbE5vZGUpO1xuICAgICAgRXZlbnRUYXJnZXQuY2FsbCh0aGlzLCBvcmlnaW5hbCk7XG4gICAgICB0aGlzLnBhcmVudE5vZGVfID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5maXJzdENoaWxkXyA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMubGFzdENoaWxkXyA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMubmV4dFNpYmxpbmdfID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5wcmV2aW91c1NpYmxpbmdfID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy50cmVlU2NvcGVfID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB2YXIgT3JpZ2luYWxEb2N1bWVudEZyYWdtZW50ID0gd2luZG93LkRvY3VtZW50RnJhZ21lbnQ7XG4gICAgdmFyIG9yaWdpbmFsQXBwZW5kQ2hpbGQgPSBPcmlnaW5hbE5vZGUucHJvdG90eXBlLmFwcGVuZENoaWxkO1xuICAgIHZhciBvcmlnaW5hbENvbXBhcmVEb2N1bWVudFBvc2l0aW9uID0gT3JpZ2luYWxOb2RlLnByb3RvdHlwZS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbjtcbiAgICB2YXIgb3JpZ2luYWxJc0VxdWFsTm9kZSA9IE9yaWdpbmFsTm9kZS5wcm90b3R5cGUuaXNFcXVhbE5vZGU7XG4gICAgdmFyIG9yaWdpbmFsSW5zZXJ0QmVmb3JlID0gT3JpZ2luYWxOb2RlLnByb3RvdHlwZS5pbnNlcnRCZWZvcmU7XG4gICAgdmFyIG9yaWdpbmFsUmVtb3ZlQ2hpbGQgPSBPcmlnaW5hbE5vZGUucHJvdG90eXBlLnJlbW92ZUNoaWxkO1xuICAgIHZhciBvcmlnaW5hbFJlcGxhY2VDaGlsZCA9IE9yaWdpbmFsTm9kZS5wcm90b3R5cGUucmVwbGFjZUNoaWxkO1xuICAgIHZhciBpc0lFT3JFZGdlID0gL1RyaWRlbnR8RWRnZS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgICB2YXIgcmVtb3ZlQ2hpbGRPcmlnaW5hbEhlbHBlciA9IGlzSUVPckVkZ2UgPyBmdW5jdGlvbihwYXJlbnQsIGNoaWxkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBvcmlnaW5hbFJlbW92ZUNoaWxkLmNhbGwocGFyZW50LCBjaGlsZCk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBpZiAoIShwYXJlbnQgaW5zdGFuY2VvZiBPcmlnaW5hbERvY3VtZW50RnJhZ21lbnQpKSB0aHJvdyBleDtcbiAgICAgIH1cbiAgICB9IDogZnVuY3Rpb24ocGFyZW50LCBjaGlsZCkge1xuICAgICAgb3JpZ2luYWxSZW1vdmVDaGlsZC5jYWxsKHBhcmVudCwgY2hpbGQpO1xuICAgIH07XG4gICAgTm9kZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50VGFyZ2V0LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oTm9kZS5wcm90b3R5cGUsIHtcbiAgICAgIGFwcGVuZENoaWxkOiBmdW5jdGlvbihjaGlsZFdyYXBwZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5zZXJ0QmVmb3JlKGNoaWxkV3JhcHBlciwgbnVsbCk7XG4gICAgICB9LFxuICAgICAgaW5zZXJ0QmVmb3JlOiBmdW5jdGlvbihjaGlsZFdyYXBwZXIsIHJlZldyYXBwZXIpIHtcbiAgICAgICAgYXNzZXJ0SXNOb2RlV3JhcHBlcihjaGlsZFdyYXBwZXIpO1xuICAgICAgICB2YXIgcmVmTm9kZTtcbiAgICAgICAgaWYgKHJlZldyYXBwZXIpIHtcbiAgICAgICAgICBpZiAoaXNXcmFwcGVyKHJlZldyYXBwZXIpKSB7XG4gICAgICAgICAgICByZWZOb2RlID0gdW53cmFwKHJlZldyYXBwZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWZOb2RlID0gcmVmV3JhcHBlcjtcbiAgICAgICAgICAgIHJlZldyYXBwZXIgPSB3cmFwKHJlZk5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWZXcmFwcGVyID0gbnVsbDtcbiAgICAgICAgICByZWZOb2RlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZWZXcmFwcGVyICYmIGFzc2VydChyZWZXcmFwcGVyLnBhcmVudE5vZGUgPT09IHRoaXMpO1xuICAgICAgICB2YXIgbm9kZXM7XG4gICAgICAgIHZhciBwcmV2aW91c05vZGUgPSByZWZXcmFwcGVyID8gcmVmV3JhcHBlci5wcmV2aW91c1NpYmxpbmcgOiB0aGlzLmxhc3RDaGlsZDtcbiAgICAgICAgdmFyIHVzZU5hdGl2ZSA9ICF0aGlzLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcigpICYmICFpbnZhbGlkYXRlUGFyZW50KGNoaWxkV3JhcHBlcik7XG4gICAgICAgIGlmICh1c2VOYXRpdmUpIG5vZGVzID0gY29sbGVjdE5vZGVzTmF0aXZlKGNoaWxkV3JhcHBlcik7IGVsc2Ugbm9kZXMgPSBjb2xsZWN0Tm9kZXMoY2hpbGRXcmFwcGVyLCB0aGlzLCBwcmV2aW91c05vZGUsIHJlZldyYXBwZXIpO1xuICAgICAgICBpZiAodXNlTmF0aXZlKSB7XG4gICAgICAgICAgZW5zdXJlU2FtZU93bmVyRG9jdW1lbnQodGhpcywgY2hpbGRXcmFwcGVyKTtcbiAgICAgICAgICBjbGVhckNoaWxkTm9kZXModGhpcyk7XG4gICAgICAgICAgb3JpZ2luYWxJbnNlcnRCZWZvcmUuY2FsbCh1bnNhZmVVbndyYXAodGhpcyksIHVud3JhcChjaGlsZFdyYXBwZXIpLCByZWZOb2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIXByZXZpb3VzTm9kZSkgdGhpcy5maXJzdENoaWxkXyA9IG5vZGVzWzBdO1xuICAgICAgICAgIGlmICghcmVmV3JhcHBlcikge1xuICAgICAgICAgICAgdGhpcy5sYXN0Q2hpbGRfID0gbm9kZXNbbm9kZXMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAodGhpcy5maXJzdENoaWxkXyA9PT0gdW5kZWZpbmVkKSB0aGlzLmZpcnN0Q2hpbGRfID0gdGhpcy5maXJzdENoaWxkO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IHJlZk5vZGUgPyByZWZOb2RlLnBhcmVudE5vZGUgOiB1bnNhZmVVbndyYXAodGhpcyk7XG4gICAgICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIG9yaWdpbmFsSW5zZXJ0QmVmb3JlLmNhbGwocGFyZW50Tm9kZSwgdW53cmFwTm9kZXNGb3JJbnNlcnRpb24odGhpcywgbm9kZXMpLCByZWZOb2RlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWRvcHROb2Rlc0lmTmVlZGVkKHRoaXMsIG5vZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZW5xdWV1ZU11dGF0aW9uKHRoaXMsIFwiY2hpbGRMaXN0XCIsIHtcbiAgICAgICAgICBhZGRlZE5vZGVzOiBub2RlcyxcbiAgICAgICAgICBuZXh0U2libGluZzogcmVmV3JhcHBlcixcbiAgICAgICAgICBwcmV2aW91c1NpYmxpbmc6IHByZXZpb3VzTm9kZVxuICAgICAgICB9KTtcbiAgICAgICAgbm9kZXNXZXJlQWRkZWQobm9kZXMsIHRoaXMpO1xuICAgICAgICByZXR1cm4gY2hpbGRXcmFwcGVyO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZUNoaWxkOiBmdW5jdGlvbihjaGlsZFdyYXBwZXIpIHtcbiAgICAgICAgYXNzZXJ0SXNOb2RlV3JhcHBlcihjaGlsZFdyYXBwZXIpO1xuICAgICAgICBpZiAoY2hpbGRXcmFwcGVyLnBhcmVudE5vZGUgIT09IHRoaXMpIHtcbiAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICB2YXIgY2hpbGROb2RlcyA9IHRoaXMuY2hpbGROb2RlcztcbiAgICAgICAgICBmb3IgKHZhciBpZUNoaWxkID0gdGhpcy5maXJzdENoaWxkOyBpZUNoaWxkOyBpZUNoaWxkID0gaWVDaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgICAgaWYgKGllQ2hpbGQgPT09IGNoaWxkV3JhcHBlcikge1xuICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3RGb3VuZEVycm9yXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgY2hpbGROb2RlID0gdW53cmFwKGNoaWxkV3JhcHBlcik7XG4gICAgICAgIHZhciBjaGlsZFdyYXBwZXJOZXh0U2libGluZyA9IGNoaWxkV3JhcHBlci5uZXh0U2libGluZztcbiAgICAgICAgdmFyIGNoaWxkV3JhcHBlclByZXZpb3VzU2libGluZyA9IGNoaWxkV3JhcHBlci5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgIGlmICh0aGlzLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcigpKSB7XG4gICAgICAgICAgdmFyIHRoaXNGaXJzdENoaWxkID0gdGhpcy5maXJzdENoaWxkO1xuICAgICAgICAgIHZhciB0aGlzTGFzdENoaWxkID0gdGhpcy5sYXN0Q2hpbGQ7XG4gICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBjaGlsZE5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICBpZiAocGFyZW50Tm9kZSkgcmVtb3ZlQ2hpbGRPcmlnaW5hbEhlbHBlcihwYXJlbnROb2RlLCBjaGlsZE5vZGUpO1xuICAgICAgICAgIGlmICh0aGlzRmlyc3RDaGlsZCA9PT0gY2hpbGRXcmFwcGVyKSB0aGlzLmZpcnN0Q2hpbGRfID0gY2hpbGRXcmFwcGVyTmV4dFNpYmxpbmc7XG4gICAgICAgICAgaWYgKHRoaXNMYXN0Q2hpbGQgPT09IGNoaWxkV3JhcHBlcikgdGhpcy5sYXN0Q2hpbGRfID0gY2hpbGRXcmFwcGVyUHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgIGlmIChjaGlsZFdyYXBwZXJQcmV2aW91c1NpYmxpbmcpIGNoaWxkV3JhcHBlclByZXZpb3VzU2libGluZy5uZXh0U2libGluZ18gPSBjaGlsZFdyYXBwZXJOZXh0U2libGluZztcbiAgICAgICAgICBpZiAoY2hpbGRXcmFwcGVyTmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICAgIGNoaWxkV3JhcHBlck5leHRTaWJsaW5nLnByZXZpb3VzU2libGluZ18gPSBjaGlsZFdyYXBwZXJQcmV2aW91c1NpYmxpbmc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNoaWxkV3JhcHBlci5wcmV2aW91c1NpYmxpbmdfID0gY2hpbGRXcmFwcGVyLm5leHRTaWJsaW5nXyA9IGNoaWxkV3JhcHBlci5wYXJlbnROb2RlXyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjbGVhckNoaWxkTm9kZXModGhpcyk7XG4gICAgICAgICAgcmVtb3ZlQ2hpbGRPcmlnaW5hbEhlbHBlcih1bnNhZmVVbndyYXAodGhpcyksIGNoaWxkTm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzdXJwcmVzc011dGF0aW9ucykge1xuICAgICAgICAgIGVucXVldWVNdXRhdGlvbih0aGlzLCBcImNoaWxkTGlzdFwiLCB7XG4gICAgICAgICAgICByZW1vdmVkTm9kZXM6IGNyZWF0ZU9uZUVsZW1lbnROb2RlTGlzdChjaGlsZFdyYXBwZXIpLFxuICAgICAgICAgICAgbmV4dFNpYmxpbmc6IGNoaWxkV3JhcHBlck5leHRTaWJsaW5nLFxuICAgICAgICAgICAgcHJldmlvdXNTaWJsaW5nOiBjaGlsZFdyYXBwZXJQcmV2aW91c1NpYmxpbmdcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZWdpc3RlclRyYW5zaWVudE9ic2VydmVycyh0aGlzLCBjaGlsZFdyYXBwZXIpO1xuICAgICAgICByZXR1cm4gY2hpbGRXcmFwcGVyO1xuICAgICAgfSxcbiAgICAgIHJlcGxhY2VDaGlsZDogZnVuY3Rpb24obmV3Q2hpbGRXcmFwcGVyLCBvbGRDaGlsZFdyYXBwZXIpIHtcbiAgICAgICAgYXNzZXJ0SXNOb2RlV3JhcHBlcihuZXdDaGlsZFdyYXBwZXIpO1xuICAgICAgICB2YXIgb2xkQ2hpbGROb2RlO1xuICAgICAgICBpZiAoaXNXcmFwcGVyKG9sZENoaWxkV3JhcHBlcikpIHtcbiAgICAgICAgICBvbGRDaGlsZE5vZGUgPSB1bndyYXAob2xkQ2hpbGRXcmFwcGVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvbGRDaGlsZE5vZGUgPSBvbGRDaGlsZFdyYXBwZXI7XG4gICAgICAgICAgb2xkQ2hpbGRXcmFwcGVyID0gd3JhcChvbGRDaGlsZE5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvbGRDaGlsZFdyYXBwZXIucGFyZW50Tm9kZSAhPT0gdGhpcykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdEZvdW5kRXJyb3JcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5leHROb2RlID0gb2xkQ2hpbGRXcmFwcGVyLm5leHRTaWJsaW5nO1xuICAgICAgICB2YXIgcHJldmlvdXNOb2RlID0gb2xkQ2hpbGRXcmFwcGVyLnByZXZpb3VzU2libGluZztcbiAgICAgICAgdmFyIG5vZGVzO1xuICAgICAgICB2YXIgdXNlTmF0aXZlID0gIXRoaXMuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKCkgJiYgIWludmFsaWRhdGVQYXJlbnQobmV3Q2hpbGRXcmFwcGVyKTtcbiAgICAgICAgaWYgKHVzZU5hdGl2ZSkge1xuICAgICAgICAgIG5vZGVzID0gY29sbGVjdE5vZGVzTmF0aXZlKG5ld0NoaWxkV3JhcHBlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG5leHROb2RlID09PSBuZXdDaGlsZFdyYXBwZXIpIG5leHROb2RlID0gbmV3Q2hpbGRXcmFwcGVyLm5leHRTaWJsaW5nO1xuICAgICAgICAgIG5vZGVzID0gY29sbGVjdE5vZGVzKG5ld0NoaWxkV3JhcHBlciwgdGhpcywgcHJldmlvdXNOb2RlLCBuZXh0Tm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF1c2VOYXRpdmUpIHtcbiAgICAgICAgICBpZiAodGhpcy5maXJzdENoaWxkID09PSBvbGRDaGlsZFdyYXBwZXIpIHRoaXMuZmlyc3RDaGlsZF8gPSBub2Rlc1swXTtcbiAgICAgICAgICBpZiAodGhpcy5sYXN0Q2hpbGQgPT09IG9sZENoaWxkV3JhcHBlcikgdGhpcy5sYXN0Q2hpbGRfID0gbm9kZXNbbm9kZXMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgb2xkQ2hpbGRXcmFwcGVyLnByZXZpb3VzU2libGluZ18gPSBvbGRDaGlsZFdyYXBwZXIubmV4dFNpYmxpbmdfID0gb2xkQ2hpbGRXcmFwcGVyLnBhcmVudE5vZGVfID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChvbGRDaGlsZE5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgb3JpZ2luYWxSZXBsYWNlQ2hpbGQuY2FsbChvbGRDaGlsZE5vZGUucGFyZW50Tm9kZSwgdW53cmFwTm9kZXNGb3JJbnNlcnRpb24odGhpcywgbm9kZXMpLCBvbGRDaGlsZE5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnN1cmVTYW1lT3duZXJEb2N1bWVudCh0aGlzLCBuZXdDaGlsZFdyYXBwZXIpO1xuICAgICAgICAgIGNsZWFyQ2hpbGROb2Rlcyh0aGlzKTtcbiAgICAgICAgICBvcmlnaW5hbFJlcGxhY2VDaGlsZC5jYWxsKHVuc2FmZVVud3JhcCh0aGlzKSwgdW53cmFwKG5ld0NoaWxkV3JhcHBlciksIG9sZENoaWxkTm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgZW5xdWV1ZU11dGF0aW9uKHRoaXMsIFwiY2hpbGRMaXN0XCIsIHtcbiAgICAgICAgICBhZGRlZE5vZGVzOiBub2RlcyxcbiAgICAgICAgICByZW1vdmVkTm9kZXM6IGNyZWF0ZU9uZUVsZW1lbnROb2RlTGlzdChvbGRDaGlsZFdyYXBwZXIpLFxuICAgICAgICAgIG5leHRTaWJsaW5nOiBuZXh0Tm9kZSxcbiAgICAgICAgICBwcmV2aW91c1NpYmxpbmc6IHByZXZpb3VzTm9kZVxuICAgICAgICB9KTtcbiAgICAgICAgbm9kZVdhc1JlbW92ZWQob2xkQ2hpbGRXcmFwcGVyKTtcbiAgICAgICAgbm9kZXNXZXJlQWRkZWQobm9kZXMsIHRoaXMpO1xuICAgICAgICByZXR1cm4gb2xkQ2hpbGRXcmFwcGVyO1xuICAgICAgfSxcbiAgICAgIG5vZGVJc0luc2VydGVkXzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGNoaWxkID0gdGhpcy5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgIGNoaWxkLm5vZGVJc0luc2VydGVkXygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgaGFzQ2hpbGROb2RlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpcnN0Q2hpbGQgIT09IG51bGw7XG4gICAgICB9LFxuICAgICAgZ2V0IHBhcmVudE5vZGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudE5vZGVfICE9PSB1bmRlZmluZWQgPyB0aGlzLnBhcmVudE5vZGVfIDogd3JhcCh1bnNhZmVVbndyYXAodGhpcykucGFyZW50Tm9kZSk7XG4gICAgICB9LFxuICAgICAgZ2V0IGZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpcnN0Q2hpbGRfICE9PSB1bmRlZmluZWQgPyB0aGlzLmZpcnN0Q2hpbGRfIDogd3JhcCh1bnNhZmVVbndyYXAodGhpcykuZmlyc3RDaGlsZCk7XG4gICAgICB9LFxuICAgICAgZ2V0IGxhc3RDaGlsZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdENoaWxkXyAhPT0gdW5kZWZpbmVkID8gdGhpcy5sYXN0Q2hpbGRfIDogd3JhcCh1bnNhZmVVbndyYXAodGhpcykubGFzdENoaWxkKTtcbiAgICAgIH0sXG4gICAgICBnZXQgbmV4dFNpYmxpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5leHRTaWJsaW5nXyAhPT0gdW5kZWZpbmVkID8gdGhpcy5uZXh0U2libGluZ18gOiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5uZXh0U2libGluZyk7XG4gICAgICB9LFxuICAgICAgZ2V0IHByZXZpb3VzU2libGluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJldmlvdXNTaWJsaW5nXyAhPT0gdW5kZWZpbmVkID8gdGhpcy5wcmV2aW91c1NpYmxpbmdfIDogd3JhcCh1bnNhZmVVbndyYXAodGhpcykucHJldmlvdXNTaWJsaW5nKTtcbiAgICAgIH0sXG4gICAgICBnZXQgcGFyZW50RWxlbWVudCgpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgICAgIHdoaWxlIChwICYmIHAubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgcCA9IHAucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcDtcbiAgICAgIH0sXG4gICAgICBnZXQgdGV4dENvbnRlbnQoKSB7XG4gICAgICAgIHZhciBzID0gXCJcIjtcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgPSB0aGlzLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlICE9IE5vZGUuQ09NTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICBzICs9IGNoaWxkLnRleHRDb250ZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcztcbiAgICAgIH0sXG4gICAgICBzZXQgdGV4dENvbnRlbnQodGV4dENvbnRlbnQpIHtcbiAgICAgICAgaWYgKHRleHRDb250ZW50ID09IG51bGwpIHRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgICAgdmFyIHJlbW92ZWROb2RlcyA9IHNuYXBzaG90Tm9kZUxpc3QodGhpcy5jaGlsZE5vZGVzKTtcbiAgICAgICAgaWYgKHRoaXMuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKCkpIHtcbiAgICAgICAgICByZW1vdmVBbGxDaGlsZE5vZGVzKHRoaXMpO1xuICAgICAgICAgIGlmICh0ZXh0Q29udGVudCAhPT0gXCJcIikge1xuICAgICAgICAgICAgdmFyIHRleHROb2RlID0gdW5zYWZlVW53cmFwKHRoaXMpLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0ZXh0Tm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNsZWFyQ2hpbGROb2Rlcyh0aGlzKTtcbiAgICAgICAgICB1bnNhZmVVbndyYXAodGhpcykudGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYWRkZWROb2RlcyA9IHNuYXBzaG90Tm9kZUxpc3QodGhpcy5jaGlsZE5vZGVzKTtcbiAgICAgICAgZW5xdWV1ZU11dGF0aW9uKHRoaXMsIFwiY2hpbGRMaXN0XCIsIHtcbiAgICAgICAgICBhZGRlZE5vZGVzOiBhZGRlZE5vZGVzLFxuICAgICAgICAgIHJlbW92ZWROb2RlczogcmVtb3ZlZE5vZGVzXG4gICAgICAgIH0pO1xuICAgICAgICBub2Rlc1dlcmVSZW1vdmVkKHJlbW92ZWROb2Rlcyk7XG4gICAgICAgIG5vZGVzV2VyZUFkZGVkKGFkZGVkTm9kZXMsIHRoaXMpO1xuICAgICAgfSxcbiAgICAgIGdldCBjaGlsZE5vZGVzKCkge1xuICAgICAgICB2YXIgd3JhcHBlckxpc3QgPSBuZXcgTm9kZUxpc3QoKTtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICBmb3IgKHZhciBjaGlsZCA9IHRoaXMuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICB3cmFwcGVyTGlzdFtpKytdID0gY2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgd3JhcHBlckxpc3QubGVuZ3RoID0gaTtcbiAgICAgICAgcmV0dXJuIHdyYXBwZXJMaXN0O1xuICAgICAgfSxcbiAgICAgIGNsb25lTm9kZTogZnVuY3Rpb24oZGVlcCkge1xuICAgICAgICByZXR1cm4gY2xvbmVOb2RlKHRoaXMsIGRlZXApO1xuICAgICAgfSxcbiAgICAgIGNvbnRhaW5zOiBmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICByZXR1cm4gY29udGFpbnModGhpcywgd3JhcElmTmVlZGVkKGNoaWxkKSk7XG4gICAgICB9LFxuICAgICAgY29tcGFyZURvY3VtZW50UG9zaXRpb246IGZ1bmN0aW9uKG90aGVyTm9kZSkge1xuICAgICAgICByZXR1cm4gb3JpZ2luYWxDb21wYXJlRG9jdW1lbnRQb3NpdGlvbi5jYWxsKHVuc2FmZVVud3JhcCh0aGlzKSwgdW53cmFwSWZOZWVkZWQob3RoZXJOb2RlKSk7XG4gICAgICB9LFxuICAgICAgaXNFcXVhbE5vZGU6IGZ1bmN0aW9uKG90aGVyTm9kZSkge1xuICAgICAgICByZXR1cm4gb3JpZ2luYWxJc0VxdWFsTm9kZS5jYWxsKHVuc2FmZVVud3JhcCh0aGlzKSwgdW53cmFwSWZOZWVkZWQob3RoZXJOb2RlKSk7XG4gICAgICB9LFxuICAgICAgbm9ybWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGVzID0gc25hcHNob3ROb2RlTGlzdCh0aGlzLmNoaWxkTm9kZXMpO1xuICAgICAgICB2YXIgcmVtTm9kZXMgPSBbXTtcbiAgICAgICAgdmFyIHMgPSBcIlwiO1xuICAgICAgICB2YXIgbW9kTm9kZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG47IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIG4gPSBub2Rlc1tpXTtcbiAgICAgICAgICBpZiAobi5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgICAgIGlmICghbW9kTm9kZSAmJiAhbi5kYXRhLmxlbmd0aCkgdGhpcy5yZW1vdmVDaGlsZChuKTsgZWxzZSBpZiAoIW1vZE5vZGUpIG1vZE5vZGUgPSBuOyBlbHNlIHtcbiAgICAgICAgICAgICAgcyArPSBuLmRhdGE7XG4gICAgICAgICAgICAgIHJlbU5vZGVzLnB1c2gobik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChtb2ROb2RlICYmIHJlbU5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICBtb2ROb2RlLmRhdGEgKz0gcztcbiAgICAgICAgICAgICAgY2xlYW51cE5vZGVzKHJlbU5vZGVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlbU5vZGVzID0gW107XG4gICAgICAgICAgICBzID0gXCJcIjtcbiAgICAgICAgICAgIG1vZE5vZGUgPSBudWxsO1xuICAgICAgICAgICAgaWYgKG4uY2hpbGROb2Rlcy5sZW5ndGgpIG4ubm9ybWFsaXplKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtb2ROb2RlICYmIHJlbU5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgIG1vZE5vZGUuZGF0YSArPSBzO1xuICAgICAgICAgIGNsZWFudXBOb2RlcyhyZW1Ob2Rlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBkZWZpbmVXcmFwR2V0dGVyKE5vZGUsIFwib3duZXJEb2N1bWVudFwiKTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxOb2RlLCBOb2RlLCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpO1xuICAgIGRlbGV0ZSBOb2RlLnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yO1xuICAgIGRlbGV0ZSBOb2RlLnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yQWxsO1xuICAgIE5vZGUucHJvdG90eXBlID0gbWl4aW4oT2JqZWN0LmNyZWF0ZShFdmVudFRhcmdldC5wcm90b3R5cGUpLCBOb2RlLnByb3RvdHlwZSk7XG4gICAgc2NvcGUuY2xvbmVOb2RlID0gY2xvbmVOb2RlO1xuICAgIHNjb3BlLm5vZGVXYXNBZGRlZCA9IG5vZGVXYXNBZGRlZDtcbiAgICBzY29wZS5ub2RlV2FzUmVtb3ZlZCA9IG5vZGVXYXNSZW1vdmVkO1xuICAgIHNjb3BlLm5vZGVzV2VyZUFkZGVkID0gbm9kZXNXZXJlQWRkZWQ7XG4gICAgc2NvcGUubm9kZXNXZXJlUmVtb3ZlZCA9IG5vZGVzV2VyZVJlbW92ZWQ7XG4gICAgc2NvcGUub3JpZ2luYWxJbnNlcnRCZWZvcmUgPSBvcmlnaW5hbEluc2VydEJlZm9yZTtcbiAgICBzY29wZS5vcmlnaW5hbFJlbW92ZUNoaWxkID0gb3JpZ2luYWxSZW1vdmVDaGlsZDtcbiAgICBzY29wZS5zbmFwc2hvdE5vZGVMaXN0ID0gc25hcHNob3ROb2RlTGlzdDtcbiAgICBzY29wZS53cmFwcGVycy5Ob2RlID0gTm9kZTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxDb2xsZWN0aW9uID0gc2NvcGUud3JhcHBlcnMuSFRNTENvbGxlY3Rpb247XG4gICAgdmFyIE5vZGVMaXN0ID0gc2NvcGUud3JhcHBlcnMuTm9kZUxpc3Q7XG4gICAgdmFyIGdldFRyZWVTY29wZSA9IHNjb3BlLmdldFRyZWVTY29wZTtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgb3JpZ2luYWxEb2N1bWVudFF1ZXJ5U2VsZWN0b3IgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yO1xuICAgIHZhciBvcmlnaW5hbEVsZW1lbnRRdWVyeVNlbGVjdG9yID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3I7XG4gICAgdmFyIG9yaWdpbmFsRG9jdW1lbnRRdWVyeVNlbGVjdG9yQWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDtcbiAgICB2YXIgb3JpZ2luYWxFbGVtZW50UXVlcnlTZWxlY3RvckFsbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsO1xuICAgIHZhciBvcmlnaW5hbERvY3VtZW50R2V0RWxlbWVudHNCeVRhZ05hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZTtcbiAgICB2YXIgb3JpZ2luYWxFbGVtZW50R2V0RWxlbWVudHNCeVRhZ05hbWUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWU7XG4gICAgdmFyIG9yaWdpbmFsRG9jdW1lbnRHZXRFbGVtZW50c0J5VGFnTmFtZU5TID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWVOUztcbiAgICB2YXIgb3JpZ2luYWxFbGVtZW50R2V0RWxlbWVudHNCeVRhZ05hbWVOUyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZU5TO1xuICAgIHZhciBPcmlnaW5hbEVsZW1lbnQgPSB3aW5kb3cuRWxlbWVudDtcbiAgICB2YXIgT3JpZ2luYWxEb2N1bWVudCA9IHdpbmRvdy5IVE1MRG9jdW1lbnQgfHwgd2luZG93LkRvY3VtZW50O1xuICAgIGZ1bmN0aW9uIGZpbHRlck5vZGVMaXN0KGxpc3QsIGluZGV4LCByZXN1bHQsIGRlZXApIHtcbiAgICAgIHZhciB3cmFwcGVkSXRlbSA9IG51bGw7XG4gICAgICB2YXIgcm9vdCA9IG51bGw7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB3cmFwcGVkSXRlbSA9IHdyYXAobGlzdFtpXSk7XG4gICAgICAgIGlmICghZGVlcCAmJiAocm9vdCA9IGdldFRyZWVTY29wZSh3cmFwcGVkSXRlbSkucm9vdCkpIHtcbiAgICAgICAgICBpZiAocm9vdCBpbnN0YW5jZW9mIHNjb3BlLndyYXBwZXJzLlNoYWRvd1Jvb3QpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXN1bHRbaW5kZXgrK10gPSB3cmFwcGVkSXRlbTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2hpbVNlbGVjdG9yKHNlbGVjdG9yKSB7XG4gICAgICByZXR1cm4gU3RyaW5nKHNlbGVjdG9yKS5yZXBsYWNlKC9cXC9kZWVwXFwvfDo6c2hhZG93fD4+Pi9nLCBcIiBcIik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNoaW1NYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3IpIHtcbiAgICAgIHJldHVybiBTdHJpbmcoc2VsZWN0b3IpLnJlcGxhY2UoLzpob3N0XFwoKFteXFxzXSspXFwpL2csIFwiJDFcIikucmVwbGFjZSgvKFteXFxzXSk6aG9zdC9nLCBcIiQxXCIpLnJlcGxhY2UoXCI6aG9zdFwiLCBcIipcIikucmVwbGFjZSgvXFxefFxcL3NoYWRvd1xcL3xcXC9zaGFkb3ctZGVlcFxcL3w6OnNoYWRvd3xcXC9kZWVwXFwvfDo6Y29udGVudHw+Pj4vZywgXCIgXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmaW5kT25lKG5vZGUsIHNlbGVjdG9yKSB7XG4gICAgICB2YXIgbSwgZWwgPSBub2RlLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgd2hpbGUgKGVsKSB7XG4gICAgICAgIGlmIChlbC5tYXRjaGVzKHNlbGVjdG9yKSkgcmV0dXJuIGVsO1xuICAgICAgICBtID0gZmluZE9uZShlbCwgc2VsZWN0b3IpO1xuICAgICAgICBpZiAobSkgcmV0dXJuIG07XG4gICAgICAgIGVsID0gZWwubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG1hdGNoZXNTZWxlY3RvcihlbCwgc2VsZWN0b3IpIHtcbiAgICAgIHJldHVybiBlbC5tYXRjaGVzKHNlbGVjdG9yKTtcbiAgICB9XG4gICAgdmFyIFhIVE1MX05TID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCI7XG4gICAgZnVuY3Rpb24gbWF0Y2hlc1RhZ05hbWUoZWwsIGxvY2FsTmFtZSwgbG9jYWxOYW1lTG93ZXJDYXNlKSB7XG4gICAgICB2YXIgbG4gPSBlbC5sb2NhbE5hbWU7XG4gICAgICByZXR1cm4gbG4gPT09IGxvY2FsTmFtZSB8fCBsbiA9PT0gbG9jYWxOYW1lTG93ZXJDYXNlICYmIGVsLm5hbWVzcGFjZVVSSSA9PT0gWEhUTUxfTlM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG1hdGNoZXNFdmVyeVRoaW5nKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG1hdGNoZXNMb2NhbE5hbWVPbmx5KGVsLCBucywgbG9jYWxOYW1lKSB7XG4gICAgICByZXR1cm4gZWwubG9jYWxOYW1lID09PSBsb2NhbE5hbWU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG1hdGNoZXNOYW1lU3BhY2UoZWwsIG5zKSB7XG4gICAgICByZXR1cm4gZWwubmFtZXNwYWNlVVJJID09PSBucztcbiAgICB9XG4gICAgZnVuY3Rpb24gbWF0Y2hlc0xvY2FsTmFtZU5TKGVsLCBucywgbG9jYWxOYW1lKSB7XG4gICAgICByZXR1cm4gZWwubmFtZXNwYWNlVVJJID09PSBucyAmJiBlbC5sb2NhbE5hbWUgPT09IGxvY2FsTmFtZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZmluZEVsZW1lbnRzKG5vZGUsIGluZGV4LCByZXN1bHQsIHAsIGFyZzAsIGFyZzEpIHtcbiAgICAgIHZhciBlbCA9IG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICB3aGlsZSAoZWwpIHtcbiAgICAgICAgaWYgKHAoZWwsIGFyZzAsIGFyZzEpKSByZXN1bHRbaW5kZXgrK10gPSBlbDtcbiAgICAgICAgaW5kZXggPSBmaW5kRWxlbWVudHMoZWwsIGluZGV4LCByZXN1bHQsIHAsIGFyZzAsIGFyZzEpO1xuICAgICAgICBlbCA9IGVsLm5leHRFbGVtZW50U2libGluZztcbiAgICAgIH1cbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcXVlcnlTZWxlY3RvckFsbEZpbHRlcmVkKHAsIGluZGV4LCByZXN1bHQsIHNlbGVjdG9yLCBkZWVwKSB7XG4gICAgICB2YXIgdGFyZ2V0ID0gdW5zYWZlVW53cmFwKHRoaXMpO1xuICAgICAgdmFyIGxpc3Q7XG4gICAgICB2YXIgcm9vdCA9IGdldFRyZWVTY29wZSh0aGlzKS5yb290O1xuICAgICAgaWYgKHJvb3QgaW5zdGFuY2VvZiBzY29wZS53cmFwcGVycy5TaGFkb3dSb290KSB7XG4gICAgICAgIHJldHVybiBmaW5kRWxlbWVudHModGhpcywgaW5kZXgsIHJlc3VsdCwgcCwgc2VsZWN0b3IsIG51bGwpO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBPcmlnaW5hbEVsZW1lbnQpIHtcbiAgICAgICAgbGlzdCA9IG9yaWdpbmFsRWxlbWVudFF1ZXJ5U2VsZWN0b3JBbGwuY2FsbCh0YXJnZXQsIHNlbGVjdG9yKTtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgT3JpZ2luYWxEb2N1bWVudCkge1xuICAgICAgICBsaXN0ID0gb3JpZ2luYWxEb2N1bWVudFF1ZXJ5U2VsZWN0b3JBbGwuY2FsbCh0YXJnZXQsIHNlbGVjdG9yKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmaW5kRWxlbWVudHModGhpcywgaW5kZXgsIHJlc3VsdCwgcCwgc2VsZWN0b3IsIG51bGwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbHRlck5vZGVMaXN0KGxpc3QsIGluZGV4LCByZXN1bHQsIGRlZXApO1xuICAgIH1cbiAgICB2YXIgU2VsZWN0b3JzSW50ZXJmYWNlID0ge1xuICAgICAgcXVlcnlTZWxlY3RvcjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIHNoaW1tZWQgPSBzaGltU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICB2YXIgZGVlcCA9IHNoaW1tZWQgIT09IHNlbGVjdG9yO1xuICAgICAgICBzZWxlY3RvciA9IHNoaW1tZWQ7XG4gICAgICAgIHZhciB0YXJnZXQgPSB1bnNhZmVVbndyYXAodGhpcyk7XG4gICAgICAgIHZhciB3cmFwcGVkSXRlbTtcbiAgICAgICAgdmFyIHJvb3QgPSBnZXRUcmVlU2NvcGUodGhpcykucm9vdDtcbiAgICAgICAgaWYgKHJvb3QgaW5zdGFuY2VvZiBzY29wZS53cmFwcGVycy5TaGFkb3dSb290KSB7XG4gICAgICAgICAgcmV0dXJuIGZpbmRPbmUodGhpcywgc2VsZWN0b3IpO1xuICAgICAgICB9IGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE9yaWdpbmFsRWxlbWVudCkge1xuICAgICAgICAgIHdyYXBwZWRJdGVtID0gd3JhcChvcmlnaW5hbEVsZW1lbnRRdWVyeVNlbGVjdG9yLmNhbGwodGFyZ2V0LCBzZWxlY3RvcikpO1xuICAgICAgICB9IGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE9yaWdpbmFsRG9jdW1lbnQpIHtcbiAgICAgICAgICB3cmFwcGVkSXRlbSA9IHdyYXAob3JpZ2luYWxEb2N1bWVudFF1ZXJ5U2VsZWN0b3IuY2FsbCh0YXJnZXQsIHNlbGVjdG9yKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZpbmRPbmUodGhpcywgc2VsZWN0b3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghd3JhcHBlZEl0ZW0pIHtcbiAgICAgICAgICByZXR1cm4gd3JhcHBlZEl0ZW07XG4gICAgICAgIH0gZWxzZSBpZiAoIWRlZXAgJiYgKHJvb3QgPSBnZXRUcmVlU2NvcGUod3JhcHBlZEl0ZW0pLnJvb3QpKSB7XG4gICAgICAgICAgaWYgKHJvb3QgaW5zdGFuY2VvZiBzY29wZS53cmFwcGVycy5TaGFkb3dSb290KSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZE9uZSh0aGlzLCBzZWxlY3Rvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB3cmFwcGVkSXRlbTtcbiAgICAgIH0sXG4gICAgICBxdWVyeVNlbGVjdG9yQWxsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgICAgICB2YXIgc2hpbW1lZCA9IHNoaW1TZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgIHZhciBkZWVwID0gc2hpbW1lZCAhPT0gc2VsZWN0b3I7XG4gICAgICAgIHNlbGVjdG9yID0gc2hpbW1lZDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBOb2RlTGlzdCgpO1xuICAgICAgICByZXN1bHQubGVuZ3RoID0gcXVlcnlTZWxlY3RvckFsbEZpbHRlcmVkLmNhbGwodGhpcywgbWF0Y2hlc1NlbGVjdG9yLCAwLCByZXN1bHQsIHNlbGVjdG9yLCBkZWVwKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBNYXRjaGVzSW50ZXJmYWNlID0ge1xuICAgICAgbWF0Y2hlczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICAgICAgc2VsZWN0b3IgPSBzaGltTWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgcmV0dXJuIHNjb3BlLm9yaWdpbmFsTWF0Y2hlcy5jYWxsKHVuc2FmZVVud3JhcCh0aGlzKSwgc2VsZWN0b3IpO1xuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gZ2V0RWxlbWVudHNCeVRhZ05hbWVGaWx0ZXJlZChwLCBpbmRleCwgcmVzdWx0LCBsb2NhbE5hbWUsIGxvd2VyY2FzZSkge1xuICAgICAgdmFyIHRhcmdldCA9IHVuc2FmZVVud3JhcCh0aGlzKTtcbiAgICAgIHZhciBsaXN0O1xuICAgICAgdmFyIHJvb3QgPSBnZXRUcmVlU2NvcGUodGhpcykucm9vdDtcbiAgICAgIGlmIChyb290IGluc3RhbmNlb2Ygc2NvcGUud3JhcHBlcnMuU2hhZG93Um9vdCkge1xuICAgICAgICByZXR1cm4gZmluZEVsZW1lbnRzKHRoaXMsIGluZGV4LCByZXN1bHQsIHAsIGxvY2FsTmFtZSwgbG93ZXJjYXNlKTtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgT3JpZ2luYWxFbGVtZW50KSB7XG4gICAgICAgIGxpc3QgPSBvcmlnaW5hbEVsZW1lbnRHZXRFbGVtZW50c0J5VGFnTmFtZS5jYWxsKHRhcmdldCwgbG9jYWxOYW1lLCBsb3dlcmNhc2UpO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBPcmlnaW5hbERvY3VtZW50KSB7XG4gICAgICAgIGxpc3QgPSBvcmlnaW5hbERvY3VtZW50R2V0RWxlbWVudHNCeVRhZ05hbWUuY2FsbCh0YXJnZXQsIGxvY2FsTmFtZSwgbG93ZXJjYXNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmaW5kRWxlbWVudHModGhpcywgaW5kZXgsIHJlc3VsdCwgcCwgbG9jYWxOYW1lLCBsb3dlcmNhc2UpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbHRlck5vZGVMaXN0KGxpc3QsIGluZGV4LCByZXN1bHQsIGZhbHNlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0RWxlbWVudHNCeVRhZ05hbWVOU0ZpbHRlcmVkKHAsIGluZGV4LCByZXN1bHQsIG5zLCBsb2NhbE5hbWUpIHtcbiAgICAgIHZhciB0YXJnZXQgPSB1bnNhZmVVbndyYXAodGhpcyk7XG4gICAgICB2YXIgbGlzdDtcbiAgICAgIHZhciByb290ID0gZ2V0VHJlZVNjb3BlKHRoaXMpLnJvb3Q7XG4gICAgICBpZiAocm9vdCBpbnN0YW5jZW9mIHNjb3BlLndyYXBwZXJzLlNoYWRvd1Jvb3QpIHtcbiAgICAgICAgcmV0dXJuIGZpbmRFbGVtZW50cyh0aGlzLCBpbmRleCwgcmVzdWx0LCBwLCBucywgbG9jYWxOYW1lKTtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgT3JpZ2luYWxFbGVtZW50KSB7XG4gICAgICAgIGxpc3QgPSBvcmlnaW5hbEVsZW1lbnRHZXRFbGVtZW50c0J5VGFnTmFtZU5TLmNhbGwodGFyZ2V0LCBucywgbG9jYWxOYW1lKTtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgT3JpZ2luYWxEb2N1bWVudCkge1xuICAgICAgICBsaXN0ID0gb3JpZ2luYWxEb2N1bWVudEdldEVsZW1lbnRzQnlUYWdOYW1lTlMuY2FsbCh0YXJnZXQsIG5zLCBsb2NhbE5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZpbmRFbGVtZW50cyh0aGlzLCBpbmRleCwgcmVzdWx0LCBwLCBucywgbG9jYWxOYW1lKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWx0ZXJOb2RlTGlzdChsaXN0LCBpbmRleCwgcmVzdWx0LCBmYWxzZSk7XG4gICAgfVxuICAgIHZhciBHZXRFbGVtZW50c0J5SW50ZXJmYWNlID0ge1xuICAgICAgZ2V0RWxlbWVudHNCeVRhZ05hbWU6IGZ1bmN0aW9uKGxvY2FsTmFtZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IEhUTUxDb2xsZWN0aW9uKCk7XG4gICAgICAgIHZhciBtYXRjaCA9IGxvY2FsTmFtZSA9PT0gXCIqXCIgPyBtYXRjaGVzRXZlcnlUaGluZyA6IG1hdGNoZXNUYWdOYW1lO1xuICAgICAgICByZXN1bHQubGVuZ3RoID0gZ2V0RWxlbWVudHNCeVRhZ05hbWVGaWx0ZXJlZC5jYWxsKHRoaXMsIG1hdGNoLCAwLCByZXN1bHQsIGxvY2FsTmFtZSwgbG9jYWxOYW1lLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcbiAgICAgIGdldEVsZW1lbnRzQnlDbGFzc05hbWU6IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeVNlbGVjdG9yQWxsKFwiLlwiICsgY2xhc3NOYW1lKTtcbiAgICAgIH0sXG4gICAgICBnZXRFbGVtZW50c0J5VGFnTmFtZU5TOiBmdW5jdGlvbihucywgbG9jYWxOYW1lKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBuZXcgSFRNTENvbGxlY3Rpb24oKTtcbiAgICAgICAgdmFyIG1hdGNoID0gbnVsbDtcbiAgICAgICAgaWYgKG5zID09PSBcIipcIikge1xuICAgICAgICAgIG1hdGNoID0gbG9jYWxOYW1lID09PSBcIipcIiA/IG1hdGNoZXNFdmVyeVRoaW5nIDogbWF0Y2hlc0xvY2FsTmFtZU9ubHk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWF0Y2ggPSBsb2NhbE5hbWUgPT09IFwiKlwiID8gbWF0Y2hlc05hbWVTcGFjZSA6IG1hdGNoZXNMb2NhbE5hbWVOUztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQubGVuZ3RoID0gZ2V0RWxlbWVudHNCeVRhZ05hbWVOU0ZpbHRlcmVkLmNhbGwodGhpcywgbWF0Y2gsIDAsIHJlc3VsdCwgbnMgfHwgbnVsbCwgbG9jYWxOYW1lKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9O1xuICAgIHNjb3BlLkdldEVsZW1lbnRzQnlJbnRlcmZhY2UgPSBHZXRFbGVtZW50c0J5SW50ZXJmYWNlO1xuICAgIHNjb3BlLlNlbGVjdG9yc0ludGVyZmFjZSA9IFNlbGVjdG9yc0ludGVyZmFjZTtcbiAgICBzY29wZS5NYXRjaGVzSW50ZXJmYWNlID0gTWF0Y2hlc0ludGVyZmFjZTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIE5vZGVMaXN0ID0gc2NvcGUud3JhcHBlcnMuTm9kZUxpc3Q7XG4gICAgZnVuY3Rpb24gZm9yd2FyZEVsZW1lbnQobm9kZSkge1xuICAgICAgd2hpbGUgKG5vZGUgJiYgbm9kZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYmFja3dhcmRzRWxlbWVudChub2RlKSB7XG4gICAgICB3aGlsZSAobm9kZSAmJiBub2RlLm5vZGVUeXBlICE9PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBub2RlID0gbm9kZS5wcmV2aW91c1NpYmxpbmc7XG4gICAgICB9XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gICAgdmFyIFBhcmVudE5vZGVJbnRlcmZhY2UgPSB7XG4gICAgICBnZXQgZmlyc3RFbGVtZW50Q2hpbGQoKSB7XG4gICAgICAgIHJldHVybiBmb3J3YXJkRWxlbWVudCh0aGlzLmZpcnN0Q2hpbGQpO1xuICAgICAgfSxcbiAgICAgIGdldCBsYXN0RWxlbWVudENoaWxkKCkge1xuICAgICAgICByZXR1cm4gYmFja3dhcmRzRWxlbWVudCh0aGlzLmxhc3RDaGlsZCk7XG4gICAgICB9LFxuICAgICAgZ2V0IGNoaWxkRWxlbWVudENvdW50KCkge1xuICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICBmb3IgKHZhciBjaGlsZCA9IHRoaXMuZmlyc3RFbGVtZW50Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRFbGVtZW50U2libGluZykge1xuICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvdW50O1xuICAgICAgfSxcbiAgICAgIGdldCBjaGlsZHJlbigpIHtcbiAgICAgICAgdmFyIHdyYXBwZXJMaXN0ID0gbmV3IE5vZGVMaXN0KCk7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgPSB0aGlzLmZpcnN0RWxlbWVudENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0RWxlbWVudFNpYmxpbmcpIHtcbiAgICAgICAgICB3cmFwcGVyTGlzdFtpKytdID0gY2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgd3JhcHBlckxpc3QubGVuZ3RoID0gaTtcbiAgICAgICAgcmV0dXJuIHdyYXBwZXJMaXN0O1xuICAgICAgfSxcbiAgICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5wYXJlbnROb2RlO1xuICAgICAgICBpZiAocCkgcC5yZW1vdmVDaGlsZCh0aGlzKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBDaGlsZE5vZGVJbnRlcmZhY2UgPSB7XG4gICAgICBnZXQgbmV4dEVsZW1lbnRTaWJsaW5nKCkge1xuICAgICAgICByZXR1cm4gZm9yd2FyZEVsZW1lbnQodGhpcy5uZXh0U2libGluZyk7XG4gICAgICB9LFxuICAgICAgZ2V0IHByZXZpb3VzRWxlbWVudFNpYmxpbmcoKSB7XG4gICAgICAgIHJldHVybiBiYWNrd2FyZHNFbGVtZW50KHRoaXMucHJldmlvdXNTaWJsaW5nKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBOb25FbGVtZW50UGFyZW50Tm9kZUludGVyZmFjZSA9IHtcbiAgICAgIGdldEVsZW1lbnRCeUlkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICBpZiAoL1sgXFx0XFxuXFxyXFxmXS8udGVzdChpZCkpIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeVNlbGVjdG9yKCdbaWQ9XCInICsgaWQgKyAnXCJdJyk7XG4gICAgICB9XG4gICAgfTtcbiAgICBzY29wZS5DaGlsZE5vZGVJbnRlcmZhY2UgPSBDaGlsZE5vZGVJbnRlcmZhY2U7XG4gICAgc2NvcGUuTm9uRWxlbWVudFBhcmVudE5vZGVJbnRlcmZhY2UgPSBOb25FbGVtZW50UGFyZW50Tm9kZUludGVyZmFjZTtcbiAgICBzY29wZS5QYXJlbnROb2RlSW50ZXJmYWNlID0gUGFyZW50Tm9kZUludGVyZmFjZTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIENoaWxkTm9kZUludGVyZmFjZSA9IHNjb3BlLkNoaWxkTm9kZUludGVyZmFjZTtcbiAgICB2YXIgTm9kZSA9IHNjb3BlLndyYXBwZXJzLk5vZGU7XG4gICAgdmFyIGVucXVldWVNdXRhdGlvbiA9IHNjb3BlLmVucXVldWVNdXRhdGlvbjtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIE9yaWdpbmFsQ2hhcmFjdGVyRGF0YSA9IHdpbmRvdy5DaGFyYWN0ZXJEYXRhO1xuICAgIGZ1bmN0aW9uIENoYXJhY3RlckRhdGEobm9kZSkge1xuICAgICAgTm9kZS5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBDaGFyYWN0ZXJEYXRhLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTm9kZS5wcm90b3R5cGUpO1xuICAgIG1peGluKENoYXJhY3RlckRhdGEucHJvdG90eXBlLCB7XG4gICAgICBnZXQgbm9kZVZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhO1xuICAgICAgfSxcbiAgICAgIHNldCBub2RlVmFsdWUoZGF0YSkge1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgfSxcbiAgICAgIGdldCB0ZXh0Q29udGVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgICAgIH0sXG4gICAgICBzZXQgdGV4dENvbnRlbnQodmFsdWUpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gdmFsdWU7XG4gICAgICB9LFxuICAgICAgZ2V0IGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykuZGF0YTtcbiAgICAgIH0sXG4gICAgICBzZXQgZGF0YSh2YWx1ZSkge1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSB1bnNhZmVVbndyYXAodGhpcykuZGF0YTtcbiAgICAgICAgZW5xdWV1ZU11dGF0aW9uKHRoaXMsIFwiY2hhcmFjdGVyRGF0YVwiLCB7XG4gICAgICAgICAgb2xkVmFsdWU6IG9sZFZhbHVlXG4gICAgICAgIH0pO1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuZGF0YSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIG1peGluKENoYXJhY3RlckRhdGEucHJvdG90eXBlLCBDaGlsZE5vZGVJbnRlcmZhY2UpO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbENoYXJhY3RlckRhdGEsIENoYXJhY3RlckRhdGEsIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5DaGFyYWN0ZXJEYXRhID0gQ2hhcmFjdGVyRGF0YTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIENoYXJhY3RlckRhdGEgPSBzY29wZS53cmFwcGVycy5DaGFyYWN0ZXJEYXRhO1xuICAgIHZhciBlbnF1ZXVlTXV0YXRpb24gPSBzY29wZS5lbnF1ZXVlTXV0YXRpb247XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICBmdW5jdGlvbiB0b1VJbnQzMih4KSB7XG4gICAgICByZXR1cm4geCA+Pj4gMDtcbiAgICB9XG4gICAgdmFyIE9yaWdpbmFsVGV4dCA9IHdpbmRvdy5UZXh0O1xuICAgIGZ1bmN0aW9uIFRleHQobm9kZSkge1xuICAgICAgQ2hhcmFjdGVyRGF0YS5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBUZXh0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUpO1xuICAgIG1peGluKFRleHQucHJvdG90eXBlLCB7XG4gICAgICBzcGxpdFRleHQ6IGZ1bmN0aW9uKG9mZnNldCkge1xuICAgICAgICBvZmZzZXQgPSB0b1VJbnQzMihvZmZzZXQpO1xuICAgICAgICB2YXIgcyA9IHRoaXMuZGF0YTtcbiAgICAgICAgaWYgKG9mZnNldCA+IHMubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoXCJJbmRleFNpemVFcnJvclwiKTtcbiAgICAgICAgdmFyIGhlYWQgPSBzLnNsaWNlKDAsIG9mZnNldCk7XG4gICAgICAgIHZhciB0YWlsID0gcy5zbGljZShvZmZzZXQpO1xuICAgICAgICB0aGlzLmRhdGEgPSBoZWFkO1xuICAgICAgICB2YXIgbmV3VGV4dE5vZGUgPSB0aGlzLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGFpbCk7XG4gICAgICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHRoaXMucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobmV3VGV4dE5vZGUsIHRoaXMubmV4dFNpYmxpbmcpO1xuICAgICAgICByZXR1cm4gbmV3VGV4dE5vZGU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsVGV4dCwgVGV4dCwgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLlRleHQgPSBUZXh0O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBpZiAoIXdpbmRvdy5ET01Ub2tlbkxpc3QpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIk1pc3NpbmcgRE9NVG9rZW5MaXN0IHByb3RvdHlwZSwgcGxlYXNlIGluY2x1ZGUgYSBcIiArIFwiY29tcGF0aWJsZSBjbGFzc0xpc3QgcG9seWZpbGwgc3VjaCBhcyBodHRwOi8vZ29vLmdsL3VUY2VwSC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIGVucXVldWVNdXRhdGlvbiA9IHNjb3BlLmVucXVldWVNdXRhdGlvbjtcbiAgICBmdW5jdGlvbiBnZXRDbGFzcyhlbCkge1xuICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcChlbCkuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVucXVldWVDbGFzc0F0dHJpYnV0ZUNoYW5nZShlbCwgb2xkVmFsdWUpIHtcbiAgICAgIGVucXVldWVNdXRhdGlvbihlbCwgXCJhdHRyaWJ1dGVzXCIsIHtcbiAgICAgICAgbmFtZTogXCJjbGFzc1wiLFxuICAgICAgICBuYW1lc3BhY2U6IG51bGwsXG4gICAgICAgIG9sZFZhbHVlOiBvbGRWYWx1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludmFsaWRhdGVDbGFzcyhlbCkge1xuICAgICAgc2NvcGUuaW52YWxpZGF0ZVJlbmRlcmVyQmFzZWRPbkF0dHJpYnV0ZShlbCwgXCJjbGFzc1wiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY2hhbmdlQ2xhc3ModG9rZW5MaXN0LCBtZXRob2QsIGFyZ3MpIHtcbiAgICAgIHZhciBvd25lckVsZW1lbnQgPSB0b2tlbkxpc3Qub3duZXJFbGVtZW50XztcbiAgICAgIGlmIChvd25lckVsZW1lbnQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbWV0aG9kLmFwcGx5KHRva2VuTGlzdCwgYXJncyk7XG4gICAgICB9XG4gICAgICB2YXIgb2xkVmFsdWUgPSBnZXRDbGFzcyhvd25lckVsZW1lbnQpO1xuICAgICAgdmFyIHJldHYgPSBtZXRob2QuYXBwbHkodG9rZW5MaXN0LCBhcmdzKTtcbiAgICAgIGlmIChnZXRDbGFzcyhvd25lckVsZW1lbnQpICE9PSBvbGRWYWx1ZSkge1xuICAgICAgICBlbnF1ZXVlQ2xhc3NBdHRyaWJ1dGVDaGFuZ2Uob3duZXJFbGVtZW50LCBvbGRWYWx1ZSk7XG4gICAgICAgIGludmFsaWRhdGVDbGFzcyhvd25lckVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJldHY7XG4gICAgfVxuICAgIHZhciBvbGRBZGQgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlLmFkZDtcbiAgICBET01Ub2tlbkxpc3QucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgY2hhbmdlQ2xhc3ModGhpcywgb2xkQWRkLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgdmFyIG9sZFJlbW92ZSA9IERPTVRva2VuTGlzdC5wcm90b3R5cGUucmVtb3ZlO1xuICAgIERPTVRva2VuTGlzdC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG4gICAgICBjaGFuZ2VDbGFzcyh0aGlzLCBvbGRSZW1vdmUsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICB2YXIgb2xkVG9nZ2xlID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGU7XG4gICAgRE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBjaGFuZ2VDbGFzcyh0aGlzLCBvbGRUb2dnbGUsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIENoaWxkTm9kZUludGVyZmFjZSA9IHNjb3BlLkNoaWxkTm9kZUludGVyZmFjZTtcbiAgICB2YXIgR2V0RWxlbWVudHNCeUludGVyZmFjZSA9IHNjb3BlLkdldEVsZW1lbnRzQnlJbnRlcmZhY2U7XG4gICAgdmFyIE5vZGUgPSBzY29wZS53cmFwcGVycy5Ob2RlO1xuICAgIHZhciBQYXJlbnROb2RlSW50ZXJmYWNlID0gc2NvcGUuUGFyZW50Tm9kZUludGVyZmFjZTtcbiAgICB2YXIgU2VsZWN0b3JzSW50ZXJmYWNlID0gc2NvcGUuU2VsZWN0b3JzSW50ZXJmYWNlO1xuICAgIHZhciBNYXRjaGVzSW50ZXJmYWNlID0gc2NvcGUuTWF0Y2hlc0ludGVyZmFjZTtcbiAgICB2YXIgYWRkV3JhcE5vZGVMaXN0TWV0aG9kID0gc2NvcGUuYWRkV3JhcE5vZGVMaXN0TWV0aG9kO1xuICAgIHZhciBlbnF1ZXVlTXV0YXRpb24gPSBzY29wZS5lbnF1ZXVlTXV0YXRpb247XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIG9uZU9mID0gc2NvcGUub25lT2Y7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB3cmFwcGVycyA9IHNjb3BlLndyYXBwZXJzO1xuICAgIHZhciBPcmlnaW5hbEVsZW1lbnQgPSB3aW5kb3cuRWxlbWVudDtcbiAgICB2YXIgbWF0Y2hlc05hbWVzID0gWyBcIm1hdGNoZXNcIiwgXCJtb3pNYXRjaGVzU2VsZWN0b3JcIiwgXCJtc01hdGNoZXNTZWxlY3RvclwiLCBcIndlYmtpdE1hdGNoZXNTZWxlY3RvclwiIF0uZmlsdGVyKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHJldHVybiBPcmlnaW5hbEVsZW1lbnQucHJvdG90eXBlW25hbWVdO1xuICAgIH0pO1xuICAgIHZhciBtYXRjaGVzTmFtZSA9IG1hdGNoZXNOYW1lc1swXTtcbiAgICB2YXIgb3JpZ2luYWxNYXRjaGVzID0gT3JpZ2luYWxFbGVtZW50LnByb3RvdHlwZVttYXRjaGVzTmFtZV07XG4gICAgZnVuY3Rpb24gaW52YWxpZGF0ZVJlbmRlcmVyQmFzZWRPbkF0dHJpYnV0ZShlbGVtZW50LCBuYW1lKSB7XG4gICAgICB2YXIgcCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgIGlmICghcCB8fCAhcC5zaGFkb3dSb290KSByZXR1cm47XG4gICAgICB2YXIgcmVuZGVyZXIgPSBzY29wZS5nZXRSZW5kZXJlckZvckhvc3QocCk7XG4gICAgICBpZiAocmVuZGVyZXIuZGVwZW5kc09uQXR0cmlidXRlKG5hbWUpKSByZW5kZXJlci5pbnZhbGlkYXRlKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVucXVlQXR0cmlidXRlQ2hhbmdlKGVsZW1lbnQsIG5hbWUsIG9sZFZhbHVlKSB7XG4gICAgICBlbnF1ZXVlTXV0YXRpb24oZWxlbWVudCwgXCJhdHRyaWJ1dGVzXCIsIHtcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgbmFtZXNwYWNlOiBudWxsLFxuICAgICAgICBvbGRWYWx1ZTogb2xkVmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICB2YXIgY2xhc3NMaXN0VGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIGZ1bmN0aW9uIEVsZW1lbnQobm9kZSkge1xuICAgICAgTm9kZS5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTm9kZS5wcm90b3R5cGUpO1xuICAgIG1peGluKEVsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBjcmVhdGVTaGFkb3dSb290OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5ld1NoYWRvd1Jvb3QgPSBuZXcgd3JhcHBlcnMuU2hhZG93Um9vdCh0aGlzKTtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnBvbHltZXJTaGFkb3dSb290XyA9IG5ld1NoYWRvd1Jvb3Q7XG4gICAgICAgIHZhciByZW5kZXJlciA9IHNjb3BlLmdldFJlbmRlcmVyRm9ySG9zdCh0aGlzKTtcbiAgICAgICAgcmVuZGVyZXIuaW52YWxpZGF0ZSgpO1xuICAgICAgICByZXR1cm4gbmV3U2hhZG93Um9vdDtcbiAgICAgIH0sXG4gICAgICBnZXQgc2hhZG93Um9vdCgpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5wb2x5bWVyU2hhZG93Um9vdF8gfHwgbnVsbDtcbiAgICAgIH0sXG4gICAgICBzZXRBdHRyaWJ1dGU6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHZhciBvbGRWYWx1ZSA9IHVuc2FmZVVud3JhcCh0aGlzKS5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgICAgICBlbnF1ZUF0dHJpYnV0ZUNoYW5nZSh0aGlzLCBuYW1lLCBvbGRWYWx1ZSk7XG4gICAgICAgIGludmFsaWRhdGVSZW5kZXJlckJhc2VkT25BdHRyaWJ1dGUodGhpcywgbmFtZSk7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlQXR0cmlidXRlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHZhciBvbGRWYWx1ZSA9IHVuc2FmZVVud3JhcCh0aGlzKS5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIGVucXVlQXR0cmlidXRlQ2hhbmdlKHRoaXMsIG5hbWUsIG9sZFZhbHVlKTtcbiAgICAgICAgaW52YWxpZGF0ZVJlbmRlcmVyQmFzZWRPbkF0dHJpYnV0ZSh0aGlzLCBuYW1lKTtcbiAgICAgIH0sXG4gICAgICBnZXQgY2xhc3NMaXN0KCkge1xuICAgICAgICB2YXIgbGlzdCA9IGNsYXNzTGlzdFRhYmxlLmdldCh0aGlzKTtcbiAgICAgICAgaWYgKCFsaXN0KSB7XG4gICAgICAgICAgbGlzdCA9IHVuc2FmZVVud3JhcCh0aGlzKS5jbGFzc0xpc3Q7XG4gICAgICAgICAgaWYgKCFsaXN0KSByZXR1cm47XG4gICAgICAgICAgbGlzdC5vd25lckVsZW1lbnRfID0gdGhpcztcbiAgICAgICAgICBjbGFzc0xpc3RUYWJsZS5zZXQodGhpcywgbGlzdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgICB9LFxuICAgICAgZ2V0IGNsYXNzTmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5jbGFzc05hbWU7XG4gICAgICB9LFxuICAgICAgc2V0IGNsYXNzTmFtZSh2KSB7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdik7XG4gICAgICB9LFxuICAgICAgZ2V0IGlkKCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLmlkO1xuICAgICAgfSxcbiAgICAgIHNldCBpZCh2KSB7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiaWRcIiwgdik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbWF0Y2hlc05hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgaWYgKG5hbWUgIT09IFwibWF0Y2hlc1wiKSB7XG4gICAgICAgIEVsZW1lbnQucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXRjaGVzKHNlbGVjdG9yKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoT3JpZ2luYWxFbGVtZW50LnByb3RvdHlwZS53ZWJraXRDcmVhdGVTaGFkb3dSb290KSB7XG4gICAgICBFbGVtZW50LnByb3RvdHlwZS53ZWJraXRDcmVhdGVTaGFkb3dSb290ID0gRWxlbWVudC5wcm90b3R5cGUuY3JlYXRlU2hhZG93Um9vdDtcbiAgICB9XG4gICAgbWl4aW4oRWxlbWVudC5wcm90b3R5cGUsIENoaWxkTm9kZUludGVyZmFjZSk7XG4gICAgbWl4aW4oRWxlbWVudC5wcm90b3R5cGUsIEdldEVsZW1lbnRzQnlJbnRlcmZhY2UpO1xuICAgIG1peGluKEVsZW1lbnQucHJvdG90eXBlLCBQYXJlbnROb2RlSW50ZXJmYWNlKTtcbiAgICBtaXhpbihFbGVtZW50LnByb3RvdHlwZSwgU2VsZWN0b3JzSW50ZXJmYWNlKTtcbiAgICBtaXhpbihFbGVtZW50LnByb3RvdHlwZSwgTWF0Y2hlc0ludGVyZmFjZSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsRWxlbWVudCwgRWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG51bGwsIFwieFwiKSk7XG4gICAgc2NvcGUuaW52YWxpZGF0ZVJlbmRlcmVyQmFzZWRPbkF0dHJpYnV0ZSA9IGludmFsaWRhdGVSZW5kZXJlckJhc2VkT25BdHRyaWJ1dGU7XG4gICAgc2NvcGUubWF0Y2hlc05hbWVzID0gbWF0Y2hlc05hbWVzO1xuICAgIHNjb3BlLm9yaWdpbmFsTWF0Y2hlcyA9IG9yaWdpbmFsTWF0Y2hlcztcbiAgICBzY29wZS53cmFwcGVycy5FbGVtZW50ID0gRWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5FbGVtZW50O1xuICAgIHZhciBkZWZpbmVHZXR0ZXIgPSBzY29wZS5kZWZpbmVHZXR0ZXI7XG4gICAgdmFyIGVucXVldWVNdXRhdGlvbiA9IHNjb3BlLmVucXVldWVNdXRhdGlvbjtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgbm9kZXNXZXJlQWRkZWQgPSBzY29wZS5ub2Rlc1dlcmVBZGRlZDtcbiAgICB2YXIgbm9kZXNXZXJlUmVtb3ZlZCA9IHNjb3BlLm5vZGVzV2VyZVJlbW92ZWQ7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgc25hcHNob3ROb2RlTGlzdCA9IHNjb3BlLnNuYXBzaG90Tm9kZUxpc3Q7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgd3JhcHBlcnMgPSBzY29wZS53cmFwcGVycztcbiAgICB2YXIgZXNjYXBlQXR0clJlZ0V4cCA9IC9bJlxcdTAwQTBcIl0vZztcbiAgICB2YXIgZXNjYXBlRGF0YVJlZ0V4cCA9IC9bJlxcdTAwQTA8Pl0vZztcbiAgICBmdW5jdGlvbiBlc2NhcGVSZXBsYWNlKGMpIHtcbiAgICAgIHN3aXRjaCAoYykge1xuICAgICAgIGNhc2UgXCImXCI6XG4gICAgICAgIHJldHVybiBcIiZhbXA7XCI7XG5cbiAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICByZXR1cm4gXCImbHQ7XCI7XG5cbiAgICAgICBjYXNlIFwiPlwiOlxuICAgICAgICByZXR1cm4gXCImZ3Q7XCI7XG5cbiAgICAgICBjYXNlICdcIic6XG4gICAgICAgIHJldHVybiBcIiZxdW90O1wiO1xuXG4gICAgICAgY2FzZSBcIsKgXCI6XG4gICAgICAgIHJldHVybiBcIiZuYnNwO1wiO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBlc2NhcGVBdHRyKHMpIHtcbiAgICAgIHJldHVybiBzLnJlcGxhY2UoZXNjYXBlQXR0clJlZ0V4cCwgZXNjYXBlUmVwbGFjZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVzY2FwZURhdGEocykge1xuICAgICAgcmV0dXJuIHMucmVwbGFjZShlc2NhcGVEYXRhUmVnRXhwLCBlc2NhcGVSZXBsYWNlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbWFrZVNldChhcnIpIHtcbiAgICAgIHZhciBzZXQgPSB7fTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNldFthcnJbaV1dID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZXQ7XG4gICAgfVxuICAgIHZhciB2b2lkRWxlbWVudHMgPSBtYWtlU2V0KFsgXCJhcmVhXCIsIFwiYmFzZVwiLCBcImJyXCIsIFwiY29sXCIsIFwiY29tbWFuZFwiLCBcImVtYmVkXCIsIFwiaHJcIiwgXCJpbWdcIiwgXCJpbnB1dFwiLCBcImtleWdlblwiLCBcImxpbmtcIiwgXCJtZXRhXCIsIFwicGFyYW1cIiwgXCJzb3VyY2VcIiwgXCJ0cmFja1wiLCBcIndiclwiIF0pO1xuICAgIHZhciBwbGFpbnRleHRQYXJlbnRzID0gbWFrZVNldChbIFwic3R5bGVcIiwgXCJzY3JpcHRcIiwgXCJ4bXBcIiwgXCJpZnJhbWVcIiwgXCJub2VtYmVkXCIsIFwibm9mcmFtZXNcIiwgXCJwbGFpbnRleHRcIiwgXCJub3NjcmlwdFwiIF0pO1xuICAgIHZhciBYSFRNTF9OUyA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiO1xuICAgIGZ1bmN0aW9uIG5lZWRzU2VsZkNsb3NpbmdTbGFzaChub2RlKSB7XG4gICAgICBpZiAobm9kZS5uYW1lc3BhY2VVUkkgIT09IFhIVE1MX05TKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHZhciBkb2N0eXBlID0gbm9kZS5vd25lckRvY3VtZW50LmRvY3R5cGU7XG4gICAgICByZXR1cm4gZG9jdHlwZSAmJiBkb2N0eXBlLnB1YmxpY0lkICYmIGRvY3R5cGUuc3lzdGVtSWQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldE91dGVySFRNTChub2RlLCBwYXJlbnROb2RlKSB7XG4gICAgICBzd2l0Y2ggKG5vZGUubm9kZVR5cGUpIHtcbiAgICAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICB2YXIgdGFnTmFtZSA9IG5vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB2YXIgcyA9IFwiPFwiICsgdGFnTmFtZTtcbiAgICAgICAgdmFyIGF0dHJzID0gbm9kZS5hdHRyaWJ1dGVzO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgYXR0cjsgYXR0ciA9IGF0dHJzW2ldOyBpKyspIHtcbiAgICAgICAgICBzICs9IFwiIFwiICsgYXR0ci5uYW1lICsgJz1cIicgKyBlc2NhcGVBdHRyKGF0dHIudmFsdWUpICsgJ1wiJztcbiAgICAgICAgfVxuICAgICAgICBpZiAodm9pZEVsZW1lbnRzW3RhZ05hbWVdKSB7XG4gICAgICAgICAgaWYgKG5lZWRzU2VsZkNsb3NpbmdTbGFzaChub2RlKSkgcyArPSBcIi9cIjtcbiAgICAgICAgICByZXR1cm4gcyArIFwiPlwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzICsgXCI+XCIgKyBnZXRJbm5lckhUTUwobm9kZSkgKyBcIjwvXCIgKyB0YWdOYW1lICsgXCI+XCI7XG5cbiAgICAgICBjYXNlIE5vZGUuVEVYVF9OT0RFOlxuICAgICAgICB2YXIgZGF0YSA9IG5vZGUuZGF0YTtcbiAgICAgICAgaWYgKHBhcmVudE5vZGUgJiYgcGxhaW50ZXh0UGFyZW50c1twYXJlbnROb2RlLmxvY2FsTmFtZV0pIHJldHVybiBkYXRhO1xuICAgICAgICByZXR1cm4gZXNjYXBlRGF0YShkYXRhKTtcblxuICAgICAgIGNhc2UgTm9kZS5DT01NRU5UX05PREU6XG4gICAgICAgIHJldHVybiBcIjwhLS1cIiArIG5vZGUuZGF0YSArIFwiLS0+XCI7XG5cbiAgICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLmVycm9yKG5vZGUpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub3QgaW1wbGVtZW50ZWRcIik7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldElubmVySFRNTChub2RlKSB7XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIHdyYXBwZXJzLkhUTUxUZW1wbGF0ZUVsZW1lbnQpIG5vZGUgPSBub2RlLmNvbnRlbnQ7XG4gICAgICB2YXIgcyA9IFwiXCI7XG4gICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgcyArPSBnZXRPdXRlckhUTUwoY2hpbGQsIG5vZGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNldElubmVySFRNTChub2RlLCB2YWx1ZSwgb3B0X3RhZ05hbWUpIHtcbiAgICAgIHZhciB0YWdOYW1lID0gb3B0X3RhZ05hbWUgfHwgXCJkaXZcIjtcbiAgICAgIG5vZGUudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgdmFyIHRlbXBFbGVtZW50ID0gdW53cmFwKG5vZGUub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpKTtcbiAgICAgIHRlbXBFbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuICAgICAgdmFyIGZpcnN0Q2hpbGQ7XG4gICAgICB3aGlsZSAoZmlyc3RDaGlsZCA9IHRlbXBFbGVtZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgbm9kZS5hcHBlbmRDaGlsZCh3cmFwKGZpcnN0Q2hpbGQpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIG9sZEllID0gL01TSUUvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gICAgdmFyIE9yaWdpbmFsSFRNTEVsZW1lbnQgPSB3aW5kb3cuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIE9yaWdpbmFsSFRNTFRlbXBsYXRlRWxlbWVudCA9IHdpbmRvdy5IVE1MVGVtcGxhdGVFbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxFbGVtZW50KG5vZGUpIHtcbiAgICAgIEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTEVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oSFRNTEVsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBnZXQgaW5uZXJIVE1MKCkge1xuICAgICAgICByZXR1cm4gZ2V0SW5uZXJIVE1MKHRoaXMpO1xuICAgICAgfSxcbiAgICAgIHNldCBpbm5lckhUTUwodmFsdWUpIHtcbiAgICAgICAgaWYgKG9sZEllICYmIHBsYWludGV4dFBhcmVudHNbdGhpcy5sb2NhbE5hbWVdKSB7XG4gICAgICAgICAgdGhpcy50ZXh0Q29udGVudCA9IHZhbHVlO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVtb3ZlZE5vZGVzID0gc25hcHNob3ROb2RlTGlzdCh0aGlzLmNoaWxkTm9kZXMpO1xuICAgICAgICBpZiAodGhpcy5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIoKSkge1xuICAgICAgICAgIGlmICh0aGlzIGluc3RhbmNlb2Ygd3JhcHBlcnMuSFRNTFRlbXBsYXRlRWxlbWVudCkgc2V0SW5uZXJIVE1MKHRoaXMuY29udGVudCwgdmFsdWUpOyBlbHNlIHNldElubmVySFRNTCh0aGlzLCB2YWx1ZSwgdGhpcy50YWdOYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmICghT3JpZ2luYWxIVE1MVGVtcGxhdGVFbGVtZW50ICYmIHRoaXMgaW5zdGFuY2VvZiB3cmFwcGVycy5IVE1MVGVtcGxhdGVFbGVtZW50KSB7XG4gICAgICAgICAgc2V0SW5uZXJIVE1MKHRoaXMuY29udGVudCwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYWRkZWROb2RlcyA9IHNuYXBzaG90Tm9kZUxpc3QodGhpcy5jaGlsZE5vZGVzKTtcbiAgICAgICAgZW5xdWV1ZU11dGF0aW9uKHRoaXMsIFwiY2hpbGRMaXN0XCIsIHtcbiAgICAgICAgICBhZGRlZE5vZGVzOiBhZGRlZE5vZGVzLFxuICAgICAgICAgIHJlbW92ZWROb2RlczogcmVtb3ZlZE5vZGVzXG4gICAgICAgIH0pO1xuICAgICAgICBub2Rlc1dlcmVSZW1vdmVkKHJlbW92ZWROb2Rlcyk7XG4gICAgICAgIG5vZGVzV2VyZUFkZGVkKGFkZGVkTm9kZXMsIHRoaXMpO1xuICAgICAgfSxcbiAgICAgIGdldCBvdXRlckhUTUwoKSB7XG4gICAgICAgIHJldHVybiBnZXRPdXRlckhUTUwodGhpcywgdGhpcy5wYXJlbnROb2RlKTtcbiAgICAgIH0sXG4gICAgICBzZXQgb3V0ZXJIVE1MKHZhbHVlKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5wYXJlbnROb2RlO1xuICAgICAgICBpZiAocCkge1xuICAgICAgICAgIHAuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKCk7XG4gICAgICAgICAgdmFyIGRmID0gZnJhZyhwLCB2YWx1ZSk7XG4gICAgICAgICAgcC5yZXBsYWNlQ2hpbGQoZGYsIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgaW5zZXJ0QWRqYWNlbnRIVE1MOiBmdW5jdGlvbihwb3NpdGlvbiwgdGV4dCkge1xuICAgICAgICB2YXIgY29udGV4dEVsZW1lbnQsIHJlZk5vZGU7XG4gICAgICAgIHN3aXRjaCAoU3RyaW5nKHBvc2l0aW9uKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICBjYXNlIFwiYmVmb3JlYmVnaW5cIjpcbiAgICAgICAgICBjb250ZXh0RWxlbWVudCA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICAgICAgICByZWZOb2RlID0gdGhpcztcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICAgY2FzZSBcImFmdGVyZW5kXCI6XG4gICAgICAgICAgY29udGV4dEVsZW1lbnQgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgICAgICAgcmVmTm9kZSA9IHRoaXMubmV4dFNpYmxpbmc7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgIGNhc2UgXCJhZnRlcmJlZ2luXCI6XG4gICAgICAgICAgY29udGV4dEVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgIHJlZk5vZGUgPSB0aGlzLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgIGNhc2UgXCJiZWZvcmVlbmRcIjpcbiAgICAgICAgICBjb250ZXh0RWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgcmVmTm9kZSA9IG51bGw7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkZiA9IGZyYWcoY29udGV4dEVsZW1lbnQsIHRleHQpO1xuICAgICAgICBjb250ZXh0RWxlbWVudC5pbnNlcnRCZWZvcmUoZGYsIHJlZk5vZGUpO1xuICAgICAgfSxcbiAgICAgIGdldCBoaWRkZW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShcImhpZGRlblwiKTtcbiAgICAgIH0sXG4gICAgICBzZXQgaGlkZGVuKHYpIHtcbiAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImhpZGRlblwiLCBcIlwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcImhpZGRlblwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGZ1bmN0aW9uIGZyYWcoY29udGV4dEVsZW1lbnQsIGh0bWwpIHtcbiAgICAgIHZhciBwID0gdW53cmFwKGNvbnRleHRFbGVtZW50LmNsb25lTm9kZShmYWxzZSkpO1xuICAgICAgcC5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgdmFyIGRmID0gdW53cmFwKGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSk7XG4gICAgICB2YXIgYztcbiAgICAgIHdoaWxlIChjID0gcC5maXJzdENoaWxkKSB7XG4gICAgICAgIGRmLmFwcGVuZENoaWxkKGMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHdyYXAoZGYpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXR0ZXIobmFtZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBzY29wZS5yZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcylbbmFtZV07XG4gICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXR0ZXJSZXF1aXJlc1JlbmRlcmluZyhuYW1lKSB7XG4gICAgICBkZWZpbmVHZXR0ZXIoSFRNTEVsZW1lbnQsIG5hbWUsIGdldHRlcihuYW1lKSk7XG4gICAgfVxuICAgIFsgXCJjbGllbnRIZWlnaHRcIiwgXCJjbGllbnRMZWZ0XCIsIFwiY2xpZW50VG9wXCIsIFwiY2xpZW50V2lkdGhcIiwgXCJvZmZzZXRIZWlnaHRcIiwgXCJvZmZzZXRMZWZ0XCIsIFwib2Zmc2V0VG9wXCIsIFwib2Zmc2V0V2lkdGhcIiwgXCJzY3JvbGxIZWlnaHRcIiwgXCJzY3JvbGxXaWR0aFwiIF0uZm9yRWFjaChnZXR0ZXJSZXF1aXJlc1JlbmRlcmluZyk7XG4gICAgZnVuY3Rpb24gZ2V0dGVyQW5kU2V0dGVyUmVxdWlyZXNSZW5kZXJpbmcobmFtZSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEhUTUxFbGVtZW50LnByb3RvdHlwZSwgbmFtZSwge1xuICAgICAgICBnZXQ6IGdldHRlcihuYW1lKSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgc2NvcGUucmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKVtuYW1lXSA9IHY7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIFsgXCJzY3JvbGxMZWZ0XCIsIFwic2Nyb2xsVG9wXCIgXS5mb3JFYWNoKGdldHRlckFuZFNldHRlclJlcXVpcmVzUmVuZGVyaW5nKTtcbiAgICBmdW5jdGlvbiBtZXRob2RSZXF1aXJlc1JlbmRlcmluZyhuYW1lKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSFRNTEVsZW1lbnQucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzY29wZS5yZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKVtuYW1lXS5hcHBseSh1bnNhZmVVbndyYXAodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIFsgXCJmb2N1c1wiLCBcImdldEJvdW5kaW5nQ2xpZW50UmVjdFwiLCBcImdldENsaWVudFJlY3RzXCIsIFwic2Nyb2xsSW50b1ZpZXdcIiBdLmZvckVhY2gobWV0aG9kUmVxdWlyZXNSZW5kZXJpbmcpO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxFbGVtZW50LCBIVE1MRWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJcIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ7XG4gICAgc2NvcGUuZ2V0SW5uZXJIVE1MID0gZ2V0SW5uZXJIVE1MO1xuICAgIHNjb3BlLnNldElubmVySFRNTCA9IHNldElubmVySFRNTDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxIVE1MQ2FudmFzRWxlbWVudCA9IHdpbmRvdy5IVE1MQ2FudmFzRWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MQ2FudmFzRWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MQ2FudmFzRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oSFRNTENhbnZhc0VsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBnZXRDb250ZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbnRleHQgPSB1bnNhZmVVbndyYXAodGhpcykuZ2V0Q29udGV4dC5hcHBseSh1bnNhZmVVbndyYXAodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBjb250ZXh0ICYmIHdyYXAoY29udGV4dCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTENhbnZhc0VsZW1lbnQsIEhUTUxDYW52YXNFbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MQ2FudmFzRWxlbWVudCA9IEhUTUxDYW52YXNFbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBPcmlnaW5hbEhUTUxDb250ZW50RWxlbWVudCA9IHdpbmRvdy5IVE1MQ29udGVudEVsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTENvbnRlbnRFbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxDb250ZW50RWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oSFRNTENvbnRlbnRFbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IEhUTUxDb250ZW50RWxlbWVudCxcbiAgICAgIGdldCBzZWxlY3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShcInNlbGVjdFwiKTtcbiAgICAgIH0sXG4gICAgICBzZXQgc2VsZWN0KHZhbHVlKSB7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwic2VsZWN0XCIsIHZhbHVlKTtcbiAgICAgIH0sXG4gICAgICBzZXRBdHRyaWJ1dGU6IGZ1bmN0aW9uKG4sIHYpIHtcbiAgICAgICAgSFRNTEVsZW1lbnQucHJvdG90eXBlLnNldEF0dHJpYnV0ZS5jYWxsKHRoaXMsIG4sIHYpO1xuICAgICAgICBpZiAoU3RyaW5nKG4pLnRvTG93ZXJDYXNlKCkgPT09IFwic2VsZWN0XCIpIHRoaXMuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKHRydWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChPcmlnaW5hbEhUTUxDb250ZW50RWxlbWVudCkgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTENvbnRlbnRFbGVtZW50LCBIVE1MQ29udGVudEVsZW1lbnQpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxDb250ZW50RWxlbWVudCA9IEhUTUxDb250ZW50RWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgd3JhcEhUTUxDb2xsZWN0aW9uID0gc2NvcGUud3JhcEhUTUxDb2xsZWN0aW9uO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIE9yaWdpbmFsSFRNTEZvcm1FbGVtZW50ID0gd2luZG93LkhUTUxGb3JtRWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MRm9ybUVsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTEZvcm1FbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihIVE1MRm9ybUVsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBnZXQgZWxlbWVudHMoKSB7XG4gICAgICAgIHJldHVybiB3cmFwSFRNTENvbGxlY3Rpb24odW53cmFwKHRoaXMpLmVsZW1lbnRzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MRm9ybUVsZW1lbnQsIEhUTUxGb3JtRWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxGb3JtRWxlbWVudCA9IEhUTUxGb3JtRWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciByZXdyYXAgPSBzY29wZS5yZXdyYXA7XG4gICAgdmFyIE9yaWdpbmFsSFRNTEltYWdlRWxlbWVudCA9IHdpbmRvdy5IVE1MSW1hZ2VFbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxJbWFnZUVsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTEltYWdlRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTEltYWdlRWxlbWVudCwgSFRNTEltYWdlRWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKSk7XG4gICAgZnVuY3Rpb24gSW1hZ2Uod2lkdGgsIGhlaWdodCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEltYWdlKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRE9NIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xuICAgICAgfVxuICAgICAgdmFyIG5vZGUgPSB1bndyYXAoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKSk7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgICAgcmV3cmFwKG5vZGUsIHRoaXMpO1xuICAgICAgaWYgKHdpZHRoICE9PSB1bmRlZmluZWQpIG5vZGUud2lkdGggPSB3aWR0aDtcbiAgICAgIGlmIChoZWlnaHQgIT09IHVuZGVmaW5lZCkgbm9kZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfVxuICAgIEltYWdlLnByb3RvdHlwZSA9IEhUTUxJbWFnZUVsZW1lbnQucHJvdG90eXBlO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxJbWFnZUVsZW1lbnQgPSBIVE1MSW1hZ2VFbGVtZW50O1xuICAgIHNjb3BlLndyYXBwZXJzLkltYWdlID0gSW1hZ2U7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciBOb2RlTGlzdCA9IHNjb3BlLndyYXBwZXJzLk5vZGVMaXN0O1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIE9yaWdpbmFsSFRNTFNoYWRvd0VsZW1lbnQgPSB3aW5kb3cuSFRNTFNoYWRvd0VsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTFNoYWRvd0VsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTFNoYWRvd0VsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIEhUTUxTaGFkb3dFbGVtZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEhUTUxTaGFkb3dFbGVtZW50O1xuICAgIGlmIChPcmlnaW5hbEhUTUxTaGFkb3dFbGVtZW50KSByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MU2hhZG93RWxlbWVudCwgSFRNTFNoYWRvd0VsZW1lbnQpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxTaGFkb3dFbGVtZW50ID0gSFRNTFNoYWRvd0VsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgY29udGVudFRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgdGVtcGxhdGVDb250ZW50c093bmVyVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIGZ1bmN0aW9uIGdldFRlbXBsYXRlQ29udGVudHNPd25lcihkb2MpIHtcbiAgICAgIGlmICghZG9jLmRlZmF1bHRWaWV3KSByZXR1cm4gZG9jO1xuICAgICAgdmFyIGQgPSB0ZW1wbGF0ZUNvbnRlbnRzT3duZXJUYWJsZS5nZXQoZG9jKTtcbiAgICAgIGlmICghZCkge1xuICAgICAgICBkID0gZG9jLmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudChcIlwiKTtcbiAgICAgICAgd2hpbGUgKGQubGFzdENoaWxkKSB7XG4gICAgICAgICAgZC5yZW1vdmVDaGlsZChkLmxhc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGVDb250ZW50c093bmVyVGFibGUuc2V0KGRvYywgZCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZXh0cmFjdENvbnRlbnQodGVtcGxhdGVFbGVtZW50KSB7XG4gICAgICB2YXIgZG9jID0gZ2V0VGVtcGxhdGVDb250ZW50c093bmVyKHRlbXBsYXRlRWxlbWVudC5vd25lckRvY3VtZW50KTtcbiAgICAgIHZhciBkZiA9IHVud3JhcChkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTtcbiAgICAgIHZhciBjaGlsZDtcbiAgICAgIHdoaWxlIChjaGlsZCA9IHRlbXBsYXRlRWxlbWVudC5maXJzdENoaWxkKSB7XG4gICAgICAgIGRmLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZjtcbiAgICB9XG4gICAgdmFyIE9yaWdpbmFsSFRNTFRlbXBsYXRlRWxlbWVudCA9IHdpbmRvdy5IVE1MVGVtcGxhdGVFbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxUZW1wbGF0ZUVsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICAgIGlmICghT3JpZ2luYWxIVE1MVGVtcGxhdGVFbGVtZW50KSB7XG4gICAgICAgIHZhciBjb250ZW50ID0gZXh0cmFjdENvbnRlbnQobm9kZSk7XG4gICAgICAgIGNvbnRlbnRUYWJsZS5zZXQodGhpcywgd3JhcChjb250ZW50KSk7XG4gICAgICB9XG4gICAgfVxuICAgIEhUTUxUZW1wbGF0ZUVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKEhUTUxUZW1wbGF0ZUVsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3RvcjogSFRNTFRlbXBsYXRlRWxlbWVudCxcbiAgICAgIGdldCBjb250ZW50KCkge1xuICAgICAgICBpZiAoT3JpZ2luYWxIVE1MVGVtcGxhdGVFbGVtZW50KSByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuY29udGVudCk7XG4gICAgICAgIHJldHVybiBjb250ZW50VGFibGUuZ2V0KHRoaXMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChPcmlnaW5hbEhUTUxUZW1wbGF0ZUVsZW1lbnQpIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxUZW1wbGF0ZUVsZW1lbnQsIEhUTUxUZW1wbGF0ZUVsZW1lbnQpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxUZW1wbGF0ZUVsZW1lbnQgPSBIVE1MVGVtcGxhdGVFbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBPcmlnaW5hbEhUTUxNZWRpYUVsZW1lbnQgPSB3aW5kb3cuSFRNTE1lZGlhRWxlbWVudDtcbiAgICBpZiAoIU9yaWdpbmFsSFRNTE1lZGlhRWxlbWVudCkgcmV0dXJuO1xuICAgIGZ1bmN0aW9uIEhUTUxNZWRpYUVsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTE1lZGlhRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTE1lZGlhRWxlbWVudCwgSFRNTE1lZGlhRWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF1ZGlvXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MTWVkaWFFbGVtZW50ID0gSFRNTE1lZGlhRWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxNZWRpYUVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MTWVkaWFFbGVtZW50O1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgcmV3cmFwID0gc2NvcGUucmV3cmFwO1xuICAgIHZhciBPcmlnaW5hbEhUTUxBdWRpb0VsZW1lbnQgPSB3aW5kb3cuSFRNTEF1ZGlvRWxlbWVudDtcbiAgICBpZiAoIU9yaWdpbmFsSFRNTEF1ZGlvRWxlbWVudCkgcmV0dXJuO1xuICAgIGZ1bmN0aW9uIEhUTUxBdWRpb0VsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTE1lZGlhRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MQXVkaW9FbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTE1lZGlhRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxBdWRpb0VsZW1lbnQsIEhUTUxBdWRpb0VsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhdWRpb1wiKSk7XG4gICAgZnVuY3Rpb24gQXVkaW8oc3JjKSB7XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQXVkaW8pKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJET00gb2JqZWN0IGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBjYWxsZWQgYXMgYSBmdW5jdGlvbi5cIik7XG4gICAgICB9XG4gICAgICB2YXIgbm9kZSA9IHVud3JhcChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYXVkaW9cIikpO1xuICAgICAgSFRNTE1lZGlhRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgICAgcmV3cmFwKG5vZGUsIHRoaXMpO1xuICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJwcmVsb2FkXCIsIFwiYXV0b1wiKTtcbiAgICAgIGlmIChzcmMgIT09IHVuZGVmaW5lZCkgbm9kZS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgc3JjKTtcbiAgICB9XG4gICAgQXVkaW8ucHJvdG90eXBlID0gSFRNTEF1ZGlvRWxlbWVudC5wcm90b3R5cGU7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTEF1ZGlvRWxlbWVudCA9IEhUTUxBdWRpb0VsZW1lbnQ7XG4gICAgc2NvcGUud3JhcHBlcnMuQXVkaW8gPSBBdWRpbztcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgcmV3cmFwID0gc2NvcGUucmV3cmFwO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbEhUTUxPcHRpb25FbGVtZW50ID0gd2luZG93LkhUTUxPcHRpb25FbGVtZW50O1xuICAgIGZ1bmN0aW9uIHRyaW1UZXh0KHMpIHtcbiAgICAgIHJldHVybiBzLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gSFRNTE9wdGlvbkVsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTE9wdGlvbkVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKEhUTUxPcHRpb25FbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgZ2V0IHRleHQoKSB7XG4gICAgICAgIHJldHVybiB0cmltVGV4dCh0aGlzLnRleHRDb250ZW50KTtcbiAgICAgIH0sXG4gICAgICBzZXQgdGV4dCh2YWx1ZSkge1xuICAgICAgICB0aGlzLnRleHRDb250ZW50ID0gdHJpbVRleHQoU3RyaW5nKHZhbHVlKSk7XG4gICAgICB9LFxuICAgICAgZ2V0IGZvcm0oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5mb3JtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MT3B0aW9uRWxlbWVudCwgSFRNTE9wdGlvbkVsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvcHRpb25cIikpO1xuICAgIGZ1bmN0aW9uIE9wdGlvbih0ZXh0LCB2YWx1ZSwgZGVmYXVsdFNlbGVjdGVkLCBzZWxlY3RlZCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE9wdGlvbikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkRPTSBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgICAgIH1cbiAgICAgIHZhciBub2RlID0gdW53cmFwKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvcHRpb25cIikpO1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICAgIHJld3JhcChub2RlLCB0aGlzKTtcbiAgICAgIGlmICh0ZXh0ICE9PSB1bmRlZmluZWQpIG5vZGUudGV4dCA9IHRleHQ7XG4gICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkgbm9kZS5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCB2YWx1ZSk7XG4gICAgICBpZiAoZGVmYXVsdFNlbGVjdGVkID09PSB0cnVlKSBub2RlLnNldEF0dHJpYnV0ZShcInNlbGVjdGVkXCIsIFwiXCIpO1xuICAgICAgbm9kZS5zZWxlY3RlZCA9IHNlbGVjdGVkID09PSB0cnVlO1xuICAgIH1cbiAgICBPcHRpb24ucHJvdG90eXBlID0gSFRNTE9wdGlvbkVsZW1lbnQucHJvdG90eXBlO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxPcHRpb25FbGVtZW50ID0gSFRNTE9wdGlvbkVsZW1lbnQ7XG4gICAgc2NvcGUud3JhcHBlcnMuT3B0aW9uID0gT3B0aW9uO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbEhUTUxTZWxlY3RFbGVtZW50ID0gd2luZG93LkhUTUxTZWxlY3RFbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxTZWxlY3RFbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxTZWxlY3RFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihIVE1MU2VsZWN0RWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGFkZDogZnVuY3Rpb24oZWxlbWVudCwgYmVmb3JlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYmVmb3JlID09PSBcIm9iamVjdFwiKSBiZWZvcmUgPSB1bndyYXAoYmVmb3JlKTtcbiAgICAgICAgdW53cmFwKHRoaXMpLmFkZCh1bndyYXAoZWxlbWVudCksIGJlZm9yZSk7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlOiBmdW5jdGlvbihpbmRleE9yTm9kZSkge1xuICAgICAgICBpZiAoaW5kZXhPck5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIEhUTUxFbGVtZW50LnByb3RvdHlwZS5yZW1vdmUuY2FsbCh0aGlzKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBpbmRleE9yTm9kZSA9PT0gXCJvYmplY3RcIikgaW5kZXhPck5vZGUgPSB1bndyYXAoaW5kZXhPck5vZGUpO1xuICAgICAgICB1bndyYXAodGhpcykucmVtb3ZlKGluZGV4T3JOb2RlKTtcbiAgICAgIH0sXG4gICAgICBnZXQgZm9ybSgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmZvcm0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxTZWxlY3RFbGVtZW50LCBIVE1MU2VsZWN0RWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlbGVjdFwiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTFNlbGVjdEVsZW1lbnQgPSBIVE1MU2VsZWN0RWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgd3JhcEhUTUxDb2xsZWN0aW9uID0gc2NvcGUud3JhcEhUTUxDb2xsZWN0aW9uO1xuICAgIHZhciBPcmlnaW5hbEhUTUxUYWJsZUVsZW1lbnQgPSB3aW5kb3cuSFRNTFRhYmxlRWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MVGFibGVFbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxUYWJsZUVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKEhUTUxUYWJsZUVsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBnZXQgY2FwdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmNhcHRpb24pO1xuICAgICAgfSxcbiAgICAgIGNyZWF0ZUNhcHRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuY3JlYXRlQ2FwdGlvbigpKTtcbiAgICAgIH0sXG4gICAgICBnZXQgdEhlYWQoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS50SGVhZCk7XG4gICAgICB9LFxuICAgICAgY3JlYXRlVEhlYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuY3JlYXRlVEhlYWQoKSk7XG4gICAgICB9LFxuICAgICAgY3JlYXRlVEZvb3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuY3JlYXRlVEZvb3QoKSk7XG4gICAgICB9LFxuICAgICAgZ2V0IHRGb290KCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykudEZvb3QpO1xuICAgICAgfSxcbiAgICAgIGdldCB0Qm9kaWVzKCkge1xuICAgICAgICByZXR1cm4gd3JhcEhUTUxDb2xsZWN0aW9uKHVud3JhcCh0aGlzKS50Qm9kaWVzKTtcbiAgICAgIH0sXG4gICAgICBjcmVhdGVUQm9keTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5jcmVhdGVUQm9keSgpKTtcbiAgICAgIH0sXG4gICAgICBnZXQgcm93cygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBIVE1MQ29sbGVjdGlvbih1bndyYXAodGhpcykucm93cyk7XG4gICAgICB9LFxuICAgICAgaW5zZXJ0Um93OiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuaW5zZXJ0Um93KGluZGV4KSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTFRhYmxlRWxlbWVudCwgSFRNTFRhYmxlRWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRhYmxlXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MVGFibGVFbGVtZW50ID0gSFRNTFRhYmxlRWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgd3JhcEhUTUxDb2xsZWN0aW9uID0gc2NvcGUud3JhcEhUTUxDb2xsZWN0aW9uO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbEhUTUxUYWJsZVNlY3Rpb25FbGVtZW50ID0gd2luZG93LkhUTUxUYWJsZVNlY3Rpb25FbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxUYWJsZVNlY3Rpb25FbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxUYWJsZVNlY3Rpb25FbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihIVE1MVGFibGVTZWN0aW9uRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiBIVE1MVGFibGVTZWN0aW9uRWxlbWVudCxcbiAgICAgIGdldCByb3dzKCkge1xuICAgICAgICByZXR1cm4gd3JhcEhUTUxDb2xsZWN0aW9uKHVud3JhcCh0aGlzKS5yb3dzKTtcbiAgICAgIH0sXG4gICAgICBpbnNlcnRSb3c6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5pbnNlcnRSb3coaW5kZXgpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MVGFibGVTZWN0aW9uRWxlbWVudCwgSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aGVhZFwiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQgPSBIVE1MVGFibGVTZWN0aW9uRWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgd3JhcEhUTUxDb2xsZWN0aW9uID0gc2NvcGUud3JhcEhUTUxDb2xsZWN0aW9uO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbEhUTUxUYWJsZVJvd0VsZW1lbnQgPSB3aW5kb3cuSFRNTFRhYmxlUm93RWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MVGFibGVSb3dFbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxUYWJsZVJvd0VsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKEhUTUxUYWJsZVJvd0VsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBnZXQgY2VsbHMoKSB7XG4gICAgICAgIHJldHVybiB3cmFwSFRNTENvbGxlY3Rpb24odW53cmFwKHRoaXMpLmNlbGxzKTtcbiAgICAgIH0sXG4gICAgICBpbnNlcnRDZWxsOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuaW5zZXJ0Q2VsbChpbmRleCkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxUYWJsZVJvd0VsZW1lbnQsIEhUTUxUYWJsZVJvd0VsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTFRhYmxlUm93RWxlbWVudCA9IEhUTUxUYWJsZVJvd0VsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MQ29udGVudEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MQ29udGVudEVsZW1lbnQ7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIEhUTUxTaGFkb3dFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTFNoYWRvd0VsZW1lbnQ7XG4gICAgdmFyIEhUTUxUZW1wbGF0ZUVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MVGVtcGxhdGVFbGVtZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIE9yaWdpbmFsSFRNTFVua25vd25FbGVtZW50ID0gd2luZG93LkhUTUxVbmtub3duRWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MVW5rbm93bkVsZW1lbnQobm9kZSkge1xuICAgICAgc3dpdGNoIChub2RlLmxvY2FsTmFtZSkge1xuICAgICAgIGNhc2UgXCJjb250ZW50XCI6XG4gICAgICAgIHJldHVybiBuZXcgSFRNTENvbnRlbnRFbGVtZW50KG5vZGUpO1xuXG4gICAgICAgY2FzZSBcInNoYWRvd1wiOlxuICAgICAgICByZXR1cm4gbmV3IEhUTUxTaGFkb3dFbGVtZW50KG5vZGUpO1xuXG4gICAgICAgY2FzZSBcInRlbXBsYXRlXCI6XG4gICAgICAgIHJldHVybiBuZXcgSFRNTFRlbXBsYXRlRWxlbWVudChub2RlKTtcbiAgICAgIH1cbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxVbmtub3duRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTFVua25vd25FbGVtZW50LCBIVE1MVW5rbm93bkVsZW1lbnQpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxVbmtub3duRWxlbWVudCA9IEhUTUxVbmtub3duRWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5FbGVtZW50O1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIGRlZmluZVdyYXBHZXR0ZXIgPSBzY29wZS5kZWZpbmVXcmFwR2V0dGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciBTVkdfTlMgPSBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI7XG4gICAgdmFyIE9yaWdpbmFsU1ZHRWxlbWVudCA9IHdpbmRvdy5TVkdFbGVtZW50O1xuICAgIHZhciBzdmdUaXRsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoU1ZHX05TLCBcInRpdGxlXCIpO1xuICAgIGlmICghKFwiY2xhc3NMaXN0XCIgaW4gc3ZnVGl0bGVFbGVtZW50KSkge1xuICAgICAgdmFyIGRlc2NyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihFbGVtZW50LnByb3RvdHlwZSwgXCJjbGFzc0xpc3RcIik7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSFRNTEVsZW1lbnQucHJvdG90eXBlLCBcImNsYXNzTGlzdFwiLCBkZXNjcik7XG4gICAgICBkZWxldGUgRWxlbWVudC5wcm90b3R5cGUuY2xhc3NMaXN0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBTVkdFbGVtZW50KG5vZGUpIHtcbiAgICAgIEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgU1ZHRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihTVkdFbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgZ2V0IG93bmVyU1ZHRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLm93bmVyU1ZHRWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsU1ZHRWxlbWVudCwgU1ZHRWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFNWR19OUywgXCJ0aXRsZVwiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuU1ZHRWxlbWVudCA9IFNWR0VsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsU1ZHVXNlRWxlbWVudCA9IHdpbmRvdy5TVkdVc2VFbGVtZW50O1xuICAgIHZhciBTVkdfTlMgPSBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI7XG4gICAgdmFyIGdXcmFwcGVyID0gd3JhcChkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoU1ZHX05TLCBcImdcIikpO1xuICAgIHZhciB1c2VFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFNWR19OUywgXCJ1c2VcIik7XG4gICAgdmFyIFNWR0dFbGVtZW50ID0gZ1dyYXBwZXIuY29uc3RydWN0b3I7XG4gICAgdmFyIHBhcmVudEludGVyZmFjZVByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihTVkdHRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIHZhciBwYXJlbnRJbnRlcmZhY2UgPSBwYXJlbnRJbnRlcmZhY2VQcm90b3R5cGUuY29uc3RydWN0b3I7XG4gICAgZnVuY3Rpb24gU1ZHVXNlRWxlbWVudChpbXBsKSB7XG4gICAgICBwYXJlbnRJbnRlcmZhY2UuY2FsbCh0aGlzLCBpbXBsKTtcbiAgICB9XG4gICAgU1ZHVXNlRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHBhcmVudEludGVyZmFjZVByb3RvdHlwZSk7XG4gICAgaWYgKFwiaW5zdGFuY2VSb290XCIgaW4gdXNlRWxlbWVudCkge1xuICAgICAgbWl4aW4oU1ZHVXNlRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgICAgZ2V0IGluc3RhbmNlUm9vdCgpIHtcbiAgICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuaW5zdGFuY2VSb290KTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0IGFuaW1hdGVkSW5zdGFuY2VSb290KCkge1xuICAgICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5hbmltYXRlZEluc3RhbmNlUm9vdCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxTVkdVc2VFbGVtZW50LCBTVkdVc2VFbGVtZW50LCB1c2VFbGVtZW50KTtcbiAgICBzY29wZS53cmFwcGVycy5TVkdVc2VFbGVtZW50ID0gU1ZHVXNlRWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEV2ZW50VGFyZ2V0ID0gc2NvcGUud3JhcHBlcnMuRXZlbnRUYXJnZXQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxTVkdFbGVtZW50SW5zdGFuY2UgPSB3aW5kb3cuU1ZHRWxlbWVudEluc3RhbmNlO1xuICAgIGlmICghT3JpZ2luYWxTVkdFbGVtZW50SW5zdGFuY2UpIHJldHVybjtcbiAgICBmdW5jdGlvbiBTVkdFbGVtZW50SW5zdGFuY2UoaW1wbCkge1xuICAgICAgRXZlbnRUYXJnZXQuY2FsbCh0aGlzLCBpbXBsKTtcbiAgICB9XG4gICAgU1ZHRWxlbWVudEluc3RhbmNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZlbnRUYXJnZXQucHJvdG90eXBlKTtcbiAgICBtaXhpbihTVkdFbGVtZW50SW5zdGFuY2UucHJvdG90eXBlLCB7XG4gICAgICBnZXQgY29ycmVzcG9uZGluZ0VsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5jb3JyZXNwb25kaW5nRWxlbWVudCk7XG4gICAgICB9LFxuICAgICAgZ2V0IGNvcnJlc3BvbmRpbmdVc2VFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuY29ycmVzcG9uZGluZ1VzZUVsZW1lbnQpO1xuICAgICAgfSxcbiAgICAgIGdldCBwYXJlbnROb2RlKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykucGFyZW50Tm9kZSk7XG4gICAgICB9LFxuICAgICAgZ2V0IGNoaWxkTm9kZXMoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgICAgIH0sXG4gICAgICBnZXQgZmlyc3RDaGlsZCgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmZpcnN0Q2hpbGQpO1xuICAgICAgfSxcbiAgICAgIGdldCBsYXN0Q2hpbGQoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5sYXN0Q2hpbGQpO1xuICAgICAgfSxcbiAgICAgIGdldCBwcmV2aW91c1NpYmxpbmcoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5wcmV2aW91c1NpYmxpbmcpO1xuICAgICAgfSxcbiAgICAgIGdldCBuZXh0U2libGluZygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLm5leHRTaWJsaW5nKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxTVkdFbGVtZW50SW5zdGFuY2UsIFNWR0VsZW1lbnRJbnN0YW5jZSk7XG4gICAgc2NvcGUud3JhcHBlcnMuU1ZHRWxlbWVudEluc3RhbmNlID0gU1ZHRWxlbWVudEluc3RhbmNlO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBzZXRXcmFwcGVyID0gc2NvcGUuc2V0V3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHVud3JhcElmTmVlZGVkID0gc2NvcGUudW53cmFwSWZOZWVkZWQ7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCA9IHdpbmRvdy5DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG4gICAgZnVuY3Rpb24gQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKGltcGwpIHtcbiAgICAgIHNldFdyYXBwZXIoaW1wbCwgdGhpcyk7XG4gICAgfVxuICAgIG1peGluKENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC5wcm90b3R5cGUsIHtcbiAgICAgIGdldCBjYW52YXMoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5jYW52YXMpO1xuICAgICAgfSxcbiAgICAgIGRyYXdJbWFnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGFyZ3VtZW50c1swXSA9IHVud3JhcElmTmVlZGVkKGFyZ3VtZW50c1swXSk7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5kcmF3SW1hZ2UuYXBwbHkodW5zYWZlVW53cmFwKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgICAgfSxcbiAgICAgIGNyZWF0ZVBhdHRlcm46IGZ1bmN0aW9uKCkge1xuICAgICAgICBhcmd1bWVudHNbMF0gPSB1bndyYXAoYXJndW1lbnRzWzBdKTtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5jcmVhdGVQYXR0ZXJuLmFwcGx5KHVuc2FmZVVud3JhcCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKS5nZXRDb250ZXh0KFwiMmRcIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCA9IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIGFkZEZvcndhcmRpbmdQcm9wZXJ0aWVzID0gc2NvcGUuYWRkRm9yd2FyZGluZ1Byb3BlcnRpZXM7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgc2V0V3JhcHBlciA9IHNjb3BlLnNldFdyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwSWZOZWVkZWQgPSBzY29wZS51bndyYXBJZk5lZWRlZDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsV2ViR0xSZW5kZXJpbmdDb250ZXh0ID0gd2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dDtcbiAgICBpZiAoIU9yaWdpbmFsV2ViR0xSZW5kZXJpbmdDb250ZXh0KSByZXR1cm47XG4gICAgZnVuY3Rpb24gV2ViR0xSZW5kZXJpbmdDb250ZXh0KGltcGwpIHtcbiAgICAgIHNldFdyYXBwZXIoaW1wbCwgdGhpcyk7XG4gICAgfVxuICAgIG1peGluKFdlYkdMUmVuZGVyaW5nQ29udGV4dC5wcm90b3R5cGUsIHtcbiAgICAgIGdldCBjYW52YXMoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5jYW52YXMpO1xuICAgICAgfSxcbiAgICAgIHRleEltYWdlMkQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBhcmd1bWVudHNbNV0gPSB1bndyYXBJZk5lZWRlZChhcmd1bWVudHNbNV0pO1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykudGV4SW1hZ2UyRC5hcHBseSh1bnNhZmVVbndyYXAodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgICB9LFxuICAgICAgdGV4U3ViSW1hZ2UyRDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGFyZ3VtZW50c1s2XSA9IHVud3JhcElmTmVlZGVkKGFyZ3VtZW50c1s2XSk7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS50ZXhTdWJJbWFnZTJELmFwcGx5KHVuc2FmZVVud3JhcCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgT3JpZ2luYWxXZWJHTFJlbmRlcmluZ0NvbnRleHRCYXNlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKE9yaWdpbmFsV2ViR0xSZW5kZXJpbmdDb250ZXh0LnByb3RvdHlwZSk7XG4gICAgaWYgKE9yaWdpbmFsV2ViR0xSZW5kZXJpbmdDb250ZXh0QmFzZSAhPT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgICAgYWRkRm9yd2FyZGluZ1Byb3BlcnRpZXMoT3JpZ2luYWxXZWJHTFJlbmRlcmluZ0NvbnRleHRCYXNlLCBXZWJHTFJlbmRlcmluZ0NvbnRleHQucHJvdG90eXBlKTtcbiAgICB9XG4gICAgdmFyIGluc3RhbmNlUHJvcGVydGllcyA9IC9XZWJLaXQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgPyB7XG4gICAgICBkcmF3aW5nQnVmZmVySGVpZ2h0OiBudWxsLFxuICAgICAgZHJhd2luZ0J1ZmZlcldpZHRoOiBudWxsXG4gICAgfSA6IHt9O1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbFdlYkdMUmVuZGVyaW5nQ29udGV4dCwgV2ViR0xSZW5kZXJpbmdDb250ZXh0LCBpbnN0YW5jZVByb3BlcnRpZXMpO1xuICAgIHNjb3BlLndyYXBwZXJzLldlYkdMUmVuZGVyaW5nQ29udGV4dCA9IFdlYkdMUmVuZGVyaW5nQ29udGV4dDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIE5vZGUgPSBzY29wZS53cmFwcGVycy5Ob2RlO1xuICAgIHZhciBHZXRFbGVtZW50c0J5SW50ZXJmYWNlID0gc2NvcGUuR2V0RWxlbWVudHNCeUludGVyZmFjZTtcbiAgICB2YXIgTm9uRWxlbWVudFBhcmVudE5vZGVJbnRlcmZhY2UgPSBzY29wZS5Ob25FbGVtZW50UGFyZW50Tm9kZUludGVyZmFjZTtcbiAgICB2YXIgUGFyZW50Tm9kZUludGVyZmFjZSA9IHNjb3BlLlBhcmVudE5vZGVJbnRlcmZhY2U7XG4gICAgdmFyIFNlbGVjdG9yc0ludGVyZmFjZSA9IHNjb3BlLlNlbGVjdG9yc0ludGVyZmFjZTtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJPYmplY3QgPSBzY29wZS5yZWdpc3Rlck9iamVjdDtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBPcmlnaW5hbERvY3VtZW50RnJhZ21lbnQgPSB3aW5kb3cuRG9jdW1lbnRGcmFnbWVudDtcbiAgICBmdW5jdGlvbiBEb2N1bWVudEZyYWdtZW50KG5vZGUpIHtcbiAgICAgIE5vZGUuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgRG9jdW1lbnRGcmFnbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE5vZGUucHJvdG90eXBlKTtcbiAgICBtaXhpbihEb2N1bWVudEZyYWdtZW50LnByb3RvdHlwZSwgUGFyZW50Tm9kZUludGVyZmFjZSk7XG4gICAgbWl4aW4oRG9jdW1lbnRGcmFnbWVudC5wcm90b3R5cGUsIFNlbGVjdG9yc0ludGVyZmFjZSk7XG4gICAgbWl4aW4oRG9jdW1lbnRGcmFnbWVudC5wcm90b3R5cGUsIEdldEVsZW1lbnRzQnlJbnRlcmZhY2UpO1xuICAgIG1peGluKERvY3VtZW50RnJhZ21lbnQucHJvdG90eXBlLCBOb25FbGVtZW50UGFyZW50Tm9kZUludGVyZmFjZSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsRG9jdW1lbnRGcmFnbWVudCwgRG9jdW1lbnRGcmFnbWVudCwgZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTtcbiAgICBzY29wZS53cmFwcGVycy5Eb2N1bWVudEZyYWdtZW50ID0gRG9jdW1lbnRGcmFnbWVudDtcbiAgICB2YXIgQ29tbWVudCA9IHJlZ2lzdGVyT2JqZWN0KGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoXCJcIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLkNvbW1lbnQgPSBDb21tZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgRG9jdW1lbnRGcmFnbWVudCA9IHNjb3BlLndyYXBwZXJzLkRvY3VtZW50RnJhZ21lbnQ7XG4gICAgdmFyIFRyZWVTY29wZSA9IHNjb3BlLlRyZWVTY29wZTtcbiAgICB2YXIgZWxlbWVudEZyb21Qb2ludCA9IHNjb3BlLmVsZW1lbnRGcm9tUG9pbnQ7XG4gICAgdmFyIGdldElubmVySFRNTCA9IHNjb3BlLmdldElubmVySFRNTDtcbiAgICB2YXIgZ2V0VHJlZVNjb3BlID0gc2NvcGUuZ2V0VHJlZVNjb3BlO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZXdyYXAgPSBzY29wZS5yZXdyYXA7XG4gICAgdmFyIHNldElubmVySFRNTCA9IHNjb3BlLnNldElubmVySFRNTDtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBzaGFkb3dIb3N0VGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBuZXh0T2xkZXJTaGFkb3dUcmVlVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIGZ1bmN0aW9uIFNoYWRvd1Jvb3QoaG9zdFdyYXBwZXIpIHtcbiAgICAgIHZhciBub2RlID0gdW53cmFwKHVuc2FmZVVud3JhcChob3N0V3JhcHBlcikub3duZXJEb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpO1xuICAgICAgRG9jdW1lbnRGcmFnbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgICAgcmV3cmFwKG5vZGUsIHRoaXMpO1xuICAgICAgdmFyIG9sZFNoYWRvd1Jvb3QgPSBob3N0V3JhcHBlci5zaGFkb3dSb290O1xuICAgICAgbmV4dE9sZGVyU2hhZG93VHJlZVRhYmxlLnNldCh0aGlzLCBvbGRTaGFkb3dSb290KTtcbiAgICAgIHRoaXMudHJlZVNjb3BlXyA9IG5ldyBUcmVlU2NvcGUodGhpcywgZ2V0VHJlZVNjb3BlKG9sZFNoYWRvd1Jvb3QgfHwgaG9zdFdyYXBwZXIpKTtcbiAgICAgIHNoYWRvd0hvc3RUYWJsZS5zZXQodGhpcywgaG9zdFdyYXBwZXIpO1xuICAgIH1cbiAgICBTaGFkb3dSb290LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRG9jdW1lbnRGcmFnbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKFNoYWRvd1Jvb3QucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3RvcjogU2hhZG93Um9vdCxcbiAgICAgIGdldCBpbm5lckhUTUwoKSB7XG4gICAgICAgIHJldHVybiBnZXRJbm5lckhUTUwodGhpcyk7XG4gICAgICB9LFxuICAgICAgc2V0IGlubmVySFRNTCh2YWx1ZSkge1xuICAgICAgICBzZXRJbm5lckhUTUwodGhpcywgdmFsdWUpO1xuICAgICAgICB0aGlzLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcigpO1xuICAgICAgfSxcbiAgICAgIGdldCBvbGRlclNoYWRvd1Jvb3QoKSB7XG4gICAgICAgIHJldHVybiBuZXh0T2xkZXJTaGFkb3dUcmVlVGFibGUuZ2V0KHRoaXMpIHx8IG51bGw7XG4gICAgICB9LFxuICAgICAgZ2V0IGhvc3QoKSB7XG4gICAgICAgIHJldHVybiBzaGFkb3dIb3N0VGFibGUuZ2V0KHRoaXMpIHx8IG51bGw7XG4gICAgICB9LFxuICAgICAgaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNoYWRvd0hvc3RUYWJsZS5nZXQodGhpcykuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKCk7XG4gICAgICB9LFxuICAgICAgZWxlbWVudEZyb21Qb2ludDogZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICByZXR1cm4gZWxlbWVudEZyb21Qb2ludCh0aGlzLCB0aGlzLm93bmVyRG9jdW1lbnQsIHgsIHkpO1xuICAgICAgfSxcbiAgICAgIGdldFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRTZWxlY3Rpb24oKTtcbiAgICAgIH0sXG4gICAgICBnZXQgYWN0aXZlRWxlbWVudCgpIHtcbiAgICAgICAgdmFyIHVud3JhcHBlZEFjdGl2ZUVsZW1lbnQgPSB1bndyYXAodGhpcykub3duZXJEb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgICAgICBpZiAoIXVud3JhcHBlZEFjdGl2ZUVsZW1lbnQgfHwgIXVud3JhcHBlZEFjdGl2ZUVsZW1lbnQubm9kZVR5cGUpIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgYWN0aXZlRWxlbWVudCA9IHdyYXAodW53cmFwcGVkQWN0aXZlRWxlbWVudCk7XG4gICAgICAgIHdoaWxlICghdGhpcy5jb250YWlucyhhY3RpdmVFbGVtZW50KSkge1xuICAgICAgICAgIHdoaWxlIChhY3RpdmVFbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQgPSBhY3RpdmVFbGVtZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhY3RpdmVFbGVtZW50Lmhvc3QpIHtcbiAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQgPSBhY3RpdmVFbGVtZW50Lmhvc3Q7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aXZlRWxlbWVudDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBzY29wZS53cmFwcGVycy5TaGFkb3dSb290ID0gU2hhZG93Um9vdDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgc2V0V3JhcHBlciA9IHNjb3BlLnNldFdyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB1bndyYXBJZk5lZWRlZCA9IHNjb3BlLnVud3JhcElmTmVlZGVkO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgZ2V0VHJlZVNjb3BlID0gc2NvcGUuZ2V0VHJlZVNjb3BlO1xuICAgIHZhciBPcmlnaW5hbFJhbmdlID0gd2luZG93LlJhbmdlO1xuICAgIHZhciBTaGFkb3dSb290ID0gc2NvcGUud3JhcHBlcnMuU2hhZG93Um9vdDtcbiAgICBmdW5jdGlvbiBnZXRIb3N0KG5vZGUpIHtcbiAgICAgIHZhciByb290ID0gZ2V0VHJlZVNjb3BlKG5vZGUpLnJvb3Q7XG4gICAgICBpZiAocm9vdCBpbnN0YW5jZW9mIFNoYWRvd1Jvb3QpIHtcbiAgICAgICAgcmV0dXJuIHJvb3QuaG9zdDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBob3N0Tm9kZVRvU2hhZG93Tm9kZShyZWZOb2RlLCBvZmZzZXQpIHtcbiAgICAgIGlmIChyZWZOb2RlLnNoYWRvd1Jvb3QpIHtcbiAgICAgICAgb2Zmc2V0ID0gTWF0aC5taW4ocmVmTm9kZS5jaGlsZE5vZGVzLmxlbmd0aCAtIDEsIG9mZnNldCk7XG4gICAgICAgIHZhciBjaGlsZCA9IHJlZk5vZGUuY2hpbGROb2Rlc1tvZmZzZXRdO1xuICAgICAgICBpZiAoY2hpbGQpIHtcbiAgICAgICAgICB2YXIgaW5zZXJ0aW9uUG9pbnQgPSBzY29wZS5nZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyhjaGlsZCk7XG4gICAgICAgICAgaWYgKGluc2VydGlvblBvaW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnROb2RlID0gaW5zZXJ0aW9uUG9pbnRbMF0ucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIGlmIChwYXJlbnROb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgIHJlZk5vZGUgPSBwYXJlbnROb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlZk5vZGU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNoYWRvd05vZGVUb0hvc3ROb2RlKG5vZGUpIHtcbiAgICAgIG5vZGUgPSB3cmFwKG5vZGUpO1xuICAgICAgcmV0dXJuIGdldEhvc3Qobm9kZSkgfHwgbm9kZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gUmFuZ2UoaW1wbCkge1xuICAgICAgc2V0V3JhcHBlcihpbXBsLCB0aGlzKTtcbiAgICB9XG4gICAgUmFuZ2UucHJvdG90eXBlID0ge1xuICAgICAgZ2V0IHN0YXJ0Q29udGFpbmVyKCkge1xuICAgICAgICByZXR1cm4gc2hhZG93Tm9kZVRvSG9zdE5vZGUodW5zYWZlVW53cmFwKHRoaXMpLnN0YXJ0Q29udGFpbmVyKTtcbiAgICAgIH0sXG4gICAgICBnZXQgZW5kQ29udGFpbmVyKCkge1xuICAgICAgICByZXR1cm4gc2hhZG93Tm9kZVRvSG9zdE5vZGUodW5zYWZlVW53cmFwKHRoaXMpLmVuZENvbnRhaW5lcik7XG4gICAgICB9LFxuICAgICAgZ2V0IGNvbW1vbkFuY2VzdG9yQ29udGFpbmVyKCkge1xuICAgICAgICByZXR1cm4gc2hhZG93Tm9kZVRvSG9zdE5vZGUodW5zYWZlVW53cmFwKHRoaXMpLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyKTtcbiAgICAgIH0sXG4gICAgICBzZXRTdGFydDogZnVuY3Rpb24ocmVmTm9kZSwgb2Zmc2V0KSB7XG4gICAgICAgIHJlZk5vZGUgPSBob3N0Tm9kZVRvU2hhZG93Tm9kZShyZWZOb2RlLCBvZmZzZXQpO1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuc2V0U3RhcnQodW53cmFwSWZOZWVkZWQocmVmTm9kZSksIG9mZnNldCk7XG4gICAgICB9LFxuICAgICAgc2V0RW5kOiBmdW5jdGlvbihyZWZOb2RlLCBvZmZzZXQpIHtcbiAgICAgICAgcmVmTm9kZSA9IGhvc3ROb2RlVG9TaGFkb3dOb2RlKHJlZk5vZGUsIG9mZnNldCk7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5zZXRFbmQodW53cmFwSWZOZWVkZWQocmVmTm9kZSksIG9mZnNldCk7XG4gICAgICB9LFxuICAgICAgc2V0U3RhcnRCZWZvcmU6IGZ1bmN0aW9uKHJlZk5vZGUpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnNldFN0YXJ0QmVmb3JlKHVud3JhcElmTmVlZGVkKHJlZk5vZGUpKTtcbiAgICAgIH0sXG4gICAgICBzZXRTdGFydEFmdGVyOiBmdW5jdGlvbihyZWZOb2RlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5zZXRTdGFydEFmdGVyKHVud3JhcElmTmVlZGVkKHJlZk5vZGUpKTtcbiAgICAgIH0sXG4gICAgICBzZXRFbmRCZWZvcmU6IGZ1bmN0aW9uKHJlZk5vZGUpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnNldEVuZEJlZm9yZSh1bndyYXBJZk5lZWRlZChyZWZOb2RlKSk7XG4gICAgICB9LFxuICAgICAgc2V0RW5kQWZ0ZXI6IGZ1bmN0aW9uKHJlZk5vZGUpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnNldEVuZEFmdGVyKHVud3JhcElmTmVlZGVkKHJlZk5vZGUpKTtcbiAgICAgIH0sXG4gICAgICBzZWxlY3ROb2RlOiBmdW5jdGlvbihyZWZOb2RlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5zZWxlY3ROb2RlKHVud3JhcElmTmVlZGVkKHJlZk5vZGUpKTtcbiAgICAgIH0sXG4gICAgICBzZWxlY3ROb2RlQ29udGVudHM6IGZ1bmN0aW9uKHJlZk5vZGUpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnNlbGVjdE5vZGVDb250ZW50cyh1bndyYXBJZk5lZWRlZChyZWZOb2RlKSk7XG4gICAgICB9LFxuICAgICAgY29tcGFyZUJvdW5kYXJ5UG9pbnRzOiBmdW5jdGlvbihob3csIHNvdXJjZVJhbmdlKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykuY29tcGFyZUJvdW5kYXJ5UG9pbnRzKGhvdywgdW53cmFwKHNvdXJjZVJhbmdlKSk7XG4gICAgICB9LFxuICAgICAgZXh0cmFjdENvbnRlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmV4dHJhY3RDb250ZW50cygpKTtcbiAgICAgIH0sXG4gICAgICBjbG9uZUNvbnRlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmNsb25lQ29udGVudHMoKSk7XG4gICAgICB9LFxuICAgICAgaW5zZXJ0Tm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuaW5zZXJ0Tm9kZSh1bndyYXBJZk5lZWRlZChub2RlKSk7XG4gICAgICB9LFxuICAgICAgc3Vycm91bmRDb250ZW50czogZnVuY3Rpb24obmV3UGFyZW50KSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5zdXJyb3VuZENvbnRlbnRzKHVud3JhcElmTmVlZGVkKG5ld1BhcmVudCkpO1xuICAgICAgfSxcbiAgICAgIGNsb25lUmFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuY2xvbmVSYW5nZSgpKTtcbiAgICAgIH0sXG4gICAgICBpc1BvaW50SW5SYW5nZTogZnVuY3Rpb24obm9kZSwgb2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykuaXNQb2ludEluUmFuZ2UodW53cmFwSWZOZWVkZWQobm9kZSksIG9mZnNldCk7XG4gICAgICB9LFxuICAgICAgY29tcGFyZVBvaW50OiBmdW5jdGlvbihub2RlLCBvZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5jb21wYXJlUG9pbnQodW53cmFwSWZOZWVkZWQobm9kZSksIG9mZnNldCk7XG4gICAgICB9LFxuICAgICAgaW50ZXJzZWN0c05vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5pbnRlcnNlY3RzTm9kZSh1bndyYXBJZk5lZWRlZChub2RlKSk7XG4gICAgICB9LFxuICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLnRvU3RyaW5nKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBpZiAoT3JpZ2luYWxSYW5nZS5wcm90b3R5cGUuY3JlYXRlQ29udGV4dHVhbEZyYWdtZW50KSB7XG4gICAgICBSYW5nZS5wcm90b3R5cGUuY3JlYXRlQ29udGV4dHVhbEZyYWdtZW50ID0gZnVuY3Rpb24oaHRtbCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuY3JlYXRlQ29udGV4dHVhbEZyYWdtZW50KGh0bWwpKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJlZ2lzdGVyV3JhcHBlcih3aW5kb3cuUmFuZ2UsIFJhbmdlLCBkb2N1bWVudC5jcmVhdGVSYW5nZSgpKTtcbiAgICBzY29wZS53cmFwcGVycy5SYW5nZSA9IFJhbmdlO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkVsZW1lbnQ7XG4gICAgdmFyIEhUTUxDb250ZW50RWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxDb250ZW50RWxlbWVudDtcbiAgICB2YXIgSFRNTFNoYWRvd0VsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MU2hhZG93RWxlbWVudDtcbiAgICB2YXIgTm9kZSA9IHNjb3BlLndyYXBwZXJzLk5vZGU7XG4gICAgdmFyIFNoYWRvd1Jvb3QgPSBzY29wZS53cmFwcGVycy5TaGFkb3dSb290O1xuICAgIHZhciBhc3NlcnQgPSBzY29wZS5hc3NlcnQ7XG4gICAgdmFyIGdldFRyZWVTY29wZSA9IHNjb3BlLmdldFRyZWVTY29wZTtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgb25lT2YgPSBzY29wZS5vbmVPZjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBBcnJheVNwbGljZSA9IHNjb3BlLkFycmF5U3BsaWNlO1xuICAgIGZ1bmN0aW9uIHVwZGF0ZVdyYXBwZXJVcEFuZFNpZGV3YXlzKHdyYXBwZXIpIHtcbiAgICAgIHdyYXBwZXIucHJldmlvdXNTaWJsaW5nXyA9IHdyYXBwZXIucHJldmlvdXNTaWJsaW5nO1xuICAgICAgd3JhcHBlci5uZXh0U2libGluZ18gPSB3cmFwcGVyLm5leHRTaWJsaW5nO1xuICAgICAgd3JhcHBlci5wYXJlbnROb2RlXyA9IHdyYXBwZXIucGFyZW50Tm9kZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlV3JhcHBlckRvd24od3JhcHBlcikge1xuICAgICAgd3JhcHBlci5maXJzdENoaWxkXyA9IHdyYXBwZXIuZmlyc3RDaGlsZDtcbiAgICAgIHdyYXBwZXIubGFzdENoaWxkXyA9IHdyYXBwZXIubGFzdENoaWxkO1xuICAgIH1cbiAgICBmdW5jdGlvbiB1cGRhdGVBbGxDaGlsZE5vZGVzKHBhcmVudE5vZGVXcmFwcGVyKSB7XG4gICAgICBhc3NlcnQocGFyZW50Tm9kZVdyYXBwZXIgaW5zdGFuY2VvZiBOb2RlKTtcbiAgICAgIGZvciAodmFyIGNoaWxkV3JhcHBlciA9IHBhcmVudE5vZGVXcmFwcGVyLmZpcnN0Q2hpbGQ7IGNoaWxkV3JhcHBlcjsgY2hpbGRXcmFwcGVyID0gY2hpbGRXcmFwcGVyLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIHVwZGF0ZVdyYXBwZXJVcEFuZFNpZGV3YXlzKGNoaWxkV3JhcHBlcik7XG4gICAgICB9XG4gICAgICB1cGRhdGVXcmFwcGVyRG93bihwYXJlbnROb2RlV3JhcHBlcik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGluc2VydEJlZm9yZShwYXJlbnROb2RlV3JhcHBlciwgbmV3Q2hpbGRXcmFwcGVyLCByZWZDaGlsZFdyYXBwZXIpIHtcbiAgICAgIHZhciBwYXJlbnROb2RlID0gdW53cmFwKHBhcmVudE5vZGVXcmFwcGVyKTtcbiAgICAgIHZhciBuZXdDaGlsZCA9IHVud3JhcChuZXdDaGlsZFdyYXBwZXIpO1xuICAgICAgdmFyIHJlZkNoaWxkID0gcmVmQ2hpbGRXcmFwcGVyID8gdW53cmFwKHJlZkNoaWxkV3JhcHBlcikgOiBudWxsO1xuICAgICAgcmVtb3ZlKG5ld0NoaWxkV3JhcHBlcik7XG4gICAgICB1cGRhdGVXcmFwcGVyVXBBbmRTaWRld2F5cyhuZXdDaGlsZFdyYXBwZXIpO1xuICAgICAgaWYgKCFyZWZDaGlsZFdyYXBwZXIpIHtcbiAgICAgICAgcGFyZW50Tm9kZVdyYXBwZXIubGFzdENoaWxkXyA9IHBhcmVudE5vZGVXcmFwcGVyLmxhc3RDaGlsZDtcbiAgICAgICAgaWYgKHBhcmVudE5vZGVXcmFwcGVyLmxhc3RDaGlsZCA9PT0gcGFyZW50Tm9kZVdyYXBwZXIuZmlyc3RDaGlsZCkgcGFyZW50Tm9kZVdyYXBwZXIuZmlyc3RDaGlsZF8gPSBwYXJlbnROb2RlV3JhcHBlci5maXJzdENoaWxkO1xuICAgICAgICB2YXIgbGFzdENoaWxkV3JhcHBlciA9IHdyYXAocGFyZW50Tm9kZS5sYXN0Q2hpbGQpO1xuICAgICAgICBpZiAobGFzdENoaWxkV3JhcHBlcikgbGFzdENoaWxkV3JhcHBlci5uZXh0U2libGluZ18gPSBsYXN0Q2hpbGRXcmFwcGVyLm5leHRTaWJsaW5nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBhcmVudE5vZGVXcmFwcGVyLmZpcnN0Q2hpbGQgPT09IHJlZkNoaWxkV3JhcHBlcikgcGFyZW50Tm9kZVdyYXBwZXIuZmlyc3RDaGlsZF8gPSByZWZDaGlsZFdyYXBwZXI7XG4gICAgICAgIHJlZkNoaWxkV3JhcHBlci5wcmV2aW91c1NpYmxpbmdfID0gcmVmQ2hpbGRXcmFwcGVyLnByZXZpb3VzU2libGluZztcbiAgICAgIH1cbiAgICAgIHNjb3BlLm9yaWdpbmFsSW5zZXJ0QmVmb3JlLmNhbGwocGFyZW50Tm9kZSwgbmV3Q2hpbGQsIHJlZkNoaWxkKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlKG5vZGVXcmFwcGVyKSB7XG4gICAgICB2YXIgbm9kZSA9IHVud3JhcChub2RlV3JhcHBlcik7XG4gICAgICB2YXIgcGFyZW50Tm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgIGlmICghcGFyZW50Tm9kZSkgcmV0dXJuO1xuICAgICAgdmFyIHBhcmVudE5vZGVXcmFwcGVyID0gd3JhcChwYXJlbnROb2RlKTtcbiAgICAgIHVwZGF0ZVdyYXBwZXJVcEFuZFNpZGV3YXlzKG5vZGVXcmFwcGVyKTtcbiAgICAgIGlmIChub2RlV3JhcHBlci5wcmV2aW91c1NpYmxpbmcpIG5vZGVXcmFwcGVyLnByZXZpb3VzU2libGluZy5uZXh0U2libGluZ18gPSBub2RlV3JhcHBlcjtcbiAgICAgIGlmIChub2RlV3JhcHBlci5uZXh0U2libGluZykgbm9kZVdyYXBwZXIubmV4dFNpYmxpbmcucHJldmlvdXNTaWJsaW5nXyA9IG5vZGVXcmFwcGVyO1xuICAgICAgaWYgKHBhcmVudE5vZGVXcmFwcGVyLmxhc3RDaGlsZCA9PT0gbm9kZVdyYXBwZXIpIHBhcmVudE5vZGVXcmFwcGVyLmxhc3RDaGlsZF8gPSBub2RlV3JhcHBlcjtcbiAgICAgIGlmIChwYXJlbnROb2RlV3JhcHBlci5maXJzdENoaWxkID09PSBub2RlV3JhcHBlcikgcGFyZW50Tm9kZVdyYXBwZXIuZmlyc3RDaGlsZF8gPSBub2RlV3JhcHBlcjtcbiAgICAgIHNjb3BlLm9yaWdpbmFsUmVtb3ZlQ2hpbGQuY2FsbChwYXJlbnROb2RlLCBub2RlKTtcbiAgICB9XG4gICAgdmFyIGRpc3RyaWJ1dGVkTm9kZXNUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIGRlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciByZW5kZXJlckZvckhvc3RUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgZnVuY3Rpb24gcmVzZXREaXN0cmlidXRlZE5vZGVzKGluc2VydGlvblBvaW50KSB7XG4gICAgICBkaXN0cmlidXRlZE5vZGVzVGFibGUuc2V0KGluc2VydGlvblBvaW50LCBbXSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldERpc3RyaWJ1dGVkTm9kZXMoaW5zZXJ0aW9uUG9pbnQpIHtcbiAgICAgIHZhciBydiA9IGRpc3RyaWJ1dGVkTm9kZXNUYWJsZS5nZXQoaW5zZXJ0aW9uUG9pbnQpO1xuICAgICAgaWYgKCFydikgZGlzdHJpYnV0ZWROb2Rlc1RhYmxlLnNldChpbnNlcnRpb25Qb2ludCwgcnYgPSBbXSk7XG4gICAgICByZXR1cm4gcnY7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldENoaWxkTm9kZXNTbmFwc2hvdChub2RlKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gW10sIGkgPSAwO1xuICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIHJlc3VsdFtpKytdID0gY2hpbGQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICB2YXIgcmVxdWVzdCA9IG9uZU9mKHdpbmRvdywgWyBcInJlcXVlc3RBbmltYXRpb25GcmFtZVwiLCBcIm1velJlcXVlc3RBbmltYXRpb25GcmFtZVwiLCBcIndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZVwiLCBcInNldFRpbWVvdXRcIiBdKTtcbiAgICB2YXIgcGVuZGluZ0RpcnR5UmVuZGVyZXJzID0gW107XG4gICAgdmFyIHJlbmRlclRpbWVyO1xuICAgIGZ1bmN0aW9uIHJlbmRlckFsbFBlbmRpbmcoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBlbmRpbmdEaXJ0eVJlbmRlcmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcmVuZGVyZXIgPSBwZW5kaW5nRGlydHlSZW5kZXJlcnNbaV07XG4gICAgICAgIHZhciBwYXJlbnRSZW5kZXJlciA9IHJlbmRlcmVyLnBhcmVudFJlbmRlcmVyO1xuICAgICAgICBpZiAocGFyZW50UmVuZGVyZXIgJiYgcGFyZW50UmVuZGVyZXIuZGlydHkpIGNvbnRpbnVlO1xuICAgICAgICByZW5kZXJlci5yZW5kZXIoKTtcbiAgICAgIH1cbiAgICAgIHBlbmRpbmdEaXJ0eVJlbmRlcmVycyA9IFtdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBoYW5kbGVSZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKSB7XG4gICAgICByZW5kZXJUaW1lciA9IG51bGw7XG4gICAgICByZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFJlbmRlcmVyRm9ySG9zdChob3N0KSB7XG4gICAgICB2YXIgcmVuZGVyZXIgPSByZW5kZXJlckZvckhvc3RUYWJsZS5nZXQoaG9zdCk7XG4gICAgICBpZiAoIXJlbmRlcmVyKSB7XG4gICAgICAgIHJlbmRlcmVyID0gbmV3IFNoYWRvd1JlbmRlcmVyKGhvc3QpO1xuICAgICAgICByZW5kZXJlckZvckhvc3RUYWJsZS5zZXQoaG9zdCwgcmVuZGVyZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlbmRlcmVyO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRTaGFkb3dSb290QW5jZXN0b3Iobm9kZSkge1xuICAgICAgdmFyIHJvb3QgPSBnZXRUcmVlU2NvcGUobm9kZSkucm9vdDtcbiAgICAgIGlmIChyb290IGluc3RhbmNlb2YgU2hhZG93Um9vdCkgcmV0dXJuIHJvb3Q7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0UmVuZGVyZXJGb3JTaGFkb3dSb290KHNoYWRvd1Jvb3QpIHtcbiAgICAgIHJldHVybiBnZXRSZW5kZXJlckZvckhvc3Qoc2hhZG93Um9vdC5ob3N0KTtcbiAgICB9XG4gICAgdmFyIHNwbGljZURpZmYgPSBuZXcgQXJyYXlTcGxpY2UoKTtcbiAgICBzcGxpY2VEaWZmLmVxdWFscyA9IGZ1bmN0aW9uKHJlbmRlck5vZGUsIHJhd05vZGUpIHtcbiAgICAgIHJldHVybiB1bndyYXAocmVuZGVyTm9kZS5ub2RlKSA9PT0gcmF3Tm9kZTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIFJlbmRlck5vZGUobm9kZSkge1xuICAgICAgdGhpcy5za2lwID0gZmFsc2U7XG4gICAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgICAgdGhpcy5jaGlsZE5vZGVzID0gW107XG4gICAgfVxuICAgIFJlbmRlck5vZGUucHJvdG90eXBlID0ge1xuICAgICAgYXBwZW5kOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBydiA9IG5ldyBSZW5kZXJOb2RlKG5vZGUpO1xuICAgICAgICB0aGlzLmNoaWxkTm9kZXMucHVzaChydik7XG4gICAgICAgIHJldHVybiBydjtcbiAgICAgIH0sXG4gICAgICBzeW5jOiBmdW5jdGlvbihvcHRfYWRkZWQpIHtcbiAgICAgICAgaWYgKHRoaXMuc2tpcCkgcmV0dXJuO1xuICAgICAgICB2YXIgbm9kZVdyYXBwZXIgPSB0aGlzLm5vZGU7XG4gICAgICAgIHZhciBuZXdDaGlsZHJlbiA9IHRoaXMuY2hpbGROb2RlcztcbiAgICAgICAgdmFyIG9sZENoaWxkcmVuID0gZ2V0Q2hpbGROb2Rlc1NuYXBzaG90KHVud3JhcChub2RlV3JhcHBlcikpO1xuICAgICAgICB2YXIgYWRkZWQgPSBvcHRfYWRkZWQgfHwgbmV3IFdlYWtNYXAoKTtcbiAgICAgICAgdmFyIHNwbGljZXMgPSBzcGxpY2VEaWZmLmNhbGN1bGF0ZVNwbGljZXMobmV3Q2hpbGRyZW4sIG9sZENoaWxkcmVuKTtcbiAgICAgICAgdmFyIG5ld0luZGV4ID0gMCwgb2xkSW5kZXggPSAwO1xuICAgICAgICB2YXIgbGFzdEluZGV4ID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGxpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHNwbGljZSA9IHNwbGljZXNbaV07XG4gICAgICAgICAgZm9yICg7bGFzdEluZGV4IDwgc3BsaWNlLmluZGV4OyBsYXN0SW5kZXgrKykge1xuICAgICAgICAgICAgb2xkSW5kZXgrKztcbiAgICAgICAgICAgIG5ld0NoaWxkcmVuW25ld0luZGV4KytdLnN5bmMoYWRkZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmVtb3ZlZENvdW50ID0gc3BsaWNlLnJlbW92ZWQubGVuZ3RoO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVtb3ZlZENvdW50OyBqKyspIHtcbiAgICAgICAgICAgIHZhciB3cmFwcGVyID0gd3JhcChvbGRDaGlsZHJlbltvbGRJbmRleCsrXSk7XG4gICAgICAgICAgICBpZiAoIWFkZGVkLmdldCh3cmFwcGVyKSkgcmVtb3ZlKHdyYXBwZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgYWRkZWRDb3VudCA9IHNwbGljZS5hZGRlZENvdW50O1xuICAgICAgICAgIHZhciByZWZOb2RlID0gb2xkQ2hpbGRyZW5bb2xkSW5kZXhdICYmIHdyYXAob2xkQ2hpbGRyZW5bb2xkSW5kZXhdKTtcbiAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFkZGVkQ291bnQ7IGorKykge1xuICAgICAgICAgICAgdmFyIG5ld0NoaWxkUmVuZGVyTm9kZSA9IG5ld0NoaWxkcmVuW25ld0luZGV4KytdO1xuICAgICAgICAgICAgdmFyIG5ld0NoaWxkV3JhcHBlciA9IG5ld0NoaWxkUmVuZGVyTm9kZS5ub2RlO1xuICAgICAgICAgICAgaW5zZXJ0QmVmb3JlKG5vZGVXcmFwcGVyLCBuZXdDaGlsZFdyYXBwZXIsIHJlZk5vZGUpO1xuICAgICAgICAgICAgYWRkZWQuc2V0KG5ld0NoaWxkV3JhcHBlciwgdHJ1ZSk7XG4gICAgICAgICAgICBuZXdDaGlsZFJlbmRlck5vZGUuc3luYyhhZGRlZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxhc3RJbmRleCArPSBhZGRlZENvdW50O1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSBsYXN0SW5kZXg7IGkgPCBuZXdDaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIG5ld0NoaWxkcmVuW2ldLnN5bmMoYWRkZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBTaGFkb3dSZW5kZXJlcihob3N0KSB7XG4gICAgICB0aGlzLmhvc3QgPSBob3N0O1xuICAgICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgICAgdGhpcy5pbnZhbGlkYXRlQXR0cmlidXRlcygpO1xuICAgICAgdGhpcy5hc3NvY2lhdGVOb2RlKGhvc3QpO1xuICAgIH1cbiAgICBTaGFkb3dSZW5kZXJlci5wcm90b3R5cGUgPSB7XG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKG9wdF9yZW5kZXJOb2RlKSB7XG4gICAgICAgIGlmICghdGhpcy5kaXJ0eSkgcmV0dXJuO1xuICAgICAgICB0aGlzLmludmFsaWRhdGVBdHRyaWJ1dGVzKCk7XG4gICAgICAgIHZhciBob3N0ID0gdGhpcy5ob3N0O1xuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbihob3N0KTtcbiAgICAgICAgdmFyIHJlbmRlck5vZGUgPSBvcHRfcmVuZGVyTm9kZSB8fCBuZXcgUmVuZGVyTm9kZShob3N0KTtcbiAgICAgICAgdGhpcy5idWlsZFJlbmRlclRyZWUocmVuZGVyTm9kZSwgaG9zdCk7XG4gICAgICAgIHZhciB0b3BNb3N0UmVuZGVyZXIgPSAhb3B0X3JlbmRlck5vZGU7XG4gICAgICAgIGlmICh0b3BNb3N0UmVuZGVyZXIpIHJlbmRlck5vZGUuc3luYygpO1xuICAgICAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICAgICB9LFxuICAgICAgZ2V0IHBhcmVudFJlbmRlcmVyKCkge1xuICAgICAgICByZXR1cm4gZ2V0VHJlZVNjb3BlKHRoaXMuaG9zdCkucmVuZGVyZXI7XG4gICAgICB9LFxuICAgICAgaW52YWxpZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5kaXJ0eSkge1xuICAgICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICAgICAgICAgIHZhciBwYXJlbnRSZW5kZXJlciA9IHRoaXMucGFyZW50UmVuZGVyZXI7XG4gICAgICAgICAgaWYgKHBhcmVudFJlbmRlcmVyKSBwYXJlbnRSZW5kZXJlci5pbnZhbGlkYXRlKCk7XG4gICAgICAgICAgcGVuZGluZ0RpcnR5UmVuZGVyZXJzLnB1c2godGhpcyk7XG4gICAgICAgICAgaWYgKHJlbmRlclRpbWVyKSByZXR1cm47XG4gICAgICAgICAgcmVuZGVyVGltZXIgPSB3aW5kb3dbcmVxdWVzdF0oaGFuZGxlUmVxdWVzdEFuaW1hdGlvbkZyYW1lLCAwKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGRpc3RyaWJ1dGlvbjogZnVuY3Rpb24ocm9vdCkge1xuICAgICAgICB0aGlzLnJlc2V0QWxsU3VidHJlZXMocm9vdCk7XG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uUmVzb2x1dGlvbihyb290KTtcbiAgICAgIH0sXG4gICAgICByZXNldEFsbDogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBpZiAoaXNJbnNlcnRpb25Qb2ludChub2RlKSkgcmVzZXREaXN0cmlidXRlZE5vZGVzKG5vZGUpOyBlbHNlIHJlc2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMobm9kZSk7XG4gICAgICAgIHRoaXMucmVzZXRBbGxTdWJ0cmVlcyhub2RlKTtcbiAgICAgIH0sXG4gICAgICByZXNldEFsbFN1YnRyZWVzOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgIHRoaXMucmVzZXRBbGwoY2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLnNoYWRvd1Jvb3QpIHRoaXMucmVzZXRBbGwobm9kZS5zaGFkb3dSb290KTtcbiAgICAgICAgaWYgKG5vZGUub2xkZXJTaGFkb3dSb290KSB0aGlzLnJlc2V0QWxsKG5vZGUub2xkZXJTaGFkb3dSb290KTtcbiAgICAgIH0sXG4gICAgICBkaXN0cmlidXRpb25SZXNvbHV0aW9uOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIGlmIChpc1NoYWRvd0hvc3Qobm9kZSkpIHtcbiAgICAgICAgICB2YXIgc2hhZG93SG9zdCA9IG5vZGU7XG4gICAgICAgICAgdmFyIHBvb2wgPSBwb29sUG9wdWxhdGlvbihzaGFkb3dIb3N0KTtcbiAgICAgICAgICB2YXIgc2hhZG93VHJlZXMgPSBnZXRTaGFkb3dUcmVlcyhzaGFkb3dIb3N0KTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNoYWRvd1RyZWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnBvb2xEaXN0cmlidXRpb24oc2hhZG93VHJlZXNbaV0sIHBvb2wpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKHZhciBpID0gc2hhZG93VHJlZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHZhciBzaGFkb3dUcmVlID0gc2hhZG93VHJlZXNbaV07XG4gICAgICAgICAgICB2YXIgc2hhZG93ID0gZ2V0U2hhZG93SW5zZXJ0aW9uUG9pbnQoc2hhZG93VHJlZSk7XG4gICAgICAgICAgICBpZiAoc2hhZG93KSB7XG4gICAgICAgICAgICAgIHZhciBvbGRlclNoYWRvd1Jvb3QgPSBzaGFkb3dUcmVlLm9sZGVyU2hhZG93Um9vdDtcbiAgICAgICAgICAgICAgaWYgKG9sZGVyU2hhZG93Um9vdCkge1xuICAgICAgICAgICAgICAgIHBvb2wgPSBwb29sUG9wdWxhdGlvbihvbGRlclNoYWRvd1Jvb3QpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcG9vbC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGRlc3RyaWJ1dGVOb2RlSW50byhwb29sW2pdLCBzaGFkb3cpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvblJlc29sdXRpb24oc2hhZG93VHJlZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uUmVzb2x1dGlvbihjaGlsZCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBwb29sRGlzdHJpYnV0aW9uOiBmdW5jdGlvbihub2RlLCBwb29sKSB7XG4gICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgSFRNTFNoYWRvd0VsZW1lbnQpIHJldHVybjtcbiAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBIVE1MQ29udGVudEVsZW1lbnQpIHtcbiAgICAgICAgICB2YXIgY29udGVudCA9IG5vZGU7XG4gICAgICAgICAgdGhpcy51cGRhdGVEZXBlbmRlbnRBdHRyaWJ1dGVzKGNvbnRlbnQuZ2V0QXR0cmlidXRlKFwic2VsZWN0XCIpKTtcbiAgICAgICAgICB2YXIgYW55RGlzdHJpYnV0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvb2wubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gcG9vbFtpXTtcbiAgICAgICAgICAgIGlmICghbm9kZSkgY29udGludWU7XG4gICAgICAgICAgICBpZiAobWF0Y2hlcyhub2RlLCBjb250ZW50KSkge1xuICAgICAgICAgICAgICBkZXN0cmlidXRlTm9kZUludG8obm9kZSwgY29udGVudCk7XG4gICAgICAgICAgICAgIHBvb2xbaV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgIGFueURpc3RyaWJ1dGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFhbnlEaXN0cmlidXRlZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgY2hpbGQgPSBjb250ZW50LmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICAgIGRlc3RyaWJ1dGVOb2RlSW50byhjaGlsZCwgY29udGVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICB0aGlzLnBvb2xEaXN0cmlidXRpb24oY2hpbGQsIHBvb2wpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgYnVpbGRSZW5kZXJUcmVlOiBmdW5jdGlvbihyZW5kZXJOb2RlLCBub2RlKSB7XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuY29tcG9zZShub2RlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgIHZhciBjaGlsZFJlbmRlck5vZGUgPSByZW5kZXJOb2RlLmFwcGVuZChjaGlsZCk7XG4gICAgICAgICAgdGhpcy5idWlsZFJlbmRlclRyZWUoY2hpbGRSZW5kZXJOb2RlLCBjaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU2hhZG93SG9zdChub2RlKSkge1xuICAgICAgICAgIHZhciByZW5kZXJlciA9IGdldFJlbmRlcmVyRm9ySG9zdChub2RlKTtcbiAgICAgICAgICByZW5kZXJlci5kaXJ0eSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgY29tcG9zZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgdmFyIHAgPSBub2RlLnNoYWRvd1Jvb3QgfHwgbm9kZTtcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgPSBwLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgaWYgKGlzSW5zZXJ0aW9uUG9pbnQoY2hpbGQpKSB7XG4gICAgICAgICAgICB0aGlzLmFzc29jaWF0ZU5vZGUocCk7XG4gICAgICAgICAgICB2YXIgZGlzdHJpYnV0ZWROb2RlcyA9IGdldERpc3RyaWJ1dGVkTm9kZXMoY2hpbGQpO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkaXN0cmlidXRlZE5vZGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgIHZhciBkaXN0cmlidXRlZE5vZGUgPSBkaXN0cmlidXRlZE5vZGVzW2pdO1xuICAgICAgICAgICAgICBpZiAoaXNGaW5hbERlc3RpbmF0aW9uKGNoaWxkLCBkaXN0cmlidXRlZE5vZGUpKSBjaGlsZHJlbi5wdXNoKGRpc3RyaWJ1dGVkTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hpbGRyZW47XG4gICAgICB9LFxuICAgICAgaW52YWxpZGF0ZUF0dHJpYnV0ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZURlcGVuZGVudEF0dHJpYnV0ZXM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHJldHVybjtcbiAgICAgICAgdmFyIGF0dHJpYnV0ZXMgPSB0aGlzLmF0dHJpYnV0ZXM7XG4gICAgICAgIGlmICgvXFwuXFx3Ky8udGVzdChzZWxlY3RvcikpIGF0dHJpYnV0ZXNbXCJjbGFzc1wiXSA9IHRydWU7XG4gICAgICAgIGlmICgvI1xcdysvLnRlc3Qoc2VsZWN0b3IpKSBhdHRyaWJ1dGVzW1wiaWRcIl0gPSB0cnVlO1xuICAgICAgICBzZWxlY3Rvci5yZXBsYWNlKC9cXFtcXHMqKFteXFxzPVxcfH5cXF1dKykvZywgZnVuY3Rpb24oXywgbmFtZSkge1xuICAgICAgICAgIGF0dHJpYnV0ZXNbbmFtZV0gPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBkZXBlbmRzT25BdHRyaWJ1dGU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlc1tuYW1lXTtcbiAgICAgIH0sXG4gICAgICBhc3NvY2lhdGVOb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcChub2RlKS5wb2x5bWVyU2hhZG93UmVuZGVyZXJfID0gdGhpcztcbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIHBvb2xQb3B1bGF0aW9uKG5vZGUpIHtcbiAgICAgIHZhciBwb29sID0gW107XG4gICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgaWYgKGlzSW5zZXJ0aW9uUG9pbnQoY2hpbGQpKSB7XG4gICAgICAgICAgcG9vbC5wdXNoLmFwcGx5KHBvb2wsIGdldERpc3RyaWJ1dGVkTm9kZXMoY2hpbGQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwb29sLnB1c2goY2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcG9vbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0U2hhZG93SW5zZXJ0aW9uUG9pbnQobm9kZSkge1xuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBIVE1MU2hhZG93RWxlbWVudCkgcmV0dXJuIG5vZGU7XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEhUTUxDb250ZW50RWxlbWVudCkgcmV0dXJuIG51bGw7XG4gICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgdmFyIHJlcyA9IGdldFNoYWRvd0luc2VydGlvblBvaW50KGNoaWxkKTtcbiAgICAgICAgaWYgKHJlcykgcmV0dXJuIHJlcztcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkZXN0cmlidXRlTm9kZUludG8oY2hpbGQsIGluc2VydGlvblBvaW50KSB7XG4gICAgICBnZXREaXN0cmlidXRlZE5vZGVzKGluc2VydGlvblBvaW50KS5wdXNoKGNoaWxkKTtcbiAgICAgIHZhciBwb2ludHMgPSBkZXN0aW5hdGlvbkluc2VydGlvblBvaW50c1RhYmxlLmdldChjaGlsZCk7XG4gICAgICBpZiAoIXBvaW50cykgZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHNUYWJsZS5zZXQoY2hpbGQsIFsgaW5zZXJ0aW9uUG9pbnQgXSk7IGVsc2UgcG9pbnRzLnB1c2goaW5zZXJ0aW9uUG9pbnQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyhub2RlKSB7XG4gICAgICByZXR1cm4gZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHNUYWJsZS5nZXQobm9kZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlc2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMobm9kZSkge1xuICAgICAgZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHNUYWJsZS5zZXQobm9kZSwgdW5kZWZpbmVkKTtcbiAgICB9XG4gICAgdmFyIHNlbGVjdG9yU3RhcnRDaGFyUmUgPSAvXig6bm90XFwoKT9bKi4jW2EtekEtWl98XS87XG4gICAgZnVuY3Rpb24gbWF0Y2hlcyhub2RlLCBjb250ZW50RWxlbWVudCkge1xuICAgICAgdmFyIHNlbGVjdCA9IGNvbnRlbnRFbGVtZW50LmdldEF0dHJpYnV0ZShcInNlbGVjdFwiKTtcbiAgICAgIGlmICghc2VsZWN0KSByZXR1cm4gdHJ1ZTtcbiAgICAgIHNlbGVjdCA9IHNlbGVjdC50cmltKCk7XG4gICAgICBpZiAoIXNlbGVjdCkgcmV0dXJuIHRydWU7XG4gICAgICBpZiAoIShub2RlIGluc3RhbmNlb2YgRWxlbWVudCkpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICghc2VsZWN0b3JTdGFydENoYXJSZS50ZXN0KHNlbGVjdCkpIHJldHVybiBmYWxzZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBub2RlLm1hdGNoZXMoc2VsZWN0KTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gaXNGaW5hbERlc3RpbmF0aW9uKGluc2VydGlvblBvaW50LCBub2RlKSB7XG4gICAgICB2YXIgcG9pbnRzID0gZ2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMobm9kZSk7XG4gICAgICByZXR1cm4gcG9pbnRzICYmIHBvaW50c1twb2ludHMubGVuZ3RoIC0gMV0gPT09IGluc2VydGlvblBvaW50O1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc0luc2VydGlvblBvaW50KG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlIGluc3RhbmNlb2YgSFRNTENvbnRlbnRFbGVtZW50IHx8IG5vZGUgaW5zdGFuY2VvZiBIVE1MU2hhZG93RWxlbWVudDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNTaGFkb3dIb3N0KHNoYWRvd0hvc3QpIHtcbiAgICAgIHJldHVybiBzaGFkb3dIb3N0LnNoYWRvd1Jvb3Q7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFNoYWRvd1RyZWVzKGhvc3QpIHtcbiAgICAgIHZhciB0cmVlcyA9IFtdO1xuICAgICAgZm9yICh2YXIgdHJlZSA9IGhvc3Quc2hhZG93Um9vdDsgdHJlZTsgdHJlZSA9IHRyZWUub2xkZXJTaGFkb3dSb290KSB7XG4gICAgICAgIHRyZWVzLnB1c2godHJlZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJlZXM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbmRlcihob3N0KSB7XG4gICAgICBuZXcgU2hhZG93UmVuZGVyZXIoaG9zdCkucmVuZGVyKCk7XG4gICAgfVxuICAgIE5vZGUucHJvdG90eXBlLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlciA9IGZ1bmN0aW9uKGZvcmNlKSB7XG4gICAgICB2YXIgcmVuZGVyZXIgPSB1bnNhZmVVbndyYXAodGhpcykucG9seW1lclNoYWRvd1JlbmRlcmVyXztcbiAgICAgIGlmIChyZW5kZXJlcikge1xuICAgICAgICByZW5kZXJlci5pbnZhbGlkYXRlKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgSFRNTENvbnRlbnRFbGVtZW50LnByb3RvdHlwZS5nZXREaXN0cmlidXRlZE5vZGVzID0gSFRNTFNoYWRvd0VsZW1lbnQucHJvdG90eXBlLmdldERpc3RyaWJ1dGVkTm9kZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgIHJldHVybiBnZXREaXN0cmlidXRlZE5vZGVzKHRoaXMpO1xuICAgIH07XG4gICAgRWxlbWVudC5wcm90b3R5cGUuZ2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgIHJldHVybiBnZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyh0aGlzKSB8fCBbXTtcbiAgICB9O1xuICAgIEhUTUxDb250ZW50RWxlbWVudC5wcm90b3R5cGUubm9kZUlzSW5zZXJ0ZWRfID0gSFRNTFNoYWRvd0VsZW1lbnQucHJvdG90eXBlLm5vZGVJc0luc2VydGVkXyA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIoKTtcbiAgICAgIHZhciBzaGFkb3dSb290ID0gZ2V0U2hhZG93Um9vdEFuY2VzdG9yKHRoaXMpO1xuICAgICAgdmFyIHJlbmRlcmVyO1xuICAgICAgaWYgKHNoYWRvd1Jvb3QpIHJlbmRlcmVyID0gZ2V0UmVuZGVyZXJGb3JTaGFkb3dSb290KHNoYWRvd1Jvb3QpO1xuICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnBvbHltZXJTaGFkb3dSZW5kZXJlcl8gPSByZW5kZXJlcjtcbiAgICAgIGlmIChyZW5kZXJlcikgcmVuZGVyZXIuaW52YWxpZGF0ZSgpO1xuICAgIH07XG4gICAgc2NvcGUuZ2V0UmVuZGVyZXJGb3JIb3N0ID0gZ2V0UmVuZGVyZXJGb3JIb3N0O1xuICAgIHNjb3BlLmdldFNoYWRvd1RyZWVzID0gZ2V0U2hhZG93VHJlZXM7XG4gICAgc2NvcGUucmVuZGVyQWxsUGVuZGluZyA9IHJlbmRlckFsbFBlbmRpbmc7XG4gICAgc2NvcGUuZ2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMgPSBnZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cztcbiAgICBzY29wZS52aXN1YWwgPSB7XG4gICAgICBpbnNlcnRCZWZvcmU6IGluc2VydEJlZm9yZSxcbiAgICAgIHJlbW92ZTogcmVtb3ZlXG4gICAgfTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIGFzc2VydCA9IHNjb3BlLmFzc2VydDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBlbGVtZW50c1dpdGhGb3JtUHJvcGVydHkgPSBbIFwiSFRNTEJ1dHRvbkVsZW1lbnRcIiwgXCJIVE1MRmllbGRTZXRFbGVtZW50XCIsIFwiSFRNTElucHV0RWxlbWVudFwiLCBcIkhUTUxLZXlnZW5FbGVtZW50XCIsIFwiSFRNTExhYmVsRWxlbWVudFwiLCBcIkhUTUxMZWdlbmRFbGVtZW50XCIsIFwiSFRNTE9iamVjdEVsZW1lbnRcIiwgXCJIVE1MT3V0cHV0RWxlbWVudFwiLCBcIkhUTUxUZXh0QXJlYUVsZW1lbnRcIiBdO1xuICAgIGZ1bmN0aW9uIGNyZWF0ZVdyYXBwZXJDb25zdHJ1Y3RvcihuYW1lKSB7XG4gICAgICBpZiAoIXdpbmRvd1tuYW1lXSkgcmV0dXJuO1xuICAgICAgYXNzZXJ0KCFzY29wZS53cmFwcGVyc1tuYW1lXSk7XG4gICAgICB2YXIgR2VuZXJhdGVkV3JhcHBlciA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICAgIH07XG4gICAgICBHZW5lcmF0ZWRXcmFwcGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICAgIG1peGluKEdlbmVyYXRlZFdyYXBwZXIucHJvdG90eXBlLCB7XG4gICAgICAgIGdldCBmb3JtKCkge1xuICAgICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5mb3JtKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZWdpc3RlcldyYXBwZXIod2luZG93W25hbWVdLCBHZW5lcmF0ZWRXcmFwcGVyLCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUuc2xpY2UoNCwgLTcpKSk7XG4gICAgICBzY29wZS53cmFwcGVyc1tuYW1lXSA9IEdlbmVyYXRlZFdyYXBwZXI7XG4gICAgfVxuICAgIGVsZW1lbnRzV2l0aEZvcm1Qcm9wZXJ0eS5mb3JFYWNoKGNyZWF0ZVdyYXBwZXJDb25zdHJ1Y3Rvcik7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHNldFdyYXBwZXIgPSBzY29wZS5zZXRXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgdW53cmFwSWZOZWVkZWQgPSBzY29wZS51bndyYXBJZk5lZWRlZDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsU2VsZWN0aW9uID0gd2luZG93LlNlbGVjdGlvbjtcbiAgICBmdW5jdGlvbiBTZWxlY3Rpb24oaW1wbCkge1xuICAgICAgc2V0V3JhcHBlcihpbXBsLCB0aGlzKTtcbiAgICB9XG4gICAgU2VsZWN0aW9uLnByb3RvdHlwZSA9IHtcbiAgICAgIGdldCBhbmNob3JOb2RlKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuYW5jaG9yTm9kZSk7XG4gICAgICB9LFxuICAgICAgZ2V0IGZvY3VzTm9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmZvY3VzTm9kZSk7XG4gICAgICB9LFxuICAgICAgYWRkUmFuZ2U6IGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5hZGRSYW5nZSh1bndyYXBJZk5lZWRlZChyYW5nZSkpO1xuICAgICAgfSxcbiAgICAgIGNvbGxhcHNlOiBmdW5jdGlvbihub2RlLCBpbmRleCkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuY29sbGFwc2UodW53cmFwSWZOZWVkZWQobm9kZSksIGluZGV4KTtcbiAgICAgIH0sXG4gICAgICBjb250YWluc05vZGU6IGZ1bmN0aW9uKG5vZGUsIGFsbG93UGFydGlhbCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLmNvbnRhaW5zTm9kZSh1bndyYXBJZk5lZWRlZChub2RlKSwgYWxsb3dQYXJ0aWFsKTtcbiAgICAgIH0sXG4gICAgICBnZXRSYW5nZUF0OiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuZ2V0UmFuZ2VBdChpbmRleCkpO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZVJhbmdlOiBmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykucmVtb3ZlUmFuZ2UodW53cmFwKHJhbmdlKSk7XG4gICAgICB9LFxuICAgICAgc2VsZWN0QWxsQ2hpbGRyZW46IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnNlbGVjdEFsbENoaWxkcmVuKG5vZGUgaW5zdGFuY2VvZiBTaGFkb3dSb290ID8gdW5zYWZlVW53cmFwKG5vZGUuaG9zdCkgOiB1bndyYXBJZk5lZWRlZChub2RlKSk7XG4gICAgICB9LFxuICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLnRvU3RyaW5nKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBpZiAoT3JpZ2luYWxTZWxlY3Rpb24ucHJvdG90eXBlLmV4dGVuZCkge1xuICAgICAgU2VsZWN0aW9uLnByb3RvdHlwZS5leHRlbmQgPSBmdW5jdGlvbihub2RlLCBvZmZzZXQpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLmV4dGVuZCh1bndyYXBJZk5lZWRlZChub2RlKSwgb2Zmc2V0KTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJlZ2lzdGVyV3JhcHBlcih3aW5kb3cuU2VsZWN0aW9uLCBTZWxlY3Rpb24sIHdpbmRvdy5nZXRTZWxlY3Rpb24oKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuU2VsZWN0aW9uID0gU2VsZWN0aW9uO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBzZXRXcmFwcGVyID0gc2NvcGUuc2V0V3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXBJZk5lZWRlZCA9IHNjb3BlLnVud3JhcElmTmVlZGVkO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxUcmVlV2Fsa2VyID0gd2luZG93LlRyZWVXYWxrZXI7XG4gICAgZnVuY3Rpb24gVHJlZVdhbGtlcihpbXBsKSB7XG4gICAgICBzZXRXcmFwcGVyKGltcGwsIHRoaXMpO1xuICAgIH1cbiAgICBUcmVlV2Fsa2VyLnByb3RvdHlwZSA9IHtcbiAgICAgIGdldCByb290KCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykucm9vdCk7XG4gICAgICB9LFxuICAgICAgZ2V0IGN1cnJlbnROb2RlKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuY3VycmVudE5vZGUpO1xuICAgICAgfSxcbiAgICAgIHNldCBjdXJyZW50Tm9kZShub2RlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5jdXJyZW50Tm9kZSA9IHVud3JhcElmTmVlZGVkKG5vZGUpO1xuICAgICAgfSxcbiAgICAgIGdldCBmaWx0ZXIoKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykuZmlsdGVyO1xuICAgICAgfSxcbiAgICAgIHBhcmVudE5vZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykucGFyZW50Tm9kZSgpKTtcbiAgICAgIH0sXG4gICAgICBmaXJzdENoaWxkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmZpcnN0Q2hpbGQoKSk7XG4gICAgICB9LFxuICAgICAgbGFzdENoaWxkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmxhc3RDaGlsZCgpKTtcbiAgICAgIH0sXG4gICAgICBwcmV2aW91c1NpYmxpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykucHJldmlvdXNTaWJsaW5nKCkpO1xuICAgICAgfSxcbiAgICAgIHByZXZpb3VzTm9kZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5wcmV2aW91c05vZGUoKSk7XG4gICAgICB9LFxuICAgICAgbmV4dE5vZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykubmV4dE5vZGUoKSk7XG4gICAgICB9XG4gICAgfTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxUcmVlV2Fsa2VyLCBUcmVlV2Fsa2VyKTtcbiAgICBzY29wZS53cmFwcGVycy5UcmVlV2Fsa2VyID0gVHJlZVdhbGtlcjtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEdldEVsZW1lbnRzQnlJbnRlcmZhY2UgPSBzY29wZS5HZXRFbGVtZW50c0J5SW50ZXJmYWNlO1xuICAgIHZhciBOb2RlID0gc2NvcGUud3JhcHBlcnMuTm9kZTtcbiAgICB2YXIgUGFyZW50Tm9kZUludGVyZmFjZSA9IHNjb3BlLlBhcmVudE5vZGVJbnRlcmZhY2U7XG4gICAgdmFyIE5vbkVsZW1lbnRQYXJlbnROb2RlSW50ZXJmYWNlID0gc2NvcGUuTm9uRWxlbWVudFBhcmVudE5vZGVJbnRlcmZhY2U7XG4gICAgdmFyIFNlbGVjdGlvbiA9IHNjb3BlLndyYXBwZXJzLlNlbGVjdGlvbjtcbiAgICB2YXIgU2VsZWN0b3JzSW50ZXJmYWNlID0gc2NvcGUuU2VsZWN0b3JzSW50ZXJmYWNlO1xuICAgIHZhciBTaGFkb3dSb290ID0gc2NvcGUud3JhcHBlcnMuU2hhZG93Um9vdDtcbiAgICB2YXIgVHJlZVNjb3BlID0gc2NvcGUuVHJlZVNjb3BlO1xuICAgIHZhciBjbG9uZU5vZGUgPSBzY29wZS5jbG9uZU5vZGU7XG4gICAgdmFyIGRlZmluZUdldHRlciA9IHNjb3BlLmRlZmluZUdldHRlcjtcbiAgICB2YXIgZGVmaW5lV3JhcEdldHRlciA9IHNjb3BlLmRlZmluZVdyYXBHZXR0ZXI7XG4gICAgdmFyIGVsZW1lbnRGcm9tUG9pbnQgPSBzY29wZS5lbGVtZW50RnJvbVBvaW50O1xuICAgIHZhciBmb3J3YXJkTWV0aG9kc1RvV3JhcHBlciA9IHNjb3BlLmZvcndhcmRNZXRob2RzVG9XcmFwcGVyO1xuICAgIHZhciBtYXRjaGVzTmFtZXMgPSBzY29wZS5tYXRjaGVzTmFtZXM7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgcmVuZGVyQWxsUGVuZGluZyA9IHNjb3BlLnJlbmRlckFsbFBlbmRpbmc7XG4gICAgdmFyIHJld3JhcCA9IHNjb3BlLnJld3JhcDtcbiAgICB2YXIgc2V0V3JhcHBlciA9IHNjb3BlLnNldFdyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgd3JhcEV2ZW50VGFyZ2V0TWV0aG9kcyA9IHNjb3BlLndyYXBFdmVudFRhcmdldE1ldGhvZHM7XG4gICAgdmFyIHdyYXBOb2RlTGlzdCA9IHNjb3BlLndyYXBOb2RlTGlzdDtcbiAgICB2YXIgaW1wbGVtZW50YXRpb25UYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgZnVuY3Rpb24gRG9jdW1lbnQobm9kZSkge1xuICAgICAgTm9kZS5jYWxsKHRoaXMsIG5vZGUpO1xuICAgICAgdGhpcy50cmVlU2NvcGVfID0gbmV3IFRyZWVTY29wZSh0aGlzLCBudWxsKTtcbiAgICB9XG4gICAgRG9jdW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShOb2RlLnByb3RvdHlwZSk7XG4gICAgZGVmaW5lV3JhcEdldHRlcihEb2N1bWVudCwgXCJkb2N1bWVudEVsZW1lbnRcIik7XG4gICAgZGVmaW5lV3JhcEdldHRlcihEb2N1bWVudCwgXCJib2R5XCIpO1xuICAgIGRlZmluZVdyYXBHZXR0ZXIoRG9jdW1lbnQsIFwiaGVhZFwiKTtcbiAgICBkZWZpbmVHZXR0ZXIoRG9jdW1lbnQsIFwiYWN0aXZlRWxlbWVudFwiLCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB1bndyYXBwZWRBY3RpdmVFbGVtZW50ID0gdW53cmFwKHRoaXMpLmFjdGl2ZUVsZW1lbnQ7XG4gICAgICBpZiAoIXVud3JhcHBlZEFjdGl2ZUVsZW1lbnQgfHwgIXVud3JhcHBlZEFjdGl2ZUVsZW1lbnQubm9kZVR5cGUpIHJldHVybiBudWxsO1xuICAgICAgdmFyIGFjdGl2ZUVsZW1lbnQgPSB3cmFwKHVud3JhcHBlZEFjdGl2ZUVsZW1lbnQpO1xuICAgICAgd2hpbGUgKCF0aGlzLmNvbnRhaW5zKGFjdGl2ZUVsZW1lbnQpKSB7XG4gICAgICAgIHdoaWxlIChhY3RpdmVFbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICBhY3RpdmVFbGVtZW50ID0gYWN0aXZlRWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY3RpdmVFbGVtZW50Lmhvc3QpIHtcbiAgICAgICAgICBhY3RpdmVFbGVtZW50ID0gYWN0aXZlRWxlbWVudC5ob3N0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gYWN0aXZlRWxlbWVudDtcbiAgICB9KTtcbiAgICBmdW5jdGlvbiB3cmFwTWV0aG9kKG5hbWUpIHtcbiAgICAgIHZhciBvcmlnaW5hbCA9IGRvY3VtZW50W25hbWVdO1xuICAgICAgRG9jdW1lbnQucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKG9yaWdpbmFsLmFwcGx5KHVuc2FmZVVud3JhcCh0aGlzKSwgYXJndW1lbnRzKSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBbIFwiY3JlYXRlQ29tbWVudFwiLCBcImNyZWF0ZURvY3VtZW50RnJhZ21lbnRcIiwgXCJjcmVhdGVFbGVtZW50XCIsIFwiY3JlYXRlRWxlbWVudE5TXCIsIFwiY3JlYXRlRXZlbnRcIiwgXCJjcmVhdGVFdmVudE5TXCIsIFwiY3JlYXRlUmFuZ2VcIiwgXCJjcmVhdGVUZXh0Tm9kZVwiIF0uZm9yRWFjaCh3cmFwTWV0aG9kKTtcbiAgICB2YXIgb3JpZ2luYWxBZG9wdE5vZGUgPSBkb2N1bWVudC5hZG9wdE5vZGU7XG4gICAgZnVuY3Rpb24gYWRvcHROb2RlTm9SZW1vdmUobm9kZSwgZG9jKSB7XG4gICAgICBvcmlnaW5hbEFkb3B0Tm9kZS5jYWxsKHVuc2FmZVVud3JhcChkb2MpLCB1bndyYXAobm9kZSkpO1xuICAgICAgYWRvcHRTdWJ0cmVlKG5vZGUsIGRvYyk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkb3B0U3VidHJlZShub2RlLCBkb2MpIHtcbiAgICAgIGlmIChub2RlLnNoYWRvd1Jvb3QpIGRvYy5hZG9wdE5vZGUobm9kZS5zaGFkb3dSb290KTtcbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgU2hhZG93Um9vdCkgYWRvcHRPbGRlclNoYWRvd1Jvb3RzKG5vZGUsIGRvYyk7XG4gICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgYWRvcHRTdWJ0cmVlKGNoaWxkLCBkb2MpO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBhZG9wdE9sZGVyU2hhZG93Um9vdHMoc2hhZG93Um9vdCwgZG9jKSB7XG4gICAgICB2YXIgb2xkU2hhZG93Um9vdCA9IHNoYWRvd1Jvb3Qub2xkZXJTaGFkb3dSb290O1xuICAgICAgaWYgKG9sZFNoYWRvd1Jvb3QpIGRvYy5hZG9wdE5vZGUob2xkU2hhZG93Um9vdCk7XG4gICAgfVxuICAgIHZhciBvcmlnaW5hbEdldFNlbGVjdGlvbiA9IGRvY3VtZW50LmdldFNlbGVjdGlvbjtcbiAgICBtaXhpbihEb2N1bWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGFkb3B0Tm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBpZiAobm9kZS5wYXJlbnROb2RlKSBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICAgIGFkb3B0Tm9kZU5vUmVtb3ZlKG5vZGUsIHRoaXMpO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgIH0sXG4gICAgICBlbGVtZW50RnJvbVBvaW50OiBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50RnJvbVBvaW50KHRoaXMsIHRoaXMsIHgsIHkpO1xuICAgICAgfSxcbiAgICAgIGltcG9ydE5vZGU6IGZ1bmN0aW9uKG5vZGUsIGRlZXApIHtcbiAgICAgICAgcmV0dXJuIGNsb25lTm9kZShub2RlLCBkZWVwLCB1bnNhZmVVbndyYXAodGhpcykpO1xuICAgICAgfSxcbiAgICAgIGdldFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTZWxlY3Rpb24ob3JpZ2luYWxHZXRTZWxlY3Rpb24uY2FsbCh1bndyYXAodGhpcykpKTtcbiAgICAgIH0sXG4gICAgICBnZXRFbGVtZW50c0J5TmFtZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gU2VsZWN0b3JzSW50ZXJmYWNlLnF1ZXJ5U2VsZWN0b3JBbGwuY2FsbCh0aGlzLCBcIltuYW1lPVwiICsgSlNPTi5zdHJpbmdpZnkoU3RyaW5nKG5hbWUpKSArIFwiXVwiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgb3JpZ2luYWxDcmVhdGVUcmVlV2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcjtcbiAgICB2YXIgVHJlZVdhbGtlcldyYXBwZXIgPSBzY29wZS53cmFwcGVycy5UcmVlV2Fsa2VyO1xuICAgIERvY3VtZW50LnByb3RvdHlwZS5jcmVhdGVUcmVlV2Fsa2VyID0gZnVuY3Rpb24ocm9vdCwgd2hhdFRvU2hvdywgZmlsdGVyLCBleHBhbmRFbnRpdHlSZWZlcmVuY2VzKSB7XG4gICAgICB2YXIgbmV3RmlsdGVyID0gbnVsbDtcbiAgICAgIGlmIChmaWx0ZXIpIHtcbiAgICAgICAgaWYgKGZpbHRlci5hY2NlcHROb2RlICYmIHR5cGVvZiBmaWx0ZXIuYWNjZXB0Tm9kZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgbmV3RmlsdGVyID0ge1xuICAgICAgICAgICAgYWNjZXB0Tm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyLmFjY2VwdE5vZGUod3JhcChub2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZmlsdGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICBuZXdGaWx0ZXIgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyKHdyYXAobm9kZSkpO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgVHJlZVdhbGtlcldyYXBwZXIob3JpZ2luYWxDcmVhdGVUcmVlV2Fsa2VyLmNhbGwodW53cmFwKHRoaXMpLCB1bndyYXAocm9vdCksIHdoYXRUb1Nob3csIG5ld0ZpbHRlciwgZXhwYW5kRW50aXR5UmVmZXJlbmNlcykpO1xuICAgIH07XG4gICAgaWYgKGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCkge1xuICAgICAgdmFyIG9yaWdpbmFsUmVnaXN0ZXJFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50O1xuICAgICAgRG9jdW1lbnQucHJvdG90eXBlLnJlZ2lzdGVyRWxlbWVudCA9IGZ1bmN0aW9uKHRhZ05hbWUsIG9iamVjdCkge1xuICAgICAgICB2YXIgcHJvdG90eXBlLCBleHRlbmRzT3B0aW9uO1xuICAgICAgICBpZiAob2JqZWN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBwcm90b3R5cGUgPSBvYmplY3QucHJvdG90eXBlO1xuICAgICAgICAgIGV4dGVuZHNPcHRpb24gPSBvYmplY3QuZXh0ZW5kcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXByb3RvdHlwZSkgcHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgICAgICBpZiAoc2NvcGUubmF0aXZlUHJvdG90eXBlVGFibGUuZ2V0KHByb3RvdHlwZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3RTdXBwb3J0ZWRFcnJvclwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG90eXBlKTtcbiAgICAgICAgdmFyIG5hdGl2ZVByb3RvdHlwZTtcbiAgICAgICAgdmFyIHByb3RvdHlwZXMgPSBbXTtcbiAgICAgICAgd2hpbGUgKHByb3RvKSB7XG4gICAgICAgICAgbmF0aXZlUHJvdG90eXBlID0gc2NvcGUubmF0aXZlUHJvdG90eXBlVGFibGUuZ2V0KHByb3RvKTtcbiAgICAgICAgICBpZiAobmF0aXZlUHJvdG90eXBlKSBicmVhaztcbiAgICAgICAgICBwcm90b3R5cGVzLnB1c2gocHJvdG8pO1xuICAgICAgICAgIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW5hdGl2ZVByb3RvdHlwZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdFN1cHBvcnRlZEVycm9yXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuZXdQcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG5hdGl2ZVByb3RvdHlwZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSBwcm90b3R5cGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgbmV3UHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShuZXdQcm90b3R5cGUpO1xuICAgICAgICB9XG4gICAgICAgIFsgXCJjcmVhdGVkQ2FsbGJhY2tcIiwgXCJhdHRhY2hlZENhbGxiYWNrXCIsIFwiZGV0YWNoZWRDYWxsYmFja1wiLCBcImF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFja1wiIF0uZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgdmFyIGYgPSBwcm90b3R5cGVbbmFtZV07XG4gICAgICAgICAgaWYgKCFmKSByZXR1cm47XG4gICAgICAgICAgbmV3UHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoISh3cmFwKHRoaXMpIGluc3RhbmNlb2YgQ3VzdG9tRWxlbWVudENvbnN0cnVjdG9yKSkge1xuICAgICAgICAgICAgICByZXdyYXAodGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmLmFwcGx5KHdyYXAodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBwID0ge1xuICAgICAgICAgIHByb3RvdHlwZTogbmV3UHJvdG90eXBlXG4gICAgICAgIH07XG4gICAgICAgIGlmIChleHRlbmRzT3B0aW9uKSBwLmV4dGVuZHMgPSBleHRlbmRzT3B0aW9uO1xuICAgICAgICBmdW5jdGlvbiBDdXN0b21FbGVtZW50Q29uc3RydWN0b3Iobm9kZSkge1xuICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgaWYgKGV4dGVuZHNPcHRpb24pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZXh0ZW5kc09wdGlvbiwgdGFnTmFtZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgc2V0V3JhcHBlcihub2RlLCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBDdXN0b21FbGVtZW50Q29uc3RydWN0b3IucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgICAgICBDdXN0b21FbGVtZW50Q29uc3RydWN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ3VzdG9tRWxlbWVudENvbnN0cnVjdG9yO1xuICAgICAgICBzY29wZS5jb25zdHJ1Y3RvclRhYmxlLnNldChuZXdQcm90b3R5cGUsIEN1c3RvbUVsZW1lbnRDb25zdHJ1Y3Rvcik7XG4gICAgICAgIHNjb3BlLm5hdGl2ZVByb3RvdHlwZVRhYmxlLnNldChwcm90b3R5cGUsIG5ld1Byb3RvdHlwZSk7XG4gICAgICAgIHZhciBuYXRpdmVDb25zdHJ1Y3RvciA9IG9yaWdpbmFsUmVnaXN0ZXJFbGVtZW50LmNhbGwodW53cmFwKHRoaXMpLCB0YWdOYW1lLCBwKTtcbiAgICAgICAgcmV0dXJuIEN1c3RvbUVsZW1lbnRDb25zdHJ1Y3RvcjtcbiAgICAgIH07XG4gICAgICBmb3J3YXJkTWV0aG9kc1RvV3JhcHBlcihbIHdpbmRvdy5IVE1MRG9jdW1lbnQgfHwgd2luZG93LkRvY3VtZW50IF0sIFsgXCJyZWdpc3RlckVsZW1lbnRcIiBdKTtcbiAgICB9XG4gICAgZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXIoWyB3aW5kb3cuSFRNTEJvZHlFbGVtZW50LCB3aW5kb3cuSFRNTERvY3VtZW50IHx8IHdpbmRvdy5Eb2N1bWVudCwgd2luZG93LkhUTUxIZWFkRWxlbWVudCwgd2luZG93LkhUTUxIdG1sRWxlbWVudCBdLCBbIFwiYXBwZW5kQ2hpbGRcIiwgXCJjb21wYXJlRG9jdW1lbnRQb3NpdGlvblwiLCBcImNvbnRhaW5zXCIsIFwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZVwiLCBcImdldEVsZW1lbnRzQnlUYWdOYW1lXCIsIFwiZ2V0RWxlbWVudHNCeVRhZ05hbWVOU1wiLCBcImluc2VydEJlZm9yZVwiLCBcInF1ZXJ5U2VsZWN0b3JcIiwgXCJxdWVyeVNlbGVjdG9yQWxsXCIsIFwicmVtb3ZlQ2hpbGRcIiwgXCJyZXBsYWNlQ2hpbGRcIiBdKTtcbiAgICBmb3J3YXJkTWV0aG9kc1RvV3JhcHBlcihbIHdpbmRvdy5IVE1MQm9keUVsZW1lbnQsIHdpbmRvdy5IVE1MSGVhZEVsZW1lbnQsIHdpbmRvdy5IVE1MSHRtbEVsZW1lbnQgXSwgbWF0Y2hlc05hbWVzKTtcbiAgICBmb3J3YXJkTWV0aG9kc1RvV3JhcHBlcihbIHdpbmRvdy5IVE1MRG9jdW1lbnQgfHwgd2luZG93LkRvY3VtZW50IF0sIFsgXCJhZG9wdE5vZGVcIiwgXCJpbXBvcnROb2RlXCIsIFwiY29udGFpbnNcIiwgXCJjcmVhdGVDb21tZW50XCIsIFwiY3JlYXRlRG9jdW1lbnRGcmFnbWVudFwiLCBcImNyZWF0ZUVsZW1lbnRcIiwgXCJjcmVhdGVFbGVtZW50TlNcIiwgXCJjcmVhdGVFdmVudFwiLCBcImNyZWF0ZUV2ZW50TlNcIiwgXCJjcmVhdGVSYW5nZVwiLCBcImNyZWF0ZVRleHROb2RlXCIsIFwiY3JlYXRlVHJlZVdhbGtlclwiLCBcImVsZW1lbnRGcm9tUG9pbnRcIiwgXCJnZXRFbGVtZW50QnlJZFwiLCBcImdldEVsZW1lbnRzQnlOYW1lXCIsIFwiZ2V0U2VsZWN0aW9uXCIgXSk7XG4gICAgbWl4aW4oRG9jdW1lbnQucHJvdG90eXBlLCBHZXRFbGVtZW50c0J5SW50ZXJmYWNlKTtcbiAgICBtaXhpbihEb2N1bWVudC5wcm90b3R5cGUsIFBhcmVudE5vZGVJbnRlcmZhY2UpO1xuICAgIG1peGluKERvY3VtZW50LnByb3RvdHlwZSwgU2VsZWN0b3JzSW50ZXJmYWNlKTtcbiAgICBtaXhpbihEb2N1bWVudC5wcm90b3R5cGUsIE5vbkVsZW1lbnRQYXJlbnROb2RlSW50ZXJmYWNlKTtcbiAgICBtaXhpbihEb2N1bWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGdldCBpbXBsZW1lbnRhdGlvbigpIHtcbiAgICAgICAgdmFyIGltcGxlbWVudGF0aW9uID0gaW1wbGVtZW50YXRpb25UYWJsZS5nZXQodGhpcyk7XG4gICAgICAgIGlmIChpbXBsZW1lbnRhdGlvbikgcmV0dXJuIGltcGxlbWVudGF0aW9uO1xuICAgICAgICBpbXBsZW1lbnRhdGlvbiA9IG5ldyBET01JbXBsZW1lbnRhdGlvbih1bndyYXAodGhpcykuaW1wbGVtZW50YXRpb24pO1xuICAgICAgICBpbXBsZW1lbnRhdGlvblRhYmxlLnNldCh0aGlzLCBpbXBsZW1lbnRhdGlvbik7XG4gICAgICAgIHJldHVybiBpbXBsZW1lbnRhdGlvbjtcbiAgICAgIH0sXG4gICAgICBnZXQgZGVmYXVsdFZpZXcoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5kZWZhdWx0Vmlldyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKHdpbmRvdy5Eb2N1bWVudCwgRG9jdW1lbnQsIGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudChcIlwiKSk7XG4gICAgaWYgKHdpbmRvdy5IVE1MRG9jdW1lbnQpIHJlZ2lzdGVyV3JhcHBlcih3aW5kb3cuSFRNTERvY3VtZW50LCBEb2N1bWVudCk7XG4gICAgd3JhcEV2ZW50VGFyZ2V0TWV0aG9kcyhbIHdpbmRvdy5IVE1MQm9keUVsZW1lbnQsIHdpbmRvdy5IVE1MRG9jdW1lbnQgfHwgd2luZG93LkRvY3VtZW50LCB3aW5kb3cuSFRNTEhlYWRFbGVtZW50IF0pO1xuICAgIGZ1bmN0aW9uIERPTUltcGxlbWVudGF0aW9uKGltcGwpIHtcbiAgICAgIHNldFdyYXBwZXIoaW1wbCwgdGhpcyk7XG4gICAgfVxuICAgIHZhciBvcmlnaW5hbENyZWF0ZURvY3VtZW50ID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlRG9jdW1lbnQ7XG4gICAgRE9NSW1wbGVtZW50YXRpb24ucHJvdG90eXBlLmNyZWF0ZURvY3VtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICBhcmd1bWVudHNbMl0gPSB1bndyYXAoYXJndW1lbnRzWzJdKTtcbiAgICAgIHJldHVybiB3cmFwKG9yaWdpbmFsQ3JlYXRlRG9jdW1lbnQuYXBwbHkodW5zYWZlVW53cmFwKHRoaXMpLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIHdyYXBJbXBsTWV0aG9kKGNvbnN0cnVjdG9yLCBuYW1lKSB7XG4gICAgICB2YXIgb3JpZ2luYWwgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbltuYW1lXTtcbiAgICAgIGNvbnN0cnVjdG9yLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcChvcmlnaW5hbC5hcHBseSh1bnNhZmVVbndyYXAodGhpcyksIGFyZ3VtZW50cykpO1xuICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZm9yd2FyZEltcGxNZXRob2QoY29uc3RydWN0b3IsIG5hbWUpIHtcbiAgICAgIHZhciBvcmlnaW5hbCA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uW25hbWVdO1xuICAgICAgY29uc3RydWN0b3IucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBvcmlnaW5hbC5hcHBseSh1bnNhZmVVbndyYXAodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH1cbiAgICB3cmFwSW1wbE1ldGhvZChET01JbXBsZW1lbnRhdGlvbiwgXCJjcmVhdGVEb2N1bWVudFR5cGVcIik7XG4gICAgd3JhcEltcGxNZXRob2QoRE9NSW1wbGVtZW50YXRpb24sIFwiY3JlYXRlSFRNTERvY3VtZW50XCIpO1xuICAgIGZvcndhcmRJbXBsTWV0aG9kKERPTUltcGxlbWVudGF0aW9uLCBcImhhc0ZlYXR1cmVcIik7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKHdpbmRvdy5ET01JbXBsZW1lbnRhdGlvbiwgRE9NSW1wbGVtZW50YXRpb24pO1xuICAgIGZvcndhcmRNZXRob2RzVG9XcmFwcGVyKFsgd2luZG93LkRPTUltcGxlbWVudGF0aW9uIF0sIFsgXCJjcmVhdGVEb2N1bWVudFwiLCBcImNyZWF0ZURvY3VtZW50VHlwZVwiLCBcImNyZWF0ZUhUTUxEb2N1bWVudFwiLCBcImhhc0ZlYXR1cmVcIiBdKTtcbiAgICBzY29wZS5hZG9wdE5vZGVOb1JlbW92ZSA9IGFkb3B0Tm9kZU5vUmVtb3ZlO1xuICAgIHNjb3BlLndyYXBwZXJzLkRPTUltcGxlbWVudGF0aW9uID0gRE9NSW1wbGVtZW50YXRpb247XG4gICAgc2NvcGUud3JhcHBlcnMuRG9jdW1lbnQgPSBEb2N1bWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEV2ZW50VGFyZ2V0ID0gc2NvcGUud3JhcHBlcnMuRXZlbnRUYXJnZXQ7XG4gICAgdmFyIFNlbGVjdGlvbiA9IHNjb3BlLndyYXBwZXJzLlNlbGVjdGlvbjtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciByZW5kZXJBbGxQZW5kaW5nID0gc2NvcGUucmVuZGVyQWxsUGVuZGluZztcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB1bndyYXBJZk5lZWRlZCA9IHNjb3BlLnVud3JhcElmTmVlZGVkO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxXaW5kb3cgPSB3aW5kb3cuV2luZG93O1xuICAgIHZhciBvcmlnaW5hbEdldENvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZTtcbiAgICB2YXIgb3JpZ2luYWxHZXREZWZhdWx0Q29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXREZWZhdWx0Q29tcHV0ZWRTdHlsZTtcbiAgICB2YXIgb3JpZ2luYWxHZXRTZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uO1xuICAgIGZ1bmN0aW9uIFdpbmRvdyhpbXBsKSB7XG4gICAgICBFdmVudFRhcmdldC5jYWxsKHRoaXMsIGltcGwpO1xuICAgIH1cbiAgICBXaW5kb3cucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFdmVudFRhcmdldC5wcm90b3R5cGUpO1xuICAgIE9yaWdpbmFsV2luZG93LnByb3RvdHlwZS5nZXRDb21wdXRlZFN0eWxlID0gZnVuY3Rpb24oZWwsIHBzZXVkbykge1xuICAgICAgcmV0dXJuIHdyYXAodGhpcyB8fCB3aW5kb3cpLmdldENvbXB1dGVkU3R5bGUodW53cmFwSWZOZWVkZWQoZWwpLCBwc2V1ZG8pO1xuICAgIH07XG4gICAgaWYgKG9yaWdpbmFsR2V0RGVmYXVsdENvbXB1dGVkU3R5bGUpIHtcbiAgICAgIE9yaWdpbmFsV2luZG93LnByb3RvdHlwZS5nZXREZWZhdWx0Q29tcHV0ZWRTdHlsZSA9IGZ1bmN0aW9uKGVsLCBwc2V1ZG8pIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodGhpcyB8fCB3aW5kb3cpLmdldERlZmF1bHRDb21wdXRlZFN0eWxlKHVud3JhcElmTmVlZGVkKGVsKSwgcHNldWRvKTtcbiAgICAgIH07XG4gICAgfVxuICAgIE9yaWdpbmFsV2luZG93LnByb3RvdHlwZS5nZXRTZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB3cmFwKHRoaXMgfHwgd2luZG93KS5nZXRTZWxlY3Rpb24oKTtcbiAgICB9O1xuICAgIGRlbGV0ZSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZTtcbiAgICBkZWxldGUgd2luZG93LmdldERlZmF1bHRDb21wdXRlZFN0eWxlO1xuICAgIGRlbGV0ZSB3aW5kb3cuZ2V0U2VsZWN0aW9uO1xuICAgIFsgXCJhZGRFdmVudExpc3RlbmVyXCIsIFwicmVtb3ZlRXZlbnRMaXN0ZW5lclwiLCBcImRpc3BhdGNoRXZlbnRcIiBdLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgT3JpZ2luYWxXaW5kb3cucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB3ID0gd3JhcCh0aGlzIHx8IHdpbmRvdyk7XG4gICAgICAgIHJldHVybiB3W25hbWVdLmFwcGx5KHcsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgICAgZGVsZXRlIHdpbmRvd1tuYW1lXTtcbiAgICB9KTtcbiAgICBtaXhpbihXaW5kb3cucHJvdG90eXBlLCB7XG4gICAgICBnZXRDb21wdXRlZFN0eWxlOiBmdW5jdGlvbihlbCwgcHNldWRvKSB7XG4gICAgICAgIHJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsR2V0Q29tcHV0ZWRTdHlsZS5jYWxsKHVud3JhcCh0aGlzKSwgdW53cmFwSWZOZWVkZWQoZWwpLCBwc2V1ZG8pO1xuICAgICAgfSxcbiAgICAgIGdldFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTZWxlY3Rpb24ob3JpZ2luYWxHZXRTZWxlY3Rpb24uY2FsbCh1bndyYXAodGhpcykpKTtcbiAgICAgIH0sXG4gICAgICBnZXQgZG9jdW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5kb2N1bWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKG9yaWdpbmFsR2V0RGVmYXVsdENvbXB1dGVkU3R5bGUpIHtcbiAgICAgIFdpbmRvdy5wcm90b3R5cGUuZ2V0RGVmYXVsdENvbXB1dGVkU3R5bGUgPSBmdW5jdGlvbihlbCwgcHNldWRvKSB7XG4gICAgICAgIHJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsR2V0RGVmYXVsdENvbXB1dGVkU3R5bGUuY2FsbCh1bndyYXAodGhpcyksIHVud3JhcElmTmVlZGVkKGVsKSwgcHNldWRvKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbFdpbmRvdywgV2luZG93LCB3aW5kb3cpO1xuICAgIHNjb3BlLndyYXBwZXJzLldpbmRvdyA9IFdpbmRvdztcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxEYXRhVHJhbnNmZXIgPSB3aW5kb3cuRGF0YVRyYW5zZmVyIHx8IHdpbmRvdy5DbGlwYm9hcmQ7XG4gICAgdmFyIE9yaWdpbmFsRGF0YVRyYW5zZmVyU2V0RHJhZ0ltYWdlID0gT3JpZ2luYWxEYXRhVHJhbnNmZXIucHJvdG90eXBlLnNldERyYWdJbWFnZTtcbiAgICBpZiAoT3JpZ2luYWxEYXRhVHJhbnNmZXJTZXREcmFnSW1hZ2UpIHtcbiAgICAgIE9yaWdpbmFsRGF0YVRyYW5zZmVyLnByb3RvdHlwZS5zZXREcmFnSW1hZ2UgPSBmdW5jdGlvbihpbWFnZSwgeCwgeSkge1xuICAgICAgICBPcmlnaW5hbERhdGFUcmFuc2ZlclNldERyYWdJbWFnZS5jYWxsKHRoaXMsIHVud3JhcChpbWFnZSksIHgsIHkpO1xuICAgICAgfTtcbiAgICB9XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHNldFdyYXBwZXIgPSBzY29wZS5zZXRXcmFwcGVyO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIE9yaWdpbmFsRm9ybURhdGEgPSB3aW5kb3cuRm9ybURhdGE7XG4gICAgaWYgKCFPcmlnaW5hbEZvcm1EYXRhKSByZXR1cm47XG4gICAgZnVuY3Rpb24gRm9ybURhdGEoZm9ybUVsZW1lbnQpIHtcbiAgICAgIHZhciBpbXBsO1xuICAgICAgaWYgKGZvcm1FbGVtZW50IGluc3RhbmNlb2YgT3JpZ2luYWxGb3JtRGF0YSkge1xuICAgICAgICBpbXBsID0gZm9ybUVsZW1lbnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbXBsID0gbmV3IE9yaWdpbmFsRm9ybURhdGEoZm9ybUVsZW1lbnQgJiYgdW53cmFwKGZvcm1FbGVtZW50KSk7XG4gICAgICB9XG4gICAgICBzZXRXcmFwcGVyKGltcGwsIHRoaXMpO1xuICAgIH1cbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxGb3JtRGF0YSwgRm9ybURhdGEsIG5ldyBPcmlnaW5hbEZvcm1EYXRhKCkpO1xuICAgIHNjb3BlLndyYXBwZXJzLkZvcm1EYXRhID0gRm9ybURhdGE7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciB1bndyYXBJZk5lZWRlZCA9IHNjb3BlLnVud3JhcElmTmVlZGVkO1xuICAgIHZhciBvcmlnaW5hbFNlbmQgPSBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZDtcbiAgICBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9yaWdpbmFsU2VuZC5jYWxsKHRoaXMsIHVud3JhcElmTmVlZGVkKG9iaikpO1xuICAgIH07XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBpc1dyYXBwZXJGb3IgPSBzY29wZS5pc1dyYXBwZXJGb3I7XG4gICAgdmFyIGVsZW1lbnRzID0ge1xuICAgICAgYTogXCJIVE1MQW5jaG9yRWxlbWVudFwiLFxuICAgICAgYXJlYTogXCJIVE1MQXJlYUVsZW1lbnRcIixcbiAgICAgIGF1ZGlvOiBcIkhUTUxBdWRpb0VsZW1lbnRcIixcbiAgICAgIGJhc2U6IFwiSFRNTEJhc2VFbGVtZW50XCIsXG4gICAgICBib2R5OiBcIkhUTUxCb2R5RWxlbWVudFwiLFxuICAgICAgYnI6IFwiSFRNTEJSRWxlbWVudFwiLFxuICAgICAgYnV0dG9uOiBcIkhUTUxCdXR0b25FbGVtZW50XCIsXG4gICAgICBjYW52YXM6IFwiSFRNTENhbnZhc0VsZW1lbnRcIixcbiAgICAgIGNhcHRpb246IFwiSFRNTFRhYmxlQ2FwdGlvbkVsZW1lbnRcIixcbiAgICAgIGNvbDogXCJIVE1MVGFibGVDb2xFbGVtZW50XCIsXG4gICAgICBjb250ZW50OiBcIkhUTUxDb250ZW50RWxlbWVudFwiLFxuICAgICAgZGF0YTogXCJIVE1MRGF0YUVsZW1lbnRcIixcbiAgICAgIGRhdGFsaXN0OiBcIkhUTUxEYXRhTGlzdEVsZW1lbnRcIixcbiAgICAgIGRlbDogXCJIVE1MTW9kRWxlbWVudFwiLFxuICAgICAgZGlyOiBcIkhUTUxEaXJlY3RvcnlFbGVtZW50XCIsXG4gICAgICBkaXY6IFwiSFRNTERpdkVsZW1lbnRcIixcbiAgICAgIGRsOiBcIkhUTUxETGlzdEVsZW1lbnRcIixcbiAgICAgIGVtYmVkOiBcIkhUTUxFbWJlZEVsZW1lbnRcIixcbiAgICAgIGZpZWxkc2V0OiBcIkhUTUxGaWVsZFNldEVsZW1lbnRcIixcbiAgICAgIGZvbnQ6IFwiSFRNTEZvbnRFbGVtZW50XCIsXG4gICAgICBmb3JtOiBcIkhUTUxGb3JtRWxlbWVudFwiLFxuICAgICAgZnJhbWU6IFwiSFRNTEZyYW1lRWxlbWVudFwiLFxuICAgICAgZnJhbWVzZXQ6IFwiSFRNTEZyYW1lU2V0RWxlbWVudFwiLFxuICAgICAgaDE6IFwiSFRNTEhlYWRpbmdFbGVtZW50XCIsXG4gICAgICBoZWFkOiBcIkhUTUxIZWFkRWxlbWVudFwiLFxuICAgICAgaHI6IFwiSFRNTEhSRWxlbWVudFwiLFxuICAgICAgaHRtbDogXCJIVE1MSHRtbEVsZW1lbnRcIixcbiAgICAgIGlmcmFtZTogXCJIVE1MSUZyYW1lRWxlbWVudFwiLFxuICAgICAgaW1nOiBcIkhUTUxJbWFnZUVsZW1lbnRcIixcbiAgICAgIGlucHV0OiBcIkhUTUxJbnB1dEVsZW1lbnRcIixcbiAgICAgIGtleWdlbjogXCJIVE1MS2V5Z2VuRWxlbWVudFwiLFxuICAgICAgbGFiZWw6IFwiSFRNTExhYmVsRWxlbWVudFwiLFxuICAgICAgbGVnZW5kOiBcIkhUTUxMZWdlbmRFbGVtZW50XCIsXG4gICAgICBsaTogXCJIVE1MTElFbGVtZW50XCIsXG4gICAgICBsaW5rOiBcIkhUTUxMaW5rRWxlbWVudFwiLFxuICAgICAgbWFwOiBcIkhUTUxNYXBFbGVtZW50XCIsXG4gICAgICBtYXJxdWVlOiBcIkhUTUxNYXJxdWVlRWxlbWVudFwiLFxuICAgICAgbWVudTogXCJIVE1MTWVudUVsZW1lbnRcIixcbiAgICAgIG1lbnVpdGVtOiBcIkhUTUxNZW51SXRlbUVsZW1lbnRcIixcbiAgICAgIG1ldGE6IFwiSFRNTE1ldGFFbGVtZW50XCIsXG4gICAgICBtZXRlcjogXCJIVE1MTWV0ZXJFbGVtZW50XCIsXG4gICAgICBvYmplY3Q6IFwiSFRNTE9iamVjdEVsZW1lbnRcIixcbiAgICAgIG9sOiBcIkhUTUxPTGlzdEVsZW1lbnRcIixcbiAgICAgIG9wdGdyb3VwOiBcIkhUTUxPcHRHcm91cEVsZW1lbnRcIixcbiAgICAgIG9wdGlvbjogXCJIVE1MT3B0aW9uRWxlbWVudFwiLFxuICAgICAgb3V0cHV0OiBcIkhUTUxPdXRwdXRFbGVtZW50XCIsXG4gICAgICBwOiBcIkhUTUxQYXJhZ3JhcGhFbGVtZW50XCIsXG4gICAgICBwYXJhbTogXCJIVE1MUGFyYW1FbGVtZW50XCIsXG4gICAgICBwcmU6IFwiSFRNTFByZUVsZW1lbnRcIixcbiAgICAgIHByb2dyZXNzOiBcIkhUTUxQcm9ncmVzc0VsZW1lbnRcIixcbiAgICAgIHE6IFwiSFRNTFF1b3RlRWxlbWVudFwiLFxuICAgICAgc2NyaXB0OiBcIkhUTUxTY3JpcHRFbGVtZW50XCIsXG4gICAgICBzZWxlY3Q6IFwiSFRNTFNlbGVjdEVsZW1lbnRcIixcbiAgICAgIHNoYWRvdzogXCJIVE1MU2hhZG93RWxlbWVudFwiLFxuICAgICAgc291cmNlOiBcIkhUTUxTb3VyY2VFbGVtZW50XCIsXG4gICAgICBzcGFuOiBcIkhUTUxTcGFuRWxlbWVudFwiLFxuICAgICAgc3R5bGU6IFwiSFRNTFN0eWxlRWxlbWVudFwiLFxuICAgICAgdGFibGU6IFwiSFRNTFRhYmxlRWxlbWVudFwiLFxuICAgICAgdGJvZHk6IFwiSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnRcIixcbiAgICAgIHRlbXBsYXRlOiBcIkhUTUxUZW1wbGF0ZUVsZW1lbnRcIixcbiAgICAgIHRleHRhcmVhOiBcIkhUTUxUZXh0QXJlYUVsZW1lbnRcIixcbiAgICAgIHRoZWFkOiBcIkhUTUxUYWJsZVNlY3Rpb25FbGVtZW50XCIsXG4gICAgICB0aW1lOiBcIkhUTUxUaW1lRWxlbWVudFwiLFxuICAgICAgdGl0bGU6IFwiSFRNTFRpdGxlRWxlbWVudFwiLFxuICAgICAgdHI6IFwiSFRNTFRhYmxlUm93RWxlbWVudFwiLFxuICAgICAgdHJhY2s6IFwiSFRNTFRyYWNrRWxlbWVudFwiLFxuICAgICAgdWw6IFwiSFRNTFVMaXN0RWxlbWVudFwiLFxuICAgICAgdmlkZW86IFwiSFRNTFZpZGVvRWxlbWVudFwiXG4gICAgfTtcbiAgICBmdW5jdGlvbiBvdmVycmlkZUNvbnN0cnVjdG9yKHRhZ05hbWUpIHtcbiAgICAgIHZhciBuYXRpdmVDb25zdHJ1Y3Rvck5hbWUgPSBlbGVtZW50c1t0YWdOYW1lXTtcbiAgICAgIHZhciBuYXRpdmVDb25zdHJ1Y3RvciA9IHdpbmRvd1tuYXRpdmVDb25zdHJ1Y3Rvck5hbWVdO1xuICAgICAgaWYgKCFuYXRpdmVDb25zdHJ1Y3RvcikgcmV0dXJuO1xuICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICAgICAgdmFyIHdyYXBwZXJDb25zdHJ1Y3RvciA9IGVsZW1lbnQuY29uc3RydWN0b3I7XG4gICAgICB3aW5kb3dbbmF0aXZlQ29uc3RydWN0b3JOYW1lXSA9IHdyYXBwZXJDb25zdHJ1Y3RvcjtcbiAgICB9XG4gICAgT2JqZWN0LmtleXMoZWxlbWVudHMpLmZvckVhY2gob3ZlcnJpZGVDb25zdHJ1Y3Rvcik7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoc2NvcGUud3JhcHBlcnMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgd2luZG93W25hbWVdID0gc2NvcGUud3JhcHBlcnNbbmFtZV07XG4gICAgfSk7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIHZhciBTaGFkb3dDU1MgPSB7XG4gICAgICBzdHJpY3RTdHlsaW5nOiBmYWxzZSxcbiAgICAgIHJlZ2lzdHJ5OiB7fSxcbiAgICAgIHNoaW1TdHlsaW5nOiBmdW5jdGlvbihyb290LCBuYW1lLCBleHRlbmRzTmFtZSkge1xuICAgICAgICB2YXIgc2NvcGVTdHlsZXMgPSB0aGlzLnByZXBhcmVSb290KHJvb3QsIG5hbWUsIGV4dGVuZHNOYW1lKTtcbiAgICAgICAgdmFyIHR5cGVFeHRlbnNpb24gPSB0aGlzLmlzVHlwZUV4dGVuc2lvbihleHRlbmRzTmFtZSk7XG4gICAgICAgIHZhciBzY29wZVNlbGVjdG9yID0gdGhpcy5tYWtlU2NvcGVTZWxlY3RvcihuYW1lLCB0eXBlRXh0ZW5zaW9uKTtcbiAgICAgICAgdmFyIGNzc1RleHQgPSBzdHlsZXNUb0Nzc1RleHQoc2NvcGVTdHlsZXMsIHRydWUpO1xuICAgICAgICBjc3NUZXh0ID0gdGhpcy5zY29wZUNzc1RleHQoY3NzVGV4dCwgc2NvcGVTZWxlY3Rvcik7XG4gICAgICAgIGlmIChyb290KSB7XG4gICAgICAgICAgcm9vdC5zaGltbWVkU3R5bGUgPSBjc3NUZXh0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRkQ3NzVG9Eb2N1bWVudChjc3NUZXh0LCBuYW1lKTtcbiAgICAgIH0sXG4gICAgICBzaGltU3R5bGU6IGZ1bmN0aW9uKHN0eWxlLCBzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5zaGltQ3NzVGV4dChzdHlsZS50ZXh0Q29udGVudCwgc2VsZWN0b3IpO1xuICAgICAgfSxcbiAgICAgIHNoaW1Dc3NUZXh0OiBmdW5jdGlvbihjc3NUZXh0LCBzZWxlY3Rvcikge1xuICAgICAgICBjc3NUZXh0ID0gdGhpcy5pbnNlcnREaXJlY3RpdmVzKGNzc1RleHQpO1xuICAgICAgICByZXR1cm4gdGhpcy5zY29wZUNzc1RleHQoY3NzVGV4dCwgc2VsZWN0b3IpO1xuICAgICAgfSxcbiAgICAgIG1ha2VTY29wZVNlbGVjdG9yOiBmdW5jdGlvbihuYW1lLCB0eXBlRXh0ZW5zaW9uKSB7XG4gICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVFeHRlbnNpb24gPyBcIltpcz1cIiArIG5hbWUgKyBcIl1cIiA6IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9LFxuICAgICAgaXNUeXBlRXh0ZW5zaW9uOiBmdW5jdGlvbihleHRlbmRzTmFtZSkge1xuICAgICAgICByZXR1cm4gZXh0ZW5kc05hbWUgJiYgZXh0ZW5kc05hbWUuaW5kZXhPZihcIi1cIikgPCAwO1xuICAgICAgfSxcbiAgICAgIHByZXBhcmVSb290OiBmdW5jdGlvbihyb290LCBuYW1lLCBleHRlbmRzTmFtZSkge1xuICAgICAgICB2YXIgZGVmID0gdGhpcy5yZWdpc3RlclJvb3Qocm9vdCwgbmFtZSwgZXh0ZW5kc05hbWUpO1xuICAgICAgICB0aGlzLnJlcGxhY2VUZXh0SW5TdHlsZXMoZGVmLnJvb3RTdHlsZXMsIHRoaXMuaW5zZXJ0RGlyZWN0aXZlcyk7XG4gICAgICAgIHRoaXMucmVtb3ZlU3R5bGVzKHJvb3QsIGRlZi5yb290U3R5bGVzKTtcbiAgICAgICAgaWYgKHRoaXMuc3RyaWN0U3R5bGluZykge1xuICAgICAgICAgIHRoaXMuYXBwbHlTY29wZVRvQ29udGVudChyb290LCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmLnNjb3BlU3R5bGVzO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZVN0eWxlczogZnVuY3Rpb24ocm9vdCwgc3R5bGVzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gc3R5bGVzLmxlbmd0aCwgczsgaSA8IGwgJiYgKHMgPSBzdHlsZXNbaV0pOyBpKyspIHtcbiAgICAgICAgICBzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByZWdpc3RlclJvb3Q6IGZ1bmN0aW9uKHJvb3QsIG5hbWUsIGV4dGVuZHNOYW1lKSB7XG4gICAgICAgIHZhciBkZWYgPSB0aGlzLnJlZ2lzdHJ5W25hbWVdID0ge1xuICAgICAgICAgIHJvb3Q6IHJvb3QsXG4gICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICBleHRlbmRzTmFtZTogZXh0ZW5kc05hbWVcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHN0eWxlcyA9IHRoaXMuZmluZFN0eWxlcyhyb290KTtcbiAgICAgICAgZGVmLnJvb3RTdHlsZXMgPSBzdHlsZXM7XG4gICAgICAgIGRlZi5zY29wZVN0eWxlcyA9IGRlZi5yb290U3R5bGVzO1xuICAgICAgICB2YXIgZXh0ZW5kZWUgPSB0aGlzLnJlZ2lzdHJ5W2RlZi5leHRlbmRzTmFtZV07XG4gICAgICAgIGlmIChleHRlbmRlZSkge1xuICAgICAgICAgIGRlZi5zY29wZVN0eWxlcyA9IGV4dGVuZGVlLnNjb3BlU3R5bGVzLmNvbmNhdChkZWYuc2NvcGVTdHlsZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWY7XG4gICAgICB9LFxuICAgICAgZmluZFN0eWxlczogZnVuY3Rpb24ocm9vdCkge1xuICAgICAgICBpZiAoIXJvb3QpIHtcbiAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0eWxlcyA9IHJvb3QucXVlcnlTZWxlY3RvckFsbChcInN0eWxlXCIpO1xuICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmZpbHRlci5jYWxsKHN0eWxlcywgZnVuY3Rpb24ocykge1xuICAgICAgICAgIHJldHVybiAhcy5oYXNBdHRyaWJ1dGUoTk9fU0hJTV9BVFRSSUJVVEUpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBhcHBseVNjb3BlVG9Db250ZW50OiBmdW5jdGlvbihyb290LCBuYW1lKSB7XG4gICAgICAgIGlmIChyb290KSB7XG4gICAgICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChyb290LnF1ZXJ5U2VsZWN0b3JBbGwoXCIqXCIpLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShuYW1lLCBcIlwiKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHJvb3QucXVlcnlTZWxlY3RvckFsbChcInRlbXBsYXRlXCIpLCBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5hcHBseVNjb3BlVG9Db250ZW50KHRlbXBsYXRlLmNvbnRlbnQsIG5hbWUpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgaW5zZXJ0RGlyZWN0aXZlczogZnVuY3Rpb24oY3NzVGV4dCkge1xuICAgICAgICBjc3NUZXh0ID0gdGhpcy5pbnNlcnRQb2x5ZmlsbERpcmVjdGl2ZXNJbkNzc1RleHQoY3NzVGV4dCk7XG4gICAgICAgIHJldHVybiB0aGlzLmluc2VydFBvbHlmaWxsUnVsZXNJbkNzc1RleHQoY3NzVGV4dCk7XG4gICAgICB9LFxuICAgICAgaW5zZXJ0UG9seWZpbGxEaXJlY3RpdmVzSW5Dc3NUZXh0OiBmdW5jdGlvbihjc3NUZXh0KSB7XG4gICAgICAgIGNzc1RleHQgPSBjc3NUZXh0LnJlcGxhY2UoY3NzQ29tbWVudE5leHRTZWxlY3RvclJlLCBmdW5jdGlvbihtYXRjaCwgcDEpIHtcbiAgICAgICAgICByZXR1cm4gcDEuc2xpY2UoMCwgLTIpICsgXCJ7XCI7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY3NzVGV4dC5yZXBsYWNlKGNzc0NvbnRlbnROZXh0U2VsZWN0b3JSZSwgZnVuY3Rpb24obWF0Y2gsIHAxKSB7XG4gICAgICAgICAgcmV0dXJuIHAxICsgXCIge1wiO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBpbnNlcnRQb2x5ZmlsbFJ1bGVzSW5Dc3NUZXh0OiBmdW5jdGlvbihjc3NUZXh0KSB7XG4gICAgICAgIGNzc1RleHQgPSBjc3NUZXh0LnJlcGxhY2UoY3NzQ29tbWVudFJ1bGVSZSwgZnVuY3Rpb24obWF0Y2gsIHAxKSB7XG4gICAgICAgICAgcmV0dXJuIHAxLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjc3NUZXh0LnJlcGxhY2UoY3NzQ29udGVudFJ1bGVSZSwgZnVuY3Rpb24obWF0Y2gsIHAxLCBwMiwgcDMpIHtcbiAgICAgICAgICB2YXIgcnVsZSA9IG1hdGNoLnJlcGxhY2UocDEsIFwiXCIpLnJlcGxhY2UocDIsIFwiXCIpO1xuICAgICAgICAgIHJldHVybiBwMyArIHJ1bGU7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIHNjb3BlQ3NzVGV4dDogZnVuY3Rpb24oY3NzVGV4dCwgc2NvcGVTZWxlY3Rvcikge1xuICAgICAgICB2YXIgdW5zY29wZWQgPSB0aGlzLmV4dHJhY3RVbnNjb3BlZFJ1bGVzRnJvbUNzc1RleHQoY3NzVGV4dCk7XG4gICAgICAgIGNzc1RleHQgPSB0aGlzLmluc2VydFBvbHlmaWxsSG9zdEluQ3NzVGV4dChjc3NUZXh0KTtcbiAgICAgICAgY3NzVGV4dCA9IHRoaXMuY29udmVydENvbG9uSG9zdChjc3NUZXh0KTtcbiAgICAgICAgY3NzVGV4dCA9IHRoaXMuY29udmVydENvbG9uSG9zdENvbnRleHQoY3NzVGV4dCk7XG4gICAgICAgIGNzc1RleHQgPSB0aGlzLmNvbnZlcnRTaGFkb3dET01TZWxlY3RvcnMoY3NzVGV4dCk7XG4gICAgICAgIGlmIChzY29wZVNlbGVjdG9yKSB7XG4gICAgICAgICAgdmFyIHNlbGYgPSB0aGlzLCBjc3NUZXh0O1xuICAgICAgICAgIHdpdGhDc3NSdWxlcyhjc3NUZXh0LCBmdW5jdGlvbihydWxlcykge1xuICAgICAgICAgICAgY3NzVGV4dCA9IHNlbGYuc2NvcGVSdWxlcyhydWxlcywgc2NvcGVTZWxlY3Rvcik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY3NzVGV4dCA9IGNzc1RleHQgKyBcIlxcblwiICsgdW5zY29wZWQ7XG4gICAgICAgIHJldHVybiBjc3NUZXh0LnRyaW0oKTtcbiAgICAgIH0sXG4gICAgICBleHRyYWN0VW5zY29wZWRSdWxlc0Zyb21Dc3NUZXh0OiBmdW5jdGlvbihjc3NUZXh0KSB7XG4gICAgICAgIHZhciByID0gXCJcIiwgbTtcbiAgICAgICAgd2hpbGUgKG0gPSBjc3NDb21tZW50VW5zY29wZWRSdWxlUmUuZXhlYyhjc3NUZXh0KSkge1xuICAgICAgICAgIHIgKz0gbVsxXS5zbGljZSgwLCAtMSkgKyBcIlxcblxcblwiO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChtID0gY3NzQ29udGVudFVuc2NvcGVkUnVsZVJlLmV4ZWMoY3NzVGV4dCkpIHtcbiAgICAgICAgICByICs9IG1bMF0ucmVwbGFjZShtWzJdLCBcIlwiKS5yZXBsYWNlKG1bMV0sIG1bM10pICsgXCJcXG5cXG5cIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcjtcbiAgICAgIH0sXG4gICAgICBjb252ZXJ0Q29sb25Ib3N0OiBmdW5jdGlvbihjc3NUZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRDb2xvblJ1bGUoY3NzVGV4dCwgY3NzQ29sb25Ib3N0UmUsIHRoaXMuY29sb25Ib3N0UGFydFJlcGxhY2VyKTtcbiAgICAgIH0sXG4gICAgICBjb252ZXJ0Q29sb25Ib3N0Q29udGV4dDogZnVuY3Rpb24oY3NzVGV4dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb252ZXJ0Q29sb25SdWxlKGNzc1RleHQsIGNzc0NvbG9uSG9zdENvbnRleHRSZSwgdGhpcy5jb2xvbkhvc3RDb250ZXh0UGFydFJlcGxhY2VyKTtcbiAgICAgIH0sXG4gICAgICBjb252ZXJ0Q29sb25SdWxlOiBmdW5jdGlvbihjc3NUZXh0LCByZWdFeHAsIHBhcnRSZXBsYWNlcikge1xuICAgICAgICByZXR1cm4gY3NzVGV4dC5yZXBsYWNlKHJlZ0V4cCwgZnVuY3Rpb24obSwgcDEsIHAyLCBwMykge1xuICAgICAgICAgIHAxID0gcG9seWZpbGxIb3N0Tm9Db21iaW5hdG9yO1xuICAgICAgICAgIGlmIChwMikge1xuICAgICAgICAgICAgdmFyIHBhcnRzID0gcDIuc3BsaXQoXCIsXCIpLCByID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHBhcnRzLmxlbmd0aCwgcDsgaSA8IGwgJiYgKHAgPSBwYXJ0c1tpXSk7IGkrKykge1xuICAgICAgICAgICAgICBwID0gcC50cmltKCk7XG4gICAgICAgICAgICAgIHIucHVzaChwYXJ0UmVwbGFjZXIocDEsIHAsIHAzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gci5qb2luKFwiLFwiKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHAxICsgcDM7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBjb2xvbkhvc3RDb250ZXh0UGFydFJlcGxhY2VyOiBmdW5jdGlvbihob3N0LCBwYXJ0LCBzdWZmaXgpIHtcbiAgICAgICAgaWYgKHBhcnQubWF0Y2gocG9seWZpbGxIb3N0KSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNvbG9uSG9zdFBhcnRSZXBsYWNlcihob3N0LCBwYXJ0LCBzdWZmaXgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBob3N0ICsgcGFydCArIHN1ZmZpeCArIFwiLCBcIiArIHBhcnQgKyBcIiBcIiArIGhvc3QgKyBzdWZmaXg7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBjb2xvbkhvc3RQYXJ0UmVwbGFjZXI6IGZ1bmN0aW9uKGhvc3QsIHBhcnQsIHN1ZmZpeCkge1xuICAgICAgICByZXR1cm4gaG9zdCArIHBhcnQucmVwbGFjZShwb2x5ZmlsbEhvc3QsIFwiXCIpICsgc3VmZml4O1xuICAgICAgfSxcbiAgICAgIGNvbnZlcnRTaGFkb3dET01TZWxlY3RvcnM6IGZ1bmN0aW9uKGNzc1RleHQpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaGFkb3dET01TZWxlY3RvcnNSZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNzc1RleHQgPSBjc3NUZXh0LnJlcGxhY2Uoc2hhZG93RE9NU2VsZWN0b3JzUmVbaV0sIFwiIFwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3NzVGV4dDtcbiAgICAgIH0sXG4gICAgICBzY29wZVJ1bGVzOiBmdW5jdGlvbihjc3NSdWxlcywgc2NvcGVTZWxlY3Rvcikge1xuICAgICAgICB2YXIgY3NzVGV4dCA9IFwiXCI7XG4gICAgICAgIGlmIChjc3NSdWxlcykge1xuICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoY3NzUnVsZXMsIGZ1bmN0aW9uKHJ1bGUpIHtcbiAgICAgICAgICAgIGlmIChydWxlLnNlbGVjdG9yVGV4dCAmJiAocnVsZS5zdHlsZSAmJiBydWxlLnN0eWxlLmNzc1RleHQgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgICAgY3NzVGV4dCArPSB0aGlzLnNjb3BlU2VsZWN0b3IocnVsZS5zZWxlY3RvclRleHQsIHNjb3BlU2VsZWN0b3IsIHRoaXMuc3RyaWN0U3R5bGluZykgKyBcIiB7XFxuXHRcIjtcbiAgICAgICAgICAgICAgY3NzVGV4dCArPSB0aGlzLnByb3BlcnRpZXNGcm9tUnVsZShydWxlKSArIFwiXFxufVxcblxcblwiO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChydWxlLnR5cGUgPT09IENTU1J1bGUuTUVESUFfUlVMRSkge1xuICAgICAgICAgICAgICBjc3NUZXh0ICs9IFwiQG1lZGlhIFwiICsgcnVsZS5tZWRpYS5tZWRpYVRleHQgKyBcIiB7XFxuXCI7XG4gICAgICAgICAgICAgIGNzc1RleHQgKz0gdGhpcy5zY29wZVJ1bGVzKHJ1bGUuY3NzUnVsZXMsIHNjb3BlU2VsZWN0b3IpO1xuICAgICAgICAgICAgICBjc3NUZXh0ICs9IFwiXFxufVxcblxcblwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAocnVsZS5jc3NUZXh0KSB7XG4gICAgICAgICAgICAgICAgICBjc3NUZXh0ICs9IHJ1bGUuY3NzVGV4dCArIFwiXFxuXFxuXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoICh4KSB7XG4gICAgICAgICAgICAgICAgaWYgKHJ1bGUudHlwZSA9PT0gQ1NTUnVsZS5LRVlGUkFNRVNfUlVMRSAmJiBydWxlLmNzc1J1bGVzKSB7XG4gICAgICAgICAgICAgICAgICBjc3NUZXh0ICs9IHRoaXMuaWVTYWZlQ3NzVGV4dEZyb21LZXlGcmFtZVJ1bGUocnVsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNzc1RleHQ7XG4gICAgICB9LFxuICAgICAgaWVTYWZlQ3NzVGV4dEZyb21LZXlGcmFtZVJ1bGU6IGZ1bmN0aW9uKHJ1bGUpIHtcbiAgICAgICAgdmFyIGNzc1RleHQgPSBcIkBrZXlmcmFtZXMgXCIgKyBydWxlLm5hbWUgKyBcIiB7XCI7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwocnVsZS5jc3NSdWxlcywgZnVuY3Rpb24ocnVsZSkge1xuICAgICAgICAgIGNzc1RleHQgKz0gXCIgXCIgKyBydWxlLmtleVRleHQgKyBcIiB7XCIgKyBydWxlLnN0eWxlLmNzc1RleHQgKyBcIn1cIjtcbiAgICAgICAgfSk7XG4gICAgICAgIGNzc1RleHQgKz0gXCIgfVwiO1xuICAgICAgICByZXR1cm4gY3NzVGV4dDtcbiAgICAgIH0sXG4gICAgICBzY29wZVNlbGVjdG9yOiBmdW5jdGlvbihzZWxlY3Rvciwgc2NvcGVTZWxlY3Rvciwgc3RyaWN0KSB7XG4gICAgICAgIHZhciByID0gW10sIHBhcnRzID0gc2VsZWN0b3Iuc3BsaXQoXCIsXCIpO1xuICAgICAgICBwYXJ0cy5mb3JFYWNoKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgICBwID0gcC50cmltKCk7XG4gICAgICAgICAgaWYgKHRoaXMuc2VsZWN0b3JOZWVkc1Njb3BpbmcocCwgc2NvcGVTZWxlY3RvcikpIHtcbiAgICAgICAgICAgIHAgPSBzdHJpY3QgJiYgIXAubWF0Y2gocG9seWZpbGxIb3N0Tm9Db21iaW5hdG9yKSA/IHRoaXMuYXBwbHlTdHJpY3RTZWxlY3RvclNjb3BlKHAsIHNjb3BlU2VsZWN0b3IpIDogdGhpcy5hcHBseVNlbGVjdG9yU2NvcGUocCwgc2NvcGVTZWxlY3Rvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHIucHVzaChwKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiByLmpvaW4oXCIsIFwiKTtcbiAgICAgIH0sXG4gICAgICBzZWxlY3Rvck5lZWRzU2NvcGluZzogZnVuY3Rpb24oc2VsZWN0b3IsIHNjb3BlU2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NvcGVTZWxlY3RvcikpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmUgPSB0aGlzLm1ha2VTY29wZU1hdGNoZXIoc2NvcGVTZWxlY3Rvcik7XG4gICAgICAgIHJldHVybiAhc2VsZWN0b3IubWF0Y2gocmUpO1xuICAgICAgfSxcbiAgICAgIG1ha2VTY29wZU1hdGNoZXI6IGZ1bmN0aW9uKHNjb3BlU2VsZWN0b3IpIHtcbiAgICAgICAgc2NvcGVTZWxlY3RvciA9IHNjb3BlU2VsZWN0b3IucmVwbGFjZSgvXFxbL2csIFwiXFxcXFtcIikucmVwbGFjZSgvXFxdL2csIFwiXFxcXF1cIik7XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKFwiXihcIiArIHNjb3BlU2VsZWN0b3IgKyBcIilcIiArIHNlbGVjdG9yUmVTdWZmaXgsIFwibVwiKTtcbiAgICAgIH0sXG4gICAgICBhcHBseVNlbGVjdG9yU2NvcGU6IGZ1bmN0aW9uKHNlbGVjdG9yLCBzZWxlY3RvclNjb3BlKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHNlbGVjdG9yU2NvcGUpID8gdGhpcy5hcHBseVNlbGVjdG9yU2NvcGVMaXN0KHNlbGVjdG9yLCBzZWxlY3RvclNjb3BlKSA6IHRoaXMuYXBwbHlTaW1wbGVTZWxlY3RvclNjb3BlKHNlbGVjdG9yLCBzZWxlY3RvclNjb3BlKTtcbiAgICAgIH0sXG4gICAgICBhcHBseVNlbGVjdG9yU2NvcGVMaXN0OiBmdW5jdGlvbihzZWxlY3Rvciwgc2NvcGVTZWxlY3Rvckxpc3QpIHtcbiAgICAgICAgdmFyIHIgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHM7IHMgPSBzY29wZVNlbGVjdG9yTGlzdFtpXTsgaSsrKSB7XG4gICAgICAgICAgci5wdXNoKHRoaXMuYXBwbHlTaW1wbGVTZWxlY3RvclNjb3BlKHNlbGVjdG9yLCBzKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHIuam9pbihcIiwgXCIpO1xuICAgICAgfSxcbiAgICAgIGFwcGx5U2ltcGxlU2VsZWN0b3JTY29wZTogZnVuY3Rpb24oc2VsZWN0b3IsIHNjb3BlU2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKHNlbGVjdG9yLm1hdGNoKHBvbHlmaWxsSG9zdFJlKSkge1xuICAgICAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IucmVwbGFjZShwb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3IsIHNjb3BlU2VsZWN0b3IpO1xuICAgICAgICAgIHJldHVybiBzZWxlY3Rvci5yZXBsYWNlKHBvbHlmaWxsSG9zdFJlLCBzY29wZVNlbGVjdG9yICsgXCIgXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBzY29wZVNlbGVjdG9yICsgXCIgXCIgKyBzZWxlY3RvcjtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGFwcGx5U3RyaWN0U2VsZWN0b3JTY29wZTogZnVuY3Rpb24oc2VsZWN0b3IsIHNjb3BlU2VsZWN0b3IpIHtcbiAgICAgICAgc2NvcGVTZWxlY3RvciA9IHNjb3BlU2VsZWN0b3IucmVwbGFjZSgvXFxbaXM9KFteXFxdXSopXFxdL2csIFwiJDFcIik7XG4gICAgICAgIHZhciBzcGxpdHMgPSBbIFwiIFwiLCBcIj5cIiwgXCIrXCIsIFwiflwiIF0sIHNjb3BlZCA9IHNlbGVjdG9yLCBhdHRyTmFtZSA9IFwiW1wiICsgc2NvcGVTZWxlY3RvciArIFwiXVwiO1xuICAgICAgICBzcGxpdHMuZm9yRWFjaChmdW5jdGlvbihzZXApIHtcbiAgICAgICAgICB2YXIgcGFydHMgPSBzY29wZWQuc3BsaXQoc2VwKTtcbiAgICAgICAgICBzY29wZWQgPSBwYXJ0cy5tYXAoZnVuY3Rpb24ocCkge1xuICAgICAgICAgICAgdmFyIHQgPSBwLnRyaW0oKS5yZXBsYWNlKHBvbHlmaWxsSG9zdFJlLCBcIlwiKTtcbiAgICAgICAgICAgIGlmICh0ICYmIHNwbGl0cy5pbmRleE9mKHQpIDwgMCAmJiB0LmluZGV4T2YoYXR0ck5hbWUpIDwgMCkge1xuICAgICAgICAgICAgICBwID0gdC5yZXBsYWNlKC8oW146XSopKDoqKSguKikvLCBcIiQxXCIgKyBhdHRyTmFtZSArIFwiJDIkM1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICAgIH0pLmpvaW4oc2VwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzY29wZWQ7XG4gICAgICB9LFxuICAgICAgaW5zZXJ0UG9seWZpbGxIb3N0SW5Dc3NUZXh0OiBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gc2VsZWN0b3IucmVwbGFjZShjb2xvbkhvc3RDb250ZXh0UmUsIHBvbHlmaWxsSG9zdENvbnRleHQpLnJlcGxhY2UoY29sb25Ib3N0UmUsIHBvbHlmaWxsSG9zdCk7XG4gICAgICB9LFxuICAgICAgcHJvcGVydGllc0Zyb21SdWxlOiBmdW5jdGlvbihydWxlKSB7XG4gICAgICAgIHZhciBjc3NUZXh0ID0gcnVsZS5zdHlsZS5jc3NUZXh0O1xuICAgICAgICBpZiAocnVsZS5zdHlsZS5jb250ZW50ICYmICFydWxlLnN0eWxlLmNvbnRlbnQubWF0Y2goL1snXCJdK3xhdHRyLykpIHtcbiAgICAgICAgICBjc3NUZXh0ID0gY3NzVGV4dC5yZXBsYWNlKC9jb250ZW50OlteO10qOy9nLCBcImNvbnRlbnQ6ICdcIiArIHJ1bGUuc3R5bGUuY29udGVudCArIFwiJztcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0eWxlID0gcnVsZS5zdHlsZTtcbiAgICAgICAgZm9yICh2YXIgaSBpbiBzdHlsZSkge1xuICAgICAgICAgIGlmIChzdHlsZVtpXSA9PT0gXCJpbml0aWFsXCIpIHtcbiAgICAgICAgICAgIGNzc1RleHQgKz0gaSArIFwiOiBpbml0aWFsOyBcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNzc1RleHQ7XG4gICAgICB9LFxuICAgICAgcmVwbGFjZVRleHRJblN0eWxlczogZnVuY3Rpb24oc3R5bGVzLCBhY3Rpb24pIHtcbiAgICAgICAgaWYgKHN0eWxlcyAmJiBhY3Rpb24pIHtcbiAgICAgICAgICBpZiAoIShzdHlsZXMgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgIHN0eWxlcyA9IFsgc3R5bGVzIF07XG4gICAgICAgICAgfVxuICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoc3R5bGVzLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBzLnRleHRDb250ZW50ID0gYWN0aW9uLmNhbGwodGhpcywgcy50ZXh0Q29udGVudCk7XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBhZGRDc3NUb0RvY3VtZW50OiBmdW5jdGlvbihjc3NUZXh0LCBuYW1lKSB7XG4gICAgICAgIGlmIChjc3NUZXh0Lm1hdGNoKFwiQGltcG9ydFwiKSkge1xuICAgICAgICAgIGFkZE93blNoZWV0KGNzc1RleHQsIG5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFkZENzc1RvRG9jdW1lbnQoY3NzVGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBzZWxlY3RvclJlID0gLyhbXntdKikoe1tcXHNcXFNdKj99KS9naW0sIGNzc0NvbW1lbnRSZSA9IC9cXC9cXCpbXipdKlxcKisoW15cXC8qXVteKl0qXFwqKykqXFwvL2dpbSwgY3NzQ29tbWVudE5leHRTZWxlY3RvclJlID0gL1xcL1xcKlxccypAcG9seWZpbGwgKFteKl0qXFwqKyhbXlxcLypdW14qXSpcXCorKSpcXC8pKFtee10qPyl7L2dpbSwgY3NzQ29udGVudE5leHRTZWxlY3RvclJlID0gL3BvbHlmaWxsLW5leHQtc2VsZWN0b3JbXn1dKmNvbnRlbnRcXDpbXFxzXSo/WydcIl0oLio/KVsnXCJdWztcXHNdKn0oW157XSo/KXsvZ2ltLCBjc3NDb21tZW50UnVsZVJlID0gL1xcL1xcKlxcc0Bwb2x5ZmlsbC1ydWxlKFteKl0qXFwqKyhbXlxcLypdW14qXSpcXCorKSopXFwvL2dpbSwgY3NzQ29udGVudFJ1bGVSZSA9IC8ocG9seWZpbGwtcnVsZSlbXn1dKihjb250ZW50XFw6W1xcc10qWydcIl0oLio/KVsnXCJdKVs7XFxzXSpbXn1dKn0vZ2ltLCBjc3NDb21tZW50VW5zY29wZWRSdWxlUmUgPSAvXFwvXFwqXFxzQHBvbHlmaWxsLXVuc2NvcGVkLXJ1bGUoW14qXSpcXCorKFteXFwvKl1bXipdKlxcKispKilcXC8vZ2ltLCBjc3NDb250ZW50VW5zY29wZWRSdWxlUmUgPSAvKHBvbHlmaWxsLXVuc2NvcGVkLXJ1bGUpW159XSooY29udGVudFxcOltcXHNdKlsnXCJdKC4qPylbJ1wiXSlbO1xcc10qW159XSp9L2dpbSwgY3NzUHNldWRvUmUgPSAvOjooeC1bXlxcc3ssKF0qKS9naW0sIGNzc1BhcnRSZSA9IC86OnBhcnRcXCgoW14pXSopXFwpL2dpbSwgcG9seWZpbGxIb3N0ID0gXCItc2hhZG93Y3NzaG9zdFwiLCBwb2x5ZmlsbEhvc3RDb250ZXh0ID0gXCItc2hhZG93Y3NzY29udGV4dFwiLCBwYXJlblN1ZmZpeCA9IFwiKSg/OlxcXFwoKFwiICsgXCIoPzpcXFxcKFteKShdKlxcXFwpfFteKShdKikrP1wiICsgXCIpXFxcXCkpPyhbXix7XSopXCI7XG4gICAgdmFyIGNzc0NvbG9uSG9zdFJlID0gbmV3IFJlZ0V4cChcIihcIiArIHBvbHlmaWxsSG9zdCArIHBhcmVuU3VmZml4LCBcImdpbVwiKSwgY3NzQ29sb25Ib3N0Q29udGV4dFJlID0gbmV3IFJlZ0V4cChcIihcIiArIHBvbHlmaWxsSG9zdENvbnRleHQgKyBwYXJlblN1ZmZpeCwgXCJnaW1cIiksIHNlbGVjdG9yUmVTdWZmaXggPSBcIihbPlxcXFxzfitbLix7Ol1bXFxcXHNcXFxcU10qKT8kXCIsIGNvbG9uSG9zdFJlID0gL1xcOmhvc3QvZ2ltLCBjb2xvbkhvc3RDb250ZXh0UmUgPSAvXFw6aG9zdC1jb250ZXh0L2dpbSwgcG9seWZpbGxIb3N0Tm9Db21iaW5hdG9yID0gcG9seWZpbGxIb3N0ICsgXCItbm8tY29tYmluYXRvclwiLCBwb2x5ZmlsbEhvc3RSZSA9IG5ldyBSZWdFeHAocG9seWZpbGxIb3N0LCBcImdpbVwiKSwgcG9seWZpbGxIb3N0Q29udGV4dFJlID0gbmV3IFJlZ0V4cChwb2x5ZmlsbEhvc3RDb250ZXh0LCBcImdpbVwiKSwgc2hhZG93RE9NU2VsZWN0b3JzUmUgPSBbIC8+Pj4vZywgLzo6c2hhZG93L2csIC86OmNvbnRlbnQvZywgL1xcL2RlZXBcXC8vZywgL1xcL3NoYWRvd1xcLy9nLCAvXFwvc2hhZG93LWRlZXBcXC8vZywgL1xcXlxcXi9nLCAvXFxeL2cgXTtcbiAgICBmdW5jdGlvbiBzdHlsZXNUb0Nzc1RleHQoc3R5bGVzLCBwcmVzZXJ2ZUNvbW1lbnRzKSB7XG4gICAgICB2YXIgY3NzVGV4dCA9IFwiXCI7XG4gICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHN0eWxlcywgZnVuY3Rpb24ocykge1xuICAgICAgICBjc3NUZXh0ICs9IHMudGV4dENvbnRlbnQgKyBcIlxcblxcblwiO1xuICAgICAgfSk7XG4gICAgICBpZiAoIXByZXNlcnZlQ29tbWVudHMpIHtcbiAgICAgICAgY3NzVGV4dCA9IGNzc1RleHQucmVwbGFjZShjc3NDb21tZW50UmUsIFwiXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNzc1RleHQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNzc1RleHRUb1N0eWxlKGNzc1RleHQpIHtcbiAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gY3NzVGV4dDtcbiAgICAgIHJldHVybiBzdHlsZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY3NzVG9SdWxlcyhjc3NUZXh0KSB7XG4gICAgICB2YXIgc3R5bGUgPSBjc3NUZXh0VG9TdHlsZShjc3NUZXh0KTtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgdmFyIHJ1bGVzID0gW107XG4gICAgICBpZiAoc3R5bGUuc2hlZXQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBydWxlcyA9IHN0eWxlLnNoZWV0LmNzc1J1bGVzO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwic2hlZXQgbm90IGZvdW5kXCIsIHN0eWxlKTtcbiAgICAgIH1cbiAgICAgIHN0eWxlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc3R5bGUpO1xuICAgICAgcmV0dXJuIHJ1bGVzO1xuICAgIH1cbiAgICB2YXIgZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaWZyYW1lXCIpO1xuICAgIGZyYW1lLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICBmdW5jdGlvbiBpbml0RnJhbWUoKSB7XG4gICAgICBmcmFtZS5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGZyYW1lKTtcbiAgICAgIHZhciBkb2MgPSBmcmFtZS5jb250ZW50RG9jdW1lbnQ7XG4gICAgICB2YXIgYmFzZSA9IGRvYy5jcmVhdGVFbGVtZW50KFwiYmFzZVwiKTtcbiAgICAgIGJhc2UuaHJlZiA9IGRvY3VtZW50LmJhc2VVUkk7XG4gICAgICBkb2MuaGVhZC5hcHBlbmRDaGlsZChiYXNlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW5GcmFtZShmbikge1xuICAgICAgaWYgKCFmcmFtZS5pbml0aWFsaXplZCkge1xuICAgICAgICBpbml0RnJhbWUoKTtcbiAgICAgIH1cbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZnJhbWUpO1xuICAgICAgZm4oZnJhbWUuY29udGVudERvY3VtZW50KTtcbiAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZnJhbWUpO1xuICAgIH1cbiAgICB2YXIgaXNDaHJvbWUgPSBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKFwiQ2hyb21lXCIpO1xuICAgIGZ1bmN0aW9uIHdpdGhDc3NSdWxlcyhjc3NUZXh0LCBjYWxsYmFjaykge1xuICAgICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgcnVsZXM7XG4gICAgICBpZiAoY3NzVGV4dC5tYXRjaChcIkBpbXBvcnRcIikgJiYgaXNDaHJvbWUpIHtcbiAgICAgICAgdmFyIHN0eWxlID0gY3NzVGV4dFRvU3R5bGUoY3NzVGV4dCk7XG4gICAgICAgIGluRnJhbWUoZnVuY3Rpb24oZG9jKSB7XG4gICAgICAgICAgZG9jLmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUuaW1wbCk7XG4gICAgICAgICAgcnVsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChzdHlsZS5zaGVldC5jc3NSdWxlcywgMCk7XG4gICAgICAgICAgY2FsbGJhY2socnVsZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJ1bGVzID0gY3NzVG9SdWxlcyhjc3NUZXh0KTtcbiAgICAgICAgY2FsbGJhY2socnVsZXMpO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBydWxlc1RvQ3NzKGNzc1J1bGVzKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgY3NzID0gW107IGkgPCBjc3NSdWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjc3MucHVzaChjc3NSdWxlc1tpXS5jc3NUZXh0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjc3Muam9pbihcIlxcblxcblwiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkQ3NzVG9Eb2N1bWVudChjc3NUZXh0KSB7XG4gICAgICBpZiAoY3NzVGV4dCkge1xuICAgICAgICBnZXRTaGVldCgpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzc1RleHQpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkT3duU2hlZXQoY3NzVGV4dCwgbmFtZSkge1xuICAgICAgdmFyIHN0eWxlID0gY3NzVGV4dFRvU3R5bGUoY3NzVGV4dCk7XG4gICAgICBzdHlsZS5zZXRBdHRyaWJ1dGUobmFtZSwgXCJcIik7XG4gICAgICBzdHlsZS5zZXRBdHRyaWJ1dGUoU0hJTU1FRF9BVFRSSUJVVEUsIFwiXCIpO1xuICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgfVxuICAgIHZhciBTSElNX0FUVFJJQlVURSA9IFwic2hpbS1zaGFkb3dkb21cIjtcbiAgICB2YXIgU0hJTU1FRF9BVFRSSUJVVEUgPSBcInNoaW0tc2hhZG93ZG9tLWNzc1wiO1xuICAgIHZhciBOT19TSElNX0FUVFJJQlVURSA9IFwibm8tc2hpbVwiO1xuICAgIHZhciBzaGVldDtcbiAgICBmdW5jdGlvbiBnZXRTaGVldCgpIHtcbiAgICAgIGlmICghc2hlZXQpIHtcbiAgICAgICAgc2hlZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICAgIHNoZWV0LnNldEF0dHJpYnV0ZShTSElNTUVEX0FUVFJJQlVURSwgXCJcIik7XG4gICAgICAgIHNoZWV0W1NISU1NRURfQVRUUklCVVRFXSA9IHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2hlZXQ7XG4gICAgfVxuICAgIGlmICh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpIHtcbiAgICAgIGFkZENzc1RvRG9jdW1lbnQoXCJzdHlsZSB7IGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfVxcblwiKTtcbiAgICAgIHZhciBkb2MgPSBTaGFkb3dET01Qb2x5ZmlsbC53cmFwKGRvY3VtZW50KTtcbiAgICAgIHZhciBoZWFkID0gZG9jLnF1ZXJ5U2VsZWN0b3IoXCJoZWFkXCIpO1xuICAgICAgaGVhZC5pbnNlcnRCZWZvcmUoZ2V0U2hlZXQoKSwgaGVhZC5jaGlsZE5vZGVzWzBdKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdXJsUmVzb2x2ZXIgPSBzY29wZS51cmxSZXNvbHZlcjtcbiAgICAgICAgaWYgKHdpbmRvdy5IVE1MSW1wb3J0cyAmJiAhSFRNTEltcG9ydHMudXNlTmF0aXZlKSB7XG4gICAgICAgICAgdmFyIFNISU1fU0hFRVRfU0VMRUNUT1IgPSBcImxpbmtbcmVsPXN0eWxlc2hlZXRdXCIgKyBcIltcIiArIFNISU1fQVRUUklCVVRFICsgXCJdXCI7XG4gICAgICAgICAgdmFyIFNISU1fU1RZTEVfU0VMRUNUT1IgPSBcInN0eWxlW1wiICsgU0hJTV9BVFRSSUJVVEUgKyBcIl1cIjtcbiAgICAgICAgICBIVE1MSW1wb3J0cy5pbXBvcnRlci5kb2N1bWVudFByZWxvYWRTZWxlY3RvcnMgKz0gXCIsXCIgKyBTSElNX1NIRUVUX1NFTEVDVE9SO1xuICAgICAgICAgIEhUTUxJbXBvcnRzLmltcG9ydGVyLmltcG9ydHNQcmVsb2FkU2VsZWN0b3JzICs9IFwiLFwiICsgU0hJTV9TSEVFVF9TRUxFQ1RPUjtcbiAgICAgICAgICBIVE1MSW1wb3J0cy5wYXJzZXIuZG9jdW1lbnRTZWxlY3RvcnMgPSBbIEhUTUxJbXBvcnRzLnBhcnNlci5kb2N1bWVudFNlbGVjdG9ycywgU0hJTV9TSEVFVF9TRUxFQ1RPUiwgU0hJTV9TVFlMRV9TRUxFQ1RPUiBdLmpvaW4oXCIsXCIpO1xuICAgICAgICAgIHZhciBvcmlnaW5hbFBhcnNlR2VuZXJpYyA9IEhUTUxJbXBvcnRzLnBhcnNlci5wYXJzZUdlbmVyaWM7XG4gICAgICAgICAgSFRNTEltcG9ydHMucGFyc2VyLnBhcnNlR2VuZXJpYyA9IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgICAgICAgaWYgKGVsdFtTSElNTUVEX0FUVFJJQlVURV0pIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN0eWxlID0gZWx0Ll9faW1wb3J0RWxlbWVudCB8fCBlbHQ7XG4gICAgICAgICAgICBpZiAoIXN0eWxlLmhhc0F0dHJpYnV0ZShTSElNX0FUVFJJQlVURSkpIHtcbiAgICAgICAgICAgICAgb3JpZ2luYWxQYXJzZUdlbmVyaWMuY2FsbCh0aGlzLCBlbHQpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWx0Ll9fcmVzb3VyY2UpIHtcbiAgICAgICAgICAgICAgc3R5bGUgPSBlbHQub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gZWx0Ll9fcmVzb3VyY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBIVE1MSW1wb3J0cy5wYXRoLnJlc29sdmVVcmxzSW5TdHlsZShzdHlsZSwgZWx0LmhyZWYpO1xuICAgICAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSBTaGFkb3dDU1Muc2hpbVN0eWxlKHN0eWxlKTtcbiAgICAgICAgICAgIHN0eWxlLnJlbW92ZUF0dHJpYnV0ZShTSElNX0FUVFJJQlVURSwgXCJcIik7XG4gICAgICAgICAgICBzdHlsZS5zZXRBdHRyaWJ1dGUoU0hJTU1FRF9BVFRSSUJVVEUsIFwiXCIpO1xuICAgICAgICAgICAgc3R5bGVbU0hJTU1FRF9BVFRSSUJVVEVdID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChzdHlsZS5wYXJlbnROb2RlICE9PSBoZWFkKSB7XG4gICAgICAgICAgICAgIGlmIChlbHQucGFyZW50Tm9kZSA9PT0gaGVhZCkge1xuICAgICAgICAgICAgICAgIGhlYWQucmVwbGFjZUNoaWxkKHN0eWxlLCBlbHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvRG9jdW1lbnQoc3R5bGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHlsZS5fX2ltcG9ydFBhcnNlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLm1hcmtQYXJzaW5nQ29tcGxldGUoZWx0KTtcbiAgICAgICAgICAgIHRoaXMucGFyc2VOZXh0KCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICB2YXIgaGFzUmVzb3VyY2UgPSBIVE1MSW1wb3J0cy5wYXJzZXIuaGFzUmVzb3VyY2U7XG4gICAgICAgICAgSFRNTEltcG9ydHMucGFyc2VyLmhhc1Jlc291cmNlID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgaWYgKG5vZGUubG9jYWxOYW1lID09PSBcImxpbmtcIiAmJiBub2RlLnJlbCA9PT0gXCJzdHlsZXNoZWV0XCIgJiYgbm9kZS5oYXNBdHRyaWJ1dGUoU0hJTV9BVFRSSUJVVEUpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBub2RlLl9fcmVzb3VyY2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gaGFzUmVzb3VyY2UuY2FsbCh0aGlzLCBub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgc2NvcGUuU2hhZG93Q1NTID0gU2hhZG93Q1NTO1xuICB9KSh3aW5kb3cuV2ViQ29tcG9uZW50cyk7XG59XG5cbihmdW5jdGlvbihzY29wZSkge1xuICBpZiAod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKSB7XG4gICAgd2luZG93LndyYXAgPSBTaGFkb3dET01Qb2x5ZmlsbC53cmFwSWZOZWVkZWQ7XG4gICAgd2luZG93LnVud3JhcCA9IFNoYWRvd0RPTVBvbHlmaWxsLnVud3JhcElmTmVlZGVkO1xuICB9IGVsc2Uge1xuICAgIHdpbmRvdy53cmFwID0gd2luZG93LnVud3JhcCA9IGZ1bmN0aW9uKG4pIHtcbiAgICAgIHJldHVybiBuO1xuICAgIH07XG4gIH1cbn0pKHdpbmRvdy5XZWJDb21wb25lbnRzKTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgaGFzV29ya2luZ1VybCA9IGZhbHNlO1xuICBpZiAoIXNjb3BlLmZvcmNlSlVSTCkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgdSA9IG5ldyBVUkwoXCJiXCIsIFwiaHR0cDovL2FcIik7XG4gICAgICB1LnBhdGhuYW1lID0gXCJjJTIwZFwiO1xuICAgICAgaGFzV29ya2luZ1VybCA9IHUuaHJlZiA9PT0gXCJodHRwOi8vYS9jJTIwZFwiO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH1cbiAgaWYgKGhhc1dvcmtpbmdVcmwpIHJldHVybjtcbiAgdmFyIHJlbGF0aXZlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgcmVsYXRpdmVbXCJmdHBcIl0gPSAyMTtcbiAgcmVsYXRpdmVbXCJmaWxlXCJdID0gMDtcbiAgcmVsYXRpdmVbXCJnb3BoZXJcIl0gPSA3MDtcbiAgcmVsYXRpdmVbXCJodHRwXCJdID0gODA7XG4gIHJlbGF0aXZlW1wiaHR0cHNcIl0gPSA0NDM7XG4gIHJlbGF0aXZlW1wid3NcIl0gPSA4MDtcbiAgcmVsYXRpdmVbXCJ3c3NcIl0gPSA0NDM7XG4gIHZhciByZWxhdGl2ZVBhdGhEb3RNYXBwaW5nID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgcmVsYXRpdmVQYXRoRG90TWFwcGluZ1tcIiUyZVwiXSA9IFwiLlwiO1xuICByZWxhdGl2ZVBhdGhEb3RNYXBwaW5nW1wiLiUyZVwiXSA9IFwiLi5cIjtcbiAgcmVsYXRpdmVQYXRoRG90TWFwcGluZ1tcIiUyZS5cIl0gPSBcIi4uXCI7XG4gIHJlbGF0aXZlUGF0aERvdE1hcHBpbmdbXCIlMmUlMmVcIl0gPSBcIi4uXCI7XG4gIGZ1bmN0aW9uIGlzUmVsYXRpdmVTY2hlbWUoc2NoZW1lKSB7XG4gICAgcmV0dXJuIHJlbGF0aXZlW3NjaGVtZV0gIT09IHVuZGVmaW5lZDtcbiAgfVxuICBmdW5jdGlvbiBpbnZhbGlkKCkge1xuICAgIGNsZWFyLmNhbGwodGhpcyk7XG4gICAgdGhpcy5faXNJbnZhbGlkID0gdHJ1ZTtcbiAgfVxuICBmdW5jdGlvbiBJRE5BVG9BU0NJSShoKSB7XG4gICAgaWYgKFwiXCIgPT0gaCkge1xuICAgICAgaW52YWxpZC5jYWxsKHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gaC50b0xvd2VyQ2FzZSgpO1xuICB9XG4gIGZ1bmN0aW9uIHBlcmNlbnRFc2NhcGUoYykge1xuICAgIHZhciB1bmljb2RlID0gYy5jaGFyQ29kZUF0KDApO1xuICAgIGlmICh1bmljb2RlID4gMzIgJiYgdW5pY29kZSA8IDEyNyAmJiBbIDM0LCAzNSwgNjAsIDYyLCA2MywgOTYgXS5pbmRleE9mKHVuaWNvZGUpID09IC0xKSB7XG4gICAgICByZXR1cm4gYztcbiAgICB9XG4gICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChjKTtcbiAgfVxuICBmdW5jdGlvbiBwZXJjZW50RXNjYXBlUXVlcnkoYykge1xuICAgIHZhciB1bmljb2RlID0gYy5jaGFyQ29kZUF0KDApO1xuICAgIGlmICh1bmljb2RlID4gMzIgJiYgdW5pY29kZSA8IDEyNyAmJiBbIDM0LCAzNSwgNjAsIDYyLCA5NiBdLmluZGV4T2YodW5pY29kZSkgPT0gLTEpIHtcbiAgICAgIHJldHVybiBjO1xuICAgIH1cbiAgICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KGMpO1xuICB9XG4gIHZhciBFT0YgPSB1bmRlZmluZWQsIEFMUEhBID0gL1thLXpBLVpdLywgQUxQSEFOVU1FUklDID0gL1thLXpBLVowLTlcXCtcXC1cXC5dLztcbiAgZnVuY3Rpb24gcGFyc2UoaW5wdXQsIHN0YXRlT3ZlcnJpZGUsIGJhc2UpIHtcbiAgICBmdW5jdGlvbiBlcnIobWVzc2FnZSkge1xuICAgICAgZXJyb3JzLnB1c2gobWVzc2FnZSk7XG4gICAgfVxuICAgIHZhciBzdGF0ZSA9IHN0YXRlT3ZlcnJpZGUgfHwgXCJzY2hlbWUgc3RhcnRcIiwgY3Vyc29yID0gMCwgYnVmZmVyID0gXCJcIiwgc2VlbkF0ID0gZmFsc2UsIHNlZW5CcmFja2V0ID0gZmFsc2UsIGVycm9ycyA9IFtdO1xuICAgIGxvb3A6IHdoaWxlICgoaW5wdXRbY3Vyc29yIC0gMV0gIT0gRU9GIHx8IGN1cnNvciA9PSAwKSAmJiAhdGhpcy5faXNJbnZhbGlkKSB7XG4gICAgICB2YXIgYyA9IGlucHV0W2N1cnNvcl07XG4gICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgY2FzZSBcInNjaGVtZSBzdGFydFwiOlxuICAgICAgICBpZiAoYyAmJiBBTFBIQS50ZXN0KGMpKSB7XG4gICAgICAgICAgYnVmZmVyICs9IGMudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBzdGF0ZSA9IFwic2NoZW1lXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoIXN0YXRlT3ZlcnJpZGUpIHtcbiAgICAgICAgICBidWZmZXIgPSBcIlwiO1xuICAgICAgICAgIHN0YXRlID0gXCJubyBzY2hlbWVcIjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlcnIoXCJJbnZhbGlkIHNjaGVtZS5cIik7XG4gICAgICAgICAgYnJlYWsgbG9vcDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJzY2hlbWVcIjpcbiAgICAgICAgaWYgKGMgJiYgQUxQSEFOVU1FUklDLnRlc3QoYykpIHtcbiAgICAgICAgICBidWZmZXIgKz0gYy50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKFwiOlwiID09IGMpIHtcbiAgICAgICAgICB0aGlzLl9zY2hlbWUgPSBidWZmZXI7XG4gICAgICAgICAgYnVmZmVyID0gXCJcIjtcbiAgICAgICAgICBpZiAoc3RhdGVPdmVycmlkZSkge1xuICAgICAgICAgICAgYnJlYWsgbG9vcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzUmVsYXRpdmVTY2hlbWUodGhpcy5fc2NoZW1lKSkge1xuICAgICAgICAgICAgdGhpcy5faXNSZWxhdGl2ZSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChcImZpbGVcIiA9PSB0aGlzLl9zY2hlbWUpIHtcbiAgICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZVwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5faXNSZWxhdGl2ZSAmJiBiYXNlICYmIGJhc2UuX3NjaGVtZSA9PSB0aGlzLl9zY2hlbWUpIHtcbiAgICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZSBvciBhdXRob3JpdHlcIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2lzUmVsYXRpdmUpIHtcbiAgICAgICAgICAgIHN0YXRlID0gXCJhdXRob3JpdHkgZmlyc3Qgc2xhc2hcIjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdGUgPSBcInNjaGVtZSBkYXRhXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFzdGF0ZU92ZXJyaWRlKSB7XG4gICAgICAgICAgYnVmZmVyID0gXCJcIjtcbiAgICAgICAgICBjdXJzb3IgPSAwO1xuICAgICAgICAgIHN0YXRlID0gXCJubyBzY2hlbWVcIjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIGlmIChFT0YgPT0gYykge1xuICAgICAgICAgIGJyZWFrIGxvb3A7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyKFwiQ29kZSBwb2ludCBub3QgYWxsb3dlZCBpbiBzY2hlbWU6IFwiICsgYyk7XG4gICAgICAgICAgYnJlYWsgbG9vcDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJzY2hlbWUgZGF0YVwiOlxuICAgICAgICBpZiAoXCI/XCIgPT0gYykge1xuICAgICAgICAgIHRoaXMuX3F1ZXJ5ID0gXCI/XCI7XG4gICAgICAgICAgc3RhdGUgPSBcInF1ZXJ5XCI7XG4gICAgICAgIH0gZWxzZSBpZiAoXCIjXCIgPT0gYykge1xuICAgICAgICAgIHRoaXMuX2ZyYWdtZW50ID0gXCIjXCI7XG4gICAgICAgICAgc3RhdGUgPSBcImZyYWdtZW50XCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKEVPRiAhPSBjICYmIFwiXHRcIiAhPSBjICYmIFwiXFxuXCIgIT0gYyAmJiBcIlxcclwiICE9IGMpIHtcbiAgICAgICAgICAgIHRoaXMuX3NjaGVtZURhdGEgKz0gcGVyY2VudEVzY2FwZShjKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwibm8gc2NoZW1lXCI6XG4gICAgICAgIGlmICghYmFzZSB8fCAhaXNSZWxhdGl2ZVNjaGVtZShiYXNlLl9zY2hlbWUpKSB7XG4gICAgICAgICAgZXJyKFwiTWlzc2luZyBzY2hlbWUuXCIpO1xuICAgICAgICAgIGludmFsaWQuY2FsbCh0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmVcIjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJyZWxhdGl2ZSBvciBhdXRob3JpdHlcIjpcbiAgICAgICAgaWYgKFwiL1wiID09IGMgJiYgXCIvXCIgPT0gaW5wdXRbY3Vyc29yICsgMV0pIHtcbiAgICAgICAgICBzdGF0ZSA9IFwiYXV0aG9yaXR5IGlnbm9yZSBzbGFzaGVzXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyKFwiRXhwZWN0ZWQgLywgZ290OiBcIiArIGMpO1xuICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZVwiO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcInJlbGF0aXZlXCI6XG4gICAgICAgIHRoaXMuX2lzUmVsYXRpdmUgPSB0cnVlO1xuICAgICAgICBpZiAoXCJmaWxlXCIgIT0gdGhpcy5fc2NoZW1lKSB0aGlzLl9zY2hlbWUgPSBiYXNlLl9zY2hlbWU7XG4gICAgICAgIGlmIChFT0YgPT0gYykge1xuICAgICAgICAgIHRoaXMuX2hvc3QgPSBiYXNlLl9ob3N0O1xuICAgICAgICAgIHRoaXMuX3BvcnQgPSBiYXNlLl9wb3J0O1xuICAgICAgICAgIHRoaXMuX3BhdGggPSBiYXNlLl9wYXRoLnNsaWNlKCk7XG4gICAgICAgICAgdGhpcy5fcXVlcnkgPSBiYXNlLl9xdWVyeTtcbiAgICAgICAgICB0aGlzLl91c2VybmFtZSA9IGJhc2UuX3VzZXJuYW1lO1xuICAgICAgICAgIHRoaXMuX3Bhc3N3b3JkID0gYmFzZS5fcGFzc3dvcmQ7XG4gICAgICAgICAgYnJlYWsgbG9vcDtcbiAgICAgICAgfSBlbHNlIGlmIChcIi9cIiA9PSBjIHx8IFwiXFxcXFwiID09IGMpIHtcbiAgICAgICAgICBpZiAoXCJcXFxcXCIgPT0gYykgZXJyKFwiXFxcXCBpcyBhbiBpbnZhbGlkIGNvZGUgcG9pbnQuXCIpO1xuICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZSBzbGFzaFwiO1xuICAgICAgICB9IGVsc2UgaWYgKFwiP1wiID09IGMpIHtcbiAgICAgICAgICB0aGlzLl9ob3N0ID0gYmFzZS5faG9zdDtcbiAgICAgICAgICB0aGlzLl9wb3J0ID0gYmFzZS5fcG9ydDtcbiAgICAgICAgICB0aGlzLl9wYXRoID0gYmFzZS5fcGF0aC5zbGljZSgpO1xuICAgICAgICAgIHRoaXMuX3F1ZXJ5ID0gXCI/XCI7XG4gICAgICAgICAgdGhpcy5fdXNlcm5hbWUgPSBiYXNlLl91c2VybmFtZTtcbiAgICAgICAgICB0aGlzLl9wYXNzd29yZCA9IGJhc2UuX3Bhc3N3b3JkO1xuICAgICAgICAgIHN0YXRlID0gXCJxdWVyeVwiO1xuICAgICAgICB9IGVsc2UgaWYgKFwiI1wiID09IGMpIHtcbiAgICAgICAgICB0aGlzLl9ob3N0ID0gYmFzZS5faG9zdDtcbiAgICAgICAgICB0aGlzLl9wb3J0ID0gYmFzZS5fcG9ydDtcbiAgICAgICAgICB0aGlzLl9wYXRoID0gYmFzZS5fcGF0aC5zbGljZSgpO1xuICAgICAgICAgIHRoaXMuX3F1ZXJ5ID0gYmFzZS5fcXVlcnk7XG4gICAgICAgICAgdGhpcy5fZnJhZ21lbnQgPSBcIiNcIjtcbiAgICAgICAgICB0aGlzLl91c2VybmFtZSA9IGJhc2UuX3VzZXJuYW1lO1xuICAgICAgICAgIHRoaXMuX3Bhc3N3b3JkID0gYmFzZS5fcGFzc3dvcmQ7XG4gICAgICAgICAgc3RhdGUgPSBcImZyYWdtZW50XCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG5leHRDID0gaW5wdXRbY3Vyc29yICsgMV07XG4gICAgICAgICAgdmFyIG5leHROZXh0QyA9IGlucHV0W2N1cnNvciArIDJdO1xuICAgICAgICAgIGlmIChcImZpbGVcIiAhPSB0aGlzLl9zY2hlbWUgfHwgIUFMUEhBLnRlc3QoYykgfHwgbmV4dEMgIT0gXCI6XCIgJiYgbmV4dEMgIT0gXCJ8XCIgfHwgRU9GICE9IG5leHROZXh0QyAmJiBcIi9cIiAhPSBuZXh0TmV4dEMgJiYgXCJcXFxcXCIgIT0gbmV4dE5leHRDICYmIFwiP1wiICE9IG5leHROZXh0QyAmJiBcIiNcIiAhPSBuZXh0TmV4dEMpIHtcbiAgICAgICAgICAgIHRoaXMuX2hvc3QgPSBiYXNlLl9ob3N0O1xuICAgICAgICAgICAgdGhpcy5fcG9ydCA9IGJhc2UuX3BvcnQ7XG4gICAgICAgICAgICB0aGlzLl91c2VybmFtZSA9IGJhc2UuX3VzZXJuYW1lO1xuICAgICAgICAgICAgdGhpcy5fcGFzc3dvcmQgPSBiYXNlLl9wYXNzd29yZDtcbiAgICAgICAgICAgIHRoaXMuX3BhdGggPSBiYXNlLl9wYXRoLnNsaWNlKCk7XG4gICAgICAgICAgICB0aGlzLl9wYXRoLnBvcCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmUgcGF0aFwiO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcInJlbGF0aXZlIHNsYXNoXCI6XG4gICAgICAgIGlmIChcIi9cIiA9PSBjIHx8IFwiXFxcXFwiID09IGMpIHtcbiAgICAgICAgICBpZiAoXCJcXFxcXCIgPT0gYykge1xuICAgICAgICAgICAgZXJyKFwiXFxcXCBpcyBhbiBpbnZhbGlkIGNvZGUgcG9pbnQuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoXCJmaWxlXCIgPT0gdGhpcy5fc2NoZW1lKSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFwiZmlsZSBob3N0XCI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlID0gXCJhdXRob3JpdHkgaWdub3JlIHNsYXNoZXNcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKFwiZmlsZVwiICE9IHRoaXMuX3NjaGVtZSkge1xuICAgICAgICAgICAgdGhpcy5faG9zdCA9IGJhc2UuX2hvc3Q7XG4gICAgICAgICAgICB0aGlzLl9wb3J0ID0gYmFzZS5fcG9ydDtcbiAgICAgICAgICAgIHRoaXMuX3VzZXJuYW1lID0gYmFzZS5fdXNlcm5hbWU7XG4gICAgICAgICAgICB0aGlzLl9wYXNzd29yZCA9IGJhc2UuX3Bhc3N3b3JkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmUgcGF0aFwiO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcImF1dGhvcml0eSBmaXJzdCBzbGFzaFwiOlxuICAgICAgICBpZiAoXCIvXCIgPT0gYykge1xuICAgICAgICAgIHN0YXRlID0gXCJhdXRob3JpdHkgc2Vjb25kIHNsYXNoXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyKFwiRXhwZWN0ZWQgJy8nLCBnb3Q6IFwiICsgYyk7XG4gICAgICAgICAgc3RhdGUgPSBcImF1dGhvcml0eSBpZ25vcmUgc2xhc2hlc1wiO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcImF1dGhvcml0eSBzZWNvbmQgc2xhc2hcIjpcbiAgICAgICAgc3RhdGUgPSBcImF1dGhvcml0eSBpZ25vcmUgc2xhc2hlc1wiO1xuICAgICAgICBpZiAoXCIvXCIgIT0gYykge1xuICAgICAgICAgIGVycihcIkV4cGVjdGVkICcvJywgZ290OiBcIiArIGMpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcImF1dGhvcml0eSBpZ25vcmUgc2xhc2hlc1wiOlxuICAgICAgICBpZiAoXCIvXCIgIT0gYyAmJiBcIlxcXFxcIiAhPSBjKSB7XG4gICAgICAgICAgc3RhdGUgPSBcImF1dGhvcml0eVwiO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVycihcIkV4cGVjdGVkIGF1dGhvcml0eSwgZ290OiBcIiArIGMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcImF1dGhvcml0eVwiOlxuICAgICAgICBpZiAoXCJAXCIgPT0gYykge1xuICAgICAgICAgIGlmIChzZWVuQXQpIHtcbiAgICAgICAgICAgIGVycihcIkAgYWxyZWFkeSBzZWVuLlwiKTtcbiAgICAgICAgICAgIGJ1ZmZlciArPSBcIiU0MFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZWVuQXQgPSB0cnVlO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnVmZmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY3AgPSBidWZmZXJbaV07XG4gICAgICAgICAgICBpZiAoXCJcdFwiID09IGNwIHx8IFwiXFxuXCIgPT0gY3AgfHwgXCJcXHJcIiA9PSBjcCkge1xuICAgICAgICAgICAgICBlcnIoXCJJbnZhbGlkIHdoaXRlc3BhY2UgaW4gYXV0aG9yaXR5LlwiKTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXCI6XCIgPT0gY3AgJiYgbnVsbCA9PT0gdGhpcy5fcGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgdGhpcy5fcGFzc3dvcmQgPSBcIlwiO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0ZW1wQyA9IHBlcmNlbnRFc2NhcGUoY3ApO1xuICAgICAgICAgICAgbnVsbCAhPT0gdGhpcy5fcGFzc3dvcmQgPyB0aGlzLl9wYXNzd29yZCArPSB0ZW1wQyA6IHRoaXMuX3VzZXJuYW1lICs9IHRlbXBDO1xuICAgICAgICAgIH1cbiAgICAgICAgICBidWZmZXIgPSBcIlwiO1xuICAgICAgICB9IGVsc2UgaWYgKEVPRiA9PSBjIHx8IFwiL1wiID09IGMgfHwgXCJcXFxcXCIgPT0gYyB8fCBcIj9cIiA9PSBjIHx8IFwiI1wiID09IGMpIHtcbiAgICAgICAgICBjdXJzb3IgLT0gYnVmZmVyLmxlbmd0aDtcbiAgICAgICAgICBidWZmZXIgPSBcIlwiO1xuICAgICAgICAgIHN0YXRlID0gXCJob3N0XCI7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVmZmVyICs9IGM7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiZmlsZSBob3N0XCI6XG4gICAgICAgIGlmIChFT0YgPT0gYyB8fCBcIi9cIiA9PSBjIHx8IFwiXFxcXFwiID09IGMgfHwgXCI/XCIgPT0gYyB8fCBcIiNcIiA9PSBjKSB7XG4gICAgICAgICAgaWYgKGJ1ZmZlci5sZW5ndGggPT0gMiAmJiBBTFBIQS50ZXN0KGJ1ZmZlclswXSkgJiYgKGJ1ZmZlclsxXSA9PSBcIjpcIiB8fCBidWZmZXJbMV0gPT0gXCJ8XCIpKSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmUgcGF0aFwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYnVmZmVyLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmUgcGF0aCBzdGFydFwiO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9ob3N0ID0gSUROQVRvQVNDSUkuY2FsbCh0aGlzLCBidWZmZXIpO1xuICAgICAgICAgICAgYnVmZmVyID0gXCJcIjtcbiAgICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZSBwYXRoIHN0YXJ0XCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKFwiXHRcIiA9PSBjIHx8IFwiXFxuXCIgPT0gYyB8fCBcIlxcclwiID09IGMpIHtcbiAgICAgICAgICBlcnIoXCJJbnZhbGlkIHdoaXRlc3BhY2UgaW4gZmlsZSBob3N0LlwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBidWZmZXIgKz0gYztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJob3N0XCI6XG4gICAgICAgY2FzZSBcImhvc3RuYW1lXCI6XG4gICAgICAgIGlmIChcIjpcIiA9PSBjICYmICFzZWVuQnJhY2tldCkge1xuICAgICAgICAgIHRoaXMuX2hvc3QgPSBJRE5BVG9BU0NJSS5jYWxsKHRoaXMsIGJ1ZmZlcik7XG4gICAgICAgICAgYnVmZmVyID0gXCJcIjtcbiAgICAgICAgICBzdGF0ZSA9IFwicG9ydFwiO1xuICAgICAgICAgIGlmIChcImhvc3RuYW1lXCIgPT0gc3RhdGVPdmVycmlkZSkge1xuICAgICAgICAgICAgYnJlYWsgbG9vcDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoRU9GID09IGMgfHwgXCIvXCIgPT0gYyB8fCBcIlxcXFxcIiA9PSBjIHx8IFwiP1wiID09IGMgfHwgXCIjXCIgPT0gYykge1xuICAgICAgICAgIHRoaXMuX2hvc3QgPSBJRE5BVG9BU0NJSS5jYWxsKHRoaXMsIGJ1ZmZlcik7XG4gICAgICAgICAgYnVmZmVyID0gXCJcIjtcbiAgICAgICAgICBzdGF0ZSA9IFwicmVsYXRpdmUgcGF0aCBzdGFydFwiO1xuICAgICAgICAgIGlmIChzdGF0ZU92ZXJyaWRlKSB7XG4gICAgICAgICAgICBicmVhayBsb29wO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIGlmIChcIlx0XCIgIT0gYyAmJiBcIlxcblwiICE9IGMgJiYgXCJcXHJcIiAhPSBjKSB7XG4gICAgICAgICAgaWYgKFwiW1wiID09IGMpIHtcbiAgICAgICAgICAgIHNlZW5CcmFja2V0ID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFwiXVwiID09IGMpIHtcbiAgICAgICAgICAgIHNlZW5CcmFja2V0ID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJ1ZmZlciArPSBjO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVycihcIkludmFsaWQgY29kZSBwb2ludCBpbiBob3N0L2hvc3RuYW1lOiBcIiArIGMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcInBvcnRcIjpcbiAgICAgICAgaWYgKC9bMC05XS8udGVzdChjKSkge1xuICAgICAgICAgIGJ1ZmZlciArPSBjO1xuICAgICAgICB9IGVsc2UgaWYgKEVPRiA9PSBjIHx8IFwiL1wiID09IGMgfHwgXCJcXFxcXCIgPT0gYyB8fCBcIj9cIiA9PSBjIHx8IFwiI1wiID09IGMgfHwgc3RhdGVPdmVycmlkZSkge1xuICAgICAgICAgIGlmIChcIlwiICE9IGJ1ZmZlcikge1xuICAgICAgICAgICAgdmFyIHRlbXAgPSBwYXJzZUludChidWZmZXIsIDEwKTtcbiAgICAgICAgICAgIGlmICh0ZW1wICE9IHJlbGF0aXZlW3RoaXMuX3NjaGVtZV0pIHtcbiAgICAgICAgICAgICAgdGhpcy5fcG9ydCA9IHRlbXAgKyBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnVmZmVyID0gXCJcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0YXRlT3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIGJyZWFrIGxvb3A7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZSBwYXRoIHN0YXJ0XCI7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJcdFwiID09IGMgfHwgXCJcXG5cIiA9PSBjIHx8IFwiXFxyXCIgPT0gYykge1xuICAgICAgICAgIGVycihcIkludmFsaWQgY29kZSBwb2ludCBpbiBwb3J0OiBcIiArIGMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGludmFsaWQuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJyZWxhdGl2ZSBwYXRoIHN0YXJ0XCI6XG4gICAgICAgIGlmIChcIlxcXFxcIiA9PSBjKSBlcnIoXCInXFxcXCcgbm90IGFsbG93ZWQgaW4gcGF0aC5cIik7XG4gICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZSBwYXRoXCI7XG4gICAgICAgIGlmIChcIi9cIiAhPSBjICYmIFwiXFxcXFwiICE9IGMpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJyZWxhdGl2ZSBwYXRoXCI6XG4gICAgICAgIGlmIChFT0YgPT0gYyB8fCBcIi9cIiA9PSBjIHx8IFwiXFxcXFwiID09IGMgfHwgIXN0YXRlT3ZlcnJpZGUgJiYgKFwiP1wiID09IGMgfHwgXCIjXCIgPT0gYykpIHtcbiAgICAgICAgICBpZiAoXCJcXFxcXCIgPT0gYykge1xuICAgICAgICAgICAgZXJyKFwiXFxcXCBub3QgYWxsb3dlZCBpbiByZWxhdGl2ZSBwYXRoLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHRtcDtcbiAgICAgICAgICBpZiAodG1wID0gcmVsYXRpdmVQYXRoRG90TWFwcGluZ1tidWZmZXIudG9Mb3dlckNhc2UoKV0pIHtcbiAgICAgICAgICAgIGJ1ZmZlciA9IHRtcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKFwiLi5cIiA9PSBidWZmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3BhdGgucG9wKCk7XG4gICAgICAgICAgICBpZiAoXCIvXCIgIT0gYyAmJiBcIlxcXFxcIiAhPSBjKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3BhdGgucHVzaChcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKFwiLlwiID09IGJ1ZmZlciAmJiBcIi9cIiAhPSBjICYmIFwiXFxcXFwiICE9IGMpIHtcbiAgICAgICAgICAgIHRoaXMuX3BhdGgucHVzaChcIlwiKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFwiLlwiICE9IGJ1ZmZlcikge1xuICAgICAgICAgICAgaWYgKFwiZmlsZVwiID09IHRoaXMuX3NjaGVtZSAmJiB0aGlzLl9wYXRoLmxlbmd0aCA9PSAwICYmIGJ1ZmZlci5sZW5ndGggPT0gMiAmJiBBTFBIQS50ZXN0KGJ1ZmZlclswXSkgJiYgYnVmZmVyWzFdID09IFwifFwiKSB7XG4gICAgICAgICAgICAgIGJ1ZmZlciA9IGJ1ZmZlclswXSArIFwiOlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcGF0aC5wdXNoKGJ1ZmZlcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJ1ZmZlciA9IFwiXCI7XG4gICAgICAgICAgaWYgKFwiP1wiID09IGMpIHtcbiAgICAgICAgICAgIHRoaXMuX3F1ZXJ5ID0gXCI/XCI7XG4gICAgICAgICAgICBzdGF0ZSA9IFwicXVlcnlcIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKFwiI1wiID09IGMpIHtcbiAgICAgICAgICAgIHRoaXMuX2ZyYWdtZW50ID0gXCIjXCI7XG4gICAgICAgICAgICBzdGF0ZSA9IFwiZnJhZ21lbnRcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXCJcdFwiICE9IGMgJiYgXCJcXG5cIiAhPSBjICYmIFwiXFxyXCIgIT0gYykge1xuICAgICAgICAgIGJ1ZmZlciArPSBwZXJjZW50RXNjYXBlKGMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcInF1ZXJ5XCI6XG4gICAgICAgIGlmICghc3RhdGVPdmVycmlkZSAmJiBcIiNcIiA9PSBjKSB7XG4gICAgICAgICAgdGhpcy5fZnJhZ21lbnQgPSBcIiNcIjtcbiAgICAgICAgICBzdGF0ZSA9IFwiZnJhZ21lbnRcIjtcbiAgICAgICAgfSBlbHNlIGlmIChFT0YgIT0gYyAmJiBcIlx0XCIgIT0gYyAmJiBcIlxcblwiICE9IGMgJiYgXCJcXHJcIiAhPSBjKSB7XG4gICAgICAgICAgdGhpcy5fcXVlcnkgKz0gcGVyY2VudEVzY2FwZVF1ZXJ5KGMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcImZyYWdtZW50XCI6XG4gICAgICAgIGlmIChFT0YgIT0gYyAmJiBcIlx0XCIgIT0gYyAmJiBcIlxcblwiICE9IGMgJiYgXCJcXHJcIiAhPSBjKSB7XG4gICAgICAgICAgdGhpcy5fZnJhZ21lbnQgKz0gYztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGN1cnNvcisrO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICB0aGlzLl9zY2hlbWUgPSBcIlwiO1xuICAgIHRoaXMuX3NjaGVtZURhdGEgPSBcIlwiO1xuICAgIHRoaXMuX3VzZXJuYW1lID0gXCJcIjtcbiAgICB0aGlzLl9wYXNzd29yZCA9IG51bGw7XG4gICAgdGhpcy5faG9zdCA9IFwiXCI7XG4gICAgdGhpcy5fcG9ydCA9IFwiXCI7XG4gICAgdGhpcy5fcGF0aCA9IFtdO1xuICAgIHRoaXMuX3F1ZXJ5ID0gXCJcIjtcbiAgICB0aGlzLl9mcmFnbWVudCA9IFwiXCI7XG4gICAgdGhpcy5faXNJbnZhbGlkID0gZmFsc2U7XG4gICAgdGhpcy5faXNSZWxhdGl2ZSA9IGZhbHNlO1xuICB9XG4gIGZ1bmN0aW9uIGpVUkwodXJsLCBiYXNlKSB7XG4gICAgaWYgKGJhc2UgIT09IHVuZGVmaW5lZCAmJiAhKGJhc2UgaW5zdGFuY2VvZiBqVVJMKSkgYmFzZSA9IG5ldyBqVVJMKFN0cmluZyhiYXNlKSk7XG4gICAgdGhpcy5fdXJsID0gdXJsO1xuICAgIGNsZWFyLmNhbGwodGhpcyk7XG4gICAgdmFyIGlucHV0ID0gdXJsLnJlcGxhY2UoL15bIFxcdFxcclxcblxcZl0rfFsgXFx0XFxyXFxuXFxmXSskL2csIFwiXCIpO1xuICAgIHBhcnNlLmNhbGwodGhpcywgaW5wdXQsIG51bGwsIGJhc2UpO1xuICB9XG4gIGpVUkwucHJvdG90eXBlID0ge1xuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmhyZWY7XG4gICAgfSxcbiAgICBnZXQgaHJlZigpIHtcbiAgICAgIGlmICh0aGlzLl9pc0ludmFsaWQpIHJldHVybiB0aGlzLl91cmw7XG4gICAgICB2YXIgYXV0aG9yaXR5ID0gXCJcIjtcbiAgICAgIGlmIChcIlwiICE9IHRoaXMuX3VzZXJuYW1lIHx8IG51bGwgIT0gdGhpcy5fcGFzc3dvcmQpIHtcbiAgICAgICAgYXV0aG9yaXR5ID0gdGhpcy5fdXNlcm5hbWUgKyAobnVsbCAhPSB0aGlzLl9wYXNzd29yZCA/IFwiOlwiICsgdGhpcy5fcGFzc3dvcmQgOiBcIlwiKSArIFwiQFwiO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucHJvdG9jb2wgKyAodGhpcy5faXNSZWxhdGl2ZSA/IFwiLy9cIiArIGF1dGhvcml0eSArIHRoaXMuaG9zdCA6IFwiXCIpICsgdGhpcy5wYXRobmFtZSArIHRoaXMuX3F1ZXJ5ICsgdGhpcy5fZnJhZ21lbnQ7XG4gICAgfSxcbiAgICBzZXQgaHJlZihocmVmKSB7XG4gICAgICBjbGVhci5jYWxsKHRoaXMpO1xuICAgICAgcGFyc2UuY2FsbCh0aGlzLCBocmVmKTtcbiAgICB9LFxuICAgIGdldCBwcm90b2NvbCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zY2hlbWUgKyBcIjpcIjtcbiAgICB9LFxuICAgIHNldCBwcm90b2NvbChwcm90b2NvbCkge1xuICAgICAgaWYgKHRoaXMuX2lzSW52YWxpZCkgcmV0dXJuO1xuICAgICAgcGFyc2UuY2FsbCh0aGlzLCBwcm90b2NvbCArIFwiOlwiLCBcInNjaGVtZSBzdGFydFwiKTtcbiAgICB9LFxuICAgIGdldCBob3N0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2lzSW52YWxpZCA/IFwiXCIgOiB0aGlzLl9wb3J0ID8gdGhpcy5faG9zdCArIFwiOlwiICsgdGhpcy5fcG9ydCA6IHRoaXMuX2hvc3Q7XG4gICAgfSxcbiAgICBzZXQgaG9zdChob3N0KSB7XG4gICAgICBpZiAodGhpcy5faXNJbnZhbGlkIHx8ICF0aGlzLl9pc1JlbGF0aXZlKSByZXR1cm47XG4gICAgICBwYXJzZS5jYWxsKHRoaXMsIGhvc3QsIFwiaG9zdFwiKTtcbiAgICB9LFxuICAgIGdldCBob3N0bmFtZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9ob3N0O1xuICAgIH0sXG4gICAgc2V0IGhvc3RuYW1lKGhvc3RuYW1lKSB7XG4gICAgICBpZiAodGhpcy5faXNJbnZhbGlkIHx8ICF0aGlzLl9pc1JlbGF0aXZlKSByZXR1cm47XG4gICAgICBwYXJzZS5jYWxsKHRoaXMsIGhvc3RuYW1lLCBcImhvc3RuYW1lXCIpO1xuICAgIH0sXG4gICAgZ2V0IHBvcnQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcG9ydDtcbiAgICB9LFxuICAgIHNldCBwb3J0KHBvcnQpIHtcbiAgICAgIGlmICh0aGlzLl9pc0ludmFsaWQgfHwgIXRoaXMuX2lzUmVsYXRpdmUpIHJldHVybjtcbiAgICAgIHBhcnNlLmNhbGwodGhpcywgcG9ydCwgXCJwb3J0XCIpO1xuICAgIH0sXG4gICAgZ2V0IHBhdGhuYW1lKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2lzSW52YWxpZCA/IFwiXCIgOiB0aGlzLl9pc1JlbGF0aXZlID8gXCIvXCIgKyB0aGlzLl9wYXRoLmpvaW4oXCIvXCIpIDogdGhpcy5fc2NoZW1lRGF0YTtcbiAgICB9LFxuICAgIHNldCBwYXRobmFtZShwYXRobmFtZSkge1xuICAgICAgaWYgKHRoaXMuX2lzSW52YWxpZCB8fCAhdGhpcy5faXNSZWxhdGl2ZSkgcmV0dXJuO1xuICAgICAgdGhpcy5fcGF0aCA9IFtdO1xuICAgICAgcGFyc2UuY2FsbCh0aGlzLCBwYXRobmFtZSwgXCJyZWxhdGl2ZSBwYXRoIHN0YXJ0XCIpO1xuICAgIH0sXG4gICAgZ2V0IHNlYXJjaCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pc0ludmFsaWQgfHwgIXRoaXMuX3F1ZXJ5IHx8IFwiP1wiID09IHRoaXMuX3F1ZXJ5ID8gXCJcIiA6IHRoaXMuX3F1ZXJ5O1xuICAgIH0sXG4gICAgc2V0IHNlYXJjaChzZWFyY2gpIHtcbiAgICAgIGlmICh0aGlzLl9pc0ludmFsaWQgfHwgIXRoaXMuX2lzUmVsYXRpdmUpIHJldHVybjtcbiAgICAgIHRoaXMuX3F1ZXJ5ID0gXCI/XCI7XG4gICAgICBpZiAoXCI/XCIgPT0gc2VhcmNoWzBdKSBzZWFyY2ggPSBzZWFyY2guc2xpY2UoMSk7XG4gICAgICBwYXJzZS5jYWxsKHRoaXMsIHNlYXJjaCwgXCJxdWVyeVwiKTtcbiAgICB9LFxuICAgIGdldCBoYXNoKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2lzSW52YWxpZCB8fCAhdGhpcy5fZnJhZ21lbnQgfHwgXCIjXCIgPT0gdGhpcy5fZnJhZ21lbnQgPyBcIlwiIDogdGhpcy5fZnJhZ21lbnQ7XG4gICAgfSxcbiAgICBzZXQgaGFzaChoYXNoKSB7XG4gICAgICBpZiAodGhpcy5faXNJbnZhbGlkKSByZXR1cm47XG4gICAgICB0aGlzLl9mcmFnbWVudCA9IFwiI1wiO1xuICAgICAgaWYgKFwiI1wiID09IGhhc2hbMF0pIGhhc2ggPSBoYXNoLnNsaWNlKDEpO1xuICAgICAgcGFyc2UuY2FsbCh0aGlzLCBoYXNoLCBcImZyYWdtZW50XCIpO1xuICAgIH0sXG4gICAgZ2V0IG9yaWdpbigpIHtcbiAgICAgIHZhciBob3N0O1xuICAgICAgaWYgKHRoaXMuX2lzSW52YWxpZCB8fCAhdGhpcy5fc2NoZW1lKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgICAgc3dpdGNoICh0aGlzLl9zY2hlbWUpIHtcbiAgICAgICBjYXNlIFwiZGF0YVwiOlxuICAgICAgIGNhc2UgXCJmaWxlXCI6XG4gICAgICAgY2FzZSBcImphdmFzY3JpcHRcIjpcbiAgICAgICBjYXNlIFwibWFpbHRvXCI6XG4gICAgICAgIHJldHVybiBcIm51bGxcIjtcbiAgICAgIH1cbiAgICAgIGhvc3QgPSB0aGlzLmhvc3Q7XG4gICAgICBpZiAoIWhvc3QpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fc2NoZW1lICsgXCI6Ly9cIiArIGhvc3Q7XG4gICAgfVxuICB9O1xuICB2YXIgT3JpZ2luYWxVUkwgPSBzY29wZS5VUkw7XG4gIGlmIChPcmlnaW5hbFVSTCkge1xuICAgIGpVUkwuY3JlYXRlT2JqZWN0VVJMID0gZnVuY3Rpb24oYmxvYikge1xuICAgICAgcmV0dXJuIE9yaWdpbmFsVVJMLmNyZWF0ZU9iamVjdFVSTC5hcHBseShPcmlnaW5hbFVSTCwgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGpVUkwucmV2b2tlT2JqZWN0VVJMID0gZnVuY3Rpb24odXJsKSB7XG4gICAgICBPcmlnaW5hbFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcbiAgICB9O1xuICB9XG4gIHNjb3BlLlVSTCA9IGpVUkw7XG59KShzZWxmKTtcblxuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICBpZiAoZ2xvYmFsLkpzTXV0YXRpb25PYnNlcnZlcikge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgcmVnaXN0cmF0aW9uc1RhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgdmFyIHNldEltbWVkaWF0ZTtcbiAgaWYgKC9UcmlkZW50fEVkZ2UvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICBzZXRJbW1lZGlhdGUgPSBzZXRUaW1lb3V0O1xuICB9IGVsc2UgaWYgKHdpbmRvdy5zZXRJbW1lZGlhdGUpIHtcbiAgICBzZXRJbW1lZGlhdGUgPSB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICB9IGVsc2Uge1xuICAgIHZhciBzZXRJbW1lZGlhdGVRdWV1ZSA9IFtdO1xuICAgIHZhciBzZW50aW5lbCA9IFN0cmluZyhNYXRoLnJhbmRvbSgpKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGUuZGF0YSA9PT0gc2VudGluZWwpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gc2V0SW1tZWRpYXRlUXVldWU7XG4gICAgICAgIHNldEltbWVkaWF0ZVF1ZXVlID0gW107XG4gICAgICAgIHF1ZXVlLmZvckVhY2goZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgIGZ1bmMoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgc2V0SW1tZWRpYXRlID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgc2V0SW1tZWRpYXRlUXVldWUucHVzaChmdW5jKTtcbiAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZShzZW50aW5lbCwgXCIqXCIpO1xuICAgIH07XG4gIH1cbiAgdmFyIGlzU2NoZWR1bGVkID0gZmFsc2U7XG4gIHZhciBzY2hlZHVsZWRPYnNlcnZlcnMgPSBbXTtcbiAgZnVuY3Rpb24gc2NoZWR1bGVDYWxsYmFjayhvYnNlcnZlcikge1xuICAgIHNjaGVkdWxlZE9ic2VydmVycy5wdXNoKG9ic2VydmVyKTtcbiAgICBpZiAoIWlzU2NoZWR1bGVkKSB7XG4gICAgICBpc1NjaGVkdWxlZCA9IHRydWU7XG4gICAgICBzZXRJbW1lZGlhdGUoZGlzcGF0Y2hDYWxsYmFja3MpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB3cmFwSWZOZWVkZWQobm9kZSkge1xuICAgIHJldHVybiB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwgJiYgd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsLndyYXBJZk5lZWRlZChub2RlKSB8fCBub2RlO1xuICB9XG4gIGZ1bmN0aW9uIGRpc3BhdGNoQ2FsbGJhY2tzKCkge1xuICAgIGlzU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgdmFyIG9ic2VydmVycyA9IHNjaGVkdWxlZE9ic2VydmVycztcbiAgICBzY2hlZHVsZWRPYnNlcnZlcnMgPSBbXTtcbiAgICBvYnNlcnZlcnMuc29ydChmdW5jdGlvbihvMSwgbzIpIHtcbiAgICAgIHJldHVybiBvMS51aWRfIC0gbzIudWlkXztcbiAgICB9KTtcbiAgICB2YXIgYW55Tm9uRW1wdHkgPSBmYWxzZTtcbiAgICBvYnNlcnZlcnMuZm9yRWFjaChmdW5jdGlvbihvYnNlcnZlcikge1xuICAgICAgdmFyIHF1ZXVlID0gb2JzZXJ2ZXIudGFrZVJlY29yZHMoKTtcbiAgICAgIHJlbW92ZVRyYW5zaWVudE9ic2VydmVyc0ZvcihvYnNlcnZlcik7XG4gICAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIG9ic2VydmVyLmNhbGxiYWNrXyhxdWV1ZSwgb2JzZXJ2ZXIpO1xuICAgICAgICBhbnlOb25FbXB0eSA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKGFueU5vbkVtcHR5KSBkaXNwYXRjaENhbGxiYWNrcygpO1xuICB9XG4gIGZ1bmN0aW9uIHJlbW92ZVRyYW5zaWVudE9ic2VydmVyc0ZvcihvYnNlcnZlcikge1xuICAgIG9ic2VydmVyLm5vZGVzXy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgIGlmICghcmVnaXN0cmF0aW9ucykgcmV0dXJuO1xuICAgICAgcmVnaXN0cmF0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHJlZ2lzdHJhdGlvbikge1xuICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9ic2VydmVyID09PSBvYnNlcnZlcikgcmVnaXN0cmF0aW9uLnJlbW92ZVRyYW5zaWVudE9ic2VydmVycygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gZm9yRWFjaEFuY2VzdG9yQW5kT2JzZXJ2ZXJFbnF1ZXVlUmVjb3JkKHRhcmdldCwgY2FsbGJhY2spIHtcbiAgICBmb3IgKHZhciBub2RlID0gdGFyZ2V0OyBub2RlOyBub2RlID0gbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICBpZiAocmVnaXN0cmF0aW9ucykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tqXTtcbiAgICAgICAgICB2YXIgb3B0aW9ucyA9IHJlZ2lzdHJhdGlvbi5vcHRpb25zO1xuICAgICAgICAgIGlmIChub2RlICE9PSB0YXJnZXQgJiYgIW9wdGlvbnMuc3VidHJlZSkgY29udGludWU7XG4gICAgICAgICAgdmFyIHJlY29yZCA9IGNhbGxiYWNrKG9wdGlvbnMpO1xuICAgICAgICAgIGlmIChyZWNvcmQpIHJlZ2lzdHJhdGlvbi5lbnF1ZXVlKHJlY29yZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdmFyIHVpZENvdW50ZXIgPSAwO1xuICBmdW5jdGlvbiBKc011dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spIHtcbiAgICB0aGlzLmNhbGxiYWNrXyA9IGNhbGxiYWNrO1xuICAgIHRoaXMubm9kZXNfID0gW107XG4gICAgdGhpcy5yZWNvcmRzXyA9IFtdO1xuICAgIHRoaXMudWlkXyA9ICsrdWlkQ291bnRlcjtcbiAgfVxuICBKc011dGF0aW9uT2JzZXJ2ZXIucHJvdG90eXBlID0ge1xuICAgIG9ic2VydmU6IGZ1bmN0aW9uKHRhcmdldCwgb3B0aW9ucykge1xuICAgICAgdGFyZ2V0ID0gd3JhcElmTmVlZGVkKHRhcmdldCk7XG4gICAgICBpZiAoIW9wdGlvbnMuY2hpbGRMaXN0ICYmICFvcHRpb25zLmF0dHJpYnV0ZXMgJiYgIW9wdGlvbnMuY2hhcmFjdGVyRGF0YSB8fCBvcHRpb25zLmF0dHJpYnV0ZU9sZFZhbHVlICYmICFvcHRpb25zLmF0dHJpYnV0ZXMgfHwgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIgJiYgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIubGVuZ3RoICYmICFvcHRpb25zLmF0dHJpYnV0ZXMgfHwgb3B0aW9ucy5jaGFyYWN0ZXJEYXRhT2xkVmFsdWUgJiYgIW9wdGlvbnMuY2hhcmFjdGVyRGF0YSkge1xuICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoKTtcbiAgICAgIH1cbiAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldCh0YXJnZXQpO1xuICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSByZWdpc3RyYXRpb25zVGFibGUuc2V0KHRhcmdldCwgcmVnaXN0cmF0aW9ucyA9IFtdKTtcbiAgICAgIHZhciByZWdpc3RyYXRpb247XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbnNbaV0ub2JzZXJ2ZXIgPT09IHRoaXMpIHtcbiAgICAgICAgICByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2ldO1xuICAgICAgICAgIHJlZ2lzdHJhdGlvbi5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICAgICAgICByZWdpc3RyYXRpb24ub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghcmVnaXN0cmF0aW9uKSB7XG4gICAgICAgIHJlZ2lzdHJhdGlvbiA9IG5ldyBSZWdpc3RyYXRpb24odGhpcywgdGFyZ2V0LCBvcHRpb25zKTtcbiAgICAgICAgcmVnaXN0cmF0aW9ucy5wdXNoKHJlZ2lzdHJhdGlvbik7XG4gICAgICAgIHRoaXMubm9kZXNfLnB1c2godGFyZ2V0KTtcbiAgICAgIH1cbiAgICAgIHJlZ2lzdHJhdGlvbi5hZGRMaXN0ZW5lcnMoKTtcbiAgICB9LFxuICAgIGRpc2Nvbm5lY3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5ub2Rlc18uZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbaV07XG4gICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbi5vYnNlcnZlciA9PT0gdGhpcykge1xuICAgICAgICAgICAgcmVnaXN0cmF0aW9uLnJlbW92ZUxpc3RlbmVycygpO1xuICAgICAgICAgICAgcmVnaXN0cmF0aW9ucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMpO1xuICAgICAgdGhpcy5yZWNvcmRzXyA9IFtdO1xuICAgIH0sXG4gICAgdGFrZVJlY29yZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNvcHlPZlJlY29yZHMgPSB0aGlzLnJlY29yZHNfO1xuICAgICAgdGhpcy5yZWNvcmRzXyA9IFtdO1xuICAgICAgcmV0dXJuIGNvcHlPZlJlY29yZHM7XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBNdXRhdGlvblJlY29yZCh0eXBlLCB0YXJnZXQpIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIHRoaXMuYWRkZWROb2RlcyA9IFtdO1xuICAgIHRoaXMucmVtb3ZlZE5vZGVzID0gW107XG4gICAgdGhpcy5wcmV2aW91c1NpYmxpbmcgPSBudWxsO1xuICAgIHRoaXMubmV4dFNpYmxpbmcgPSBudWxsO1xuICAgIHRoaXMuYXR0cmlidXRlTmFtZSA9IG51bGw7XG4gICAgdGhpcy5hdHRyaWJ1dGVOYW1lc3BhY2UgPSBudWxsO1xuICAgIHRoaXMub2xkVmFsdWUgPSBudWxsO1xuICB9XG4gIGZ1bmN0aW9uIGNvcHlNdXRhdGlvblJlY29yZChvcmlnaW5hbCkge1xuICAgIHZhciByZWNvcmQgPSBuZXcgTXV0YXRpb25SZWNvcmQob3JpZ2luYWwudHlwZSwgb3JpZ2luYWwudGFyZ2V0KTtcbiAgICByZWNvcmQuYWRkZWROb2RlcyA9IG9yaWdpbmFsLmFkZGVkTm9kZXMuc2xpY2UoKTtcbiAgICByZWNvcmQucmVtb3ZlZE5vZGVzID0gb3JpZ2luYWwucmVtb3ZlZE5vZGVzLnNsaWNlKCk7XG4gICAgcmVjb3JkLnByZXZpb3VzU2libGluZyA9IG9yaWdpbmFsLnByZXZpb3VzU2libGluZztcbiAgICByZWNvcmQubmV4dFNpYmxpbmcgPSBvcmlnaW5hbC5uZXh0U2libGluZztcbiAgICByZWNvcmQuYXR0cmlidXRlTmFtZSA9IG9yaWdpbmFsLmF0dHJpYnV0ZU5hbWU7XG4gICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWVzcGFjZSA9IG9yaWdpbmFsLmF0dHJpYnV0ZU5hbWVzcGFjZTtcbiAgICByZWNvcmQub2xkVmFsdWUgPSBvcmlnaW5hbC5vbGRWYWx1ZTtcbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG4gIHZhciBjdXJyZW50UmVjb3JkLCByZWNvcmRXaXRoT2xkVmFsdWU7XG4gIGZ1bmN0aW9uIGdldFJlY29yZCh0eXBlLCB0YXJnZXQpIHtcbiAgICByZXR1cm4gY3VycmVudFJlY29yZCA9IG5ldyBNdXRhdGlvblJlY29yZCh0eXBlLCB0YXJnZXQpO1xuICB9XG4gIGZ1bmN0aW9uIGdldFJlY29yZFdpdGhPbGRWYWx1ZShvbGRWYWx1ZSkge1xuICAgIGlmIChyZWNvcmRXaXRoT2xkVmFsdWUpIHJldHVybiByZWNvcmRXaXRoT2xkVmFsdWU7XG4gICAgcmVjb3JkV2l0aE9sZFZhbHVlID0gY29weU11dGF0aW9uUmVjb3JkKGN1cnJlbnRSZWNvcmQpO1xuICAgIHJlY29yZFdpdGhPbGRWYWx1ZS5vbGRWYWx1ZSA9IG9sZFZhbHVlO1xuICAgIHJldHVybiByZWNvcmRXaXRoT2xkVmFsdWU7XG4gIH1cbiAgZnVuY3Rpb24gY2xlYXJSZWNvcmRzKCkge1xuICAgIGN1cnJlbnRSZWNvcmQgPSByZWNvcmRXaXRoT2xkVmFsdWUgPSB1bmRlZmluZWQ7XG4gIH1cbiAgZnVuY3Rpb24gcmVjb3JkUmVwcmVzZW50c0N1cnJlbnRNdXRhdGlvbihyZWNvcmQpIHtcbiAgICByZXR1cm4gcmVjb3JkID09PSByZWNvcmRXaXRoT2xkVmFsdWUgfHwgcmVjb3JkID09PSBjdXJyZW50UmVjb3JkO1xuICB9XG4gIGZ1bmN0aW9uIHNlbGVjdFJlY29yZChsYXN0UmVjb3JkLCBuZXdSZWNvcmQpIHtcbiAgICBpZiAobGFzdFJlY29yZCA9PT0gbmV3UmVjb3JkKSByZXR1cm4gbGFzdFJlY29yZDtcbiAgICBpZiAocmVjb3JkV2l0aE9sZFZhbHVlICYmIHJlY29yZFJlcHJlc2VudHNDdXJyZW50TXV0YXRpb24obGFzdFJlY29yZCkpIHJldHVybiByZWNvcmRXaXRoT2xkVmFsdWU7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZnVuY3Rpb24gUmVnaXN0cmF0aW9uKG9ic2VydmVyLCB0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9ic2VydmVyID0gb2JzZXJ2ZXI7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXMgPSBbXTtcbiAgfVxuICBSZWdpc3RyYXRpb24ucHJvdG90eXBlID0ge1xuICAgIGVucXVldWU6IGZ1bmN0aW9uKHJlY29yZCkge1xuICAgICAgdmFyIHJlY29yZHMgPSB0aGlzLm9ic2VydmVyLnJlY29yZHNfO1xuICAgICAgdmFyIGxlbmd0aCA9IHJlY29yZHMubGVuZ3RoO1xuICAgICAgaWYgKHJlY29yZHMubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgbGFzdFJlY29yZCA9IHJlY29yZHNbbGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciByZWNvcmRUb1JlcGxhY2VMYXN0ID0gc2VsZWN0UmVjb3JkKGxhc3RSZWNvcmQsIHJlY29yZCk7XG4gICAgICAgIGlmIChyZWNvcmRUb1JlcGxhY2VMYXN0KSB7XG4gICAgICAgICAgcmVjb3Jkc1tsZW5ndGggLSAxXSA9IHJlY29yZFRvUmVwbGFjZUxhc3Q7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlZHVsZUNhbGxiYWNrKHRoaXMub2JzZXJ2ZXIpO1xuICAgICAgfVxuICAgICAgcmVjb3Jkc1tsZW5ndGhdID0gcmVjb3JkO1xuICAgIH0sXG4gICAgYWRkTGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXJzXyh0aGlzLnRhcmdldCk7XG4gICAgfSxcbiAgICBhZGRMaXN0ZW5lcnNfOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZXMpIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUF0dHJNb2RpZmllZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoYXJhY3RlckRhdGEpIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNoYXJhY3RlckRhdGFNb2RpZmllZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoaWxkTGlzdCkgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiRE9NTm9kZUluc2VydGVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hpbGRMaXN0IHx8IG9wdGlvbnMuc3VidHJlZSkgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiRE9NTm9kZVJlbW92ZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgfSxcbiAgICByZW1vdmVMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnNfKHRoaXMudGFyZ2V0KTtcbiAgICB9LFxuICAgIHJlbW92ZUxpc3RlbmVyc186IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlcykgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NQXR0ck1vZGlmaWVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hhcmFjdGVyRGF0YSkgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NQ2hhcmFjdGVyRGF0YU1vZGlmaWVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hpbGRMaXN0KSBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01Ob2RlSW5zZXJ0ZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QgfHwgb3B0aW9ucy5zdWJ0cmVlKSBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01Ob2RlUmVtb3ZlZFwiLCB0aGlzLCB0cnVlKTtcbiAgICB9LFxuICAgIGFkZFRyYW5zaWVudE9ic2VydmVyOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICBpZiAobm9kZSA9PT0gdGhpcy50YXJnZXQpIHJldHVybjtcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXJzXyhub2RlKTtcbiAgICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSByZWdpc3RyYXRpb25zVGFibGUuc2V0KG5vZGUsIHJlZ2lzdHJhdGlvbnMgPSBbXSk7XG4gICAgICByZWdpc3RyYXRpb25zLnB1c2godGhpcyk7XG4gICAgfSxcbiAgICByZW1vdmVUcmFuc2llbnRPYnNlcnZlcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRyYW5zaWVudE9ic2VydmVkTm9kZXMgPSB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXM7XG4gICAgICB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXMgPSBbXTtcbiAgICAgIHRyYW5zaWVudE9ic2VydmVkTm9kZXMuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzXyhub2RlKTtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uc1tpXSA9PT0gdGhpcykge1xuICAgICAgICAgICAgcmVnaXN0cmF0aW9ucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG4gICAgaGFuZGxlRXZlbnQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgIGNhc2UgXCJET01BdHRyTW9kaWZpZWRcIjpcbiAgICAgICAgdmFyIG5hbWUgPSBlLmF0dHJOYW1lO1xuICAgICAgICB2YXIgbmFtZXNwYWNlID0gZS5yZWxhdGVkTm9kZS5uYW1lc3BhY2VVUkk7XG4gICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgdmFyIHJlY29yZCA9IG5ldyBnZXRSZWNvcmQoXCJhdHRyaWJ1dGVzXCIsIHRhcmdldCk7XG4gICAgICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lID0gbmFtZTtcbiAgICAgICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gZS5hdHRyQ2hhbmdlID09PSBNdXRhdGlvbkV2ZW50LkFERElUSU9OID8gbnVsbCA6IGUucHJldlZhbHVlO1xuICAgICAgICBmb3JFYWNoQW5jZXN0b3JBbmRPYnNlcnZlckVucXVldWVSZWNvcmQodGFyZ2V0LCBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKCFvcHRpb25zLmF0dHJpYnV0ZXMpIHJldHVybjtcbiAgICAgICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIgJiYgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIubGVuZ3RoICYmIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyLmluZGV4T2YobmFtZSkgPT09IC0xICYmIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyLmluZGV4T2YobmFtZXNwYWNlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlT2xkVmFsdWUpIHJldHVybiBnZXRSZWNvcmRXaXRoT2xkVmFsdWUob2xkVmFsdWUpO1xuICAgICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICAgIH0pO1xuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJET01DaGFyYWN0ZXJEYXRhTW9kaWZpZWRcIjpcbiAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICB2YXIgcmVjb3JkID0gZ2V0UmVjb3JkKFwiY2hhcmFjdGVyRGF0YVwiLCB0YXJnZXQpO1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSBlLnByZXZWYWx1ZTtcbiAgICAgICAgZm9yRWFjaEFuY2VzdG9yQW5kT2JzZXJ2ZXJFbnF1ZXVlUmVjb3JkKHRhcmdldCwgZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAgIGlmICghb3B0aW9ucy5jaGFyYWN0ZXJEYXRhKSByZXR1cm47XG4gICAgICAgICAgaWYgKG9wdGlvbnMuY2hhcmFjdGVyRGF0YU9sZFZhbHVlKSByZXR1cm4gZ2V0UmVjb3JkV2l0aE9sZFZhbHVlKG9sZFZhbHVlKTtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkO1xuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiRE9NTm9kZVJlbW92ZWRcIjpcbiAgICAgICAgdGhpcy5hZGRUcmFuc2llbnRPYnNlcnZlcihlLnRhcmdldCk7XG5cbiAgICAgICBjYXNlIFwiRE9NTm9kZUluc2VydGVkXCI6XG4gICAgICAgIHZhciBjaGFuZ2VkTm9kZSA9IGUudGFyZ2V0O1xuICAgICAgICB2YXIgYWRkZWROb2RlcywgcmVtb3ZlZE5vZGVzO1xuICAgICAgICBpZiAoZS50eXBlID09PSBcIkRPTU5vZGVJbnNlcnRlZFwiKSB7XG4gICAgICAgICAgYWRkZWROb2RlcyA9IFsgY2hhbmdlZE5vZGUgXTtcbiAgICAgICAgICByZW1vdmVkTm9kZXMgPSBbXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhZGRlZE5vZGVzID0gW107XG4gICAgICAgICAgcmVtb3ZlZE5vZGVzID0gWyBjaGFuZ2VkTm9kZSBdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcmV2aW91c1NpYmxpbmcgPSBjaGFuZ2VkTm9kZS5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgIHZhciBuZXh0U2libGluZyA9IGNoYW5nZWROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgICB2YXIgcmVjb3JkID0gZ2V0UmVjb3JkKFwiY2hpbGRMaXN0XCIsIGUudGFyZ2V0LnBhcmVudE5vZGUpO1xuICAgICAgICByZWNvcmQuYWRkZWROb2RlcyA9IGFkZGVkTm9kZXM7XG4gICAgICAgIHJlY29yZC5yZW1vdmVkTm9kZXMgPSByZW1vdmVkTm9kZXM7XG4gICAgICAgIHJlY29yZC5wcmV2aW91c1NpYmxpbmcgPSBwcmV2aW91c1NpYmxpbmc7XG4gICAgICAgIHJlY29yZC5uZXh0U2libGluZyA9IG5leHRTaWJsaW5nO1xuICAgICAgICBmb3JFYWNoQW5jZXN0b3JBbmRPYnNlcnZlckVucXVldWVSZWNvcmQoZS5yZWxhdGVkTm9kZSwgZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAgIGlmICghb3B0aW9ucy5jaGlsZExpc3QpIHJldHVybjtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNsZWFyUmVjb3JkcygpO1xuICAgIH1cbiAgfTtcbiAgZ2xvYmFsLkpzTXV0YXRpb25PYnNlcnZlciA9IEpzTXV0YXRpb25PYnNlcnZlcjtcbiAgaWYgKCFnbG9iYWwuTXV0YXRpb25PYnNlcnZlcikge1xuICAgIGdsb2JhbC5NdXRhdGlvbk9ic2VydmVyID0gSnNNdXRhdGlvbk9ic2VydmVyO1xuICAgIEpzTXV0YXRpb25PYnNlcnZlci5faXNQb2x5ZmlsbGVkID0gdHJ1ZTtcbiAgfVxufSkoc2VsZik7XG5cbihmdW5jdGlvbihzY29wZSkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgaWYgKCF3aW5kb3cucGVyZm9ybWFuY2UpIHtcbiAgICB2YXIgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHdpbmRvdy5wZXJmb3JtYW5jZSA9IHtcbiAgICAgIG5vdzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBEYXRlLm5vdygpIC0gc3RhcnQ7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBpZiAoIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbmF0aXZlUmFmID0gd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICAgICAgcmV0dXJuIG5hdGl2ZVJhZiA/IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBuYXRpdmVSYWYoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgY2FsbGJhY2socGVyZm9ybWFuY2Uubm93KCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0gOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDFlMyAvIDYwKTtcbiAgICAgIH07XG4gICAgfSgpO1xuICB9XG4gIGlmICghd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZSB8fCBmdW5jdGlvbihpZCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaWQpO1xuICAgICAgfTtcbiAgICB9KCk7XG4gIH1cbiAgdmFyIHdvcmtpbmdEZWZhdWx0UHJldmVudGVkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkV2ZW50XCIpO1xuICAgIGUuaW5pdEV2ZW50KFwiZm9vXCIsIHRydWUsIHRydWUpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICByZXR1cm4gZS5kZWZhdWx0UHJldmVudGVkO1xuICB9KCk7XG4gIGlmICghd29ya2luZ0RlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICB2YXIgb3JpZ1ByZXZlbnREZWZhdWx0ID0gRXZlbnQucHJvdG90eXBlLnByZXZlbnREZWZhdWx0O1xuICAgIEV2ZW50LnByb3RvdHlwZS5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLmNhbmNlbGFibGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgb3JpZ1ByZXZlbnREZWZhdWx0LmNhbGwodGhpcyk7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJkZWZhdWx0UHJldmVudGVkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG4gIHZhciBpc0lFID0gL1RyaWRlbnQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gIGlmICghd2luZG93LkN1c3RvbUV2ZW50IHx8IGlzSUUgJiYgdHlwZW9mIHdpbmRvdy5DdXN0b21FdmVudCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgd2luZG93LkN1c3RvbUV2ZW50ID0gZnVuY3Rpb24oaW5UeXBlLCBwYXJhbXMpIHtcbiAgICAgIHBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcbiAgICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJDdXN0b21FdmVudFwiKTtcbiAgICAgIGUuaW5pdEN1c3RvbUV2ZW50KGluVHlwZSwgQm9vbGVhbihwYXJhbXMuYnViYmxlcyksIEJvb2xlYW4ocGFyYW1zLmNhbmNlbGFibGUpLCBwYXJhbXMuZGV0YWlsKTtcbiAgICAgIHJldHVybiBlO1xuICAgIH07XG4gICAgd2luZG93LkN1c3RvbUV2ZW50LnByb3RvdHlwZSA9IHdpbmRvdy5FdmVudC5wcm90b3R5cGU7XG4gIH1cbiAgaWYgKCF3aW5kb3cuRXZlbnQgfHwgaXNJRSAmJiB0eXBlb2Ygd2luZG93LkV2ZW50ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB2YXIgb3JpZ0V2ZW50ID0gd2luZG93LkV2ZW50O1xuICAgIHdpbmRvdy5FdmVudCA9IGZ1bmN0aW9uKGluVHlwZSwgcGFyYW1zKSB7XG4gICAgICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG4gICAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiRXZlbnRcIik7XG4gICAgICBlLmluaXRFdmVudChpblR5cGUsIEJvb2xlYW4ocGFyYW1zLmJ1YmJsZXMpLCBCb29sZWFuKHBhcmFtcy5jYW5jZWxhYmxlKSk7XG4gICAgICByZXR1cm4gZTtcbiAgICB9O1xuICAgIHdpbmRvdy5FdmVudC5wcm90b3R5cGUgPSBvcmlnRXZlbnQucHJvdG90eXBlO1xuICB9XG59KSh3aW5kb3cuV2ViQ29tcG9uZW50cyk7XG5cbndpbmRvdy5IVE1MSW1wb3J0cyA9IHdpbmRvdy5IVE1MSW1wb3J0cyB8fCB7XG4gIGZsYWdzOiB7fVxufTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBJTVBPUlRfTElOS19UWVBFID0gXCJpbXBvcnRcIjtcbiAgdmFyIHVzZU5hdGl2ZSA9IEJvb2xlYW4oSU1QT1JUX0xJTktfVFlQRSBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlua1wiKSk7XG4gIHZhciBoYXNTaGFkb3dET01Qb2x5ZmlsbCA9IEJvb2xlYW4od2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgdmFyIHdyYXAgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgcmV0dXJuIGhhc1NoYWRvd0RPTVBvbHlmaWxsID8gd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsLndyYXBJZk5lZWRlZChub2RlKSA6IG5vZGU7XG4gIH07XG4gIHZhciByb290RG9jdW1lbnQgPSB3cmFwKGRvY3VtZW50KTtcbiAgdmFyIGN1cnJlbnRTY3JpcHREZXNjcmlwdG9yID0ge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2NyaXB0ID0gd2luZG93LkhUTUxJbXBvcnRzLmN1cnJlbnRTY3JpcHQgfHwgZG9jdW1lbnQuY3VycmVudFNjcmlwdCB8fCAoZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gXCJjb21wbGV0ZVwiID8gZG9jdW1lbnQuc2NyaXB0c1tkb2N1bWVudC5zY3JpcHRzLmxlbmd0aCAtIDFdIDogbnVsbCk7XG4gICAgICByZXR1cm4gd3JhcChzY3JpcHQpO1xuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH07XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShkb2N1bWVudCwgXCJfY3VycmVudFNjcmlwdFwiLCBjdXJyZW50U2NyaXB0RGVzY3JpcHRvcik7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyb290RG9jdW1lbnQsIFwiX2N1cnJlbnRTY3JpcHRcIiwgY3VycmVudFNjcmlwdERlc2NyaXB0b3IpO1xuICB2YXIgaXNJRSA9IC9UcmlkZW50Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICBmdW5jdGlvbiB3aGVuUmVhZHkoY2FsbGJhY2ssIGRvYykge1xuICAgIGRvYyA9IGRvYyB8fCByb290RG9jdW1lbnQ7XG4gICAgd2hlbkRvY3VtZW50UmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICB3YXRjaEltcG9ydHNMb2FkKGNhbGxiYWNrLCBkb2MpO1xuICAgIH0sIGRvYyk7XG4gIH1cbiAgdmFyIHJlcXVpcmVkUmVhZHlTdGF0ZSA9IGlzSUUgPyBcImNvbXBsZXRlXCIgOiBcImludGVyYWN0aXZlXCI7XG4gIHZhciBSRUFEWV9FVkVOVCA9IFwicmVhZHlzdGF0ZWNoYW5nZVwiO1xuICBmdW5jdGlvbiBpc0RvY3VtZW50UmVhZHkoZG9jKSB7XG4gICAgcmV0dXJuIGRvYy5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIgfHwgZG9jLnJlYWR5U3RhdGUgPT09IHJlcXVpcmVkUmVhZHlTdGF0ZTtcbiAgfVxuICBmdW5jdGlvbiB3aGVuRG9jdW1lbnRSZWFkeShjYWxsYmFjaywgZG9jKSB7XG4gICAgaWYgKCFpc0RvY3VtZW50UmVhZHkoZG9jKSkge1xuICAgICAgdmFyIGNoZWNrUmVhZHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGRvYy5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIgfHwgZG9jLnJlYWR5U3RhdGUgPT09IHJlcXVpcmVkUmVhZHlTdGF0ZSkge1xuICAgICAgICAgIGRvYy5yZW1vdmVFdmVudExpc3RlbmVyKFJFQURZX0VWRU5ULCBjaGVja1JlYWR5KTtcbiAgICAgICAgICB3aGVuRG9jdW1lbnRSZWFkeShjYWxsYmFjaywgZG9jKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKFJFQURZX0VWRU5ULCBjaGVja1JlYWR5KTtcbiAgICB9IGVsc2UgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBtYXJrVGFyZ2V0TG9hZGVkKGV2ZW50KSB7XG4gICAgZXZlbnQudGFyZ2V0Ll9fbG9hZGVkID0gdHJ1ZTtcbiAgfVxuICBmdW5jdGlvbiB3YXRjaEltcG9ydHNMb2FkKGNhbGxiYWNrLCBkb2MpIHtcbiAgICB2YXIgaW1wb3J0cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKFwibGlua1tyZWw9aW1wb3J0XVwiKTtcbiAgICB2YXIgcGFyc2VkQ291bnQgPSAwLCBpbXBvcnRDb3VudCA9IGltcG9ydHMubGVuZ3RoLCBuZXdJbXBvcnRzID0gW10sIGVycm9ySW1wb3J0cyA9IFtdO1xuICAgIGZ1bmN0aW9uIGNoZWNrRG9uZSgpIHtcbiAgICAgIGlmIChwYXJzZWRDb3VudCA9PSBpbXBvcnRDb3VudCAmJiBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayh7XG4gICAgICAgICAgYWxsSW1wb3J0czogaW1wb3J0cyxcbiAgICAgICAgICBsb2FkZWRJbXBvcnRzOiBuZXdJbXBvcnRzLFxuICAgICAgICAgIGVycm9ySW1wb3J0czogZXJyb3JJbXBvcnRzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBsb2FkZWRJbXBvcnQoZSkge1xuICAgICAgbWFya1RhcmdldExvYWRlZChlKTtcbiAgICAgIG5ld0ltcG9ydHMucHVzaCh0aGlzKTtcbiAgICAgIHBhcnNlZENvdW50Kys7XG4gICAgICBjaGVja0RvbmUoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZXJyb3JMb2FkaW5nSW1wb3J0KGUpIHtcbiAgICAgIGVycm9ySW1wb3J0cy5wdXNoKHRoaXMpO1xuICAgICAgcGFyc2VkQ291bnQrKztcbiAgICAgIGNoZWNrRG9uZSgpO1xuICAgIH1cbiAgICBpZiAoaW1wb3J0Q291bnQpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBpbXA7IGkgPCBpbXBvcnRDb3VudCAmJiAoaW1wID0gaW1wb3J0c1tpXSk7IGkrKykge1xuICAgICAgICBpZiAoaXNJbXBvcnRMb2FkZWQoaW1wKSkge1xuICAgICAgICAgIG5ld0ltcG9ydHMucHVzaCh0aGlzKTtcbiAgICAgICAgICBwYXJzZWRDb3VudCsrO1xuICAgICAgICAgIGNoZWNrRG9uZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltcC5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBsb2FkZWRJbXBvcnQpO1xuICAgICAgICAgIGltcC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgZXJyb3JMb2FkaW5nSW1wb3J0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjaGVja0RvbmUoKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaXNJbXBvcnRMb2FkZWQobGluaykge1xuICAgIHJldHVybiB1c2VOYXRpdmUgPyBsaW5rLl9fbG9hZGVkIHx8IGxpbmsuaW1wb3J0ICYmIGxpbmsuaW1wb3J0LnJlYWR5U3RhdGUgIT09IFwibG9hZGluZ1wiIDogbGluay5fX2ltcG9ydFBhcnNlZDtcbiAgfVxuICBpZiAodXNlTmF0aXZlKSB7XG4gICAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXhucykge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBteG5zLmxlbmd0aCwgbTsgaSA8IGwgJiYgKG0gPSBteG5zW2ldKTsgaSsrKSB7XG4gICAgICAgIGlmIChtLmFkZGVkTm9kZXMpIHtcbiAgICAgICAgICBoYW5kbGVJbXBvcnRzKG0uYWRkZWROb2Rlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS5vYnNlcnZlKGRvY3VtZW50LmhlYWQsIHtcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZVxuICAgIH0pO1xuICAgIGZ1bmN0aW9uIGhhbmRsZUltcG9ydHMobm9kZXMpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbm9kZXMubGVuZ3RoLCBuOyBpIDwgbCAmJiAobiA9IG5vZGVzW2ldKTsgaSsrKSB7XG4gICAgICAgIGlmIChpc0ltcG9ydChuKSkge1xuICAgICAgICAgIGhhbmRsZUltcG9ydChuKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBpc0ltcG9ydChlbGVtZW50KSB7XG4gICAgICByZXR1cm4gZWxlbWVudC5sb2NhbE5hbWUgPT09IFwibGlua1wiICYmIGVsZW1lbnQucmVsID09PSBcImltcG9ydFwiO1xuICAgIH1cbiAgICBmdW5jdGlvbiBoYW5kbGVJbXBvcnQoZWxlbWVudCkge1xuICAgICAgdmFyIGxvYWRlZCA9IGVsZW1lbnQuaW1wb3J0O1xuICAgICAgaWYgKGxvYWRlZCkge1xuICAgICAgICBtYXJrVGFyZ2V0TG9hZGVkKHtcbiAgICAgICAgICB0YXJnZXQ6IGVsZW1lbnRcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIG1hcmtUYXJnZXRMb2FkZWQpO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCBtYXJrVGFyZ2V0TG9hZGVkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwibG9hZGluZ1wiKSB7XG4gICAgICAgIHZhciBpbXBvcnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcImxpbmtbcmVsPWltcG9ydF1cIik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gaW1wb3J0cy5sZW5ndGgsIGltcDsgaSA8IGwgJiYgKGltcCA9IGltcG9ydHNbaV0pOyBpKyspIHtcbiAgICAgICAgICBoYW5kbGVJbXBvcnQoaW1wKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pKCk7XG4gIH1cbiAgd2hlblJlYWR5KGZ1bmN0aW9uKGRldGFpbCkge1xuICAgIHdpbmRvdy5IVE1MSW1wb3J0cy5yZWFkeSA9IHRydWU7XG4gICAgd2luZG93LkhUTUxJbXBvcnRzLnJlYWR5VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIHZhciBldnQgPSByb290RG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJDdXN0b21FdmVudFwiKTtcbiAgICBldnQuaW5pdEN1c3RvbUV2ZW50KFwiSFRNTEltcG9ydHNMb2FkZWRcIiwgdHJ1ZSwgdHJ1ZSwgZGV0YWlsKTtcbiAgICByb290RG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldnQpO1xuICB9KTtcbiAgc2NvcGUuSU1QT1JUX0xJTktfVFlQRSA9IElNUE9SVF9MSU5LX1RZUEU7XG4gIHNjb3BlLnVzZU5hdGl2ZSA9IHVzZU5hdGl2ZTtcbiAgc2NvcGUucm9vdERvY3VtZW50ID0gcm9vdERvY3VtZW50O1xuICBzY29wZS53aGVuUmVhZHkgPSB3aGVuUmVhZHk7XG4gIHNjb3BlLmlzSUUgPSBpc0lFO1xufSkod2luZG93LkhUTUxJbXBvcnRzKTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBtb2R1bGVzID0gW107XG4gIHZhciBhZGRNb2R1bGUgPSBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICBtb2R1bGVzLnB1c2gobW9kdWxlKTtcbiAgfTtcbiAgdmFyIGluaXRpYWxpemVNb2R1bGVzID0gZnVuY3Rpb24oKSB7XG4gICAgbW9kdWxlcy5mb3JFYWNoKGZ1bmN0aW9uKG1vZHVsZSkge1xuICAgICAgbW9kdWxlKHNjb3BlKTtcbiAgICB9KTtcbiAgfTtcbiAgc2NvcGUuYWRkTW9kdWxlID0gYWRkTW9kdWxlO1xuICBzY29wZS5pbml0aWFsaXplTW9kdWxlcyA9IGluaXRpYWxpemVNb2R1bGVzO1xufSkod2luZG93LkhUTUxJbXBvcnRzKTtcblxud2luZG93LkhUTUxJbXBvcnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgQ1NTX1VSTF9SRUdFWFAgPSAvKHVybFxcKCkoW14pXSopKFxcKSkvZztcbiAgdmFyIENTU19JTVBPUlRfUkVHRVhQID0gLyhAaW1wb3J0W1xcc10rKD8hdXJsXFwoKSkoW147XSopKDspL2c7XG4gIHZhciBwYXRoID0ge1xuICAgIHJlc29sdmVVcmxzSW5TdHlsZTogZnVuY3Rpb24oc3R5bGUsIGxpbmtVcmwpIHtcbiAgICAgIHZhciBkb2MgPSBzdHlsZS5vd25lckRvY3VtZW50O1xuICAgICAgdmFyIHJlc29sdmVyID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSB0aGlzLnJlc29sdmVVcmxzSW5Dc3NUZXh0KHN0eWxlLnRleHRDb250ZW50LCBsaW5rVXJsLCByZXNvbHZlcik7XG4gICAgICByZXR1cm4gc3R5bGU7XG4gICAgfSxcbiAgICByZXNvbHZlVXJsc0luQ3NzVGV4dDogZnVuY3Rpb24oY3NzVGV4dCwgbGlua1VybCwgdXJsT2JqKSB7XG4gICAgICB2YXIgciA9IHRoaXMucmVwbGFjZVVybHMoY3NzVGV4dCwgdXJsT2JqLCBsaW5rVXJsLCBDU1NfVVJMX1JFR0VYUCk7XG4gICAgICByID0gdGhpcy5yZXBsYWNlVXJscyhyLCB1cmxPYmosIGxpbmtVcmwsIENTU19JTVBPUlRfUkVHRVhQKTtcbiAgICAgIHJldHVybiByO1xuICAgIH0sXG4gICAgcmVwbGFjZVVybHM6IGZ1bmN0aW9uKHRleHQsIHVybE9iaiwgbGlua1VybCwgcmVnZXhwKSB7XG4gICAgICByZXR1cm4gdGV4dC5yZXBsYWNlKHJlZ2V4cCwgZnVuY3Rpb24obSwgcHJlLCB1cmwsIHBvc3QpIHtcbiAgICAgICAgdmFyIHVybFBhdGggPSB1cmwucmVwbGFjZSgvW1wiJ10vZywgXCJcIik7XG4gICAgICAgIGlmIChsaW5rVXJsKSB7XG4gICAgICAgICAgdXJsUGF0aCA9IG5ldyBVUkwodXJsUGF0aCwgbGlua1VybCkuaHJlZjtcbiAgICAgICAgfVxuICAgICAgICB1cmxPYmouaHJlZiA9IHVybFBhdGg7XG4gICAgICAgIHVybFBhdGggPSB1cmxPYmouaHJlZjtcbiAgICAgICAgcmV0dXJuIHByZSArIFwiJ1wiICsgdXJsUGF0aCArIFwiJ1wiICsgcG9zdDtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgc2NvcGUucGF0aCA9IHBhdGg7XG59KTtcblxud2luZG93LkhUTUxJbXBvcnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgeGhyID0ge1xuICAgIGFzeW5jOiB0cnVlLFxuICAgIG9rOiBmdW5jdGlvbihyZXF1ZXN0KSB7XG4gICAgICByZXR1cm4gcmVxdWVzdC5zdGF0dXMgPj0gMjAwICYmIHJlcXVlc3Quc3RhdHVzIDwgMzAwIHx8IHJlcXVlc3Quc3RhdHVzID09PSAzMDQgfHwgcmVxdWVzdC5zdGF0dXMgPT09IDA7XG4gICAgfSxcbiAgICBsb2FkOiBmdW5jdGlvbih1cmwsIG5leHQsIG5leHRDb250ZXh0KSB7XG4gICAgICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgaWYgKHNjb3BlLmZsYWdzLmRlYnVnIHx8IHNjb3BlLmZsYWdzLmJ1c3QpIHtcbiAgICAgICAgdXJsICs9IFwiP1wiICsgTWF0aC5yYW5kb20oKTtcbiAgICAgIH1cbiAgICAgIHJlcXVlc3Qub3BlbihcIkdFVFwiLCB1cmwsIHhoci5hc3luYyk7XG4gICAgICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoXCJyZWFkeXN0YXRlY2hhbmdlXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgIHZhciByZWRpcmVjdGVkVXJsID0gbnVsbDtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uSGVhZGVyID0gcmVxdWVzdC5nZXRSZXNwb25zZUhlYWRlcihcIkxvY2F0aW9uXCIpO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uSGVhZGVyKSB7XG4gICAgICAgICAgICAgIHJlZGlyZWN0ZWRVcmwgPSBsb2NhdGlvbkhlYWRlci5zdWJzdHIoMCwgMSkgPT09IFwiL1wiID8gbG9jYXRpb24ub3JpZ2luICsgbG9jYXRpb25IZWFkZXIgOiBsb2NhdGlvbkhlYWRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5leHQuY2FsbChuZXh0Q29udGV4dCwgIXhoci5vayhyZXF1ZXN0KSAmJiByZXF1ZXN0LCByZXF1ZXN0LnJlc3BvbnNlIHx8IHJlcXVlc3QucmVzcG9uc2VUZXh0LCByZWRpcmVjdGVkVXJsKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXF1ZXN0LnNlbmQoKTtcbiAgICAgIHJldHVybiByZXF1ZXN0O1xuICAgIH0sXG4gICAgbG9hZERvY3VtZW50OiBmdW5jdGlvbih1cmwsIG5leHQsIG5leHRDb250ZXh0KSB7XG4gICAgICB0aGlzLmxvYWQodXJsLCBuZXh0LCBuZXh0Q29udGV4dCkucmVzcG9uc2VUeXBlID0gXCJkb2N1bWVudFwiO1xuICAgIH1cbiAgfTtcbiAgc2NvcGUueGhyID0geGhyO1xufSk7XG5cbndpbmRvdy5IVE1MSW1wb3J0cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIHhociA9IHNjb3BlLnhocjtcbiAgdmFyIGZsYWdzID0gc2NvcGUuZmxhZ3M7XG4gIHZhciBMb2FkZXIgPSBmdW5jdGlvbihvbkxvYWQsIG9uQ29tcGxldGUpIHtcbiAgICB0aGlzLmNhY2hlID0ge307XG4gICAgdGhpcy5vbmxvYWQgPSBvbkxvYWQ7XG4gICAgdGhpcy5vbmNvbXBsZXRlID0gb25Db21wbGV0ZTtcbiAgICB0aGlzLmluZmxpZ2h0ID0gMDtcbiAgICB0aGlzLnBlbmRpbmcgPSB7fTtcbiAgfTtcbiAgTG9hZGVyLnByb3RvdHlwZSA9IHtcbiAgICBhZGROb2RlczogZnVuY3Rpb24obm9kZXMpIHtcbiAgICAgIHRoaXMuaW5mbGlnaHQgKz0gbm9kZXMubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBub2Rlcy5sZW5ndGgsIG47IGkgPCBsICYmIChuID0gbm9kZXNbaV0pOyBpKyspIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlKG4pO1xuICAgICAgfVxuICAgICAgdGhpcy5jaGVja0RvbmUoKTtcbiAgICB9LFxuICAgIGFkZE5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHRoaXMuaW5mbGlnaHQrKztcbiAgICAgIHRoaXMucmVxdWlyZShub2RlKTtcbiAgICAgIHRoaXMuY2hlY2tEb25lKCk7XG4gICAgfSxcbiAgICByZXF1aXJlOiBmdW5jdGlvbihlbHQpIHtcbiAgICAgIHZhciB1cmwgPSBlbHQuc3JjIHx8IGVsdC5ocmVmO1xuICAgICAgZWx0Ll9fbm9kZVVybCA9IHVybDtcbiAgICAgIGlmICghdGhpcy5kZWR1cGUodXJsLCBlbHQpKSB7XG4gICAgICAgIHRoaXMuZmV0Y2godXJsLCBlbHQpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZGVkdXBlOiBmdW5jdGlvbih1cmwsIGVsdCkge1xuICAgICAgaWYgKHRoaXMucGVuZGluZ1t1cmxdKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ1t1cmxdLnB1c2goZWx0KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgcmVzb3VyY2U7XG4gICAgICBpZiAodGhpcy5jYWNoZVt1cmxdKSB7XG4gICAgICAgIHRoaXMub25sb2FkKHVybCwgZWx0LCB0aGlzLmNhY2hlW3VybF0pO1xuICAgICAgICB0aGlzLnRhaWwoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB0aGlzLnBlbmRpbmdbdXJsXSA9IFsgZWx0IF07XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICBmZXRjaDogZnVuY3Rpb24odXJsLCBlbHQpIHtcbiAgICAgIGZsYWdzLmxvYWQgJiYgY29uc29sZS5sb2coXCJmZXRjaFwiLCB1cmwsIGVsdCk7XG4gICAgICBpZiAoIXVybCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRoaXMucmVjZWl2ZSh1cmwsIGVsdCwge1xuICAgICAgICAgICAgZXJyb3I6IFwiaHJlZiBtdXN0IGJlIHNwZWNpZmllZFwiXG4gICAgICAgICAgfSwgbnVsbCk7XG4gICAgICAgIH0uYmluZCh0aGlzKSwgMCk7XG4gICAgICB9IGVsc2UgaWYgKHVybC5tYXRjaCgvXmRhdGE6LykpIHtcbiAgICAgICAgdmFyIHBpZWNlcyA9IHVybC5zcGxpdChcIixcIik7XG4gICAgICAgIHZhciBoZWFkZXIgPSBwaWVjZXNbMF07XG4gICAgICAgIHZhciBib2R5ID0gcGllY2VzWzFdO1xuICAgICAgICBpZiAoaGVhZGVyLmluZGV4T2YoXCI7YmFzZTY0XCIpID4gLTEpIHtcbiAgICAgICAgICBib2R5ID0gYXRvYihib2R5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBib2R5ID0gZGVjb2RlVVJJQ29tcG9uZW50KGJvZHkpO1xuICAgICAgICB9XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGhpcy5yZWNlaXZlKHVybCwgZWx0LCBudWxsLCBib2R5KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciByZWNlaXZlWGhyID0gZnVuY3Rpb24oZXJyLCByZXNvdXJjZSwgcmVkaXJlY3RlZFVybCkge1xuICAgICAgICAgIHRoaXMucmVjZWl2ZSh1cmwsIGVsdCwgZXJyLCByZXNvdXJjZSwgcmVkaXJlY3RlZFVybCk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgeGhyLmxvYWQodXJsLCByZWNlaXZlWGhyKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHJlY2VpdmU6IGZ1bmN0aW9uKHVybCwgZWx0LCBlcnIsIHJlc291cmNlLCByZWRpcmVjdGVkVXJsKSB7XG4gICAgICB0aGlzLmNhY2hlW3VybF0gPSByZXNvdXJjZTtcbiAgICAgIHZhciAkcCA9IHRoaXMucGVuZGluZ1t1cmxdO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSAkcC5sZW5ndGgsIHA7IGkgPCBsICYmIChwID0gJHBbaV0pOyBpKyspIHtcbiAgICAgICAgdGhpcy5vbmxvYWQodXJsLCBwLCByZXNvdXJjZSwgZXJyLCByZWRpcmVjdGVkVXJsKTtcbiAgICAgICAgdGhpcy50YWlsKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnBlbmRpbmdbdXJsXSA9IG51bGw7XG4gICAgfSxcbiAgICB0YWlsOiBmdW5jdGlvbigpIHtcbiAgICAgIC0tdGhpcy5pbmZsaWdodDtcbiAgICAgIHRoaXMuY2hlY2tEb25lKCk7XG4gICAgfSxcbiAgICBjaGVja0RvbmU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLmluZmxpZ2h0KSB7XG4gICAgICAgIHRoaXMub25jb21wbGV0ZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgc2NvcGUuTG9hZGVyID0gTG9hZGVyO1xufSk7XG5cbndpbmRvdy5IVE1MSW1wb3J0cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIE9ic2VydmVyID0gZnVuY3Rpb24oYWRkQ2FsbGJhY2spIHtcbiAgICB0aGlzLmFkZENhbGxiYWNrID0gYWRkQ2FsbGJhY2s7XG4gICAgdGhpcy5tbyA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKHRoaXMuaGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgfTtcbiAgT2JzZXJ2ZXIucHJvdG90eXBlID0ge1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uKG11dGF0aW9ucykge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBtdXRhdGlvbnMubGVuZ3RoLCBtOyBpIDwgbCAmJiAobSA9IG11dGF0aW9uc1tpXSk7IGkrKykge1xuICAgICAgICBpZiAobS50eXBlID09PSBcImNoaWxkTGlzdFwiICYmIG0uYWRkZWROb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLmFkZGVkTm9kZXMobS5hZGRlZE5vZGVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgYWRkZWROb2RlczogZnVuY3Rpb24obm9kZXMpIHtcbiAgICAgIGlmICh0aGlzLmFkZENhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuYWRkQ2FsbGJhY2sobm9kZXMpO1xuICAgICAgfVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBub2Rlcy5sZW5ndGgsIG4sIGxvYWRpbmc7IGkgPCBsICYmIChuID0gbm9kZXNbaV0pOyBpKyspIHtcbiAgICAgICAgaWYgKG4uY2hpbGRyZW4gJiYgbi5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLmFkZGVkTm9kZXMobi5jaGlsZHJlbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIG9ic2VydmU6IGZ1bmN0aW9uKHJvb3QpIHtcbiAgICAgIHRoaXMubW8ub2JzZXJ2ZShyb290LCB7XG4gICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuICBzY29wZS5PYnNlcnZlciA9IE9ic2VydmVyO1xufSk7XG5cbndpbmRvdy5IVE1MSW1wb3J0cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIHBhdGggPSBzY29wZS5wYXRoO1xuICB2YXIgcm9vdERvY3VtZW50ID0gc2NvcGUucm9vdERvY3VtZW50O1xuICB2YXIgZmxhZ3MgPSBzY29wZS5mbGFncztcbiAgdmFyIGlzSUUgPSBzY29wZS5pc0lFO1xuICB2YXIgSU1QT1JUX0xJTktfVFlQRSA9IHNjb3BlLklNUE9SVF9MSU5LX1RZUEU7XG4gIHZhciBJTVBPUlRfU0VMRUNUT1IgPSBcImxpbmtbcmVsPVwiICsgSU1QT1JUX0xJTktfVFlQRSArIFwiXVwiO1xuICB2YXIgaW1wb3J0UGFyc2VyID0ge1xuICAgIGRvY3VtZW50U2VsZWN0b3JzOiBJTVBPUlRfU0VMRUNUT1IsXG4gICAgaW1wb3J0c1NlbGVjdG9yczogWyBJTVBPUlRfU0VMRUNUT1IsIFwibGlua1tyZWw9c3R5bGVzaGVldF06bm90KFt0eXBlXSlcIiwgXCJzdHlsZTpub3QoW3R5cGVdKVwiLCBcInNjcmlwdDpub3QoW3R5cGVdKVwiLCAnc2NyaXB0W3R5cGU9XCJhcHBsaWNhdGlvbi9qYXZhc2NyaXB0XCJdJywgJ3NjcmlwdFt0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCJdJyBdLmpvaW4oXCIsXCIpLFxuICAgIG1hcDoge1xuICAgICAgbGluazogXCJwYXJzZUxpbmtcIixcbiAgICAgIHNjcmlwdDogXCJwYXJzZVNjcmlwdFwiLFxuICAgICAgc3R5bGU6IFwicGFyc2VTdHlsZVwiXG4gICAgfSxcbiAgICBkeW5hbWljRWxlbWVudHM6IFtdLFxuICAgIHBhcnNlTmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbmV4dCA9IHRoaXMubmV4dFRvUGFyc2UoKTtcbiAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgIHRoaXMucGFyc2UobmV4dCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBwYXJzZTogZnVuY3Rpb24oZWx0KSB7XG4gICAgICBpZiAodGhpcy5pc1BhcnNlZChlbHQpKSB7XG4gICAgICAgIGZsYWdzLnBhcnNlICYmIGNvbnNvbGUubG9nKFwiWyVzXSBpcyBhbHJlYWR5IHBhcnNlZFwiLCBlbHQubG9jYWxOYW1lKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIGZuID0gdGhpc1t0aGlzLm1hcFtlbHQubG9jYWxOYW1lXV07XG4gICAgICBpZiAoZm4pIHtcbiAgICAgICAgdGhpcy5tYXJrUGFyc2luZyhlbHQpO1xuICAgICAgICBmbi5jYWxsKHRoaXMsIGVsdCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBwYXJzZUR5bmFtaWM6IGZ1bmN0aW9uKGVsdCwgcXVpZXQpIHtcbiAgICAgIHRoaXMuZHluYW1pY0VsZW1lbnRzLnB1c2goZWx0KTtcbiAgICAgIGlmICghcXVpZXQpIHtcbiAgICAgICAgdGhpcy5wYXJzZU5leHQoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIG1hcmtQYXJzaW5nOiBmdW5jdGlvbihlbHQpIHtcbiAgICAgIGZsYWdzLnBhcnNlICYmIGNvbnNvbGUubG9nKFwicGFyc2luZ1wiLCBlbHQpO1xuICAgICAgdGhpcy5wYXJzaW5nRWxlbWVudCA9IGVsdDtcbiAgICB9LFxuICAgIG1hcmtQYXJzaW5nQ29tcGxldGU6IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgZWx0Ll9faW1wb3J0UGFyc2VkID0gdHJ1ZTtcbiAgICAgIHRoaXMubWFya0R5bmFtaWNQYXJzaW5nQ29tcGxldGUoZWx0KTtcbiAgICAgIGlmIChlbHQuX19pbXBvcnRFbGVtZW50KSB7XG4gICAgICAgIGVsdC5fX2ltcG9ydEVsZW1lbnQuX19pbXBvcnRQYXJzZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLm1hcmtEeW5hbWljUGFyc2luZ0NvbXBsZXRlKGVsdC5fX2ltcG9ydEVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgdGhpcy5wYXJzaW5nRWxlbWVudCA9IG51bGw7XG4gICAgICBmbGFncy5wYXJzZSAmJiBjb25zb2xlLmxvZyhcImNvbXBsZXRlZFwiLCBlbHQpO1xuICAgIH0sXG4gICAgbWFya0R5bmFtaWNQYXJzaW5nQ29tcGxldGU6IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgdmFyIGkgPSB0aGlzLmR5bmFtaWNFbGVtZW50cy5pbmRleE9mKGVsdCk7XG4gICAgICBpZiAoaSA+PSAwKSB7XG4gICAgICAgIHRoaXMuZHluYW1pY0VsZW1lbnRzLnNwbGljZShpLCAxKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhcnNlSW1wb3J0OiBmdW5jdGlvbihlbHQpIHtcbiAgICAgIGVsdC5pbXBvcnQgPSBlbHQuX19kb2M7XG4gICAgICBpZiAod2luZG93LkhUTUxJbXBvcnRzLl9faW1wb3J0c1BhcnNpbmdIb29rKSB7XG4gICAgICAgIHdpbmRvdy5IVE1MSW1wb3J0cy5fX2ltcG9ydHNQYXJzaW5nSG9vayhlbHQpO1xuICAgICAgfVxuICAgICAgaWYgKGVsdC5pbXBvcnQpIHtcbiAgICAgICAgZWx0LmltcG9ydC5fX2ltcG9ydFBhcnNlZCA9IHRydWU7XG4gICAgICB9XG4gICAgICB0aGlzLm1hcmtQYXJzaW5nQ29tcGxldGUoZWx0KTtcbiAgICAgIGlmIChlbHQuX19yZXNvdXJjZSAmJiAhZWx0Ll9fZXJyb3IpIHtcbiAgICAgICAgZWx0LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwibG9hZFwiLCB7XG4gICAgICAgICAgYnViYmxlczogZmFsc2VcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWx0LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwiZXJyb3JcIiwge1xuICAgICAgICAgIGJ1YmJsZXM6IGZhbHNlXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbHQuX19wZW5kaW5nKSB7XG4gICAgICAgIHZhciBmbjtcbiAgICAgICAgd2hpbGUgKGVsdC5fX3BlbmRpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgZm4gPSBlbHQuX19wZW5kaW5nLnNoaWZ0KCk7XG4gICAgICAgICAgaWYgKGZuKSB7XG4gICAgICAgICAgICBmbih7XG4gICAgICAgICAgICAgIHRhcmdldDogZWx0XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMucGFyc2VOZXh0KCk7XG4gICAgfSxcbiAgICBwYXJzZUxpbms6IGZ1bmN0aW9uKGxpbmtFbHQpIHtcbiAgICAgIGlmIChub2RlSXNJbXBvcnQobGlua0VsdCkpIHtcbiAgICAgICAgdGhpcy5wYXJzZUltcG9ydChsaW5rRWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpbmtFbHQuaHJlZiA9IGxpbmtFbHQuaHJlZjtcbiAgICAgICAgdGhpcy5wYXJzZUdlbmVyaWMobGlua0VsdCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBwYXJzZVN0eWxlOiBmdW5jdGlvbihlbHQpIHtcbiAgICAgIHZhciBzcmMgPSBlbHQ7XG4gICAgICBlbHQgPSBjbG9uZVN0eWxlKGVsdCk7XG4gICAgICBzcmMuX19hcHBsaWVkRWxlbWVudCA9IGVsdDtcbiAgICAgIGVsdC5fX2ltcG9ydEVsZW1lbnQgPSBzcmM7XG4gICAgICB0aGlzLnBhcnNlR2VuZXJpYyhlbHQpO1xuICAgIH0sXG4gICAgcGFyc2VHZW5lcmljOiBmdW5jdGlvbihlbHQpIHtcbiAgICAgIHRoaXMudHJhY2tFbGVtZW50KGVsdCk7XG4gICAgICB0aGlzLmFkZEVsZW1lbnRUb0RvY3VtZW50KGVsdCk7XG4gICAgfSxcbiAgICByb290SW1wb3J0Rm9yRWxlbWVudDogZnVuY3Rpb24oZWx0KSB7XG4gICAgICB2YXIgbiA9IGVsdDtcbiAgICAgIHdoaWxlIChuLm93bmVyRG9jdW1lbnQuX19pbXBvcnRMaW5rKSB7XG4gICAgICAgIG4gPSBuLm93bmVyRG9jdW1lbnQuX19pbXBvcnRMaW5rO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG47XG4gICAgfSxcbiAgICBhZGRFbGVtZW50VG9Eb2N1bWVudDogZnVuY3Rpb24oZWx0KSB7XG4gICAgICB2YXIgcG9ydCA9IHRoaXMucm9vdEltcG9ydEZvckVsZW1lbnQoZWx0Ll9faW1wb3J0RWxlbWVudCB8fCBlbHQpO1xuICAgICAgcG9ydC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbHQsIHBvcnQpO1xuICAgIH0sXG4gICAgdHJhY2tFbGVtZW50OiBmdW5jdGlvbihlbHQsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgZG9uZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZWx0LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGRvbmUpO1xuICAgICAgICBlbHQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIGRvbmUpO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBjYWxsYmFjayhlKTtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLm1hcmtQYXJzaW5nQ29tcGxldGUoZWx0KTtcbiAgICAgICAgc2VsZi5wYXJzZU5leHQoKTtcbiAgICAgIH07XG4gICAgICBlbHQuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZG9uZSk7XG4gICAgICBlbHQuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIGRvbmUpO1xuICAgICAgaWYgKGlzSUUgJiYgZWx0LmxvY2FsTmFtZSA9PT0gXCJzdHlsZVwiKSB7XG4gICAgICAgIHZhciBmYWtlTG9hZCA9IGZhbHNlO1xuICAgICAgICBpZiAoZWx0LnRleHRDb250ZW50LmluZGV4T2YoXCJAaW1wb3J0XCIpID09IC0xKSB7XG4gICAgICAgICAgZmFrZUxvYWQgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGVsdC5zaGVldCkge1xuICAgICAgICAgIGZha2VMb2FkID0gdHJ1ZTtcbiAgICAgICAgICB2YXIgY3NyID0gZWx0LnNoZWV0LmNzc1J1bGVzO1xuICAgICAgICAgIHZhciBsZW4gPSBjc3IgPyBjc3IubGVuZ3RoIDogMDtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IGxlbiAmJiAociA9IGNzcltpXSk7IGkrKykge1xuICAgICAgICAgICAgaWYgKHIudHlwZSA9PT0gQ1NTUnVsZS5JTVBPUlRfUlVMRSkge1xuICAgICAgICAgICAgICBmYWtlTG9hZCA9IGZha2VMb2FkICYmIEJvb2xlYW4oci5zdHlsZVNoZWV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZha2VMb2FkKSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGVsdC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImxvYWRcIiwge1xuICAgICAgICAgICAgICBidWJibGVzOiBmYWxzZVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBwYXJzZVNjcmlwdDogZnVuY3Rpb24oc2NyaXB0RWx0KSB7XG4gICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgIHNjcmlwdC5fX2ltcG9ydEVsZW1lbnQgPSBzY3JpcHRFbHQ7XG4gICAgICBzY3JpcHQuc3JjID0gc2NyaXB0RWx0LnNyYyA/IHNjcmlwdEVsdC5zcmMgOiBnZW5lcmF0ZVNjcmlwdERhdGFVcmwoc2NyaXB0RWx0KTtcbiAgICAgIHNjb3BlLmN1cnJlbnRTY3JpcHQgPSBzY3JpcHRFbHQ7XG4gICAgICB0aGlzLnRyYWNrRWxlbWVudChzY3JpcHQsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKHNjcmlwdC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgfVxuICAgICAgICBzY29wZS5jdXJyZW50U2NyaXB0ID0gbnVsbDtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5hZGRFbGVtZW50VG9Eb2N1bWVudChzY3JpcHQpO1xuICAgIH0sXG4gICAgbmV4dFRvUGFyc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fbWF5UGFyc2UgPSBbXTtcbiAgICAgIHJldHVybiAhdGhpcy5wYXJzaW5nRWxlbWVudCAmJiAodGhpcy5uZXh0VG9QYXJzZUluRG9jKHJvb3REb2N1bWVudCkgfHwgdGhpcy5uZXh0VG9QYXJzZUR5bmFtaWMoKSk7XG4gICAgfSxcbiAgICBuZXh0VG9QYXJzZUluRG9jOiBmdW5jdGlvbihkb2MsIGxpbmspIHtcbiAgICAgIGlmIChkb2MgJiYgdGhpcy5fbWF5UGFyc2UuaW5kZXhPZihkb2MpIDwgMCkge1xuICAgICAgICB0aGlzLl9tYXlQYXJzZS5wdXNoKGRvYyk7XG4gICAgICAgIHZhciBub2RlcyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKHRoaXMucGFyc2VTZWxlY3RvcnNGb3JOb2RlKGRvYykpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5vZGVzLmxlbmd0aCwgbjsgaSA8IGwgJiYgKG4gPSBub2Rlc1tpXSk7IGkrKykge1xuICAgICAgICAgIGlmICghdGhpcy5pc1BhcnNlZChuKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFzUmVzb3VyY2UobikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGVJc0ltcG9ydChuKSA/IHRoaXMubmV4dFRvUGFyc2VJbkRvYyhuLl9fZG9jLCBuKSA6IG47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbGluaztcbiAgICB9LFxuICAgIG5leHRUb1BhcnNlRHluYW1pYzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5keW5hbWljRWxlbWVudHNbMF07XG4gICAgfSxcbiAgICBwYXJzZVNlbGVjdG9yc0Zvck5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHZhciBkb2MgPSBub2RlLm93bmVyRG9jdW1lbnQgfHwgbm9kZTtcbiAgICAgIHJldHVybiBkb2MgPT09IHJvb3REb2N1bWVudCA/IHRoaXMuZG9jdW1lbnRTZWxlY3RvcnMgOiB0aGlzLmltcG9ydHNTZWxlY3RvcnM7XG4gICAgfSxcbiAgICBpc1BhcnNlZDogZnVuY3Rpb24obm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUuX19pbXBvcnRQYXJzZWQ7XG4gICAgfSxcbiAgICBuZWVkc0R5bmFtaWNQYXJzaW5nOiBmdW5jdGlvbihlbHQpIHtcbiAgICAgIHJldHVybiB0aGlzLmR5bmFtaWNFbGVtZW50cy5pbmRleE9mKGVsdCkgPj0gMDtcbiAgICB9LFxuICAgIGhhc1Jlc291cmNlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICBpZiAobm9kZUlzSW1wb3J0KG5vZGUpICYmIG5vZGUuX19kb2MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH07XG4gIGZ1bmN0aW9uIG5vZGVJc0ltcG9ydChlbHQpIHtcbiAgICByZXR1cm4gZWx0LmxvY2FsTmFtZSA9PT0gXCJsaW5rXCIgJiYgZWx0LnJlbCA9PT0gSU1QT1JUX0xJTktfVFlQRTtcbiAgfVxuICBmdW5jdGlvbiBnZW5lcmF0ZVNjcmlwdERhdGFVcmwoc2NyaXB0KSB7XG4gICAgdmFyIHNjcmlwdENvbnRlbnQgPSBnZW5lcmF0ZVNjcmlwdENvbnRlbnQoc2NyaXB0KTtcbiAgICByZXR1cm4gXCJkYXRhOnRleHQvamF2YXNjcmlwdDtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHNjcmlwdENvbnRlbnQpO1xuICB9XG4gIGZ1bmN0aW9uIGdlbmVyYXRlU2NyaXB0Q29udGVudChzY3JpcHQpIHtcbiAgICByZXR1cm4gc2NyaXB0LnRleHRDb250ZW50ICsgZ2VuZXJhdGVTb3VyY2VNYXBIaW50KHNjcmlwdCk7XG4gIH1cbiAgZnVuY3Rpb24gZ2VuZXJhdGVTb3VyY2VNYXBIaW50KHNjcmlwdCkge1xuICAgIHZhciBvd25lciA9IHNjcmlwdC5vd25lckRvY3VtZW50O1xuICAgIG93bmVyLl9faW1wb3J0ZWRTY3JpcHRzID0gb3duZXIuX19pbXBvcnRlZFNjcmlwdHMgfHwgMDtcbiAgICB2YXIgbW9uaWtlciA9IHNjcmlwdC5vd25lckRvY3VtZW50LmJhc2VVUkk7XG4gICAgdmFyIG51bSA9IG93bmVyLl9faW1wb3J0ZWRTY3JpcHRzID8gXCItXCIgKyBvd25lci5fX2ltcG9ydGVkU2NyaXB0cyA6IFwiXCI7XG4gICAgb3duZXIuX19pbXBvcnRlZFNjcmlwdHMrKztcbiAgICByZXR1cm4gXCJcXG4vLyMgc291cmNlVVJMPVwiICsgbW9uaWtlciArIG51bSArIFwiLmpzXFxuXCI7XG4gIH1cbiAgZnVuY3Rpb24gY2xvbmVTdHlsZShzdHlsZSkge1xuICAgIHZhciBjbG9uZSA9IHN0eWxlLm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgIGNsb25lLnRleHRDb250ZW50ID0gc3R5bGUudGV4dENvbnRlbnQ7XG4gICAgcGF0aC5yZXNvbHZlVXJsc0luU3R5bGUoY2xvbmUpO1xuICAgIHJldHVybiBjbG9uZTtcbiAgfVxuICBzY29wZS5wYXJzZXIgPSBpbXBvcnRQYXJzZXI7XG4gIHNjb3BlLklNUE9SVF9TRUxFQ1RPUiA9IElNUE9SVF9TRUxFQ1RPUjtcbn0pO1xuXG53aW5kb3cuSFRNTEltcG9ydHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBmbGFncyA9IHNjb3BlLmZsYWdzO1xuICB2YXIgSU1QT1JUX0xJTktfVFlQRSA9IHNjb3BlLklNUE9SVF9MSU5LX1RZUEU7XG4gIHZhciBJTVBPUlRfU0VMRUNUT1IgPSBzY29wZS5JTVBPUlRfU0VMRUNUT1I7XG4gIHZhciByb290RG9jdW1lbnQgPSBzY29wZS5yb290RG9jdW1lbnQ7XG4gIHZhciBMb2FkZXIgPSBzY29wZS5Mb2FkZXI7XG4gIHZhciBPYnNlcnZlciA9IHNjb3BlLk9ic2VydmVyO1xuICB2YXIgcGFyc2VyID0gc2NvcGUucGFyc2VyO1xuICB2YXIgaW1wb3J0ZXIgPSB7XG4gICAgZG9jdW1lbnRzOiB7fSxcbiAgICBkb2N1bWVudFByZWxvYWRTZWxlY3RvcnM6IElNUE9SVF9TRUxFQ1RPUixcbiAgICBpbXBvcnRzUHJlbG9hZFNlbGVjdG9yczogWyBJTVBPUlRfU0VMRUNUT1IgXS5qb2luKFwiLFwiKSxcbiAgICBsb2FkTm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgaW1wb3J0TG9hZGVyLmFkZE5vZGUobm9kZSk7XG4gICAgfSxcbiAgICBsb2FkU3VidHJlZTogZnVuY3Rpb24ocGFyZW50KSB7XG4gICAgICB2YXIgbm9kZXMgPSB0aGlzLm1hcnNoYWxOb2RlcyhwYXJlbnQpO1xuICAgICAgaW1wb3J0TG9hZGVyLmFkZE5vZGVzKG5vZGVzKTtcbiAgICB9LFxuICAgIG1hcnNoYWxOb2RlczogZnVuY3Rpb24ocGFyZW50KSB7XG4gICAgICByZXR1cm4gcGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5sb2FkU2VsZWN0b3JzRm9yTm9kZShwYXJlbnQpKTtcbiAgICB9LFxuICAgIGxvYWRTZWxlY3RvcnNGb3JOb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICB2YXIgZG9jID0gbm9kZS5vd25lckRvY3VtZW50IHx8IG5vZGU7XG4gICAgICByZXR1cm4gZG9jID09PSByb290RG9jdW1lbnQgPyB0aGlzLmRvY3VtZW50UHJlbG9hZFNlbGVjdG9ycyA6IHRoaXMuaW1wb3J0c1ByZWxvYWRTZWxlY3RvcnM7XG4gICAgfSxcbiAgICBsb2FkZWQ6IGZ1bmN0aW9uKHVybCwgZWx0LCByZXNvdXJjZSwgZXJyLCByZWRpcmVjdGVkVXJsKSB7XG4gICAgICBmbGFncy5sb2FkICYmIGNvbnNvbGUubG9nKFwibG9hZGVkXCIsIHVybCwgZWx0KTtcbiAgICAgIGVsdC5fX3Jlc291cmNlID0gcmVzb3VyY2U7XG4gICAgICBlbHQuX19lcnJvciA9IGVycjtcbiAgICAgIGlmIChpc0ltcG9ydExpbmsoZWx0KSkge1xuICAgICAgICB2YXIgZG9jID0gdGhpcy5kb2N1bWVudHNbdXJsXTtcbiAgICAgICAgaWYgKGRvYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZG9jID0gZXJyID8gbnVsbCA6IG1ha2VEb2N1bWVudChyZXNvdXJjZSwgcmVkaXJlY3RlZFVybCB8fCB1cmwpO1xuICAgICAgICAgIGlmIChkb2MpIHtcbiAgICAgICAgICAgIGRvYy5fX2ltcG9ydExpbmsgPSBlbHQ7XG4gICAgICAgICAgICB0aGlzLmJvb3REb2N1bWVudChkb2MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmRvY3VtZW50c1t1cmxdID0gZG9jO1xuICAgICAgICB9XG4gICAgICAgIGVsdC5fX2RvYyA9IGRvYztcbiAgICAgIH1cbiAgICAgIHBhcnNlci5wYXJzZU5leHQoKTtcbiAgICB9LFxuICAgIGJvb3REb2N1bWVudDogZnVuY3Rpb24oZG9jKSB7XG4gICAgICB0aGlzLmxvYWRTdWJ0cmVlKGRvYyk7XG4gICAgICB0aGlzLm9ic2VydmVyLm9ic2VydmUoZG9jKTtcbiAgICAgIHBhcnNlci5wYXJzZU5leHQoKTtcbiAgICB9LFxuICAgIGxvYWRlZEFsbDogZnVuY3Rpb24oKSB7XG4gICAgICBwYXJzZXIucGFyc2VOZXh0KCk7XG4gICAgfVxuICB9O1xuICB2YXIgaW1wb3J0TG9hZGVyID0gbmV3IExvYWRlcihpbXBvcnRlci5sb2FkZWQuYmluZChpbXBvcnRlciksIGltcG9ydGVyLmxvYWRlZEFsbC5iaW5kKGltcG9ydGVyKSk7XG4gIGltcG9ydGVyLm9ic2VydmVyID0gbmV3IE9ic2VydmVyKCk7XG4gIGZ1bmN0aW9uIGlzSW1wb3J0TGluayhlbHQpIHtcbiAgICByZXR1cm4gaXNMaW5rUmVsKGVsdCwgSU1QT1JUX0xJTktfVFlQRSk7XG4gIH1cbiAgZnVuY3Rpb24gaXNMaW5rUmVsKGVsdCwgcmVsKSB7XG4gICAgcmV0dXJuIGVsdC5sb2NhbE5hbWUgPT09IFwibGlua1wiICYmIGVsdC5nZXRBdHRyaWJ1dGUoXCJyZWxcIikgPT09IHJlbDtcbiAgfVxuICBmdW5jdGlvbiBoYXNCYXNlVVJJQWNjZXNzb3IoZG9jKSB7XG4gICAgcmV0dXJuICEhT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihkb2MsIFwiYmFzZVVSSVwiKTtcbiAgfVxuICBmdW5jdGlvbiBtYWtlRG9jdW1lbnQocmVzb3VyY2UsIHVybCkge1xuICAgIHZhciBkb2MgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQoSU1QT1JUX0xJTktfVFlQRSk7XG4gICAgZG9jLl9VUkwgPSB1cmw7XG4gICAgdmFyIGJhc2UgPSBkb2MuY3JlYXRlRWxlbWVudChcImJhc2VcIik7XG4gICAgYmFzZS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIHVybCk7XG4gICAgaWYgKCFkb2MuYmFzZVVSSSAmJiAhaGFzQmFzZVVSSUFjY2Vzc29yKGRvYykpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShkb2MsIFwiYmFzZVVSSVwiLCB7XG4gICAgICAgIHZhbHVlOiB1cmxcbiAgICAgIH0pO1xuICAgIH1cbiAgICB2YXIgbWV0YSA9IGRvYy5jcmVhdGVFbGVtZW50KFwibWV0YVwiKTtcbiAgICBtZXRhLnNldEF0dHJpYnV0ZShcImNoYXJzZXRcIiwgXCJ1dGYtOFwiKTtcbiAgICBkb2MuaGVhZC5hcHBlbmRDaGlsZChtZXRhKTtcbiAgICBkb2MuaGVhZC5hcHBlbmRDaGlsZChiYXNlKTtcbiAgICBkb2MuYm9keS5pbm5lckhUTUwgPSByZXNvdXJjZTtcbiAgICBpZiAod2luZG93LkhUTUxUZW1wbGF0ZUVsZW1lbnQgJiYgSFRNTFRlbXBsYXRlRWxlbWVudC5ib290c3RyYXApIHtcbiAgICAgIEhUTUxUZW1wbGF0ZUVsZW1lbnQuYm9vdHN0cmFwKGRvYyk7XG4gICAgfVxuICAgIHJldHVybiBkb2M7XG4gIH1cbiAgaWYgKCFkb2N1bWVudC5iYXNlVVJJKSB7XG4gICAgdmFyIGJhc2VVUklEZXNjcmlwdG9yID0ge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJhc2UgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiYmFzZVwiKTtcbiAgICAgICAgcmV0dXJuIGJhc2UgPyBiYXNlLmhyZWYgOiB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgIH0sXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShkb2N1bWVudCwgXCJiYXNlVVJJXCIsIGJhc2VVUklEZXNjcmlwdG9yKTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocm9vdERvY3VtZW50LCBcImJhc2VVUklcIiwgYmFzZVVSSURlc2NyaXB0b3IpO1xuICB9XG4gIHNjb3BlLmltcG9ydGVyID0gaW1wb3J0ZXI7XG4gIHNjb3BlLmltcG9ydExvYWRlciA9IGltcG9ydExvYWRlcjtcbn0pO1xuXG53aW5kb3cuSFRNTEltcG9ydHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBwYXJzZXIgPSBzY29wZS5wYXJzZXI7XG4gIHZhciBpbXBvcnRlciA9IHNjb3BlLmltcG9ydGVyO1xuICB2YXIgZHluYW1pYyA9IHtcbiAgICBhZGRlZDogZnVuY3Rpb24obm9kZXMpIHtcbiAgICAgIHZhciBvd25lciwgcGFyc2VkLCBsb2FkaW5nO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBub2Rlcy5sZW5ndGgsIG47IGkgPCBsICYmIChuID0gbm9kZXNbaV0pOyBpKyspIHtcbiAgICAgICAgaWYgKCFvd25lcikge1xuICAgICAgICAgIG93bmVyID0gbi5vd25lckRvY3VtZW50O1xuICAgICAgICAgIHBhcnNlZCA9IHBhcnNlci5pc1BhcnNlZChvd25lcik7XG4gICAgICAgIH1cbiAgICAgICAgbG9hZGluZyA9IHRoaXMuc2hvdWxkTG9hZE5vZGUobik7XG4gICAgICAgIGlmIChsb2FkaW5nKSB7XG4gICAgICAgICAgaW1wb3J0ZXIubG9hZE5vZGUobik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc2hvdWxkUGFyc2VOb2RlKG4pICYmIHBhcnNlZCkge1xuICAgICAgICAgIHBhcnNlci5wYXJzZUR5bmFtaWMobiwgbG9hZGluZyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHNob3VsZExvYWROb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBtYXRjaGVzLmNhbGwobm9kZSwgaW1wb3J0ZXIubG9hZFNlbGVjdG9yc0Zvck5vZGUobm9kZSkpO1xuICAgIH0sXG4gICAgc2hvdWxkUGFyc2VOb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBtYXRjaGVzLmNhbGwobm9kZSwgcGFyc2VyLnBhcnNlU2VsZWN0b3JzRm9yTm9kZShub2RlKSk7XG4gICAgfVxuICB9O1xuICBpbXBvcnRlci5vYnNlcnZlci5hZGRDYWxsYmFjayA9IGR5bmFtaWMuYWRkZWQuYmluZChkeW5hbWljKTtcbiAgdmFyIG1hdGNoZXMgPSBIVE1MRWxlbWVudC5wcm90b3R5cGUubWF0Y2hlcyB8fCBIVE1MRWxlbWVudC5wcm90b3R5cGUubWF0Y2hlc1NlbGVjdG9yIHx8IEhUTUxFbGVtZW50LnByb3RvdHlwZS53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgSFRNTEVsZW1lbnQucHJvdG90eXBlLm1vek1hdGNoZXNTZWxlY3RvciB8fCBIVE1MRWxlbWVudC5wcm90b3R5cGUubXNNYXRjaGVzU2VsZWN0b3I7XG59KTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBpbml0aWFsaXplTW9kdWxlcyA9IHNjb3BlLmluaXRpYWxpemVNb2R1bGVzO1xuICB2YXIgaXNJRSA9IHNjb3BlLmlzSUU7XG4gIGlmIChzY29wZS51c2VOYXRpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaW5pdGlhbGl6ZU1vZHVsZXMoKTtcbiAgdmFyIHJvb3REb2N1bWVudCA9IHNjb3BlLnJvb3REb2N1bWVudDtcbiAgZnVuY3Rpb24gYm9vdHN0cmFwKCkge1xuICAgIHdpbmRvdy5IVE1MSW1wb3J0cy5pbXBvcnRlci5ib290RG9jdW1lbnQocm9vdERvY3VtZW50KTtcbiAgfVxuICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiIHx8IGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiaW50ZXJhY3RpdmVcIiAmJiAhd2luZG93LmF0dGFjaEV2ZW50KSB7XG4gICAgYm9vdHN0cmFwKCk7XG4gIH0gZWxzZSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgYm9vdHN0cmFwKTtcbiAgfVxufSkod2luZG93LkhUTUxJbXBvcnRzKTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzID0gd2luZG93LkN1c3RvbUVsZW1lbnRzIHx8IHtcbiAgZmxhZ3M6IHt9XG59O1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGZsYWdzID0gc2NvcGUuZmxhZ3M7XG4gIHZhciBtb2R1bGVzID0gW107XG4gIHZhciBhZGRNb2R1bGUgPSBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICBtb2R1bGVzLnB1c2gobW9kdWxlKTtcbiAgfTtcbiAgdmFyIGluaXRpYWxpemVNb2R1bGVzID0gZnVuY3Rpb24oKSB7XG4gICAgbW9kdWxlcy5mb3JFYWNoKGZ1bmN0aW9uKG1vZHVsZSkge1xuICAgICAgbW9kdWxlKHNjb3BlKTtcbiAgICB9KTtcbiAgfTtcbiAgc2NvcGUuYWRkTW9kdWxlID0gYWRkTW9kdWxlO1xuICBzY29wZS5pbml0aWFsaXplTW9kdWxlcyA9IGluaXRpYWxpemVNb2R1bGVzO1xuICBzY29wZS5oYXNOYXRpdmUgPSBCb29sZWFuKGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCk7XG4gIHNjb3BlLmlzSUUgPSAvVHJpZGVudC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgc2NvcGUudXNlTmF0aXZlID0gIWZsYWdzLnJlZ2lzdGVyICYmIHNjb3BlLmhhc05hdGl2ZSAmJiAhd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsICYmICghd2luZG93LkhUTUxJbXBvcnRzIHx8IHdpbmRvdy5IVE1MSW1wb3J0cy51c2VOYXRpdmUpO1xufSkod2luZG93LkN1c3RvbUVsZW1lbnRzKTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgSU1QT1JUX0xJTktfVFlQRSA9IHdpbmRvdy5IVE1MSW1wb3J0cyA/IHdpbmRvdy5IVE1MSW1wb3J0cy5JTVBPUlRfTElOS19UWVBFIDogXCJub25lXCI7XG4gIGZ1bmN0aW9uIGZvclN1YnRyZWUobm9kZSwgY2IpIHtcbiAgICBmaW5kQWxsRWxlbWVudHMobm9kZSwgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGNiKGUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgZm9yUm9vdHMoZSwgY2IpO1xuICAgIH0pO1xuICAgIGZvclJvb3RzKG5vZGUsIGNiKTtcbiAgfVxuICBmdW5jdGlvbiBmaW5kQWxsRWxlbWVudHMobm9kZSwgZmluZCwgZGF0YSkge1xuICAgIHZhciBlID0gbm9kZS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICBpZiAoIWUpIHtcbiAgICAgIGUgPSBub2RlLmZpcnN0Q2hpbGQ7XG4gICAgICB3aGlsZSAoZSAmJiBlLm5vZGVUeXBlICE9PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBlID0gZS5uZXh0U2libGluZztcbiAgICAgIH1cbiAgICB9XG4gICAgd2hpbGUgKGUpIHtcbiAgICAgIGlmIChmaW5kKGUsIGRhdGEpICE9PSB0cnVlKSB7XG4gICAgICAgIGZpbmRBbGxFbGVtZW50cyhlLCBmaW5kLCBkYXRhKTtcbiAgICAgIH1cbiAgICAgIGUgPSBlLm5leHRFbGVtZW50U2libGluZztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZnVuY3Rpb24gZm9yUm9vdHMobm9kZSwgY2IpIHtcbiAgICB2YXIgcm9vdCA9IG5vZGUuc2hhZG93Um9vdDtcbiAgICB3aGlsZSAocm9vdCkge1xuICAgICAgZm9yU3VidHJlZShyb290LCBjYik7XG4gICAgICByb290ID0gcm9vdC5vbGRlclNoYWRvd1Jvb3Q7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGZvckRvY3VtZW50VHJlZShkb2MsIGNiKSB7XG4gICAgX2ZvckRvY3VtZW50VHJlZShkb2MsIGNiLCBbXSk7XG4gIH1cbiAgZnVuY3Rpb24gX2ZvckRvY3VtZW50VHJlZShkb2MsIGNiLCBwcm9jZXNzaW5nRG9jdW1lbnRzKSB7XG4gICAgZG9jID0gd2luZG93LndyYXAoZG9jKTtcbiAgICBpZiAocHJvY2Vzc2luZ0RvY3VtZW50cy5pbmRleE9mKGRvYykgPj0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBwcm9jZXNzaW5nRG9jdW1lbnRzLnB1c2goZG9jKTtcbiAgICB2YXIgaW1wb3J0cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKFwibGlua1tyZWw9XCIgKyBJTVBPUlRfTElOS19UWVBFICsgXCJdXCIpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gaW1wb3J0cy5sZW5ndGgsIG47IGkgPCBsICYmIChuID0gaW1wb3J0c1tpXSk7IGkrKykge1xuICAgICAgaWYgKG4uaW1wb3J0KSB7XG4gICAgICAgIF9mb3JEb2N1bWVudFRyZWUobi5pbXBvcnQsIGNiLCBwcm9jZXNzaW5nRG9jdW1lbnRzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY2IoZG9jKTtcbiAgfVxuICBzY29wZS5mb3JEb2N1bWVudFRyZWUgPSBmb3JEb2N1bWVudFRyZWU7XG4gIHNjb3BlLmZvclN1YnRyZWUgPSBmb3JTdWJ0cmVlO1xufSk7XG5cbndpbmRvdy5DdXN0b21FbGVtZW50cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGZsYWdzID0gc2NvcGUuZmxhZ3M7XG4gIHZhciBmb3JTdWJ0cmVlID0gc2NvcGUuZm9yU3VidHJlZTtcbiAgdmFyIGZvckRvY3VtZW50VHJlZSA9IHNjb3BlLmZvckRvY3VtZW50VHJlZTtcbiAgZnVuY3Rpb24gYWRkZWROb2RlKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICByZXR1cm4gYWRkZWQobm9kZSwgaXNBdHRhY2hlZCkgfHwgYWRkZWRTdWJ0cmVlKG5vZGUsIGlzQXR0YWNoZWQpO1xuICB9XG4gIGZ1bmN0aW9uIGFkZGVkKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICBpZiAoc2NvcGUudXBncmFkZShub2RlLCBpc0F0dGFjaGVkKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChpc0F0dGFjaGVkKSB7XG4gICAgICBhdHRhY2hlZChub2RlKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gYWRkZWRTdWJ0cmVlKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICBmb3JTdWJ0cmVlKG5vZGUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChhZGRlZChlLCBpc0F0dGFjaGVkKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICB2YXIgaGFzVGhyb3R0bGVkQXR0YWNoZWQgPSB3aW5kb3cuTXV0YXRpb25PYnNlcnZlci5faXNQb2x5ZmlsbGVkICYmIGZsYWdzW1widGhyb3R0bGUtYXR0YWNoZWRcIl07XG4gIHNjb3BlLmhhc1BvbHlmaWxsTXV0YXRpb25zID0gaGFzVGhyb3R0bGVkQXR0YWNoZWQ7XG4gIHNjb3BlLmhhc1Rocm90dGxlZEF0dGFjaGVkID0gaGFzVGhyb3R0bGVkQXR0YWNoZWQ7XG4gIHZhciBpc1BlbmRpbmdNdXRhdGlvbnMgPSBmYWxzZTtcbiAgdmFyIHBlbmRpbmdNdXRhdGlvbnMgPSBbXTtcbiAgZnVuY3Rpb24gZGVmZXJNdXRhdGlvbihmbikge1xuICAgIHBlbmRpbmdNdXRhdGlvbnMucHVzaChmbik7XG4gICAgaWYgKCFpc1BlbmRpbmdNdXRhdGlvbnMpIHtcbiAgICAgIGlzUGVuZGluZ011dGF0aW9ucyA9IHRydWU7XG4gICAgICBzZXRUaW1lb3V0KHRha2VNdXRhdGlvbnMpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB0YWtlTXV0YXRpb25zKCkge1xuICAgIGlzUGVuZGluZ011dGF0aW9ucyA9IGZhbHNlO1xuICAgIHZhciAkcCA9IHBlbmRpbmdNdXRhdGlvbnM7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSAkcC5sZW5ndGgsIHA7IGkgPCBsICYmIChwID0gJHBbaV0pOyBpKyspIHtcbiAgICAgIHAoKTtcbiAgICB9XG4gICAgcGVuZGluZ011dGF0aW9ucyA9IFtdO1xuICB9XG4gIGZ1bmN0aW9uIGF0dGFjaGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoaGFzVGhyb3R0bGVkQXR0YWNoZWQpIHtcbiAgICAgIGRlZmVyTXV0YXRpb24oZnVuY3Rpb24oKSB7XG4gICAgICAgIF9hdHRhY2hlZChlbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBfYXR0YWNoZWQoZWxlbWVudCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIF9hdHRhY2hlZChlbGVtZW50KSB7XG4gICAgaWYgKGVsZW1lbnQuX191cGdyYWRlZF9fICYmICFlbGVtZW50Ll9fYXR0YWNoZWQpIHtcbiAgICAgIGVsZW1lbnQuX19hdHRhY2hlZCA9IHRydWU7XG4gICAgICBpZiAoZWxlbWVudC5hdHRhY2hlZENhbGxiYWNrKSB7XG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWRDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkZXRhY2hlZE5vZGUobm9kZSkge1xuICAgIGRldGFjaGVkKG5vZGUpO1xuICAgIGZvclN1YnRyZWUobm9kZSwgZnVuY3Rpb24oZSkge1xuICAgICAgZGV0YWNoZWQoZSk7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gZGV0YWNoZWQoZWxlbWVudCkge1xuICAgIGlmIChoYXNUaHJvdHRsZWRBdHRhY2hlZCkge1xuICAgICAgZGVmZXJNdXRhdGlvbihmdW5jdGlvbigpIHtcbiAgICAgICAgX2RldGFjaGVkKGVsZW1lbnQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9kZXRhY2hlZChlbGVtZW50KTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gX2RldGFjaGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5fX3VwZ3JhZGVkX18gJiYgZWxlbWVudC5fX2F0dGFjaGVkKSB7XG4gICAgICBlbGVtZW50Ll9fYXR0YWNoZWQgPSBmYWxzZTtcbiAgICAgIGlmIChlbGVtZW50LmRldGFjaGVkQ2FsbGJhY2spIHtcbiAgICAgICAgZWxlbWVudC5kZXRhY2hlZENhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGluRG9jdW1lbnQoZWxlbWVudCkge1xuICAgIHZhciBwID0gZWxlbWVudDtcbiAgICB2YXIgZG9jID0gd2luZG93LndyYXAoZG9jdW1lbnQpO1xuICAgIHdoaWxlIChwKSB7XG4gICAgICBpZiAocCA9PSBkb2MpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBwID0gcC5wYXJlbnROb2RlIHx8IHAubm9kZVR5cGUgPT09IE5vZGUuRE9DVU1FTlRfRlJBR01FTlRfTk9ERSAmJiBwLmhvc3Q7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHdhdGNoU2hhZG93KG5vZGUpIHtcbiAgICBpZiAobm9kZS5zaGFkb3dSb290ICYmICFub2RlLnNoYWRvd1Jvb3QuX193YXRjaGVkKSB7XG4gICAgICBmbGFncy5kb20gJiYgY29uc29sZS5sb2coXCJ3YXRjaGluZyBzaGFkb3ctcm9vdCBmb3I6IFwiLCBub2RlLmxvY2FsTmFtZSk7XG4gICAgICB2YXIgcm9vdCA9IG5vZGUuc2hhZG93Um9vdDtcbiAgICAgIHdoaWxlIChyb290KSB7XG4gICAgICAgIG9ic2VydmUocm9vdCk7XG4gICAgICAgIHJvb3QgPSByb290Lm9sZGVyU2hhZG93Um9vdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaGFuZGxlcihyb290LCBtdXRhdGlvbnMpIHtcbiAgICBpZiAoZmxhZ3MuZG9tKSB7XG4gICAgICB2YXIgbXggPSBtdXRhdGlvbnNbMF07XG4gICAgICBpZiAobXggJiYgbXgudHlwZSA9PT0gXCJjaGlsZExpc3RcIiAmJiBteC5hZGRlZE5vZGVzKSB7XG4gICAgICAgIGlmIChteC5hZGRlZE5vZGVzKSB7XG4gICAgICAgICAgdmFyIGQgPSBteC5hZGRlZE5vZGVzWzBdO1xuICAgICAgICAgIHdoaWxlIChkICYmIGQgIT09IGRvY3VtZW50ICYmICFkLmhvc3QpIHtcbiAgICAgICAgICAgIGQgPSBkLnBhcmVudE5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciB1ID0gZCAmJiAoZC5VUkwgfHwgZC5fVVJMIHx8IGQuaG9zdCAmJiBkLmhvc3QubG9jYWxOYW1lKSB8fCBcIlwiO1xuICAgICAgICAgIHUgPSB1LnNwbGl0KFwiLz9cIikuc2hpZnQoKS5zcGxpdChcIi9cIikucG9wKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnNvbGUuZ3JvdXAoXCJtdXRhdGlvbnMgKCVkKSBbJXNdXCIsIG11dGF0aW9ucy5sZW5ndGgsIHUgfHwgXCJcIik7XG4gICAgfVxuICAgIHZhciBpc0F0dGFjaGVkID0gaW5Eb2N1bWVudChyb290KTtcbiAgICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihteCkge1xuICAgICAgaWYgKG14LnR5cGUgPT09IFwiY2hpbGRMaXN0XCIpIHtcbiAgICAgICAgZm9yRWFjaChteC5hZGRlZE5vZGVzLCBmdW5jdGlvbihuKSB7XG4gICAgICAgICAgaWYgKCFuLmxvY2FsTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhZGRlZE5vZGUobiwgaXNBdHRhY2hlZCk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3JFYWNoKG14LnJlbW92ZWROb2RlcywgZnVuY3Rpb24obikge1xuICAgICAgICAgIGlmICghbi5sb2NhbE5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGV0YWNoZWROb2RlKG4pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmbGFncy5kb20gJiYgY29uc29sZS5ncm91cEVuZCgpO1xuICB9XG4gIGZ1bmN0aW9uIHRha2VSZWNvcmRzKG5vZGUpIHtcbiAgICBub2RlID0gd2luZG93LndyYXAobm9kZSk7XG4gICAgaWYgKCFub2RlKSB7XG4gICAgICBub2RlID0gd2luZG93LndyYXAoZG9jdW1lbnQpO1xuICAgIH1cbiAgICB3aGlsZSAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgICB2YXIgb2JzZXJ2ZXIgPSBub2RlLl9fb2JzZXJ2ZXI7XG4gICAgaWYgKG9ic2VydmVyKSB7XG4gICAgICBoYW5kbGVyKG5vZGUsIG9ic2VydmVyLnRha2VSZWNvcmRzKCkpO1xuICAgICAgdGFrZU11dGF0aW9ucygpO1xuICAgIH1cbiAgfVxuICB2YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwuYmluZChBcnJheS5wcm90b3R5cGUuZm9yRWFjaCk7XG4gIGZ1bmN0aW9uIG9ic2VydmUoaW5Sb290KSB7XG4gICAgaWYgKGluUm9vdC5fX29ic2VydmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGhhbmRsZXIuYmluZCh0aGlzLCBpblJvb3QpKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGluUm9vdCwge1xuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgc3VidHJlZTogdHJ1ZVxuICAgIH0pO1xuICAgIGluUm9vdC5fX29ic2VydmVyID0gb2JzZXJ2ZXI7XG4gIH1cbiAgZnVuY3Rpb24gdXBncmFkZURvY3VtZW50KGRvYykge1xuICAgIGRvYyA9IHdpbmRvdy53cmFwKGRvYyk7XG4gICAgZmxhZ3MuZG9tICYmIGNvbnNvbGUuZ3JvdXAoXCJ1cGdyYWRlRG9jdW1lbnQ6IFwiLCBkb2MuYmFzZVVSSS5zcGxpdChcIi9cIikucG9wKCkpO1xuICAgIHZhciBpc01haW5Eb2N1bWVudCA9IGRvYyA9PT0gd2luZG93LndyYXAoZG9jdW1lbnQpO1xuICAgIGFkZGVkTm9kZShkb2MsIGlzTWFpbkRvY3VtZW50KTtcbiAgICBvYnNlcnZlKGRvYyk7XG4gICAgZmxhZ3MuZG9tICYmIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgfVxuICBmdW5jdGlvbiB1cGdyYWRlRG9jdW1lbnRUcmVlKGRvYykge1xuICAgIGZvckRvY3VtZW50VHJlZShkb2MsIHVwZ3JhZGVEb2N1bWVudCk7XG4gIH1cbiAgdmFyIG9yaWdpbmFsQ3JlYXRlU2hhZG93Um9vdCA9IEVsZW1lbnQucHJvdG90eXBlLmNyZWF0ZVNoYWRvd1Jvb3Q7XG4gIGlmIChvcmlnaW5hbENyZWF0ZVNoYWRvd1Jvb3QpIHtcbiAgICBFbGVtZW50LnByb3RvdHlwZS5jcmVhdGVTaGFkb3dSb290ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcm9vdCA9IG9yaWdpbmFsQ3JlYXRlU2hhZG93Um9vdC5jYWxsKHRoaXMpO1xuICAgICAgd2luZG93LkN1c3RvbUVsZW1lbnRzLndhdGNoU2hhZG93KHRoaXMpO1xuICAgICAgcmV0dXJuIHJvb3Q7XG4gICAgfTtcbiAgfVxuICBzY29wZS53YXRjaFNoYWRvdyA9IHdhdGNoU2hhZG93O1xuICBzY29wZS51cGdyYWRlRG9jdW1lbnRUcmVlID0gdXBncmFkZURvY3VtZW50VHJlZTtcbiAgc2NvcGUudXBncmFkZURvY3VtZW50ID0gdXBncmFkZURvY3VtZW50O1xuICBzY29wZS51cGdyYWRlU3VidHJlZSA9IGFkZGVkU3VidHJlZTtcbiAgc2NvcGUudXBncmFkZUFsbCA9IGFkZGVkTm9kZTtcbiAgc2NvcGUuYXR0YWNoZWQgPSBhdHRhY2hlZDtcbiAgc2NvcGUudGFrZVJlY29yZHMgPSB0YWtlUmVjb3Jkcztcbn0pO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBmbGFncyA9IHNjb3BlLmZsYWdzO1xuICBmdW5jdGlvbiB1cGdyYWRlKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICBpZiAobm9kZS5sb2NhbE5hbWUgPT09IFwidGVtcGxhdGVcIikge1xuICAgICAgaWYgKHdpbmRvdy5IVE1MVGVtcGxhdGVFbGVtZW50ICYmIEhUTUxUZW1wbGF0ZUVsZW1lbnQuZGVjb3JhdGUpIHtcbiAgICAgICAgSFRNTFRlbXBsYXRlRWxlbWVudC5kZWNvcmF0ZShub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFub2RlLl9fdXBncmFkZWRfXyAmJiBub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgdmFyIGlzID0gbm9kZS5nZXRBdHRyaWJ1dGUoXCJpc1wiKTtcbiAgICAgIHZhciBkZWZpbml0aW9uID0gc2NvcGUuZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24obm9kZS5sb2NhbE5hbWUpIHx8IHNjb3BlLmdldFJlZ2lzdGVyZWREZWZpbml0aW9uKGlzKTtcbiAgICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICAgIGlmIChpcyAmJiBkZWZpbml0aW9uLnRhZyA9PSBub2RlLmxvY2FsTmFtZSB8fCAhaXMgJiYgIWRlZmluaXRpb24uZXh0ZW5kcykge1xuICAgICAgICAgIHJldHVybiB1cGdyYWRlV2l0aERlZmluaXRpb24obm9kZSwgZGVmaW5pdGlvbiwgaXNBdHRhY2hlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gdXBncmFkZVdpdGhEZWZpbml0aW9uKGVsZW1lbnQsIGRlZmluaXRpb24sIGlzQXR0YWNoZWQpIHtcbiAgICBmbGFncy51cGdyYWRlICYmIGNvbnNvbGUuZ3JvdXAoXCJ1cGdyYWRlOlwiLCBlbGVtZW50LmxvY2FsTmFtZSk7XG4gICAgaWYgKGRlZmluaXRpb24uaXMpIHtcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaXNcIiwgZGVmaW5pdGlvbi5pcyk7XG4gICAgfVxuICAgIGltcGxlbWVudFByb3RvdHlwZShlbGVtZW50LCBkZWZpbml0aW9uKTtcbiAgICBlbGVtZW50Ll9fdXBncmFkZWRfXyA9IHRydWU7XG4gICAgY3JlYXRlZChlbGVtZW50KTtcbiAgICBpZiAoaXNBdHRhY2hlZCkge1xuICAgICAgc2NvcGUuYXR0YWNoZWQoZWxlbWVudCk7XG4gICAgfVxuICAgIHNjb3BlLnVwZ3JhZGVTdWJ0cmVlKGVsZW1lbnQsIGlzQXR0YWNoZWQpO1xuICAgIGZsYWdzLnVwZ3JhZGUgJiYgY29uc29sZS5ncm91cEVuZCgpO1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG4gIGZ1bmN0aW9uIGltcGxlbWVudFByb3RvdHlwZShlbGVtZW50LCBkZWZpbml0aW9uKSB7XG4gICAgaWYgKE9iamVjdC5fX3Byb3RvX18pIHtcbiAgICAgIGVsZW1lbnQuX19wcm90b19fID0gZGVmaW5pdGlvbi5wcm90b3R5cGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1c3RvbU1peGluKGVsZW1lbnQsIGRlZmluaXRpb24ucHJvdG90eXBlLCBkZWZpbml0aW9uLm5hdGl2ZSk7XG4gICAgICBlbGVtZW50Ll9fcHJvdG9fXyA9IGRlZmluaXRpb24ucHJvdG90eXBlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjdXN0b21NaXhpbihpblRhcmdldCwgaW5TcmMsIGluTmF0aXZlKSB7XG4gICAgdmFyIHVzZWQgPSB7fTtcbiAgICB2YXIgcCA9IGluU3JjO1xuICAgIHdoaWxlIChwICE9PSBpbk5hdGl2ZSAmJiBwICE9PSBIVE1MRWxlbWVudC5wcm90b3R5cGUpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgazsgayA9IGtleXNbaV07IGkrKykge1xuICAgICAgICBpZiAoIXVzZWRba10pIHtcbiAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaW5UYXJnZXQsIGssIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocCwgaykpO1xuICAgICAgICAgIHVzZWRba10gPSAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHApO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjcmVhdGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5jcmVhdGVkQ2FsbGJhY2spIHtcbiAgICAgIGVsZW1lbnQuY3JlYXRlZENhbGxiYWNrKCk7XG4gICAgfVxuICB9XG4gIHNjb3BlLnVwZ3JhZGUgPSB1cGdyYWRlO1xuICBzY29wZS51cGdyYWRlV2l0aERlZmluaXRpb24gPSB1cGdyYWRlV2l0aERlZmluaXRpb247XG4gIHNjb3BlLmltcGxlbWVudFByb3RvdHlwZSA9IGltcGxlbWVudFByb3RvdHlwZTtcbn0pO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBpc0lFID0gc2NvcGUuaXNJRTtcbiAgdmFyIHVwZ3JhZGVEb2N1bWVudFRyZWUgPSBzY29wZS51cGdyYWRlRG9jdW1lbnRUcmVlO1xuICB2YXIgdXBncmFkZUFsbCA9IHNjb3BlLnVwZ3JhZGVBbGw7XG4gIHZhciB1cGdyYWRlV2l0aERlZmluaXRpb24gPSBzY29wZS51cGdyYWRlV2l0aERlZmluaXRpb247XG4gIHZhciBpbXBsZW1lbnRQcm90b3R5cGUgPSBzY29wZS5pbXBsZW1lbnRQcm90b3R5cGU7XG4gIHZhciB1c2VOYXRpdmUgPSBzY29wZS51c2VOYXRpdmU7XG4gIGZ1bmN0aW9uIHJlZ2lzdGVyKG5hbWUsIG9wdGlvbnMpIHtcbiAgICB2YXIgZGVmaW5pdGlvbiA9IG9wdGlvbnMgfHwge307XG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQ6IGZpcnN0IGFyZ3VtZW50IGBuYW1lYCBtdXN0IG5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG4gICAgaWYgKG5hbWUuaW5kZXhPZihcIi1cIikgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQ6IGZpcnN0IGFyZ3VtZW50ICgnbmFtZScpIG11c3QgY29udGFpbiBhIGRhc2ggKCctJykuIEFyZ3VtZW50IHByb3ZpZGVkIHdhcyAnXCIgKyBTdHJpbmcobmFtZSkgKyBcIicuXCIpO1xuICAgIH1cbiAgICBpZiAoaXNSZXNlcnZlZFRhZyhuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGV4ZWN1dGUgJ3JlZ2lzdGVyRWxlbWVudCcgb24gJ0RvY3VtZW50JzogUmVnaXN0cmF0aW9uIGZhaWxlZCBmb3IgdHlwZSAnXCIgKyBTdHJpbmcobmFtZSkgKyBcIicuIFRoZSB0eXBlIG5hbWUgaXMgaW52YWxpZC5cIik7XG4gICAgfVxuICAgIGlmIChnZXRSZWdpc3RlcmVkRGVmaW5pdGlvbihuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRHVwbGljYXRlRGVmaW5pdGlvbkVycm9yOiBhIHR5cGUgd2l0aCBuYW1lICdcIiArIFN0cmluZyhuYW1lKSArIFwiJyBpcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGlmICghZGVmaW5pdGlvbi5wcm90b3R5cGUpIHtcbiAgICAgIGRlZmluaXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIH1cbiAgICBkZWZpbml0aW9uLl9fbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoZGVmaW5pdGlvbi5leHRlbmRzKSB7XG4gICAgICBkZWZpbml0aW9uLmV4dGVuZHMgPSBkZWZpbml0aW9uLmV4dGVuZHMudG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgZGVmaW5pdGlvbi5saWZlY3ljbGUgPSBkZWZpbml0aW9uLmxpZmVjeWNsZSB8fCB7fTtcbiAgICBkZWZpbml0aW9uLmFuY2VzdHJ5ID0gYW5jZXN0cnkoZGVmaW5pdGlvbi5leHRlbmRzKTtcbiAgICByZXNvbHZlVGFnTmFtZShkZWZpbml0aW9uKTtcbiAgICByZXNvbHZlUHJvdG90eXBlQ2hhaW4oZGVmaW5pdGlvbik7XG4gICAgb3ZlcnJpZGVBdHRyaWJ1dGVBcGkoZGVmaW5pdGlvbi5wcm90b3R5cGUpO1xuICAgIHJlZ2lzdGVyRGVmaW5pdGlvbihkZWZpbml0aW9uLl9fbmFtZSwgZGVmaW5pdGlvbik7XG4gICAgZGVmaW5pdGlvbi5jdG9yID0gZ2VuZXJhdGVDb25zdHJ1Y3RvcihkZWZpbml0aW9uKTtcbiAgICBkZWZpbml0aW9uLmN0b3IucHJvdG90eXBlID0gZGVmaW5pdGlvbi5wcm90b3R5cGU7XG4gICAgZGVmaW5pdGlvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBkZWZpbml0aW9uLmN0b3I7XG4gICAgaWYgKHNjb3BlLnJlYWR5KSB7XG4gICAgICB1cGdyYWRlRG9jdW1lbnRUcmVlKGRvY3VtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmluaXRpb24uY3RvcjtcbiAgfVxuICBmdW5jdGlvbiBvdmVycmlkZUF0dHJpYnV0ZUFwaShwcm90b3R5cGUpIHtcbiAgICBpZiAocHJvdG90eXBlLnNldEF0dHJpYnV0ZS5fcG9seWZpbGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgc2V0QXR0cmlidXRlID0gcHJvdG90eXBlLnNldEF0dHJpYnV0ZTtcbiAgICBwcm90b3R5cGUuc2V0QXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgIGNoYW5nZUF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUsIHZhbHVlLCBzZXRBdHRyaWJ1dGUpO1xuICAgIH07XG4gICAgdmFyIHJlbW92ZUF0dHJpYnV0ZSA9IHByb3RvdHlwZS5yZW1vdmVBdHRyaWJ1dGU7XG4gICAgcHJvdG90eXBlLnJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGNoYW5nZUF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUsIG51bGwsIHJlbW92ZUF0dHJpYnV0ZSk7XG4gICAgfTtcbiAgICBwcm90b3R5cGUuc2V0QXR0cmlidXRlLl9wb2x5ZmlsbGVkID0gdHJ1ZTtcbiAgfVxuICBmdW5jdGlvbiBjaGFuZ2VBdHRyaWJ1dGUobmFtZSwgdmFsdWUsIG9wZXJhdGlvbikge1xuICAgIG5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIG9sZFZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgb3BlcmF0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdmFyIG5ld1ZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgaWYgKHRoaXMuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrICYmIG5ld1ZhbHVlICE9PSBvbGRWYWx1ZSkge1xuICAgICAgdGhpcy5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaXNSZXNlcnZlZFRhZyhuYW1lKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXNlcnZlZFRhZ0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChuYW1lID09PSByZXNlcnZlZFRhZ0xpc3RbaV0pIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHZhciByZXNlcnZlZFRhZ0xpc3QgPSBbIFwiYW5ub3RhdGlvbi14bWxcIiwgXCJjb2xvci1wcm9maWxlXCIsIFwiZm9udC1mYWNlXCIsIFwiZm9udC1mYWNlLXNyY1wiLCBcImZvbnQtZmFjZS11cmlcIiwgXCJmb250LWZhY2UtZm9ybWF0XCIsIFwiZm9udC1mYWNlLW5hbWVcIiwgXCJtaXNzaW5nLWdseXBoXCIgXTtcbiAgZnVuY3Rpb24gYW5jZXN0cnkoZXh0bmRzKSB7XG4gICAgdmFyIGV4dGVuZGVlID0gZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24oZXh0bmRzKTtcbiAgICBpZiAoZXh0ZW5kZWUpIHtcbiAgICAgIHJldHVybiBhbmNlc3RyeShleHRlbmRlZS5leHRlbmRzKS5jb25jYXQoWyBleHRlbmRlZSBdKTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGZ1bmN0aW9uIHJlc29sdmVUYWdOYW1lKGRlZmluaXRpb24pIHtcbiAgICB2YXIgYmFzZVRhZyA9IGRlZmluaXRpb24uZXh0ZW5kcztcbiAgICBmb3IgKHZhciBpID0gMCwgYTsgYSA9IGRlZmluaXRpb24uYW5jZXN0cnlbaV07IGkrKykge1xuICAgICAgYmFzZVRhZyA9IGEuaXMgJiYgYS50YWc7XG4gICAgfVxuICAgIGRlZmluaXRpb24udGFnID0gYmFzZVRhZyB8fCBkZWZpbml0aW9uLl9fbmFtZTtcbiAgICBpZiAoYmFzZVRhZykge1xuICAgICAgZGVmaW5pdGlvbi5pcyA9IGRlZmluaXRpb24uX19uYW1lO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXNvbHZlUHJvdG90eXBlQ2hhaW4oZGVmaW5pdGlvbikge1xuICAgIGlmICghT2JqZWN0Ll9fcHJvdG9fXykge1xuICAgICAgdmFyIG5hdGl2ZVByb3RvdHlwZSA9IEhUTUxFbGVtZW50LnByb3RvdHlwZTtcbiAgICAgIGlmIChkZWZpbml0aW9uLmlzKSB7XG4gICAgICAgIHZhciBpbnN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkZWZpbml0aW9uLnRhZyk7XG4gICAgICAgIG5hdGl2ZVByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihpbnN0KTtcbiAgICAgIH1cbiAgICAgIHZhciBwcm90byA9IGRlZmluaXRpb24ucHJvdG90eXBlLCBhbmNlc3RvcjtcbiAgICAgIHZhciBmb3VuZFByb3RvdHlwZSA9IGZhbHNlO1xuICAgICAgd2hpbGUgKHByb3RvKSB7XG4gICAgICAgIGlmIChwcm90byA9PSBuYXRpdmVQcm90b3R5cGUpIHtcbiAgICAgICAgICBmb3VuZFByb3RvdHlwZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgYW5jZXN0b3IgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgICAgICBpZiAoYW5jZXN0b3IpIHtcbiAgICAgICAgICBwcm90by5fX3Byb3RvX18gPSBhbmNlc3RvcjtcbiAgICAgICAgfVxuICAgICAgICBwcm90byA9IGFuY2VzdG9yO1xuICAgICAgfVxuICAgICAgaWYgKCFmb3VuZFByb3RvdHlwZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oZGVmaW5pdGlvbi50YWcgKyBcIiBwcm90b3R5cGUgbm90IGZvdW5kIGluIHByb3RvdHlwZSBjaGFpbiBmb3IgXCIgKyBkZWZpbml0aW9uLmlzKTtcbiAgICAgIH1cbiAgICAgIGRlZmluaXRpb24ubmF0aXZlID0gbmF0aXZlUHJvdG90eXBlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBpbnN0YW50aWF0ZShkZWZpbml0aW9uKSB7XG4gICAgcmV0dXJuIHVwZ3JhZGVXaXRoRGVmaW5pdGlvbihkb21DcmVhdGVFbGVtZW50KGRlZmluaXRpb24udGFnKSwgZGVmaW5pdGlvbik7XG4gIH1cbiAgdmFyIHJlZ2lzdHJ5ID0ge307XG4gIGZ1bmN0aW9uIGdldFJlZ2lzdGVyZWREZWZpbml0aW9uKG5hbWUpIHtcbiAgICBpZiAobmFtZSkge1xuICAgICAgcmV0dXJuIHJlZ2lzdHJ5W25hbWUudG9Mb3dlckNhc2UoKV07XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlZ2lzdGVyRGVmaW5pdGlvbihuYW1lLCBkZWZpbml0aW9uKSB7XG4gICAgcmVnaXN0cnlbbmFtZV0gPSBkZWZpbml0aW9uO1xuICB9XG4gIGZ1bmN0aW9uIGdlbmVyYXRlQ29uc3RydWN0b3IoZGVmaW5pdGlvbikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBpbnN0YW50aWF0ZShkZWZpbml0aW9uKTtcbiAgICB9O1xuICB9XG4gIHZhciBIVE1MX05BTUVTUEFDRSA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiO1xuICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCB0YWcsIHR5cGVFeHRlbnNpb24pIHtcbiAgICBpZiAobmFtZXNwYWNlID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnQodGFnLCB0eXBlRXh0ZW5zaW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGRvbUNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIHRhZyk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQodGFnLCB0eXBlRXh0ZW5zaW9uKSB7XG4gICAgaWYgKHRhZykge1xuICAgICAgdGFnID0gdGFnLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuICAgIGlmICh0eXBlRXh0ZW5zaW9uKSB7XG4gICAgICB0eXBlRXh0ZW5zaW9uID0gdHlwZUV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgICB2YXIgZGVmaW5pdGlvbiA9IGdldFJlZ2lzdGVyZWREZWZpbml0aW9uKHR5cGVFeHRlbnNpb24gfHwgdGFnKTtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgaWYgKHRhZyA9PSBkZWZpbml0aW9uLnRhZyAmJiB0eXBlRXh0ZW5zaW9uID09IGRlZmluaXRpb24uaXMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBkZWZpbml0aW9uLmN0b3IoKTtcbiAgICAgIH1cbiAgICAgIGlmICghdHlwZUV4dGVuc2lvbiAmJiAhZGVmaW5pdGlvbi5pcykge1xuICAgICAgICByZXR1cm4gbmV3IGRlZmluaXRpb24uY3RvcigpO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgZWxlbWVudDtcbiAgICBpZiAodHlwZUV4dGVuc2lvbikge1xuICAgICAgZWxlbWVudCA9IGNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaXNcIiwgdHlwZUV4dGVuc2lvbik7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgZWxlbWVudCA9IGRvbUNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICBpZiAodGFnLmluZGV4T2YoXCItXCIpID49IDApIHtcbiAgICAgIGltcGxlbWVudFByb3RvdHlwZShlbGVtZW50LCBIVE1MRWxlbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG4gIHZhciBkb21DcmVhdGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudC5iaW5kKGRvY3VtZW50KTtcbiAgdmFyIGRvbUNyZWF0ZUVsZW1lbnROUyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUy5iaW5kKGRvY3VtZW50KTtcbiAgdmFyIGlzSW5zdGFuY2U7XG4gIGlmICghT2JqZWN0Ll9fcHJvdG9fXyAmJiAhdXNlTmF0aXZlKSB7XG4gICAgaXNJbnN0YW5jZSA9IGZ1bmN0aW9uKG9iaiwgY3Rvcikge1xuICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIGN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgcCA9IG9iajtcbiAgICAgIHdoaWxlIChwKSB7XG4gICAgICAgIGlmIChwID09PSBjdG9yLnByb3RvdHlwZSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHAgPSBwLl9fcHJvdG9fXztcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGlzSW5zdGFuY2UgPSBmdW5jdGlvbihvYmosIGJhc2UpIHtcbiAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBiYXNlO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gd3JhcERvbU1ldGhvZFRvRm9yY2VVcGdyYWRlKG9iaiwgbWV0aG9kTmFtZSkge1xuICAgIHZhciBvcmlnID0gb2JqW21ldGhvZE5hbWVdO1xuICAgIG9ialttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG4gPSBvcmlnLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB1cGdyYWRlQWxsKG4pO1xuICAgICAgcmV0dXJuIG47XG4gICAgfTtcbiAgfVxuICB3cmFwRG9tTWV0aG9kVG9Gb3JjZVVwZ3JhZGUoTm9kZS5wcm90b3R5cGUsIFwiY2xvbmVOb2RlXCIpO1xuICB3cmFwRG9tTWV0aG9kVG9Gb3JjZVVwZ3JhZGUoZG9jdW1lbnQsIFwiaW1wb3J0Tm9kZVwiKTtcbiAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50ID0gcmVnaXN0ZXI7XG4gIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgPSBjcmVhdGVFbGVtZW50O1xuICBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgPSBjcmVhdGVFbGVtZW50TlM7XG4gIHNjb3BlLnJlZ2lzdHJ5ID0gcmVnaXN0cnk7XG4gIHNjb3BlLmluc3RhbmNlb2YgPSBpc0luc3RhbmNlO1xuICBzY29wZS5yZXNlcnZlZFRhZ0xpc3QgPSByZXNlcnZlZFRhZ0xpc3Q7XG4gIHNjb3BlLmdldFJlZ2lzdGVyZWREZWZpbml0aW9uID0gZ2V0UmVnaXN0ZXJlZERlZmluaXRpb247XG4gIGRvY3VtZW50LnJlZ2lzdGVyID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50O1xufSk7XG5cbihmdW5jdGlvbihzY29wZSkge1xuICB2YXIgdXNlTmF0aXZlID0gc2NvcGUudXNlTmF0aXZlO1xuICB2YXIgaW5pdGlhbGl6ZU1vZHVsZXMgPSBzY29wZS5pbml0aWFsaXplTW9kdWxlcztcbiAgdmFyIGlzSUUgPSBzY29wZS5pc0lFO1xuICBpZiAodXNlTmF0aXZlKSB7XG4gICAgdmFyIG5vcCA9IGZ1bmN0aW9uKCkge307XG4gICAgc2NvcGUud2F0Y2hTaGFkb3cgPSBub3A7XG4gICAgc2NvcGUudXBncmFkZSA9IG5vcDtcbiAgICBzY29wZS51cGdyYWRlQWxsID0gbm9wO1xuICAgIHNjb3BlLnVwZ3JhZGVEb2N1bWVudFRyZWUgPSBub3A7XG4gICAgc2NvcGUudXBncmFkZVN1YnRyZWUgPSBub3A7XG4gICAgc2NvcGUudGFrZVJlY29yZHMgPSBub3A7XG4gICAgc2NvcGUuaW5zdGFuY2VvZiA9IGZ1bmN0aW9uKG9iaiwgYmFzZSkge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIGJhc2U7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBpbml0aWFsaXplTW9kdWxlcygpO1xuICB9XG4gIHZhciB1cGdyYWRlRG9jdW1lbnRUcmVlID0gc2NvcGUudXBncmFkZURvY3VtZW50VHJlZTtcbiAgdmFyIHVwZ3JhZGVEb2N1bWVudCA9IHNjb3BlLnVwZ3JhZGVEb2N1bWVudDtcbiAgaWYgKCF3aW5kb3cud3JhcCkge1xuICAgIGlmICh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpIHtcbiAgICAgIHdpbmRvdy53cmFwID0gd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsLndyYXBJZk5lZWRlZDtcbiAgICAgIHdpbmRvdy51bndyYXAgPSB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwudW53cmFwSWZOZWVkZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy53cmFwID0gd2luZG93LnVud3JhcCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuICBpZiAod2luZG93LkhUTUxJbXBvcnRzKSB7XG4gICAgd2luZG93LkhUTUxJbXBvcnRzLl9faW1wb3J0c1BhcnNpbmdIb29rID0gZnVuY3Rpb24oZWx0KSB7XG4gICAgICBpZiAoZWx0LmltcG9ydCkge1xuICAgICAgICB1cGdyYWRlRG9jdW1lbnQod3JhcChlbHQuaW1wb3J0KSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBib290c3RyYXAoKSB7XG4gICAgdXBncmFkZURvY3VtZW50VHJlZSh3aW5kb3cud3JhcChkb2N1bWVudCkpO1xuICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cy5yZWFkeSA9IHRydWU7XG4gICAgdmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgZnVuY3Rpb24oZikge1xuICAgICAgc2V0VGltZW91dChmLCAxNik7XG4gICAgfTtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cuQ3VzdG9tRWxlbWVudHMucmVhZHlUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgaWYgKHdpbmRvdy5IVE1MSW1wb3J0cykge1xuICAgICAgICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cy5lbGFwc2VkID0gd2luZG93LkN1c3RvbUVsZW1lbnRzLnJlYWR5VGltZSAtIHdpbmRvdy5IVE1MSW1wb3J0cy5yZWFkeVRpbWU7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJXZWJDb21wb25lbnRzUmVhZHlcIiwge1xuICAgICAgICAgIGJ1YmJsZXM6IHRydWVcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIiB8fCBzY29wZS5mbGFncy5lYWdlcikge1xuICAgIGJvb3RzdHJhcCgpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiaW50ZXJhY3RpdmVcIiAmJiAhd2luZG93LmF0dGFjaEV2ZW50ICYmICghd2luZG93LkhUTUxJbXBvcnRzIHx8IHdpbmRvdy5IVE1MSW1wb3J0cy5yZWFkeSkpIHtcbiAgICBib290c3RyYXAoKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbG9hZEV2ZW50ID0gd2luZG93LkhUTUxJbXBvcnRzICYmICF3aW5kb3cuSFRNTEltcG9ydHMucmVhZHkgPyBcIkhUTUxJbXBvcnRzTG9hZGVkXCIgOiBcIkRPTUNvbnRlbnRMb2FkZWRcIjtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihsb2FkRXZlbnQsIGJvb3RzdHJhcCk7XG4gIH1cbn0pKHdpbmRvdy5DdXN0b21FbGVtZW50cyk7XG5cbihmdW5jdGlvbihzY29wZSkge1xuICBpZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gICAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbihzY29wZSkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJnczIgPSBhcmdzLnNsaWNlKCk7XG4gICAgICAgIGFyZ3MyLnB1c2guYXBwbHkoYXJnczIsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBzZWxmLmFwcGx5KHNjb3BlLCBhcmdzMik7XG4gICAgICB9O1xuICAgIH07XG4gIH1cbn0pKHdpbmRvdy5XZWJDb21wb25lbnRzKTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBcIlwiICsgXCJib2R5IHtcIiArIFwidHJhbnNpdGlvbjogb3BhY2l0eSBlYXNlLWluIDAuMnM7XCIgKyBcIiB9IFxcblwiICsgXCJib2R5W3VucmVzb2x2ZWRdIHtcIiArIFwib3BhY2l0eTogMDsgZGlzcGxheTogYmxvY2s7IG92ZXJmbG93OiBoaWRkZW47IHBvc2l0aW9uOiByZWxhdGl2ZTtcIiArIFwiIH0gXFxuXCI7XG4gIHZhciBoZWFkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImhlYWRcIik7XG4gIGhlYWQuaW5zZXJ0QmVmb3JlKHN0eWxlLCBoZWFkLmZpcnN0Q2hpbGQpO1xufSkod2luZG93LldlYkNvbXBvbmVudHMpO1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgd2luZG93LlBsYXRmb3JtID0gc2NvcGU7XG59KSh3aW5kb3cuV2ViQ29tcG9uZW50cyk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy93ZWJjb21wb25lbnRzLmpzL3dlYmNvbXBvbmVudHMuanNcIixcIi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvd2ViY29tcG9uZW50cy5qc1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBQbkJhc2VFbGVtZW50ID0ge307XG52YXIgZWxlbWVudHMgPSB7fTtcblxuUG5CYXNlRWxlbWVudC5jcmVhdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wb2x5bWVyTmF0aXZlID0ge307XG4gICAgdGhpcy5wb2x5bWVyTmF0aXZlLmlkID0gcG9seW1lck5hdGl2ZUNsaWVudC51dGlscy5nZXROZXh0SWQoKTtcbiAgICBlbGVtZW50c1t0aGlzLnBvbHltZXJOYXRpdmUuaWRdID0gdGhpcztcbn07XG5cblBuQmFzZUVsZW1lbnQuYXR0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi51cGRhdGVTZXJpYWxpemVkUHJvcGVydGllcygpO1xuICAgIGlmICh3aW5kb3cucG9seW1lck5hdGl2ZUhvc3QpIHtcbiAgICAgICAgc2VsZi5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgICAgIHBvbHltZXJOYXRpdmVIb3N0LmNyZWF0ZUVsZW1lbnQoc2VsZi5wb2x5bWVyTmF0aXZlLnNlcmlhbGl6ZWRQcm9wZXJ0aWVzKTtcbiAgICB9XG59O1xuXG5QbkJhc2VFbGVtZW50LmRldGFjaGVkQ2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHdpbmRvdy5wb2x5bWVyTmF0aXZlSG9zdCkge1xuICAgICAgICBwb2x5bWVyTmF0aXZlSG9zdC5yZW1vdmVFbGVtZW50KHRoaXMucG9seW1lck5hdGl2ZS5pZCk7XG4gICAgfVxufTtcblxuUG5CYXNlRWxlbWVudC51cGRhdGUgPSBmdW5jdGlvbiAocmVjdXJzaXZlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYudXBkYXRlU2VyaWFsaXplZFByb3BlcnRpZXMoKTtcbiAgICAgICAgaWYgKHdpbmRvdy5wb2x5bWVyTmF0aXZlSG9zdCkge1xuICAgICAgICAgICAgcG9seW1lck5hdGl2ZUhvc3QudXBkYXRlRWxlbWVudChzZWxmLnBvbHltZXJOYXRpdmUuc2VyaWFsaXplZFByb3BlcnRpZXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWN1cnNpdmUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkTm9kZSA9IHNlbGYuY2hpbGROb2Rlc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGROb2RlLnBvbHltZXJOYXRpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGROb2RlLnVwZGF0ZShyZWN1cnNpdmUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIDApXG59O1xuXG5QbkJhc2VFbGVtZW50LnVwZGF0ZVNlcmlhbGl6ZWRQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucG9seW1lck5hdGl2ZS5zZXJpYWxpemVkUHJvcGVydGllcyA9IEpTT04uc3RyaW5naWZ5KHBvbHltZXJOYXRpdmVDbGllbnQudXRpbHMuZ2V0RWxlbWVudFByb3BlcnRpZXModGhpcykpO1xufTtcblxuUG5CYXNlRWxlbWVudC5nZXRQTlBhcmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQYXJlbnQoZnVuY3Rpb24ocGFyZW50KXtcbiAgICAgICAgcmV0dXJuIHBhcmVudCAmJiBwYXJlbnQucG9seW1lck5hdGl2ZTtcbiAgICB9KTtcbn07XG5cblBuQmFzZUVsZW1lbnQuZ2V0UGFyZW50ID0gZnVuY3Rpb24gKHByZWRpY2F0ZSkge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzO1xuXG4gICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcblxuICAgICAgICBpZiAocHJlZGljYXRlKHBhcmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJlbnQ7XG4gICAgICAgIH0gZWxzZSBpZiAocGFyZW50ID09PSB3aW5kb3cuZG9jdW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxufTtcblxud2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudCB8fCB7fTtcbndpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50LmVsZW1lbnRzID0gZWxlbWVudHM7XG53aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC5QbkJhc2VFbGVtZW50ID0gUG5CYXNlRWxlbWVudDtcblxuXG4vL0dsb2JhbCBvYnNlcnZlcnNcblxuUG5CYXNlRWxlbWVudC5vblJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGZvciAodmFyIGVsZW1lbnRJZCBpbiB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC5lbGVtZW50cykge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC5lbGVtZW50c1tlbGVtZW50SWRdO1xuICAgICAgICAgICAgZWxlbWVudC51cGRhdGUoKTtcbiAgICAgICAgfVxuICAgIH0sIDApO1xufTtcblxuUG5CYXNlRWxlbWVudC5vbk11dGF0aW9ucyA9IGZ1bmN0aW9uIChtdXRhdGlvbnMpIHtcbiAgICBjb25zb2xlLmxvZygnR2V0IG11dGF0aW9ucycpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBtdXRhdGlvbiA9IG11dGF0aW9uc1tpXTtcblxuICAgICAgICBjb25zb2xlLmxvZygnTXV0YXRlZCAnICsgbXV0YXRpb24udGFyZ2V0LnRhZ05hbWUpO1xuXG4gICAgICAgIHZhciBzdHJ1Y3R1cmVDaGFuZ2VkID0gbXV0YXRpb24ucmVtb3ZlZE5vZGVzLmxlbmd0aCB8fCBtdXRhdGlvbi5hZGRlZE5vZGVzLmxlbmd0aDtcblxuICAgICAgICBpZiAobXV0YXRpb24udGFyZ2V0LnBvbHltZXJOYXRpdmUpIHtcbiAgICAgICAgICAgIG11dGF0aW9uLnRhcmdldC51cGRhdGUoc3RydWN0dXJlQ2hhbmdlZCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5QbkJhc2VFbGVtZW50LmluaXRpYWxpemVPYnNlcnZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgIGNoYXJhY3RlckRhdGE6IHRydWUsXG4gICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgYXR0cmlidXRlczogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgdGhpcy5vYnNlcnZlciA9IHRoaXMub2JzZXJ2ZXIgfHwgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoUG5CYXNlRWxlbWVudC5vbk11dGF0aW9ucyk7XG4gICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIGNvbmZpZyk7XG59O1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIFBuQmFzZUVsZW1lbnQuaW5pdGlhbGl6ZU9ic2VydmVyKTtcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIFBuQmFzZUVsZW1lbnQub25SZXNpemUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBuQmFzZUVsZW1lbnQ7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2VsZW1lbnRzL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzXCIsXCIvZWxlbWVudHMvYmFzZVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBQbkJhc2VFbGVtZW50ID0gcmVxdWlyZSgnLi9wbi1iYXNlLWVsZW1lbnQuanMnKTtcbnZhciBQblV0aWxzID0gcmVxdWlyZSgnLi4vLi4vcG4tdXRpbHMuanMnKTtcblxudmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRGl2RWxlbWVudC5wcm90b3R5cGUpO1xucHJvdG8gPSBPYmplY3QuYXNzaWduKHByb3RvLCBQbkJhc2VFbGVtZW50KTtcblxuUG5VdGlscy5yZWdpc3RlcigndmlldycsIHtcbiAgICBwcm90b3R5cGU6IHByb3RvXG59KTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwia200VW1mXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZWxlbWVudHMvYmFzZS9wbi12aWV3LmpzXCIsXCIvZWxlbWVudHMvYmFzZVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBQbkJhc2VFbGVtZW50ID0gcmVxdWlyZSgnLi9iYXNlL3BuLWJhc2UtZWxlbWVudC5qcycpO1xudmFyIFBuVXRpbHMgPSByZXF1aXJlKCcuLi9wbi11dGlscy5qcycpO1xuXG52YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxCdXR0b25FbGVtZW50LnByb3RvdHlwZSk7XG5wcm90byA9IE9iamVjdC5hc3NpZ24ocHJvdG8sIFBuQmFzZUVsZW1lbnQpO1xuXG5QblV0aWxzLnJlZ2lzdGVyKCdidXR0b24nLCB7XG4gICAgZXh0ZW5kczogJ2J1dHRvbicsXG4gICAgcHJvdG90eXBlOiBwcm90b1xufSk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2VsZW1lbnRzL3BuLWJ1dHRvbi5qc1wiLFwiL2VsZW1lbnRzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzJyk7XG52YXIgUG5VdGlscyA9IHJlcXVpcmUoJy4uL3BuLXV0aWxzLmpzJyk7XG5cbnZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTElucHV0RWxlbWVudC5wcm90b3R5cGUpO1xucHJvdG8gPSBPYmplY3QuYXNzaWduKHByb3RvLCBQbkJhc2VFbGVtZW50KTtcblxucHJvdG8uY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIFBuQmFzZUVsZW1lbnQuY3JlYXRlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xufVxuXG5wcm90by5hdHRhY2hlZENhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIFBuQmFzZUVsZW1lbnQuYXR0YWNoZWRDYWxsYmFjay5hcHBseSh0aGlzKTtcbn1cblxucHJvdG8uc2V0Q2hlY2tlZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuY2hlY2tlZCA9IHZhbHVlO1xufVxuXG5QblV0aWxzLnJlZ2lzdGVyKCdjaGVja2JveCcsIHtcbiAgICBleHRlbmRzOiAnaW5wdXQnLFxuICAgIHByb3RvdHlwZTogcHJvdG9cbn0pO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9lbGVtZW50cy9wbi1jaGVja2JveC5qc1wiLFwiL2VsZW1lbnRzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzJyk7XG52YXIgUG5VdGlscyA9IHJlcXVpcmUoJy4uL3BuLXV0aWxzLmpzJyk7XG5cbnZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEltYWdlRWxlbWVudC5wcm90b3R5cGUpO1xucHJvdG8gPSBPYmplY3QuYXNzaWduKHByb3RvLCBQbkJhc2VFbGVtZW50KTtcblxucHJvdG8uY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIFBuQmFzZUVsZW1lbnQuY3JlYXRlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xufVxuXG5wcm90by5hdHRhY2hlZENhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuXG4gICAgUG5CYXNlRWxlbWVudC5hdHRhY2hlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xuICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIFBuQmFzZUVsZW1lbnQuYXR0YWNoZWRDYWxsYmFjay5iaW5kKHRoaXMpKTtcbn1cblxuUG5VdGlscy5yZWdpc3RlcignaW1hZ2UnLCB7XG4gICAgZXh0ZW5kczogJ2ltZycsXG4gICAgcHJvdG90eXBlOiBwcm90b1xufSk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2VsZW1lbnRzL3BuLWltZy5qc1wiLFwiL2VsZW1lbnRzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzJyk7XG52YXIgUG5VdGlscyA9IHJlcXVpcmUoJy4uL3BuLXV0aWxzLmpzJyk7XG5cbnZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTElucHV0RWxlbWVudC5wcm90b3R5cGUpO1xucHJvdG8gPSBPYmplY3QuYXNzaWduKHByb3RvLCBQbkJhc2VFbGVtZW50KTtcblxucHJvdG8uY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIFBuQmFzZUVsZW1lbnQuY3JlYXRlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xufVxuXG5wcm90by5zZXRWYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn1cblxucHJvdG8uc2V0Rm9jdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coJ0ZvY3VzZWQgJyArIHRoaXMucG9seW1lck5hdGl2ZS5pZCk7XG4gICAgdGhpcy5mb2N1cygpO1xuICAgIHRoaXMudXBkYXRlKCk7XG59XG5cblBuVXRpbHMucmVnaXN0ZXIoJ2lucHV0Jywge1xuICAgIGV4dGVuZHM6ICdpbnB1dCcsXG4gICAgcHJvdG90eXBlOiBwcm90b1xufSk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2VsZW1lbnRzL3BuLWlucHV0LmpzXCIsXCIvZWxlbWVudHNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgUG5CYXNlRWxlbWVudCA9IHJlcXVpcmUoJy4vYmFzZS9wbi1iYXNlLWVsZW1lbnQuanMnKTtcbnZhciBQblV0aWxzID0gcmVxdWlyZSgnLi4vcG4tdXRpbHMuanMnKTtcblxudmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRGl2RWxlbWVudC5wcm90b3R5cGUpO1xucHJvdG8gPSBPYmplY3QuYXNzaWduKHByb3RvLCBQbkJhc2VFbGVtZW50KTtcblxuUG5VdGlscy5yZWdpc3RlcignbGFiZWwnLCB7XG4gICAgcHJvdG90eXBlOiBwcm90b1xufSk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2VsZW1lbnRzL3BuLWxhYmVsLmpzXCIsXCIvZWxlbWVudHNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgUG5CYXNlRWxlbWVudCA9IHJlcXVpcmUoJy4vYmFzZS9wbi1iYXNlLWVsZW1lbnQuanMnKTtcbnZhciBQblV0aWxzID0gcmVxdWlyZSgnLi4vcG4tdXRpbHMuanMnKTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpe1xuXG4gICAgdmFyIGJvZHlFbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcbiAgICBib2R5RWxlbWVudC5wb2x5bWVyTmF0aXZlID0ge307XG4gICAgYm9keUVsZW1lbnQucG9seW1lck5hdGl2ZS5pZCA9ICdyb290JztcblxuICAgIHZhciBib2R5UHJvcHMgPSBQblV0aWxzLmdldEVsZW1lbnRQcm9wZXJ0aWVzKGJvZHlFbGVtZW50KTtcbiAgICBib2R5UHJvcHMudGFnTmFtZSA9ICdwbi1yb290JztcblxuICAgIGNvbnNvbGUubG9nKCdVcGRhdGluZyByb290IHZpZXcnKTtcblxuICAgIGlmICh3aW5kb3cucG9seW1lck5hdGl2ZUhvc3QpIHtcbiAgICAgICAgcG9seW1lck5hdGl2ZUhvc3QudXBkYXRlRWxlbWVudChKU09OLnN0cmluZ2lmeShib2R5UHJvcHMpKTtcbiAgICB9XG5cbiAgICB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC5lbGVtZW50c1sncm9vdCddID0gdGhpcztcbn0pO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9lbGVtZW50cy9wbi1yb290dmlldy5qc1wiLFwiL2VsZW1lbnRzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIHBhdGhUb1JlZ2V4cCA9IHJlcXVpcmUoJ3BhdGgtdG8tcmVnZXhwJyk7XG52YXIgUG5CYXNlRWxlbWVudCA9IHJlcXVpcmUoJy4uL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzJyk7XG52YXIgUG5VdGlscyA9IHJlcXVpcmUoJy4uLy4uL3BuLXV0aWxzLmpzJyk7XG5cbnZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTERpdkVsZW1lbnQucHJvdG90eXBlKTtcbnByb3RvID0gT2JqZWN0LmFzc2lnbihwcm90bywgUG5CYXNlRWxlbWVudCk7XG5cbnByb3RvLmNyZWF0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICBQbkJhc2VFbGVtZW50LmNyZWF0ZWRDYWxsYmFjay5hcHBseSh0aGlzKTtcbiAgICAvL3RoaXMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbn1cblxuUG5VdGlscy5yZWdpc3RlcignbmF2YmFyJywge1xuICAgIHByb3RvdHlwZTogcHJvdG9cbn0pO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9lbGVtZW50cy9yb3V0ZXIvcG4tbmF2YmFyLmpzXCIsXCIvZWxlbWVudHMvcm91dGVyXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFJlYmVsUm91dGUgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcmViZWwtcm91dGVyL2VzNS9yZWJlbC1yb3V0ZXIuanMnKS5SZWJlbFJvdXRlO1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuLi9iYXNlL3BuLWJhc2UtZWxlbWVudC5qcycpO1xudmFyIFBuVXRpbHMgPSByZXF1aXJlKCcuLi8uLi9wbi11dGlscy5qcycpO1xuXG52YXIgUm91dGUgPSAoZnVuY3Rpb24gKF9SZWJlbFJvdXRlKSB7XG5cbiAgICBSb3V0ZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKF9SZWJlbFJvdXRlLnByb3RvdHlwZSk7XG4gICAgUm91dGUucHJvdG90eXBlID0gT2JqZWN0LmFzc2lnbihSb3V0ZS5wcm90b3R5cGUsIFBuQmFzZUVsZW1lbnQpO1xuXG4gICAgZnVuY3Rpb24gUm91dGUoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUm91dGUpLmFwcGx5KHRoaXMpO1xuICAgIH1cblxuICAgIFJvdXRlLnByb3RvdHlwZS5jcmVhdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgUG5CYXNlRWxlbWVudC5jcmVhdGVkQ2FsbGJhY2suYXBwbHkodGhpcyk7XG4gICAgfTtcblxuICAgIFJvdXRlLnByb3RvdHlwZS5hdHRhY2hlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2NvcGUgPSB0aGlzO1xuICAgICAgICBQbkJhc2VFbGVtZW50LmF0dGFjaGVkQ2FsbGJhY2suYXBwbHkodGhpcyk7XG4gICAgICAgIGlmICh3aW5kb3cucG9seW1lck5hdGl2ZUhvc3QpIHtcbiAgICAgICAgICAgIHdpbmRvdy5wb2x5bWVyTmF0aXZlSG9zdC5hY3RpdmF0ZVJvdXRlKCRzY29wZS5wb2x5bWVyTmF0aXZlLmlkKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBSb3V0ZS5wcm90b3R5cGUuZGV0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBQbkJhc2VFbGVtZW50LmRldGFjaGVkQ2FsbGJhY2suYXBwbHkodGhpcyk7XG4gICAgfTtcblxuICAgIHJldHVybiBSb3V0ZTtcblxufSkoUmViZWxSb3V0ZSk7XG5cblBuVXRpbHMucmVnaXN0ZXIoJ3JvdXRlJywge1xuICAgIHByb3RvdHlwZTogUm91dGUucHJvdG90eXBlXG59KTtcblxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2VsZW1lbnRzL3JvdXRlci9wbi1yb3V0ZS5qc1wiLFwiL2VsZW1lbnRzL3JvdXRlclwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBSZWJlbFJvdXRlciA9IHJlcXVpcmUoJy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9yZWJlbC1yb3V0ZXIvZXM1L3JlYmVsLXJvdXRlci5qcycpLlJlYmVsUm91dGVyO1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuLi9iYXNlL3BuLWJhc2UtZWxlbWVudC5qcycpO1xudmFyIFBuVXRpbHMgPSByZXF1aXJlKCcuLi8uLi9wbi11dGlscy5qcycpO1xuXG4vL3BvbHltZXJOYXRpdmVDbGllbnQgc2hvdWxkIGJlIGdsb2JhbCB0byBiZSBhYmxlIHRvIGNhbGwgaXQgZnJvbSBuYXRpdmUgY29kZVxud2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudCB8fCB7fTtcblxudmFyIFJvdXRlciA9IChmdW5jdGlvbiAoX1JlYmVsUm91dGVyKSB7XG5cbiAgICBSb3V0ZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShfUmViZWxSb3V0ZXIucHJvdG90eXBlKTtcbiAgICBSb3V0ZXIucHJvdG90eXBlID0gT2JqZWN0LmFzc2lnbihSb3V0ZXIucHJvdG90eXBlLCBQbkJhc2VFbGVtZW50KTtcblxuICAgIGZ1bmN0aW9uIFJvdXRlcigpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZihSb3V0ZXIpLmFwcGx5KHRoaXMpO1xuICAgIH1cblxuICAgIFJvdXRlci5wcm90b3R5cGUuY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFBuQmFzZUVsZW1lbnQuY3JlYXRlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xuICAgICAgICBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUm91dGVyLnByb3RvdHlwZSkuY3JlYXRlZENhbGxiYWNrLmNhbGwodGhpcywgXCJuYXRpdmVcIik7XG4gICAgfTtcblxuICAgIFJvdXRlci5wcm90b3R5cGUuYXR0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBQbkJhc2VFbGVtZW50LmF0dGFjaGVkQ2FsbGJhY2suYXBwbHkodGhpcyk7XG4gICAgfTtcblxuICAgIHJldHVybiBSb3V0ZXI7XG5cbn0pKFJlYmVsUm91dGVyKTtcblxudmFyIHN5bmNpbmdIaXN0b3J5V2l0aE5hdGl2ZSA9IGZhbHNlO1xud2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQuYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICBzeW5jaW5nSGlzdG9yeVdpdGhOYXRpdmUgPSB0cnVlO1xuICAgIHdpbmRvdy5oaXN0b3J5LmJhY2soKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIHN5bmNpbmdIaXN0b3J5V2l0aE5hdGl2ZSA9IGZhbHNlO1xuICAgIH0sIDApO1xufTtcblxuUG5VdGlscy5yZWdpc3Rlcigncm91dGVyJywge1xuICAgIHByb3RvdHlwZTogUm91dGVyLnByb3RvdHlwZVxufSk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2VsZW1lbnRzL3JvdXRlci9wbi1yb3V0ZXIuanNcIixcIi9lbGVtZW50cy9yb3V0ZXJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG5yZXF1aXJlKCd3ZWJjb21wb25lbnRzLmpzJyk7XG5yZXF1aXJlKCcuL3BuLXV0aWxzLmpzJyk7XG5yZXF1aXJlKCcuL2VsZW1lbnRzL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzJyk7XG5yZXF1aXJlKCcuL2VsZW1lbnRzL2Jhc2UvcG4tdmlldy5qcycpO1xucmVxdWlyZSgnLi9lbGVtZW50cy9wbi1yb290dmlldy5qcycpO1xucmVxdWlyZSgnLi9lbGVtZW50cy9wbi1pbWcuanMnKTtcbnJlcXVpcmUoJy4vZWxlbWVudHMvcG4tbGFiZWwuanMnKTtcbnJlcXVpcmUoJy4vZWxlbWVudHMvcG4tYnV0dG9uLmpzJyk7XG5yZXF1aXJlKCcuL2VsZW1lbnRzL3BuLWlucHV0LmpzJyk7XG5yZXF1aXJlKCcuL2VsZW1lbnRzL3BuLWNoZWNrYm94LmpzJyk7XG5yZXF1aXJlKCcuL2VsZW1lbnRzL3JvdXRlci9wbi1yb3V0ZS5qcycpO1xucmVxdWlyZSgnLi9lbGVtZW50cy9yb3V0ZXIvcG4tcm91dGVyLmpzJyk7XG5yZXF1aXJlKCcuL2VsZW1lbnRzL3JvdXRlci9wbi1uYXZiYXIuanMnKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwia200VW1mXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZmFrZV8xYmNiOWE4Ni5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBwb2x5bWVyTmF0aXZlT2JqZWN0SWQgPSAwO1xuXG52YXIgdXRpbHMgPSB7XG5cbiAgICBkcm9wSWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG9seW1lck5hdGl2ZU9iamVjdElkID0gMDtcbiAgICB9LFxuXG4gICAgZ2V0TmV4dElkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBwb2x5bWVyTmF0aXZlT2JqZWN0SWQrKyArICcnO1xuICAgIH0sXG5cbiAgICBnZXRFbGVtZW50UHJvcGVydGllczogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGlkID0gZWxlbWVudC5wb2x5bWVyTmF0aXZlLmlkO1xuICAgICAgICB2YXIgdGFnTmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdpcycpIHx8IGVsZW1lbnQudGFnTmFtZTtcbiAgICAgICAgdmFyIHBhcmVudCA9IGVsZW1lbnQuZ2V0UE5QYXJlbnQgJiYgZWxlbWVudC5nZXRQTlBhcmVudCgpO1xuICAgICAgICB2YXIgcGFyZW50SWQgPSBwYXJlbnQgPyBwYXJlbnQucG9seW1lck5hdGl2ZS5pZCA6IG51bGw7XG4gICAgICAgIHZhciBib3VuZHMgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB2YXIgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcbiAgICAgICAgdmFyIHRleHQgPSBlbGVtZW50LnRleHRDb250ZW50LnJlcGxhY2UoL1xcc3syLH0vZywnJyk7XG4gICAgICAgIHZhciBzcmMgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgIHZhciB2YWx1ZSA9IGVsZW1lbnQudmFsdWU7XG4gICAgICAgIHZhciBwbGFjZWhvbGRlciA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpO1xuICAgICAgICB2YXIgYXR0cmlidXRlcyA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudC5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYXR0cmlidXRlTmFtZSA9IGVsZW1lbnQuYXR0cmlidXRlc1tpXS5uYW1lO1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgIT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXR0cmlidXRlVmFsdWUgPSBlbGVtZW50LmF0dHJpYnV0ZXNbaV0udmFsdWU7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSA9IGF0dHJpYnV0ZVZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudEJvdW5kcyA9IHBhcmVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGJvdW5kcyA9IHtcbiAgICAgICAgICAgICAgICB3aWR0aDogYm91bmRzLndpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogYm91bmRzLmhlaWdodCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBzdHlsZS5wb3NpdGlvbiA9PT0gJ2ZpeGVkJyA/IGJvdW5kcy5sZWZ0IDogYm91bmRzLmxlZnQgLSBwYXJlbnRCb3VuZHMubGVmdCxcbiAgICAgICAgICAgICAgICB0b3A6IHN0eWxlLnBvc2l0aW9uID09PSAnZml4ZWQnID8gYm91bmRzLnRvcCA6IGJvdW5kcy50b3AgLSBwYXJlbnRCb3VuZHMudG9wXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnVXBkYXRpbmcgJyArIGVsZW1lbnQudGFnTmFtZSArICcsIGlkPScgKyBpZCArICcsIHRvICcgKyAocGFyZW50ID8gcGFyZW50LnRhZ05hbWUgOiAncm9vdCcpICsgJyAnICsgcGFyZW50SWQgKyAnLCBzaXplPScgKyBib3VuZHMud2lkdGggKyAneCcgKyBib3VuZHMuaGVpZ2h0ICsgJywgcG9zaXRpb249JyArIGJvdW5kcy5sZWZ0ICsgJywnICsgYm91bmRzLnRvcCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICAgICAgICBib3VuZHM6IGJvdW5kcyxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMsXG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IHN0eWxlLmRpc3BsYXksXG4gICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogc3R5bGUudmlzaWJpbGl0eSxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHN0eWxlLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2U6IHN0eWxlLmJhY2tncm91bmRJbWFnZSA9PT0gJ25vbmUnID8gdW5kZWZpbmVkIDogc3R5bGUuYmFja2dyb3VuZEltYWdlLnJlcGxhY2UoJ3VybCgnLCcnKS5yZXBsYWNlKCcpJywnJyksXG4gICAgICAgICAgICAgICAgZm9udFNpemU6IHN0eWxlLmZvbnRTaXplLFxuICAgICAgICAgICAgICAgIGNvbG9yOiBzdHlsZS5jb2xvcixcbiAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IHN0eWxlLmJvcmRlclJhZGl1cyxcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogc3R5bGUuYm9yZGVyQ29sb3IsXG4gICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IHN0eWxlLmJvcmRlcldpZHRoLFxuICAgICAgICAgICAgICAgIHRleHRBbGlnbjogc3R5bGUudGV4dEFsaWduLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBzdHlsZS5wb3NpdGlvbixcbiAgICAgICAgICAgICAgICBwYWRkaW5nTGVmdDogc3R5bGUucGFkZGluZ0xlZnQsXG4gICAgICAgICAgICAgICAgcGFkZGluZ1JpZ2h0OiBzdHlsZS5wYWRkaW5nUmlnaHQsXG4gICAgICAgICAgICAgICAgcGFkZGluZ1RvcDogc3R5bGUucGFkZGluZ1RvcCxcbiAgICAgICAgICAgICAgICBwYWRkaW5nQm90dG9tOiBzdHlsZS5wYWRkaW5nQm90dG9tXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGV4dDogdGV4dCxcbiAgICAgICAgICAgIHNyYzogc3JjLFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IHBsYWNlaG9sZGVyLFxuICAgICAgICAgICAgcGFyZW50SWQ6IHBhcmVudElkXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0RWxlbWVudEJ5SWQ6IGZ1bmN0aW9uIChlbGVtZW50SWQpIHtcbiAgICAgICAgcmV0dXJuIHBvbHltZXJOYXRpdmVDbGllbnQuZWxlbWVudHNbZWxlbWVudElkXTtcbiAgICB9LFxuXG4gICAgY2FsbE1ldGhvZDogZnVuY3Rpb24gKGVsZW1lbnRJZCwgbWV0aG9kTmFtZSwgYXJndW1lbnQpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC51dGlscy5nZXRFbGVtZW50QnlJZChlbGVtZW50SWQpO1xuICAgICAgICBlbGVtZW50W21ldGhvZE5hbWVdLmNhbGwoZWxlbWVudCwgYXJndW1lbnQpO1xuICAgIH0sXG5cbiAgICBkaXNwYXRjaEV2ZW50OiBmdW5jdGlvbiAoZWxlbWVudElkLCBldmVudE5hbWUsIGRhdGEpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC51dGlscy5nZXRFbGVtZW50QnlJZChlbGVtZW50SWQpO1xuICAgICAgICB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC51dGlscy5maXJlRXZlbnQoZWxlbWVudCwgZXZlbnROYW1lKTtcbiAgICB9LFxuXG4gICAgZmlyZUV2ZW50OiBmdW5jdGlvbiAobm9kZSwgZXZlbnROYW1lKSB7XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSB1c2UgdGhlIG93bmVyRG9jdW1lbnQgZnJvbSB0aGUgcHJvdmlkZWQgbm9kZSB0byBhdm9pZCBjcm9zcy13aW5kb3cgcHJvYmxlbXNcbiAgICAgICAgdmFyIGRvYztcbiAgICAgICAgaWYgKG5vZGUub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgZG9jID0gbm9kZS5vd25lckRvY3VtZW50O1xuICAgICAgICB9IGVsc2UgaWYgKG5vZGUubm9kZVR5cGUgPT0gOSkge1xuICAgICAgICAgICAgLy8gdGhlIG5vZGUgbWF5IGJlIHRoZSBkb2N1bWVudCBpdHNlbGYsIG5vZGVUeXBlIDkgPSBET0NVTUVOVF9OT0RFXG4gICAgICAgICAgICBkb2MgPSBub2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBub2RlIHBhc3NlZCB0byBmaXJlRXZlbnQ6IFwiICsgbm9kZS5pZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZS5kaXNwYXRjaEV2ZW50KSB7XG4gICAgICAgICAgICAvLyBHZWNrby1zdHlsZSBhcHByb2FjaCAobm93IHRoZSBzdGFuZGFyZCkgdGFrZXMgbW9yZSB3b3JrXG4gICAgICAgICAgICB2YXIgZXZlbnRDbGFzcyA9IFwiXCI7XG5cbiAgICAgICAgICAgIC8vIERpZmZlcmVudCBldmVudHMgaGF2ZSBkaWZmZXJlbnQgZXZlbnQgY2xhc3Nlcy5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgc3dpdGNoIHN0YXRlbWVudCBjYW4ndCBtYXAgYW4gZXZlbnROYW1lIHRvIGFuIGV2ZW50Q2xhc3MsXG4gICAgICAgICAgICAvLyB0aGUgZXZlbnQgZmlyaW5nIGlzIGdvaW5nIHRvIGZhaWwuXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJjbGlja1wiOiAvLyBEaXNwYXRjaGluZyBvZiAnY2xpY2snIGFwcGVhcnMgdG8gbm90IHdvcmsgY29ycmVjdGx5IGluIFNhZmFyaS4gVXNlICdtb3VzZWRvd24nIG9yICdtb3VzZXVwJyBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgIGNhc2UgXCJtb3VzZWRvd25cIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwibW91c2V1cFwiOlxuICAgICAgICAgICAgICAgICAgICBldmVudENsYXNzID0gXCJNb3VzZUV2ZW50c1wiO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgXCJmb2N1c1wiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJjaGFuZ2VcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiYmx1clwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJzZWxlY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRDbGFzcyA9IFwiSFRNTEV2ZW50c1wiO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiZmlyZUV2ZW50OiBDb3VsZG4ndCBmaW5kIGFuIGV2ZW50IGNsYXNzIGZvciBldmVudCAnXCIgKyBldmVudE5hbWUgKyBcIicuXCI7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGV2ZW50ID0gZG9jLmNyZWF0ZUV2ZW50KGV2ZW50Q2xhc3MpO1xuICAgICAgICAgICAgZXZlbnQuaW5pdEV2ZW50KGV2ZW50TmFtZSwgdHJ1ZSwgdHJ1ZSk7IC8vIEFsbCBldmVudHMgY3JlYXRlZCBhcyBidWJibGluZyBhbmQgY2FuY2VsYWJsZS5cblxuICAgICAgICAgICAgZXZlbnQuc3ludGhldGljID0gdHJ1ZTsgLy8gYWxsb3cgZGV0ZWN0aW9uIG9mIHN5bnRoZXRpYyBldmVudHNcbiAgICAgICAgICAgIC8vIFRoZSBzZWNvbmQgcGFyYW1ldGVyIHNheXMgZ28gYWhlYWQgd2l0aCB0aGUgZGVmYXVsdCBhY3Rpb25cbiAgICAgICAgICAgIG5vZGUuZGlzcGF0Y2hFdmVudChldmVudCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5maXJlRXZlbnQpIHtcbiAgICAgICAgICAgIC8vIElFLW9sZCBzY2hvb2wgc3R5bGVcbiAgICAgICAgICAgIHZhciBldmVudCA9IGRvYy5jcmVhdGVFdmVudE9iamVjdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3ludGhldGljID0gdHJ1ZTsgLy8gYWxsb3cgZGV0ZWN0aW9uIG9mIHN5bnRoZXRpYyBldmVudHNcbiAgICAgICAgICAgIG5vZGUuZmlyZUV2ZW50KFwib25cIiArIGV2ZW50TmFtZSwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICByZWdpc3RlcjogZnVuY3Rpb24gKG5hbWUsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgdmFyIHRhZ05hbWUgPSAnbmF0aXZlLScgKyBuYW1lO1xuICAgICAgICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQodGFnTmFtZSwgcHJvcGVydGllcyk7XG4gICAgfVxufTtcblxud2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudCB8fCB7fTtcbndpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50LnV0aWxzID0gdXRpbHM7XG53aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC5kaXNwYXRjaEV2ZW50ID0gdXRpbHMuZGlzcGF0Y2hFdmVudDtcbndpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50LmNhbGxNZXRob2QgPSB1dGlscy5jYWxsTWV0aG9kO1xuXG5pZiAod2luZG93LnBvbHltZXJOYXRpdmVIb3N0KSB7XG4gICAgd2luZG93LmFsZXJ0ID0gcG9seW1lck5hdGl2ZUhvc3QuYWxlcnQ7XG4gICAgd2luZG93LmNvbnNvbGUubG9nID0gcG9seW1lck5hdGl2ZUhvc3QubG9nO1xufVxuXG5cbmlmICh0eXBlb2YgT2JqZWN0LmFzc2lnbiAhPSAnZnVuY3Rpb24nKSB7XG4gICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbiA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCB8fCB0YXJnZXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG91dHB1dCA9IE9iamVjdCh0YXJnZXQpO1xuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQgJiYgc291cmNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG5leHRLZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KG5leHRLZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0W25leHRLZXldID0gc291cmNlW25leHRLZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfTtcbiAgICB9KSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9wbi11dGlscy5qc1wiLFwiL1wiKSJdfQ==

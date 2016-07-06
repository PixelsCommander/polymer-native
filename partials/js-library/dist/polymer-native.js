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
},{"buffer":2,"km4Umf":3}],6:[function(require,module,exports){
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
},{"buffer":2,"km4Umf":3}],7:[function(require,module,exports){
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
    //setTimeout(function () {
        self.updateSerializedProperties();
        if (window.polymerNativeHost) {
            self.style.visibility = 'hidden';
            polymerNativeHost.createElement(self.polymerNative.serializedProperties);
        }
    //}, 0);
};

PnBaseElement.detachedCallback = function () {
    if (window.polymerNativeHost) {
        polymerNativeHost.removeElement(this.polymerNative.id);
    }
};

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
};

PnBaseElement.updateSerializedProperties = function () {
    this.polymerNative.serializedProperties = JSON.stringify(polymerNativeClient.utils.getElementProperties(this));
};

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
    for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];

        console.log('Mutated ' + mutation.target.tagName);

        var structureChanged = mutation.removedNodes.length || mutation.addedNodes.length;
        mutation.target.update(structureChanged);
    }
};

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
};

window.addEventListener('load', PnBaseElement.initializeObserver);
window.addEventListener('orientationchange', PnBaseElement.onResize);

module.exports = PnBaseElement;
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/base/pn-base-element.js","/elements/base")
},{"buffer":2,"km4Umf":3}],8:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

var proto = Object.create(HTMLDivElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('view', {
    prototype: proto
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/base/pn-view.js","/elements/base")
},{"../../pn-utils.js":18,"./pn-base-element.js":7,"buffer":2,"km4Umf":3}],9:[function(require,module,exports){
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
},{"../pn-utils.js":18,"./base/pn-base-element.js":7,"buffer":2,"km4Umf":3}],10:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLInputElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('checkbox', {
    extends: 'input',
    prototype: proto
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-checkbox.js","/elements")
},{"../pn-utils.js":18,"./base/pn-base-element.js":7,"buffer":2,"km4Umf":3}],11:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLImageElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('img', {
    extends: 'img',
    prototype: proto
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-img.js","/elements")
},{"../pn-utils.js":18,"./base/pn-base-element.js":7,"buffer":2,"km4Umf":3}],12:[function(require,module,exports){
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
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-input.js","/elements")
},{"../pn-utils.js":18,"./base/pn-base-element.js":7,"buffer":2,"km4Umf":3}],13:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLDivElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('label', {
    prototype: proto
});
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/elements/pn-label.js","/elements")
},{"../pn-utils.js":18,"./base/pn-base-element.js":7,"buffer":2,"km4Umf":3}],14:[function(require,module,exports){
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
},{"../pn-utils.js":18,"./base/pn-base-element.js":7,"buffer":2,"km4Umf":3}],15:[function(require,module,exports){
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
},{"../../../../../node_modules/rebel-router/es5/rebel-router.js":5,"../../pn-utils.js":18,"../base/pn-base-element.js":7,"buffer":2,"km4Umf":3}],16:[function(require,module,exports){
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

//Not sure what this is for?
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
},{"../../../../../node_modules/rebel-router/es5/rebel-router.js":5,"../../pn-utils.js":18,"../base/pn-base-element.js":7,"buffer":2,"km4Umf":3}],17:[function(require,module,exports){
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
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_d524bbc9.js","/")
},{"./elements/base/pn-base-element.js":7,"./elements/base/pn-view.js":8,"./elements/pn-button.js":9,"./elements/pn-checkbox.js":10,"./elements/pn-img.js":11,"./elements/pn-input.js":12,"./elements/pn-label.js":13,"./elements/pn-rootview.js":14,"./elements/router/pn-route.js":15,"./elements/router/pn-router.js":16,"./pn-utils.js":18,"buffer":2,"km4Umf":3,"webcomponents.js":6}],18:[function(require,module,exports){
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
}).call(this,require("km4Umf"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/pn-utils.js","/")
},{"buffer":2,"km4Umf":3}]},{},[17])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qcyIsIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9ub2RlX21vZHVsZXMvcmViZWwtcm91dGVyL2VzNS9yZWJlbC1yb3V0ZXIuanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL25vZGVfbW9kdWxlcy93ZWJjb21wb25lbnRzLmpzL3dlYmNvbXBvbmVudHMuanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL3BhcnRpYWxzL2pzLWxpYnJhcnkvc3JjL2VsZW1lbnRzL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9lbGVtZW50cy9iYXNlL3BuLXZpZXcuanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL3BhcnRpYWxzL2pzLWxpYnJhcnkvc3JjL2VsZW1lbnRzL3BuLWJ1dHRvbi5qcyIsIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvcG4tY2hlY2tib3guanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL3BhcnRpYWxzL2pzLWxpYnJhcnkvc3JjL2VsZW1lbnRzL3BuLWltZy5qcyIsIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvcG4taW5wdXQuanMiLCIvVXNlcnMvbGVvbnJldmlsbC9Db2RlL3BvbHltZXItbmF0aXZlL3BhcnRpYWxzL2pzLWxpYnJhcnkvc3JjL2VsZW1lbnRzL3BuLWxhYmVsLmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9lbGVtZW50cy9wbi1yb290dmlldy5qcyIsIi9Vc2Vycy9sZW9ucmV2aWxsL0NvZGUvcG9seW1lci1uYXRpdmUvcGFydGlhbHMvanMtbGlicmFyeS9zcmMvZWxlbWVudHMvcm91dGVyL3BuLXJvdXRlLmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9lbGVtZW50cy9yb3V0ZXIvcG4tcm91dGVyLmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9mYWtlX2Q1MjRiYmM5LmpzIiwiL1VzZXJzL2xlb25yZXZpbGwvQ29kZS9wb2x5bWVyLW5hdGl2ZS9wYXJ0aWFscy9qcy1saWJyYXJ5L3NyYy9wbi11dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Z0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmlPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgbG9va3VwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuXG47KGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuICB2YXIgQXJyID0gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJylcbiAgICA/IFVpbnQ4QXJyYXlcbiAgICA6IEFycmF5XG5cblx0dmFyIFBMVVMgICA9ICcrJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSCAgPSAnLycuY2hhckNvZGVBdCgwKVxuXHR2YXIgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIExPV0VSICA9ICdhJy5jaGFyQ29kZUF0KDApXG5cdHZhciBVUFBFUiAgPSAnQScuY2hhckNvZGVBdCgwKVxuXHR2YXIgUExVU19VUkxfU0FGRSA9ICctJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSF9VUkxfU0FGRSA9ICdfJy5jaGFyQ29kZUF0KDApXG5cblx0ZnVuY3Rpb24gZGVjb2RlIChlbHQpIHtcblx0XHR2YXIgY29kZSA9IGVsdC5jaGFyQ29kZUF0KDApXG5cdFx0aWYgKGNvZGUgPT09IFBMVVMgfHxcblx0XHQgICAgY29kZSA9PT0gUExVU19VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MiAvLyAnKydcblx0XHRpZiAoY29kZSA9PT0gU0xBU0ggfHxcblx0XHQgICAgY29kZSA9PT0gU0xBU0hfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjMgLy8gJy8nXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIpXG5cdFx0XHRyZXR1cm4gLTEgLy9ubyBtYXRjaFxuXHRcdGlmIChjb2RlIDwgTlVNQkVSICsgMTApXG5cdFx0XHRyZXR1cm4gY29kZSAtIE5VTUJFUiArIDI2ICsgMjZcblx0XHRpZiAoY29kZSA8IFVQUEVSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIFVQUEVSXG5cdFx0aWYgKGNvZGUgPCBMT1dFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBMT1dFUiArIDI2XG5cdH1cblxuXHRmdW5jdGlvbiBiNjRUb0J5dGVBcnJheSAoYjY0KSB7XG5cdFx0dmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcblxuXHRcdGlmIChiNjQubGVuZ3RoICUgNCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG5cdFx0fVxuXG5cdFx0Ly8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcblx0XHQvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG5cdFx0Ly8gcmVwcmVzZW50IG9uZSBieXRlXG5cdFx0Ly8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuXHRcdHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cdFx0cGxhY2VIb2xkZXJzID0gJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDIpID8gMiA6ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAxKSA/IDEgOiAwXG5cblx0XHQvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcblx0XHRhcnIgPSBuZXcgQXJyKGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycylcblxuXHRcdC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcblx0XHRsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aFxuXG5cdFx0dmFyIEwgPSAwXG5cblx0XHRmdW5jdGlvbiBwdXNoICh2KSB7XG5cdFx0XHRhcnJbTCsrXSA9IHZcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDE4KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDEyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpIDw8IDYpIHwgZGVjb2RlKGI2NC5jaGFyQXQoaSArIDMpKVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwKSA+PiA4KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA+PiA0KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDEwKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDQpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPj4gMilcblx0XHRcdHB1c2goKHRtcCA+PiA4KSAmIDB4RkYpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFyclxuXHR9XG5cblx0ZnVuY3Rpb24gdWludDhUb0Jhc2U2NCAodWludDgpIHtcblx0XHR2YXIgaSxcblx0XHRcdGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzLCAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuXHRcdFx0b3V0cHV0ID0gXCJcIixcblx0XHRcdHRlbXAsIGxlbmd0aFxuXG5cdFx0ZnVuY3Rpb24gZW5jb2RlIChudW0pIHtcblx0XHRcdHJldHVybiBsb29rdXAuY2hhckF0KG51bSlcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuXHRcdFx0cmV0dXJuIGVuY29kZShudW0gPj4gMTggJiAweDNGKSArIGVuY29kZShudW0gPj4gMTIgJiAweDNGKSArIGVuY29kZShudW0gPj4gNiAmIDB4M0YpICsgZW5jb2RlKG51bSAmIDB4M0YpXG5cdFx0fVxuXG5cdFx0Ly8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuXHRcdGZvciAoaSA9IDAsIGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7IGkgPCBsZW5ndGg7IGkgKz0gMykge1xuXHRcdFx0dGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSlcblx0XHRcdG91dHB1dCArPSB0cmlwbGV0VG9CYXNlNjQodGVtcClcblx0XHR9XG5cblx0XHQvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG5cdFx0c3dpdGNoIChleHRyYUJ5dGVzKSB7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPT0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRcdHRlbXAgPSAodWludDhbdWludDgubGVuZ3RoIC0gMl0gPDwgOCkgKyAodWludDhbdWludDgubGVuZ3RoIC0gMV0pXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAxMClcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA+PiA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgMikgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dFxuXHR9XG5cblx0ZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5XG5cdGV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjRcbn0odHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKHRoaXMuYmFzZTY0anMgPSB7fSkgOiBleHBvcnRzKSlcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5fdXNlVHlwZWRBcnJheXNgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAoY29tcGF0aWJsZSBkb3duIHRvIElFNilcbiAqL1xuQnVmZmVyLl91c2VUeXBlZEFycmF5cyA9IChmdW5jdGlvbiAoKSB7XG4gIC8vIERldGVjdCBpZiBicm93c2VyIHN1cHBvcnRzIFR5cGVkIEFycmF5cy4gU3VwcG9ydGVkIGJyb3dzZXJzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssXG4gIC8vIENocm9tZSA3KywgU2FmYXJpIDUuMSssIE9wZXJhIDExLjYrLCBpT1MgNC4yKy4gSWYgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBhZGRpbmdcbiAgLy8gcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLCB0aGVuIHRoYXQncyB0aGUgc2FtZSBhcyBubyBgVWludDhBcnJheWAgc3VwcG9ydFxuICAvLyBiZWNhdXNlIHdlIG5lZWQgdG8gYmUgYWJsZSB0byBhZGQgYWxsIHRoZSBub2RlIEJ1ZmZlciBBUEkgbWV0aG9kcy4gVGhpcyBpcyBhbiBpc3N1ZVxuICAvLyBpbiBGaXJlZm94IDQtMjkuIE5vdyBmaXhlZDogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4XG4gIHRyeSB7XG4gICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcigwKVxuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheShidWYpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICByZXR1cm4gNDIgPT09IGFyci5mb28oKSAmJlxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nIC8vIENocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn0pKClcblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKVxuXG4gIHZhciB0eXBlID0gdHlwZW9mIHN1YmplY3RcblxuICAvLyBXb3JrYXJvdW5kOiBub2RlJ3MgYmFzZTY0IGltcGxlbWVudGF0aW9uIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBzdHJpbmdzXG4gIC8vIHdoaWxlIGJhc2U2NC1qcyBkb2VzIG5vdC5cbiAgaWYgKGVuY29kaW5nID09PSAnYmFzZTY0JyAmJiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgIHN1YmplY3QgPSBzdHJpbmd0cmltKHN1YmplY3QpXG4gICAgd2hpbGUgKHN1YmplY3QubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgICAgc3ViamVjdCA9IHN1YmplY3QgKyAnPSdcbiAgICB9XG4gIH1cblxuICAvLyBGaW5kIHRoZSBsZW5ndGhcbiAgdmFyIGxlbmd0aFxuICBpZiAodHlwZSA9PT0gJ251bWJlcicpXG4gICAgbGVuZ3RoID0gY29lcmNlKHN1YmplY3QpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKVxuICAgIGxlbmd0aCA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHN1YmplY3QsIGVuY29kaW5nKVxuICBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0JylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdC5sZW5ndGgpIC8vIGFzc3VtZSB0aGF0IG9iamVjdCBpcyBhcnJheS1saWtlXG4gIGVsc2VcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG5lZWRzIHRvIGJlIGEgbnVtYmVyLCBhcnJheSBvciBzdHJpbmcuJylcblxuICB2YXIgYnVmXG4gIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgLy8gUHJlZmVycmVkOiBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGJ1ZiA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gVEhJUyBpbnN0YW5jZSBvZiBCdWZmZXIgKGNyZWF0ZWQgYnkgYG5ld2ApXG4gICAgYnVmID0gdGhpc1xuICAgIGJ1Zi5sZW5ndGggPSBsZW5ndGhcbiAgICBidWYuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMgJiYgdHlwZW9mIHN1YmplY3QuYnl0ZUxlbmd0aCA9PT0gJ251bWJlcicpIHtcbiAgICAvLyBTcGVlZCBvcHRpbWl6YXRpb24gLS0gdXNlIHNldCBpZiB3ZSdyZSBjb3B5aW5nIGZyb20gYSB0eXBlZCBhcnJheVxuICAgIGJ1Zi5fc2V0KHN1YmplY3QpXG4gIH0gZWxzZSBpZiAoaXNBcnJheWlzaChzdWJqZWN0KSkge1xuICAgIC8vIFRyZWF0IGFycmF5LWlzaCBvYmplY3RzIGFzIGEgYnl0ZSBhcnJheVxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSlcbiAgICAgICAgYnVmW2ldID0gc3ViamVjdC5yZWFkVUludDgoaSlcbiAgICAgIGVsc2VcbiAgICAgICAgYnVmW2ldID0gc3ViamVjdFtpXVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGJ1Zi53cml0ZShzdWJqZWN0LCAwLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiAhQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiAhbm9aZXJvKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBidWZbaV0gPSAwXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG4vLyBTVEFUSUMgTUVUSE9EU1xuLy8gPT09PT09PT09PT09PT1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIChiKSB7XG4gIHJldHVybiAhIShiICE9PSBudWxsICYmIGIgIT09IHVuZGVmaW5lZCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmJ5dGVMZW5ndGggPSBmdW5jdGlvbiAoc3RyLCBlbmNvZGluZykge1xuICB2YXIgcmV0XG4gIHN0ciA9IHN0ciArICcnXG4gIHN3aXRjaCAoZW5jb2RpbmcgfHwgJ3V0ZjgnKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggLyAyXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoICogMlxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiAobGlzdCwgdG90YWxMZW5ndGgpIHtcbiAgYXNzZXJ0KGlzQXJyYXkobGlzdCksICdVc2FnZTogQnVmZmVyLmNvbmNhdChsaXN0LCBbdG90YWxMZW5ndGhdKVxcbicgK1xuICAgICAgJ2xpc3Qgc2hvdWxkIGJlIGFuIEFycmF5LicpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfSBlbHNlIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBsaXN0WzBdXG4gIH1cblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHRvdGFsTGVuZ3RoICE9PSAnbnVtYmVyJykge1xuICAgIHRvdGFsTGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0b3RhbExlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHRvdGFsTGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbi8vIEJVRkZFUiBJTlNUQU5DRSBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBfaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBhc3NlcnQoc3RyTGVuICUgMiA9PT0gMCwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBieXRlID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGFzc2VydCghaXNOYU4oYnl0ZSksICdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IGJ5dGVcbiAgfVxuICBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9IGkgKiAyXG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIF91dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBfYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBfYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gX2FzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBfYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF91dGYxNmxlV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIFN1cHBvcnQgYm90aCAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpXG4gIC8vIGFuZCB0aGUgbGVnYWN5IChzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBpZiAoIWlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7ICAvLyBsZWdhY3lcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGhcbiAgICBsZW5ndGggPSBzd2FwXG4gIH1cblxuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBfaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gX3V0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBfYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gX2JpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBfYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IF91dGYxNmxlV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuXG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuICBzdGFydCA9IE51bWJlcihzdGFydCkgfHwgMFxuICBlbmQgPSAoZW5kICE9PSB1bmRlZmluZWQpXG4gICAgPyBOdW1iZXIoZW5kKVxuICAgIDogZW5kID0gc2VsZi5sZW5ndGhcblxuICAvLyBGYXN0cGF0aCBlbXB0eSBzdHJpbmdzXG4gIGlmIChlbmQgPT09IHN0YXJ0KVxuICAgIHJldHVybiAnJ1xuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBfaGV4U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gX3V0ZjhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBfYXNjaWlTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gX2JpbmFyeVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBfYmFzZTY0U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IF91dGYxNmxlU2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAodGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNvdXJjZSA9IHRoaXNcblxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoIXRhcmdldF9zdGFydCkgdGFyZ2V0X3N0YXJ0ID0gMFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHNvdXJjZS5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgYXNzZXJ0KGVuZCA+PSBzdGFydCwgJ3NvdXJjZUVuZCA8IHNvdXJjZVN0YXJ0JylcbiAgYXNzZXJ0KHRhcmdldF9zdGFydCA+PSAwICYmIHRhcmdldF9zdGFydCA8IHRhcmdldC5sZW5ndGgsXG4gICAgICAndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChzdGFydCA+PSAwICYmIHN0YXJ0IDwgc291cmNlLmxlbmd0aCwgJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHNvdXJjZS5sZW5ndGgsICdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKVxuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0IDwgZW5kIC0gc3RhcnQpXG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldF9zdGFydCArIHN0YXJ0XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKGxlbiA8IDEwMCB8fCAhQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICB0YXJnZXRbaSArIHRhcmdldF9zdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldF9zdGFydClcbiAgfVxufVxuXG5mdW5jdGlvbiBfYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIF91dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmVzID0gJydcbiAgdmFyIHRtcCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGlmIChidWZbaV0gPD0gMHg3Rikge1xuICAgICAgcmVzICs9IGRlY29kZVV0ZjhDaGFyKHRtcCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgICAgIHRtcCA9ICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIHRtcCArPSAnJScgKyBidWZbaV0udG9TdHJpbmcoMTYpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcyArIGRlY29kZVV0ZjhDaGFyKHRtcClcbn1cblxuZnVuY3Rpb24gX2FzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKVxuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBfYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICByZXR1cm4gX2FzY2lpU2xpY2UoYnVmLCBzdGFydCwgZW5kKVxufVxuXG5mdW5jdGlvbiBfaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiBfdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpKzFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IGNsYW1wKHN0YXJ0LCBsZW4sIDApXG4gIGVuZCA9IGNsYW1wKGVuZCwgbGVuLCBsZW4pXG5cbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICByZXR1cm4gQnVmZmVyLl9hdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICB2YXIgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkLCB0cnVlKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICAgIHJldHVybiBuZXdCdWZcbiAgfVxufVxuXG4vLyBgZ2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuZnVuY3Rpb24gX3JlYWRVSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gIH0gZWxzZSB7XG4gICAgdmFsID0gYnVmW29mZnNldF0gPDwgOFxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MTYodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkVUludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbFxuICBpZiAobGl0dGxlRW5kaWFuKSB7XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgPSBidWZbb2Zmc2V0ICsgMl0gPDwgMTZcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV0gPDwgOFxuICAgIHZhbCB8PSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAzIDwgbGVuKVxuICAgICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXQgKyAzXSA8PCAyNCA+Pj4gMClcbiAgfSBlbHNlIHtcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAxXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAyIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAyXSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDNdXG4gICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXRdIDw8IDI0ID4+PiAwKVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MzIodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHZhciBuZWcgPSB0aGlzW29mZnNldF0gJiAweDgwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiBfcmVhZEludDE2IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IF9yZWFkVUludDE2KGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDE2KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRJbnQzMiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWwgPSBfcmVhZFVJbnQzMihidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCB0cnVlKVxuICB2YXIgbmVnID0gdmFsICYgMHg4MDAwMDAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDMyKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRGbG9hdCAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRmxvYXQodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEZsb2F0KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZERvdWJsZSAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmYpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm5cblxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxufVxuXG5mdW5jdGlvbiBfd3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgICAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmZmZmZilcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4obGVuIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9XG4gICAgICAgICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZiwgLTB4ODApXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIHRoaXMud3JpdGVVSW50OCh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydClcbiAgZWxzZVxuICAgIHRoaXMud3JpdGVVSW50OCgweGZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmZmYsIC0weDgwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICBfd3JpdGVVSW50MTYoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgX3dyaXRlVUludDE2KGJ1ZiwgMHhmZmZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgX3dyaXRlVUludDMyKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbiAgZWxzZVxuICAgIF93cml0ZVVJbnQzMihidWYsIDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDcgPCBidWYubGVuZ3RoLFxuICAgICAgICAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZklFRUU3NTQodmFsdWUsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLmNoYXJDb2RlQXQoMClcbiAgfVxuXG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmICFpc05hTih2YWx1ZSksICd2YWx1ZSBpcyBub3QgYSBudW1iZXInKVxuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCB0aGlzLmxlbmd0aCwgJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHRoaXMubGVuZ3RoLCAnZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdGhpc1tpXSA9IHZhbHVlXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgb3V0ID0gW11cbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBvdXRbaV0gPSB0b0hleCh0aGlzW2ldKVxuICAgIGlmIChpID09PSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTKSB7XG4gICAgICBvdXRbaSArIDFdID0gJy4uLidcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgb3V0LmpvaW4oJyAnKSArICc+J1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgICAgcmV0dXJuIChuZXcgQnVmZmVyKHRoaXMpKS5idWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSlcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCdWZmZXIudG9BcnJheUJ1ZmZlciBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlcicpXG4gIH1cbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG52YXIgQlAgPSBCdWZmZXIucHJvdG90eXBlXG5cbi8qKlxuICogQXVnbWVudCBhIFVpbnQ4QXJyYXkgKmluc3RhbmNlKiAobm90IHRoZSBVaW50OEFycmF5IGNsYXNzISkgd2l0aCBCdWZmZXIgbWV0aG9kc1xuICovXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBnZXQvc2V0IG1ldGhvZHMgYmVmb3JlIG92ZXJ3cml0aW5nXG4gIGFyci5fZ2V0ID0gYXJyLmdldFxuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkLCB3aWxsIGJlIHJlbW92ZWQgaW4gbm9kZSAwLjEzK1xuICBhcnIuZ2V0ID0gQlAuZ2V0XG4gIGFyci5zZXQgPSBCUC5zZXRcblxuICBhcnIud3JpdGUgPSBCUC53cml0ZVxuICBhcnIudG9TdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9Mb2NhbGVTdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9KU09OID0gQlAudG9KU09OXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnQ4ID0gQlAucmVhZFVJbnQ4XG4gIGFyci5yZWFkVUludDE2TEUgPSBCUC5yZWFkVUludDE2TEVcbiAgYXJyLnJlYWRVSW50MTZCRSA9IEJQLnJlYWRVSW50MTZCRVxuICBhcnIucmVhZFVJbnQzMkxFID0gQlAucmVhZFVJbnQzMkxFXG4gIGFyci5yZWFkVUludDMyQkUgPSBCUC5yZWFkVUludDMyQkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50OCA9IEJQLndyaXRlSW50OFxuICBhcnIud3JpdGVJbnQxNkxFID0gQlAud3JpdGVJbnQxNkxFXG4gIGFyci53cml0ZUludDE2QkUgPSBCUC53cml0ZUludDE2QkVcbiAgYXJyLndyaXRlSW50MzJMRSA9IEJQLndyaXRlSW50MzJMRVxuICBhcnIud3JpdGVJbnQzMkJFID0gQlAud3JpdGVJbnQzMkJFXG4gIGFyci53cml0ZUZsb2F0TEUgPSBCUC53cml0ZUZsb2F0TEVcbiAgYXJyLndyaXRlRmxvYXRCRSA9IEJQLndyaXRlRmxvYXRCRVxuICBhcnIud3JpdGVEb3VibGVMRSA9IEJQLndyaXRlRG91YmxlTEVcbiAgYXJyLndyaXRlRG91YmxlQkUgPSBCUC53cml0ZURvdWJsZUJFXG4gIGFyci5maWxsID0gQlAuZmlsbFxuICBhcnIuaW5zcGVjdCA9IEJQLmluc3BlY3RcbiAgYXJyLnRvQXJyYXlCdWZmZXIgPSBCUC50b0FycmF5QnVmZmVyXG5cbiAgcmV0dXJuIGFyclxufVxuXG4vLyBzbGljZShzdGFydCwgZW5kKVxuZnVuY3Rpb24gY2xhbXAgKGluZGV4LCBsZW4sIGRlZmF1bHRWYWx1ZSkge1xuICBpZiAodHlwZW9mIGluZGV4ICE9PSAnbnVtYmVyJykgcmV0dXJuIGRlZmF1bHRWYWx1ZVxuICBpbmRleCA9IH5+aW5kZXg7ICAvLyBDb2VyY2UgdG8gaW50ZWdlci5cbiAgaWYgKGluZGV4ID49IGxlbikgcmV0dXJuIGxlblxuICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIGluZGV4XG4gIGluZGV4ICs9IGxlblxuICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIGluZGV4XG4gIHJldHVybiAwXG59XG5cbmZ1bmN0aW9uIGNvZXJjZSAobGVuZ3RoKSB7XG4gIC8vIENvZXJjZSBsZW5ndGggdG8gYSBudW1iZXIgKHBvc3NpYmx5IE5hTiksIHJvdW5kIHVwXG4gIC8vIGluIGNhc2UgaXQncyBmcmFjdGlvbmFsIChlLmcuIDEyMy40NTYpIHRoZW4gZG8gYVxuICAvLyBkb3VibGUgbmVnYXRlIHRvIGNvZXJjZSBhIE5hTiB0byAwLiBFYXN5LCByaWdodD9cbiAgbGVuZ3RoID0gfn5NYXRoLmNlaWwoK2xlbmd0aClcbiAgcmV0dXJuIGxlbmd0aCA8IDAgPyAwIDogbGVuZ3RoXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkgKHN1YmplY3QpIHtcbiAgcmV0dXJuIChBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChzdWJqZWN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzdWJqZWN0KSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICB9KShzdWJqZWN0KVxufVxuXG5mdW5jdGlvbiBpc0FycmF5aXNoIChzdWJqZWN0KSB7XG4gIHJldHVybiBpc0FycmF5KHN1YmplY3QpIHx8IEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSB8fFxuICAgICAgc3ViamVjdCAmJiB0eXBlb2Ygc3ViamVjdCA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZiBzdWJqZWN0Lmxlbmd0aCA9PT0gJ251bWJlcidcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIHZhciBiID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBpZiAoYiA8PSAweDdGKVxuICAgICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkpXG4gICAgZWxzZSB7XG4gICAgICB2YXIgc3RhcnQgPSBpXG4gICAgICBpZiAoYiA+PSAweEQ4MDAgJiYgYiA8PSAweERGRkYpIGkrK1xuICAgICAgdmFyIGggPSBlbmNvZGVVUklDb21wb25lbnQoc3RyLnNsaWNlKHN0YXJ0LCBpKzEpKS5zdWJzdHIoMSkuc3BsaXQoJyUnKVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBoLmxlbmd0aDsgaisrKVxuICAgICAgICBieXRlQXJyYXkucHVzaChwYXJzZUludChoW2pdLCAxNikpXG4gICAgfVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KHN0cilcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBwb3NcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSlcbiAgICAgIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gZGVjb2RlVXRmOENoYXIgKHN0cikge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyKVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSgweEZGRkQpIC8vIFVURiA4IGludmFsaWQgY2hhclxuICB9XG59XG5cbi8qXG4gKiBXZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSB2YWx1ZSBpcyBhIHZhbGlkIGludGVnZXIuIFRoaXMgbWVhbnMgdGhhdCBpdFxuICogaXMgbm9uLW5lZ2F0aXZlLiBJdCBoYXMgbm8gZnJhY3Rpb25hbCBjb21wb25lbnQgYW5kIHRoYXQgaXQgZG9lcyBub3RcbiAqIGV4Y2VlZCB0aGUgbWF4aW11bSBhbGxvd2VkIHZhbHVlLlxuICovXG5mdW5jdGlvbiB2ZXJpZnVpbnQgKHZhbHVlLCBtYXgpIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlID49IDAsICdzcGVjaWZpZWQgYSBuZWdhdGl2ZSB2YWx1ZSBmb3Igd3JpdGluZyBhbiB1bnNpZ25lZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBpcyBsYXJnZXIgdGhhbiBtYXhpbXVtIHZhbHVlIGZvciB0eXBlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZzaW50ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZJRUVFNzU0ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbn1cblxuZnVuY3Rpb24gYXNzZXJ0ICh0ZXN0LCBtZXNzYWdlKSB7XG4gIGlmICghdGVzdCkgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UgfHwgJ0ZhaWxlZCBhc3NlcnRpb24nKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlclwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3NcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG5leHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9pZWVlNzU0XCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmICghc2VsZikgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIGNhbGwgJiYgKHR5cGVvZiBjYWxsID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpID8gY2FsbCA6IHNlbGY7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbi8qKlxuICogQ3JlYXRlZCBieSBMZW9uIFJldmlsbCBvbiAxNS8xMi8yMDE1LlxuICogQmxvZzogYmxvZy5yZXZpbGx3ZWIuY29tXG4gKiBHaXRIdWI6IGh0dHBzOi8vZ2l0aHViLmNvbS9SZXZpbGxXZWJcbiAqIFR3aXR0ZXI6IEBSZXZpbGxXZWJcbiAqL1xuXG4vKipcbiAqIFRoZSBtYWluIHJvdXRlciBjbGFzcyBhbmQgZW50cnkgcG9pbnQgdG8gdGhlIHJvdXRlci5cbiAqL1xuXG52YXIgUmViZWxSb3V0ZXIgPSBleHBvcnRzLlJlYmVsUm91dGVyID0gKGZ1bmN0aW9uIChfSFRNTEVsZW1lbnQpIHtcbiAgICBfaW5oZXJpdHMoUmViZWxSb3V0ZXIsIF9IVE1MRWxlbWVudCk7XG5cbiAgICBmdW5jdGlvbiBSZWJlbFJvdXRlcigpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFJlYmVsUm91dGVyKTtcblxuICAgICAgICByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgT2JqZWN0LmdldFByb3RvdHlwZU9mKFJlYmVsUm91dGVyKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoUmViZWxSb3V0ZXIsIFt7XG4gICAgICAgIGtleTogXCJjcmVhdGVkQ2FsbGJhY2tcIixcblxuICAgICAgICAvKipcbiAgICAgICAgICogTWFpbiBpbml0aWFsaXNhdGlvbiBwb2ludCBvZiByZWJlbC1yb3V0ZXJcbiAgICAgICAgICogQHBhcmFtIHByZWZpeCAtIElmIGV4dGVuZGluZyByZWJlbC1yb3V0ZXIgeW91IGNhbiBzcGVjaWZ5IGEgcHJlZml4IHdoZW4gY2FsbGluZyBjcmVhdGVkQ2FsbGJhY2sgaW4gY2FzZSB5b3VyIGVsZW1lbnRzIG5lZWQgdG8gYmUgbmFtZWQgZGlmZmVyZW50bHlcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVkQ2FsbGJhY2socHJlZml4KSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIF9wcmVmaXggPSBwcmVmaXggfHwgXCJyZWJlbFwiO1xuXG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzUGF0aCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmJhc2VQYXRoID0gbnVsbDtcblxuICAgICAgICAgICAgLy9HZXQgb3B0aW9uc1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIFwiYW5pbWF0aW9uXCI6IHRoaXMuZ2V0QXR0cmlidXRlKFwiYW5pbWF0aW9uXCIpID09IFwidHJ1ZVwiLFxuICAgICAgICAgICAgICAgIFwic2hhZG93Um9vdFwiOiB0aGlzLmdldEF0dHJpYnV0ZShcInNoYWRvd1wiKSA9PSBcInRydWVcIixcbiAgICAgICAgICAgICAgICBcImluaGVyaXRcIjogdGhpcy5nZXRBdHRyaWJ1dGUoXCJpbmhlcml0XCIpICE9IFwiZmFsc2VcIlxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy9HZXQgcm91dGVzXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmluaGVyaXQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAvL0lmIHRoaXMgaXMgYSBuZXN0ZWQgcm91dGVyIHRoZW4gd2UgbmVlZCB0byBnbyBhbmQgZ2V0IHRoZSBwYXJlbnQgcGF0aFxuICAgICAgICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgd2hpbGUgKCRlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJGVsZW1lbnQgPSAkZWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PSBfcHJlZml4ICsgXCItcm91dGVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50ID0gJGVsZW1lbnQuY3VycmVudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5iYXNlUGF0aCA9IGN1cnJlbnQucm91dGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucm91dGVzID0ge307XG4gICAgICAgICAgICB2YXIgJGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyICRjaGlsZCA9ICRjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aCA9ICRjaGlsZC5nZXRBdHRyaWJ1dGUoXCJwYXRoXCIpO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoJGNoaWxkLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBfcHJlZml4ICsgXCItZGVmYXVsdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFwiKlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgX3ByZWZpeCArIFwiLXJvdXRlXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gdGhpcy5iYXNlUGF0aCAhPT0gbnVsbCA/IHRoaXMuYmFzZVBhdGggKyBwYXRoIDogcGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocGF0aCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHRlbXBsYXRlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRjaGlsZC5pbm5lckhUTUwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR0ZW1wbGF0ZSA9IFwiPFwiICsgX3ByZWZpeCArIFwiLXJvdXRlPlwiICsgJGNoaWxkLmlubmVySFRNTCArIFwiPC9cIiArIF9wcmVmaXggKyBcIi1yb3V0ZT5cIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJvdXRlc1twYXRoXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29tcG9uZW50XCI6ICRjaGlsZC5nZXRBdHRyaWJ1dGUoXCJjb21wb25lbnRcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRlbXBsYXRlXCI6ICR0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9BZnRlciB3ZSBoYXZlIGNvbGxlY3RlZCBhbGwgY29uZmlndXJhdGlvbiBjbGVhciBpbm5lckhUTUxcbiAgICAgICAgICAgIHRoaXMuaW5uZXJIVE1MID0gXCJcIjtcblxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaGFkb3dSb290ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVTaGFkb3dSb290KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yb290ID0gdGhpcy5zaGFkb3dSb290O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJvb3QgPSB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb24gPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRBbmltYXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICBSZWJlbFJvdXRlci5wYXRoQ2hhbmdlKGZ1bmN0aW9uIChpc0JhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoX3RoaXMyLm9wdGlvbnMuYW5pbWF0aW9uID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0JhY2sgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzMi5jbGFzc0xpc3QuYWRkKFwicmJsLWJhY2tcIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpczIuY2xhc3NMaXN0LnJlbW92ZShcInJibC1iYWNrXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF90aGlzMi5yZW5kZXIoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZ1bmN0aW9uIHVzZWQgdG8gaW5pdGlhbGlzZSB0aGUgYW5pbWF0aW9uIG1lY2hhbmljcyBpZiBhbmltYXRpb24gaXMgdHVybmVkIG9uXG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaW5pdEFuaW1hdGlvblwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaW5pdEFuaW1hdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAobXV0YXRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSBtdXRhdGlvbnNbMF0uYWRkZWROb2Rlc1swXTtcbiAgICAgICAgICAgICAgICBpZiAobm9kZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3RoZXJDaGlsZHJlbiA9IF90aGlzMy5nZXRPdGhlckNoaWxkcmVuKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jbGFzc0xpc3QuYWRkKFwicmViZWwtYW5pbWF0ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2xhc3NMaXN0LmFkZChcImVudGVyXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG90aGVyQ2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdGhlckNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5jbGFzc0xpc3QuYWRkKFwiZXhpdFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmNsYXNzTGlzdC5hZGQoXCJjb21wbGV0ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNsYXNzTGlzdC5hZGQoXCJjb21wbGV0ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAxMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAxMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYW5pbWF0aW9uRW5kID0gZnVuY3Rpb24gYW5pbWF0aW9uRW5kKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldC5jbGFzc05hbWUuaW5kZXhPZihcImV4aXRcIikgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpczMucm9vdC5yZW1vdmVDaGlsZChldmVudC50YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIGFuaW1hdGlvbkVuZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJhbmltYXRpb25lbmRcIiwgYW5pbWF0aW9uRW5kKTtcbiAgICAgICAgICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG9ic2VydmVyLm9ic2VydmUodGhpcywgeyBjaGlsZExpc3Q6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogTWV0aG9kIHVzZWQgdG8gZ2V0IHRoZSBjdXJyZW50IHJvdXRlIG9iamVjdFxuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICovXG5cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjdXJyZW50XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjdXJyZW50KCkge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBSZWJlbFJvdXRlci5nZXRQYXRoRnJvbVVybCgpO1xuICAgICAgICAgICAgZm9yICh2YXIgcm91dGUgaW4gdGhpcy5yb3V0ZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocm91dGUgIT09IFwiKlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdleFN0cmluZyA9IFwiXlwiICsgcm91dGUucmVwbGFjZSgve1xcdyt9XFwvPy9nLCBcIihcXFxcdyspXFwvP1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhTdHJpbmcgKz0gcmVnZXhTdHJpbmcuaW5kZXhPZihcIlxcXFwvP1wiKSA+IC0xID8gXCJcIiA6IFwiXFxcXC8/XCIgKyBcIihbPz0mLVxcL1xcXFx3K10rKT8kXCI7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAocmVnZXhTdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVnZXgudGVzdChwYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9yb3V0ZVJlc3VsdCh0aGlzLnJvdXRlc1tyb3V0ZV0sIHJvdXRlLCByZWdleCwgcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yb3V0ZXNbXCIqXCJdICE9PSB1bmRlZmluZWQgPyBfcm91dGVSZXN1bHQodGhpcy5yb3V0ZXNbXCIqXCJdLCBcIipcIiwgbnVsbCwgcGF0aCkgOiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1ldGhvZCBjYWxsZWQgdG8gcmVuZGVyIHRoZSBjdXJyZW50IHZpZXdcbiAgICAgICAgICovXG5cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJyZW5kZXJcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmN1cnJlbnQoKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnBhdGggIT09IHRoaXMucHJldmlvdXNQYXRoIHx8IHRoaXMub3B0aW9ucy5hbmltYXRpb24gPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb24gIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucm9vdC5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuY29tcG9uZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJGNvbXBvbmVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQocmVzdWx0LmNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gcmVzdWx0LnBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHJlc3VsdC5wYXJhbXNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwiT2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gSlNPTi5wYXJzZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDb3VsZG4ndCBwYXJzZSBwYXJhbSB2YWx1ZTpcIiwgZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGNvbXBvbmVudC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJvb3QuYXBwZW5kQ2hpbGQoJGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJHRlbXBsYXRlID0gcmVzdWx0LnRlbXBsYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiBGaW5kIGEgZmFzdGVyIGFsdGVybmF0aXZlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHRlbXBsYXRlLmluZGV4T2YoXCIke1wiKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRlbXBsYXRlID0gJHRlbXBsYXRlLnJlcGxhY2UoL1xcJHsoW157fV0qKX0vZywgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHIgPSByZXN1bHQucGFyYW1zW2JdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHIgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiByID09PSAnbnVtYmVyJyA/IHIgOiBhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yb290LmlubmVySFRNTCA9ICR0ZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzUGF0aCA9IHJlc3VsdC5wYXRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gbm9kZSAtIFVzZWQgd2l0aCB0aGUgYW5pbWF0aW9uIG1lY2hhbmljcyB0byBnZXQgYWxsIG90aGVyIHZpZXcgY2hpbGRyZW4gZXhjZXB0IGl0c2VsZlxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0T3RoZXJDaGlsZHJlblwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0T3RoZXJDaGlsZHJlbihub2RlKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLnJvb3QuY2hpbGRyZW47XG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZCAhPSBub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgIH1cbiAgICB9XSwgW3tcbiAgICAgICAga2V5OiBcInBhcnNlUXVlcnlTdHJpbmdcIixcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RhdGljIGhlbHBlciBtZXRob2QgdG8gcGFyc2UgdGhlIHF1ZXJ5IHN0cmluZyBmcm9tIGEgdXJsIGludG8gYW4gb2JqZWN0LlxuICAgICAgICAgKiBAcGFyYW0gdXJsXG4gICAgICAgICAqIEByZXR1cm5zIHt7fX1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nKHVybCkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgaWYgKHVybCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHF1ZXJ5U3RyaW5nID0gdXJsLmluZGV4T2YoXCI/XCIpID4gLTEgPyB1cmwuc3Vic3RyKHVybC5pbmRleE9mKFwiP1wiKSArIDEsIHVybC5sZW5ndGgpIDogbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAocXVlcnlTdHJpbmcgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcXVlcnlTdHJpbmcuc3BsaXQoXCImXCIpLmZvckVhY2goZnVuY3Rpb24gKHBhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGFydCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFydCA9IHBhcnQucmVwbGFjZShcIitcIiwgXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVxID0gcGFydC5pbmRleE9mKFwiPVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBlcSA+IC0xID8gcGFydC5zdWJzdHIoMCwgZXEpIDogcGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWwgPSBlcSA+IC0xID8gZGVjb2RlVVJJQ29tcG9uZW50KHBhcnQuc3Vic3RyKGVxICsgMSkpIDogXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmcm9tID0ga2V5LmluZGV4T2YoXCJbXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZyb20gPT0gLTEpIHJlc3VsdFtkZWNvZGVVUklDb21wb25lbnQoa2V5KV0gPSB2YWw7ZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvID0ga2V5LmluZGV4T2YoXCJdXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGRlY29kZVVSSUNvbXBvbmVudChrZXkuc3Vic3RyaW5nKGZyb20gKyAxLCB0bykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChrZXkuc3Vic3RyaW5nKDAsIGZyb20pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdFtrZXldKSByZXN1bHRba2V5XSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaW5kZXgpIHJlc3VsdFtrZXldLnB1c2godmFsKTtlbHNlIHJlc3VsdFtrZXldW2luZGV4XSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdGF0aWMgaGVscGVyIG1ldGhvZCB0byBjb252ZXJ0IGEgY2xhc3MgbmFtZSB0byBhIHZhbGlkIGVsZW1lbnQgbmFtZS5cbiAgICAgICAgICogQHBhcmFtIENsYXNzXG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY2xhc3NUb1RhZ1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY2xhc3NUb1RhZyhDbGFzcykge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDbGFzcy5uYW1lIHdvdWxkIGJlIGJldHRlciBidXQgdGhpcyBpc24ndCBzdXBwb3J0ZWQgaW4gSUUgMTEuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBDbGFzcy50b1N0cmluZygpLm1hdGNoKC9eZnVuY3Rpb25cXHMqKFteXFxzKF0rKS8pWzFdLnJlcGxhY2UoL1xcVysvZywgJy0nKS5yZXBsYWNlKC8oW2EtelxcZF0pKFtBLVowLTldKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkbid0IHBhcnNlIGNsYXNzIG5hbWU6XCIsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFJlYmVsUm91dGVyLnZhbGlkRWxlbWVudFRhZyhuYW1lKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDbGFzcyBuYW1lIGNvdWxkbid0IGJlIHRyYW5zbGF0ZWQgdG8gdGFnLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0YXRpYyBoZWxwZXIgbWV0aG9kIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIGFuIGVsZW1lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWUgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLlxuICAgICAgICAgKiBAcGFyYW0gbmFtZVxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgICAgICovXG5cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJpc1JlZ2lzdGVyZWRFbGVtZW50XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBpc1JlZ2lzdGVyZWRFbGVtZW50KG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpLmNvbnN0cnVjdG9yICE9PSBIVE1MRWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdGF0aWMgaGVscGVyIG1ldGhvZCB0byB0YWtlIGEgd2ViIGNvbXBvbmVudCBjbGFzcywgY3JlYXRlIGFuIGVsZW1lbnQgbmFtZSBhbmQgcmVnaXN0ZXIgdGhlIG5ldyBlbGVtZW50IG9uIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICogQHBhcmFtIENsYXNzXG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3JlYXRlRWxlbWVudFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlRWxlbWVudChDbGFzcykge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSBSZWJlbFJvdXRlci5jbGFzc1RvVGFnKENsYXNzKTtcbiAgICAgICAgICAgIGlmIChSZWJlbFJvdXRlci5pc1JlZ2lzdGVyZWRFbGVtZW50KG5hbWUpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIENsYXNzLnByb3RvdHlwZS5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQobmFtZSwgQ2xhc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2ltcGxlIHN0YXRpYyBoZWxwZXIgbWV0aG9kIGNvbnRhaW5pbmcgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gdmFsaWRhdGUgYW4gZWxlbWVudCBuYW1lXG4gICAgICAgICAqIEBwYXJhbSB0YWdcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwidmFsaWRFbGVtZW50VGFnXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB2YWxpZEVsZW1lbnRUYWcodGFnKSB7XG4gICAgICAgICAgICByZXR1cm4gKC9eW2EtejAtOVxcLV0rJC8udGVzdCh0YWcpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1ldGhvZCB1c2VkIHRvIHJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIFVSTCBwYXRoIGNoYW5nZXMuXG4gICAgICAgICAqIEBwYXJhbSBjYWxsYmFja1xuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInBhdGhDaGFuZ2VcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHBhdGhDaGFuZ2UoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChSZWJlbFJvdXRlci5jaGFuZ2VDYWxsYmFja3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFJlYmVsUm91dGVyLmNoYW5nZUNhbGxiYWNrcyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgUmViZWxSb3V0ZXIuY2hhbmdlQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgdmFyIGNoYW5nZUhhbmRsZXIgPSBmdW5jdGlvbiBjaGFuZ2VIYW5kbGVyKCkge1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqICBldmVudC5vbGRVUkwgYW5kIGV2ZW50Lm5ld1VSTCB3b3VsZCBiZSBiZXR0ZXIgaGVyZSBidXQgdGhpcyBkb2Vzbid0IHdvcmsgaW4gSUUgOihcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLmhyZWYgIT0gUmViZWxSb3V0ZXIub2xkVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIFJlYmVsUm91dGVyLmNoYW5nZUNhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soUmViZWxSb3V0ZXIuaXNCYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIFJlYmVsUm91dGVyLmlzQmFjayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBSZWJlbFJvdXRlci5vbGRVUkwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAod2luZG93Lm9uaGFzaGNoYW5nZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmJsYmFja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIFJlYmVsUm91dGVyLmlzQmFjayA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aW5kb3cub25oYXNoY2hhbmdlID0gY2hhbmdlSGFuZGxlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdGF0aWMgaGVscGVyIG1ldGhvZCB1c2VkIHRvIGdldCB0aGUgcGFyYW1ldGVycyBmcm9tIHRoZSBwcm92aWRlZCByb3V0ZS5cbiAgICAgICAgICogQHBhcmFtIHJlZ2V4XG4gICAgICAgICAqIEBwYXJhbSByb3V0ZVxuICAgICAgICAgKiBAcGFyYW0gcGF0aFxuICAgICAgICAgKiBAcmV0dXJucyB7e319XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0UGFyYW1zRnJvbVVybFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0UGFyYW1zRnJvbVVybChyZWdleCwgcm91dGUsIHBhdGgpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBSZWJlbFJvdXRlci5wYXJzZVF1ZXJ5U3RyaW5nKHBhdGgpO1xuICAgICAgICAgICAgdmFyIHJlID0gL3soXFx3Kyl9L2c7XG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgdmFyIG1hdGNoID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgd2hpbGUgKG1hdGNoID0gcmUuZXhlYyhyb3V0ZSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobWF0Y2hbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlZ2V4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdHMyID0gcmVnZXguZXhlYyhwYXRoKTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0sIGlkeCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbaXRlbV0gPSByZXN1bHRzMltpZHggKyAxXTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RhdGljIGhlbHBlciBtZXRob2QgdXNlZCB0byBnZXQgdGhlIHBhdGggZnJvbSB0aGUgY3VycmVudCBVUkwuXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cblxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldFBhdGhGcm9tVXJsXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRQYXRoRnJvbVVybCgpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5tYXRjaCgvIyguKikkLyk7XG4gICAgICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBSZWJlbFJvdXRlcjtcbn0pKEhUTUxFbGVtZW50KTtcblxuZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwicmViZWwtcm91dGVyXCIsIFJlYmVsUm91dGVyKTtcblxuLyoqXG4gKiBDbGFzcyB3aGljaCByZXByZXNlbnRzIHRoZSByZWJlbC1yb3V0ZSBjdXN0b20gZWxlbWVudFxuICovXG5cbnZhciBSZWJlbFJvdXRlID0gZXhwb3J0cy5SZWJlbFJvdXRlID0gKGZ1bmN0aW9uIChfSFRNTEVsZW1lbnQyKSB7XG4gICAgX2luaGVyaXRzKFJlYmVsUm91dGUsIF9IVE1MRWxlbWVudDIpO1xuXG4gICAgZnVuY3Rpb24gUmViZWxSb3V0ZSgpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFJlYmVsUm91dGUpO1xuXG4gICAgICAgIHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUmViZWxSb3V0ZSkuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFJlYmVsUm91dGU7XG59KShIVE1MRWxlbWVudCk7XG5cbmRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcInJlYmVsLXJvdXRlXCIsIFJlYmVsUm91dGUpO1xuXG4vKipcbiAqIENsYXNzIHdoaWNoIHJlcHJlc2VudHMgdGhlIHJlYmVsLWRlZmF1bHQgY3VzdG9tIGVsZW1lbnRcbiAqL1xuXG52YXIgUmViZWxEZWZhdWx0ID0gKGZ1bmN0aW9uIChfSFRNTEVsZW1lbnQzKSB7XG4gICAgX2luaGVyaXRzKFJlYmVsRGVmYXVsdCwgX0hUTUxFbGVtZW50Myk7XG5cbiAgICBmdW5jdGlvbiBSZWJlbERlZmF1bHQoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBSZWJlbERlZmF1bHQpO1xuXG4gICAgICAgIHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUmViZWxEZWZhdWx0KS5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUmViZWxEZWZhdWx0O1xufSkoSFRNTEVsZW1lbnQpO1xuXG5kb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJyZWJlbC1kZWZhdWx0XCIsIFJlYmVsRGVmYXVsdCk7XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgcHJvdG90eXBlIGZvciBhbiBhbmNob3IgZWxlbWVudCB3aGljaCBhZGRlZCBmdW5jdGlvbmFsaXR5IHRvIHBlcmZvcm0gYSBiYWNrIHRyYW5zaXRpb24uXG4gKi9cblxudmFyIFJlYmVsQmFja0EgPSAoZnVuY3Rpb24gKF9IVE1MQW5jaG9yRWxlbWVudCkge1xuICAgIF9pbmhlcml0cyhSZWJlbEJhY2tBLCBfSFRNTEFuY2hvckVsZW1lbnQpO1xuXG4gICAgZnVuY3Rpb24gUmViZWxCYWNrQSgpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFJlYmVsQmFja0EpO1xuXG4gICAgICAgIHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUmViZWxCYWNrQSkuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNsYXNzKFJlYmVsQmFja0EsIFt7XG4gICAgICAgIGtleTogXCJhdHRhY2hlZENhbGxiYWNrXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzNyA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRoID0gX3RoaXM3LmdldEF0dHJpYnV0ZShcImhyZWZcIik7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgncmJsYmFjaycpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBwYXRoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gUmViZWxCYWNrQTtcbn0pKEhUTUxBbmNob3JFbGVtZW50KTtcbi8qKlxuICogUmVnaXN0ZXIgdGhlIGJhY2sgYnV0dG9uIGN1c3RvbSBlbGVtZW50XG4gKi9cblxuZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwicmViZWwtYmFjay1hXCIsIHtcbiAgICBleHRlbmRzOiBcImFcIixcbiAgICBwcm90b3R5cGU6IFJlYmVsQmFja0EucHJvdG90eXBlXG59KTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm91dGUgb2JqZWN0XG4gKiBAcGFyYW0gb2JqIC0gdGhlIGNvbXBvbmVudCBuYW1lIG9yIHRoZSBIVE1MIHRlbXBsYXRlXG4gKiBAcGFyYW0gcm91dGVcbiAqIEBwYXJhbSByZWdleFxuICogQHBhcmFtIHBhdGhcbiAqIEByZXR1cm5zIHt7fX1cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIF9yb3V0ZVJlc3VsdChvYmosIHJvdXRlLCByZWdleCwgcGF0aCkge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgcmVzdWx0W2tleV0gPSBvYmpba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXN1bHQucm91dGUgPSByb3V0ZTtcbiAgICByZXN1bHQucGF0aCA9IHBhdGg7XG4gICAgcmVzdWx0LnBhcmFtcyA9IFJlYmVsUm91dGVyLmdldFBhcmFtc0Zyb21VcmwocmVnZXgsIHJvdXRlLCBwYXRoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcImttNFVtZlwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9yZWJlbC1yb3V0ZXIvZXM1L3JlYmVsLXJvdXRlci5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9yZWJlbC1yb3V0ZXIvZXM1XCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDE0IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgY29kZSBtYXkgb25seSBiZSB1c2VkIHVuZGVyIHRoZSBCU0Qgc3R5bGUgbGljZW5zZSBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vTElDRU5TRS50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgYXV0aG9ycyBtYXkgYmUgZm91bmQgYXQgaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0FVVEhPUlMudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXQgaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcbiAqIENvZGUgZGlzdHJpYnV0ZWQgYnkgR29vZ2xlIGFzIHBhcnQgb2YgdGhlIHBvbHltZXIgcHJvamVjdCBpcyBhbHNvXG4gKiBzdWJqZWN0IHRvIGFuIGFkZGl0aW9uYWwgSVAgcmlnaHRzIGdyYW50IGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9QQVRFTlRTLnR4dFxuICovXG4vLyBAdmVyc2lvbiAwLjcuMjJcbihmdW5jdGlvbigpIHtcbiAgd2luZG93LldlYkNvbXBvbmVudHMgPSB3aW5kb3cuV2ViQ29tcG9uZW50cyB8fCB7XG4gICAgZmxhZ3M6IHt9XG4gIH07XG4gIHZhciBmaWxlID0gXCJ3ZWJjb21wb25lbnRzLmpzXCI7XG4gIHZhciBzY3JpcHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdzY3JpcHRbc3JjKj1cIicgKyBmaWxlICsgJ1wiXScpO1xuICB2YXIgZmxhZ3MgPSB7fTtcbiAgaWYgKCFmbGFncy5ub09wdHMpIHtcbiAgICBsb2NhdGlvbi5zZWFyY2guc2xpY2UoMSkuc3BsaXQoXCImXCIpLmZvckVhY2goZnVuY3Rpb24ob3B0aW9uKSB7XG4gICAgICB2YXIgcGFydHMgPSBvcHRpb24uc3BsaXQoXCI9XCIpO1xuICAgICAgdmFyIG1hdGNoO1xuICAgICAgaWYgKHBhcnRzWzBdICYmIChtYXRjaCA9IHBhcnRzWzBdLm1hdGNoKC93Yy0oLispLykpKSB7XG4gICAgICAgIGZsYWdzW21hdGNoWzFdXSA9IHBhcnRzWzFdIHx8IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHNjcmlwdCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGE7IGEgPSBzY3JpcHQuYXR0cmlidXRlc1tpXTsgaSsrKSB7XG4gICAgICAgIGlmIChhLm5hbWUgIT09IFwic3JjXCIpIHtcbiAgICAgICAgICBmbGFnc1thLm5hbWVdID0gYS52YWx1ZSB8fCB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChmbGFncy5sb2cgJiYgZmxhZ3MubG9nLnNwbGl0KSB7XG4gICAgICB2YXIgcGFydHMgPSBmbGFncy5sb2cuc3BsaXQoXCIsXCIpO1xuICAgICAgZmxhZ3MubG9nID0ge307XG4gICAgICBwYXJ0cy5mb3JFYWNoKGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgZmxhZ3MubG9nW2ZdID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbGFncy5sb2cgPSB7fTtcbiAgICB9XG4gIH1cbiAgZmxhZ3Muc2hhZG93ID0gZmxhZ3Muc2hhZG93IHx8IGZsYWdzLnNoYWRvd2RvbSB8fCBmbGFncy5wb2x5ZmlsbDtcbiAgaWYgKGZsYWdzLnNoYWRvdyA9PT0gXCJuYXRpdmVcIikge1xuICAgIGZsYWdzLnNoYWRvdyA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIGZsYWdzLnNoYWRvdyA9IGZsYWdzLnNoYWRvdyB8fCAhSFRNTEVsZW1lbnQucHJvdG90eXBlLmNyZWF0ZVNoYWRvd1Jvb3Q7XG4gIH1cbiAgaWYgKGZsYWdzLnJlZ2lzdGVyKSB7XG4gICAgd2luZG93LkN1c3RvbUVsZW1lbnRzID0gd2luZG93LkN1c3RvbUVsZW1lbnRzIHx8IHtcbiAgICAgIGZsYWdzOiB7fVxuICAgIH07XG4gICAgd2luZG93LkN1c3RvbUVsZW1lbnRzLmZsYWdzLnJlZ2lzdGVyID0gZmxhZ3MucmVnaXN0ZXI7XG4gIH1cbiAgV2ViQ29tcG9uZW50cy5mbGFncyA9IGZsYWdzO1xufSkoKTtcblxuaWYgKFdlYkNvbXBvbmVudHMuZmxhZ3Muc2hhZG93KSB7XG4gIGlmICh0eXBlb2YgV2Vha01hcCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcbiAgICAgIHZhciBjb3VudGVyID0gRGF0ZS5ub3coKSAlIDFlOTtcbiAgICAgIHZhciBXZWFrTWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiX19zdFwiICsgKE1hdGgucmFuZG9tKCkgKiAxZTkgPj4+IDApICsgKGNvdW50ZXIrKyArIFwiX19cIik7XG4gICAgICB9O1xuICAgICAgV2Vha01hcC5wcm90b3R5cGUgPSB7XG4gICAgICAgIHNldDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgICAgIHZhciBlbnRyeSA9IGtleVt0aGlzLm5hbWVdO1xuICAgICAgICAgIGlmIChlbnRyeSAmJiBlbnRyeVswXSA9PT0ga2V5KSBlbnRyeVsxXSA9IHZhbHVlOyBlbHNlIGRlZmluZVByb3BlcnR5KGtleSwgdGhpcy5uYW1lLCB7XG4gICAgICAgICAgICB2YWx1ZTogWyBrZXksIHZhbHVlIF0sXG4gICAgICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgIHZhciBlbnRyeTtcbiAgICAgICAgICByZXR1cm4gKGVudHJ5ID0ga2V5W3RoaXMubmFtZV0pICYmIGVudHJ5WzBdID09PSBrZXkgPyBlbnRyeVsxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWxldGVcIjogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMubmFtZV07XG4gICAgICAgICAgaWYgKCFlbnRyeSB8fCBlbnRyeVswXSAhPT0ga2V5KSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgZW50cnlbMF0gPSBlbnRyeVsxXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5uYW1lXTtcbiAgICAgICAgICBpZiAoIWVudHJ5KSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIGVudHJ5WzBdID09PSBrZXk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICB3aW5kb3cuV2Vha01hcCA9IFdlYWtNYXA7XG4gICAgfSkoKTtcbiAgfVxuICB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwgPSB7fTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIGNvbnN0cnVjdG9yVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBuYXRpdmVQcm90b3R5cGVUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIHdyYXBwZXJzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBmdW5jdGlvbiBkZXRlY3RFdmFsKCkge1xuICAgICAgaWYgKHR5cGVvZiBjaHJvbWUgIT09IFwidW5kZWZpbmVkXCIgJiYgY2hyb21lLmFwcCAmJiBjaHJvbWUuYXBwLnJ1bnRpbWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKG5hdmlnYXRvci5nZXREZXZpY2VTdG9yYWdlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBmID0gbmV3IEZ1bmN0aW9uKFwicmV0dXJuIHRydWU7XCIpO1xuICAgICAgICByZXR1cm4gZigpO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgaGFzRXZhbCA9IGRldGVjdEV2YWwoKTtcbiAgICBmdW5jdGlvbiBhc3NlcnQoYikge1xuICAgICAgaWYgKCFiKSB0aHJvdyBuZXcgRXJyb3IoXCJBc3NlcnRpb24gZmFpbGVkXCIpO1xuICAgIH1cbiAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG4gICAgdmFyIGdldE93blByb3BlcnR5TmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcztcbiAgICB2YXIgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcbiAgICBmdW5jdGlvbiBtaXhpbih0bywgZnJvbSkge1xuICAgICAgdmFyIG5hbWVzID0gZ2V0T3duUHJvcGVydHlOYW1lcyhmcm9tKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgZGVmaW5lUHJvcGVydHkodG8sIG5hbWUsIGdldE93blByb3BlcnR5RGVzY3JpcHRvcihmcm9tLCBuYW1lKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG87XG4gICAgfVxuICAgIGZ1bmN0aW9uIG1peGluU3RhdGljcyh0bywgZnJvbSkge1xuICAgICAgdmFyIG5hbWVzID0gZ2V0T3duUHJvcGVydHlOYW1lcyhmcm9tKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICBjYXNlIFwiYXJndW1lbnRzXCI6XG4gICAgICAgICBjYXNlIFwiY2FsbGVyXCI6XG4gICAgICAgICBjYXNlIFwibGVuZ3RoXCI6XG4gICAgICAgICBjYXNlIFwibmFtZVwiOlxuICAgICAgICAgY2FzZSBcInByb3RvdHlwZVwiOlxuICAgICAgICAgY2FzZSBcInRvU3RyaW5nXCI6XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZGVmaW5lUHJvcGVydHkodG8sIG5hbWUsIGdldE93blByb3BlcnR5RGVzY3JpcHRvcihmcm9tLCBuYW1lKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG87XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uZU9mKG9iamVjdCwgcHJvcGVydHlOYW1lcykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wZXJ0eU5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0eU5hbWVzW2ldIGluIG9iamVjdCkgcmV0dXJuIHByb3BlcnR5TmFtZXNbaV07XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBub25FbnVtZXJhYmxlRGF0YURlc2NyaXB0b3IgPSB7XG4gICAgICB2YWx1ZTogdW5kZWZpbmVkLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH07XG4gICAgZnVuY3Rpb24gZGVmaW5lTm9uRW51bWVyYWJsZURhdGFQcm9wZXJ0eShvYmplY3QsIG5hbWUsIHZhbHVlKSB7XG4gICAgICBub25FbnVtZXJhYmxlRGF0YURlc2NyaXB0b3IudmFsdWUgPSB2YWx1ZTtcbiAgICAgIGRlZmluZVByb3BlcnR5KG9iamVjdCwgbmFtZSwgbm9uRW51bWVyYWJsZURhdGFEZXNjcmlwdG9yKTtcbiAgICB9XG4gICAgZ2V0T3duUHJvcGVydHlOYW1lcyh3aW5kb3cpO1xuICAgIGZ1bmN0aW9uIGdldFdyYXBwZXJDb25zdHJ1Y3Rvcihub2RlLCBvcHRfaW5zdGFuY2UpIHtcbiAgICAgIHZhciBuYXRpdmVQcm90b3R5cGUgPSBub2RlLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobm9kZSk7XG4gICAgICBpZiAoaXNGaXJlZm94KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZ2V0T3duUHJvcGVydHlOYW1lcyhuYXRpdmVQcm90b3R5cGUpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIG5hdGl2ZVByb3RvdHlwZSA9IG5hdGl2ZVByb3RvdHlwZS5fX3Byb3RvX187XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciB3cmFwcGVyQ29uc3RydWN0b3IgPSBjb25zdHJ1Y3RvclRhYmxlLmdldChuYXRpdmVQcm90b3R5cGUpO1xuICAgICAgaWYgKHdyYXBwZXJDb25zdHJ1Y3RvcikgcmV0dXJuIHdyYXBwZXJDb25zdHJ1Y3RvcjtcbiAgICAgIHZhciBwYXJlbnRXcmFwcGVyQ29uc3RydWN0b3IgPSBnZXRXcmFwcGVyQ29uc3RydWN0b3IobmF0aXZlUHJvdG90eXBlKTtcbiAgICAgIHZhciBHZW5lcmF0ZWRXcmFwcGVyID0gY3JlYXRlV3JhcHBlckNvbnN0cnVjdG9yKHBhcmVudFdyYXBwZXJDb25zdHJ1Y3Rvcik7XG4gICAgICByZWdpc3RlckludGVybmFsKG5hdGl2ZVByb3RvdHlwZSwgR2VuZXJhdGVkV3JhcHBlciwgb3B0X2luc3RhbmNlKTtcbiAgICAgIHJldHVybiBHZW5lcmF0ZWRXcmFwcGVyO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhZGRGb3J3YXJkaW5nUHJvcGVydGllcyhuYXRpdmVQcm90b3R5cGUsIHdyYXBwZXJQcm90b3R5cGUpIHtcbiAgICAgIGluc3RhbGxQcm9wZXJ0eShuYXRpdmVQcm90b3R5cGUsIHdyYXBwZXJQcm90b3R5cGUsIHRydWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZWdpc3Rlckluc3RhbmNlUHJvcGVydGllcyh3cmFwcGVyUHJvdG90eXBlLCBpbnN0YW5jZU9iamVjdCkge1xuICAgICAgaW5zdGFsbFByb3BlcnR5KGluc3RhbmNlT2JqZWN0LCB3cmFwcGVyUHJvdG90eXBlLCBmYWxzZSk7XG4gICAgfVxuICAgIHZhciBpc0ZpcmVmb3ggPSAvRmlyZWZveC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgICB2YXIgZHVtbXlEZXNjcmlwdG9yID0ge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHt9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2KSB7fSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGlzRXZlbnRIYW5kbGVyTmFtZShuYW1lKSB7XG4gICAgICByZXR1cm4gL15vblthLXpdKyQvLnRlc3QobmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzSWRlbnRpZmllck5hbWUobmFtZSkge1xuICAgICAgcmV0dXJuIC9eW2EtekEtWl8kXVthLXpBLVpfJDAtOV0qJC8udGVzdChuYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0R2V0dGVyKG5hbWUpIHtcbiAgICAgIHJldHVybiBoYXNFdmFsICYmIGlzSWRlbnRpZmllck5hbWUobmFtZSkgPyBuZXcgRnVuY3Rpb24oXCJyZXR1cm4gdGhpcy5fX2ltcGw0Y2YxZTc4MmhnX18uXCIgKyBuYW1lKSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX2ltcGw0Y2YxZTc4MmhnX19bbmFtZV07XG4gICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRTZXR0ZXIobmFtZSkge1xuICAgICAgcmV0dXJuIGhhc0V2YWwgJiYgaXNJZGVudGlmaWVyTmFtZShuYW1lKSA/IG5ldyBGdW5jdGlvbihcInZcIiwgXCJ0aGlzLl9faW1wbDRjZjFlNzgyaGdfXy5cIiArIG5hbWUgKyBcIiA9IHZcIikgOiBmdW5jdGlvbih2KSB7XG4gICAgICAgIHRoaXMuX19pbXBsNGNmMWU3ODJoZ19fW25hbWVdID0gdjtcbiAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldE1ldGhvZChuYW1lKSB7XG4gICAgICByZXR1cm4gaGFzRXZhbCAmJiBpc0lkZW50aWZpZXJOYW1lKG5hbWUpID8gbmV3IEZ1bmN0aW9uKFwicmV0dXJuIHRoaXMuX19pbXBsNGNmMWU3ODJoZ19fLlwiICsgbmFtZSArIFwiLmFwcGx5KHRoaXMuX19pbXBsNGNmMWU3ODJoZ19fLCBhcmd1bWVudHMpXCIpIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9faW1wbDRjZjFlNzgyaGdfX1tuYW1lXS5hcHBseSh0aGlzLl9faW1wbDRjZjFlNzgyaGdfXywgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldERlc2NyaXB0b3Ioc291cmNlLCBuYW1lKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihzb3VyY2UsIG5hbWUpO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgcmV0dXJuIGR1bW15RGVzY3JpcHRvcjtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGlzQnJva2VuU2FmYXJpID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZGVzY3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE5vZGUucHJvdG90eXBlLCBcIm5vZGVUeXBlXCIpO1xuICAgICAgcmV0dXJuIGRlc2NyICYmICFkZXNjci5nZXQgJiYgIWRlc2NyLnNldDtcbiAgICB9KCk7XG4gICAgZnVuY3Rpb24gaW5zdGFsbFByb3BlcnR5KHNvdXJjZSwgdGFyZ2V0LCBhbGxvd01ldGhvZCwgb3B0X2JsYWNrbGlzdCkge1xuICAgICAgdmFyIG5hbWVzID0gZ2V0T3duUHJvcGVydHlOYW1lcyhzb3VyY2UpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbmFtZSA9IG5hbWVzW2ldO1xuICAgICAgICBpZiAobmFtZSA9PT0gXCJwb2x5bWVyQmxhY2tMaXN0X1wiKSBjb250aW51ZTtcbiAgICAgICAgaWYgKG5hbWUgaW4gdGFyZ2V0KSBjb250aW51ZTtcbiAgICAgICAgaWYgKHNvdXJjZS5wb2x5bWVyQmxhY2tMaXN0XyAmJiBzb3VyY2UucG9seW1lckJsYWNrTGlzdF9bbmFtZV0pIGNvbnRpbnVlO1xuICAgICAgICBpZiAoaXNGaXJlZm94KSB7XG4gICAgICAgICAgc291cmNlLl9fbG9va3VwR2V0dGVyX18obmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRlc2NyaXB0b3IgPSBnZXREZXNjcmlwdG9yKHNvdXJjZSwgbmFtZSk7XG4gICAgICAgIHZhciBnZXR0ZXIsIHNldHRlcjtcbiAgICAgICAgaWYgKHR5cGVvZiBkZXNjcmlwdG9yLnZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICBpZiAoYWxsb3dNZXRob2QpIHtcbiAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGdldE1ldGhvZChuYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlzRXZlbnQgPSBpc0V2ZW50SGFuZGxlck5hbWUobmFtZSk7XG4gICAgICAgIGlmIChpc0V2ZW50KSBnZXR0ZXIgPSBzY29wZS5nZXRFdmVudEhhbmRsZXJHZXR0ZXIobmFtZSk7IGVsc2UgZ2V0dGVyID0gZ2V0R2V0dGVyKG5hbWUpO1xuICAgICAgICBpZiAoZGVzY3JpcHRvci53cml0YWJsZSB8fCBkZXNjcmlwdG9yLnNldCB8fCBpc0Jyb2tlblNhZmFyaSkge1xuICAgICAgICAgIGlmIChpc0V2ZW50KSBzZXR0ZXIgPSBzY29wZS5nZXRFdmVudEhhbmRsZXJTZXR0ZXIobmFtZSk7IGVsc2Ugc2V0dGVyID0gZ2V0U2V0dGVyKG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjb25maWd1cmFibGUgPSBpc0Jyb2tlblNhZmFyaSB8fCBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZTtcbiAgICAgICAgZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBuYW1lLCB7XG4gICAgICAgICAgZ2V0OiBnZXR0ZXIsXG4gICAgICAgICAgc2V0OiBzZXR0ZXIsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiBjb25maWd1cmFibGUsXG4gICAgICAgICAgZW51bWVyYWJsZTogZGVzY3JpcHRvci5lbnVtZXJhYmxlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiByZWdpc3RlcihuYXRpdmVDb25zdHJ1Y3Rvciwgd3JhcHBlckNvbnN0cnVjdG9yLCBvcHRfaW5zdGFuY2UpIHtcbiAgICAgIGlmIChuYXRpdmVDb25zdHJ1Y3RvciA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBuYXRpdmVQcm90b3R5cGUgPSBuYXRpdmVDb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgICByZWdpc3RlckludGVybmFsKG5hdGl2ZVByb3RvdHlwZSwgd3JhcHBlckNvbnN0cnVjdG9yLCBvcHRfaW5zdGFuY2UpO1xuICAgICAgbWl4aW5TdGF0aWNzKHdyYXBwZXJDb25zdHJ1Y3RvciwgbmF0aXZlQ29uc3RydWN0b3IpO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZWdpc3RlckludGVybmFsKG5hdGl2ZVByb3RvdHlwZSwgd3JhcHBlckNvbnN0cnVjdG9yLCBvcHRfaW5zdGFuY2UpIHtcbiAgICAgIHZhciB3cmFwcGVyUHJvdG90eXBlID0gd3JhcHBlckNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgICAgIGFzc2VydChjb25zdHJ1Y3RvclRhYmxlLmdldChuYXRpdmVQcm90b3R5cGUpID09PSB1bmRlZmluZWQpO1xuICAgICAgY29uc3RydWN0b3JUYWJsZS5zZXQobmF0aXZlUHJvdG90eXBlLCB3cmFwcGVyQ29uc3RydWN0b3IpO1xuICAgICAgbmF0aXZlUHJvdG90eXBlVGFibGUuc2V0KHdyYXBwZXJQcm90b3R5cGUsIG5hdGl2ZVByb3RvdHlwZSk7XG4gICAgICBhZGRGb3J3YXJkaW5nUHJvcGVydGllcyhuYXRpdmVQcm90b3R5cGUsIHdyYXBwZXJQcm90b3R5cGUpO1xuICAgICAgaWYgKG9wdF9pbnN0YW5jZSkgcmVnaXN0ZXJJbnN0YW5jZVByb3BlcnRpZXMod3JhcHBlclByb3RvdHlwZSwgb3B0X2luc3RhbmNlKTtcbiAgICAgIGRlZmluZU5vbkVudW1lcmFibGVEYXRhUHJvcGVydHkod3JhcHBlclByb3RvdHlwZSwgXCJjb25zdHJ1Y3RvclwiLCB3cmFwcGVyQ29uc3RydWN0b3IpO1xuICAgICAgd3JhcHBlckNvbnN0cnVjdG9yLnByb3RvdHlwZSA9IHdyYXBwZXJQcm90b3R5cGU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzV3JhcHBlckZvcih3cmFwcGVyQ29uc3RydWN0b3IsIG5hdGl2ZUNvbnN0cnVjdG9yKSB7XG4gICAgICByZXR1cm4gY29uc3RydWN0b3JUYWJsZS5nZXQobmF0aXZlQ29uc3RydWN0b3IucHJvdG90eXBlKSA9PT0gd3JhcHBlckNvbnN0cnVjdG9yO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZWdpc3Rlck9iamVjdChvYmplY3QpIHtcbiAgICAgIHZhciBuYXRpdmVQcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTtcbiAgICAgIHZhciBzdXBlcldyYXBwZXJDb25zdHJ1Y3RvciA9IGdldFdyYXBwZXJDb25zdHJ1Y3RvcihuYXRpdmVQcm90b3R5cGUpO1xuICAgICAgdmFyIEdlbmVyYXRlZFdyYXBwZXIgPSBjcmVhdGVXcmFwcGVyQ29uc3RydWN0b3Ioc3VwZXJXcmFwcGVyQ29uc3RydWN0b3IpO1xuICAgICAgcmVnaXN0ZXJJbnRlcm5hbChuYXRpdmVQcm90b3R5cGUsIEdlbmVyYXRlZFdyYXBwZXIsIG9iamVjdCk7XG4gICAgICByZXR1cm4gR2VuZXJhdGVkV3JhcHBlcjtcbiAgICB9XG4gICAgZnVuY3Rpb24gY3JlYXRlV3JhcHBlckNvbnN0cnVjdG9yKHN1cGVyV3JhcHBlckNvbnN0cnVjdG9yKSB7XG4gICAgICBmdW5jdGlvbiBHZW5lcmF0ZWRXcmFwcGVyKG5vZGUpIHtcbiAgICAgICAgc3VwZXJXcmFwcGVyQ29uc3RydWN0b3IuY2FsbCh0aGlzLCBub2RlKTtcbiAgICAgIH1cbiAgICAgIHZhciBwID0gT2JqZWN0LmNyZWF0ZShzdXBlcldyYXBwZXJDb25zdHJ1Y3Rvci5wcm90b3R5cGUpO1xuICAgICAgcC5jb25zdHJ1Y3RvciA9IEdlbmVyYXRlZFdyYXBwZXI7XG4gICAgICBHZW5lcmF0ZWRXcmFwcGVyLnByb3RvdHlwZSA9IHA7XG4gICAgICByZXR1cm4gR2VuZXJhdGVkV3JhcHBlcjtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNXcmFwcGVyKG9iamVjdCkge1xuICAgICAgcmV0dXJuIG9iamVjdCAmJiBvYmplY3QuX19pbXBsNGNmMWU3ODJoZ19fO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc05hdGl2ZShvYmplY3QpIHtcbiAgICAgIHJldHVybiAhaXNXcmFwcGVyKG9iamVjdCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHdyYXAoaW1wbCkge1xuICAgICAgaWYgKGltcGwgPT09IG51bGwpIHJldHVybiBudWxsO1xuICAgICAgYXNzZXJ0KGlzTmF0aXZlKGltcGwpKTtcbiAgICAgIHZhciB3cmFwcGVyID0gaW1wbC5fX3dyYXBwZXI4ZTNkZDkzYTYwX187XG4gICAgICBpZiAod3JhcHBlciAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB3cmFwcGVyO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGltcGwuX193cmFwcGVyOGUzZGQ5M2E2MF9fID0gbmV3IChnZXRXcmFwcGVyQ29uc3RydWN0b3IoaW1wbCwgaW1wbCkpKGltcGwpO1xuICAgIH1cbiAgICBmdW5jdGlvbiB1bndyYXAod3JhcHBlcikge1xuICAgICAgaWYgKHdyYXBwZXIgPT09IG51bGwpIHJldHVybiBudWxsO1xuICAgICAgYXNzZXJ0KGlzV3JhcHBlcih3cmFwcGVyKSk7XG4gICAgICByZXR1cm4gd3JhcHBlci5fX2ltcGw0Y2YxZTc4MmhnX187XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVuc2FmZVVud3JhcCh3cmFwcGVyKSB7XG4gICAgICByZXR1cm4gd3JhcHBlci5fX2ltcGw0Y2YxZTc4MmhnX187XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNldFdyYXBwZXIoaW1wbCwgd3JhcHBlcikge1xuICAgICAgd3JhcHBlci5fX2ltcGw0Y2YxZTc4MmhnX18gPSBpbXBsO1xuICAgICAgaW1wbC5fX3dyYXBwZXI4ZTNkZDkzYTYwX18gPSB3cmFwcGVyO1xuICAgIH1cbiAgICBmdW5jdGlvbiB1bndyYXBJZk5lZWRlZChvYmplY3QpIHtcbiAgICAgIHJldHVybiBvYmplY3QgJiYgaXNXcmFwcGVyKG9iamVjdCkgPyB1bndyYXAob2JqZWN0KSA6IG9iamVjdDtcbiAgICB9XG4gICAgZnVuY3Rpb24gd3JhcElmTmVlZGVkKG9iamVjdCkge1xuICAgICAgcmV0dXJuIG9iamVjdCAmJiAhaXNXcmFwcGVyKG9iamVjdCkgPyB3cmFwKG9iamVjdCkgOiBvYmplY3Q7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJld3JhcChub2RlLCB3cmFwcGVyKSB7XG4gICAgICBpZiAod3JhcHBlciA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgYXNzZXJ0KGlzTmF0aXZlKG5vZGUpKTtcbiAgICAgIGFzc2VydCh3cmFwcGVyID09PSB1bmRlZmluZWQgfHwgaXNXcmFwcGVyKHdyYXBwZXIpKTtcbiAgICAgIG5vZGUuX193cmFwcGVyOGUzZGQ5M2E2MF9fID0gd3JhcHBlcjtcbiAgICB9XG4gICAgdmFyIGdldHRlckRlc2NyaXB0b3IgPSB7XG4gICAgICBnZXQ6IHVuZGVmaW5lZCxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGRlZmluZUdldHRlcihjb25zdHJ1Y3RvciwgbmFtZSwgZ2V0dGVyKSB7XG4gICAgICBnZXR0ZXJEZXNjcmlwdG9yLmdldCA9IGdldHRlcjtcbiAgICAgIGRlZmluZVByb3BlcnR5KGNvbnN0cnVjdG9yLnByb3RvdHlwZSwgbmFtZSwgZ2V0dGVyRGVzY3JpcHRvcik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRlZmluZVdyYXBHZXR0ZXIoY29uc3RydWN0b3IsIG5hbWUpIHtcbiAgICAgIGRlZmluZUdldHRlcihjb25zdHJ1Y3RvciwgbmFtZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHRoaXMuX19pbXBsNGNmMWU3ODJoZ19fW25hbWVdKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmb3J3YXJkTWV0aG9kc1RvV3JhcHBlcihjb25zdHJ1Y3RvcnMsIG5hbWVzKSB7XG4gICAgICBjb25zdHJ1Y3RvcnMuZm9yRWFjaChmdW5jdGlvbihjb25zdHJ1Y3Rvcikge1xuICAgICAgICBuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICBjb25zdHJ1Y3Rvci5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB3ID0gd3JhcElmTmVlZGVkKHRoaXMpO1xuICAgICAgICAgICAgcmV0dXJuIHdbbmFtZV0uYXBwbHkodywgYXJndW1lbnRzKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBzY29wZS5hZGRGb3J3YXJkaW5nUHJvcGVydGllcyA9IGFkZEZvcndhcmRpbmdQcm9wZXJ0aWVzO1xuICAgIHNjb3BlLmFzc2VydCA9IGFzc2VydDtcbiAgICBzY29wZS5jb25zdHJ1Y3RvclRhYmxlID0gY29uc3RydWN0b3JUYWJsZTtcbiAgICBzY29wZS5kZWZpbmVHZXR0ZXIgPSBkZWZpbmVHZXR0ZXI7XG4gICAgc2NvcGUuZGVmaW5lV3JhcEdldHRlciA9IGRlZmluZVdyYXBHZXR0ZXI7XG4gICAgc2NvcGUuZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXIgPSBmb3J3YXJkTWV0aG9kc1RvV3JhcHBlcjtcbiAgICBzY29wZS5pc0lkZW50aWZpZXJOYW1lID0gaXNJZGVudGlmaWVyTmFtZTtcbiAgICBzY29wZS5pc1dyYXBwZXIgPSBpc1dyYXBwZXI7XG4gICAgc2NvcGUuaXNXcmFwcGVyRm9yID0gaXNXcmFwcGVyRm9yO1xuICAgIHNjb3BlLm1peGluID0gbWl4aW47XG4gICAgc2NvcGUubmF0aXZlUHJvdG90eXBlVGFibGUgPSBuYXRpdmVQcm90b3R5cGVUYWJsZTtcbiAgICBzY29wZS5vbmVPZiA9IG9uZU9mO1xuICAgIHNjb3BlLnJlZ2lzdGVyT2JqZWN0ID0gcmVnaXN0ZXJPYmplY3Q7XG4gICAgc2NvcGUucmVnaXN0ZXJXcmFwcGVyID0gcmVnaXN0ZXI7XG4gICAgc2NvcGUucmV3cmFwID0gcmV3cmFwO1xuICAgIHNjb3BlLnNldFdyYXBwZXIgPSBzZXRXcmFwcGVyO1xuICAgIHNjb3BlLnVuc2FmZVVud3JhcCA9IHVuc2FmZVVud3JhcDtcbiAgICBzY29wZS51bndyYXAgPSB1bndyYXA7XG4gICAgc2NvcGUudW53cmFwSWZOZWVkZWQgPSB1bndyYXBJZk5lZWRlZDtcbiAgICBzY29wZS53cmFwID0gd3JhcDtcbiAgICBzY29wZS53cmFwSWZOZWVkZWQgPSB3cmFwSWZOZWVkZWQ7XG4gICAgc2NvcGUud3JhcHBlcnMgPSB3cmFwcGVycztcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZnVuY3Rpb24gbmV3U3BsaWNlKGluZGV4LCByZW1vdmVkLCBhZGRlZENvdW50KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgIHJlbW92ZWQ6IHJlbW92ZWQsXG4gICAgICAgIGFkZGVkQ291bnQ6IGFkZGVkQ291bnRcbiAgICAgIH07XG4gICAgfVxuICAgIHZhciBFRElUX0xFQVZFID0gMDtcbiAgICB2YXIgRURJVF9VUERBVEUgPSAxO1xuICAgIHZhciBFRElUX0FERCA9IDI7XG4gICAgdmFyIEVESVRfREVMRVRFID0gMztcbiAgICBmdW5jdGlvbiBBcnJheVNwbGljZSgpIHt9XG4gICAgQXJyYXlTcGxpY2UucHJvdG90eXBlID0ge1xuICAgICAgY2FsY0VkaXREaXN0YW5jZXM6IGZ1bmN0aW9uKGN1cnJlbnQsIGN1cnJlbnRTdGFydCwgY3VycmVudEVuZCwgb2xkLCBvbGRTdGFydCwgb2xkRW5kKSB7XG4gICAgICAgIHZhciByb3dDb3VudCA9IG9sZEVuZCAtIG9sZFN0YXJ0ICsgMTtcbiAgICAgICAgdmFyIGNvbHVtbkNvdW50ID0gY3VycmVudEVuZCAtIGN1cnJlbnRTdGFydCArIDE7XG4gICAgICAgIHZhciBkaXN0YW5jZXMgPSBuZXcgQXJyYXkocm93Q291bnQpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJvd0NvdW50OyBpKyspIHtcbiAgICAgICAgICBkaXN0YW5jZXNbaV0gPSBuZXcgQXJyYXkoY29sdW1uQ291bnQpO1xuICAgICAgICAgIGRpc3RhbmNlc1tpXVswXSA9IGk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb2x1bW5Db3VudDsgaisrKSBkaXN0YW5jZXNbMF1bal0gPSBqO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHJvd0NvdW50OyBpKyspIHtcbiAgICAgICAgICBmb3IgKHZhciBqID0gMTsgaiA8IGNvbHVtbkNvdW50OyBqKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVxdWFscyhjdXJyZW50W2N1cnJlbnRTdGFydCArIGogLSAxXSwgb2xkW29sZFN0YXJ0ICsgaSAtIDFdKSkgZGlzdGFuY2VzW2ldW2pdID0gZGlzdGFuY2VzW2kgLSAxXVtqIC0gMV07IGVsc2Uge1xuICAgICAgICAgICAgICB2YXIgbm9ydGggPSBkaXN0YW5jZXNbaSAtIDFdW2pdICsgMTtcbiAgICAgICAgICAgICAgdmFyIHdlc3QgPSBkaXN0YW5jZXNbaV1baiAtIDFdICsgMTtcbiAgICAgICAgICAgICAgZGlzdGFuY2VzW2ldW2pdID0gbm9ydGggPCB3ZXN0ID8gbm9ydGggOiB3ZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlzdGFuY2VzO1xuICAgICAgfSxcbiAgICAgIHNwbGljZU9wZXJhdGlvbnNGcm9tRWRpdERpc3RhbmNlczogZnVuY3Rpb24oZGlzdGFuY2VzKSB7XG4gICAgICAgIHZhciBpID0gZGlzdGFuY2VzLmxlbmd0aCAtIDE7XG4gICAgICAgIHZhciBqID0gZGlzdGFuY2VzWzBdLmxlbmd0aCAtIDE7XG4gICAgICAgIHZhciBjdXJyZW50ID0gZGlzdGFuY2VzW2ldW2pdO1xuICAgICAgICB2YXIgZWRpdHMgPSBbXTtcbiAgICAgICAgd2hpbGUgKGkgPiAwIHx8IGogPiAwKSB7XG4gICAgICAgICAgaWYgKGkgPT0gMCkge1xuICAgICAgICAgICAgZWRpdHMucHVzaChFRElUX0FERCk7XG4gICAgICAgICAgICBqLS07XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGogPT0gMCkge1xuICAgICAgICAgICAgZWRpdHMucHVzaChFRElUX0RFTEVURSk7XG4gICAgICAgICAgICBpLS07XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIG5vcnRoV2VzdCA9IGRpc3RhbmNlc1tpIC0gMV1baiAtIDFdO1xuICAgICAgICAgIHZhciB3ZXN0ID0gZGlzdGFuY2VzW2kgLSAxXVtqXTtcbiAgICAgICAgICB2YXIgbm9ydGggPSBkaXN0YW5jZXNbaV1baiAtIDFdO1xuICAgICAgICAgIHZhciBtaW47XG4gICAgICAgICAgaWYgKHdlc3QgPCBub3J0aCkgbWluID0gd2VzdCA8IG5vcnRoV2VzdCA/IHdlc3QgOiBub3J0aFdlc3Q7IGVsc2UgbWluID0gbm9ydGggPCBub3J0aFdlc3QgPyBub3J0aCA6IG5vcnRoV2VzdDtcbiAgICAgICAgICBpZiAobWluID09IG5vcnRoV2VzdCkge1xuICAgICAgICAgICAgaWYgKG5vcnRoV2VzdCA9PSBjdXJyZW50KSB7XG4gICAgICAgICAgICAgIGVkaXRzLnB1c2goRURJVF9MRUFWRSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBlZGl0cy5wdXNoKEVESVRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgY3VycmVudCA9IG5vcnRoV2VzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgIGotLTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG1pbiA9PSB3ZXN0KSB7XG4gICAgICAgICAgICBlZGl0cy5wdXNoKEVESVRfREVMRVRFKTtcbiAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgIGN1cnJlbnQgPSB3ZXN0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlZGl0cy5wdXNoKEVESVRfQUREKTtcbiAgICAgICAgICAgIGotLTtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBub3J0aDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWRpdHMucmV2ZXJzZSgpO1xuICAgICAgICByZXR1cm4gZWRpdHM7XG4gICAgICB9LFxuICAgICAgY2FsY1NwbGljZXM6IGZ1bmN0aW9uKGN1cnJlbnQsIGN1cnJlbnRTdGFydCwgY3VycmVudEVuZCwgb2xkLCBvbGRTdGFydCwgb2xkRW5kKSB7XG4gICAgICAgIHZhciBwcmVmaXhDb3VudCA9IDA7XG4gICAgICAgIHZhciBzdWZmaXhDb3VudCA9IDA7XG4gICAgICAgIHZhciBtaW5MZW5ndGggPSBNYXRoLm1pbihjdXJyZW50RW5kIC0gY3VycmVudFN0YXJ0LCBvbGRFbmQgLSBvbGRTdGFydCk7XG4gICAgICAgIGlmIChjdXJyZW50U3RhcnQgPT0gMCAmJiBvbGRTdGFydCA9PSAwKSBwcmVmaXhDb3VudCA9IHRoaXMuc2hhcmVkUHJlZml4KGN1cnJlbnQsIG9sZCwgbWluTGVuZ3RoKTtcbiAgICAgICAgaWYgKGN1cnJlbnRFbmQgPT0gY3VycmVudC5sZW5ndGggJiYgb2xkRW5kID09IG9sZC5sZW5ndGgpIHN1ZmZpeENvdW50ID0gdGhpcy5zaGFyZWRTdWZmaXgoY3VycmVudCwgb2xkLCBtaW5MZW5ndGggLSBwcmVmaXhDb3VudCk7XG4gICAgICAgIGN1cnJlbnRTdGFydCArPSBwcmVmaXhDb3VudDtcbiAgICAgICAgb2xkU3RhcnQgKz0gcHJlZml4Q291bnQ7XG4gICAgICAgIGN1cnJlbnRFbmQgLT0gc3VmZml4Q291bnQ7XG4gICAgICAgIG9sZEVuZCAtPSBzdWZmaXhDb3VudDtcbiAgICAgICAgaWYgKGN1cnJlbnRFbmQgLSBjdXJyZW50U3RhcnQgPT0gMCAmJiBvbGRFbmQgLSBvbGRTdGFydCA9PSAwKSByZXR1cm4gW107XG4gICAgICAgIGlmIChjdXJyZW50U3RhcnQgPT0gY3VycmVudEVuZCkge1xuICAgICAgICAgIHZhciBzcGxpY2UgPSBuZXdTcGxpY2UoY3VycmVudFN0YXJ0LCBbXSwgMCk7XG4gICAgICAgICAgd2hpbGUgKG9sZFN0YXJ0IDwgb2xkRW5kKSBzcGxpY2UucmVtb3ZlZC5wdXNoKG9sZFtvbGRTdGFydCsrXSk7XG4gICAgICAgICAgcmV0dXJuIFsgc3BsaWNlIF07XG4gICAgICAgIH0gZWxzZSBpZiAob2xkU3RhcnQgPT0gb2xkRW5kKSByZXR1cm4gWyBuZXdTcGxpY2UoY3VycmVudFN0YXJ0LCBbXSwgY3VycmVudEVuZCAtIGN1cnJlbnRTdGFydCkgXTtcbiAgICAgICAgdmFyIG9wcyA9IHRoaXMuc3BsaWNlT3BlcmF0aW9uc0Zyb21FZGl0RGlzdGFuY2VzKHRoaXMuY2FsY0VkaXREaXN0YW5jZXMoY3VycmVudCwgY3VycmVudFN0YXJ0LCBjdXJyZW50RW5kLCBvbGQsIG9sZFN0YXJ0LCBvbGRFbmQpKTtcbiAgICAgICAgdmFyIHNwbGljZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdmFyIHNwbGljZXMgPSBbXTtcbiAgICAgICAgdmFyIGluZGV4ID0gY3VycmVudFN0YXJ0O1xuICAgICAgICB2YXIgb2xkSW5kZXggPSBvbGRTdGFydDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBzd2l0Y2ggKG9wc1tpXSkge1xuICAgICAgICAgICBjYXNlIEVESVRfTEVBVkU6XG4gICAgICAgICAgICBpZiAoc3BsaWNlKSB7XG4gICAgICAgICAgICAgIHNwbGljZXMucHVzaChzcGxpY2UpO1xuICAgICAgICAgICAgICBzcGxpY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgb2xkSW5kZXgrKztcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgIGNhc2UgRURJVF9VUERBVEU6XG4gICAgICAgICAgICBpZiAoIXNwbGljZSkgc3BsaWNlID0gbmV3U3BsaWNlKGluZGV4LCBbXSwgMCk7XG4gICAgICAgICAgICBzcGxpY2UuYWRkZWRDb3VudCsrO1xuICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgIHNwbGljZS5yZW1vdmVkLnB1c2gob2xkW29sZEluZGV4XSk7XG4gICAgICAgICAgICBvbGRJbmRleCsrO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgY2FzZSBFRElUX0FERDpcbiAgICAgICAgICAgIGlmICghc3BsaWNlKSBzcGxpY2UgPSBuZXdTcGxpY2UoaW5kZXgsIFtdLCAwKTtcbiAgICAgICAgICAgIHNwbGljZS5hZGRlZENvdW50Kys7XG4gICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgY2FzZSBFRElUX0RFTEVURTpcbiAgICAgICAgICAgIGlmICghc3BsaWNlKSBzcGxpY2UgPSBuZXdTcGxpY2UoaW5kZXgsIFtdLCAwKTtcbiAgICAgICAgICAgIHNwbGljZS5yZW1vdmVkLnB1c2gob2xkW29sZEluZGV4XSk7XG4gICAgICAgICAgICBvbGRJbmRleCsrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzcGxpY2UpIHtcbiAgICAgICAgICBzcGxpY2VzLnB1c2goc3BsaWNlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3BsaWNlcztcbiAgICAgIH0sXG4gICAgICBzaGFyZWRQcmVmaXg6IGZ1bmN0aW9uKGN1cnJlbnQsIG9sZCwgc2VhcmNoTGVuZ3RoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VhcmNoTGVuZ3RoOyBpKyspIGlmICghdGhpcy5lcXVhbHMoY3VycmVudFtpXSwgb2xkW2ldKSkgcmV0dXJuIGk7XG4gICAgICAgIHJldHVybiBzZWFyY2hMZW5ndGg7XG4gICAgICB9LFxuICAgICAgc2hhcmVkU3VmZml4OiBmdW5jdGlvbihjdXJyZW50LCBvbGQsIHNlYXJjaExlbmd0aCkge1xuICAgICAgICB2YXIgaW5kZXgxID0gY3VycmVudC5sZW5ndGg7XG4gICAgICAgIHZhciBpbmRleDIgPSBvbGQubGVuZ3RoO1xuICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICB3aGlsZSAoY291bnQgPCBzZWFyY2hMZW5ndGggJiYgdGhpcy5lcXVhbHMoY3VycmVudFstLWluZGV4MV0sIG9sZFstLWluZGV4Ml0pKSBjb3VudCsrO1xuICAgICAgICByZXR1cm4gY291bnQ7XG4gICAgICB9LFxuICAgICAgY2FsY3VsYXRlU3BsaWNlczogZnVuY3Rpb24oY3VycmVudCwgcHJldmlvdXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsY1NwbGljZXMoY3VycmVudCwgMCwgY3VycmVudC5sZW5ndGgsIHByZXZpb3VzLCAwLCBwcmV2aW91cy5sZW5ndGgpO1xuICAgICAgfSxcbiAgICAgIGVxdWFsczogZnVuY3Rpb24oY3VycmVudFZhbHVlLCBwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjdXJyZW50VmFsdWUgPT09IHByZXZpb3VzVmFsdWU7XG4gICAgICB9XG4gICAgfTtcbiAgICBzY29wZS5BcnJheVNwbGljZSA9IEFycmF5U3BsaWNlO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oY29udGV4dCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBPcmlnaW5hbE11dGF0aW9uT2JzZXJ2ZXIgPSB3aW5kb3cuTXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgY2FsbGJhY2tzID0gW107XG4gICAgdmFyIHBlbmRpbmcgPSBmYWxzZTtcbiAgICB2YXIgdGltZXJGdW5jO1xuICAgIGZ1bmN0aW9uIGhhbmRsZSgpIHtcbiAgICAgIHBlbmRpbmcgPSBmYWxzZTtcbiAgICAgIHZhciBjb3BpZXMgPSBjYWxsYmFja3Muc2xpY2UoMCk7XG4gICAgICBjYWxsYmFja3MgPSBbXTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29waWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICgwLCBjb3BpZXNbaV0pKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChPcmlnaW5hbE11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgIHZhciBjb3VudGVyID0gMTtcbiAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBPcmlnaW5hbE11dGF0aW9uT2JzZXJ2ZXIoaGFuZGxlKTtcbiAgICAgIHZhciB0ZXh0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNvdW50ZXIpO1xuICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZSh0ZXh0Tm9kZSwge1xuICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlXG4gICAgICB9KTtcbiAgICAgIHRpbWVyRnVuYyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb3VudGVyID0gKGNvdW50ZXIgKyAxKSAlIDI7XG4gICAgICAgIHRleHROb2RlLmRhdGEgPSBjb3VudGVyO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGltZXJGdW5jID0gd2luZG93LnNldFRpbWVvdXQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNldEVuZE9mTWljcm90YXNrKGZ1bmMpIHtcbiAgICAgIGNhbGxiYWNrcy5wdXNoKGZ1bmMpO1xuICAgICAgaWYgKHBlbmRpbmcpIHJldHVybjtcbiAgICAgIHBlbmRpbmcgPSB0cnVlO1xuICAgICAgdGltZXJGdW5jKGhhbmRsZSwgMCk7XG4gICAgfVxuICAgIGNvbnRleHQuc2V0RW5kT2ZNaWNyb3Rhc2sgPSBzZXRFbmRPZk1pY3JvdGFzaztcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIHNldEVuZE9mTWljcm90YXNrID0gc2NvcGUuc2V0RW5kT2ZNaWNyb3Rhc2s7XG4gICAgdmFyIHdyYXBJZk5lZWRlZCA9IHNjb3BlLndyYXBJZk5lZWRlZDtcbiAgICB2YXIgd3JhcHBlcnMgPSBzY29wZS53cmFwcGVycztcbiAgICB2YXIgcmVnaXN0cmF0aW9uc1RhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgZ2xvYmFsTXV0YXRpb25PYnNlcnZlcnMgPSBbXTtcbiAgICB2YXIgaXNTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICBmdW5jdGlvbiBzY2hlZHVsZUNhbGxiYWNrKG9ic2VydmVyKSB7XG4gICAgICBpZiAob2JzZXJ2ZXIuc2NoZWR1bGVkXykgcmV0dXJuO1xuICAgICAgb2JzZXJ2ZXIuc2NoZWR1bGVkXyA9IHRydWU7XG4gICAgICBnbG9iYWxNdXRhdGlvbk9ic2VydmVycy5wdXNoKG9ic2VydmVyKTtcbiAgICAgIGlmIChpc1NjaGVkdWxlZCkgcmV0dXJuO1xuICAgICAgc2V0RW5kT2ZNaWNyb3Rhc2sobm90aWZ5T2JzZXJ2ZXJzKTtcbiAgICAgIGlzU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbm90aWZ5T2JzZXJ2ZXJzKCkge1xuICAgICAgaXNTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICAgIHdoaWxlIChnbG9iYWxNdXRhdGlvbk9ic2VydmVycy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIG5vdGlmeUxpc3QgPSBnbG9iYWxNdXRhdGlvbk9ic2VydmVycztcbiAgICAgICAgZ2xvYmFsTXV0YXRpb25PYnNlcnZlcnMgPSBbXTtcbiAgICAgICAgbm90aWZ5TGlzdC5zb3J0KGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgICByZXR1cm4geC51aWRfIC0geS51aWRfO1xuICAgICAgICB9KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub3RpZnlMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIG1vID0gbm90aWZ5TGlzdFtpXTtcbiAgICAgICAgICBtby5zY2hlZHVsZWRfID0gZmFsc2U7XG4gICAgICAgICAgdmFyIHF1ZXVlID0gbW8udGFrZVJlY29yZHMoKTtcbiAgICAgICAgICByZW1vdmVUcmFuc2llbnRPYnNlcnZlcnNGb3IobW8pO1xuICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIG1vLmNhbGxiYWNrXyhxdWV1ZSwgbW8pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBNdXRhdGlvblJlY29yZCh0eXBlLCB0YXJnZXQpIHtcbiAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICAgIHRoaXMuYWRkZWROb2RlcyA9IG5ldyB3cmFwcGVycy5Ob2RlTGlzdCgpO1xuICAgICAgdGhpcy5yZW1vdmVkTm9kZXMgPSBuZXcgd3JhcHBlcnMuTm9kZUxpc3QoKTtcbiAgICAgIHRoaXMucHJldmlvdXNTaWJsaW5nID0gbnVsbDtcbiAgICAgIHRoaXMubmV4dFNpYmxpbmcgPSBudWxsO1xuICAgICAgdGhpcy5hdHRyaWJ1dGVOYW1lID0gbnVsbDtcbiAgICAgIHRoaXMuYXR0cmlidXRlTmFtZXNwYWNlID0gbnVsbDtcbiAgICAgIHRoaXMub2xkVmFsdWUgPSBudWxsO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZWdpc3RlclRyYW5zaWVudE9ic2VydmVycyhhbmNlc3Rvciwgbm9kZSkge1xuICAgICAgZm9yICg7YW5jZXN0b3I7IGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50Tm9kZSkge1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQoYW5jZXN0b3IpO1xuICAgICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIGNvbnRpbnVlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tpXTtcbiAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9wdGlvbnMuc3VidHJlZSkgcmVnaXN0cmF0aW9uLmFkZFRyYW5zaWVudE9ic2VydmVyKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZVRyYW5zaWVudE9ic2VydmVyc0ZvcihvYnNlcnZlcikge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYnNlcnZlci5ub2Rlc18ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5vZGUgPSBvYnNlcnZlci5ub2Rlc19baV07XG4gICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSByZXR1cm47XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHZhciByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2pdO1xuICAgICAgICAgIGlmIChyZWdpc3RyYXRpb24ub2JzZXJ2ZXIgPT09IG9ic2VydmVyKSByZWdpc3RyYXRpb24ucmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZW5xdWV1ZU11dGF0aW9uKHRhcmdldCwgdHlwZSwgZGF0YSkge1xuICAgICAgdmFyIGludGVyZXN0ZWRPYnNlcnZlcnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgdmFyIGFzc29jaWF0ZWRTdHJpbmdzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgIGZvciAodmFyIG5vZGUgPSB0YXJnZXQ7IG5vZGU7IG5vZGUgPSBub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIGNvbnRpbnVlO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tqXTtcbiAgICAgICAgICB2YXIgb3B0aW9ucyA9IHJlZ2lzdHJhdGlvbi5vcHRpb25zO1xuICAgICAgICAgIGlmIChub2RlICE9PSB0YXJnZXQgJiYgIW9wdGlvbnMuc3VidHJlZSkgY29udGludWU7XG4gICAgICAgICAgaWYgKHR5cGUgPT09IFwiYXR0cmlidXRlc1wiICYmICFvcHRpb25zLmF0dHJpYnV0ZXMpIGNvbnRpbnVlO1xuICAgICAgICAgIGlmICh0eXBlID09PSBcImF0dHJpYnV0ZXNcIiAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlciAmJiAoZGF0YS5uYW1lc3BhY2UgIT09IG51bGwgfHwgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIuaW5kZXhPZihkYXRhLm5hbWUpID09PSAtMSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZSA9PT0gXCJjaGFyYWN0ZXJEYXRhXCIgJiYgIW9wdGlvbnMuY2hhcmFjdGVyRGF0YSkgY29udGludWU7XG4gICAgICAgICAgaWYgKHR5cGUgPT09IFwiY2hpbGRMaXN0XCIgJiYgIW9wdGlvbnMuY2hpbGRMaXN0KSBjb250aW51ZTtcbiAgICAgICAgICB2YXIgb2JzZXJ2ZXIgPSByZWdpc3RyYXRpb24ub2JzZXJ2ZXI7XG4gICAgICAgICAgaW50ZXJlc3RlZE9ic2VydmVyc1tvYnNlcnZlci51aWRfXSA9IG9ic2VydmVyO1xuICAgICAgICAgIGlmICh0eXBlID09PSBcImF0dHJpYnV0ZXNcIiAmJiBvcHRpb25zLmF0dHJpYnV0ZU9sZFZhbHVlIHx8IHR5cGUgPT09IFwiY2hhcmFjdGVyRGF0YVwiICYmIG9wdGlvbnMuY2hhcmFjdGVyRGF0YU9sZFZhbHVlKSB7XG4gICAgICAgICAgICBhc3NvY2lhdGVkU3RyaW5nc1tvYnNlcnZlci51aWRfXSA9IGRhdGEub2xkVmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKHZhciB1aWQgaW4gaW50ZXJlc3RlZE9ic2VydmVycykge1xuICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBpbnRlcmVzdGVkT2JzZXJ2ZXJzW3VpZF07XG4gICAgICAgIHZhciByZWNvcmQgPSBuZXcgTXV0YXRpb25SZWNvcmQodHlwZSwgdGFyZ2V0KTtcbiAgICAgICAgaWYgKFwibmFtZVwiIGluIGRhdGEgJiYgXCJuYW1lc3BhY2VcIiBpbiBkYXRhKSB7XG4gICAgICAgICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWUgPSBkYXRhLm5hbWU7XG4gICAgICAgICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWVzcGFjZSA9IGRhdGEubmFtZXNwYWNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmFkZGVkTm9kZXMpIHJlY29yZC5hZGRlZE5vZGVzID0gZGF0YS5hZGRlZE5vZGVzO1xuICAgICAgICBpZiAoZGF0YS5yZW1vdmVkTm9kZXMpIHJlY29yZC5yZW1vdmVkTm9kZXMgPSBkYXRhLnJlbW92ZWROb2RlcztcbiAgICAgICAgaWYgKGRhdGEucHJldmlvdXNTaWJsaW5nKSByZWNvcmQucHJldmlvdXNTaWJsaW5nID0gZGF0YS5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgIGlmIChkYXRhLm5leHRTaWJsaW5nKSByZWNvcmQubmV4dFNpYmxpbmcgPSBkYXRhLm5leHRTaWJsaW5nO1xuICAgICAgICBpZiAoYXNzb2NpYXRlZFN0cmluZ3NbdWlkXSAhPT0gdW5kZWZpbmVkKSByZWNvcmQub2xkVmFsdWUgPSBhc3NvY2lhdGVkU3RyaW5nc1t1aWRdO1xuICAgICAgICBzY2hlZHVsZUNhbGxiYWNrKG9ic2VydmVyKTtcbiAgICAgICAgb2JzZXJ2ZXIucmVjb3Jkc18ucHVzaChyZWNvcmQpO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG4gICAgZnVuY3Rpb24gTXV0YXRpb25PYnNlcnZlck9wdGlvbnMob3B0aW9ucykge1xuICAgICAgdGhpcy5jaGlsZExpc3QgPSAhIW9wdGlvbnMuY2hpbGRMaXN0O1xuICAgICAgdGhpcy5zdWJ0cmVlID0gISFvcHRpb25zLnN1YnRyZWU7XG4gICAgICBpZiAoIShcImF0dHJpYnV0ZXNcIiBpbiBvcHRpb25zKSAmJiAoXCJhdHRyaWJ1dGVPbGRWYWx1ZVwiIGluIG9wdGlvbnMgfHwgXCJhdHRyaWJ1dGVGaWx0ZXJcIiBpbiBvcHRpb25zKSkge1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzID0gISFvcHRpb25zLmF0dHJpYnV0ZXM7XG4gICAgICB9XG4gICAgICBpZiAoXCJjaGFyYWN0ZXJEYXRhT2xkVmFsdWVcIiBpbiBvcHRpb25zICYmICEoXCJjaGFyYWN0ZXJEYXRhXCIgaW4gb3B0aW9ucykpIHRoaXMuY2hhcmFjdGVyRGF0YSA9IHRydWU7IGVsc2UgdGhpcy5jaGFyYWN0ZXJEYXRhID0gISFvcHRpb25zLmNoYXJhY3RlckRhdGE7XG4gICAgICBpZiAoIXRoaXMuYXR0cmlidXRlcyAmJiAob3B0aW9ucy5hdHRyaWJ1dGVPbGRWYWx1ZSB8fCBcImF0dHJpYnV0ZUZpbHRlclwiIGluIG9wdGlvbnMpIHx8ICF0aGlzLmNoYXJhY3RlckRhdGEgJiYgb3B0aW9ucy5jaGFyYWN0ZXJEYXRhT2xkVmFsdWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgfVxuICAgICAgdGhpcy5jaGFyYWN0ZXJEYXRhID0gISFvcHRpb25zLmNoYXJhY3RlckRhdGE7XG4gICAgICB0aGlzLmF0dHJpYnV0ZU9sZFZhbHVlID0gISFvcHRpb25zLmF0dHJpYnV0ZU9sZFZhbHVlO1xuICAgICAgdGhpcy5jaGFyYWN0ZXJEYXRhT2xkVmFsdWUgPSAhIW9wdGlvbnMuY2hhcmFjdGVyRGF0YU9sZFZhbHVlO1xuICAgICAgaWYgKFwiYXR0cmlidXRlRmlsdGVyXCIgaW4gb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIgPT0gbnVsbCB8fCB0eXBlb2Ygb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVGaWx0ZXIgPSBzbGljZS5jYWxsKG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlRmlsdGVyID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHVpZENvdW50ZXIgPSAwO1xuICAgIGZ1bmN0aW9uIE11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spIHtcbiAgICAgIHRoaXMuY2FsbGJhY2tfID0gY2FsbGJhY2s7XG4gICAgICB0aGlzLm5vZGVzXyA9IFtdO1xuICAgICAgdGhpcy5yZWNvcmRzXyA9IFtdO1xuICAgICAgdGhpcy51aWRfID0gKyt1aWRDb3VudGVyO1xuICAgICAgdGhpcy5zY2hlZHVsZWRfID0gZmFsc2U7XG4gICAgfVxuICAgIE11dGF0aW9uT2JzZXJ2ZXIucHJvdG90eXBlID0ge1xuICAgICAgY29uc3RydWN0b3I6IE11dGF0aW9uT2JzZXJ2ZXIsXG4gICAgICBvYnNlcnZlOiBmdW5jdGlvbih0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICAgICAgdGFyZ2V0ID0gd3JhcElmTmVlZGVkKHRhcmdldCk7XG4gICAgICAgIHZhciBuZXdPcHRpb25zID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXJPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9uO1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQodGFyZ2V0KTtcbiAgICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSByZWdpc3RyYXRpb25zVGFibGUuc2V0KHRhcmdldCwgcmVnaXN0cmF0aW9ucyA9IFtdKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbnNbaV0ub2JzZXJ2ZXIgPT09IHRoaXMpIHtcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbaV07XG4gICAgICAgICAgICByZWdpc3RyYXRpb24ucmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzKCk7XG4gICAgICAgICAgICByZWdpc3RyYXRpb24ub3B0aW9ucyA9IG5ld09wdGlvbnM7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghcmVnaXN0cmF0aW9uKSB7XG4gICAgICAgICAgcmVnaXN0cmF0aW9uID0gbmV3IFJlZ2lzdHJhdGlvbih0aGlzLCB0YXJnZXQsIG5ld09wdGlvbnMpO1xuICAgICAgICAgIHJlZ2lzdHJhdGlvbnMucHVzaChyZWdpc3RyYXRpb24pO1xuICAgICAgICAgIHRoaXMubm9kZXNfLnB1c2godGFyZ2V0KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGRpc2Nvbm5lY3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm5vZGVzXy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tpXTtcbiAgICAgICAgICAgIGlmIChyZWdpc3RyYXRpb24ub2JzZXJ2ZXIgPT09IHRoaXMpIHtcbiAgICAgICAgICAgICAgcmVnaXN0cmF0aW9ucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHRoaXMucmVjb3Jkc18gPSBbXTtcbiAgICAgIH0sXG4gICAgICB0YWtlUmVjb3JkczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb3B5T2ZSZWNvcmRzID0gdGhpcy5yZWNvcmRzXztcbiAgICAgICAgdGhpcy5yZWNvcmRzXyA9IFtdO1xuICAgICAgICByZXR1cm4gY29weU9mUmVjb3JkcztcbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIFJlZ2lzdHJhdGlvbihvYnNlcnZlciwgdGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgICB0aGlzLm9ic2VydmVyID0gb2JzZXJ2ZXI7XG4gICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXMgPSBbXTtcbiAgICB9XG4gICAgUmVnaXN0cmF0aW9uLnByb3RvdHlwZSA9IHtcbiAgICAgIGFkZFRyYW5zaWVudE9ic2VydmVyOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIGlmIChub2RlID09PSB0aGlzLnRhcmdldCkgcmV0dXJuO1xuICAgICAgICBzY2hlZHVsZUNhbGxiYWNrKHRoaXMub2JzZXJ2ZXIpO1xuICAgICAgICB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIHJlZ2lzdHJhdGlvbnNUYWJsZS5zZXQobm9kZSwgcmVnaXN0cmF0aW9ucyA9IFtdKTtcbiAgICAgICAgcmVnaXN0cmF0aW9ucy5wdXNoKHRoaXMpO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZVRyYW5zaWVudE9ic2VydmVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0cmFuc2llbnRPYnNlcnZlZE5vZGVzID0gdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzO1xuICAgICAgICB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmFuc2llbnRPYnNlcnZlZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIG5vZGUgPSB0cmFuc2llbnRPYnNlcnZlZE5vZGVzW2ldO1xuICAgICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChyZWdpc3RyYXRpb25zW2pdID09PSB0aGlzKSB7XG4gICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnMuc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIHNjb3BlLmVucXVldWVNdXRhdGlvbiA9IGVucXVldWVNdXRhdGlvbjtcbiAgICBzY29wZS5yZWdpc3RlclRyYW5zaWVudE9ic2VydmVycyA9IHJlZ2lzdGVyVHJhbnNpZW50T2JzZXJ2ZXJzO1xuICAgIHNjb3BlLndyYXBwZXJzLk11dGF0aW9uT2JzZXJ2ZXIgPSBNdXRhdGlvbk9ic2VydmVyO1xuICAgIHNjb3BlLndyYXBwZXJzLk11dGF0aW9uUmVjb3JkID0gTXV0YXRpb25SZWNvcmQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uIFRyZWVTY29wZShyb290LCBwYXJlbnQpIHtcbiAgICAgIHRoaXMucm9vdCA9IHJvb3Q7XG4gICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB9XG4gICAgVHJlZVNjb3BlLnByb3RvdHlwZSA9IHtcbiAgICAgIGdldCByZW5kZXJlcigpIHtcbiAgICAgICAgaWYgKHRoaXMucm9vdCBpbnN0YW5jZW9mIHNjb3BlLndyYXBwZXJzLlNoYWRvd1Jvb3QpIHtcbiAgICAgICAgICByZXR1cm4gc2NvcGUuZ2V0UmVuZGVyZXJGb3JIb3N0KHRoaXMucm9vdC5ob3N0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0sXG4gICAgICBjb250YWluczogZnVuY3Rpb24odHJlZVNjb3BlKSB7XG4gICAgICAgIGZvciAoO3RyZWVTY29wZTsgdHJlZVNjb3BlID0gdHJlZVNjb3BlLnBhcmVudCkge1xuICAgICAgICAgIGlmICh0cmVlU2NvcGUgPT09IHRoaXMpIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIHNldFRyZWVTY29wZShub2RlLCB0cmVlU2NvcGUpIHtcbiAgICAgIGlmIChub2RlLnRyZWVTY29wZV8gIT09IHRyZWVTY29wZSkge1xuICAgICAgICBub2RlLnRyZWVTY29wZV8gPSB0cmVlU2NvcGU7XG4gICAgICAgIGZvciAodmFyIHNyID0gbm9kZS5zaGFkb3dSb290OyBzcjsgc3IgPSBzci5vbGRlclNoYWRvd1Jvb3QpIHtcbiAgICAgICAgICBzci50cmVlU2NvcGVfLnBhcmVudCA9IHRyZWVTY29wZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICBzZXRUcmVlU2NvcGUoY2hpbGQsIHRyZWVTY29wZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0VHJlZVNjb3BlKG5vZGUpIHtcbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2Ygc2NvcGUud3JhcHBlcnMuV2luZG93KSB7XG4gICAgICAgIGRlYnVnZ2VyO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUudHJlZVNjb3BlXykgcmV0dXJuIG5vZGUudHJlZVNjb3BlXztcbiAgICAgIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICB2YXIgdHJlZVNjb3BlO1xuICAgICAgaWYgKHBhcmVudCkgdHJlZVNjb3BlID0gZ2V0VHJlZVNjb3BlKHBhcmVudCk7IGVsc2UgdHJlZVNjb3BlID0gbmV3IFRyZWVTY29wZShub2RlLCBudWxsKTtcbiAgICAgIHJldHVybiBub2RlLnRyZWVTY29wZV8gPSB0cmVlU2NvcGU7XG4gICAgfVxuICAgIHNjb3BlLlRyZWVTY29wZSA9IFRyZWVTY29wZTtcbiAgICBzY29wZS5nZXRUcmVlU2NvcGUgPSBnZXRUcmVlU2NvcGU7XG4gICAgc2NvcGUuc2V0VHJlZVNjb3BlID0gc2V0VHJlZVNjb3BlO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXIgPSBzY29wZS5mb3J3YXJkTWV0aG9kc1RvV3JhcHBlcjtcbiAgICB2YXIgZ2V0VHJlZVNjb3BlID0gc2NvcGUuZ2V0VHJlZVNjb3BlO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHNldFdyYXBwZXIgPSBzY29wZS5zZXRXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIHdyYXBwZXJzID0gc2NvcGUud3JhcHBlcnM7XG4gICAgdmFyIHdyYXBwZWRGdW5zID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgbGlzdGVuZXJzVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBoYW5kbGVkRXZlbnRzVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBjdXJyZW50bHlEaXNwYXRjaGluZ0V2ZW50cyA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIHRhcmdldFRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgY3VycmVudFRhcmdldFRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgcmVsYXRlZFRhcmdldFRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgZXZlbnRQaGFzZVRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgc3RvcFByb3BhZ2F0aW9uVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb25UYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIGV2ZW50SGFuZGxlcnNUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIGV2ZW50UGF0aFRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICBmdW5jdGlvbiBpc1NoYWRvd1Jvb3Qobm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiB3cmFwcGVycy5TaGFkb3dSb290O1xuICAgIH1cbiAgICBmdW5jdGlvbiByb290T2ZOb2RlKG5vZGUpIHtcbiAgICAgIHJldHVybiBnZXRUcmVlU2NvcGUobm9kZSkucm9vdDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0RXZlbnRQYXRoKG5vZGUsIGV2ZW50KSB7XG4gICAgICB2YXIgcGF0aCA9IFtdO1xuICAgICAgdmFyIGN1cnJlbnQgPSBub2RlO1xuICAgICAgcGF0aC5wdXNoKGN1cnJlbnQpO1xuICAgICAgd2hpbGUgKGN1cnJlbnQpIHtcbiAgICAgICAgdmFyIGRlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzID0gZ2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMoY3VycmVudCk7XG4gICAgICAgIGlmIChkZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyAmJiBkZXN0aW5hdGlvbkluc2VydGlvblBvaW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXN0aW5hdGlvbkluc2VydGlvblBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGluc2VydGlvblBvaW50ID0gZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHNbaV07XG4gICAgICAgICAgICBpZiAoaXNTaGFkb3dJbnNlcnRpb25Qb2ludChpbnNlcnRpb25Qb2ludCkpIHtcbiAgICAgICAgICAgICAgdmFyIHNoYWRvd1Jvb3QgPSByb290T2ZOb2RlKGluc2VydGlvblBvaW50KTtcbiAgICAgICAgICAgICAgdmFyIG9sZGVyU2hhZG93Um9vdCA9IHNoYWRvd1Jvb3Qub2xkZXJTaGFkb3dSb290O1xuICAgICAgICAgICAgICBpZiAob2xkZXJTaGFkb3dSb290KSBwYXRoLnB1c2gob2xkZXJTaGFkb3dSb290KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGgucHVzaChpbnNlcnRpb25Qb2ludCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnQgPSBkZXN0aW5hdGlvbkluc2VydGlvblBvaW50c1tkZXN0aW5hdGlvbkluc2VydGlvblBvaW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoaXNTaGFkb3dSb290KGN1cnJlbnQpKSB7XG4gICAgICAgICAgICBpZiAoaW5TYW1lVHJlZShub2RlLCBjdXJyZW50KSAmJiBldmVudE11c3RCZVN0b3BwZWQoZXZlbnQpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQuaG9zdDtcbiAgICAgICAgICAgIHBhdGgucHVzaChjdXJyZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50KSBwYXRoLnB1c2goY3VycmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcGF0aDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZXZlbnRNdXN0QmVTdG9wcGVkKGV2ZW50KSB7XG4gICAgICBpZiAoIWV2ZW50KSByZXR1cm4gZmFsc2U7XG4gICAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgICBjYXNlIFwiYWJvcnRcIjpcbiAgICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICBjYXNlIFwic2VsZWN0XCI6XG4gICAgICAgY2FzZSBcImNoYW5nZVwiOlxuICAgICAgIGNhc2UgXCJsb2FkXCI6XG4gICAgICAgY2FzZSBcInJlc2V0XCI6XG4gICAgICAgY2FzZSBcInJlc2l6ZVwiOlxuICAgICAgIGNhc2UgXCJzY3JvbGxcIjpcbiAgICAgICBjYXNlIFwic2VsZWN0c3RhcnRcIjpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzU2hhZG93SW5zZXJ0aW9uUG9pbnQobm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiBIVE1MU2hhZG93RWxlbWVudDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0RGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHMobm9kZSkge1xuICAgICAgcmV0dXJuIHNjb3BlLmdldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzKG5vZGUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBldmVudFJldGFyZ2V0dGluZyhwYXRoLCBjdXJyZW50VGFyZ2V0KSB7XG4gICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiBjdXJyZW50VGFyZ2V0O1xuICAgICAgaWYgKGN1cnJlbnRUYXJnZXQgaW5zdGFuY2VvZiB3cmFwcGVycy5XaW5kb3cpIGN1cnJlbnRUYXJnZXQgPSBjdXJyZW50VGFyZ2V0LmRvY3VtZW50O1xuICAgICAgdmFyIGN1cnJlbnRUYXJnZXRUcmVlID0gZ2V0VHJlZVNjb3BlKGN1cnJlbnRUYXJnZXQpO1xuICAgICAgdmFyIG9yaWdpbmFsVGFyZ2V0ID0gcGF0aFswXTtcbiAgICAgIHZhciBvcmlnaW5hbFRhcmdldFRyZWUgPSBnZXRUcmVlU2NvcGUob3JpZ2luYWxUYXJnZXQpO1xuICAgICAgdmFyIHJlbGF0aXZlVGFyZ2V0VHJlZSA9IGxvd2VzdENvbW1vbkluY2x1c2l2ZUFuY2VzdG9yKGN1cnJlbnRUYXJnZXRUcmVlLCBvcmlnaW5hbFRhcmdldFRyZWUpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBub2RlID0gcGF0aFtpXTtcbiAgICAgICAgaWYgKGdldFRyZWVTY29wZShub2RlKSA9PT0gcmVsYXRpdmVUYXJnZXRUcmVlKSByZXR1cm4gbm9kZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXRoW3BhdGgubGVuZ3RoIC0gMV07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFRyZWVTY29wZUFuY2VzdG9ycyh0cmVlU2NvcGUpIHtcbiAgICAgIHZhciBhbmNlc3RvcnMgPSBbXTtcbiAgICAgIGZvciAoO3RyZWVTY29wZTsgdHJlZVNjb3BlID0gdHJlZVNjb3BlLnBhcmVudCkge1xuICAgICAgICBhbmNlc3RvcnMucHVzaCh0cmVlU2NvcGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFuY2VzdG9ycztcbiAgICB9XG4gICAgZnVuY3Rpb24gbG93ZXN0Q29tbW9uSW5jbHVzaXZlQW5jZXN0b3IodHNBLCB0c0IpIHtcbiAgICAgIHZhciBhbmNlc3RvcnNBID0gZ2V0VHJlZVNjb3BlQW5jZXN0b3JzKHRzQSk7XG4gICAgICB2YXIgYW5jZXN0b3JzQiA9IGdldFRyZWVTY29wZUFuY2VzdG9ycyh0c0IpO1xuICAgICAgdmFyIHJlc3VsdCA9IG51bGw7XG4gICAgICB3aGlsZSAoYW5jZXN0b3JzQS5sZW5ndGggPiAwICYmIGFuY2VzdG9yc0IubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgYSA9IGFuY2VzdG9yc0EucG9wKCk7XG4gICAgICAgIHZhciBiID0gYW5jZXN0b3JzQi5wb3AoKTtcbiAgICAgICAgaWYgKGEgPT09IGIpIHJlc3VsdCA9IGE7IGVsc2UgYnJlYWs7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRUcmVlU2NvcGVSb290KHRzKSB7XG4gICAgICBpZiAoIXRzLnBhcmVudCkgcmV0dXJuIHRzO1xuICAgICAgcmV0dXJuIGdldFRyZWVTY29wZVJvb3QodHMucGFyZW50KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVsYXRlZFRhcmdldFJlc29sdXRpb24oZXZlbnQsIGN1cnJlbnRUYXJnZXQsIHJlbGF0ZWRUYXJnZXQpIHtcbiAgICAgIGlmIChjdXJyZW50VGFyZ2V0IGluc3RhbmNlb2Ygd3JhcHBlcnMuV2luZG93KSBjdXJyZW50VGFyZ2V0ID0gY3VycmVudFRhcmdldC5kb2N1bWVudDtcbiAgICAgIHZhciBjdXJyZW50VGFyZ2V0VHJlZSA9IGdldFRyZWVTY29wZShjdXJyZW50VGFyZ2V0KTtcbiAgICAgIHZhciByZWxhdGVkVGFyZ2V0VHJlZSA9IGdldFRyZWVTY29wZShyZWxhdGVkVGFyZ2V0KTtcbiAgICAgIHZhciByZWxhdGVkVGFyZ2V0RXZlbnRQYXRoID0gZ2V0RXZlbnRQYXRoKHJlbGF0ZWRUYXJnZXQsIGV2ZW50KTtcbiAgICAgIHZhciBsb3dlc3RDb21tb25BbmNlc3RvclRyZWU7XG4gICAgICB2YXIgbG93ZXN0Q29tbW9uQW5jZXN0b3JUcmVlID0gbG93ZXN0Q29tbW9uSW5jbHVzaXZlQW5jZXN0b3IoY3VycmVudFRhcmdldFRyZWUsIHJlbGF0ZWRUYXJnZXRUcmVlKTtcbiAgICAgIGlmICghbG93ZXN0Q29tbW9uQW5jZXN0b3JUcmVlKSBsb3dlc3RDb21tb25BbmNlc3RvclRyZWUgPSByZWxhdGVkVGFyZ2V0VHJlZS5yb290O1xuICAgICAgZm9yICh2YXIgY29tbW9uQW5jZXN0b3JUcmVlID0gbG93ZXN0Q29tbW9uQW5jZXN0b3JUcmVlOyBjb21tb25BbmNlc3RvclRyZWU7IGNvbW1vbkFuY2VzdG9yVHJlZSA9IGNvbW1vbkFuY2VzdG9yVHJlZS5wYXJlbnQpIHtcbiAgICAgICAgdmFyIGFkanVzdGVkUmVsYXRlZFRhcmdldDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWxhdGVkVGFyZ2V0RXZlbnRQYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIG5vZGUgPSByZWxhdGVkVGFyZ2V0RXZlbnRQYXRoW2ldO1xuICAgICAgICAgIGlmIChnZXRUcmVlU2NvcGUobm9kZSkgPT09IGNvbW1vbkFuY2VzdG9yVHJlZSkgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpblNhbWVUcmVlKGEsIGIpIHtcbiAgICAgIHJldHVybiBnZXRUcmVlU2NvcGUoYSkgPT09IGdldFRyZWVTY29wZShiKTtcbiAgICB9XG4gICAgdmFyIE5PTkUgPSAwO1xuICAgIHZhciBDQVBUVVJJTkdfUEhBU0UgPSAxO1xuICAgIHZhciBBVF9UQVJHRVQgPSAyO1xuICAgIHZhciBCVUJCTElOR19QSEFTRSA9IDM7XG4gICAgdmFyIHBlbmRpbmdFcnJvcjtcbiAgICBmdW5jdGlvbiBkaXNwYXRjaE9yaWdpbmFsRXZlbnQob3JpZ2luYWxFdmVudCkge1xuICAgICAgaWYgKGhhbmRsZWRFdmVudHNUYWJsZS5nZXQob3JpZ2luYWxFdmVudCkpIHJldHVybjtcbiAgICAgIGhhbmRsZWRFdmVudHNUYWJsZS5zZXQob3JpZ2luYWxFdmVudCwgdHJ1ZSk7XG4gICAgICBkaXNwYXRjaEV2ZW50KHdyYXAob3JpZ2luYWxFdmVudCksIHdyYXAob3JpZ2luYWxFdmVudC50YXJnZXQpKTtcbiAgICAgIGlmIChwZW5kaW5nRXJyb3IpIHtcbiAgICAgICAgdmFyIGVyciA9IHBlbmRpbmdFcnJvcjtcbiAgICAgICAgcGVuZGluZ0Vycm9yID0gbnVsbDtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBpc0xvYWRMaWtlRXZlbnQoZXZlbnQpIHtcbiAgICAgIHN3aXRjaCAoZXZlbnQudHlwZSkge1xuICAgICAgIGNhc2UgXCJsb2FkXCI6XG4gICAgICAgY2FzZSBcImJlZm9yZXVubG9hZFwiOlxuICAgICAgIGNhc2UgXCJ1bmxvYWRcIjpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoZXZlbnQsIG9yaWdpbmFsV3JhcHBlclRhcmdldCkge1xuICAgICAgaWYgKGN1cnJlbnRseURpc3BhdGNoaW5nRXZlbnRzLmdldChldmVudCkpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWRTdGF0ZUVycm9yXCIpO1xuICAgICAgY3VycmVudGx5RGlzcGF0Y2hpbmdFdmVudHMuc2V0KGV2ZW50LCB0cnVlKTtcbiAgICAgIHNjb3BlLnJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgIHZhciBldmVudFBhdGg7XG4gICAgICB2YXIgb3ZlcnJpZGVUYXJnZXQ7XG4gICAgICB2YXIgd2luO1xuICAgICAgaWYgKGlzTG9hZExpa2VFdmVudChldmVudCkgJiYgIWV2ZW50LmJ1YmJsZXMpIHtcbiAgICAgICAgdmFyIGRvYyA9IG9yaWdpbmFsV3JhcHBlclRhcmdldDtcbiAgICAgICAgaWYgKGRvYyBpbnN0YW5jZW9mIHdyYXBwZXJzLkRvY3VtZW50ICYmICh3aW4gPSBkb2MuZGVmYXVsdFZpZXcpKSB7XG4gICAgICAgICAgb3ZlcnJpZGVUYXJnZXQgPSBkb2M7XG4gICAgICAgICAgZXZlbnRQYXRoID0gW107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZXZlbnRQYXRoKSB7XG4gICAgICAgIGlmIChvcmlnaW5hbFdyYXBwZXJUYXJnZXQgaW5zdGFuY2VvZiB3cmFwcGVycy5XaW5kb3cpIHtcbiAgICAgICAgICB3aW4gPSBvcmlnaW5hbFdyYXBwZXJUYXJnZXQ7XG4gICAgICAgICAgZXZlbnRQYXRoID0gW107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXZlbnRQYXRoID0gZ2V0RXZlbnRQYXRoKG9yaWdpbmFsV3JhcHBlclRhcmdldCwgZXZlbnQpO1xuICAgICAgICAgIGlmICghaXNMb2FkTGlrZUV2ZW50KGV2ZW50KSkge1xuICAgICAgICAgICAgdmFyIGRvYyA9IGV2ZW50UGF0aFtldmVudFBhdGgubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAoZG9jIGluc3RhbmNlb2Ygd3JhcHBlcnMuRG9jdW1lbnQpIHdpbiA9IGRvYy5kZWZhdWx0VmlldztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGV2ZW50UGF0aFRhYmxlLnNldChldmVudCwgZXZlbnRQYXRoKTtcbiAgICAgIGlmIChkaXNwYXRjaENhcHR1cmluZyhldmVudCwgZXZlbnRQYXRoLCB3aW4sIG92ZXJyaWRlVGFyZ2V0KSkge1xuICAgICAgICBpZiAoZGlzcGF0Y2hBdFRhcmdldChldmVudCwgZXZlbnRQYXRoLCB3aW4sIG92ZXJyaWRlVGFyZ2V0KSkge1xuICAgICAgICAgIGRpc3BhdGNoQnViYmxpbmcoZXZlbnQsIGV2ZW50UGF0aCwgd2luLCBvdmVycmlkZVRhcmdldCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGV2ZW50UGhhc2VUYWJsZS5zZXQoZXZlbnQsIE5PTkUpO1xuICAgICAgY3VycmVudFRhcmdldFRhYmxlLmRlbGV0ZShldmVudCwgbnVsbCk7XG4gICAgICBjdXJyZW50bHlEaXNwYXRjaGluZ0V2ZW50cy5kZWxldGUoZXZlbnQpO1xuICAgICAgcmV0dXJuIGV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoQ2FwdHVyaW5nKGV2ZW50LCBldmVudFBhdGgsIHdpbiwgb3ZlcnJpZGVUYXJnZXQpIHtcbiAgICAgIHZhciBwaGFzZSA9IENBUFRVUklOR19QSEFTRTtcbiAgICAgIGlmICh3aW4pIHtcbiAgICAgICAgaWYgKCFpbnZva2Uod2luLCBldmVudCwgcGhhc2UsIGV2ZW50UGF0aCwgb3ZlcnJpZGVUYXJnZXQpKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gZXZlbnRQYXRoLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgaWYgKCFpbnZva2UoZXZlbnRQYXRoW2ldLCBldmVudCwgcGhhc2UsIGV2ZW50UGF0aCwgb3ZlcnJpZGVUYXJnZXQpKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzcGF0Y2hBdFRhcmdldChldmVudCwgZXZlbnRQYXRoLCB3aW4sIG92ZXJyaWRlVGFyZ2V0KSB7XG4gICAgICB2YXIgcGhhc2UgPSBBVF9UQVJHRVQ7XG4gICAgICB2YXIgY3VycmVudFRhcmdldCA9IGV2ZW50UGF0aFswXSB8fCB3aW47XG4gICAgICByZXR1cm4gaW52b2tlKGN1cnJlbnRUYXJnZXQsIGV2ZW50LCBwaGFzZSwgZXZlbnRQYXRoLCBvdmVycmlkZVRhcmdldCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoQnViYmxpbmcoZXZlbnQsIGV2ZW50UGF0aCwgd2luLCBvdmVycmlkZVRhcmdldCkge1xuICAgICAgdmFyIHBoYXNlID0gQlVCQkxJTkdfUEhBU0U7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGV2ZW50UGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWludm9rZShldmVudFBhdGhbaV0sIGV2ZW50LCBwaGFzZSwgZXZlbnRQYXRoLCBvdmVycmlkZVRhcmdldCkpIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh3aW4gJiYgZXZlbnRQYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaW52b2tlKHdpbiwgZXZlbnQsIHBoYXNlLCBldmVudFBhdGgsIG92ZXJyaWRlVGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gaW52b2tlKGN1cnJlbnRUYXJnZXQsIGV2ZW50LCBwaGFzZSwgZXZlbnRQYXRoLCBvdmVycmlkZVRhcmdldCkge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IGxpc3RlbmVyc1RhYmxlLmdldChjdXJyZW50VGFyZ2V0KTtcbiAgICAgIGlmICghbGlzdGVuZXJzKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHZhciB0YXJnZXQgPSBvdmVycmlkZVRhcmdldCB8fCBldmVudFJldGFyZ2V0dGluZyhldmVudFBhdGgsIGN1cnJlbnRUYXJnZXQpO1xuICAgICAgaWYgKHRhcmdldCA9PT0gY3VycmVudFRhcmdldCkge1xuICAgICAgICBpZiAocGhhc2UgPT09IENBUFRVUklOR19QSEFTRSkgcmV0dXJuIHRydWU7XG4gICAgICAgIGlmIChwaGFzZSA9PT0gQlVCQkxJTkdfUEhBU0UpIHBoYXNlID0gQVRfVEFSR0VUO1xuICAgICAgfSBlbHNlIGlmIChwaGFzZSA9PT0gQlVCQkxJTkdfUEhBU0UgJiYgIWV2ZW50LmJ1YmJsZXMpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoXCJyZWxhdGVkVGFyZ2V0XCIgaW4gZXZlbnQpIHtcbiAgICAgICAgdmFyIG9yaWdpbmFsRXZlbnQgPSB1bndyYXAoZXZlbnQpO1xuICAgICAgICB2YXIgdW53cmFwcGVkUmVsYXRlZFRhcmdldCA9IG9yaWdpbmFsRXZlbnQucmVsYXRlZFRhcmdldDtcbiAgICAgICAgaWYgKHVud3JhcHBlZFJlbGF0ZWRUYXJnZXQpIHtcbiAgICAgICAgICBpZiAodW53cmFwcGVkUmVsYXRlZFRhcmdldCBpbnN0YW5jZW9mIE9iamVjdCAmJiB1bndyYXBwZWRSZWxhdGVkVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIHZhciByZWxhdGVkVGFyZ2V0ID0gd3JhcCh1bndyYXBwZWRSZWxhdGVkVGFyZ2V0KTtcbiAgICAgICAgICAgIHZhciBhZGp1c3RlZCA9IHJlbGF0ZWRUYXJnZXRSZXNvbHV0aW9uKGV2ZW50LCBjdXJyZW50VGFyZ2V0LCByZWxhdGVkVGFyZ2V0KTtcbiAgICAgICAgICAgIGlmIChhZGp1c3RlZCA9PT0gdGFyZ2V0KSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWRqdXN0ZWQgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZWxhdGVkVGFyZ2V0VGFibGUuc2V0KGV2ZW50LCBhZGp1c3RlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGV2ZW50UGhhc2VUYWJsZS5zZXQoZXZlbnQsIHBoYXNlKTtcbiAgICAgIHZhciB0eXBlID0gZXZlbnQudHlwZTtcbiAgICAgIHZhciBhbnlSZW1vdmVkID0gZmFsc2U7XG4gICAgICB0YXJnZXRUYWJsZS5zZXQoZXZlbnQsIHRhcmdldCk7XG4gICAgICBjdXJyZW50VGFyZ2V0VGFibGUuc2V0KGV2ZW50LCBjdXJyZW50VGFyZ2V0KTtcbiAgICAgIGxpc3RlbmVycy5kZXB0aCsrO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2YXIgbGlzdGVuZXIgPSBsaXN0ZW5lcnNbaV07XG4gICAgICAgIGlmIChsaXN0ZW5lci5yZW1vdmVkKSB7XG4gICAgICAgICAgYW55UmVtb3ZlZCA9IHRydWU7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpc3RlbmVyLnR5cGUgIT09IHR5cGUgfHwgIWxpc3RlbmVyLmNhcHR1cmUgJiYgcGhhc2UgPT09IENBUFRVUklOR19QSEFTRSB8fCBsaXN0ZW5lci5jYXB0dXJlICYmIHBoYXNlID09PSBCVUJCTElOR19QSEFTRSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lci5oYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIGxpc3RlbmVyLmhhbmRsZXIuY2FsbChjdXJyZW50VGFyZ2V0LCBldmVudCk7IGVsc2UgbGlzdGVuZXIuaGFuZGxlci5oYW5kbGVFdmVudChldmVudCk7XG4gICAgICAgICAgaWYgKHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvblRhYmxlLmdldChldmVudCkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICBpZiAoIXBlbmRpbmdFcnJvcikgcGVuZGluZ0Vycm9yID0gZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxpc3RlbmVycy5kZXB0aC0tO1xuICAgICAgaWYgKGFueVJlbW92ZWQgJiYgbGlzdGVuZXJzLmRlcHRoID09PSAwKSB7XG4gICAgICAgIHZhciBjb3B5ID0gbGlzdGVuZXJzLnNsaWNlKCk7XG4gICAgICAgIGxpc3RlbmVycy5sZW5ndGggPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvcHkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoIWNvcHlbaV0ucmVtb3ZlZCkgbGlzdGVuZXJzLnB1c2goY29weVtpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAhc3RvcFByb3BhZ2F0aW9uVGFibGUuZ2V0KGV2ZW50KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gTGlzdGVuZXIodHlwZSwgaGFuZGxlciwgY2FwdHVyZSkge1xuICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgIHRoaXMuaGFuZGxlciA9IGhhbmRsZXI7XG4gICAgICB0aGlzLmNhcHR1cmUgPSBCb29sZWFuKGNhcHR1cmUpO1xuICAgIH1cbiAgICBMaXN0ZW5lci5wcm90b3R5cGUgPSB7XG4gICAgICBlcXVhbHM6IGZ1bmN0aW9uKHRoYXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlciA9PT0gdGhhdC5oYW5kbGVyICYmIHRoaXMudHlwZSA9PT0gdGhhdC50eXBlICYmIHRoaXMuY2FwdHVyZSA9PT0gdGhhdC5jYXB0dXJlO1xuICAgICAgfSxcbiAgICAgIGdldCByZW1vdmVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVyID09PSBudWxsO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlciA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgT3JpZ2luYWxFdmVudCA9IHdpbmRvdy5FdmVudDtcbiAgICBPcmlnaW5hbEV2ZW50LnByb3RvdHlwZS5wb2x5bWVyQmxhY2tMaXN0XyA9IHtcbiAgICAgIHJldHVyblZhbHVlOiB0cnVlLFxuICAgICAga2V5TG9jYXRpb246IHRydWVcbiAgICB9O1xuICAgIGZ1bmN0aW9uIEV2ZW50KHR5cGUsIG9wdGlvbnMpIHtcbiAgICAgIGlmICh0eXBlIGluc3RhbmNlb2YgT3JpZ2luYWxFdmVudCkge1xuICAgICAgICB2YXIgaW1wbCA9IHR5cGU7XG4gICAgICAgIGlmICghT3JpZ2luYWxCZWZvcmVVbmxvYWRFdmVudCAmJiBpbXBsLnR5cGUgPT09IFwiYmVmb3JldW5sb2FkXCIgJiYgISh0aGlzIGluc3RhbmNlb2YgQmVmb3JlVW5sb2FkRXZlbnQpKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBCZWZvcmVVbmxvYWRFdmVudChpbXBsKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRXcmFwcGVyKGltcGwsIHRoaXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHdyYXAoY29uc3RydWN0RXZlbnQoT3JpZ2luYWxFdmVudCwgXCJFdmVudFwiLCB0eXBlLCBvcHRpb25zKSk7XG4gICAgICB9XG4gICAgfVxuICAgIEV2ZW50LnByb3RvdHlwZSA9IHtcbiAgICAgIGdldCB0YXJnZXQoKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXRUYWJsZS5nZXQodGhpcyk7XG4gICAgICB9LFxuICAgICAgZ2V0IGN1cnJlbnRUYXJnZXQoKSB7XG4gICAgICAgIHJldHVybiBjdXJyZW50VGFyZ2V0VGFibGUuZ2V0KHRoaXMpO1xuICAgICAgfSxcbiAgICAgIGdldCBldmVudFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gZXZlbnRQaGFzZVRhYmxlLmdldCh0aGlzKTtcbiAgICAgIH0sXG4gICAgICBnZXQgcGF0aCgpIHtcbiAgICAgICAgdmFyIGV2ZW50UGF0aCA9IGV2ZW50UGF0aFRhYmxlLmdldCh0aGlzKTtcbiAgICAgICAgaWYgKCFldmVudFBhdGgpIHJldHVybiBbXTtcbiAgICAgICAgcmV0dXJuIGV2ZW50UGF0aC5zbGljZSgpO1xuICAgICAgfSxcbiAgICAgIHN0b3BQcm9wYWdhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHN0b3BQcm9wYWdhdGlvblRhYmxlLnNldCh0aGlzLCB0cnVlKTtcbiAgICAgIH0sXG4gICAgICBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICBzdG9wUHJvcGFnYXRpb25UYWJsZS5zZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgIHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvblRhYmxlLnNldCh0aGlzLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBzdXBwb3J0c0RlZmF1bHRQcmV2ZW50ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKTtcbiAgICAgIGUuaW5pdEV2ZW50KFwidGVzdFwiLCB0cnVlLCB0cnVlKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybiBlLmRlZmF1bHRQcmV2ZW50ZWQ7XG4gICAgfSgpO1xuICAgIGlmICghc3VwcG9ydHNEZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICBFdmVudC5wcm90b3R5cGUucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbmNlbGFibGUpIHJldHVybjtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImRlZmF1bHRQcmV2ZW50ZWRcIiwge1xuICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEV2ZW50LCBFdmVudCwgZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKSk7XG4gICAgZnVuY3Rpb24gdW53cmFwT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMucmVsYXRlZFRhcmdldCkgcmV0dXJuIG9wdGlvbnM7XG4gICAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShvcHRpb25zLCB7XG4gICAgICAgIHJlbGF0ZWRUYXJnZXQ6IHtcbiAgICAgICAgICB2YWx1ZTogdW53cmFwKG9wdGlvbnMucmVsYXRlZFRhcmdldClcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyR2VuZXJpY0V2ZW50KG5hbWUsIFN1cGVyRXZlbnQsIHByb3RvdHlwZSkge1xuICAgICAgdmFyIE9yaWdpbmFsRXZlbnQgPSB3aW5kb3dbbmFtZV07XG4gICAgICB2YXIgR2VuZXJpY0V2ZW50ID0gZnVuY3Rpb24odHlwZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIE9yaWdpbmFsRXZlbnQpIHNldFdyYXBwZXIodHlwZSwgdGhpcyk7IGVsc2UgcmV0dXJuIHdyYXAoY29uc3RydWN0RXZlbnQoT3JpZ2luYWxFdmVudCwgbmFtZSwgdHlwZSwgb3B0aW9ucykpO1xuICAgICAgfTtcbiAgICAgIEdlbmVyaWNFdmVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFN1cGVyRXZlbnQucHJvdG90eXBlKTtcbiAgICAgIGlmIChwcm90b3R5cGUpIG1peGluKEdlbmVyaWNFdmVudC5wcm90b3R5cGUsIHByb3RvdHlwZSk7XG4gICAgICBpZiAoT3JpZ2luYWxFdmVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEV2ZW50LCBHZW5lcmljRXZlbnQsIG5ldyBPcmlnaW5hbEV2ZW50KFwidGVtcFwiKSk7XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsRXZlbnQsIEdlbmVyaWNFdmVudCwgZG9jdW1lbnQuY3JlYXRlRXZlbnQobmFtZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gR2VuZXJpY0V2ZW50O1xuICAgIH1cbiAgICB2YXIgVUlFdmVudCA9IHJlZ2lzdGVyR2VuZXJpY0V2ZW50KFwiVUlFdmVudFwiLCBFdmVudCk7XG4gICAgdmFyIEN1c3RvbUV2ZW50ID0gcmVnaXN0ZXJHZW5lcmljRXZlbnQoXCJDdXN0b21FdmVudFwiLCBFdmVudCk7XG4gICAgdmFyIHJlbGF0ZWRUYXJnZXRQcm90byA9IHtcbiAgICAgIGdldCByZWxhdGVkVGFyZ2V0KCkge1xuICAgICAgICB2YXIgcmVsYXRlZFRhcmdldCA9IHJlbGF0ZWRUYXJnZXRUYWJsZS5nZXQodGhpcyk7XG4gICAgICAgIGlmIChyZWxhdGVkVGFyZ2V0ICE9PSB1bmRlZmluZWQpIHJldHVybiByZWxhdGVkVGFyZ2V0O1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykucmVsYXRlZFRhcmdldCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBnZXRJbml0RnVuY3Rpb24obmFtZSwgcmVsYXRlZFRhcmdldEluZGV4KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGFyZ3VtZW50c1tyZWxhdGVkVGFyZ2V0SW5kZXhdID0gdW53cmFwKGFyZ3VtZW50c1tyZWxhdGVkVGFyZ2V0SW5kZXhdKTtcbiAgICAgICAgdmFyIGltcGwgPSB1bndyYXAodGhpcyk7XG4gICAgICAgIGltcGxbbmFtZV0uYXBwbHkoaW1wbCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHZhciBtb3VzZUV2ZW50UHJvdG8gPSBtaXhpbih7XG4gICAgICBpbml0TW91c2VFdmVudDogZ2V0SW5pdEZ1bmN0aW9uKFwiaW5pdE1vdXNlRXZlbnRcIiwgMTQpXG4gICAgfSwgcmVsYXRlZFRhcmdldFByb3RvKTtcbiAgICB2YXIgZm9jdXNFdmVudFByb3RvID0gbWl4aW4oe1xuICAgICAgaW5pdEZvY3VzRXZlbnQ6IGdldEluaXRGdW5jdGlvbihcImluaXRGb2N1c0V2ZW50XCIsIDUpXG4gICAgfSwgcmVsYXRlZFRhcmdldFByb3RvKTtcbiAgICB2YXIgTW91c2VFdmVudCA9IHJlZ2lzdGVyR2VuZXJpY0V2ZW50KFwiTW91c2VFdmVudFwiLCBVSUV2ZW50LCBtb3VzZUV2ZW50UHJvdG8pO1xuICAgIHZhciBGb2N1c0V2ZW50ID0gcmVnaXN0ZXJHZW5lcmljRXZlbnQoXCJGb2N1c0V2ZW50XCIsIFVJRXZlbnQsIGZvY3VzRXZlbnRQcm90byk7XG4gICAgdmFyIGRlZmF1bHRJbml0RGljdHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHZhciBzdXBwb3J0c0V2ZW50Q29uc3RydWN0b3JzID0gZnVuY3Rpb24oKSB7XG4gICAgICB0cnkge1xuICAgICAgICBuZXcgd2luZG93LkZvY3VzRXZlbnQoXCJmb2N1c1wiKTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0oKTtcbiAgICBmdW5jdGlvbiBjb25zdHJ1Y3RFdmVudChPcmlnaW5hbEV2ZW50LCBuYW1lLCB0eXBlLCBvcHRpb25zKSB7XG4gICAgICBpZiAoc3VwcG9ydHNFdmVudENvbnN0cnVjdG9ycykgcmV0dXJuIG5ldyBPcmlnaW5hbEV2ZW50KHR5cGUsIHVud3JhcE9wdGlvbnMob3B0aW9ucykpO1xuICAgICAgdmFyIGV2ZW50ID0gdW53cmFwKGRvY3VtZW50LmNyZWF0ZUV2ZW50KG5hbWUpKTtcbiAgICAgIHZhciBkZWZhdWx0RGljdCA9IGRlZmF1bHRJbml0RGljdHNbbmFtZV07XG4gICAgICB2YXIgYXJncyA9IFsgdHlwZSBdO1xuICAgICAgT2JqZWN0LmtleXMoZGVmYXVsdERpY3QpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHZhciB2ID0gb3B0aW9ucyAhPSBudWxsICYmIGtleSBpbiBvcHRpb25zID8gb3B0aW9uc1trZXldIDogZGVmYXVsdERpY3Rba2V5XTtcbiAgICAgICAgaWYgKGtleSA9PT0gXCJyZWxhdGVkVGFyZ2V0XCIpIHYgPSB1bndyYXAodik7XG4gICAgICAgIGFyZ3MucHVzaCh2KTtcbiAgICAgIH0pO1xuICAgICAgZXZlbnRbXCJpbml0XCIgKyBuYW1lXS5hcHBseShldmVudCwgYXJncyk7XG4gICAgICByZXR1cm4gZXZlbnQ7XG4gICAgfVxuICAgIGlmICghc3VwcG9ydHNFdmVudENvbnN0cnVjdG9ycykge1xuICAgICAgdmFyIGNvbmZpZ3VyZUV2ZW50Q29uc3RydWN0b3IgPSBmdW5jdGlvbihuYW1lLCBpbml0RGljdCwgc3VwZXJOYW1lKSB7XG4gICAgICAgIGlmIChzdXBlck5hbWUpIHtcbiAgICAgICAgICB2YXIgc3VwZXJEaWN0ID0gZGVmYXVsdEluaXREaWN0c1tzdXBlck5hbWVdO1xuICAgICAgICAgIGluaXREaWN0ID0gbWl4aW4obWl4aW4oe30sIHN1cGVyRGljdCksIGluaXREaWN0KTtcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0SW5pdERpY3RzW25hbWVdID0gaW5pdERpY3Q7XG4gICAgICB9O1xuICAgICAgY29uZmlndXJlRXZlbnRDb25zdHJ1Y3RvcihcIkV2ZW50XCIsIHtcbiAgICAgICAgYnViYmxlczogZmFsc2UsXG4gICAgICAgIGNhbmNlbGFibGU6IGZhbHNlXG4gICAgICB9KTtcbiAgICAgIGNvbmZpZ3VyZUV2ZW50Q29uc3RydWN0b3IoXCJDdXN0b21FdmVudFwiLCB7XG4gICAgICAgIGRldGFpbDogbnVsbFxuICAgICAgfSwgXCJFdmVudFwiKTtcbiAgICAgIGNvbmZpZ3VyZUV2ZW50Q29uc3RydWN0b3IoXCJVSUV2ZW50XCIsIHtcbiAgICAgICAgdmlldzogbnVsbCxcbiAgICAgICAgZGV0YWlsOiAwXG4gICAgICB9LCBcIkV2ZW50XCIpO1xuICAgICAgY29uZmlndXJlRXZlbnRDb25zdHJ1Y3RvcihcIk1vdXNlRXZlbnRcIiwge1xuICAgICAgICBzY3JlZW5YOiAwLFxuICAgICAgICBzY3JlZW5ZOiAwLFxuICAgICAgICBjbGllbnRYOiAwLFxuICAgICAgICBjbGllbnRZOiAwLFxuICAgICAgICBjdHJsS2V5OiBmYWxzZSxcbiAgICAgICAgYWx0S2V5OiBmYWxzZSxcbiAgICAgICAgc2hpZnRLZXk6IGZhbHNlLFxuICAgICAgICBtZXRhS2V5OiBmYWxzZSxcbiAgICAgICAgYnV0dG9uOiAwLFxuICAgICAgICByZWxhdGVkVGFyZ2V0OiBudWxsXG4gICAgICB9LCBcIlVJRXZlbnRcIik7XG4gICAgICBjb25maWd1cmVFdmVudENvbnN0cnVjdG9yKFwiRm9jdXNFdmVudFwiLCB7XG4gICAgICAgIHJlbGF0ZWRUYXJnZXQ6IG51bGxcbiAgICAgIH0sIFwiVUlFdmVudFwiKTtcbiAgICB9XG4gICAgdmFyIE9yaWdpbmFsQmVmb3JlVW5sb2FkRXZlbnQgPSB3aW5kb3cuQmVmb3JlVW5sb2FkRXZlbnQ7XG4gICAgZnVuY3Rpb24gQmVmb3JlVW5sb2FkRXZlbnQoaW1wbCkge1xuICAgICAgRXZlbnQuY2FsbCh0aGlzLCBpbXBsKTtcbiAgICB9XG4gICAgQmVmb3JlVW5sb2FkRXZlbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFdmVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKEJlZm9yZVVubG9hZEV2ZW50LnByb3RvdHlwZSwge1xuICAgICAgZ2V0IHJldHVyblZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLnJldHVyblZhbHVlO1xuICAgICAgfSxcbiAgICAgIHNldCByZXR1cm5WYWx1ZSh2KSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5yZXR1cm5WYWx1ZSA9IHY7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKE9yaWdpbmFsQmVmb3JlVW5sb2FkRXZlbnQpIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEJlZm9yZVVubG9hZEV2ZW50LCBCZWZvcmVVbmxvYWRFdmVudCk7XG4gICAgZnVuY3Rpb24gaXNWYWxpZExpc3RlbmVyKGZ1bikge1xuICAgICAgaWYgKHR5cGVvZiBmdW4gPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gZnVuICYmIGZ1bi5oYW5kbGVFdmVudDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNNdXRhdGlvbkV2ZW50KHR5cGUpIHtcbiAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgIGNhc2UgXCJET01BdHRyTW9kaWZpZWRcIjpcbiAgICAgICBjYXNlIFwiRE9NQXR0cmlidXRlTmFtZUNoYW5nZWRcIjpcbiAgICAgICBjYXNlIFwiRE9NQ2hhcmFjdGVyRGF0YU1vZGlmaWVkXCI6XG4gICAgICAgY2FzZSBcIkRPTUVsZW1lbnROYW1lQ2hhbmdlZFwiOlxuICAgICAgIGNhc2UgXCJET01Ob2RlSW5zZXJ0ZWRcIjpcbiAgICAgICBjYXNlIFwiRE9NTm9kZUluc2VydGVkSW50b0RvY3VtZW50XCI6XG4gICAgICAgY2FzZSBcIkRPTU5vZGVSZW1vdmVkXCI6XG4gICAgICAgY2FzZSBcIkRPTU5vZGVSZW1vdmVkRnJvbURvY3VtZW50XCI6XG4gICAgICAgY2FzZSBcIkRPTVN1YnRyZWVNb2RpZmllZFwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIE9yaWdpbmFsRXZlbnRUYXJnZXQgPSB3aW5kb3cuRXZlbnRUYXJnZXQ7XG4gICAgZnVuY3Rpb24gRXZlbnRUYXJnZXQoaW1wbCkge1xuICAgICAgc2V0V3JhcHBlcihpbXBsLCB0aGlzKTtcbiAgICB9XG4gICAgdmFyIG1ldGhvZE5hbWVzID0gWyBcImFkZEV2ZW50TGlzdGVuZXJcIiwgXCJyZW1vdmVFdmVudExpc3RlbmVyXCIsIFwiZGlzcGF0Y2hFdmVudFwiIF07XG4gICAgWyBOb2RlLCBXaW5kb3cgXS5mb3JFYWNoKGZ1bmN0aW9uKGNvbnN0cnVjdG9yKSB7XG4gICAgICB2YXIgcCA9IGNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgICAgIG1ldGhvZE5hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocCwgbmFtZSArIFwiX1wiLCB7XG4gICAgICAgICAgdmFsdWU6IHBbbmFtZV1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBmdW5jdGlvbiBnZXRUYXJnZXRUb0xpc3RlbkF0KHdyYXBwZXIpIHtcbiAgICAgIGlmICh3cmFwcGVyIGluc3RhbmNlb2Ygd3JhcHBlcnMuU2hhZG93Um9vdCkgd3JhcHBlciA9IHdyYXBwZXIuaG9zdDtcbiAgICAgIHJldHVybiB1bndyYXAod3JhcHBlcik7XG4gICAgfVxuICAgIEV2ZW50VGFyZ2V0LnByb3RvdHlwZSA9IHtcbiAgICAgIGFkZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKHR5cGUsIGZ1biwgY2FwdHVyZSkge1xuICAgICAgICBpZiAoIWlzVmFsaWRMaXN0ZW5lcihmdW4pIHx8IGlzTXV0YXRpb25FdmVudCh0eXBlKSkgcmV0dXJuO1xuICAgICAgICB2YXIgbGlzdGVuZXIgPSBuZXcgTGlzdGVuZXIodHlwZSwgZnVuLCBjYXB0dXJlKTtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IGxpc3RlbmVyc1RhYmxlLmdldCh0aGlzKTtcbiAgICAgICAgaWYgKCFsaXN0ZW5lcnMpIHtcbiAgICAgICAgICBsaXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgICBsaXN0ZW5lcnMuZGVwdGggPSAwO1xuICAgICAgICAgIGxpc3RlbmVyc1RhYmxlLnNldCh0aGlzLCBsaXN0ZW5lcnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXIuZXF1YWxzKGxpc3RlbmVyc1tpXSkpIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZ2V0VGFyZ2V0VG9MaXN0ZW5BdCh0aGlzKTtcbiAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXJfKHR5cGUsIGRpc3BhdGNoT3JpZ2luYWxFdmVudCwgdHJ1ZSk7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24odHlwZSwgZnVuLCBjYXB0dXJlKSB7XG4gICAgICAgIGNhcHR1cmUgPSBCb29sZWFuKGNhcHR1cmUpO1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gbGlzdGVuZXJzVGFibGUuZ2V0KHRoaXMpO1xuICAgICAgICBpZiAoIWxpc3RlbmVycykgcmV0dXJuO1xuICAgICAgICB2YXIgY291bnQgPSAwLCBmb3VuZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChsaXN0ZW5lcnNbaV0udHlwZSA9PT0gdHlwZSAmJiBsaXN0ZW5lcnNbaV0uY2FwdHVyZSA9PT0gY2FwdHVyZSkge1xuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbaV0uaGFuZGxlciA9PT0gZnVuKSB7XG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgbGlzdGVuZXJzW2ldLnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZm91bmQgJiYgY291bnQgPT09IDEpIHtcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gZ2V0VGFyZ2V0VG9MaXN0ZW5BdCh0aGlzKTtcbiAgICAgICAgICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcl8odHlwZSwgZGlzcGF0Y2hPcmlnaW5hbEV2ZW50LCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGRpc3BhdGNoRXZlbnQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBuYXRpdmVFdmVudCA9IHVud3JhcChldmVudCk7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBuYXRpdmVFdmVudC50eXBlO1xuICAgICAgICBoYW5kbGVkRXZlbnRzVGFibGUuc2V0KG5hdGl2ZUV2ZW50LCBmYWxzZSk7XG4gICAgICAgIHNjb3BlLnJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgICAgdmFyIHRlbXBMaXN0ZW5lcjtcbiAgICAgICAgaWYgKCFoYXNMaXN0ZW5lckluQW5jZXN0b3JzKHRoaXMsIGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICB0ZW1wTGlzdGVuZXIgPSBmdW5jdGlvbigpIHt9O1xuICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRlbXBMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gdW53cmFwKHRoaXMpLmRpc3BhdGNoRXZlbnRfKG5hdGl2ZUV2ZW50KTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBpZiAodGVtcExpc3RlbmVyKSB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0ZW1wTGlzdGVuZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBoYXNMaXN0ZW5lcihub2RlLCB0eXBlKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gbGlzdGVuZXJzVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgaWYgKGxpc3RlbmVycykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICghbGlzdGVuZXJzW2ldLnJlbW92ZWQgJiYgbGlzdGVuZXJzW2ldLnR5cGUgPT09IHR5cGUpIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhhc0xpc3RlbmVySW5BbmNlc3RvcnModGFyZ2V0LCB0eXBlKSB7XG4gICAgICBmb3IgKHZhciBub2RlID0gdW53cmFwKHRhcmdldCk7IG5vZGU7IG5vZGUgPSBub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgaWYgKGhhc0xpc3RlbmVyKHdyYXAobm9kZSksIHR5cGUpKSByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKE9yaWdpbmFsRXZlbnRUYXJnZXQpIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEV2ZW50VGFyZ2V0LCBFdmVudFRhcmdldCk7XG4gICAgZnVuY3Rpb24gd3JhcEV2ZW50VGFyZ2V0TWV0aG9kcyhjb25zdHJ1Y3RvcnMpIHtcbiAgICAgIGZvcndhcmRNZXRob2RzVG9XcmFwcGVyKGNvbnN0cnVjdG9ycywgbWV0aG9kTmFtZXMpO1xuICAgIH1cbiAgICB2YXIgb3JpZ2luYWxFbGVtZW50RnJvbVBvaW50ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludDtcbiAgICBmdW5jdGlvbiBlbGVtZW50RnJvbVBvaW50KHNlbGYsIGRvY3VtZW50LCB4LCB5KSB7XG4gICAgICBzY29wZS5yZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICB2YXIgZWxlbWVudCA9IHdyYXAob3JpZ2luYWxFbGVtZW50RnJvbVBvaW50LmNhbGwodW5zYWZlVW53cmFwKGRvY3VtZW50KSwgeCwgeSkpO1xuICAgICAgaWYgKCFlbGVtZW50KSByZXR1cm4gbnVsbDtcbiAgICAgIHZhciBwYXRoID0gZ2V0RXZlbnRQYXRoKGVsZW1lbnQsIG51bGwpO1xuICAgICAgdmFyIGlkeCA9IHBhdGgubGFzdEluZGV4T2Yoc2VsZik7XG4gICAgICBpZiAoaWR4ID09IC0xKSByZXR1cm4gbnVsbDsgZWxzZSBwYXRoID0gcGF0aC5zbGljZSgwLCBpZHgpO1xuICAgICAgcmV0dXJuIGV2ZW50UmV0YXJnZXR0aW5nKHBhdGgsIHNlbGYpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRFdmVudEhhbmRsZXJHZXR0ZXIobmFtZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaW5saW5lRXZlbnRIYW5kbGVycyA9IGV2ZW50SGFuZGxlcnNUYWJsZS5nZXQodGhpcyk7XG4gICAgICAgIHJldHVybiBpbmxpbmVFdmVudEhhbmRsZXJzICYmIGlubGluZUV2ZW50SGFuZGxlcnNbbmFtZV0gJiYgaW5saW5lRXZlbnRIYW5kbGVyc1tuYW1lXS52YWx1ZSB8fCBudWxsO1xuICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0RXZlbnRIYW5kbGVyU2V0dGVyKG5hbWUpIHtcbiAgICAgIHZhciBldmVudFR5cGUgPSBuYW1lLnNsaWNlKDIpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHZhciBpbmxpbmVFdmVudEhhbmRsZXJzID0gZXZlbnRIYW5kbGVyc1RhYmxlLmdldCh0aGlzKTtcbiAgICAgICAgaWYgKCFpbmxpbmVFdmVudEhhbmRsZXJzKSB7XG4gICAgICAgICAgaW5saW5lRXZlbnRIYW5kbGVycyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgICAgZXZlbnRIYW5kbGVyc1RhYmxlLnNldCh0aGlzLCBpbmxpbmVFdmVudEhhbmRsZXJzKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb2xkID0gaW5saW5lRXZlbnRIYW5kbGVyc1tuYW1lXTtcbiAgICAgICAgaWYgKG9sZCkgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgb2xkLndyYXBwZWQsIGZhbHNlKTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgdmFyIHdyYXBwZWQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgcnYgPSB2YWx1ZS5jYWxsKHRoaXMsIGUpO1xuICAgICAgICAgICAgaWYgKHJ2ID09PSBmYWxzZSkgZS5wcmV2ZW50RGVmYXVsdCgpOyBlbHNlIGlmIChuYW1lID09PSBcIm9uYmVmb3JldW5sb2FkXCIgJiYgdHlwZW9mIHJ2ID09PSBcInN0cmluZ1wiKSBlLnJldHVyblZhbHVlID0gcnY7XG4gICAgICAgICAgfTtcbiAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB3cmFwcGVkLCBmYWxzZSk7XG4gICAgICAgICAgaW5saW5lRXZlbnRIYW5kbGVyc1tuYW1lXSA9IHtcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgIHdyYXBwZWQ6IHdyYXBwZWRcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgICBzY29wZS5lbGVtZW50RnJvbVBvaW50ID0gZWxlbWVudEZyb21Qb2ludDtcbiAgICBzY29wZS5nZXRFdmVudEhhbmRsZXJHZXR0ZXIgPSBnZXRFdmVudEhhbmRsZXJHZXR0ZXI7XG4gICAgc2NvcGUuZ2V0RXZlbnRIYW5kbGVyU2V0dGVyID0gZ2V0RXZlbnRIYW5kbGVyU2V0dGVyO1xuICAgIHNjb3BlLndyYXBFdmVudFRhcmdldE1ldGhvZHMgPSB3cmFwRXZlbnRUYXJnZXRNZXRob2RzO1xuICAgIHNjb3BlLndyYXBwZXJzLkJlZm9yZVVubG9hZEV2ZW50ID0gQmVmb3JlVW5sb2FkRXZlbnQ7XG4gICAgc2NvcGUud3JhcHBlcnMuQ3VzdG9tRXZlbnQgPSBDdXN0b21FdmVudDtcbiAgICBzY29wZS53cmFwcGVycy5FdmVudCA9IEV2ZW50O1xuICAgIHNjb3BlLndyYXBwZXJzLkV2ZW50VGFyZ2V0ID0gRXZlbnRUYXJnZXQ7XG4gICAgc2NvcGUud3JhcHBlcnMuRm9jdXNFdmVudCA9IEZvY3VzRXZlbnQ7XG4gICAgc2NvcGUud3JhcHBlcnMuTW91c2VFdmVudCA9IE1vdXNlRXZlbnQ7XG4gICAgc2NvcGUud3JhcHBlcnMuVUlFdmVudCA9IFVJRXZlbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBVSUV2ZW50ID0gc2NvcGUud3JhcHBlcnMuVUlFdmVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBzZXRXcmFwcGVyID0gc2NvcGUuc2V0V3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxUb3VjaEV2ZW50ID0gd2luZG93LlRvdWNoRXZlbnQ7XG4gICAgaWYgKCFPcmlnaW5hbFRvdWNoRXZlbnQpIHJldHVybjtcbiAgICB2YXIgbmF0aXZlRXZlbnQ7XG4gICAgdHJ5IHtcbiAgICAgIG5hdGl2ZUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJUb3VjaEV2ZW50XCIpO1xuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBub25FbnVtRGVzY3JpcHRvciA9IHtcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlXG4gICAgfTtcbiAgICBmdW5jdGlvbiBub25FbnVtKG9iaiwgcHJvcCkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcCwgbm9uRW51bURlc2NyaXB0b3IpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBUb3VjaChpbXBsKSB7XG4gICAgICBzZXRXcmFwcGVyKGltcGwsIHRoaXMpO1xuICAgIH1cbiAgICBUb3VjaC5wcm90b3R5cGUgPSB7XG4gICAgICBnZXQgdGFyZ2V0KCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykudGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBkZXNjciA9IHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBnZXQ6IG51bGxcbiAgICB9O1xuICAgIFsgXCJjbGllbnRYXCIsIFwiY2xpZW50WVwiLCBcInNjcmVlblhcIiwgXCJzY3JlZW5ZXCIsIFwicGFnZVhcIiwgXCJwYWdlWVwiLCBcImlkZW50aWZpZXJcIiwgXCJ3ZWJraXRSYWRpdXNYXCIsIFwid2Via2l0UmFkaXVzWVwiLCBcIndlYmtpdFJvdGF0aW9uQW5nbGVcIiwgXCJ3ZWJraXRGb3JjZVwiIF0uZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICBkZXNjci5nZXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKVtuYW1lXTtcbiAgICAgIH07XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVG91Y2gucHJvdG90eXBlLCBuYW1lLCBkZXNjcik7XG4gICAgfSk7XG4gICAgZnVuY3Rpb24gVG91Y2hMaXN0KCkge1xuICAgICAgdGhpcy5sZW5ndGggPSAwO1xuICAgICAgbm9uRW51bSh0aGlzLCBcImxlbmd0aFwiKTtcbiAgICB9XG4gICAgVG91Y2hMaXN0LnByb3RvdHlwZSA9IHtcbiAgICAgIGl0ZW06IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzW2luZGV4XTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIHdyYXBUb3VjaExpc3QobmF0aXZlVG91Y2hMaXN0KSB7XG4gICAgICB2YXIgbGlzdCA9IG5ldyBUb3VjaExpc3QoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmF0aXZlVG91Y2hMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpc3RbaV0gPSBuZXcgVG91Y2gobmF0aXZlVG91Y2hMaXN0W2ldKTtcbiAgICAgIH1cbiAgICAgIGxpc3QubGVuZ3RoID0gaTtcbiAgICAgIHJldHVybiBsaXN0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBUb3VjaEV2ZW50KGltcGwpIHtcbiAgICAgIFVJRXZlbnQuY2FsbCh0aGlzLCBpbXBsKTtcbiAgICB9XG4gICAgVG91Y2hFdmVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRXZlbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihUb3VjaEV2ZW50LnByb3RvdHlwZSwge1xuICAgICAgZ2V0IHRvdWNoZXMoKSB7XG4gICAgICAgIHJldHVybiB3cmFwVG91Y2hMaXN0KHVuc2FmZVVud3JhcCh0aGlzKS50b3VjaGVzKTtcbiAgICAgIH0sXG4gICAgICBnZXQgdGFyZ2V0VG91Y2hlcygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBUb3VjaExpc3QodW5zYWZlVW53cmFwKHRoaXMpLnRhcmdldFRvdWNoZXMpO1xuICAgICAgfSxcbiAgICAgIGdldCBjaGFuZ2VkVG91Y2hlcygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBUb3VjaExpc3QodW5zYWZlVW53cmFwKHRoaXMpLmNoYW5nZWRUb3VjaGVzKTtcbiAgICAgIH0sXG4gICAgICBpbml0VG91Y2hFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxUb3VjaEV2ZW50LCBUb3VjaEV2ZW50LCBuYXRpdmVFdmVudCk7XG4gICAgc2NvcGUud3JhcHBlcnMuVG91Y2ggPSBUb3VjaDtcbiAgICBzY29wZS53cmFwcGVycy5Ub3VjaEV2ZW50ID0gVG91Y2hFdmVudDtcbiAgICBzY29wZS53cmFwcGVycy5Ub3VjaExpc3QgPSBUb3VjaExpc3Q7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBub25FbnVtRGVzY3JpcHRvciA9IHtcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlXG4gICAgfTtcbiAgICBmdW5jdGlvbiBub25FbnVtKG9iaiwgcHJvcCkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcCwgbm9uRW51bURlc2NyaXB0b3IpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBOb2RlTGlzdCgpIHtcbiAgICAgIHRoaXMubGVuZ3RoID0gMDtcbiAgICAgIG5vbkVudW0odGhpcywgXCJsZW5ndGhcIik7XG4gICAgfVxuICAgIE5vZGVMaXN0LnByb3RvdHlwZSA9IHtcbiAgICAgIGl0ZW06IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzW2luZGV4XTtcbiAgICAgIH1cbiAgICB9O1xuICAgIG5vbkVudW0oTm9kZUxpc3QucHJvdG90eXBlLCBcIml0ZW1cIik7XG4gICAgZnVuY3Rpb24gd3JhcE5vZGVMaXN0KGxpc3QpIHtcbiAgICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiBsaXN0O1xuICAgICAgdmFyIHdyYXBwZXJMaXN0ID0gbmV3IE5vZGVMaXN0KCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB3cmFwcGVyTGlzdFtpXSA9IHdyYXAobGlzdFtpXSk7XG4gICAgICB9XG4gICAgICB3cmFwcGVyTGlzdC5sZW5ndGggPSBsZW5ndGg7XG4gICAgICByZXR1cm4gd3JhcHBlckxpc3Q7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZFdyYXBOb2RlTGlzdE1ldGhvZCh3cmFwcGVyQ29uc3RydWN0b3IsIG5hbWUpIHtcbiAgICAgIHdyYXBwZXJDb25zdHJ1Y3Rvci5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBOb2RlTGlzdCh1bnNhZmVVbndyYXAodGhpcylbbmFtZV0uYXBwbHkodW5zYWZlVW53cmFwKHRoaXMpLCBhcmd1bWVudHMpKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHNjb3BlLndyYXBwZXJzLk5vZGVMaXN0ID0gTm9kZUxpc3Q7XG4gICAgc2NvcGUuYWRkV3JhcE5vZGVMaXN0TWV0aG9kID0gYWRkV3JhcE5vZGVMaXN0TWV0aG9kO1xuICAgIHNjb3BlLndyYXBOb2RlTGlzdCA9IHdyYXBOb2RlTGlzdDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgc2NvcGUud3JhcEhUTUxDb2xsZWN0aW9uID0gc2NvcGUud3JhcE5vZGVMaXN0O1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxDb2xsZWN0aW9uID0gc2NvcGUud3JhcHBlcnMuTm9kZUxpc3Q7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBFdmVudFRhcmdldCA9IHNjb3BlLndyYXBwZXJzLkV2ZW50VGFyZ2V0O1xuICAgIHZhciBOb2RlTGlzdCA9IHNjb3BlLndyYXBwZXJzLk5vZGVMaXN0O1xuICAgIHZhciBUcmVlU2NvcGUgPSBzY29wZS5UcmVlU2NvcGU7XG4gICAgdmFyIGFzc2VydCA9IHNjb3BlLmFzc2VydDtcbiAgICB2YXIgZGVmaW5lV3JhcEdldHRlciA9IHNjb3BlLmRlZmluZVdyYXBHZXR0ZXI7XG4gICAgdmFyIGVucXVldWVNdXRhdGlvbiA9IHNjb3BlLmVucXVldWVNdXRhdGlvbjtcbiAgICB2YXIgZ2V0VHJlZVNjb3BlID0gc2NvcGUuZ2V0VHJlZVNjb3BlO1xuICAgIHZhciBpc1dyYXBwZXIgPSBzY29wZS5pc1dyYXBwZXI7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyVHJhbnNpZW50T2JzZXJ2ZXJzID0gc2NvcGUucmVnaXN0ZXJUcmFuc2llbnRPYnNlcnZlcnM7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgc2V0VHJlZVNjb3BlID0gc2NvcGUuc2V0VHJlZVNjb3BlO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgdW53cmFwSWZOZWVkZWQgPSBzY29wZS51bndyYXBJZk5lZWRlZDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIHdyYXBJZk5lZWRlZCA9IHNjb3BlLndyYXBJZk5lZWRlZDtcbiAgICB2YXIgd3JhcHBlcnMgPSBzY29wZS53cmFwcGVycztcbiAgICBmdW5jdGlvbiBhc3NlcnRJc05vZGVXcmFwcGVyKG5vZGUpIHtcbiAgICAgIGFzc2VydChub2RlIGluc3RhbmNlb2YgTm9kZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZU9uZUVsZW1lbnROb2RlTGlzdChub2RlKSB7XG4gICAgICB2YXIgbm9kZXMgPSBuZXcgTm9kZUxpc3QoKTtcbiAgICAgIG5vZGVzWzBdID0gbm9kZTtcbiAgICAgIG5vZGVzLmxlbmd0aCA9IDE7XG4gICAgICByZXR1cm4gbm9kZXM7XG4gICAgfVxuICAgIHZhciBzdXJwcmVzc011dGF0aW9ucyA9IGZhbHNlO1xuICAgIGZ1bmN0aW9uIGVucXVldWVSZW1vdmFsRm9ySW5zZXJ0ZWROb2Rlcyhub2RlLCBwYXJlbnQsIG5vZGVzKSB7XG4gICAgICBlbnF1ZXVlTXV0YXRpb24ocGFyZW50LCBcImNoaWxkTGlzdFwiLCB7XG4gICAgICAgIHJlbW92ZWROb2Rlczogbm9kZXMsXG4gICAgICAgIHByZXZpb3VzU2libGluZzogbm9kZS5wcmV2aW91c1NpYmxpbmcsXG4gICAgICAgIG5leHRTaWJsaW5nOiBub2RlLm5leHRTaWJsaW5nXG4gICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZW5xdWV1ZVJlbW92YWxGb3JJbnNlcnRlZERvY3VtZW50RnJhZ21lbnQoZGYsIG5vZGVzKSB7XG4gICAgICBlbnF1ZXVlTXV0YXRpb24oZGYsIFwiY2hpbGRMaXN0XCIsIHtcbiAgICAgICAgcmVtb3ZlZE5vZGVzOiBub2Rlc1xuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNvbGxlY3ROb2Rlcyhub2RlLCBwYXJlbnROb2RlLCBwcmV2aW91c05vZGUsIG5leHROb2RlKSB7XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQpIHtcbiAgICAgICAgdmFyIG5vZGVzID0gY29sbGVjdE5vZGVzRm9yRG9jdW1lbnRGcmFnbWVudChub2RlKTtcbiAgICAgICAgc3VycHJlc3NNdXRhdGlvbnMgPSB0cnVlO1xuICAgICAgICBmb3IgKHZhciBpID0gbm9kZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGVzW2ldKTtcbiAgICAgICAgICBub2Rlc1tpXS5wYXJlbnROb2RlXyA9IHBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgc3VycHJlc3NNdXRhdGlvbnMgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIG5vZGVzW2ldLnByZXZpb3VzU2libGluZ18gPSBub2Rlc1tpIC0gMV0gfHwgcHJldmlvdXNOb2RlO1xuICAgICAgICAgIG5vZGVzW2ldLm5leHRTaWJsaW5nXyA9IG5vZGVzW2kgKyAxXSB8fCBuZXh0Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJldmlvdXNOb2RlKSBwcmV2aW91c05vZGUubmV4dFNpYmxpbmdfID0gbm9kZXNbMF07XG4gICAgICAgIGlmIChuZXh0Tm9kZSkgbmV4dE5vZGUucHJldmlvdXNTaWJsaW5nXyA9IG5vZGVzW25vZGVzLmxlbmd0aCAtIDFdO1xuICAgICAgICByZXR1cm4gbm9kZXM7XG4gICAgICB9XG4gICAgICB2YXIgbm9kZXMgPSBjcmVhdGVPbmVFbGVtZW50Tm9kZUxpc3Qobm9kZSk7XG4gICAgICB2YXIgb2xkUGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgaWYgKG9sZFBhcmVudCkge1xuICAgICAgICBvbGRQYXJlbnQucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICB9XG4gICAgICBub2RlLnBhcmVudE5vZGVfID0gcGFyZW50Tm9kZTtcbiAgICAgIG5vZGUucHJldmlvdXNTaWJsaW5nXyA9IHByZXZpb3VzTm9kZTtcbiAgICAgIG5vZGUubmV4dFNpYmxpbmdfID0gbmV4dE5vZGU7XG4gICAgICBpZiAocHJldmlvdXNOb2RlKSBwcmV2aW91c05vZGUubmV4dFNpYmxpbmdfID0gbm9kZTtcbiAgICAgIGlmIChuZXh0Tm9kZSkgbmV4dE5vZGUucHJldmlvdXNTaWJsaW5nXyA9IG5vZGU7XG4gICAgICByZXR1cm4gbm9kZXM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNvbGxlY3ROb2Rlc05hdGl2ZShub2RlKSB7XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQpIHJldHVybiBjb2xsZWN0Tm9kZXNGb3JEb2N1bWVudEZyYWdtZW50KG5vZGUpO1xuICAgICAgdmFyIG5vZGVzID0gY3JlYXRlT25lRWxlbWVudE5vZGVMaXN0KG5vZGUpO1xuICAgICAgdmFyIG9sZFBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgIGlmIChvbGRQYXJlbnQpIGVucXVldWVSZW1vdmFsRm9ySW5zZXJ0ZWROb2Rlcyhub2RlLCBvbGRQYXJlbnQsIG5vZGVzKTtcbiAgICAgIHJldHVybiBub2RlcztcbiAgICB9XG4gICAgZnVuY3Rpb24gY29sbGVjdE5vZGVzRm9yRG9jdW1lbnRGcmFnbWVudChub2RlKSB7XG4gICAgICB2YXIgbm9kZXMgPSBuZXcgTm9kZUxpc3QoKTtcbiAgICAgIHZhciBpID0gMDtcbiAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICBub2Rlc1tpKytdID0gY2hpbGQ7XG4gICAgICB9XG4gICAgICBub2Rlcy5sZW5ndGggPSBpO1xuICAgICAgZW5xdWV1ZVJlbW92YWxGb3JJbnNlcnRlZERvY3VtZW50RnJhZ21lbnQobm9kZSwgbm9kZXMpO1xuICAgICAgcmV0dXJuIG5vZGVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzbmFwc2hvdE5vZGVMaXN0KG5vZGVMaXN0KSB7XG4gICAgICByZXR1cm4gbm9kZUxpc3Q7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5vZGVXYXNBZGRlZChub2RlLCB0cmVlU2NvcGUpIHtcbiAgICAgIHNldFRyZWVTY29wZShub2RlLCB0cmVlU2NvcGUpO1xuICAgICAgbm9kZS5ub2RlSXNJbnNlcnRlZF8oKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbm9kZXNXZXJlQWRkZWQobm9kZXMsIHBhcmVudCkge1xuICAgICAgdmFyIHRyZWVTY29wZSA9IGdldFRyZWVTY29wZShwYXJlbnQpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBub2RlV2FzQWRkZWQobm9kZXNbaV0sIHRyZWVTY29wZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5vZGVXYXNSZW1vdmVkKG5vZGUpIHtcbiAgICAgIHNldFRyZWVTY29wZShub2RlLCBuZXcgVHJlZVNjb3BlKG5vZGUsIG51bGwpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbm9kZXNXZXJlUmVtb3ZlZChub2Rlcykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBub2RlV2FzUmVtb3ZlZChub2Rlc1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVuc3VyZVNhbWVPd25lckRvY3VtZW50KHBhcmVudCwgY2hpbGQpIHtcbiAgICAgIHZhciBvd25lckRvYyA9IHBhcmVudC5ub2RlVHlwZSA9PT0gTm9kZS5ET0NVTUVOVF9OT0RFID8gcGFyZW50IDogcGFyZW50Lm93bmVyRG9jdW1lbnQ7XG4gICAgICBpZiAob3duZXJEb2MgIT09IGNoaWxkLm93bmVyRG9jdW1lbnQpIG93bmVyRG9jLmFkb3B0Tm9kZShjaGlsZCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkb3B0Tm9kZXNJZk5lZWRlZChvd25lciwgbm9kZXMpIHtcbiAgICAgIGlmICghbm9kZXMubGVuZ3RoKSByZXR1cm47XG4gICAgICB2YXIgb3duZXJEb2MgPSBvd25lci5vd25lckRvY3VtZW50O1xuICAgICAgaWYgKG93bmVyRG9jID09PSBub2Rlc1swXS5vd25lckRvY3VtZW50KSByZXR1cm47XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNjb3BlLmFkb3B0Tm9kZU5vUmVtb3ZlKG5vZGVzW2ldLCBvd25lckRvYyk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVud3JhcE5vZGVzRm9ySW5zZXJ0aW9uKG93bmVyLCBub2Rlcykge1xuICAgICAgYWRvcHROb2Rlc0lmTmVlZGVkKG93bmVyLCBub2Rlcyk7XG4gICAgICB2YXIgbGVuZ3RoID0gbm9kZXMubGVuZ3RoO1xuICAgICAgaWYgKGxlbmd0aCA9PT0gMSkgcmV0dXJuIHVud3JhcChub2Rlc1swXSk7XG4gICAgICB2YXIgZGYgPSB1bndyYXAob3duZXIub3duZXJEb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBkZi5hcHBlbmRDaGlsZCh1bndyYXAobm9kZXNbaV0pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZjtcbiAgICB9XG4gICAgZnVuY3Rpb24gY2xlYXJDaGlsZE5vZGVzKHdyYXBwZXIpIHtcbiAgICAgIGlmICh3cmFwcGVyLmZpcnN0Q2hpbGRfICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIGNoaWxkID0gd3JhcHBlci5maXJzdENoaWxkXztcbiAgICAgICAgd2hpbGUgKGNoaWxkKSB7XG4gICAgICAgICAgdmFyIHRtcCA9IGNoaWxkO1xuICAgICAgICAgIGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmdfO1xuICAgICAgICAgIHRtcC5wYXJlbnROb2RlXyA9IHRtcC5wcmV2aW91c1NpYmxpbmdfID0gdG1wLm5leHRTaWJsaW5nXyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgd3JhcHBlci5maXJzdENoaWxkXyA9IHdyYXBwZXIubGFzdENoaWxkXyA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlQWxsQ2hpbGROb2Rlcyh3cmFwcGVyKSB7XG4gICAgICBpZiAod3JhcHBlci5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIoKSkge1xuICAgICAgICB2YXIgY2hpbGRXcmFwcGVyID0gd3JhcHBlci5maXJzdENoaWxkO1xuICAgICAgICB3aGlsZSAoY2hpbGRXcmFwcGVyKSB7XG4gICAgICAgICAgYXNzZXJ0KGNoaWxkV3JhcHBlci5wYXJlbnROb2RlID09PSB3cmFwcGVyKTtcbiAgICAgICAgICB2YXIgbmV4dFNpYmxpbmcgPSBjaGlsZFdyYXBwZXIubmV4dFNpYmxpbmc7XG4gICAgICAgICAgdmFyIGNoaWxkTm9kZSA9IHVud3JhcChjaGlsZFdyYXBwZXIpO1xuICAgICAgICAgIHZhciBwYXJlbnROb2RlID0gY2hpbGROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgaWYgKHBhcmVudE5vZGUpIG9yaWdpbmFsUmVtb3ZlQ2hpbGQuY2FsbChwYXJlbnROb2RlLCBjaGlsZE5vZGUpO1xuICAgICAgICAgIGNoaWxkV3JhcHBlci5wcmV2aW91c1NpYmxpbmdfID0gY2hpbGRXcmFwcGVyLm5leHRTaWJsaW5nXyA9IGNoaWxkV3JhcHBlci5wYXJlbnROb2RlXyA9IG51bGw7XG4gICAgICAgICAgY2hpbGRXcmFwcGVyID0gbmV4dFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICAgICAgd3JhcHBlci5maXJzdENoaWxkXyA9IHdyYXBwZXIubGFzdENoaWxkXyA9IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbm9kZSA9IHVud3JhcCh3cmFwcGVyKTtcbiAgICAgICAgdmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgICB2YXIgbmV4dFNpYmxpbmc7XG4gICAgICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgICAgIG5leHRTaWJsaW5nID0gY2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICAgICAgb3JpZ2luYWxSZW1vdmVDaGlsZC5jYWxsKG5vZGUsIGNoaWxkKTtcbiAgICAgICAgICBjaGlsZCA9IG5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludmFsaWRhdGVQYXJlbnQobm9kZSkge1xuICAgICAgdmFyIHAgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICByZXR1cm4gcCAmJiBwLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcigpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjbGVhbnVwTm9kZXMobm9kZXMpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBuOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbiA9IG5vZGVzW2ldO1xuICAgICAgICBuLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobik7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBvcmlnaW5hbEltcG9ydE5vZGUgPSBkb2N1bWVudC5pbXBvcnROb2RlO1xuICAgIHZhciBvcmlnaW5hbENsb25lTm9kZSA9IHdpbmRvdy5Ob2RlLnByb3RvdHlwZS5jbG9uZU5vZGU7XG4gICAgZnVuY3Rpb24gY2xvbmVOb2RlKG5vZGUsIGRlZXAsIG9wdF9kb2MpIHtcbiAgICAgIHZhciBjbG9uZTtcbiAgICAgIGlmIChvcHRfZG9jKSBjbG9uZSA9IHdyYXAob3JpZ2luYWxJbXBvcnROb2RlLmNhbGwob3B0X2RvYywgdW5zYWZlVW53cmFwKG5vZGUpLCBmYWxzZSkpOyBlbHNlIGNsb25lID0gd3JhcChvcmlnaW5hbENsb25lTm9kZS5jYWxsKHVuc2FmZVVud3JhcChub2RlKSwgZmFsc2UpKTtcbiAgICAgIGlmIChkZWVwKSB7XG4gICAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgIGNsb25lLmFwcGVuZENoaWxkKGNsb25lTm9kZShjaGlsZCwgdHJ1ZSwgb3B0X2RvYykpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlIGluc3RhbmNlb2Ygd3JhcHBlcnMuSFRNTFRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICAgIHZhciBjbG9uZUNvbnRlbnQgPSBjbG9uZS5jb250ZW50O1xuICAgICAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5jb250ZW50LmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICBjbG9uZUNvbnRlbnQuYXBwZW5kQ2hpbGQoY2xvbmVOb2RlKGNoaWxkLCB0cnVlLCBvcHRfZG9jKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNvbnRhaW5zKHNlbGYsIGNoaWxkKSB7XG4gICAgICBpZiAoIWNoaWxkIHx8IGdldFRyZWVTY29wZShzZWxmKSAhPT0gZ2V0VHJlZVNjb3BlKGNoaWxkKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgZm9yICh2YXIgbm9kZSA9IGNoaWxkOyBub2RlOyBub2RlID0gbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgIGlmIChub2RlID09PSBzZWxmKSByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIE9yaWdpbmFsTm9kZSA9IHdpbmRvdy5Ob2RlO1xuICAgIGZ1bmN0aW9uIE5vZGUob3JpZ2luYWwpIHtcbiAgICAgIGFzc2VydChvcmlnaW5hbCBpbnN0YW5jZW9mIE9yaWdpbmFsTm9kZSk7XG4gICAgICBFdmVudFRhcmdldC5jYWxsKHRoaXMsIG9yaWdpbmFsKTtcbiAgICAgIHRoaXMucGFyZW50Tm9kZV8gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLmZpcnN0Q2hpbGRfID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5sYXN0Q2hpbGRfID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5uZXh0U2libGluZ18gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLnByZXZpb3VzU2libGluZ18gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLnRyZWVTY29wZV8gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHZhciBPcmlnaW5hbERvY3VtZW50RnJhZ21lbnQgPSB3aW5kb3cuRG9jdW1lbnRGcmFnbWVudDtcbiAgICB2YXIgb3JpZ2luYWxBcHBlbmRDaGlsZCA9IE9yaWdpbmFsTm9kZS5wcm90b3R5cGUuYXBwZW5kQ2hpbGQ7XG4gICAgdmFyIG9yaWdpbmFsQ29tcGFyZURvY3VtZW50UG9zaXRpb24gPSBPcmlnaW5hbE5vZGUucHJvdG90eXBlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uO1xuICAgIHZhciBvcmlnaW5hbElzRXF1YWxOb2RlID0gT3JpZ2luYWxOb2RlLnByb3RvdHlwZS5pc0VxdWFsTm9kZTtcbiAgICB2YXIgb3JpZ2luYWxJbnNlcnRCZWZvcmUgPSBPcmlnaW5hbE5vZGUucHJvdG90eXBlLmluc2VydEJlZm9yZTtcbiAgICB2YXIgb3JpZ2luYWxSZW1vdmVDaGlsZCA9IE9yaWdpbmFsTm9kZS5wcm90b3R5cGUucmVtb3ZlQ2hpbGQ7XG4gICAgdmFyIG9yaWdpbmFsUmVwbGFjZUNoaWxkID0gT3JpZ2luYWxOb2RlLnByb3RvdHlwZS5yZXBsYWNlQ2hpbGQ7XG4gICAgdmFyIGlzSUVPckVkZ2UgPSAvVHJpZGVudHxFZGdlLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICAgIHZhciByZW1vdmVDaGlsZE9yaWdpbmFsSGVscGVyID0gaXNJRU9yRWRnZSA/IGZ1bmN0aW9uKHBhcmVudCwgY2hpbGQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG9yaWdpbmFsUmVtb3ZlQ2hpbGQuY2FsbChwYXJlbnQsIGNoaWxkKTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGlmICghKHBhcmVudCBpbnN0YW5jZW9mIE9yaWdpbmFsRG9jdW1lbnRGcmFnbWVudCkpIHRocm93IGV4O1xuICAgICAgfVxuICAgIH0gOiBmdW5jdGlvbihwYXJlbnQsIGNoaWxkKSB7XG4gICAgICBvcmlnaW5hbFJlbW92ZUNoaWxkLmNhbGwocGFyZW50LCBjaGlsZCk7XG4gICAgfTtcbiAgICBOb2RlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZlbnRUYXJnZXQucHJvdG90eXBlKTtcbiAgICBtaXhpbihOb2RlLnByb3RvdHlwZSwge1xuICAgICAgYXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uKGNoaWxkV3JhcHBlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnNlcnRCZWZvcmUoY2hpbGRXcmFwcGVyLCBudWxsKTtcbiAgICAgIH0sXG4gICAgICBpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uKGNoaWxkV3JhcHBlciwgcmVmV3JhcHBlcikge1xuICAgICAgICBhc3NlcnRJc05vZGVXcmFwcGVyKGNoaWxkV3JhcHBlcik7XG4gICAgICAgIHZhciByZWZOb2RlO1xuICAgICAgICBpZiAocmVmV3JhcHBlcikge1xuICAgICAgICAgIGlmIChpc1dyYXBwZXIocmVmV3JhcHBlcikpIHtcbiAgICAgICAgICAgIHJlZk5vZGUgPSB1bndyYXAocmVmV3JhcHBlcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlZk5vZGUgPSByZWZXcmFwcGVyO1xuICAgICAgICAgICAgcmVmV3JhcHBlciA9IHdyYXAocmVmTm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlZldyYXBwZXIgPSBudWxsO1xuICAgICAgICAgIHJlZk5vZGUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJlZldyYXBwZXIgJiYgYXNzZXJ0KHJlZldyYXBwZXIucGFyZW50Tm9kZSA9PT0gdGhpcyk7XG4gICAgICAgIHZhciBub2RlcztcbiAgICAgICAgdmFyIHByZXZpb3VzTm9kZSA9IHJlZldyYXBwZXIgPyByZWZXcmFwcGVyLnByZXZpb3VzU2libGluZyA6IHRoaXMubGFzdENoaWxkO1xuICAgICAgICB2YXIgdXNlTmF0aXZlID0gIXRoaXMuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKCkgJiYgIWludmFsaWRhdGVQYXJlbnQoY2hpbGRXcmFwcGVyKTtcbiAgICAgICAgaWYgKHVzZU5hdGl2ZSkgbm9kZXMgPSBjb2xsZWN0Tm9kZXNOYXRpdmUoY2hpbGRXcmFwcGVyKTsgZWxzZSBub2RlcyA9IGNvbGxlY3ROb2RlcyhjaGlsZFdyYXBwZXIsIHRoaXMsIHByZXZpb3VzTm9kZSwgcmVmV3JhcHBlcik7XG4gICAgICAgIGlmICh1c2VOYXRpdmUpIHtcbiAgICAgICAgICBlbnN1cmVTYW1lT3duZXJEb2N1bWVudCh0aGlzLCBjaGlsZFdyYXBwZXIpO1xuICAgICAgICAgIGNsZWFyQ2hpbGROb2Rlcyh0aGlzKTtcbiAgICAgICAgICBvcmlnaW5hbEluc2VydEJlZm9yZS5jYWxsKHVuc2FmZVVud3JhcCh0aGlzKSwgdW53cmFwKGNoaWxkV3JhcHBlciksIHJlZk5vZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghcHJldmlvdXNOb2RlKSB0aGlzLmZpcnN0Q2hpbGRfID0gbm9kZXNbMF07XG4gICAgICAgICAgaWYgKCFyZWZXcmFwcGVyKSB7XG4gICAgICAgICAgICB0aGlzLmxhc3RDaGlsZF8gPSBub2Rlc1tub2Rlcy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpcnN0Q2hpbGRfID09PSB1bmRlZmluZWQpIHRoaXMuZmlyc3RDaGlsZF8gPSB0aGlzLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBwYXJlbnROb2RlID0gcmVmTm9kZSA/IHJlZk5vZGUucGFyZW50Tm9kZSA6IHVuc2FmZVVud3JhcCh0aGlzKTtcbiAgICAgICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgb3JpZ2luYWxJbnNlcnRCZWZvcmUuY2FsbChwYXJlbnROb2RlLCB1bndyYXBOb2Rlc0Zvckluc2VydGlvbih0aGlzLCBub2RlcyksIHJlZk5vZGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhZG9wdE5vZGVzSWZOZWVkZWQodGhpcywgbm9kZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbnF1ZXVlTXV0YXRpb24odGhpcywgXCJjaGlsZExpc3RcIiwge1xuICAgICAgICAgIGFkZGVkTm9kZXM6IG5vZGVzLFxuICAgICAgICAgIG5leHRTaWJsaW5nOiByZWZXcmFwcGVyLFxuICAgICAgICAgIHByZXZpb3VzU2libGluZzogcHJldmlvdXNOb2RlXG4gICAgICAgIH0pO1xuICAgICAgICBub2Rlc1dlcmVBZGRlZChub2RlcywgdGhpcyk7XG4gICAgICAgIHJldHVybiBjaGlsZFdyYXBwZXI7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlQ2hpbGQ6IGZ1bmN0aW9uKGNoaWxkV3JhcHBlcikge1xuICAgICAgICBhc3NlcnRJc05vZGVXcmFwcGVyKGNoaWxkV3JhcHBlcik7XG4gICAgICAgIGlmIChjaGlsZFdyYXBwZXIucGFyZW50Tm9kZSAhPT0gdGhpcykge1xuICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgIHZhciBjaGlsZE5vZGVzID0gdGhpcy5jaGlsZE5vZGVzO1xuICAgICAgICAgIGZvciAodmFyIGllQ2hpbGQgPSB0aGlzLmZpcnN0Q2hpbGQ7IGllQ2hpbGQ7IGllQ2hpbGQgPSBpZUNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICBpZiAoaWVDaGlsZCA9PT0gY2hpbGRXcmFwcGVyKSB7XG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdEZvdW5kRXJyb3JcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBjaGlsZE5vZGUgPSB1bndyYXAoY2hpbGRXcmFwcGVyKTtcbiAgICAgICAgdmFyIGNoaWxkV3JhcHBlck5leHRTaWJsaW5nID0gY2hpbGRXcmFwcGVyLm5leHRTaWJsaW5nO1xuICAgICAgICB2YXIgY2hpbGRXcmFwcGVyUHJldmlvdXNTaWJsaW5nID0gY2hpbGRXcmFwcGVyLnByZXZpb3VzU2libGluZztcbiAgICAgICAgaWYgKHRoaXMuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKCkpIHtcbiAgICAgICAgICB2YXIgdGhpc0ZpcnN0Q2hpbGQgPSB0aGlzLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgdmFyIHRoaXNMYXN0Q2hpbGQgPSB0aGlzLmxhc3RDaGlsZDtcbiAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGNoaWxkTm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgIGlmIChwYXJlbnROb2RlKSByZW1vdmVDaGlsZE9yaWdpbmFsSGVscGVyKHBhcmVudE5vZGUsIGNoaWxkTm9kZSk7XG4gICAgICAgICAgaWYgKHRoaXNGaXJzdENoaWxkID09PSBjaGlsZFdyYXBwZXIpIHRoaXMuZmlyc3RDaGlsZF8gPSBjaGlsZFdyYXBwZXJOZXh0U2libGluZztcbiAgICAgICAgICBpZiAodGhpc0xhc3RDaGlsZCA9PT0gY2hpbGRXcmFwcGVyKSB0aGlzLmxhc3RDaGlsZF8gPSBjaGlsZFdyYXBwZXJQcmV2aW91c1NpYmxpbmc7XG4gICAgICAgICAgaWYgKGNoaWxkV3JhcHBlclByZXZpb3VzU2libGluZykgY2hpbGRXcmFwcGVyUHJldmlvdXNTaWJsaW5nLm5leHRTaWJsaW5nXyA9IGNoaWxkV3JhcHBlck5leHRTaWJsaW5nO1xuICAgICAgICAgIGlmIChjaGlsZFdyYXBwZXJOZXh0U2libGluZykge1xuICAgICAgICAgICAgY2hpbGRXcmFwcGVyTmV4dFNpYmxpbmcucHJldmlvdXNTaWJsaW5nXyA9IGNoaWxkV3JhcHBlclByZXZpb3VzU2libGluZztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2hpbGRXcmFwcGVyLnByZXZpb3VzU2libGluZ18gPSBjaGlsZFdyYXBwZXIubmV4dFNpYmxpbmdfID0gY2hpbGRXcmFwcGVyLnBhcmVudE5vZGVfID0gdW5kZWZpbmVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNsZWFyQ2hpbGROb2Rlcyh0aGlzKTtcbiAgICAgICAgICByZW1vdmVDaGlsZE9yaWdpbmFsSGVscGVyKHVuc2FmZVVud3JhcCh0aGlzKSwgY2hpbGROb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXN1cnByZXNzTXV0YXRpb25zKSB7XG4gICAgICAgICAgZW5xdWV1ZU11dGF0aW9uKHRoaXMsIFwiY2hpbGRMaXN0XCIsIHtcbiAgICAgICAgICAgIHJlbW92ZWROb2RlczogY3JlYXRlT25lRWxlbWVudE5vZGVMaXN0KGNoaWxkV3JhcHBlciksXG4gICAgICAgICAgICBuZXh0U2libGluZzogY2hpbGRXcmFwcGVyTmV4dFNpYmxpbmcsXG4gICAgICAgICAgICBwcmV2aW91c1NpYmxpbmc6IGNoaWxkV3JhcHBlclByZXZpb3VzU2libGluZ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJlZ2lzdGVyVHJhbnNpZW50T2JzZXJ2ZXJzKHRoaXMsIGNoaWxkV3JhcHBlcik7XG4gICAgICAgIHJldHVybiBjaGlsZFdyYXBwZXI7XG4gICAgICB9LFxuICAgICAgcmVwbGFjZUNoaWxkOiBmdW5jdGlvbihuZXdDaGlsZFdyYXBwZXIsIG9sZENoaWxkV3JhcHBlcikge1xuICAgICAgICBhc3NlcnRJc05vZGVXcmFwcGVyKG5ld0NoaWxkV3JhcHBlcik7XG4gICAgICAgIHZhciBvbGRDaGlsZE5vZGU7XG4gICAgICAgIGlmIChpc1dyYXBwZXIob2xkQ2hpbGRXcmFwcGVyKSkge1xuICAgICAgICAgIG9sZENoaWxkTm9kZSA9IHVud3JhcChvbGRDaGlsZFdyYXBwZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9sZENoaWxkTm9kZSA9IG9sZENoaWxkV3JhcHBlcjtcbiAgICAgICAgICBvbGRDaGlsZFdyYXBwZXIgPSB3cmFwKG9sZENoaWxkTm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9sZENoaWxkV3JhcHBlci5wYXJlbnROb2RlICE9PSB0aGlzKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90Rm91bmRFcnJvclwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmV4dE5vZGUgPSBvbGRDaGlsZFdyYXBwZXIubmV4dFNpYmxpbmc7XG4gICAgICAgIHZhciBwcmV2aW91c05vZGUgPSBvbGRDaGlsZFdyYXBwZXIucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICB2YXIgbm9kZXM7XG4gICAgICAgIHZhciB1c2VOYXRpdmUgPSAhdGhpcy5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIoKSAmJiAhaW52YWxpZGF0ZVBhcmVudChuZXdDaGlsZFdyYXBwZXIpO1xuICAgICAgICBpZiAodXNlTmF0aXZlKSB7XG4gICAgICAgICAgbm9kZXMgPSBjb2xsZWN0Tm9kZXNOYXRpdmUobmV3Q2hpbGRXcmFwcGVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAobmV4dE5vZGUgPT09IG5ld0NoaWxkV3JhcHBlcikgbmV4dE5vZGUgPSBuZXdDaGlsZFdyYXBwZXIubmV4dFNpYmxpbmc7XG4gICAgICAgICAgbm9kZXMgPSBjb2xsZWN0Tm9kZXMobmV3Q2hpbGRXcmFwcGVyLCB0aGlzLCBwcmV2aW91c05vZGUsIG5leHROb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXVzZU5hdGl2ZSkge1xuICAgICAgICAgIGlmICh0aGlzLmZpcnN0Q2hpbGQgPT09IG9sZENoaWxkV3JhcHBlcikgdGhpcy5maXJzdENoaWxkXyA9IG5vZGVzWzBdO1xuICAgICAgICAgIGlmICh0aGlzLmxhc3RDaGlsZCA9PT0gb2xkQ2hpbGRXcmFwcGVyKSB0aGlzLmxhc3RDaGlsZF8gPSBub2Rlc1tub2Rlcy5sZW5ndGggLSAxXTtcbiAgICAgICAgICBvbGRDaGlsZFdyYXBwZXIucHJldmlvdXNTaWJsaW5nXyA9IG9sZENoaWxkV3JhcHBlci5uZXh0U2libGluZ18gPSBvbGRDaGlsZFdyYXBwZXIucGFyZW50Tm9kZV8gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKG9sZENoaWxkTm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBvcmlnaW5hbFJlcGxhY2VDaGlsZC5jYWxsKG9sZENoaWxkTm9kZS5wYXJlbnROb2RlLCB1bndyYXBOb2Rlc0Zvckluc2VydGlvbih0aGlzLCBub2RlcyksIG9sZENoaWxkTm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVuc3VyZVNhbWVPd25lckRvY3VtZW50KHRoaXMsIG5ld0NoaWxkV3JhcHBlcik7XG4gICAgICAgICAgY2xlYXJDaGlsZE5vZGVzKHRoaXMpO1xuICAgICAgICAgIG9yaWdpbmFsUmVwbGFjZUNoaWxkLmNhbGwodW5zYWZlVW53cmFwKHRoaXMpLCB1bndyYXAobmV3Q2hpbGRXcmFwcGVyKSwgb2xkQ2hpbGROb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBlbnF1ZXVlTXV0YXRpb24odGhpcywgXCJjaGlsZExpc3RcIiwge1xuICAgICAgICAgIGFkZGVkTm9kZXM6IG5vZGVzLFxuICAgICAgICAgIHJlbW92ZWROb2RlczogY3JlYXRlT25lRWxlbWVudE5vZGVMaXN0KG9sZENoaWxkV3JhcHBlciksXG4gICAgICAgICAgbmV4dFNpYmxpbmc6IG5leHROb2RlLFxuICAgICAgICAgIHByZXZpb3VzU2libGluZzogcHJldmlvdXNOb2RlXG4gICAgICAgIH0pO1xuICAgICAgICBub2RlV2FzUmVtb3ZlZChvbGRDaGlsZFdyYXBwZXIpO1xuICAgICAgICBub2Rlc1dlcmVBZGRlZChub2RlcywgdGhpcyk7XG4gICAgICAgIHJldHVybiBvbGRDaGlsZFdyYXBwZXI7XG4gICAgICB9LFxuICAgICAgbm9kZUlzSW5zZXJ0ZWRfOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgPSB0aGlzLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgY2hpbGQubm9kZUlzSW5zZXJ0ZWRfKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBoYXNDaGlsZE5vZGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlyc3RDaGlsZCAhPT0gbnVsbDtcbiAgICAgIH0sXG4gICAgICBnZXQgcGFyZW50Tm9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50Tm9kZV8gIT09IHVuZGVmaW5lZCA/IHRoaXMucGFyZW50Tm9kZV8gOiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5wYXJlbnROb2RlKTtcbiAgICAgIH0sXG4gICAgICBnZXQgZmlyc3RDaGlsZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlyc3RDaGlsZF8gIT09IHVuZGVmaW5lZCA/IHRoaXMuZmlyc3RDaGlsZF8gOiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5maXJzdENoaWxkKTtcbiAgICAgIH0sXG4gICAgICBnZXQgbGFzdENoaWxkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXN0Q2hpbGRfICE9PSB1bmRlZmluZWQgPyB0aGlzLmxhc3RDaGlsZF8gOiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5sYXN0Q2hpbGQpO1xuICAgICAgfSxcbiAgICAgIGdldCBuZXh0U2libGluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dFNpYmxpbmdfICE9PSB1bmRlZmluZWQgPyB0aGlzLm5leHRTaWJsaW5nXyA6IHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLm5leHRTaWJsaW5nKTtcbiAgICAgIH0sXG4gICAgICBnZXQgcHJldmlvdXNTaWJsaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wcmV2aW91c1NpYmxpbmdfICE9PSB1bmRlZmluZWQgPyB0aGlzLnByZXZpb3VzU2libGluZ18gOiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5wcmV2aW91c1NpYmxpbmcpO1xuICAgICAgfSxcbiAgICAgIGdldCBwYXJlbnRFbGVtZW50KCkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICAgICAgd2hpbGUgKHAgJiYgcC5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICBwID0gcC5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwO1xuICAgICAgfSxcbiAgICAgIGdldCB0ZXh0Q29udGVudCgpIHtcbiAgICAgICAgdmFyIHMgPSBcIlwiO1xuICAgICAgICBmb3IgKHZhciBjaGlsZCA9IHRoaXMuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICBpZiAoY2hpbGQubm9kZVR5cGUgIT0gTm9kZS5DT01NRU5UX05PREUpIHtcbiAgICAgICAgICAgIHMgKz0gY2hpbGQudGV4dENvbnRlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzO1xuICAgICAgfSxcbiAgICAgIHNldCB0ZXh0Q29udGVudCh0ZXh0Q29udGVudCkge1xuICAgICAgICBpZiAodGV4dENvbnRlbnQgPT0gbnVsbCkgdGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICB2YXIgcmVtb3ZlZE5vZGVzID0gc25hcHNob3ROb2RlTGlzdCh0aGlzLmNoaWxkTm9kZXMpO1xuICAgICAgICBpZiAodGhpcy5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIoKSkge1xuICAgICAgICAgIHJlbW92ZUFsbENoaWxkTm9kZXModGhpcyk7XG4gICAgICAgICAgaWYgKHRleHRDb250ZW50ICE9PSBcIlwiKSB7XG4gICAgICAgICAgICB2YXIgdGV4dE5vZGUgPSB1bnNhZmVVbndyYXAodGhpcykub3duZXJEb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0Q29udGVudCk7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRleHROb2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2xlYXJDaGlsZE5vZGVzKHRoaXMpO1xuICAgICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS50ZXh0Q29udGVudCA9IHRleHRDb250ZW50O1xuICAgICAgICB9XG4gICAgICAgIHZhciBhZGRlZE5vZGVzID0gc25hcHNob3ROb2RlTGlzdCh0aGlzLmNoaWxkTm9kZXMpO1xuICAgICAgICBlbnF1ZXVlTXV0YXRpb24odGhpcywgXCJjaGlsZExpc3RcIiwge1xuICAgICAgICAgIGFkZGVkTm9kZXM6IGFkZGVkTm9kZXMsXG4gICAgICAgICAgcmVtb3ZlZE5vZGVzOiByZW1vdmVkTm9kZXNcbiAgICAgICAgfSk7XG4gICAgICAgIG5vZGVzV2VyZVJlbW92ZWQocmVtb3ZlZE5vZGVzKTtcbiAgICAgICAgbm9kZXNXZXJlQWRkZWQoYWRkZWROb2RlcywgdGhpcyk7XG4gICAgICB9LFxuICAgICAgZ2V0IGNoaWxkTm9kZXMoKSB7XG4gICAgICAgIHZhciB3cmFwcGVyTGlzdCA9IG5ldyBOb2RlTGlzdCgpO1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIGZvciAodmFyIGNoaWxkID0gdGhpcy5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgIHdyYXBwZXJMaXN0W2krK10gPSBjaGlsZDtcbiAgICAgICAgfVxuICAgICAgICB3cmFwcGVyTGlzdC5sZW5ndGggPSBpO1xuICAgICAgICByZXR1cm4gd3JhcHBlckxpc3Q7XG4gICAgICB9LFxuICAgICAgY2xvbmVOb2RlOiBmdW5jdGlvbihkZWVwKSB7XG4gICAgICAgIHJldHVybiBjbG9uZU5vZGUodGhpcywgZGVlcCk7XG4gICAgICB9LFxuICAgICAgY29udGFpbnM6IGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIHJldHVybiBjb250YWlucyh0aGlzLCB3cmFwSWZOZWVkZWQoY2hpbGQpKTtcbiAgICAgIH0sXG4gICAgICBjb21wYXJlRG9jdW1lbnRQb3NpdGlvbjogZnVuY3Rpb24ob3RoZXJOb2RlKSB7XG4gICAgICAgIHJldHVybiBvcmlnaW5hbENvbXBhcmVEb2N1bWVudFBvc2l0aW9uLmNhbGwodW5zYWZlVW53cmFwKHRoaXMpLCB1bndyYXBJZk5lZWRlZChvdGhlck5vZGUpKTtcbiAgICAgIH0sXG4gICAgICBpc0VxdWFsTm9kZTogZnVuY3Rpb24ob3RoZXJOb2RlKSB7XG4gICAgICAgIHJldHVybiBvcmlnaW5hbElzRXF1YWxOb2RlLmNhbGwodW5zYWZlVW53cmFwKHRoaXMpLCB1bndyYXBJZk5lZWRlZChvdGhlck5vZGUpKTtcbiAgICAgIH0sXG4gICAgICBub3JtYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZXMgPSBzbmFwc2hvdE5vZGVMaXN0KHRoaXMuY2hpbGROb2Rlcyk7XG4gICAgICAgIHZhciByZW1Ob2RlcyA9IFtdO1xuICAgICAgICB2YXIgcyA9IFwiXCI7XG4gICAgICAgIHZhciBtb2ROb2RlO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbjsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbiA9IG5vZGVzW2ldO1xuICAgICAgICAgIGlmIChuLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgICAgICAgaWYgKCFtb2ROb2RlICYmICFuLmRhdGEubGVuZ3RoKSB0aGlzLnJlbW92ZUNoaWxkKG4pOyBlbHNlIGlmICghbW9kTm9kZSkgbW9kTm9kZSA9IG47IGVsc2Uge1xuICAgICAgICAgICAgICBzICs9IG4uZGF0YTtcbiAgICAgICAgICAgICAgcmVtTm9kZXMucHVzaChuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG1vZE5vZGUgJiYgcmVtTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG1vZE5vZGUuZGF0YSArPSBzO1xuICAgICAgICAgICAgICBjbGVhbnVwTm9kZXMocmVtTm9kZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVtTm9kZXMgPSBbXTtcbiAgICAgICAgICAgIHMgPSBcIlwiO1xuICAgICAgICAgICAgbW9kTm9kZSA9IG51bGw7XG4gICAgICAgICAgICBpZiAobi5jaGlsZE5vZGVzLmxlbmd0aCkgbi5ub3JtYWxpemUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vZE5vZGUgJiYgcmVtTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgbW9kTm9kZS5kYXRhICs9IHM7XG4gICAgICAgICAgY2xlYW51cE5vZGVzKHJlbU5vZGVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGRlZmluZVdyYXBHZXR0ZXIoTm9kZSwgXCJvd25lckRvY3VtZW50XCIpO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbE5vZGUsIE5vZGUsIGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSk7XG4gICAgZGVsZXRlIE5vZGUucHJvdG90eXBlLnF1ZXJ5U2VsZWN0b3I7XG4gICAgZGVsZXRlIE5vZGUucHJvdG90eXBlLnF1ZXJ5U2VsZWN0b3JBbGw7XG4gICAgTm9kZS5wcm90b3R5cGUgPSBtaXhpbihPYmplY3QuY3JlYXRlKEV2ZW50VGFyZ2V0LnByb3RvdHlwZSksIE5vZGUucHJvdG90eXBlKTtcbiAgICBzY29wZS5jbG9uZU5vZGUgPSBjbG9uZU5vZGU7XG4gICAgc2NvcGUubm9kZVdhc0FkZGVkID0gbm9kZVdhc0FkZGVkO1xuICAgIHNjb3BlLm5vZGVXYXNSZW1vdmVkID0gbm9kZVdhc1JlbW92ZWQ7XG4gICAgc2NvcGUubm9kZXNXZXJlQWRkZWQgPSBub2Rlc1dlcmVBZGRlZDtcbiAgICBzY29wZS5ub2Rlc1dlcmVSZW1vdmVkID0gbm9kZXNXZXJlUmVtb3ZlZDtcbiAgICBzY29wZS5vcmlnaW5hbEluc2VydEJlZm9yZSA9IG9yaWdpbmFsSW5zZXJ0QmVmb3JlO1xuICAgIHNjb3BlLm9yaWdpbmFsUmVtb3ZlQ2hpbGQgPSBvcmlnaW5hbFJlbW92ZUNoaWxkO1xuICAgIHNjb3BlLnNuYXBzaG90Tm9kZUxpc3QgPSBzbmFwc2hvdE5vZGVMaXN0O1xuICAgIHNjb3BlLndyYXBwZXJzLk5vZGUgPSBOb2RlO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTENvbGxlY3Rpb24gPSBzY29wZS53cmFwcGVycy5IVE1MQ29sbGVjdGlvbjtcbiAgICB2YXIgTm9kZUxpc3QgPSBzY29wZS53cmFwcGVycy5Ob2RlTGlzdDtcbiAgICB2YXIgZ2V0VHJlZVNjb3BlID0gc2NvcGUuZ2V0VHJlZVNjb3BlO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBvcmlnaW5hbERvY3VtZW50UXVlcnlTZWxlY3RvciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I7XG4gICAgdmFyIG9yaWdpbmFsRWxlbWVudFF1ZXJ5U2VsZWN0b3IgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucXVlcnlTZWxlY3RvcjtcbiAgICB2YXIgb3JpZ2luYWxEb2N1bWVudFF1ZXJ5U2VsZWN0b3JBbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsO1xuICAgIHZhciBvcmlnaW5hbEVsZW1lbnRRdWVyeVNlbGVjdG9yQWxsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGw7XG4gICAgdmFyIG9yaWdpbmFsRG9jdW1lbnRHZXRFbGVtZW50c0J5VGFnTmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lO1xuICAgIHZhciBvcmlnaW5hbEVsZW1lbnRHZXRFbGVtZW50c0J5VGFnTmFtZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZTtcbiAgICB2YXIgb3JpZ2luYWxEb2N1bWVudEdldEVsZW1lbnRzQnlUYWdOYW1lTlMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZU5TO1xuICAgIHZhciBvcmlnaW5hbEVsZW1lbnRHZXRFbGVtZW50c0J5VGFnTmFtZU5TID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lTlM7XG4gICAgdmFyIE9yaWdpbmFsRWxlbWVudCA9IHdpbmRvdy5FbGVtZW50O1xuICAgIHZhciBPcmlnaW5hbERvY3VtZW50ID0gd2luZG93LkhUTUxEb2N1bWVudCB8fCB3aW5kb3cuRG9jdW1lbnQ7XG4gICAgZnVuY3Rpb24gZmlsdGVyTm9kZUxpc3QobGlzdCwgaW5kZXgsIHJlc3VsdCwgZGVlcCkge1xuICAgICAgdmFyIHdyYXBwZWRJdGVtID0gbnVsbDtcbiAgICAgIHZhciByb290ID0gbnVsbDtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHdyYXBwZWRJdGVtID0gd3JhcChsaXN0W2ldKTtcbiAgICAgICAgaWYgKCFkZWVwICYmIChyb290ID0gZ2V0VHJlZVNjb3BlKHdyYXBwZWRJdGVtKS5yb290KSkge1xuICAgICAgICAgIGlmIChyb290IGluc3RhbmNlb2Ygc2NvcGUud3JhcHBlcnMuU2hhZG93Um9vdCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlc3VsdFtpbmRleCsrXSA9IHdyYXBwZWRJdGVtO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgICBmdW5jdGlvbiBzaGltU2VsZWN0b3Ioc2VsZWN0b3IpIHtcbiAgICAgIHJldHVybiBTdHJpbmcoc2VsZWN0b3IpLnJlcGxhY2UoL1xcL2RlZXBcXC98OjpzaGFkb3d8Pj4+L2csIFwiIFwiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2hpbU1hdGNoZXNTZWxlY3RvcihzZWxlY3Rvcikge1xuICAgICAgcmV0dXJuIFN0cmluZyhzZWxlY3RvcikucmVwbGFjZSgvOmhvc3RcXCgoW15cXHNdKylcXCkvZywgXCIkMVwiKS5yZXBsYWNlKC8oW15cXHNdKTpob3N0L2csIFwiJDFcIikucmVwbGFjZShcIjpob3N0XCIsIFwiKlwiKS5yZXBsYWNlKC9cXF58XFwvc2hhZG93XFwvfFxcL3NoYWRvdy1kZWVwXFwvfDo6c2hhZG93fFxcL2RlZXBcXC98Ojpjb250ZW50fD4+Pi9nLCBcIiBcIik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZpbmRPbmUobm9kZSwgc2VsZWN0b3IpIHtcbiAgICAgIHZhciBtLCBlbCA9IG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICB3aGlsZSAoZWwpIHtcbiAgICAgICAgaWYgKGVsLm1hdGNoZXMoc2VsZWN0b3IpKSByZXR1cm4gZWw7XG4gICAgICAgIG0gPSBmaW5kT25lKGVsLCBzZWxlY3Rvcik7XG4gICAgICAgIGlmIChtKSByZXR1cm4gbTtcbiAgICAgICAgZWwgPSBlbC5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gbWF0Y2hlc1NlbGVjdG9yKGVsLCBzZWxlY3Rvcikge1xuICAgICAgcmV0dXJuIGVsLm1hdGNoZXMoc2VsZWN0b3IpO1xuICAgIH1cbiAgICB2YXIgWEhUTUxfTlMgPSBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIjtcbiAgICBmdW5jdGlvbiBtYXRjaGVzVGFnTmFtZShlbCwgbG9jYWxOYW1lLCBsb2NhbE5hbWVMb3dlckNhc2UpIHtcbiAgICAgIHZhciBsbiA9IGVsLmxvY2FsTmFtZTtcbiAgICAgIHJldHVybiBsbiA9PT0gbG9jYWxOYW1lIHx8IGxuID09PSBsb2NhbE5hbWVMb3dlckNhc2UgJiYgZWwubmFtZXNwYWNlVVJJID09PSBYSFRNTF9OUztcbiAgICB9XG4gICAgZnVuY3Rpb24gbWF0Y2hlc0V2ZXJ5VGhpbmcoKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbWF0Y2hlc0xvY2FsTmFtZU9ubHkoZWwsIG5zLCBsb2NhbE5hbWUpIHtcbiAgICAgIHJldHVybiBlbC5sb2NhbE5hbWUgPT09IGxvY2FsTmFtZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbWF0Y2hlc05hbWVTcGFjZShlbCwgbnMpIHtcbiAgICAgIHJldHVybiBlbC5uYW1lc3BhY2VVUkkgPT09IG5zO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtYXRjaGVzTG9jYWxOYW1lTlMoZWwsIG5zLCBsb2NhbE5hbWUpIHtcbiAgICAgIHJldHVybiBlbC5uYW1lc3BhY2VVUkkgPT09IG5zICYmIGVsLmxvY2FsTmFtZSA9PT0gbG9jYWxOYW1lO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmaW5kRWxlbWVudHMobm9kZSwgaW5kZXgsIHJlc3VsdCwgcCwgYXJnMCwgYXJnMSkge1xuICAgICAgdmFyIGVsID0gbm9kZS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgIHdoaWxlIChlbCkge1xuICAgICAgICBpZiAocChlbCwgYXJnMCwgYXJnMSkpIHJlc3VsdFtpbmRleCsrXSA9IGVsO1xuICAgICAgICBpbmRleCA9IGZpbmRFbGVtZW50cyhlbCwgaW5kZXgsIHJlc3VsdCwgcCwgYXJnMCwgYXJnMSk7XG4gICAgICAgIGVsID0gZWwubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgICBmdW5jdGlvbiBxdWVyeVNlbGVjdG9yQWxsRmlsdGVyZWQocCwgaW5kZXgsIHJlc3VsdCwgc2VsZWN0b3IsIGRlZXApIHtcbiAgICAgIHZhciB0YXJnZXQgPSB1bnNhZmVVbndyYXAodGhpcyk7XG4gICAgICB2YXIgbGlzdDtcbiAgICAgIHZhciByb290ID0gZ2V0VHJlZVNjb3BlKHRoaXMpLnJvb3Q7XG4gICAgICBpZiAocm9vdCBpbnN0YW5jZW9mIHNjb3BlLndyYXBwZXJzLlNoYWRvd1Jvb3QpIHtcbiAgICAgICAgcmV0dXJuIGZpbmRFbGVtZW50cyh0aGlzLCBpbmRleCwgcmVzdWx0LCBwLCBzZWxlY3RvciwgbnVsbCk7XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE9yaWdpbmFsRWxlbWVudCkge1xuICAgICAgICBsaXN0ID0gb3JpZ2luYWxFbGVtZW50UXVlcnlTZWxlY3RvckFsbC5jYWxsKHRhcmdldCwgc2VsZWN0b3IpO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBPcmlnaW5hbERvY3VtZW50KSB7XG4gICAgICAgIGxpc3QgPSBvcmlnaW5hbERvY3VtZW50UXVlcnlTZWxlY3RvckFsbC5jYWxsKHRhcmdldCwgc2VsZWN0b3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZpbmRFbGVtZW50cyh0aGlzLCBpbmRleCwgcmVzdWx0LCBwLCBzZWxlY3RvciwgbnVsbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmlsdGVyTm9kZUxpc3QobGlzdCwgaW5kZXgsIHJlc3VsdCwgZGVlcCk7XG4gICAgfVxuICAgIHZhciBTZWxlY3RvcnNJbnRlcmZhY2UgPSB7XG4gICAgICBxdWVyeVNlbGVjdG9yOiBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgICAgICB2YXIgc2hpbW1lZCA9IHNoaW1TZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgIHZhciBkZWVwID0gc2hpbW1lZCAhPT0gc2VsZWN0b3I7XG4gICAgICAgIHNlbGVjdG9yID0gc2hpbW1lZDtcbiAgICAgICAgdmFyIHRhcmdldCA9IHVuc2FmZVVud3JhcCh0aGlzKTtcbiAgICAgICAgdmFyIHdyYXBwZWRJdGVtO1xuICAgICAgICB2YXIgcm9vdCA9IGdldFRyZWVTY29wZSh0aGlzKS5yb290O1xuICAgICAgICBpZiAocm9vdCBpbnN0YW5jZW9mIHNjb3BlLndyYXBwZXJzLlNoYWRvd1Jvb3QpIHtcbiAgICAgICAgICByZXR1cm4gZmluZE9uZSh0aGlzLCBzZWxlY3Rvcik7XG4gICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgT3JpZ2luYWxFbGVtZW50KSB7XG4gICAgICAgICAgd3JhcHBlZEl0ZW0gPSB3cmFwKG9yaWdpbmFsRWxlbWVudFF1ZXJ5U2VsZWN0b3IuY2FsbCh0YXJnZXQsIHNlbGVjdG9yKSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgT3JpZ2luYWxEb2N1bWVudCkge1xuICAgICAgICAgIHdyYXBwZWRJdGVtID0gd3JhcChvcmlnaW5hbERvY3VtZW50UXVlcnlTZWxlY3Rvci5jYWxsKHRhcmdldCwgc2VsZWN0b3IpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmluZE9uZSh0aGlzLCBzZWxlY3Rvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3cmFwcGVkSXRlbSkge1xuICAgICAgICAgIHJldHVybiB3cmFwcGVkSXRlbTtcbiAgICAgICAgfSBlbHNlIGlmICghZGVlcCAmJiAocm9vdCA9IGdldFRyZWVTY29wZSh3cmFwcGVkSXRlbSkucm9vdCkpIHtcbiAgICAgICAgICBpZiAocm9vdCBpbnN0YW5jZW9mIHNjb3BlLndyYXBwZXJzLlNoYWRvd1Jvb3QpIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kT25lKHRoaXMsIHNlbGVjdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdyYXBwZWRJdGVtO1xuICAgICAgfSxcbiAgICAgIHF1ZXJ5U2VsZWN0b3JBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBzaGltbWVkID0gc2hpbVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgdmFyIGRlZXAgPSBzaGltbWVkICE9PSBzZWxlY3RvcjtcbiAgICAgICAgc2VsZWN0b3IgPSBzaGltbWVkO1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IE5vZGVMaXN0KCk7XG4gICAgICAgIHJlc3VsdC5sZW5ndGggPSBxdWVyeVNlbGVjdG9yQWxsRmlsdGVyZWQuY2FsbCh0aGlzLCBtYXRjaGVzU2VsZWN0b3IsIDAsIHJlc3VsdCwgc2VsZWN0b3IsIGRlZXApO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIE1hdGNoZXNJbnRlcmZhY2UgPSB7XG4gICAgICBtYXRjaGVzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgICAgICBzZWxlY3RvciA9IHNoaW1NYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICByZXR1cm4gc2NvcGUub3JpZ2luYWxNYXRjaGVzLmNhbGwodW5zYWZlVW53cmFwKHRoaXMpLCBzZWxlY3Rvcik7XG4gICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBnZXRFbGVtZW50c0J5VGFnTmFtZUZpbHRlcmVkKHAsIGluZGV4LCByZXN1bHQsIGxvY2FsTmFtZSwgbG93ZXJjYXNlKSB7XG4gICAgICB2YXIgdGFyZ2V0ID0gdW5zYWZlVW53cmFwKHRoaXMpO1xuICAgICAgdmFyIGxpc3Q7XG4gICAgICB2YXIgcm9vdCA9IGdldFRyZWVTY29wZSh0aGlzKS5yb290O1xuICAgICAgaWYgKHJvb3QgaW5zdGFuY2VvZiBzY29wZS53cmFwcGVycy5TaGFkb3dSb290KSB7XG4gICAgICAgIHJldHVybiBmaW5kRWxlbWVudHModGhpcywgaW5kZXgsIHJlc3VsdCwgcCwgbG9jYWxOYW1lLCBsb3dlcmNhc2UpO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBPcmlnaW5hbEVsZW1lbnQpIHtcbiAgICAgICAgbGlzdCA9IG9yaWdpbmFsRWxlbWVudEdldEVsZW1lbnRzQnlUYWdOYW1lLmNhbGwodGFyZ2V0LCBsb2NhbE5hbWUsIGxvd2VyY2FzZSk7XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE9yaWdpbmFsRG9jdW1lbnQpIHtcbiAgICAgICAgbGlzdCA9IG9yaWdpbmFsRG9jdW1lbnRHZXRFbGVtZW50c0J5VGFnTmFtZS5jYWxsKHRhcmdldCwgbG9jYWxOYW1lLCBsb3dlcmNhc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZpbmRFbGVtZW50cyh0aGlzLCBpbmRleCwgcmVzdWx0LCBwLCBsb2NhbE5hbWUsIGxvd2VyY2FzZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmlsdGVyTm9kZUxpc3QobGlzdCwgaW5kZXgsIHJlc3VsdCwgZmFsc2UpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRFbGVtZW50c0J5VGFnTmFtZU5TRmlsdGVyZWQocCwgaW5kZXgsIHJlc3VsdCwgbnMsIGxvY2FsTmFtZSkge1xuICAgICAgdmFyIHRhcmdldCA9IHVuc2FmZVVud3JhcCh0aGlzKTtcbiAgICAgIHZhciBsaXN0O1xuICAgICAgdmFyIHJvb3QgPSBnZXRUcmVlU2NvcGUodGhpcykucm9vdDtcbiAgICAgIGlmIChyb290IGluc3RhbmNlb2Ygc2NvcGUud3JhcHBlcnMuU2hhZG93Um9vdCkge1xuICAgICAgICByZXR1cm4gZmluZEVsZW1lbnRzKHRoaXMsIGluZGV4LCByZXN1bHQsIHAsIG5zLCBsb2NhbE5hbWUpO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBPcmlnaW5hbEVsZW1lbnQpIHtcbiAgICAgICAgbGlzdCA9IG9yaWdpbmFsRWxlbWVudEdldEVsZW1lbnRzQnlUYWdOYW1lTlMuY2FsbCh0YXJnZXQsIG5zLCBsb2NhbE5hbWUpO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBPcmlnaW5hbERvY3VtZW50KSB7XG4gICAgICAgIGxpc3QgPSBvcmlnaW5hbERvY3VtZW50R2V0RWxlbWVudHNCeVRhZ05hbWVOUy5jYWxsKHRhcmdldCwgbnMsIGxvY2FsTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmluZEVsZW1lbnRzKHRoaXMsIGluZGV4LCByZXN1bHQsIHAsIG5zLCBsb2NhbE5hbWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbHRlck5vZGVMaXN0KGxpc3QsIGluZGV4LCByZXN1bHQsIGZhbHNlKTtcbiAgICB9XG4gICAgdmFyIEdldEVsZW1lbnRzQnlJbnRlcmZhY2UgPSB7XG4gICAgICBnZXRFbGVtZW50c0J5VGFnTmFtZTogZnVuY3Rpb24obG9jYWxOYW1lKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBuZXcgSFRNTENvbGxlY3Rpb24oKTtcbiAgICAgICAgdmFyIG1hdGNoID0gbG9jYWxOYW1lID09PSBcIipcIiA/IG1hdGNoZXNFdmVyeVRoaW5nIDogbWF0Y2hlc1RhZ05hbWU7XG4gICAgICAgIHJlc3VsdC5sZW5ndGggPSBnZXRFbGVtZW50c0J5VGFnTmFtZUZpbHRlcmVkLmNhbGwodGhpcywgbWF0Y2gsIDAsIHJlc3VsdCwgbG9jYWxOYW1lLCBsb2NhbE5hbWUudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LFxuICAgICAgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZTogZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuXCIgKyBjbGFzc05hbWUpO1xuICAgICAgfSxcbiAgICAgIGdldEVsZW1lbnRzQnlUYWdOYW1lTlM6IGZ1bmN0aW9uKG5zLCBsb2NhbE5hbWUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBIVE1MQ29sbGVjdGlvbigpO1xuICAgICAgICB2YXIgbWF0Y2ggPSBudWxsO1xuICAgICAgICBpZiAobnMgPT09IFwiKlwiKSB7XG4gICAgICAgICAgbWF0Y2ggPSBsb2NhbE5hbWUgPT09IFwiKlwiID8gbWF0Y2hlc0V2ZXJ5VGhpbmcgOiBtYXRjaGVzTG9jYWxOYW1lT25seTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYXRjaCA9IGxvY2FsTmFtZSA9PT0gXCIqXCIgPyBtYXRjaGVzTmFtZVNwYWNlIDogbWF0Y2hlc0xvY2FsTmFtZU5TO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdC5sZW5ndGggPSBnZXRFbGVtZW50c0J5VGFnTmFtZU5TRmlsdGVyZWQuY2FsbCh0aGlzLCBtYXRjaCwgMCwgcmVzdWx0LCBucyB8fCBudWxsLCBsb2NhbE5hbWUpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH07XG4gICAgc2NvcGUuR2V0RWxlbWVudHNCeUludGVyZmFjZSA9IEdldEVsZW1lbnRzQnlJbnRlcmZhY2U7XG4gICAgc2NvcGUuU2VsZWN0b3JzSW50ZXJmYWNlID0gU2VsZWN0b3JzSW50ZXJmYWNlO1xuICAgIHNjb3BlLk1hdGNoZXNJbnRlcmZhY2UgPSBNYXRjaGVzSW50ZXJmYWNlO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgTm9kZUxpc3QgPSBzY29wZS53cmFwcGVycy5Ob2RlTGlzdDtcbiAgICBmdW5jdGlvbiBmb3J3YXJkRWxlbWVudChub2RlKSB7XG4gICAgICB3aGlsZSAobm9kZSAmJiBub2RlLm5vZGVUeXBlICE9PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBub2RlID0gbm9kZS5uZXh0U2libGluZztcbiAgICAgIH1cbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBiYWNrd2FyZHNFbGVtZW50KG5vZGUpIHtcbiAgICAgIHdoaWxlIChub2RlICYmIG5vZGUubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIG5vZGUgPSBub2RlLnByZXZpb3VzU2libGluZztcbiAgICAgIH1cbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgICB2YXIgUGFyZW50Tm9kZUludGVyZmFjZSA9IHtcbiAgICAgIGdldCBmaXJzdEVsZW1lbnRDaGlsZCgpIHtcbiAgICAgICAgcmV0dXJuIGZvcndhcmRFbGVtZW50KHRoaXMuZmlyc3RDaGlsZCk7XG4gICAgICB9LFxuICAgICAgZ2V0IGxhc3RFbGVtZW50Q2hpbGQoKSB7XG4gICAgICAgIHJldHVybiBiYWNrd2FyZHNFbGVtZW50KHRoaXMubGFzdENoaWxkKTtcbiAgICAgIH0sXG4gICAgICBnZXQgY2hpbGRFbGVtZW50Q291bnQoKSB7XG4gICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgIGZvciAodmFyIGNoaWxkID0gdGhpcy5maXJzdEVsZW1lbnRDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dEVsZW1lbnRTaWJsaW5nKSB7XG4gICAgICAgICAgY291bnQrKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY291bnQ7XG4gICAgICB9LFxuICAgICAgZ2V0IGNoaWxkcmVuKCkge1xuICAgICAgICB2YXIgd3JhcHBlckxpc3QgPSBuZXcgTm9kZUxpc3QoKTtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICBmb3IgKHZhciBjaGlsZCA9IHRoaXMuZmlyc3RFbGVtZW50Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRFbGVtZW50U2libGluZykge1xuICAgICAgICAgIHdyYXBwZXJMaXN0W2krK10gPSBjaGlsZDtcbiAgICAgICAgfVxuICAgICAgICB3cmFwcGVyTGlzdC5sZW5ndGggPSBpO1xuICAgICAgICByZXR1cm4gd3JhcHBlckxpc3Q7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgICAgIGlmIChwKSBwLnJlbW92ZUNoaWxkKHRoaXMpO1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIENoaWxkTm9kZUludGVyZmFjZSA9IHtcbiAgICAgIGdldCBuZXh0RWxlbWVudFNpYmxpbmcoKSB7XG4gICAgICAgIHJldHVybiBmb3J3YXJkRWxlbWVudCh0aGlzLm5leHRTaWJsaW5nKTtcbiAgICAgIH0sXG4gICAgICBnZXQgcHJldmlvdXNFbGVtZW50U2libGluZygpIHtcbiAgICAgICAgcmV0dXJuIGJhY2t3YXJkc0VsZW1lbnQodGhpcy5wcmV2aW91c1NpYmxpbmcpO1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIE5vbkVsZW1lbnRQYXJlbnROb2RlSW50ZXJmYWNlID0ge1xuICAgICAgZ2V0RWxlbWVudEJ5SWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGlmICgvWyBcXHRcXG5cXHJcXGZdLy50ZXN0KGlkKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIicgKyBpZCArICdcIl0nKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHNjb3BlLkNoaWxkTm9kZUludGVyZmFjZSA9IENoaWxkTm9kZUludGVyZmFjZTtcbiAgICBzY29wZS5Ob25FbGVtZW50UGFyZW50Tm9kZUludGVyZmFjZSA9IE5vbkVsZW1lbnRQYXJlbnROb2RlSW50ZXJmYWNlO1xuICAgIHNjb3BlLlBhcmVudE5vZGVJbnRlcmZhY2UgPSBQYXJlbnROb2RlSW50ZXJmYWNlO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgQ2hpbGROb2RlSW50ZXJmYWNlID0gc2NvcGUuQ2hpbGROb2RlSW50ZXJmYWNlO1xuICAgIHZhciBOb2RlID0gc2NvcGUud3JhcHBlcnMuTm9kZTtcbiAgICB2YXIgZW5xdWV1ZU11dGF0aW9uID0gc2NvcGUuZW5xdWV1ZU11dGF0aW9uO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxDaGFyYWN0ZXJEYXRhID0gd2luZG93LkNoYXJhY3RlckRhdGE7XG4gICAgZnVuY3Rpb24gQ2hhcmFjdGVyRGF0YShub2RlKSB7XG4gICAgICBOb2RlLmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIENoYXJhY3RlckRhdGEucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShOb2RlLnByb3RvdHlwZSk7XG4gICAgbWl4aW4oQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUsIHtcbiAgICAgIGdldCBub2RlVmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGE7XG4gICAgICB9LFxuICAgICAgc2V0IG5vZGVWYWx1ZShkYXRhKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICB9LFxuICAgICAgZ2V0IHRleHRDb250ZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhO1xuICAgICAgfSxcbiAgICAgIHNldCB0ZXh0Q29udGVudCh2YWx1ZSkge1xuICAgICAgICB0aGlzLmRhdGEgPSB2YWx1ZTtcbiAgICAgIH0sXG4gICAgICBnZXQgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5kYXRhO1xuICAgICAgfSxcbiAgICAgIHNldCBkYXRhKHZhbHVlKSB7XG4gICAgICAgIHZhciBvbGRWYWx1ZSA9IHVuc2FmZVVud3JhcCh0aGlzKS5kYXRhO1xuICAgICAgICBlbnF1ZXVlTXV0YXRpb24odGhpcywgXCJjaGFyYWN0ZXJEYXRhXCIsIHtcbiAgICAgICAgICBvbGRWYWx1ZTogb2xkVmFsdWVcbiAgICAgICAgfSk7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5kYXRhID0gdmFsdWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbWl4aW4oQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUsIENoaWxkTm9kZUludGVyZmFjZSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsQ2hhcmFjdGVyRGF0YSwgQ2hhcmFjdGVyRGF0YSwgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLkNoYXJhY3RlckRhdGEgPSBDaGFyYWN0ZXJEYXRhO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgQ2hhcmFjdGVyRGF0YSA9IHNjb3BlLndyYXBwZXJzLkNoYXJhY3RlckRhdGE7XG4gICAgdmFyIGVucXVldWVNdXRhdGlvbiA9IHNjb3BlLmVucXVldWVNdXRhdGlvbjtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIGZ1bmN0aW9uIHRvVUludDMyKHgpIHtcbiAgICAgIHJldHVybiB4ID4+PiAwO1xuICAgIH1cbiAgICB2YXIgT3JpZ2luYWxUZXh0ID0gd2luZG93LlRleHQ7XG4gICAgZnVuY3Rpb24gVGV4dChub2RlKSB7XG4gICAgICBDaGFyYWN0ZXJEYXRhLmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIFRleHQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDaGFyYWN0ZXJEYXRhLnByb3RvdHlwZSk7XG4gICAgbWl4aW4oVGV4dC5wcm90b3R5cGUsIHtcbiAgICAgIHNwbGl0VGV4dDogZnVuY3Rpb24ob2Zmc2V0KSB7XG4gICAgICAgIG9mZnNldCA9IHRvVUludDMyKG9mZnNldCk7XG4gICAgICAgIHZhciBzID0gdGhpcy5kYXRhO1xuICAgICAgICBpZiAob2Zmc2V0ID4gcy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIkluZGV4U2l6ZUVycm9yXCIpO1xuICAgICAgICB2YXIgaGVhZCA9IHMuc2xpY2UoMCwgb2Zmc2V0KTtcbiAgICAgICAgdmFyIHRhaWwgPSBzLnNsaWNlKG9mZnNldCk7XG4gICAgICAgIHRoaXMuZGF0YSA9IGhlYWQ7XG4gICAgICAgIHZhciBuZXdUZXh0Tm9kZSA9IHRoaXMub3duZXJEb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0YWlsKTtcbiAgICAgICAgaWYgKHRoaXMucGFyZW50Tm9kZSkgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShuZXdUZXh0Tm9kZSwgdGhpcy5uZXh0U2libGluZyk7XG4gICAgICAgIHJldHVybiBuZXdUZXh0Tm9kZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxUZXh0LCBUZXh0LCBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuVGV4dCA9IFRleHQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIGlmICghd2luZG93LkRPTVRva2VuTGlzdCkge1xuICAgICAgY29uc29sZS53YXJuKFwiTWlzc2luZyBET01Ub2tlbkxpc3QgcHJvdG90eXBlLCBwbGVhc2UgaW5jbHVkZSBhIFwiICsgXCJjb21wYXRpYmxlIGNsYXNzTGlzdCBwb2x5ZmlsbCBzdWNoIGFzIGh0dHA6Ly9nb28uZ2wvdVRjZXBILlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgZW5xdWV1ZU11dGF0aW9uID0gc2NvcGUuZW5xdWV1ZU11dGF0aW9uO1xuICAgIGZ1bmN0aW9uIGdldENsYXNzKGVsKSB7XG4gICAgICByZXR1cm4gdW5zYWZlVW53cmFwKGVsKS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZW5xdWV1ZUNsYXNzQXR0cmlidXRlQ2hhbmdlKGVsLCBvbGRWYWx1ZSkge1xuICAgICAgZW5xdWV1ZU11dGF0aW9uKGVsLCBcImF0dHJpYnV0ZXNcIiwge1xuICAgICAgICBuYW1lOiBcImNsYXNzXCIsXG4gICAgICAgIG5hbWVzcGFjZTogbnVsbCxcbiAgICAgICAgb2xkVmFsdWU6IG9sZFZhbHVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW52YWxpZGF0ZUNsYXNzKGVsKSB7XG4gICAgICBzY29wZS5pbnZhbGlkYXRlUmVuZGVyZXJCYXNlZE9uQXR0cmlidXRlKGVsLCBcImNsYXNzXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjaGFuZ2VDbGFzcyh0b2tlbkxpc3QsIG1ldGhvZCwgYXJncykge1xuICAgICAgdmFyIG93bmVyRWxlbWVudCA9IHRva2VuTGlzdC5vd25lckVsZW1lbnRfO1xuICAgICAgaWYgKG93bmVyRWxlbWVudCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBtZXRob2QuYXBwbHkodG9rZW5MaXN0LCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIHZhciBvbGRWYWx1ZSA9IGdldENsYXNzKG93bmVyRWxlbWVudCk7XG4gICAgICB2YXIgcmV0diA9IG1ldGhvZC5hcHBseSh0b2tlbkxpc3QsIGFyZ3MpO1xuICAgICAgaWYgKGdldENsYXNzKG93bmVyRWxlbWVudCkgIT09IG9sZFZhbHVlKSB7XG4gICAgICAgIGVucXVldWVDbGFzc0F0dHJpYnV0ZUNoYW5nZShvd25lckVsZW1lbnQsIG9sZFZhbHVlKTtcbiAgICAgICAgaW52YWxpZGF0ZUNsYXNzKG93bmVyRWxlbWVudCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0djtcbiAgICB9XG4gICAgdmFyIG9sZEFkZCA9IERPTVRva2VuTGlzdC5wcm90b3R5cGUuYWRkO1xuICAgIERPTVRva2VuTGlzdC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oKSB7XG4gICAgICBjaGFuZ2VDbGFzcyh0aGlzLCBvbGRBZGQsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICB2YXIgb2xkUmVtb3ZlID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZS5yZW1vdmU7XG4gICAgRE9NVG9rZW5MaXN0LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgICAgIGNoYW5nZUNsYXNzKHRoaXMsIG9sZFJlbW92ZSwgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIHZhciBvbGRUb2dnbGUgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtcbiAgICBET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGNoYW5nZUNsYXNzKHRoaXMsIG9sZFRvZ2dsZSwgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgQ2hpbGROb2RlSW50ZXJmYWNlID0gc2NvcGUuQ2hpbGROb2RlSW50ZXJmYWNlO1xuICAgIHZhciBHZXRFbGVtZW50c0J5SW50ZXJmYWNlID0gc2NvcGUuR2V0RWxlbWVudHNCeUludGVyZmFjZTtcbiAgICB2YXIgTm9kZSA9IHNjb3BlLndyYXBwZXJzLk5vZGU7XG4gICAgdmFyIFBhcmVudE5vZGVJbnRlcmZhY2UgPSBzY29wZS5QYXJlbnROb2RlSW50ZXJmYWNlO1xuICAgIHZhciBTZWxlY3RvcnNJbnRlcmZhY2UgPSBzY29wZS5TZWxlY3RvcnNJbnRlcmZhY2U7XG4gICAgdmFyIE1hdGNoZXNJbnRlcmZhY2UgPSBzY29wZS5NYXRjaGVzSW50ZXJmYWNlO1xuICAgIHZhciBhZGRXcmFwTm9kZUxpc3RNZXRob2QgPSBzY29wZS5hZGRXcmFwTm9kZUxpc3RNZXRob2Q7XG4gICAgdmFyIGVucXVldWVNdXRhdGlvbiA9IHNjb3BlLmVucXVldWVNdXRhdGlvbjtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgb25lT2YgPSBzY29wZS5vbmVPZjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHdyYXBwZXJzID0gc2NvcGUud3JhcHBlcnM7XG4gICAgdmFyIE9yaWdpbmFsRWxlbWVudCA9IHdpbmRvdy5FbGVtZW50O1xuICAgIHZhciBtYXRjaGVzTmFtZXMgPSBbIFwibWF0Y2hlc1wiLCBcIm1vek1hdGNoZXNTZWxlY3RvclwiLCBcIm1zTWF0Y2hlc1NlbGVjdG9yXCIsIFwid2Via2l0TWF0Y2hlc1NlbGVjdG9yXCIgXS5maWx0ZXIoZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIE9yaWdpbmFsRWxlbWVudC5wcm90b3R5cGVbbmFtZV07XG4gICAgfSk7XG4gICAgdmFyIG1hdGNoZXNOYW1lID0gbWF0Y2hlc05hbWVzWzBdO1xuICAgIHZhciBvcmlnaW5hbE1hdGNoZXMgPSBPcmlnaW5hbEVsZW1lbnQucHJvdG90eXBlW21hdGNoZXNOYW1lXTtcbiAgICBmdW5jdGlvbiBpbnZhbGlkYXRlUmVuZGVyZXJCYXNlZE9uQXR0cmlidXRlKGVsZW1lbnQsIG5hbWUpIHtcbiAgICAgIHZhciBwID0gZWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgaWYgKCFwIHx8ICFwLnNoYWRvd1Jvb3QpIHJldHVybjtcbiAgICAgIHZhciByZW5kZXJlciA9IHNjb3BlLmdldFJlbmRlcmVyRm9ySG9zdChwKTtcbiAgICAgIGlmIChyZW5kZXJlci5kZXBlbmRzT25BdHRyaWJ1dGUobmFtZSkpIHJlbmRlcmVyLmludmFsaWRhdGUoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZW5xdWVBdHRyaWJ1dGVDaGFuZ2UoZWxlbWVudCwgbmFtZSwgb2xkVmFsdWUpIHtcbiAgICAgIGVucXVldWVNdXRhdGlvbihlbGVtZW50LCBcImF0dHJpYnV0ZXNcIiwge1xuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICBuYW1lc3BhY2U6IG51bGwsXG4gICAgICAgIG9sZFZhbHVlOiBvbGRWYWx1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIHZhciBjbGFzc0xpc3RUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgZnVuY3Rpb24gRWxlbWVudChub2RlKSB7XG4gICAgICBOb2RlLmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShOb2RlLnByb3RvdHlwZSk7XG4gICAgbWl4aW4oRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGNyZWF0ZVNoYWRvd1Jvb3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbmV3U2hhZG93Um9vdCA9IG5ldyB3cmFwcGVycy5TaGFkb3dSb290KHRoaXMpO1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykucG9seW1lclNoYWRvd1Jvb3RfID0gbmV3U2hhZG93Um9vdDtcbiAgICAgICAgdmFyIHJlbmRlcmVyID0gc2NvcGUuZ2V0UmVuZGVyZXJGb3JIb3N0KHRoaXMpO1xuICAgICAgICByZW5kZXJlci5pbnZhbGlkYXRlKCk7XG4gICAgICAgIHJldHVybiBuZXdTaGFkb3dSb290O1xuICAgICAgfSxcbiAgICAgIGdldCBzaGFkb3dSb290KCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLnBvbHltZXJTaGFkb3dSb290XyB8fCBudWxsO1xuICAgICAgfSxcbiAgICAgIHNldEF0dHJpYnV0ZTogZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gdW5zYWZlVW53cmFwKHRoaXMpLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIGVucXVlQXR0cmlidXRlQ2hhbmdlKHRoaXMsIG5hbWUsIG9sZFZhbHVlKTtcbiAgICAgICAgaW52YWxpZGF0ZVJlbmRlcmVyQmFzZWRPbkF0dHJpYnV0ZSh0aGlzLCBuYW1lKTtcbiAgICAgIH0sXG4gICAgICByZW1vdmVBdHRyaWJ1dGU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gdW5zYWZlVW53cmFwKHRoaXMpLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgZW5xdWVBdHRyaWJ1dGVDaGFuZ2UodGhpcywgbmFtZSwgb2xkVmFsdWUpO1xuICAgICAgICBpbnZhbGlkYXRlUmVuZGVyZXJCYXNlZE9uQXR0cmlidXRlKHRoaXMsIG5hbWUpO1xuICAgICAgfSxcbiAgICAgIGdldCBjbGFzc0xpc3QoKSB7XG4gICAgICAgIHZhciBsaXN0ID0gY2xhc3NMaXN0VGFibGUuZ2V0KHRoaXMpO1xuICAgICAgICBpZiAoIWxpc3QpIHtcbiAgICAgICAgICBsaXN0ID0gdW5zYWZlVW53cmFwKHRoaXMpLmNsYXNzTGlzdDtcbiAgICAgICAgICBpZiAoIWxpc3QpIHJldHVybjtcbiAgICAgICAgICBsaXN0Lm93bmVyRWxlbWVudF8gPSB0aGlzO1xuICAgICAgICAgIGNsYXNzTGlzdFRhYmxlLnNldCh0aGlzLCBsaXN0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICAgIH0sXG4gICAgICBnZXQgY2xhc3NOYW1lKCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLmNsYXNzTmFtZTtcbiAgICAgIH0sXG4gICAgICBzZXQgY2xhc3NOYW1lKHYpIHtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCB2KTtcbiAgICAgIH0sXG4gICAgICBnZXQgaWQoKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykuaWQ7XG4gICAgICB9LFxuICAgICAgc2V0IGlkKHYpIHtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJpZFwiLCB2KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBtYXRjaGVzTmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICBpZiAobmFtZSAhPT0gXCJtYXRjaGVzXCIpIHtcbiAgICAgICAgRWxlbWVudC5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hdGNoZXMoc2VsZWN0b3IpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChPcmlnaW5hbEVsZW1lbnQucHJvdG90eXBlLndlYmtpdENyZWF0ZVNoYWRvd1Jvb3QpIHtcbiAgICAgIEVsZW1lbnQucHJvdG90eXBlLndlYmtpdENyZWF0ZVNoYWRvd1Jvb3QgPSBFbGVtZW50LnByb3RvdHlwZS5jcmVhdGVTaGFkb3dSb290O1xuICAgIH1cbiAgICBtaXhpbihFbGVtZW50LnByb3RvdHlwZSwgQ2hpbGROb2RlSW50ZXJmYWNlKTtcbiAgICBtaXhpbihFbGVtZW50LnByb3RvdHlwZSwgR2V0RWxlbWVudHNCeUludGVyZmFjZSk7XG4gICAgbWl4aW4oRWxlbWVudC5wcm90b3R5cGUsIFBhcmVudE5vZGVJbnRlcmZhY2UpO1xuICAgIG1peGluKEVsZW1lbnQucHJvdG90eXBlLCBTZWxlY3RvcnNJbnRlcmZhY2UpO1xuICAgIG1peGluKEVsZW1lbnQucHJvdG90eXBlLCBNYXRjaGVzSW50ZXJmYWNlKTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxFbGVtZW50LCBFbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnVsbCwgXCJ4XCIpKTtcbiAgICBzY29wZS5pbnZhbGlkYXRlUmVuZGVyZXJCYXNlZE9uQXR0cmlidXRlID0gaW52YWxpZGF0ZVJlbmRlcmVyQmFzZWRPbkF0dHJpYnV0ZTtcbiAgICBzY29wZS5tYXRjaGVzTmFtZXMgPSBtYXRjaGVzTmFtZXM7XG4gICAgc2NvcGUub3JpZ2luYWxNYXRjaGVzID0gb3JpZ2luYWxNYXRjaGVzO1xuICAgIHNjb3BlLndyYXBwZXJzLkVsZW1lbnQgPSBFbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkVsZW1lbnQ7XG4gICAgdmFyIGRlZmluZUdldHRlciA9IHNjb3BlLmRlZmluZUdldHRlcjtcbiAgICB2YXIgZW5xdWV1ZU11dGF0aW9uID0gc2NvcGUuZW5xdWV1ZU11dGF0aW9uO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciBub2Rlc1dlcmVBZGRlZCA9IHNjb3BlLm5vZGVzV2VyZUFkZGVkO1xuICAgIHZhciBub2Rlc1dlcmVSZW1vdmVkID0gc2NvcGUubm9kZXNXZXJlUmVtb3ZlZDtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBzbmFwc2hvdE5vZGVMaXN0ID0gc2NvcGUuc25hcHNob3ROb2RlTGlzdDtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciB3cmFwcGVycyA9IHNjb3BlLndyYXBwZXJzO1xuICAgIHZhciBlc2NhcGVBdHRyUmVnRXhwID0gL1smXFx1MDBBMFwiXS9nO1xuICAgIHZhciBlc2NhcGVEYXRhUmVnRXhwID0gL1smXFx1MDBBMDw+XS9nO1xuICAgIGZ1bmN0aW9uIGVzY2FwZVJlcGxhY2UoYykge1xuICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgY2FzZSBcIiZcIjpcbiAgICAgICAgcmV0dXJuIFwiJmFtcDtcIjtcblxuICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgIHJldHVybiBcIiZsdDtcIjtcblxuICAgICAgIGNhc2UgXCI+XCI6XG4gICAgICAgIHJldHVybiBcIiZndDtcIjtcblxuICAgICAgIGNhc2UgJ1wiJzpcbiAgICAgICAgcmV0dXJuIFwiJnF1b3Q7XCI7XG5cbiAgICAgICBjYXNlIFwiwqBcIjpcbiAgICAgICAgcmV0dXJuIFwiJm5ic3A7XCI7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVzY2FwZUF0dHIocykge1xuICAgICAgcmV0dXJuIHMucmVwbGFjZShlc2NhcGVBdHRyUmVnRXhwLCBlc2NhcGVSZXBsYWNlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZXNjYXBlRGF0YShzKSB7XG4gICAgICByZXR1cm4gcy5yZXBsYWNlKGVzY2FwZURhdGFSZWdFeHAsIGVzY2FwZVJlcGxhY2UpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtYWtlU2V0KGFycikge1xuICAgICAgdmFyIHNldCA9IHt9O1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2V0W2FycltpXV0gPSB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNldDtcbiAgICB9XG4gICAgdmFyIHZvaWRFbGVtZW50cyA9IG1ha2VTZXQoWyBcImFyZWFcIiwgXCJiYXNlXCIsIFwiYnJcIiwgXCJjb2xcIiwgXCJjb21tYW5kXCIsIFwiZW1iZWRcIiwgXCJoclwiLCBcImltZ1wiLCBcImlucHV0XCIsIFwia2V5Z2VuXCIsIFwibGlua1wiLCBcIm1ldGFcIiwgXCJwYXJhbVwiLCBcInNvdXJjZVwiLCBcInRyYWNrXCIsIFwid2JyXCIgXSk7XG4gICAgdmFyIHBsYWludGV4dFBhcmVudHMgPSBtYWtlU2V0KFsgXCJzdHlsZVwiLCBcInNjcmlwdFwiLCBcInhtcFwiLCBcImlmcmFtZVwiLCBcIm5vZW1iZWRcIiwgXCJub2ZyYW1lc1wiLCBcInBsYWludGV4dFwiLCBcIm5vc2NyaXB0XCIgXSk7XG4gICAgdmFyIFhIVE1MX05TID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCI7XG4gICAgZnVuY3Rpb24gbmVlZHNTZWxmQ2xvc2luZ1NsYXNoKG5vZGUpIHtcbiAgICAgIGlmIChub2RlLm5hbWVzcGFjZVVSSSAhPT0gWEhUTUxfTlMpIHJldHVybiB0cnVlO1xuICAgICAgdmFyIGRvY3R5cGUgPSBub2RlLm93bmVyRG9jdW1lbnQuZG9jdHlwZTtcbiAgICAgIHJldHVybiBkb2N0eXBlICYmIGRvY3R5cGUucHVibGljSWQgJiYgZG9jdHlwZS5zeXN0ZW1JZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0T3V0ZXJIVE1MKG5vZGUsIHBhcmVudE5vZGUpIHtcbiAgICAgIHN3aXRjaCAobm9kZS5ub2RlVHlwZSkge1xuICAgICAgIGNhc2UgTm9kZS5FTEVNRU5UX05PREU6XG4gICAgICAgIHZhciB0YWdOYW1lID0gbm9kZS50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBzID0gXCI8XCIgKyB0YWdOYW1lO1xuICAgICAgICB2YXIgYXR0cnMgPSBub2RlLmF0dHJpYnV0ZXM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBhdHRyOyBhdHRyID0gYXR0cnNbaV07IGkrKykge1xuICAgICAgICAgIHMgKz0gXCIgXCIgKyBhdHRyLm5hbWUgKyAnPVwiJyArIGVzY2FwZUF0dHIoYXR0ci52YWx1ZSkgKyAnXCInO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2b2lkRWxlbWVudHNbdGFnTmFtZV0pIHtcbiAgICAgICAgICBpZiAobmVlZHNTZWxmQ2xvc2luZ1NsYXNoKG5vZGUpKSBzICs9IFwiL1wiO1xuICAgICAgICAgIHJldHVybiBzICsgXCI+XCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMgKyBcIj5cIiArIGdldElubmVySFRNTChub2RlKSArIFwiPC9cIiArIHRhZ05hbWUgKyBcIj5cIjtcblxuICAgICAgIGNhc2UgTm9kZS5URVhUX05PREU6XG4gICAgICAgIHZhciBkYXRhID0gbm9kZS5kYXRhO1xuICAgICAgICBpZiAocGFyZW50Tm9kZSAmJiBwbGFpbnRleHRQYXJlbnRzW3BhcmVudE5vZGUubG9jYWxOYW1lXSkgcmV0dXJuIGRhdGE7XG4gICAgICAgIHJldHVybiBlc2NhcGVEYXRhKGRhdGEpO1xuXG4gICAgICAgY2FzZSBOb2RlLkNPTU1FTlRfTk9ERTpcbiAgICAgICAgcmV0dXJuIFwiPCEtLVwiICsgbm9kZS5kYXRhICsgXCItLT5cIjtcblxuICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUuZXJyb3Iobm9kZSk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0SW5uZXJIVE1MKG5vZGUpIHtcbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2Ygd3JhcHBlcnMuSFRNTFRlbXBsYXRlRWxlbWVudCkgbm9kZSA9IG5vZGUuY29udGVudDtcbiAgICAgIHZhciBzID0gXCJcIjtcbiAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICBzICs9IGdldE91dGVySFRNTChjaGlsZCwgbm9kZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcztcbiAgICB9XG4gICAgZnVuY3Rpb24gc2V0SW5uZXJIVE1MKG5vZGUsIHZhbHVlLCBvcHRfdGFnTmFtZSkge1xuICAgICAgdmFyIHRhZ05hbWUgPSBvcHRfdGFnTmFtZSB8fCBcImRpdlwiO1xuICAgICAgbm9kZS50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICB2YXIgdGVtcEVsZW1lbnQgPSB1bndyYXAobm9kZS5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSkpO1xuICAgICAgdGVtcEVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgICB2YXIgZmlyc3RDaGlsZDtcbiAgICAgIHdoaWxlIChmaXJzdENoaWxkID0gdGVtcEVsZW1lbnQuZmlyc3RDaGlsZCkge1xuICAgICAgICBub2RlLmFwcGVuZENoaWxkKHdyYXAoZmlyc3RDaGlsZCkpO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgb2xkSWUgPSAvTVNJRS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgICB2YXIgT3JpZ2luYWxIVE1MRWxlbWVudCA9IHdpbmRvdy5IVE1MRWxlbWVudDtcbiAgICB2YXIgT3JpZ2luYWxIVE1MVGVtcGxhdGVFbGVtZW50ID0gd2luZG93LkhUTUxUZW1wbGF0ZUVsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTEVsZW1lbnQobm9kZSkge1xuICAgICAgRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihIVE1MRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGdldCBpbm5lckhUTUwoKSB7XG4gICAgICAgIHJldHVybiBnZXRJbm5lckhUTUwodGhpcyk7XG4gICAgICB9LFxuICAgICAgc2V0IGlubmVySFRNTCh2YWx1ZSkge1xuICAgICAgICBpZiAob2xkSWUgJiYgcGxhaW50ZXh0UGFyZW50c1t0aGlzLmxvY2FsTmFtZV0pIHtcbiAgICAgICAgICB0aGlzLnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZW1vdmVkTm9kZXMgPSBzbmFwc2hvdE5vZGVMaXN0KHRoaXMuY2hpbGROb2Rlcyk7XG4gICAgICAgIGlmICh0aGlzLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcigpKSB7XG4gICAgICAgICAgaWYgKHRoaXMgaW5zdGFuY2VvZiB3cmFwcGVycy5IVE1MVGVtcGxhdGVFbGVtZW50KSBzZXRJbm5lckhUTUwodGhpcy5jb250ZW50LCB2YWx1ZSk7IGVsc2Ugc2V0SW5uZXJIVE1MKHRoaXMsIHZhbHVlLCB0aGlzLnRhZ05hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKCFPcmlnaW5hbEhUTUxUZW1wbGF0ZUVsZW1lbnQgJiYgdGhpcyBpbnN0YW5jZW9mIHdyYXBwZXJzLkhUTUxUZW1wbGF0ZUVsZW1lbnQpIHtcbiAgICAgICAgICBzZXRJbm5lckhUTUwodGhpcy5jb250ZW50LCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLmlubmVySFRNTCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhZGRlZE5vZGVzID0gc25hcHNob3ROb2RlTGlzdCh0aGlzLmNoaWxkTm9kZXMpO1xuICAgICAgICBlbnF1ZXVlTXV0YXRpb24odGhpcywgXCJjaGlsZExpc3RcIiwge1xuICAgICAgICAgIGFkZGVkTm9kZXM6IGFkZGVkTm9kZXMsXG4gICAgICAgICAgcmVtb3ZlZE5vZGVzOiByZW1vdmVkTm9kZXNcbiAgICAgICAgfSk7XG4gICAgICAgIG5vZGVzV2VyZVJlbW92ZWQocmVtb3ZlZE5vZGVzKTtcbiAgICAgICAgbm9kZXNXZXJlQWRkZWQoYWRkZWROb2RlcywgdGhpcyk7XG4gICAgICB9LFxuICAgICAgZ2V0IG91dGVySFRNTCgpIHtcbiAgICAgICAgcmV0dXJuIGdldE91dGVySFRNTCh0aGlzLCB0aGlzLnBhcmVudE5vZGUpO1xuICAgICAgfSxcbiAgICAgIHNldCBvdXRlckhUTUwodmFsdWUpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgICAgIGlmIChwKSB7XG4gICAgICAgICAgcC5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIoKTtcbiAgICAgICAgICB2YXIgZGYgPSBmcmFnKHAsIHZhbHVlKTtcbiAgICAgICAgICBwLnJlcGxhY2VDaGlsZChkZiwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBpbnNlcnRBZGphY2VudEhUTUw6IGZ1bmN0aW9uKHBvc2l0aW9uLCB0ZXh0KSB7XG4gICAgICAgIHZhciBjb250ZXh0RWxlbWVudCwgcmVmTm9kZTtcbiAgICAgICAgc3dpdGNoIChTdHJpbmcocG9zaXRpb24pLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgIGNhc2UgXCJiZWZvcmViZWdpblwiOlxuICAgICAgICAgIGNvbnRleHRFbGVtZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuICAgICAgICAgIHJlZk5vZGUgPSB0aGlzO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICBjYXNlIFwiYWZ0ZXJlbmRcIjpcbiAgICAgICAgICBjb250ZXh0RWxlbWVudCA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICAgICAgICByZWZOb2RlID0gdGhpcy5uZXh0U2libGluZztcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICAgY2FzZSBcImFmdGVyYmVnaW5cIjpcbiAgICAgICAgICBjb250ZXh0RWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgcmVmTm9kZSA9IHRoaXMuZmlyc3RDaGlsZDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICAgY2FzZSBcImJlZm9yZWVuZFwiOlxuICAgICAgICAgIGNvbnRleHRFbGVtZW50ID0gdGhpcztcbiAgICAgICAgICByZWZOb2RlID0gbnVsbDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRmID0gZnJhZyhjb250ZXh0RWxlbWVudCwgdGV4dCk7XG4gICAgICAgIGNvbnRleHRFbGVtZW50Lmluc2VydEJlZm9yZShkZiwgcmVmTm9kZSk7XG4gICAgICB9LFxuICAgICAgZ2V0IGhpZGRlbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFzQXR0cmlidXRlKFwiaGlkZGVuXCIpO1xuICAgICAgfSxcbiAgICAgIHNldCBoaWRkZW4odikge1xuICAgICAgICBpZiAodikge1xuICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiaGlkZGVuXCIsIFwiXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFwiaGlkZGVuXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgZnVuY3Rpb24gZnJhZyhjb250ZXh0RWxlbWVudCwgaHRtbCkge1xuICAgICAgdmFyIHAgPSB1bndyYXAoY29udGV4dEVsZW1lbnQuY2xvbmVOb2RlKGZhbHNlKSk7XG4gICAgICBwLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICB2YXIgZGYgPSB1bndyYXAoZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTtcbiAgICAgIHZhciBjO1xuICAgICAgd2hpbGUgKGMgPSBwLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgZGYuYXBwZW5kQ2hpbGQoYyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gd3JhcChkZik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldHRlcihuYW1lKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNjb3BlLnJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKVtuYW1lXTtcbiAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldHRlclJlcXVpcmVzUmVuZGVyaW5nKG5hbWUpIHtcbiAgICAgIGRlZmluZUdldHRlcihIVE1MRWxlbWVudCwgbmFtZSwgZ2V0dGVyKG5hbWUpKTtcbiAgICB9XG4gICAgWyBcImNsaWVudEhlaWdodFwiLCBcImNsaWVudExlZnRcIiwgXCJjbGllbnRUb3BcIiwgXCJjbGllbnRXaWR0aFwiLCBcIm9mZnNldEhlaWdodFwiLCBcIm9mZnNldExlZnRcIiwgXCJvZmZzZXRUb3BcIiwgXCJvZmZzZXRXaWR0aFwiLCBcInNjcm9sbEhlaWdodFwiLCBcInNjcm9sbFdpZHRoXCIgXS5mb3JFYWNoKGdldHRlclJlcXVpcmVzUmVuZGVyaW5nKTtcbiAgICBmdW5jdGlvbiBnZXR0ZXJBbmRTZXR0ZXJSZXF1aXJlc1JlbmRlcmluZyhuYW1lKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSFRNTEVsZW1lbnQucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgICAgIGdldDogZ2V0dGVyKG5hbWUpLFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICBzY29wZS5yZW5kZXJBbGxQZW5kaW5nKCk7XG4gICAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpW25hbWVdID0gdjtcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgWyBcInNjcm9sbExlZnRcIiwgXCJzY3JvbGxUb3BcIiBdLmZvckVhY2goZ2V0dGVyQW5kU2V0dGVyUmVxdWlyZXNSZW5kZXJpbmcpO1xuICAgIGZ1bmN0aW9uIG1ldGhvZFJlcXVpcmVzUmVuZGVyaW5nKG5hbWUpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShIVE1MRWxlbWVudC5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNjb3BlLnJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpW25hbWVdLmFwcGx5KHVuc2FmZVVud3JhcCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgWyBcImZvY3VzXCIsIFwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0XCIsIFwiZ2V0Q2xpZW50UmVjdHNcIiwgXCJzY3JvbGxJbnRvVmlld1wiIF0uZm9yRWFjaChtZXRob2RSZXF1aXJlc1JlbmRlcmluZyk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTEVsZW1lbnQsIEhUTUxFbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYlwiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQgPSBIVE1MRWxlbWVudDtcbiAgICBzY29wZS5nZXRJbm5lckhUTUwgPSBnZXRJbm5lckhUTUw7XG4gICAgc2NvcGUuc2V0SW5uZXJIVE1MID0gc2V0SW5uZXJIVE1MO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbEhUTUxDYW52YXNFbGVtZW50ID0gd2luZG93LkhUTUxDYW52YXNFbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxDYW52YXNFbGVtZW50KG5vZGUpIHtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxDYW52YXNFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihIVE1MQ2FudmFzRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGdldENvbnRleHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29udGV4dCA9IHVuc2FmZVVud3JhcCh0aGlzKS5nZXRDb250ZXh0LmFwcGx5KHVuc2FmZVVud3JhcCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQgJiYgd3JhcChjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MQ2FudmFzRWxlbWVudCwgSFRNTENhbnZhc0VsZW1lbnQsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxDYW52YXNFbGVtZW50ID0gSFRNTENhbnZhc0VsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIE9yaWdpbmFsSFRNTENvbnRlbnRFbGVtZW50ID0gd2luZG93LkhUTUxDb250ZW50RWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MQ29udGVudEVsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTENvbnRlbnRFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBtaXhpbihIVE1MQ29udGVudEVsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3RvcjogSFRNTENvbnRlbnRFbGVtZW50LFxuICAgICAgZ2V0IHNlbGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKFwic2VsZWN0XCIpO1xuICAgICAgfSxcbiAgICAgIHNldCBzZWxlY3QodmFsdWUpIHtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJzZWxlY3RcIiwgdmFsdWUpO1xuICAgICAgfSxcbiAgICAgIHNldEF0dHJpYnV0ZTogZnVuY3Rpb24obiwgdikge1xuICAgICAgICBIVE1MRWxlbWVudC5wcm90b3R5cGUuc2V0QXR0cmlidXRlLmNhbGwodGhpcywgbiwgdik7XG4gICAgICAgIGlmIChTdHJpbmcobikudG9Mb3dlckNhc2UoKSA9PT0gXCJzZWxlY3RcIikgdGhpcy5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIodHJ1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKE9yaWdpbmFsSFRNTENvbnRlbnRFbGVtZW50KSByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MQ29udGVudEVsZW1lbnQsIEhUTUxDb250ZW50RWxlbWVudCk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTENvbnRlbnRFbGVtZW50ID0gSFRNTENvbnRlbnRFbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB3cmFwSFRNTENvbGxlY3Rpb24gPSBzY29wZS53cmFwSFRNTENvbGxlY3Rpb247XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxIVE1MRm9ybUVsZW1lbnQgPSB3aW5kb3cuSFRNTEZvcm1FbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxGb3JtRWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MRm9ybUVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKEhUTUxGb3JtRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGdldCBlbGVtZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBIVE1MQ29sbGVjdGlvbih1bndyYXAodGhpcykuZWxlbWVudHMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxGb3JtRWxlbWVudCwgSFRNTEZvcm1FbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZm9ybVwiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTEZvcm1FbGVtZW50ID0gSFRNTEZvcm1FbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHJld3JhcCA9IHNjb3BlLnJld3JhcDtcbiAgICB2YXIgT3JpZ2luYWxIVE1MSW1hZ2VFbGVtZW50ID0gd2luZG93LkhUTUxJbWFnZUVsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTEltYWdlRWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MSW1hZ2VFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MSW1hZ2VFbGVtZW50LCBIVE1MSW1hZ2VFbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpKTtcbiAgICBmdW5jdGlvbiBJbWFnZSh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgSW1hZ2UpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJET00gb2JqZWN0IGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBjYWxsZWQgYXMgYSBmdW5jdGlvbi5cIik7XG4gICAgICB9XG4gICAgICB2YXIgbm9kZSA9IHVud3JhcChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpKTtcbiAgICAgIEhUTUxFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgICByZXdyYXAobm9kZSwgdGhpcyk7XG4gICAgICBpZiAod2lkdGggIT09IHVuZGVmaW5lZCkgbm9kZS53aWR0aCA9IHdpZHRoO1xuICAgICAgaWYgKGhlaWdodCAhPT0gdW5kZWZpbmVkKSBub2RlLmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG4gICAgSW1hZ2UucHJvdG90eXBlID0gSFRNTEltYWdlRWxlbWVudC5wcm90b3R5cGU7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTEltYWdlRWxlbWVudCA9IEhUTUxJbWFnZUVsZW1lbnQ7XG4gICAgc2NvcGUud3JhcHBlcnMuSW1hZ2UgPSBJbWFnZTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIE5vZGVMaXN0ID0gc2NvcGUud3JhcHBlcnMuTm9kZUxpc3Q7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgT3JpZ2luYWxIVE1MU2hhZG93RWxlbWVudCA9IHdpbmRvdy5IVE1MU2hhZG93RWxlbWVudDtcbiAgICBmdW5jdGlvbiBIVE1MU2hhZG93RWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MU2hhZG93RWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgSFRNTFNoYWRvd0VsZW1lbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gSFRNTFNoYWRvd0VsZW1lbnQ7XG4gICAgaWYgKE9yaWdpbmFsSFRNTFNoYWRvd0VsZW1lbnQpIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxTaGFkb3dFbGVtZW50LCBIVE1MU2hhZG93RWxlbWVudCk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTFNoYWRvd0VsZW1lbnQgPSBIVE1MU2hhZG93RWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBjb250ZW50VGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHZhciB0ZW1wbGF0ZUNvbnRlbnRzT3duZXJUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgZnVuY3Rpb24gZ2V0VGVtcGxhdGVDb250ZW50c093bmVyKGRvYykge1xuICAgICAgaWYgKCFkb2MuZGVmYXVsdFZpZXcpIHJldHVybiBkb2M7XG4gICAgICB2YXIgZCA9IHRlbXBsYXRlQ29udGVudHNPd25lclRhYmxlLmdldChkb2MpO1xuICAgICAgaWYgKCFkKSB7XG4gICAgICAgIGQgPSBkb2MuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KFwiXCIpO1xuICAgICAgICB3aGlsZSAoZC5sYXN0Q2hpbGQpIHtcbiAgICAgICAgICBkLnJlbW92ZUNoaWxkKGQubGFzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZUNvbnRlbnRzT3duZXJUYWJsZS5zZXQoZG9jLCBkKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkO1xuICAgIH1cbiAgICBmdW5jdGlvbiBleHRyYWN0Q29udGVudCh0ZW1wbGF0ZUVsZW1lbnQpIHtcbiAgICAgIHZhciBkb2MgPSBnZXRUZW1wbGF0ZUNvbnRlbnRzT3duZXIodGVtcGxhdGVFbGVtZW50Lm93bmVyRG9jdW1lbnQpO1xuICAgICAgdmFyIGRmID0gdW53cmFwKGRvYy5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpO1xuICAgICAgdmFyIGNoaWxkO1xuICAgICAgd2hpbGUgKGNoaWxkID0gdGVtcGxhdGVFbGVtZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgZGYuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRmO1xuICAgIH1cbiAgICB2YXIgT3JpZ2luYWxIVE1MVGVtcGxhdGVFbGVtZW50ID0gd2luZG93LkhUTUxUZW1wbGF0ZUVsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTFRlbXBsYXRlRWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgICAgaWYgKCFPcmlnaW5hbEhUTUxUZW1wbGF0ZUVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGNvbnRlbnQgPSBleHRyYWN0Q29udGVudChub2RlKTtcbiAgICAgICAgY29udGVudFRhYmxlLnNldCh0aGlzLCB3cmFwKGNvbnRlbnQpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgSFRNTFRlbXBsYXRlRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oSFRNTFRlbXBsYXRlRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiBIVE1MVGVtcGxhdGVFbGVtZW50LFxuICAgICAgZ2V0IGNvbnRlbnQoKSB7XG4gICAgICAgIGlmIChPcmlnaW5hbEhUTUxUZW1wbGF0ZUVsZW1lbnQpIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5jb250ZW50KTtcbiAgICAgICAgcmV0dXJuIGNvbnRlbnRUYWJsZS5nZXQodGhpcyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKE9yaWdpbmFsSFRNTFRlbXBsYXRlRWxlbWVudCkgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTFRlbXBsYXRlRWxlbWVudCwgSFRNTFRlbXBsYXRlRWxlbWVudCk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTFRlbXBsYXRlRWxlbWVudCA9IEhUTUxUZW1wbGF0ZUVsZW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIE9yaWdpbmFsSFRNTE1lZGlhRWxlbWVudCA9IHdpbmRvdy5IVE1MTWVkaWFFbGVtZW50O1xuICAgIGlmICghT3JpZ2luYWxIVE1MTWVkaWFFbGVtZW50KSByZXR1cm47XG4gICAgZnVuY3Rpb24gSFRNTE1lZGlhRWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MTWVkaWFFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MTWVkaWFFbGVtZW50LCBIVE1MTWVkaWFFbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYXVkaW9cIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxNZWRpYUVsZW1lbnQgPSBIVE1MTWVkaWFFbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTE1lZGlhRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxNZWRpYUVsZW1lbnQ7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciByZXdyYXAgPSBzY29wZS5yZXdyYXA7XG4gICAgdmFyIE9yaWdpbmFsSFRNTEF1ZGlvRWxlbWVudCA9IHdpbmRvdy5IVE1MQXVkaW9FbGVtZW50O1xuICAgIGlmICghT3JpZ2luYWxIVE1MQXVkaW9FbGVtZW50KSByZXR1cm47XG4gICAgZnVuY3Rpb24gSFRNTEF1ZGlvRWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MTWVkaWFFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICAgIEhUTUxBdWRpb0VsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MTWVkaWFFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTEF1ZGlvRWxlbWVudCwgSFRNTEF1ZGlvRWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF1ZGlvXCIpKTtcbiAgICBmdW5jdGlvbiBBdWRpbyhzcmMpIHtcbiAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBBdWRpbykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkRPTSBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgICAgIH1cbiAgICAgIHZhciBub2RlID0gdW53cmFwKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhdWRpb1wiKSk7XG4gICAgICBIVE1MTWVkaWFFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgICByZXdyYXAobm9kZSwgdGhpcyk7XG4gICAgICBub2RlLnNldEF0dHJpYnV0ZShcInByZWxvYWRcIiwgXCJhdXRvXCIpO1xuICAgICAgaWYgKHNyYyAhPT0gdW5kZWZpbmVkKSBub2RlLnNldEF0dHJpYnV0ZShcInNyY1wiLCBzcmMpO1xuICAgIH1cbiAgICBBdWRpby5wcm90b3R5cGUgPSBIVE1MQXVkaW9FbGVtZW50LnByb3RvdHlwZTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MQXVkaW9FbGVtZW50ID0gSFRNTEF1ZGlvRWxlbWVudDtcbiAgICBzY29wZS53cmFwcGVycy5BdWRpbyA9IEF1ZGlvO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciByZXdyYXAgPSBzY29wZS5yZXdyYXA7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsSFRNTE9wdGlvbkVsZW1lbnQgPSB3aW5kb3cuSFRNTE9wdGlvbkVsZW1lbnQ7XG4gICAgZnVuY3Rpb24gdHJpbVRleHQocykge1xuICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBIVE1MT3B0aW9uRWxlbWVudChub2RlKSB7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBIVE1MT3B0aW9uRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oSFRNTE9wdGlvbkVsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBnZXQgdGV4dCgpIHtcbiAgICAgICAgcmV0dXJuIHRyaW1UZXh0KHRoaXMudGV4dENvbnRlbnQpO1xuICAgICAgfSxcbiAgICAgIHNldCB0ZXh0KHZhbHVlKSB7XG4gICAgICAgIHRoaXMudGV4dENvbnRlbnQgPSB0cmltVGV4dChTdHJpbmcodmFsdWUpKTtcbiAgICAgIH0sXG4gICAgICBnZXQgZm9ybSgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmZvcm0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxPcHRpb25FbGVtZW50LCBIVE1MT3B0aW9uRWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm9wdGlvblwiKSk7XG4gICAgZnVuY3Rpb24gT3B0aW9uKHRleHQsIHZhbHVlLCBkZWZhdWx0U2VsZWN0ZWQsIHNlbGVjdGVkKSB7XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgT3B0aW9uKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRE9NIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xuICAgICAgfVxuICAgICAgdmFyIG5vZGUgPSB1bndyYXAoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm9wdGlvblwiKSk7XG4gICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgICAgcmV3cmFwKG5vZGUsIHRoaXMpO1xuICAgICAgaWYgKHRleHQgIT09IHVuZGVmaW5lZCkgbm9kZS50ZXh0ID0gdGV4dDtcbiAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSBub2RlLnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIHZhbHVlKTtcbiAgICAgIGlmIChkZWZhdWx0U2VsZWN0ZWQgPT09IHRydWUpIG5vZGUuc2V0QXR0cmlidXRlKFwic2VsZWN0ZWRcIiwgXCJcIik7XG4gICAgICBub2RlLnNlbGVjdGVkID0gc2VsZWN0ZWQgPT09IHRydWU7XG4gICAgfVxuICAgIE9wdGlvbi5wcm90b3R5cGUgPSBIVE1MT3B0aW9uRWxlbWVudC5wcm90b3R5cGU7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTE9wdGlvbkVsZW1lbnQgPSBIVE1MT3B0aW9uRWxlbWVudDtcbiAgICBzY29wZS53cmFwcGVycy5PcHRpb24gPSBPcHRpb247XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBIVE1MRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxFbGVtZW50O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsSFRNTFNlbGVjdEVsZW1lbnQgPSB3aW5kb3cuSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTFNlbGVjdEVsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTFNlbGVjdEVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKEhUTUxTZWxlY3RFbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgYWRkOiBmdW5jdGlvbihlbGVtZW50LCBiZWZvcmUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBiZWZvcmUgPT09IFwib2JqZWN0XCIpIGJlZm9yZSA9IHVud3JhcChiZWZvcmUpO1xuICAgICAgICB1bndyYXAodGhpcykuYWRkKHVud3JhcChlbGVtZW50KSwgYmVmb3JlKTtcbiAgICAgIH0sXG4gICAgICByZW1vdmU6IGZ1bmN0aW9uKGluZGV4T3JOb2RlKSB7XG4gICAgICAgIGlmIChpbmRleE9yTm9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgSFRNTEVsZW1lbnQucHJvdG90eXBlLnJlbW92ZS5jYWxsKHRoaXMpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGluZGV4T3JOb2RlID09PSBcIm9iamVjdFwiKSBpbmRleE9yTm9kZSA9IHVud3JhcChpbmRleE9yTm9kZSk7XG4gICAgICAgIHVud3JhcCh0aGlzKS5yZW1vdmUoaW5kZXhPck5vZGUpO1xuICAgICAgfSxcbiAgICAgIGdldCBmb3JtKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuZm9ybSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTFNlbGVjdEVsZW1lbnQsIEhUTUxTZWxlY3RFbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VsZWN0XCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MU2VsZWN0RWxlbWVudCA9IEhUTUxTZWxlY3RFbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciB3cmFwSFRNTENvbGxlY3Rpb24gPSBzY29wZS53cmFwSFRNTENvbGxlY3Rpb247XG4gICAgdmFyIE9yaWdpbmFsSFRNTFRhYmxlRWxlbWVudCA9IHdpbmRvdy5IVE1MVGFibGVFbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxUYWJsZUVsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTFRhYmxlRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oSFRNTFRhYmxlRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGdldCBjYXB0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bndyYXAodGhpcykuY2FwdGlvbik7XG4gICAgICB9LFxuICAgICAgY3JlYXRlQ2FwdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5jcmVhdGVDYXB0aW9uKCkpO1xuICAgICAgfSxcbiAgICAgIGdldCB0SGVhZCgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLnRIZWFkKTtcbiAgICAgIH0sXG4gICAgICBjcmVhdGVUSGVhZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5jcmVhdGVUSGVhZCgpKTtcbiAgICAgIH0sXG4gICAgICBjcmVhdGVURm9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5jcmVhdGVURm9vdCgpKTtcbiAgICAgIH0sXG4gICAgICBnZXQgdEZvb3QoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS50Rm9vdCk7XG4gICAgICB9LFxuICAgICAgZ2V0IHRCb2RpZXMoKSB7XG4gICAgICAgIHJldHVybiB3cmFwSFRNTENvbGxlY3Rpb24odW53cmFwKHRoaXMpLnRCb2RpZXMpO1xuICAgICAgfSxcbiAgICAgIGNyZWF0ZVRCb2R5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmNyZWF0ZVRCb2R5KCkpO1xuICAgICAgfSxcbiAgICAgIGdldCByb3dzKCkge1xuICAgICAgICByZXR1cm4gd3JhcEhUTUxDb2xsZWN0aW9uKHVud3JhcCh0aGlzKS5yb3dzKTtcbiAgICAgIH0sXG4gICAgICBpbnNlcnRSb3c6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5pbnNlcnRSb3coaW5kZXgpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MVGFibGVFbGVtZW50LCBIVE1MVGFibGVFbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGFibGVcIikpO1xuICAgIHNjb3BlLndyYXBwZXJzLkhUTUxUYWJsZUVsZW1lbnQgPSBIVE1MVGFibGVFbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB3cmFwSFRNTENvbGxlY3Rpb24gPSBzY29wZS53cmFwSFRNTENvbGxlY3Rpb247XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQgPSB3aW5kb3cuSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQ7XG4gICAgZnVuY3Rpb24gSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKEhUTUxUYWJsZVNlY3Rpb25FbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IEhUTUxUYWJsZVNlY3Rpb25FbGVtZW50LFxuICAgICAgZ2V0IHJvd3MoKSB7XG4gICAgICAgIHJldHVybiB3cmFwSFRNTENvbGxlY3Rpb24odW53cmFwKHRoaXMpLnJvd3MpO1xuICAgICAgfSxcbiAgICAgIGluc2VydFJvdzogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmluc2VydFJvdyhpbmRleCkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEhUTUxUYWJsZVNlY3Rpb25FbGVtZW50LCBIVE1MVGFibGVTZWN0aW9uRWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRoZWFkXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MVGFibGVTZWN0aW9uRWxlbWVudCA9IEhUTUxUYWJsZVNlY3Rpb25FbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB3cmFwSFRNTENvbGxlY3Rpb24gPSBzY29wZS53cmFwSFRNTENvbGxlY3Rpb247XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsSFRNTFRhYmxlUm93RWxlbWVudCA9IHdpbmRvdy5IVE1MVGFibGVSb3dFbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxUYWJsZVJvd0VsZW1lbnQobm9kZSkge1xuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTFRhYmxlUm93RWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oSFRNTFRhYmxlUm93RWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICAgIGdldCBjZWxscygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBIVE1MQ29sbGVjdGlvbih1bndyYXAodGhpcykuY2VsbHMpO1xuICAgICAgfSxcbiAgICAgIGluc2VydENlbGw6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5pbnNlcnRDZWxsKGluZGV4KSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsSFRNTFRhYmxlUm93RWxlbWVudCwgSFRNTFRhYmxlUm93RWxlbWVudCwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRyXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5IVE1MVGFibGVSb3dFbGVtZW50ID0gSFRNTFRhYmxlUm93RWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEhUTUxDb250ZW50RWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxDb250ZW50RWxlbWVudDtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgSFRNTFNoYWRvd0VsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MU2hhZG93RWxlbWVudDtcbiAgICB2YXIgSFRNTFRlbXBsYXRlRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxUZW1wbGF0ZUVsZW1lbnQ7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgT3JpZ2luYWxIVE1MVW5rbm93bkVsZW1lbnQgPSB3aW5kb3cuSFRNTFVua25vd25FbGVtZW50O1xuICAgIGZ1bmN0aW9uIEhUTUxVbmtub3duRWxlbWVudChub2RlKSB7XG4gICAgICBzd2l0Y2ggKG5vZGUubG9jYWxOYW1lKSB7XG4gICAgICAgY2FzZSBcImNvbnRlbnRcIjpcbiAgICAgICAgcmV0dXJuIG5ldyBIVE1MQ29udGVudEVsZW1lbnQobm9kZSk7XG5cbiAgICAgICBjYXNlIFwic2hhZG93XCI6XG4gICAgICAgIHJldHVybiBuZXcgSFRNTFNoYWRvd0VsZW1lbnQobm9kZSk7XG5cbiAgICAgICBjYXNlIFwidGVtcGxhdGVcIjpcbiAgICAgICAgcmV0dXJuIG5ldyBIVE1MVGVtcGxhdGVFbGVtZW50KG5vZGUpO1xuICAgICAgfVxuICAgICAgSFRNTEVsZW1lbnQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gICAgSFRNTFVua25vd25FbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxIVE1MVW5rbm93bkVsZW1lbnQsIEhUTUxVbmtub3duRWxlbWVudCk7XG4gICAgc2NvcGUud3JhcHBlcnMuSFRNTFVua25vd25FbGVtZW50ID0gSFRNTFVua25vd25FbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgRWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkVsZW1lbnQ7XG4gICAgdmFyIEhUTUxFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTEVsZW1lbnQ7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgZGVmaW5lV3JhcEdldHRlciA9IHNjb3BlLmRlZmluZVdyYXBHZXR0ZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIFNWR19OUyA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIjtcbiAgICB2YXIgT3JpZ2luYWxTVkdFbGVtZW50ID0gd2luZG93LlNWR0VsZW1lbnQ7XG4gICAgdmFyIHN2Z1RpdGxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhTVkdfTlMsIFwidGl0bGVcIik7XG4gICAgaWYgKCEoXCJjbGFzc0xpc3RcIiBpbiBzdmdUaXRsZUVsZW1lbnQpKSB7XG4gICAgICB2YXIgZGVzY3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEVsZW1lbnQucHJvdG90eXBlLCBcImNsYXNzTGlzdFwiKTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShIVE1MRWxlbWVudC5wcm90b3R5cGUsIFwiY2xhc3NMaXN0XCIsIGRlc2NyKTtcbiAgICAgIGRlbGV0ZSBFbGVtZW50LnByb3RvdHlwZS5jbGFzc0xpc3Q7XG4gICAgfVxuICAgIGZ1bmN0aW9uIFNWR0VsZW1lbnQobm9kZSkge1xuICAgICAgRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBTVkdFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIG1peGluKFNWR0VsZW1lbnQucHJvdG90eXBlLCB7XG4gICAgICBnZXQgb3duZXJTVkdFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykub3duZXJTVkdFbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxTVkdFbGVtZW50LCBTVkdFbGVtZW50LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoU1ZHX05TLCBcInRpdGxlXCIpKTtcbiAgICBzY29wZS53cmFwcGVycy5TVkdFbGVtZW50ID0gU1ZHRWxlbWVudDtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxTVkdVc2VFbGVtZW50ID0gd2luZG93LlNWR1VzZUVsZW1lbnQ7XG4gICAgdmFyIFNWR19OUyA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIjtcbiAgICB2YXIgZ1dyYXBwZXIgPSB3cmFwKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhTVkdfTlMsIFwiZ1wiKSk7XG4gICAgdmFyIHVzZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoU1ZHX05TLCBcInVzZVwiKTtcbiAgICB2YXIgU1ZHR0VsZW1lbnQgPSBnV3JhcHBlci5jb25zdHJ1Y3RvcjtcbiAgICB2YXIgcGFyZW50SW50ZXJmYWNlUHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKFNWR0dFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgdmFyIHBhcmVudEludGVyZmFjZSA9IHBhcmVudEludGVyZmFjZVByb3RvdHlwZS5jb25zdHJ1Y3RvcjtcbiAgICBmdW5jdGlvbiBTVkdVc2VFbGVtZW50KGltcGwpIHtcbiAgICAgIHBhcmVudEludGVyZmFjZS5jYWxsKHRoaXMsIGltcGwpO1xuICAgIH1cbiAgICBTVkdVc2VFbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUocGFyZW50SW50ZXJmYWNlUHJvdG90eXBlKTtcbiAgICBpZiAoXCJpbnN0YW5jZVJvb3RcIiBpbiB1c2VFbGVtZW50KSB7XG4gICAgICBtaXhpbihTVkdVc2VFbGVtZW50LnByb3RvdHlwZSwge1xuICAgICAgICBnZXQgaW5zdGFuY2VSb290KCkge1xuICAgICAgICAgIHJldHVybiB3cmFwKHVud3JhcCh0aGlzKS5pbnN0YW5jZVJvb3QpO1xuICAgICAgICB9LFxuICAgICAgICBnZXQgYW5pbWF0ZWRJbnN0YW5jZVJvb3QoKSB7XG4gICAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmFuaW1hdGVkSW5zdGFuY2VSb290KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbFNWR1VzZUVsZW1lbnQsIFNWR1VzZUVsZW1lbnQsIHVzZUVsZW1lbnQpO1xuICAgIHNjb3BlLndyYXBwZXJzLlNWR1VzZUVsZW1lbnQgPSBTVkdVc2VFbGVtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgRXZlbnRUYXJnZXQgPSBzY29wZS53cmFwcGVycy5FdmVudFRhcmdldDtcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbFNWR0VsZW1lbnRJbnN0YW5jZSA9IHdpbmRvdy5TVkdFbGVtZW50SW5zdGFuY2U7XG4gICAgaWYgKCFPcmlnaW5hbFNWR0VsZW1lbnRJbnN0YW5jZSkgcmV0dXJuO1xuICAgIGZ1bmN0aW9uIFNWR0VsZW1lbnRJbnN0YW5jZShpbXBsKSB7XG4gICAgICBFdmVudFRhcmdldC5jYWxsKHRoaXMsIGltcGwpO1xuICAgIH1cbiAgICBTVkdFbGVtZW50SW5zdGFuY2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFdmVudFRhcmdldC5wcm90b3R5cGUpO1xuICAgIG1peGluKFNWR0VsZW1lbnRJbnN0YW5jZS5wcm90b3R5cGUsIHtcbiAgICAgIGdldCBjb3JyZXNwb25kaW5nRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmNvcnJlc3BvbmRpbmdFbGVtZW50KTtcbiAgICAgIH0sXG4gICAgICBnZXQgY29ycmVzcG9uZGluZ1VzZUVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5jb3JyZXNwb25kaW5nVXNlRWxlbWVudCk7XG4gICAgICB9LFxuICAgICAgZ2V0IHBhcmVudE5vZGUoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5wYXJlbnROb2RlKTtcbiAgICAgIH0sXG4gICAgICBnZXQgY2hpbGROb2RlcygpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICAgICAgfSxcbiAgICAgIGdldCBmaXJzdENoaWxkKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuZmlyc3RDaGlsZCk7XG4gICAgICB9LFxuICAgICAgZ2V0IGxhc3RDaGlsZCgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmxhc3RDaGlsZCk7XG4gICAgICB9LFxuICAgICAgZ2V0IHByZXZpb3VzU2libGluZygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLnByZXZpb3VzU2libGluZyk7XG4gICAgICB9LFxuICAgICAgZ2V0IG5leHRTaWJsaW5nKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykubmV4dFNpYmxpbmcpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbFNWR0VsZW1lbnRJbnN0YW5jZSwgU1ZHRWxlbWVudEluc3RhbmNlKTtcbiAgICBzY29wZS53cmFwcGVycy5TVkdFbGVtZW50SW5zdGFuY2UgPSBTVkdFbGVtZW50SW5zdGFuY2U7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHNldFdyYXBwZXIgPSBzY29wZS5zZXRXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgdW53cmFwSWZOZWVkZWQgPSBzY29wZS51bndyYXBJZk5lZWRlZDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIE9yaWdpbmFsQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEID0gd2luZG93LkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcbiAgICBmdW5jdGlvbiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQoaW1wbCkge1xuICAgICAgc2V0V3JhcHBlcihpbXBsLCB0aGlzKTtcbiAgICB9XG4gICAgbWl4aW4oQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJELnByb3RvdHlwZSwge1xuICAgICAgZ2V0IGNhbnZhcygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmNhbnZhcyk7XG4gICAgICB9LFxuICAgICAgZHJhd0ltYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgYXJndW1lbnRzWzBdID0gdW53cmFwSWZOZWVkZWQoYXJndW1lbnRzWzBdKTtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLmRyYXdJbWFnZS5hcHBseSh1bnNhZmVVbndyYXAodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgICB9LFxuICAgICAgY3JlYXRlUGF0dGVybjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGFyZ3VtZW50c1swXSA9IHVud3JhcChhcmd1bWVudHNbMF0pO1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLmNyZWF0ZVBhdHRlcm4uYXBwbHkodW5zYWZlVW53cmFwKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCwgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLmdldENvbnRleHQoXCIyZFwiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEID0gQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgYWRkRm9yd2FyZGluZ1Byb3BlcnRpZXMgPSBzY29wZS5hZGRGb3J3YXJkaW5nUHJvcGVydGllcztcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBzZXRXcmFwcGVyID0gc2NvcGUuc2V0V3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXBJZk5lZWRlZCA9IHNjb3BlLnVud3JhcElmTmVlZGVkO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxXZWJHTFJlbmRlcmluZ0NvbnRleHQgPSB3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0O1xuICAgIGlmICghT3JpZ2luYWxXZWJHTFJlbmRlcmluZ0NvbnRleHQpIHJldHVybjtcbiAgICBmdW5jdGlvbiBXZWJHTFJlbmRlcmluZ0NvbnRleHQoaW1wbCkge1xuICAgICAgc2V0V3JhcHBlcihpbXBsLCB0aGlzKTtcbiAgICB9XG4gICAgbWl4aW4oV2ViR0xSZW5kZXJpbmdDb250ZXh0LnByb3RvdHlwZSwge1xuICAgICAgZ2V0IGNhbnZhcygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLmNhbnZhcyk7XG4gICAgICB9LFxuICAgICAgdGV4SW1hZ2UyRDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGFyZ3VtZW50c1s1XSA9IHVud3JhcElmTmVlZGVkKGFyZ3VtZW50c1s1XSk7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS50ZXhJbWFnZTJELmFwcGx5KHVuc2FmZVVud3JhcCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICAgIH0sXG4gICAgICB0ZXhTdWJJbWFnZTJEOiBmdW5jdGlvbigpIHtcbiAgICAgICAgYXJndW1lbnRzWzZdID0gdW53cmFwSWZOZWVkZWQoYXJndW1lbnRzWzZdKTtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnRleFN1YkltYWdlMkQuYXBwbHkodW5zYWZlVW53cmFwKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBPcmlnaW5hbFdlYkdMUmVuZGVyaW5nQ29udGV4dEJhc2UgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoT3JpZ2luYWxXZWJHTFJlbmRlcmluZ0NvbnRleHQucHJvdG90eXBlKTtcbiAgICBpZiAoT3JpZ2luYWxXZWJHTFJlbmRlcmluZ0NvbnRleHRCYXNlICE9PSBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgICBhZGRGb3J3YXJkaW5nUHJvcGVydGllcyhPcmlnaW5hbFdlYkdMUmVuZGVyaW5nQ29udGV4dEJhc2UsIFdlYkdMUmVuZGVyaW5nQ29udGV4dC5wcm90b3R5cGUpO1xuICAgIH1cbiAgICB2YXIgaW5zdGFuY2VQcm9wZXJ0aWVzID0gL1dlYktpdC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSA/IHtcbiAgICAgIGRyYXdpbmdCdWZmZXJIZWlnaHQ6IG51bGwsXG4gICAgICBkcmF3aW5nQnVmZmVyV2lkdGg6IG51bGxcbiAgICB9IDoge307XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsV2ViR0xSZW5kZXJpbmdDb250ZXh0LCBXZWJHTFJlbmRlcmluZ0NvbnRleHQsIGluc3RhbmNlUHJvcGVydGllcyk7XG4gICAgc2NvcGUud3JhcHBlcnMuV2ViR0xSZW5kZXJpbmdDb250ZXh0ID0gV2ViR0xSZW5kZXJpbmdDb250ZXh0O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgTm9kZSA9IHNjb3BlLndyYXBwZXJzLk5vZGU7XG4gICAgdmFyIEdldEVsZW1lbnRzQnlJbnRlcmZhY2UgPSBzY29wZS5HZXRFbGVtZW50c0J5SW50ZXJmYWNlO1xuICAgIHZhciBOb25FbGVtZW50UGFyZW50Tm9kZUludGVyZmFjZSA9IHNjb3BlLk5vbkVsZW1lbnRQYXJlbnROb2RlSW50ZXJmYWNlO1xuICAgIHZhciBQYXJlbnROb2RlSW50ZXJmYWNlID0gc2NvcGUuUGFyZW50Tm9kZUludGVyZmFjZTtcbiAgICB2YXIgU2VsZWN0b3JzSW50ZXJmYWNlID0gc2NvcGUuU2VsZWN0b3JzSW50ZXJmYWNlO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3Rlck9iamVjdCA9IHNjb3BlLnJlZ2lzdGVyT2JqZWN0O1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIE9yaWdpbmFsRG9jdW1lbnRGcmFnbWVudCA9IHdpbmRvdy5Eb2N1bWVudEZyYWdtZW50O1xuICAgIGZ1bmN0aW9uIERvY3VtZW50RnJhZ21lbnQobm9kZSkge1xuICAgICAgTm9kZS5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIH1cbiAgICBEb2N1bWVudEZyYWdtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTm9kZS5wcm90b3R5cGUpO1xuICAgIG1peGluKERvY3VtZW50RnJhZ21lbnQucHJvdG90eXBlLCBQYXJlbnROb2RlSW50ZXJmYWNlKTtcbiAgICBtaXhpbihEb2N1bWVudEZyYWdtZW50LnByb3RvdHlwZSwgU2VsZWN0b3JzSW50ZXJmYWNlKTtcbiAgICBtaXhpbihEb2N1bWVudEZyYWdtZW50LnByb3RvdHlwZSwgR2V0RWxlbWVudHNCeUludGVyZmFjZSk7XG4gICAgbWl4aW4oRG9jdW1lbnRGcmFnbWVudC5wcm90b3R5cGUsIE5vbkVsZW1lbnRQYXJlbnROb2RlSW50ZXJmYWNlKTtcbiAgICByZWdpc3RlcldyYXBwZXIoT3JpZ2luYWxEb2N1bWVudEZyYWdtZW50LCBEb2N1bWVudEZyYWdtZW50LCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpO1xuICAgIHNjb3BlLndyYXBwZXJzLkRvY3VtZW50RnJhZ21lbnQgPSBEb2N1bWVudEZyYWdtZW50O1xuICAgIHZhciBDb21tZW50ID0gcmVnaXN0ZXJPYmplY3QoZG9jdW1lbnQuY3JlYXRlQ29tbWVudChcIlwiKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuQ29tbWVudCA9IENvbW1lbnQ7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBEb2N1bWVudEZyYWdtZW50ID0gc2NvcGUud3JhcHBlcnMuRG9jdW1lbnRGcmFnbWVudDtcbiAgICB2YXIgVHJlZVNjb3BlID0gc2NvcGUuVHJlZVNjb3BlO1xuICAgIHZhciBlbGVtZW50RnJvbVBvaW50ID0gc2NvcGUuZWxlbWVudEZyb21Qb2ludDtcbiAgICB2YXIgZ2V0SW5uZXJIVE1MID0gc2NvcGUuZ2V0SW5uZXJIVE1MO1xuICAgIHZhciBnZXRUcmVlU2NvcGUgPSBzY29wZS5nZXRUcmVlU2NvcGU7XG4gICAgdmFyIG1peGluID0gc2NvcGUubWl4aW47XG4gICAgdmFyIHJld3JhcCA9IHNjb3BlLnJld3JhcDtcbiAgICB2YXIgc2V0SW5uZXJIVE1MID0gc2NvcGUuc2V0SW5uZXJIVE1MO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIHNoYWRvd0hvc3RUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIG5leHRPbGRlclNoYWRvd1RyZWVUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgZnVuY3Rpb24gU2hhZG93Um9vdChob3N0V3JhcHBlcikge1xuICAgICAgdmFyIG5vZGUgPSB1bndyYXAodW5zYWZlVW53cmFwKGhvc3RXcmFwcGVyKS5vd25lckRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSk7XG4gICAgICBEb2N1bWVudEZyYWdtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgICByZXdyYXAobm9kZSwgdGhpcyk7XG4gICAgICB2YXIgb2xkU2hhZG93Um9vdCA9IGhvc3RXcmFwcGVyLnNoYWRvd1Jvb3Q7XG4gICAgICBuZXh0T2xkZXJTaGFkb3dUcmVlVGFibGUuc2V0KHRoaXMsIG9sZFNoYWRvd1Jvb3QpO1xuICAgICAgdGhpcy50cmVlU2NvcGVfID0gbmV3IFRyZWVTY29wZSh0aGlzLCBnZXRUcmVlU2NvcGUob2xkU2hhZG93Um9vdCB8fCBob3N0V3JhcHBlcikpO1xuICAgICAgc2hhZG93SG9zdFRhYmxlLnNldCh0aGlzLCBob3N0V3JhcHBlcik7XG4gICAgfVxuICAgIFNoYWRvd1Jvb3QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShEb2N1bWVudEZyYWdtZW50LnByb3RvdHlwZSk7XG4gICAgbWl4aW4oU2hhZG93Um9vdC5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiBTaGFkb3dSb290LFxuICAgICAgZ2V0IGlubmVySFRNTCgpIHtcbiAgICAgICAgcmV0dXJuIGdldElubmVySFRNTCh0aGlzKTtcbiAgICAgIH0sXG4gICAgICBzZXQgaW5uZXJIVE1MKHZhbHVlKSB7XG4gICAgICAgIHNldElubmVySFRNTCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyKCk7XG4gICAgICB9LFxuICAgICAgZ2V0IG9sZGVyU2hhZG93Um9vdCgpIHtcbiAgICAgICAgcmV0dXJuIG5leHRPbGRlclNoYWRvd1RyZWVUYWJsZS5nZXQodGhpcykgfHwgbnVsbDtcbiAgICAgIH0sXG4gICAgICBnZXQgaG9zdCgpIHtcbiAgICAgICAgcmV0dXJuIHNoYWRvd0hvc3RUYWJsZS5nZXQodGhpcykgfHwgbnVsbDtcbiAgICAgIH0sXG4gICAgICBpbnZhbGlkYXRlU2hhZG93UmVuZGVyZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2hhZG93SG9zdFRhYmxlLmdldCh0aGlzKS5pbnZhbGlkYXRlU2hhZG93UmVuZGVyZXIoKTtcbiAgICAgIH0sXG4gICAgICBlbGVtZW50RnJvbVBvaW50OiBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50RnJvbVBvaW50KHRoaXMsIHRoaXMub3duZXJEb2N1bWVudCwgeCwgeSk7XG4gICAgICB9LFxuICAgICAgZ2V0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldFNlbGVjdGlvbigpO1xuICAgICAgfSxcbiAgICAgIGdldCBhY3RpdmVFbGVtZW50KCkge1xuICAgICAgICB2YXIgdW53cmFwcGVkQWN0aXZlRWxlbWVudCA9IHVud3JhcCh0aGlzKS5vd25lckRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgIGlmICghdW53cmFwcGVkQWN0aXZlRWxlbWVudCB8fCAhdW53cmFwcGVkQWN0aXZlRWxlbWVudC5ub2RlVHlwZSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHZhciBhY3RpdmVFbGVtZW50ID0gd3JhcCh1bndyYXBwZWRBY3RpdmVFbGVtZW50KTtcbiAgICAgICAgd2hpbGUgKCF0aGlzLmNvbnRhaW5zKGFjdGl2ZUVsZW1lbnQpKSB7XG4gICAgICAgICAgd2hpbGUgKGFjdGl2ZUVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgYWN0aXZlRWxlbWVudCA9IGFjdGl2ZUVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGFjdGl2ZUVsZW1lbnQuaG9zdCkge1xuICAgICAgICAgICAgYWN0aXZlRWxlbWVudCA9IGFjdGl2ZUVsZW1lbnQuaG9zdDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY3RpdmVFbGVtZW50O1xuICAgICAgfVxuICAgIH0pO1xuICAgIHNjb3BlLndyYXBwZXJzLlNoYWRvd1Jvb3QgPSBTaGFkb3dSb290O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciBzZXRXcmFwcGVyID0gc2NvcGUuc2V0V3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHVud3JhcElmTmVlZGVkID0gc2NvcGUudW53cmFwSWZOZWVkZWQ7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBnZXRUcmVlU2NvcGUgPSBzY29wZS5nZXRUcmVlU2NvcGU7XG4gICAgdmFyIE9yaWdpbmFsUmFuZ2UgPSB3aW5kb3cuUmFuZ2U7XG4gICAgdmFyIFNoYWRvd1Jvb3QgPSBzY29wZS53cmFwcGVycy5TaGFkb3dSb290O1xuICAgIGZ1bmN0aW9uIGdldEhvc3Qobm9kZSkge1xuICAgICAgdmFyIHJvb3QgPSBnZXRUcmVlU2NvcGUobm9kZSkucm9vdDtcbiAgICAgIGlmIChyb290IGluc3RhbmNlb2YgU2hhZG93Um9vdCkge1xuICAgICAgICByZXR1cm4gcm9vdC5ob3N0O1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhvc3ROb2RlVG9TaGFkb3dOb2RlKHJlZk5vZGUsIG9mZnNldCkge1xuICAgICAgaWYgKHJlZk5vZGUuc2hhZG93Um9vdCkge1xuICAgICAgICBvZmZzZXQgPSBNYXRoLm1pbihyZWZOb2RlLmNoaWxkTm9kZXMubGVuZ3RoIC0gMSwgb2Zmc2V0KTtcbiAgICAgICAgdmFyIGNoaWxkID0gcmVmTm9kZS5jaGlsZE5vZGVzW29mZnNldF07XG4gICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgIHZhciBpbnNlcnRpb25Qb2ludCA9IHNjb3BlLmdldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzKGNoaWxkKTtcbiAgICAgICAgICBpZiAoaW5zZXJ0aW9uUG9pbnQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBpbnNlcnRpb25Qb2ludFswXS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgaWYgKHBhcmVudE5vZGUubm9kZVR5cGUgPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgICAgcmVmTm9kZSA9IHBhcmVudE5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVmTm9kZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2hhZG93Tm9kZVRvSG9zdE5vZGUobm9kZSkge1xuICAgICAgbm9kZSA9IHdyYXAobm9kZSk7XG4gICAgICByZXR1cm4gZ2V0SG9zdChub2RlKSB8fCBub2RlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBSYW5nZShpbXBsKSB7XG4gICAgICBzZXRXcmFwcGVyKGltcGwsIHRoaXMpO1xuICAgIH1cbiAgICBSYW5nZS5wcm90b3R5cGUgPSB7XG4gICAgICBnZXQgc3RhcnRDb250YWluZXIoKSB7XG4gICAgICAgIHJldHVybiBzaGFkb3dOb2RlVG9Ib3N0Tm9kZSh1bnNhZmVVbndyYXAodGhpcykuc3RhcnRDb250YWluZXIpO1xuICAgICAgfSxcbiAgICAgIGdldCBlbmRDb250YWluZXIoKSB7XG4gICAgICAgIHJldHVybiBzaGFkb3dOb2RlVG9Ib3N0Tm9kZSh1bnNhZmVVbndyYXAodGhpcykuZW5kQ29udGFpbmVyKTtcbiAgICAgIH0sXG4gICAgICBnZXQgY29tbW9uQW5jZXN0b3JDb250YWluZXIoKSB7XG4gICAgICAgIHJldHVybiBzaGFkb3dOb2RlVG9Ib3N0Tm9kZSh1bnNhZmVVbndyYXAodGhpcykuY29tbW9uQW5jZXN0b3JDb250YWluZXIpO1xuICAgICAgfSxcbiAgICAgIHNldFN0YXJ0OiBmdW5jdGlvbihyZWZOb2RlLCBvZmZzZXQpIHtcbiAgICAgICAgcmVmTm9kZSA9IGhvc3ROb2RlVG9TaGFkb3dOb2RlKHJlZk5vZGUsIG9mZnNldCk7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5zZXRTdGFydCh1bndyYXBJZk5lZWRlZChyZWZOb2RlKSwgb2Zmc2V0KTtcbiAgICAgIH0sXG4gICAgICBzZXRFbmQ6IGZ1bmN0aW9uKHJlZk5vZGUsIG9mZnNldCkge1xuICAgICAgICByZWZOb2RlID0gaG9zdE5vZGVUb1NoYWRvd05vZGUocmVmTm9kZSwgb2Zmc2V0KTtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnNldEVuZCh1bndyYXBJZk5lZWRlZChyZWZOb2RlKSwgb2Zmc2V0KTtcbiAgICAgIH0sXG4gICAgICBzZXRTdGFydEJlZm9yZTogZnVuY3Rpb24ocmVmTm9kZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuc2V0U3RhcnRCZWZvcmUodW53cmFwSWZOZWVkZWQocmVmTm9kZSkpO1xuICAgICAgfSxcbiAgICAgIHNldFN0YXJ0QWZ0ZXI6IGZ1bmN0aW9uKHJlZk5vZGUpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnNldFN0YXJ0QWZ0ZXIodW53cmFwSWZOZWVkZWQocmVmTm9kZSkpO1xuICAgICAgfSxcbiAgICAgIHNldEVuZEJlZm9yZTogZnVuY3Rpb24ocmVmTm9kZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuc2V0RW5kQmVmb3JlKHVud3JhcElmTmVlZGVkKHJlZk5vZGUpKTtcbiAgICAgIH0sXG4gICAgICBzZXRFbmRBZnRlcjogZnVuY3Rpb24ocmVmTm9kZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuc2V0RW5kQWZ0ZXIodW53cmFwSWZOZWVkZWQocmVmTm9kZSkpO1xuICAgICAgfSxcbiAgICAgIHNlbGVjdE5vZGU6IGZ1bmN0aW9uKHJlZk5vZGUpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnNlbGVjdE5vZGUodW53cmFwSWZOZWVkZWQocmVmTm9kZSkpO1xuICAgICAgfSxcbiAgICAgIHNlbGVjdE5vZGVDb250ZW50czogZnVuY3Rpb24ocmVmTm9kZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuc2VsZWN0Tm9kZUNvbnRlbnRzKHVud3JhcElmTmVlZGVkKHJlZk5vZGUpKTtcbiAgICAgIH0sXG4gICAgICBjb21wYXJlQm91bmRhcnlQb2ludHM6IGZ1bmN0aW9uKGhvdywgc291cmNlUmFuZ2UpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5jb21wYXJlQm91bmRhcnlQb2ludHMoaG93LCB1bndyYXAoc291cmNlUmFuZ2UpKTtcbiAgICAgIH0sXG4gICAgICBleHRyYWN0Q29udGVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuZXh0cmFjdENvbnRlbnRzKCkpO1xuICAgICAgfSxcbiAgICAgIGNsb25lQ29udGVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuY2xvbmVDb250ZW50cygpKTtcbiAgICAgIH0sXG4gICAgICBpbnNlcnROb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5pbnNlcnROb2RlKHVud3JhcElmTmVlZGVkKG5vZGUpKTtcbiAgICAgIH0sXG4gICAgICBzdXJyb3VuZENvbnRlbnRzOiBmdW5jdGlvbihuZXdQYXJlbnQpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLnN1cnJvdW5kQ29udGVudHModW53cmFwSWZOZWVkZWQobmV3UGFyZW50KSk7XG4gICAgICB9LFxuICAgICAgY2xvbmVSYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5jbG9uZVJhbmdlKCkpO1xuICAgICAgfSxcbiAgICAgIGlzUG9pbnRJblJhbmdlOiBmdW5jdGlvbihub2RlLCBvZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5pc1BvaW50SW5SYW5nZSh1bndyYXBJZk5lZWRlZChub2RlKSwgb2Zmc2V0KTtcbiAgICAgIH0sXG4gICAgICBjb21wYXJlUG9pbnQ6IGZ1bmN0aW9uKG5vZGUsIG9mZnNldCkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLmNvbXBhcmVQb2ludCh1bndyYXBJZk5lZWRlZChub2RlKSwgb2Zmc2V0KTtcbiAgICAgIH0sXG4gICAgICBpbnRlcnNlY3RzTm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICByZXR1cm4gdW5zYWZlVW53cmFwKHRoaXMpLmludGVyc2VjdHNOb2RlKHVud3JhcElmTmVlZGVkKG5vZGUpKTtcbiAgICAgIH0sXG4gICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykudG9TdHJpbmcoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGlmIChPcmlnaW5hbFJhbmdlLnByb3RvdHlwZS5jcmVhdGVDb250ZXh0dWFsRnJhZ21lbnQpIHtcbiAgICAgIFJhbmdlLnByb3RvdHlwZS5jcmVhdGVDb250ZXh0dWFsRnJhZ21lbnQgPSBmdW5jdGlvbihodG1sKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5jcmVhdGVDb250ZXh0dWFsRnJhZ21lbnQoaHRtbCkpO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmVnaXN0ZXJXcmFwcGVyKHdpbmRvdy5SYW5nZSwgUmFuZ2UsIGRvY3VtZW50LmNyZWF0ZVJhbmdlKCkpO1xuICAgIHNjb3BlLndyYXBwZXJzLlJhbmdlID0gUmFuZ2U7XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuRWxlbWVudDtcbiAgICB2YXIgSFRNTENvbnRlbnRFbGVtZW50ID0gc2NvcGUud3JhcHBlcnMuSFRNTENvbnRlbnRFbGVtZW50O1xuICAgIHZhciBIVE1MU2hhZG93RWxlbWVudCA9IHNjb3BlLndyYXBwZXJzLkhUTUxTaGFkb3dFbGVtZW50O1xuICAgIHZhciBOb2RlID0gc2NvcGUud3JhcHBlcnMuTm9kZTtcbiAgICB2YXIgU2hhZG93Um9vdCA9IHNjb3BlLndyYXBwZXJzLlNoYWRvd1Jvb3Q7XG4gICAgdmFyIGFzc2VydCA9IHNjb3BlLmFzc2VydDtcbiAgICB2YXIgZ2V0VHJlZVNjb3BlID0gc2NvcGUuZ2V0VHJlZVNjb3BlO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciBvbmVPZiA9IHNjb3BlLm9uZU9mO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIEFycmF5U3BsaWNlID0gc2NvcGUuQXJyYXlTcGxpY2U7XG4gICAgZnVuY3Rpb24gdXBkYXRlV3JhcHBlclVwQW5kU2lkZXdheXMod3JhcHBlcikge1xuICAgICAgd3JhcHBlci5wcmV2aW91c1NpYmxpbmdfID0gd3JhcHBlci5wcmV2aW91c1NpYmxpbmc7XG4gICAgICB3cmFwcGVyLm5leHRTaWJsaW5nXyA9IHdyYXBwZXIubmV4dFNpYmxpbmc7XG4gICAgICB3cmFwcGVyLnBhcmVudE5vZGVfID0gd3JhcHBlci5wYXJlbnROb2RlO1xuICAgIH1cbiAgICBmdW5jdGlvbiB1cGRhdGVXcmFwcGVyRG93bih3cmFwcGVyKSB7XG4gICAgICB3cmFwcGVyLmZpcnN0Q2hpbGRfID0gd3JhcHBlci5maXJzdENoaWxkO1xuICAgICAgd3JhcHBlci5sYXN0Q2hpbGRfID0gd3JhcHBlci5sYXN0Q2hpbGQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZUFsbENoaWxkTm9kZXMocGFyZW50Tm9kZVdyYXBwZXIpIHtcbiAgICAgIGFzc2VydChwYXJlbnROb2RlV3JhcHBlciBpbnN0YW5jZW9mIE5vZGUpO1xuICAgICAgZm9yICh2YXIgY2hpbGRXcmFwcGVyID0gcGFyZW50Tm9kZVdyYXBwZXIuZmlyc3RDaGlsZDsgY2hpbGRXcmFwcGVyOyBjaGlsZFdyYXBwZXIgPSBjaGlsZFdyYXBwZXIubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgdXBkYXRlV3JhcHBlclVwQW5kU2lkZXdheXMoY2hpbGRXcmFwcGVyKTtcbiAgICAgIH1cbiAgICAgIHVwZGF0ZVdyYXBwZXJEb3duKHBhcmVudE5vZGVXcmFwcGVyKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW5zZXJ0QmVmb3JlKHBhcmVudE5vZGVXcmFwcGVyLCBuZXdDaGlsZFdyYXBwZXIsIHJlZkNoaWxkV3JhcHBlcikge1xuICAgICAgdmFyIHBhcmVudE5vZGUgPSB1bndyYXAocGFyZW50Tm9kZVdyYXBwZXIpO1xuICAgICAgdmFyIG5ld0NoaWxkID0gdW53cmFwKG5ld0NoaWxkV3JhcHBlcik7XG4gICAgICB2YXIgcmVmQ2hpbGQgPSByZWZDaGlsZFdyYXBwZXIgPyB1bndyYXAocmVmQ2hpbGRXcmFwcGVyKSA6IG51bGw7XG4gICAgICByZW1vdmUobmV3Q2hpbGRXcmFwcGVyKTtcbiAgICAgIHVwZGF0ZVdyYXBwZXJVcEFuZFNpZGV3YXlzKG5ld0NoaWxkV3JhcHBlcik7XG4gICAgICBpZiAoIXJlZkNoaWxkV3JhcHBlcikge1xuICAgICAgICBwYXJlbnROb2RlV3JhcHBlci5sYXN0Q2hpbGRfID0gcGFyZW50Tm9kZVdyYXBwZXIubGFzdENoaWxkO1xuICAgICAgICBpZiAocGFyZW50Tm9kZVdyYXBwZXIubGFzdENoaWxkID09PSBwYXJlbnROb2RlV3JhcHBlci5maXJzdENoaWxkKSBwYXJlbnROb2RlV3JhcHBlci5maXJzdENoaWxkXyA9IHBhcmVudE5vZGVXcmFwcGVyLmZpcnN0Q2hpbGQ7XG4gICAgICAgIHZhciBsYXN0Q2hpbGRXcmFwcGVyID0gd3JhcChwYXJlbnROb2RlLmxhc3RDaGlsZCk7XG4gICAgICAgIGlmIChsYXN0Q2hpbGRXcmFwcGVyKSBsYXN0Q2hpbGRXcmFwcGVyLm5leHRTaWJsaW5nXyA9IGxhc3RDaGlsZFdyYXBwZXIubmV4dFNpYmxpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocGFyZW50Tm9kZVdyYXBwZXIuZmlyc3RDaGlsZCA9PT0gcmVmQ2hpbGRXcmFwcGVyKSBwYXJlbnROb2RlV3JhcHBlci5maXJzdENoaWxkXyA9IHJlZkNoaWxkV3JhcHBlcjtcbiAgICAgICAgcmVmQ2hpbGRXcmFwcGVyLnByZXZpb3VzU2libGluZ18gPSByZWZDaGlsZFdyYXBwZXIucHJldmlvdXNTaWJsaW5nO1xuICAgICAgfVxuICAgICAgc2NvcGUub3JpZ2luYWxJbnNlcnRCZWZvcmUuY2FsbChwYXJlbnROb2RlLCBuZXdDaGlsZCwgcmVmQ2hpbGQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmUobm9kZVdyYXBwZXIpIHtcbiAgICAgIHZhciBub2RlID0gdW53cmFwKG5vZGVXcmFwcGVyKTtcbiAgICAgIHZhciBwYXJlbnROb2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgaWYgKCFwYXJlbnROb2RlKSByZXR1cm47XG4gICAgICB2YXIgcGFyZW50Tm9kZVdyYXBwZXIgPSB3cmFwKHBhcmVudE5vZGUpO1xuICAgICAgdXBkYXRlV3JhcHBlclVwQW5kU2lkZXdheXMobm9kZVdyYXBwZXIpO1xuICAgICAgaWYgKG5vZGVXcmFwcGVyLnByZXZpb3VzU2libGluZykgbm9kZVdyYXBwZXIucHJldmlvdXNTaWJsaW5nLm5leHRTaWJsaW5nXyA9IG5vZGVXcmFwcGVyO1xuICAgICAgaWYgKG5vZGVXcmFwcGVyLm5leHRTaWJsaW5nKSBub2RlV3JhcHBlci5uZXh0U2libGluZy5wcmV2aW91c1NpYmxpbmdfID0gbm9kZVdyYXBwZXI7XG4gICAgICBpZiAocGFyZW50Tm9kZVdyYXBwZXIubGFzdENoaWxkID09PSBub2RlV3JhcHBlcikgcGFyZW50Tm9kZVdyYXBwZXIubGFzdENoaWxkXyA9IG5vZGVXcmFwcGVyO1xuICAgICAgaWYgKHBhcmVudE5vZGVXcmFwcGVyLmZpcnN0Q2hpbGQgPT09IG5vZGVXcmFwcGVyKSBwYXJlbnROb2RlV3JhcHBlci5maXJzdENoaWxkXyA9IG5vZGVXcmFwcGVyO1xuICAgICAgc2NvcGUub3JpZ2luYWxSZW1vdmVDaGlsZC5jYWxsKHBhcmVudE5vZGUsIG5vZGUpO1xuICAgIH1cbiAgICB2YXIgZGlzdHJpYnV0ZWROb2Rlc1RhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB2YXIgZGVzdGluYXRpb25JbnNlcnRpb25Qb2ludHNUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgdmFyIHJlbmRlcmVyRm9ySG9zdFRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICBmdW5jdGlvbiByZXNldERpc3RyaWJ1dGVkTm9kZXMoaW5zZXJ0aW9uUG9pbnQpIHtcbiAgICAgIGRpc3RyaWJ1dGVkTm9kZXNUYWJsZS5zZXQoaW5zZXJ0aW9uUG9pbnQsIFtdKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0RGlzdHJpYnV0ZWROb2RlcyhpbnNlcnRpb25Qb2ludCkge1xuICAgICAgdmFyIHJ2ID0gZGlzdHJpYnV0ZWROb2Rlc1RhYmxlLmdldChpbnNlcnRpb25Qb2ludCk7XG4gICAgICBpZiAoIXJ2KSBkaXN0cmlidXRlZE5vZGVzVGFibGUuc2V0KGluc2VydGlvblBvaW50LCBydiA9IFtdKTtcbiAgICAgIHJldHVybiBydjtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0Q2hpbGROb2Rlc1NuYXBzaG90KG5vZGUpIHtcbiAgICAgIHZhciByZXN1bHQgPSBbXSwgaSA9IDA7XG4gICAgICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgcmVzdWx0W2krK10gPSBjaGlsZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHZhciByZXF1ZXN0ID0gb25lT2Yod2luZG93LCBbIFwicmVxdWVzdEFuaW1hdGlvbkZyYW1lXCIsIFwibW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lXCIsIFwid2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lXCIsIFwic2V0VGltZW91dFwiIF0pO1xuICAgIHZhciBwZW5kaW5nRGlydHlSZW5kZXJlcnMgPSBbXTtcbiAgICB2YXIgcmVuZGVyVGltZXI7XG4gICAgZnVuY3Rpb24gcmVuZGVyQWxsUGVuZGluZygpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGVuZGluZ0RpcnR5UmVuZGVyZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciByZW5kZXJlciA9IHBlbmRpbmdEaXJ0eVJlbmRlcmVyc1tpXTtcbiAgICAgICAgdmFyIHBhcmVudFJlbmRlcmVyID0gcmVuZGVyZXIucGFyZW50UmVuZGVyZXI7XG4gICAgICAgIGlmIChwYXJlbnRSZW5kZXJlciAmJiBwYXJlbnRSZW5kZXJlci5kaXJ0eSkgY29udGludWU7XG4gICAgICAgIHJlbmRlcmVyLnJlbmRlcigpO1xuICAgICAgfVxuICAgICAgcGVuZGluZ0RpcnR5UmVuZGVyZXJzID0gW107XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlcXVlc3RBbmltYXRpb25GcmFtZSgpIHtcbiAgICAgIHJlbmRlclRpbWVyID0gbnVsbDtcbiAgICAgIHJlbmRlckFsbFBlbmRpbmcoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0UmVuZGVyZXJGb3JIb3N0KGhvc3QpIHtcbiAgICAgIHZhciByZW5kZXJlciA9IHJlbmRlcmVyRm9ySG9zdFRhYmxlLmdldChob3N0KTtcbiAgICAgIGlmICghcmVuZGVyZXIpIHtcbiAgICAgICAgcmVuZGVyZXIgPSBuZXcgU2hhZG93UmVuZGVyZXIoaG9zdCk7XG4gICAgICAgIHJlbmRlcmVyRm9ySG9zdFRhYmxlLnNldChob3N0LCByZW5kZXJlcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVuZGVyZXI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFNoYWRvd1Jvb3RBbmNlc3Rvcihub2RlKSB7XG4gICAgICB2YXIgcm9vdCA9IGdldFRyZWVTY29wZShub2RlKS5yb290O1xuICAgICAgaWYgKHJvb3QgaW5zdGFuY2VvZiBTaGFkb3dSb290KSByZXR1cm4gcm9vdDtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRSZW5kZXJlckZvclNoYWRvd1Jvb3Qoc2hhZG93Um9vdCkge1xuICAgICAgcmV0dXJuIGdldFJlbmRlcmVyRm9ySG9zdChzaGFkb3dSb290Lmhvc3QpO1xuICAgIH1cbiAgICB2YXIgc3BsaWNlRGlmZiA9IG5ldyBBcnJheVNwbGljZSgpO1xuICAgIHNwbGljZURpZmYuZXF1YWxzID0gZnVuY3Rpb24ocmVuZGVyTm9kZSwgcmF3Tm9kZSkge1xuICAgICAgcmV0dXJuIHVud3JhcChyZW5kZXJOb2RlLm5vZGUpID09PSByYXdOb2RlO1xuICAgIH07XG4gICAgZnVuY3Rpb24gUmVuZGVyTm9kZShub2RlKSB7XG4gICAgICB0aGlzLnNraXAgPSBmYWxzZTtcbiAgICAgIHRoaXMubm9kZSA9IG5vZGU7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMgPSBbXTtcbiAgICB9XG4gICAgUmVuZGVyTm9kZS5wcm90b3R5cGUgPSB7XG4gICAgICBhcHBlbmQ6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIHJ2ID0gbmV3IFJlbmRlck5vZGUobm9kZSk7XG4gICAgICAgIHRoaXMuY2hpbGROb2Rlcy5wdXNoKHJ2KTtcbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgfSxcbiAgICAgIHN5bmM6IGZ1bmN0aW9uKG9wdF9hZGRlZCkge1xuICAgICAgICBpZiAodGhpcy5za2lwKSByZXR1cm47XG4gICAgICAgIHZhciBub2RlV3JhcHBlciA9IHRoaXMubm9kZTtcbiAgICAgICAgdmFyIG5ld0NoaWxkcmVuID0gdGhpcy5jaGlsZE5vZGVzO1xuICAgICAgICB2YXIgb2xkQ2hpbGRyZW4gPSBnZXRDaGlsZE5vZGVzU25hcHNob3QodW53cmFwKG5vZGVXcmFwcGVyKSk7XG4gICAgICAgIHZhciBhZGRlZCA9IG9wdF9hZGRlZCB8fCBuZXcgV2Vha01hcCgpO1xuICAgICAgICB2YXIgc3BsaWNlcyA9IHNwbGljZURpZmYuY2FsY3VsYXRlU3BsaWNlcyhuZXdDaGlsZHJlbiwgb2xkQ2hpbGRyZW4pO1xuICAgICAgICB2YXIgbmV3SW5kZXggPSAwLCBvbGRJbmRleCA9IDA7XG4gICAgICAgIHZhciBsYXN0SW5kZXggPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwbGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgc3BsaWNlID0gc3BsaWNlc1tpXTtcbiAgICAgICAgICBmb3IgKDtsYXN0SW5kZXggPCBzcGxpY2UuaW5kZXg7IGxhc3RJbmRleCsrKSB7XG4gICAgICAgICAgICBvbGRJbmRleCsrO1xuICAgICAgICAgICAgbmV3Q2hpbGRyZW5bbmV3SW5kZXgrK10uc3luYyhhZGRlZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciByZW1vdmVkQ291bnQgPSBzcGxpY2UucmVtb3ZlZC5sZW5ndGg7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZW1vdmVkQ291bnQ7IGorKykge1xuICAgICAgICAgICAgdmFyIHdyYXBwZXIgPSB3cmFwKG9sZENoaWxkcmVuW29sZEluZGV4KytdKTtcbiAgICAgICAgICAgIGlmICghYWRkZWQuZ2V0KHdyYXBwZXIpKSByZW1vdmUod3JhcHBlcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBhZGRlZENvdW50ID0gc3BsaWNlLmFkZGVkQ291bnQ7XG4gICAgICAgICAgdmFyIHJlZk5vZGUgPSBvbGRDaGlsZHJlbltvbGRJbmRleF0gJiYgd3JhcChvbGRDaGlsZHJlbltvbGRJbmRleF0pO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYWRkZWRDb3VudDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgbmV3Q2hpbGRSZW5kZXJOb2RlID0gbmV3Q2hpbGRyZW5bbmV3SW5kZXgrK107XG4gICAgICAgICAgICB2YXIgbmV3Q2hpbGRXcmFwcGVyID0gbmV3Q2hpbGRSZW5kZXJOb2RlLm5vZGU7XG4gICAgICAgICAgICBpbnNlcnRCZWZvcmUobm9kZVdyYXBwZXIsIG5ld0NoaWxkV3JhcHBlciwgcmVmTm9kZSk7XG4gICAgICAgICAgICBhZGRlZC5zZXQobmV3Q2hpbGRXcmFwcGVyLCB0cnVlKTtcbiAgICAgICAgICAgIG5ld0NoaWxkUmVuZGVyTm9kZS5zeW5jKGFkZGVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbGFzdEluZGV4ICs9IGFkZGVkQ291bnQ7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IGxhc3RJbmRleDsgaSA8IG5ld0NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbmV3Q2hpbGRyZW5baV0uc3luYyhhZGRlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIFNoYWRvd1JlbmRlcmVyKGhvc3QpIHtcbiAgICAgIHRoaXMuaG9zdCA9IGhvc3Q7XG4gICAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICAgICB0aGlzLmludmFsaWRhdGVBdHRyaWJ1dGVzKCk7XG4gICAgICB0aGlzLmFzc29jaWF0ZU5vZGUoaG9zdCk7XG4gICAgfVxuICAgIFNoYWRvd1JlbmRlcmVyLnByb3RvdHlwZSA9IHtcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24ob3B0X3JlbmRlck5vZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRpcnR5KSByZXR1cm47XG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZUF0dHJpYnV0ZXMoKTtcbiAgICAgICAgdmFyIGhvc3QgPSB0aGlzLmhvc3Q7XG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uKGhvc3QpO1xuICAgICAgICB2YXIgcmVuZGVyTm9kZSA9IG9wdF9yZW5kZXJOb2RlIHx8IG5ldyBSZW5kZXJOb2RlKGhvc3QpO1xuICAgICAgICB0aGlzLmJ1aWxkUmVuZGVyVHJlZShyZW5kZXJOb2RlLCBob3N0KTtcbiAgICAgICAgdmFyIHRvcE1vc3RSZW5kZXJlciA9ICFvcHRfcmVuZGVyTm9kZTtcbiAgICAgICAgaWYgKHRvcE1vc3RSZW5kZXJlcikgcmVuZGVyTm9kZS5zeW5jKCk7XG4gICAgICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgICAgIH0sXG4gICAgICBnZXQgcGFyZW50UmVuZGVyZXIoKSB7XG4gICAgICAgIHJldHVybiBnZXRUcmVlU2NvcGUodGhpcy5ob3N0KS5yZW5kZXJlcjtcbiAgICAgIH0sXG4gICAgICBpbnZhbGlkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRpcnR5KSB7XG4gICAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgICAgICAgdmFyIHBhcmVudFJlbmRlcmVyID0gdGhpcy5wYXJlbnRSZW5kZXJlcjtcbiAgICAgICAgICBpZiAocGFyZW50UmVuZGVyZXIpIHBhcmVudFJlbmRlcmVyLmludmFsaWRhdGUoKTtcbiAgICAgICAgICBwZW5kaW5nRGlydHlSZW5kZXJlcnMucHVzaCh0aGlzKTtcbiAgICAgICAgICBpZiAocmVuZGVyVGltZXIpIHJldHVybjtcbiAgICAgICAgICByZW5kZXJUaW1lciA9IHdpbmRvd1tyZXF1ZXN0XShoYW5kbGVSZXF1ZXN0QW5pbWF0aW9uRnJhbWUsIDApO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZGlzdHJpYnV0aW9uOiBmdW5jdGlvbihyb290KSB7XG4gICAgICAgIHRoaXMucmVzZXRBbGxTdWJ0cmVlcyhyb290KTtcbiAgICAgICAgdGhpcy5kaXN0cmlidXRpb25SZXNvbHV0aW9uKHJvb3QpO1xuICAgICAgfSxcbiAgICAgIHJlc2V0QWxsOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIGlmIChpc0luc2VydGlvblBvaW50KG5vZGUpKSByZXNldERpc3RyaWJ1dGVkTm9kZXMobm9kZSk7IGVsc2UgcmVzZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyhub2RlKTtcbiAgICAgICAgdGhpcy5yZXNldEFsbFN1YnRyZWVzKG5vZGUpO1xuICAgICAgfSxcbiAgICAgIHJlc2V0QWxsU3VidHJlZXM6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgdGhpcy5yZXNldEFsbChjaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc2hhZG93Um9vdCkgdGhpcy5yZXNldEFsbChub2RlLnNoYWRvd1Jvb3QpO1xuICAgICAgICBpZiAobm9kZS5vbGRlclNoYWRvd1Jvb3QpIHRoaXMucmVzZXRBbGwobm9kZS5vbGRlclNoYWRvd1Jvb3QpO1xuICAgICAgfSxcbiAgICAgIGRpc3RyaWJ1dGlvblJlc29sdXRpb246IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgaWYgKGlzU2hhZG93SG9zdChub2RlKSkge1xuICAgICAgICAgIHZhciBzaGFkb3dIb3N0ID0gbm9kZTtcbiAgICAgICAgICB2YXIgcG9vbCA9IHBvb2xQb3B1bGF0aW9uKHNoYWRvd0hvc3QpO1xuICAgICAgICAgIHZhciBzaGFkb3dUcmVlcyA9IGdldFNoYWRvd1RyZWVzKHNoYWRvd0hvc3QpO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2hhZG93VHJlZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMucG9vbERpc3RyaWJ1dGlvbihzaGFkb3dUcmVlc1tpXSwgcG9vbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAodmFyIGkgPSBzaGFkb3dUcmVlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdmFyIHNoYWRvd1RyZWUgPSBzaGFkb3dUcmVlc1tpXTtcbiAgICAgICAgICAgIHZhciBzaGFkb3cgPSBnZXRTaGFkb3dJbnNlcnRpb25Qb2ludChzaGFkb3dUcmVlKTtcbiAgICAgICAgICAgIGlmIChzaGFkb3cpIHtcbiAgICAgICAgICAgICAgdmFyIG9sZGVyU2hhZG93Um9vdCA9IHNoYWRvd1RyZWUub2xkZXJTaGFkb3dSb290O1xuICAgICAgICAgICAgICBpZiAob2xkZXJTaGFkb3dSb290KSB7XG4gICAgICAgICAgICAgICAgcG9vbCA9IHBvb2xQb3B1bGF0aW9uKG9sZGVyU2hhZG93Um9vdCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwb29sLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZGVzdHJpYnV0ZU5vZGVJbnRvKHBvb2xbal0sIHNoYWRvdyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uUmVzb2x1dGlvbihzaGFkb3dUcmVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25SZXNvbHV0aW9uKGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHBvb2xEaXN0cmlidXRpb246IGZ1bmN0aW9uKG5vZGUsIHBvb2wpIHtcbiAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBIVE1MU2hhZG93RWxlbWVudCkgcmV0dXJuO1xuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEhUTUxDb250ZW50RWxlbWVudCkge1xuICAgICAgICAgIHZhciBjb250ZW50ID0gbm9kZTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZURlcGVuZGVudEF0dHJpYnV0ZXMoY29udGVudC5nZXRBdHRyaWJ1dGUoXCJzZWxlY3RcIikpO1xuICAgICAgICAgIHZhciBhbnlEaXN0cmlidXRlZCA9IGZhbHNlO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9vbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSBwb29sW2ldO1xuICAgICAgICAgICAgaWYgKCFub2RlKSBjb250aW51ZTtcbiAgICAgICAgICAgIGlmIChtYXRjaGVzKG5vZGUsIGNvbnRlbnQpKSB7XG4gICAgICAgICAgICAgIGRlc3RyaWJ1dGVOb2RlSW50byhub2RlLCBjb250ZW50KTtcbiAgICAgICAgICAgICAgcG9vbFtpXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgYW55RGlzdHJpYnV0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWFueURpc3RyaWJ1dGVkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBjaGlsZCA9IGNvbnRlbnQuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICAgICAgZGVzdHJpYnV0ZU5vZGVJbnRvKGNoaWxkLCBjb250ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgIHRoaXMucG9vbERpc3RyaWJ1dGlvbihjaGlsZCwgcG9vbCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBidWlsZFJlbmRlclRyZWU6IGZ1bmN0aW9uKHJlbmRlck5vZGUsIG5vZGUpIHtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5jb21wb3NlKG5vZGUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgdmFyIGNoaWxkUmVuZGVyTm9kZSA9IHJlbmRlck5vZGUuYXBwZW5kKGNoaWxkKTtcbiAgICAgICAgICB0aGlzLmJ1aWxkUmVuZGVyVHJlZShjaGlsZFJlbmRlck5vZGUsIGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTaGFkb3dIb3N0KG5vZGUpKSB7XG4gICAgICAgICAgdmFyIHJlbmRlcmVyID0gZ2V0UmVuZGVyZXJGb3JIb3N0KG5vZGUpO1xuICAgICAgICAgIHJlbmRlcmVyLmRpcnR5ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBjb21wb3NlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IFtdO1xuICAgICAgICB2YXIgcCA9IG5vZGUuc2hhZG93Um9vdCB8fCBub2RlO1xuICAgICAgICBmb3IgKHZhciBjaGlsZCA9IHAuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICBpZiAoaXNJbnNlcnRpb25Qb2ludChjaGlsZCkpIHtcbiAgICAgICAgICAgIHRoaXMuYXNzb2NpYXRlTm9kZShwKTtcbiAgICAgICAgICAgIHZhciBkaXN0cmlidXRlZE5vZGVzID0gZ2V0RGlzdHJpYnV0ZWROb2RlcyhjaGlsZCk7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRpc3RyaWJ1dGVkTm9kZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgdmFyIGRpc3RyaWJ1dGVkTm9kZSA9IGRpc3RyaWJ1dGVkTm9kZXNbal07XG4gICAgICAgICAgICAgIGlmIChpc0ZpbmFsRGVzdGluYXRpb24oY2hpbGQsIGRpc3RyaWJ1dGVkTm9kZSkpIGNoaWxkcmVuLnB1c2goZGlzdHJpYnV0ZWROb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGlsZHJlbjtcbiAgICAgIH0sXG4gICAgICBpbnZhbGlkYXRlQXR0cmlidXRlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICB9LFxuICAgICAgdXBkYXRlRGVwZW5kZW50QXR0cmlidXRlczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFzZWxlY3RvcikgcmV0dXJuO1xuICAgICAgICB2YXIgYXR0cmlidXRlcyA9IHRoaXMuYXR0cmlidXRlcztcbiAgICAgICAgaWYgKC9cXC5cXHcrLy50ZXN0KHNlbGVjdG9yKSkgYXR0cmlidXRlc1tcImNsYXNzXCJdID0gdHJ1ZTtcbiAgICAgICAgaWYgKC8jXFx3Ky8udGVzdChzZWxlY3RvcikpIGF0dHJpYnV0ZXNbXCJpZFwiXSA9IHRydWU7XG4gICAgICAgIHNlbGVjdG9yLnJlcGxhY2UoL1xcW1xccyooW15cXHM9XFx8flxcXV0rKS9nLCBmdW5jdGlvbihfLCBuYW1lKSB7XG4gICAgICAgICAgYXR0cmlidXRlc1tuYW1lXSA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIGRlcGVuZHNPbkF0dHJpYnV0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzW25hbWVdO1xuICAgICAgfSxcbiAgICAgIGFzc29jaWF0ZU5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKG5vZGUpLnBvbHltZXJTaGFkb3dSZW5kZXJlcl8gPSB0aGlzO1xuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gcG9vbFBvcHVsYXRpb24obm9kZSkge1xuICAgICAgdmFyIHBvb2wgPSBbXTtcbiAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICBpZiAoaXNJbnNlcnRpb25Qb2ludChjaGlsZCkpIHtcbiAgICAgICAgICBwb29sLnB1c2guYXBwbHkocG9vbCwgZ2V0RGlzdHJpYnV0ZWROb2RlcyhjaGlsZCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBvb2wucHVzaChjaGlsZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBwb29sO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRTaGFkb3dJbnNlcnRpb25Qb2ludChub2RlKSB7XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEhUTUxTaGFkb3dFbGVtZW50KSByZXR1cm4gbm9kZTtcbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgSFRNTENvbnRlbnRFbGVtZW50KSByZXR1cm4gbnVsbDtcbiAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICB2YXIgcmVzID0gZ2V0U2hhZG93SW5zZXJ0aW9uUG9pbnQoY2hpbGQpO1xuICAgICAgICBpZiAocmVzKSByZXR1cm4gcmVzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRlc3RyaWJ1dGVOb2RlSW50byhjaGlsZCwgaW5zZXJ0aW9uUG9pbnQpIHtcbiAgICAgIGdldERpc3RyaWJ1dGVkTm9kZXMoaW5zZXJ0aW9uUG9pbnQpLnB1c2goY2hpbGQpO1xuICAgICAgdmFyIHBvaW50cyA9IGRlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzVGFibGUuZ2V0KGNoaWxkKTtcbiAgICAgIGlmICghcG9pbnRzKSBkZXN0aW5hdGlvbkluc2VydGlvblBvaW50c1RhYmxlLnNldChjaGlsZCwgWyBpbnNlcnRpb25Qb2ludCBdKTsgZWxzZSBwb2ludHMucHVzaChpbnNlcnRpb25Qb2ludCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzKG5vZGUpIHtcbiAgICAgIHJldHVybiBkZXN0aW5hdGlvbkluc2VydGlvblBvaW50c1RhYmxlLmdldChub2RlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVzZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyhub2RlKSB7XG4gICAgICBkZXN0aW5hdGlvbkluc2VydGlvblBvaW50c1RhYmxlLnNldChub2RlLCB1bmRlZmluZWQpO1xuICAgIH1cbiAgICB2YXIgc2VsZWN0b3JTdGFydENoYXJSZSA9IC9eKDpub3RcXCgpP1sqLiNbYS16QS1aX3xdLztcbiAgICBmdW5jdGlvbiBtYXRjaGVzKG5vZGUsIGNvbnRlbnRFbGVtZW50KSB7XG4gICAgICB2YXIgc2VsZWN0ID0gY29udGVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKFwic2VsZWN0XCIpO1xuICAgICAgaWYgKCFzZWxlY3QpIHJldHVybiB0cnVlO1xuICAgICAgc2VsZWN0ID0gc2VsZWN0LnRyaW0oKTtcbiAgICAgIGlmICghc2VsZWN0KSByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmICghKG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKCFzZWxlY3RvclN0YXJ0Q2hhclJlLnRlc3Qoc2VsZWN0KSkgcmV0dXJuIGZhbHNlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG5vZGUubWF0Y2hlcyhzZWxlY3QpO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBpc0ZpbmFsRGVzdGluYXRpb24oaW5zZXJ0aW9uUG9pbnQsIG5vZGUpIHtcbiAgICAgIHZhciBwb2ludHMgPSBnZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyhub2RlKTtcbiAgICAgIHJldHVybiBwb2ludHMgJiYgcG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXSA9PT0gaW5zZXJ0aW9uUG9pbnQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzSW5zZXJ0aW9uUG9pbnQobm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiBIVE1MQ29udGVudEVsZW1lbnQgfHwgbm9kZSBpbnN0YW5jZW9mIEhUTUxTaGFkb3dFbGVtZW50O1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc1NoYWRvd0hvc3Qoc2hhZG93SG9zdCkge1xuICAgICAgcmV0dXJuIHNoYWRvd0hvc3Quc2hhZG93Um9vdDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0U2hhZG93VHJlZXMoaG9zdCkge1xuICAgICAgdmFyIHRyZWVzID0gW107XG4gICAgICBmb3IgKHZhciB0cmVlID0gaG9zdC5zaGFkb3dSb290OyB0cmVlOyB0cmVlID0gdHJlZS5vbGRlclNoYWRvd1Jvb3QpIHtcbiAgICAgICAgdHJlZXMucHVzaCh0cmVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cmVlcztcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVuZGVyKGhvc3QpIHtcbiAgICAgIG5ldyBTaGFkb3dSZW5kZXJlcihob3N0KS5yZW5kZXIoKTtcbiAgICB9XG4gICAgTm9kZS5wcm90b3R5cGUuaW52YWxpZGF0ZVNoYWRvd1JlbmRlcmVyID0gZnVuY3Rpb24oZm9yY2UpIHtcbiAgICAgIHZhciByZW5kZXJlciA9IHVuc2FmZVVud3JhcCh0aGlzKS5wb2x5bWVyU2hhZG93UmVuZGVyZXJfO1xuICAgICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgIHJlbmRlcmVyLmludmFsaWRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBIVE1MQ29udGVudEVsZW1lbnQucHJvdG90eXBlLmdldERpc3RyaWJ1dGVkTm9kZXMgPSBIVE1MU2hhZG93RWxlbWVudC5wcm90b3R5cGUuZ2V0RGlzdHJpYnV0ZWROb2RlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgcmV0dXJuIGdldERpc3RyaWJ1dGVkTm9kZXModGhpcyk7XG4gICAgfTtcbiAgICBFbGVtZW50LnByb3RvdHlwZS5nZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgcmV0dXJuIGdldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzKHRoaXMpIHx8IFtdO1xuICAgIH07XG4gICAgSFRNTENvbnRlbnRFbGVtZW50LnByb3RvdHlwZS5ub2RlSXNJbnNlcnRlZF8gPSBIVE1MU2hhZG93RWxlbWVudC5wcm90b3R5cGUubm9kZUlzSW5zZXJ0ZWRfID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmludmFsaWRhdGVTaGFkb3dSZW5kZXJlcigpO1xuICAgICAgdmFyIHNoYWRvd1Jvb3QgPSBnZXRTaGFkb3dSb290QW5jZXN0b3IodGhpcyk7XG4gICAgICB2YXIgcmVuZGVyZXI7XG4gICAgICBpZiAoc2hhZG93Um9vdCkgcmVuZGVyZXIgPSBnZXRSZW5kZXJlckZvclNoYWRvd1Jvb3Qoc2hhZG93Um9vdCk7XG4gICAgICB1bnNhZmVVbndyYXAodGhpcykucG9seW1lclNoYWRvd1JlbmRlcmVyXyA9IHJlbmRlcmVyO1xuICAgICAgaWYgKHJlbmRlcmVyKSByZW5kZXJlci5pbnZhbGlkYXRlKCk7XG4gICAgfTtcbiAgICBzY29wZS5nZXRSZW5kZXJlckZvckhvc3QgPSBnZXRSZW5kZXJlckZvckhvc3Q7XG4gICAgc2NvcGUuZ2V0U2hhZG93VHJlZXMgPSBnZXRTaGFkb3dUcmVlcztcbiAgICBzY29wZS5yZW5kZXJBbGxQZW5kaW5nID0gcmVuZGVyQWxsUGVuZGluZztcbiAgICBzY29wZS5nZXREZXN0aW5hdGlvbkluc2VydGlvblBvaW50cyA9IGdldERlc3RpbmF0aW9uSW5zZXJ0aW9uUG9pbnRzO1xuICAgIHNjb3BlLnZpc3VhbCA9IHtcbiAgICAgIGluc2VydEJlZm9yZTogaW5zZXJ0QmVmb3JlLFxuICAgICAgcmVtb3ZlOiByZW1vdmVcbiAgICB9O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgSFRNTEVsZW1lbnQgPSBzY29wZS53cmFwcGVycy5IVE1MRWxlbWVudDtcbiAgICB2YXIgYXNzZXJ0ID0gc2NvcGUuYXNzZXJ0O1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgd3JhcCA9IHNjb3BlLndyYXA7XG4gICAgdmFyIGVsZW1lbnRzV2l0aEZvcm1Qcm9wZXJ0eSA9IFsgXCJIVE1MQnV0dG9uRWxlbWVudFwiLCBcIkhUTUxGaWVsZFNldEVsZW1lbnRcIiwgXCJIVE1MSW5wdXRFbGVtZW50XCIsIFwiSFRNTEtleWdlbkVsZW1lbnRcIiwgXCJIVE1MTGFiZWxFbGVtZW50XCIsIFwiSFRNTExlZ2VuZEVsZW1lbnRcIiwgXCJIVE1MT2JqZWN0RWxlbWVudFwiLCBcIkhUTUxPdXRwdXRFbGVtZW50XCIsIFwiSFRNTFRleHRBcmVhRWxlbWVudFwiIF07XG4gICAgZnVuY3Rpb24gY3JlYXRlV3JhcHBlckNvbnN0cnVjdG9yKG5hbWUpIHtcbiAgICAgIGlmICghd2luZG93W25hbWVdKSByZXR1cm47XG4gICAgICBhc3NlcnQoIXNjb3BlLndyYXBwZXJzW25hbWVdKTtcbiAgICAgIHZhciBHZW5lcmF0ZWRXcmFwcGVyID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBIVE1MRWxlbWVudC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgICAgfTtcbiAgICAgIEdlbmVyYXRlZFdyYXBwZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgICAgbWl4aW4oR2VuZXJhdGVkV3JhcHBlci5wcm90b3R5cGUsIHtcbiAgICAgICAgZ2V0IGZvcm0oKSB7XG4gICAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmZvcm0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJlZ2lzdGVyV3JhcHBlcih3aW5kb3dbbmFtZV0sIEdlbmVyYXRlZFdyYXBwZXIsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZS5zbGljZSg0LCAtNykpKTtcbiAgICAgIHNjb3BlLndyYXBwZXJzW25hbWVdID0gR2VuZXJhdGVkV3JhcHBlcjtcbiAgICB9XG4gICAgZWxlbWVudHNXaXRoRm9ybVByb3BlcnR5LmZvckVhY2goY3JlYXRlV3JhcHBlckNvbnN0cnVjdG9yKTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgc2V0V3JhcHBlciA9IHNjb3BlLnNldFdyYXBwZXI7XG4gICAgdmFyIHVuc2FmZVVud3JhcCA9IHNjb3BlLnVuc2FmZVVud3JhcDtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciB1bndyYXBJZk5lZWRlZCA9IHNjb3BlLnVud3JhcElmTmVlZGVkO1xuICAgIHZhciB3cmFwID0gc2NvcGUud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxTZWxlY3Rpb24gPSB3aW5kb3cuU2VsZWN0aW9uO1xuICAgIGZ1bmN0aW9uIFNlbGVjdGlvbihpbXBsKSB7XG4gICAgICBzZXRXcmFwcGVyKGltcGwsIHRoaXMpO1xuICAgIH1cbiAgICBTZWxlY3Rpb24ucHJvdG90eXBlID0ge1xuICAgICAgZ2V0IGFuY2hvck5vZGUoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5hbmNob3JOb2RlKTtcbiAgICAgIH0sXG4gICAgICBnZXQgZm9jdXNOb2RlKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuZm9jdXNOb2RlKTtcbiAgICAgIH0sXG4gICAgICBhZGRSYW5nZTogZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLmFkZFJhbmdlKHVud3JhcElmTmVlZGVkKHJhbmdlKSk7XG4gICAgICB9LFxuICAgICAgY29sbGFwc2U6IGZ1bmN0aW9uKG5vZGUsIGluZGV4KSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5jb2xsYXBzZSh1bndyYXBJZk5lZWRlZChub2RlKSwgaW5kZXgpO1xuICAgICAgfSxcbiAgICAgIGNvbnRhaW5zTm9kZTogZnVuY3Rpb24obm9kZSwgYWxsb3dQYXJ0aWFsKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykuY29udGFpbnNOb2RlKHVud3JhcElmTmVlZGVkKG5vZGUpLCBhbGxvd1BhcnRpYWwpO1xuICAgICAgfSxcbiAgICAgIGdldFJhbmdlQXQ6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5nZXRSYW5nZUF0KGluZGV4KSk7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlUmFuZ2U6IGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgIHVuc2FmZVVud3JhcCh0aGlzKS5yZW1vdmVSYW5nZSh1bndyYXAocmFuZ2UpKTtcbiAgICAgIH0sXG4gICAgICBzZWxlY3RBbGxDaGlsZHJlbjogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuc2VsZWN0QWxsQ2hpbGRyZW4obm9kZSBpbnN0YW5jZW9mIFNoYWRvd1Jvb3QgPyB1bnNhZmVVbndyYXAobm9kZS5ob3N0KSA6IHVud3JhcElmTmVlZGVkKG5vZGUpKTtcbiAgICAgIH0sXG4gICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB1bnNhZmVVbndyYXAodGhpcykudG9TdHJpbmcoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGlmIChPcmlnaW5hbFNlbGVjdGlvbi5wcm90b3R5cGUuZXh0ZW5kKSB7XG4gICAgICBTZWxlY3Rpb24ucHJvdG90eXBlLmV4dGVuZCA9IGZ1bmN0aW9uKG5vZGUsIG9mZnNldCkge1xuICAgICAgICB1bnNhZmVVbndyYXAodGhpcykuZXh0ZW5kKHVud3JhcElmTmVlZGVkKG5vZGUpLCBvZmZzZXQpO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmVnaXN0ZXJXcmFwcGVyKHdpbmRvdy5TZWxlY3Rpb24sIFNlbGVjdGlvbiwgd2luZG93LmdldFNlbGVjdGlvbigpKTtcbiAgICBzY29wZS53cmFwcGVycy5TZWxlY3Rpb24gPSBTZWxlY3Rpb247XG4gIH0pKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCk7XG4gIChmdW5jdGlvbihzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHNldFdyYXBwZXIgPSBzY29wZS5zZXRXcmFwcGVyO1xuICAgIHZhciB1bnNhZmVVbndyYXAgPSBzY29wZS51bnNhZmVVbndyYXA7XG4gICAgdmFyIHVud3JhcElmTmVlZGVkID0gc2NvcGUudW53cmFwSWZOZWVkZWQ7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbFRyZWVXYWxrZXIgPSB3aW5kb3cuVHJlZVdhbGtlcjtcbiAgICBmdW5jdGlvbiBUcmVlV2Fsa2VyKGltcGwpIHtcbiAgICAgIHNldFdyYXBwZXIoaW1wbCwgdGhpcyk7XG4gICAgfVxuICAgIFRyZWVXYWxrZXIucHJvdG90eXBlID0ge1xuICAgICAgZ2V0IHJvb3QoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5yb290KTtcbiAgICAgIH0sXG4gICAgICBnZXQgY3VycmVudE5vZGUoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5jdXJyZW50Tm9kZSk7XG4gICAgICB9LFxuICAgICAgc2V0IGN1cnJlbnROb2RlKG5vZGUpIHtcbiAgICAgICAgdW5zYWZlVW53cmFwKHRoaXMpLmN1cnJlbnROb2RlID0gdW53cmFwSWZOZWVkZWQobm9kZSk7XG4gICAgICB9LFxuICAgICAgZ2V0IGZpbHRlcigpIHtcbiAgICAgICAgcmV0dXJuIHVuc2FmZVVud3JhcCh0aGlzKS5maWx0ZXI7XG4gICAgICB9LFxuICAgICAgcGFyZW50Tm9kZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5wYXJlbnROb2RlKCkpO1xuICAgICAgfSxcbiAgICAgIGZpcnN0Q2hpbGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykuZmlyc3RDaGlsZCgpKTtcbiAgICAgIH0sXG4gICAgICBsYXN0Q2hpbGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh1bnNhZmVVbndyYXAodGhpcykubGFzdENoaWxkKCkpO1xuICAgICAgfSxcbiAgICAgIHByZXZpb3VzU2libGluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5wcmV2aW91c1NpYmxpbmcoKSk7XG4gICAgICB9LFxuICAgICAgcHJldmlvdXNOb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW5zYWZlVW53cmFwKHRoaXMpLnByZXZpb3VzTm9kZSgpKTtcbiAgICAgIH0sXG4gICAgICBuZXh0Tm9kZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHVuc2FmZVVud3JhcCh0aGlzKS5uZXh0Tm9kZSgpKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbFRyZWVXYWxrZXIsIFRyZWVXYWxrZXIpO1xuICAgIHNjb3BlLndyYXBwZXJzLlRyZWVXYWxrZXIgPSBUcmVlV2Fsa2VyO1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgR2V0RWxlbWVudHNCeUludGVyZmFjZSA9IHNjb3BlLkdldEVsZW1lbnRzQnlJbnRlcmZhY2U7XG4gICAgdmFyIE5vZGUgPSBzY29wZS53cmFwcGVycy5Ob2RlO1xuICAgIHZhciBQYXJlbnROb2RlSW50ZXJmYWNlID0gc2NvcGUuUGFyZW50Tm9kZUludGVyZmFjZTtcbiAgICB2YXIgTm9uRWxlbWVudFBhcmVudE5vZGVJbnRlcmZhY2UgPSBzY29wZS5Ob25FbGVtZW50UGFyZW50Tm9kZUludGVyZmFjZTtcbiAgICB2YXIgU2VsZWN0aW9uID0gc2NvcGUud3JhcHBlcnMuU2VsZWN0aW9uO1xuICAgIHZhciBTZWxlY3RvcnNJbnRlcmZhY2UgPSBzY29wZS5TZWxlY3RvcnNJbnRlcmZhY2U7XG4gICAgdmFyIFNoYWRvd1Jvb3QgPSBzY29wZS53cmFwcGVycy5TaGFkb3dSb290O1xuICAgIHZhciBUcmVlU2NvcGUgPSBzY29wZS5UcmVlU2NvcGU7XG4gICAgdmFyIGNsb25lTm9kZSA9IHNjb3BlLmNsb25lTm9kZTtcbiAgICB2YXIgZGVmaW5lR2V0dGVyID0gc2NvcGUuZGVmaW5lR2V0dGVyO1xuICAgIHZhciBkZWZpbmVXcmFwR2V0dGVyID0gc2NvcGUuZGVmaW5lV3JhcEdldHRlcjtcbiAgICB2YXIgZWxlbWVudEZyb21Qb2ludCA9IHNjb3BlLmVsZW1lbnRGcm9tUG9pbnQ7XG4gICAgdmFyIGZvcndhcmRNZXRob2RzVG9XcmFwcGVyID0gc2NvcGUuZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXI7XG4gICAgdmFyIG1hdGNoZXNOYW1lcyA9IHNjb3BlLm1hdGNoZXNOYW1lcztcbiAgICB2YXIgbWl4aW4gPSBzY29wZS5taXhpbjtcbiAgICB2YXIgcmVnaXN0ZXJXcmFwcGVyID0gc2NvcGUucmVnaXN0ZXJXcmFwcGVyO1xuICAgIHZhciByZW5kZXJBbGxQZW5kaW5nID0gc2NvcGUucmVuZGVyQWxsUGVuZGluZztcbiAgICB2YXIgcmV3cmFwID0gc2NvcGUucmV3cmFwO1xuICAgIHZhciBzZXRXcmFwcGVyID0gc2NvcGUuc2V0V3JhcHBlcjtcbiAgICB2YXIgdW5zYWZlVW53cmFwID0gc2NvcGUudW5zYWZlVW53cmFwO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciB3cmFwRXZlbnRUYXJnZXRNZXRob2RzID0gc2NvcGUud3JhcEV2ZW50VGFyZ2V0TWV0aG9kcztcbiAgICB2YXIgd3JhcE5vZGVMaXN0ID0gc2NvcGUud3JhcE5vZGVMaXN0O1xuICAgIHZhciBpbXBsZW1lbnRhdGlvblRhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgICBmdW5jdGlvbiBEb2N1bWVudChub2RlKSB7XG4gICAgICBOb2RlLmNhbGwodGhpcywgbm9kZSk7XG4gICAgICB0aGlzLnRyZWVTY29wZV8gPSBuZXcgVHJlZVNjb3BlKHRoaXMsIG51bGwpO1xuICAgIH1cbiAgICBEb2N1bWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE5vZGUucHJvdG90eXBlKTtcbiAgICBkZWZpbmVXcmFwR2V0dGVyKERvY3VtZW50LCBcImRvY3VtZW50RWxlbWVudFwiKTtcbiAgICBkZWZpbmVXcmFwR2V0dGVyKERvY3VtZW50LCBcImJvZHlcIik7XG4gICAgZGVmaW5lV3JhcEdldHRlcihEb2N1bWVudCwgXCJoZWFkXCIpO1xuICAgIGRlZmluZUdldHRlcihEb2N1bWVudCwgXCJhY3RpdmVFbGVtZW50XCIsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHVud3JhcHBlZEFjdGl2ZUVsZW1lbnQgPSB1bndyYXAodGhpcykuYWN0aXZlRWxlbWVudDtcbiAgICAgIGlmICghdW53cmFwcGVkQWN0aXZlRWxlbWVudCB8fCAhdW53cmFwcGVkQWN0aXZlRWxlbWVudC5ub2RlVHlwZSkgcmV0dXJuIG51bGw7XG4gICAgICB2YXIgYWN0aXZlRWxlbWVudCA9IHdyYXAodW53cmFwcGVkQWN0aXZlRWxlbWVudCk7XG4gICAgICB3aGlsZSAoIXRoaXMuY29udGFpbnMoYWN0aXZlRWxlbWVudCkpIHtcbiAgICAgICAgd2hpbGUgKGFjdGl2ZUVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgIGFjdGl2ZUVsZW1lbnQgPSBhY3RpdmVFbGVtZW50LnBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFjdGl2ZUVsZW1lbnQuaG9zdCkge1xuICAgICAgICAgIGFjdGl2ZUVsZW1lbnQgPSBhY3RpdmVFbGVtZW50Lmhvc3Q7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBhY3RpdmVFbGVtZW50O1xuICAgIH0pO1xuICAgIGZ1bmN0aW9uIHdyYXBNZXRob2QobmFtZSkge1xuICAgICAgdmFyIG9yaWdpbmFsID0gZG9jdW1lbnRbbmFtZV07XG4gICAgICBEb2N1bWVudC5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAob3JpZ2luYWwuYXBwbHkodW5zYWZlVW53cmFwKHRoaXMpLCBhcmd1bWVudHMpKTtcbiAgICAgIH07XG4gICAgfVxuICAgIFsgXCJjcmVhdGVDb21tZW50XCIsIFwiY3JlYXRlRG9jdW1lbnRGcmFnbWVudFwiLCBcImNyZWF0ZUVsZW1lbnRcIiwgXCJjcmVhdGVFbGVtZW50TlNcIiwgXCJjcmVhdGVFdmVudFwiLCBcImNyZWF0ZUV2ZW50TlNcIiwgXCJjcmVhdGVSYW5nZVwiLCBcImNyZWF0ZVRleHROb2RlXCIgXS5mb3JFYWNoKHdyYXBNZXRob2QpO1xuICAgIHZhciBvcmlnaW5hbEFkb3B0Tm9kZSA9IGRvY3VtZW50LmFkb3B0Tm9kZTtcbiAgICBmdW5jdGlvbiBhZG9wdE5vZGVOb1JlbW92ZShub2RlLCBkb2MpIHtcbiAgICAgIG9yaWdpbmFsQWRvcHROb2RlLmNhbGwodW5zYWZlVW53cmFwKGRvYyksIHVud3JhcChub2RlKSk7XG4gICAgICBhZG9wdFN1YnRyZWUobm9kZSwgZG9jKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRvcHRTdWJ0cmVlKG5vZGUsIGRvYykge1xuICAgICAgaWYgKG5vZGUuc2hhZG93Um9vdCkgZG9jLmFkb3B0Tm9kZShub2RlLnNoYWRvd1Jvb3QpO1xuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBTaGFkb3dSb290KSBhZG9wdE9sZGVyU2hhZG93Um9vdHMobm9kZSwgZG9jKTtcbiAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICBhZG9wdFN1YnRyZWUoY2hpbGQsIGRvYyk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkb3B0T2xkZXJTaGFkb3dSb290cyhzaGFkb3dSb290LCBkb2MpIHtcbiAgICAgIHZhciBvbGRTaGFkb3dSb290ID0gc2hhZG93Um9vdC5vbGRlclNoYWRvd1Jvb3Q7XG4gICAgICBpZiAob2xkU2hhZG93Um9vdCkgZG9jLmFkb3B0Tm9kZShvbGRTaGFkb3dSb290KTtcbiAgICB9XG4gICAgdmFyIG9yaWdpbmFsR2V0U2VsZWN0aW9uID0gZG9jdW1lbnQuZ2V0U2VsZWN0aW9uO1xuICAgIG1peGluKERvY3VtZW50LnByb3RvdHlwZSwge1xuICAgICAgYWRvcHROb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIGlmIChub2RlLnBhcmVudE5vZGUpIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICAgICAgYWRvcHROb2RlTm9SZW1vdmUobm9kZSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgfSxcbiAgICAgIGVsZW1lbnRGcm9tUG9pbnQ6IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRGcm9tUG9pbnQodGhpcywgdGhpcywgeCwgeSk7XG4gICAgICB9LFxuICAgICAgaW1wb3J0Tm9kZTogZnVuY3Rpb24obm9kZSwgZGVlcCkge1xuICAgICAgICByZXR1cm4gY2xvbmVOb2RlKG5vZGUsIGRlZXAsIHVuc2FmZVVud3JhcCh0aGlzKSk7XG4gICAgICB9LFxuICAgICAgZ2V0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgICByZXR1cm4gbmV3IFNlbGVjdGlvbihvcmlnaW5hbEdldFNlbGVjdGlvbi5jYWxsKHVud3JhcCh0aGlzKSkpO1xuICAgICAgfSxcbiAgICAgIGdldEVsZW1lbnRzQnlOYW1lOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiBTZWxlY3RvcnNJbnRlcmZhY2UucXVlcnlTZWxlY3RvckFsbC5jYWxsKHRoaXMsIFwiW25hbWU9XCIgKyBKU09OLnN0cmluZ2lmeShTdHJpbmcobmFtZSkpICsgXCJdXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBvcmlnaW5hbENyZWF0ZVRyZWVXYWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyO1xuICAgIHZhciBUcmVlV2Fsa2VyV3JhcHBlciA9IHNjb3BlLndyYXBwZXJzLlRyZWVXYWxrZXI7XG4gICAgRG9jdW1lbnQucHJvdG90eXBlLmNyZWF0ZVRyZWVXYWxrZXIgPSBmdW5jdGlvbihyb290LCB3aGF0VG9TaG93LCBmaWx0ZXIsIGV4cGFuZEVudGl0eVJlZmVyZW5jZXMpIHtcbiAgICAgIHZhciBuZXdGaWx0ZXIgPSBudWxsO1xuICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICBpZiAoZmlsdGVyLmFjY2VwdE5vZGUgJiYgdHlwZW9mIGZpbHRlci5hY2NlcHROb2RlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICBuZXdGaWx0ZXIgPSB7XG4gICAgICAgICAgICBhY2NlcHROb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmaWx0ZXIuYWNjZXB0Tm9kZSh3cmFwKG5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBmaWx0ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIG5ld0ZpbHRlciA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXIod3JhcChub2RlKSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBUcmVlV2Fsa2VyV3JhcHBlcihvcmlnaW5hbENyZWF0ZVRyZWVXYWxrZXIuY2FsbCh1bndyYXAodGhpcyksIHVud3JhcChyb290KSwgd2hhdFRvU2hvdywgbmV3RmlsdGVyLCBleHBhbmRFbnRpdHlSZWZlcmVuY2VzKSk7XG4gICAgfTtcbiAgICBpZiAoZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KSB7XG4gICAgICB2YXIgb3JpZ2luYWxSZWdpc3RlckVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQ7XG4gICAgICBEb2N1bWVudC5wcm90b3R5cGUucmVnaXN0ZXJFbGVtZW50ID0gZnVuY3Rpb24odGFnTmFtZSwgb2JqZWN0KSB7XG4gICAgICAgIHZhciBwcm90b3R5cGUsIGV4dGVuZHNPcHRpb247XG4gICAgICAgIGlmIChvYmplY3QgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHByb3RvdHlwZSA9IG9iamVjdC5wcm90b3R5cGU7XG4gICAgICAgICAgZXh0ZW5kc09wdGlvbiA9IG9iamVjdC5leHRlbmRzO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcHJvdG90eXBlKSBwcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgICAgIGlmIChzY29wZS5uYXRpdmVQcm90b3R5cGVUYWJsZS5nZXQocHJvdG90eXBlKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdFN1cHBvcnRlZEVycm9yXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90b3R5cGUpO1xuICAgICAgICB2YXIgbmF0aXZlUHJvdG90eXBlO1xuICAgICAgICB2YXIgcHJvdG90eXBlcyA9IFtdO1xuICAgICAgICB3aGlsZSAocHJvdG8pIHtcbiAgICAgICAgICBuYXRpdmVQcm90b3R5cGUgPSBzY29wZS5uYXRpdmVQcm90b3R5cGVUYWJsZS5nZXQocHJvdG8pO1xuICAgICAgICAgIGlmIChuYXRpdmVQcm90b3R5cGUpIGJyZWFrO1xuICAgICAgICAgIHByb3RvdHlwZXMucHVzaChwcm90byk7XG4gICAgICAgICAgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbmF0aXZlUHJvdG90eXBlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90U3VwcG9ydGVkRXJyb3JcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5ld1Byb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobmF0aXZlUHJvdG90eXBlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IHByb3RvdHlwZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBuZXdQcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG5ld1Byb3RvdHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgWyBcImNyZWF0ZWRDYWxsYmFja1wiLCBcImF0dGFjaGVkQ2FsbGJhY2tcIiwgXCJkZXRhY2hlZENhbGxiYWNrXCIsIFwiYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrXCIgXS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICB2YXIgZiA9IHByb3RvdHlwZVtuYW1lXTtcbiAgICAgICAgICBpZiAoIWYpIHJldHVybjtcbiAgICAgICAgICBuZXdQcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICghKHdyYXAodGhpcykgaW5zdGFuY2VvZiBDdXN0b21FbGVtZW50Q29uc3RydWN0b3IpKSB7XG4gICAgICAgICAgICAgIHJld3JhcCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGYuYXBwbHkod3JhcCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHAgPSB7XG4gICAgICAgICAgcHJvdG90eXBlOiBuZXdQcm90b3R5cGVcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGV4dGVuZHNPcHRpb24pIHAuZXh0ZW5kcyA9IGV4dGVuZHNPcHRpb247XG4gICAgICAgIGZ1bmN0aW9uIEN1c3RvbUVsZW1lbnRDb25zdHJ1Y3Rvcihub2RlKSB7XG4gICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBpZiAoZXh0ZW5kc09wdGlvbikge1xuICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChleHRlbmRzT3B0aW9uLCB0YWdOYW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBzZXRXcmFwcGVyKG5vZGUsIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIEN1c3RvbUVsZW1lbnRDb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgICAgIEN1c3RvbUVsZW1lbnRDb25zdHJ1Y3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDdXN0b21FbGVtZW50Q29uc3RydWN0b3I7XG4gICAgICAgIHNjb3BlLmNvbnN0cnVjdG9yVGFibGUuc2V0KG5ld1Byb3RvdHlwZSwgQ3VzdG9tRWxlbWVudENvbnN0cnVjdG9yKTtcbiAgICAgICAgc2NvcGUubmF0aXZlUHJvdG90eXBlVGFibGUuc2V0KHByb3RvdHlwZSwgbmV3UHJvdG90eXBlKTtcbiAgICAgICAgdmFyIG5hdGl2ZUNvbnN0cnVjdG9yID0gb3JpZ2luYWxSZWdpc3RlckVsZW1lbnQuY2FsbCh1bndyYXAodGhpcyksIHRhZ05hbWUsIHApO1xuICAgICAgICByZXR1cm4gQ3VzdG9tRWxlbWVudENvbnN0cnVjdG9yO1xuICAgICAgfTtcbiAgICAgIGZvcndhcmRNZXRob2RzVG9XcmFwcGVyKFsgd2luZG93LkhUTUxEb2N1bWVudCB8fCB3aW5kb3cuRG9jdW1lbnQgXSwgWyBcInJlZ2lzdGVyRWxlbWVudFwiIF0pO1xuICAgIH1cbiAgICBmb3J3YXJkTWV0aG9kc1RvV3JhcHBlcihbIHdpbmRvdy5IVE1MQm9keUVsZW1lbnQsIHdpbmRvdy5IVE1MRG9jdW1lbnQgfHwgd2luZG93LkRvY3VtZW50LCB3aW5kb3cuSFRNTEhlYWRFbGVtZW50LCB3aW5kb3cuSFRNTEh0bWxFbGVtZW50IF0sIFsgXCJhcHBlbmRDaGlsZFwiLCBcImNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXCIsIFwiY29udGFpbnNcIiwgXCJnZXRFbGVtZW50c0J5Q2xhc3NOYW1lXCIsIFwiZ2V0RWxlbWVudHNCeVRhZ05hbWVcIiwgXCJnZXRFbGVtZW50c0J5VGFnTmFtZU5TXCIsIFwiaW5zZXJ0QmVmb3JlXCIsIFwicXVlcnlTZWxlY3RvclwiLCBcInF1ZXJ5U2VsZWN0b3JBbGxcIiwgXCJyZW1vdmVDaGlsZFwiLCBcInJlcGxhY2VDaGlsZFwiIF0pO1xuICAgIGZvcndhcmRNZXRob2RzVG9XcmFwcGVyKFsgd2luZG93LkhUTUxCb2R5RWxlbWVudCwgd2luZG93LkhUTUxIZWFkRWxlbWVudCwgd2luZG93LkhUTUxIdG1sRWxlbWVudCBdLCBtYXRjaGVzTmFtZXMpO1xuICAgIGZvcndhcmRNZXRob2RzVG9XcmFwcGVyKFsgd2luZG93LkhUTUxEb2N1bWVudCB8fCB3aW5kb3cuRG9jdW1lbnQgXSwgWyBcImFkb3B0Tm9kZVwiLCBcImltcG9ydE5vZGVcIiwgXCJjb250YWluc1wiLCBcImNyZWF0ZUNvbW1lbnRcIiwgXCJjcmVhdGVEb2N1bWVudEZyYWdtZW50XCIsIFwiY3JlYXRlRWxlbWVudFwiLCBcImNyZWF0ZUVsZW1lbnROU1wiLCBcImNyZWF0ZUV2ZW50XCIsIFwiY3JlYXRlRXZlbnROU1wiLCBcImNyZWF0ZVJhbmdlXCIsIFwiY3JlYXRlVGV4dE5vZGVcIiwgXCJjcmVhdGVUcmVlV2Fsa2VyXCIsIFwiZWxlbWVudEZyb21Qb2ludFwiLCBcImdldEVsZW1lbnRCeUlkXCIsIFwiZ2V0RWxlbWVudHNCeU5hbWVcIiwgXCJnZXRTZWxlY3Rpb25cIiBdKTtcbiAgICBtaXhpbihEb2N1bWVudC5wcm90b3R5cGUsIEdldEVsZW1lbnRzQnlJbnRlcmZhY2UpO1xuICAgIG1peGluKERvY3VtZW50LnByb3RvdHlwZSwgUGFyZW50Tm9kZUludGVyZmFjZSk7XG4gICAgbWl4aW4oRG9jdW1lbnQucHJvdG90eXBlLCBTZWxlY3RvcnNJbnRlcmZhY2UpO1xuICAgIG1peGluKERvY3VtZW50LnByb3RvdHlwZSwgTm9uRWxlbWVudFBhcmVudE5vZGVJbnRlcmZhY2UpO1xuICAgIG1peGluKERvY3VtZW50LnByb3RvdHlwZSwge1xuICAgICAgZ2V0IGltcGxlbWVudGF0aW9uKCkge1xuICAgICAgICB2YXIgaW1wbGVtZW50YXRpb24gPSBpbXBsZW1lbnRhdGlvblRhYmxlLmdldCh0aGlzKTtcbiAgICAgICAgaWYgKGltcGxlbWVudGF0aW9uKSByZXR1cm4gaW1wbGVtZW50YXRpb247XG4gICAgICAgIGltcGxlbWVudGF0aW9uID0gbmV3IERPTUltcGxlbWVudGF0aW9uKHVud3JhcCh0aGlzKS5pbXBsZW1lbnRhdGlvbik7XG4gICAgICAgIGltcGxlbWVudGF0aW9uVGFibGUuc2V0KHRoaXMsIGltcGxlbWVudGF0aW9uKTtcbiAgICAgICAgcmV0dXJuIGltcGxlbWVudGF0aW9uO1xuICAgICAgfSxcbiAgICAgIGdldCBkZWZhdWx0VmlldygpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmRlZmF1bHRWaWV3KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWdpc3RlcldyYXBwZXIod2luZG93LkRvY3VtZW50LCBEb2N1bWVudCwgZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KFwiXCIpKTtcbiAgICBpZiAod2luZG93LkhUTUxEb2N1bWVudCkgcmVnaXN0ZXJXcmFwcGVyKHdpbmRvdy5IVE1MRG9jdW1lbnQsIERvY3VtZW50KTtcbiAgICB3cmFwRXZlbnRUYXJnZXRNZXRob2RzKFsgd2luZG93LkhUTUxCb2R5RWxlbWVudCwgd2luZG93LkhUTUxEb2N1bWVudCB8fCB3aW5kb3cuRG9jdW1lbnQsIHdpbmRvdy5IVE1MSGVhZEVsZW1lbnQgXSk7XG4gICAgZnVuY3Rpb24gRE9NSW1wbGVtZW50YXRpb24oaW1wbCkge1xuICAgICAgc2V0V3JhcHBlcihpbXBsLCB0aGlzKTtcbiAgICB9XG4gICAgdmFyIG9yaWdpbmFsQ3JlYXRlRG9jdW1lbnQgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVEb2N1bWVudDtcbiAgICBET01JbXBsZW1lbnRhdGlvbi5wcm90b3R5cGUuY3JlYXRlRG9jdW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGFyZ3VtZW50c1syXSA9IHVud3JhcChhcmd1bWVudHNbMl0pO1xuICAgICAgcmV0dXJuIHdyYXAob3JpZ2luYWxDcmVhdGVEb2N1bWVudC5hcHBseSh1bnNhZmVVbndyYXAodGhpcyksIGFyZ3VtZW50cykpO1xuICAgIH07XG4gICAgZnVuY3Rpb24gd3JhcEltcGxNZXRob2QoY29uc3RydWN0b3IsIG5hbWUpIHtcbiAgICAgIHZhciBvcmlnaW5hbCA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uW25hbWVdO1xuICAgICAgY29uc3RydWN0b3IucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB3cmFwKG9yaWdpbmFsLmFwcGx5KHVuc2FmZVVud3JhcCh0aGlzKSwgYXJndW1lbnRzKSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBmb3J3YXJkSW1wbE1ldGhvZChjb25zdHJ1Y3RvciwgbmFtZSkge1xuICAgICAgdmFyIG9yaWdpbmFsID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb25bbmFtZV07XG4gICAgICBjb25zdHJ1Y3Rvci5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsLmFwcGx5KHVuc2FmZVVud3JhcCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHdyYXBJbXBsTWV0aG9kKERPTUltcGxlbWVudGF0aW9uLCBcImNyZWF0ZURvY3VtZW50VHlwZVwiKTtcbiAgICB3cmFwSW1wbE1ldGhvZChET01JbXBsZW1lbnRhdGlvbiwgXCJjcmVhdGVIVE1MRG9jdW1lbnRcIik7XG4gICAgZm9yd2FyZEltcGxNZXRob2QoRE9NSW1wbGVtZW50YXRpb24sIFwiaGFzRmVhdHVyZVwiKTtcbiAgICByZWdpc3RlcldyYXBwZXIod2luZG93LkRPTUltcGxlbWVudGF0aW9uLCBET01JbXBsZW1lbnRhdGlvbik7XG4gICAgZm9yd2FyZE1ldGhvZHNUb1dyYXBwZXIoWyB3aW5kb3cuRE9NSW1wbGVtZW50YXRpb24gXSwgWyBcImNyZWF0ZURvY3VtZW50XCIsIFwiY3JlYXRlRG9jdW1lbnRUeXBlXCIsIFwiY3JlYXRlSFRNTERvY3VtZW50XCIsIFwiaGFzRmVhdHVyZVwiIF0pO1xuICAgIHNjb3BlLmFkb3B0Tm9kZU5vUmVtb3ZlID0gYWRvcHROb2RlTm9SZW1vdmU7XG4gICAgc2NvcGUud3JhcHBlcnMuRE9NSW1wbGVtZW50YXRpb24gPSBET01JbXBsZW1lbnRhdGlvbjtcbiAgICBzY29wZS53cmFwcGVycy5Eb2N1bWVudCA9IERvY3VtZW50O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgRXZlbnRUYXJnZXQgPSBzY29wZS53cmFwcGVycy5FdmVudFRhcmdldDtcbiAgICB2YXIgU2VsZWN0aW9uID0gc2NvcGUud3JhcHBlcnMuU2VsZWN0aW9uO1xuICAgIHZhciBtaXhpbiA9IHNjb3BlLm1peGluO1xuICAgIHZhciByZWdpc3RlcldyYXBwZXIgPSBzY29wZS5yZWdpc3RlcldyYXBwZXI7XG4gICAgdmFyIHJlbmRlckFsbFBlbmRpbmcgPSBzY29wZS5yZW5kZXJBbGxQZW5kaW5nO1xuICAgIHZhciB1bndyYXAgPSBzY29wZS51bndyYXA7XG4gICAgdmFyIHVud3JhcElmTmVlZGVkID0gc2NvcGUudW53cmFwSWZOZWVkZWQ7XG4gICAgdmFyIHdyYXAgPSBzY29wZS53cmFwO1xuICAgIHZhciBPcmlnaW5hbFdpbmRvdyA9IHdpbmRvdy5XaW5kb3c7XG4gICAgdmFyIG9yaWdpbmFsR2V0Q29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlO1xuICAgIHZhciBvcmlnaW5hbEdldERlZmF1bHRDb21wdXRlZFN0eWxlID0gd2luZG93LmdldERlZmF1bHRDb21wdXRlZFN0eWxlO1xuICAgIHZhciBvcmlnaW5hbEdldFNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb247XG4gICAgZnVuY3Rpb24gV2luZG93KGltcGwpIHtcbiAgICAgIEV2ZW50VGFyZ2V0LmNhbGwodGhpcywgaW1wbCk7XG4gICAgfVxuICAgIFdpbmRvdy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50VGFyZ2V0LnByb3RvdHlwZSk7XG4gICAgT3JpZ2luYWxXaW5kb3cucHJvdG90eXBlLmdldENvbXB1dGVkU3R5bGUgPSBmdW5jdGlvbihlbCwgcHNldWRvKSB7XG4gICAgICByZXR1cm4gd3JhcCh0aGlzIHx8IHdpbmRvdykuZ2V0Q29tcHV0ZWRTdHlsZSh1bndyYXBJZk5lZWRlZChlbCksIHBzZXVkbyk7XG4gICAgfTtcbiAgICBpZiAob3JpZ2luYWxHZXREZWZhdWx0Q29tcHV0ZWRTdHlsZSkge1xuICAgICAgT3JpZ2luYWxXaW5kb3cucHJvdG90eXBlLmdldERlZmF1bHRDb21wdXRlZFN0eWxlID0gZnVuY3Rpb24oZWwsIHBzZXVkbykge1xuICAgICAgICByZXR1cm4gd3JhcCh0aGlzIHx8IHdpbmRvdykuZ2V0RGVmYXVsdENvbXB1dGVkU3R5bGUodW53cmFwSWZOZWVkZWQoZWwpLCBwc2V1ZG8pO1xuICAgICAgfTtcbiAgICB9XG4gICAgT3JpZ2luYWxXaW5kb3cucHJvdG90eXBlLmdldFNlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHdyYXAodGhpcyB8fCB3aW5kb3cpLmdldFNlbGVjdGlvbigpO1xuICAgIH07XG4gICAgZGVsZXRlIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlO1xuICAgIGRlbGV0ZSB3aW5kb3cuZ2V0RGVmYXVsdENvbXB1dGVkU3R5bGU7XG4gICAgZGVsZXRlIHdpbmRvdy5nZXRTZWxlY3Rpb247XG4gICAgWyBcImFkZEV2ZW50TGlzdGVuZXJcIiwgXCJyZW1vdmVFdmVudExpc3RlbmVyXCIsIFwiZGlzcGF0Y2hFdmVudFwiIF0uZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICBPcmlnaW5hbFdpbmRvdy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHcgPSB3cmFwKHRoaXMgfHwgd2luZG93KTtcbiAgICAgICAgcmV0dXJuIHdbbmFtZV0uYXBwbHkodywgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgICBkZWxldGUgd2luZG93W25hbWVdO1xuICAgIH0pO1xuICAgIG1peGluKFdpbmRvdy5wcm90b3R5cGUsIHtcbiAgICAgIGdldENvbXB1dGVkU3R5bGU6IGZ1bmN0aW9uKGVsLCBwc2V1ZG8pIHtcbiAgICAgICAgcmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgICByZXR1cm4gb3JpZ2luYWxHZXRDb21wdXRlZFN0eWxlLmNhbGwodW53cmFwKHRoaXMpLCB1bndyYXBJZk5lZWRlZChlbCksIHBzZXVkbyk7XG4gICAgICB9LFxuICAgICAgZ2V0U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgICByZXR1cm4gbmV3IFNlbGVjdGlvbihvcmlnaW5hbEdldFNlbGVjdGlvbi5jYWxsKHVud3JhcCh0aGlzKSkpO1xuICAgICAgfSxcbiAgICAgIGdldCBkb2N1bWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodW53cmFwKHRoaXMpLmRvY3VtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAob3JpZ2luYWxHZXREZWZhdWx0Q29tcHV0ZWRTdHlsZSkge1xuICAgICAgV2luZG93LnByb3RvdHlwZS5nZXREZWZhdWx0Q29tcHV0ZWRTdHlsZSA9IGZ1bmN0aW9uKGVsLCBwc2V1ZG8pIHtcbiAgICAgICAgcmVuZGVyQWxsUGVuZGluZygpO1xuICAgICAgICByZXR1cm4gb3JpZ2luYWxHZXREZWZhdWx0Q29tcHV0ZWRTdHlsZS5jYWxsKHVud3JhcCh0aGlzKSwgdW53cmFwSWZOZWVkZWQoZWwpLCBwc2V1ZG8pO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmVnaXN0ZXJXcmFwcGVyKE9yaWdpbmFsV2luZG93LCBXaW5kb3csIHdpbmRvdyk7XG4gICAgc2NvcGUud3JhcHBlcnMuV2luZG93ID0gV2luZG93O1xuICB9KSh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICAoZnVuY3Rpb24oc2NvcGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgdW53cmFwID0gc2NvcGUudW53cmFwO1xuICAgIHZhciBPcmlnaW5hbERhdGFUcmFuc2ZlciA9IHdpbmRvdy5EYXRhVHJhbnNmZXIgfHwgd2luZG93LkNsaXBib2FyZDtcbiAgICB2YXIgT3JpZ2luYWxEYXRhVHJhbnNmZXJTZXREcmFnSW1hZ2UgPSBPcmlnaW5hbERhdGFUcmFuc2Zlci5wcm90b3R5cGUuc2V0RHJhZ0ltYWdlO1xuICAgIGlmIChPcmlnaW5hbERhdGFUcmFuc2ZlclNldERyYWdJbWFnZSkge1xuICAgICAgT3JpZ2luYWxEYXRhVHJhbnNmZXIucHJvdG90eXBlLnNldERyYWdJbWFnZSA9IGZ1bmN0aW9uKGltYWdlLCB4LCB5KSB7XG4gICAgICAgIE9yaWdpbmFsRGF0YVRyYW5zZmVyU2V0RHJhZ0ltYWdlLmNhbGwodGhpcywgdW53cmFwKGltYWdlKSwgeCwgeSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIHJlZ2lzdGVyV3JhcHBlciA9IHNjb3BlLnJlZ2lzdGVyV3JhcHBlcjtcbiAgICB2YXIgc2V0V3JhcHBlciA9IHNjb3BlLnNldFdyYXBwZXI7XG4gICAgdmFyIHVud3JhcCA9IHNjb3BlLnVud3JhcDtcbiAgICB2YXIgT3JpZ2luYWxGb3JtRGF0YSA9IHdpbmRvdy5Gb3JtRGF0YTtcbiAgICBpZiAoIU9yaWdpbmFsRm9ybURhdGEpIHJldHVybjtcbiAgICBmdW5jdGlvbiBGb3JtRGF0YShmb3JtRWxlbWVudCkge1xuICAgICAgdmFyIGltcGw7XG4gICAgICBpZiAoZm9ybUVsZW1lbnQgaW5zdGFuY2VvZiBPcmlnaW5hbEZvcm1EYXRhKSB7XG4gICAgICAgIGltcGwgPSBmb3JtRWxlbWVudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGltcGwgPSBuZXcgT3JpZ2luYWxGb3JtRGF0YShmb3JtRWxlbWVudCAmJiB1bndyYXAoZm9ybUVsZW1lbnQpKTtcbiAgICAgIH1cbiAgICAgIHNldFdyYXBwZXIoaW1wbCwgdGhpcyk7XG4gICAgfVxuICAgIHJlZ2lzdGVyV3JhcHBlcihPcmlnaW5hbEZvcm1EYXRhLCBGb3JtRGF0YSwgbmV3IE9yaWdpbmFsRm9ybURhdGEoKSk7XG4gICAgc2NvcGUud3JhcHBlcnMuRm9ybURhdGEgPSBGb3JtRGF0YTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIHVud3JhcElmTmVlZGVkID0gc2NvcGUudW53cmFwSWZOZWVkZWQ7XG4gICAgdmFyIG9yaWdpbmFsU2VuZCA9IFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5zZW5kO1xuICAgIFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb3JpZ2luYWxTZW5kLmNhbGwodGhpcywgdW53cmFwSWZOZWVkZWQob2JqKSk7XG4gICAgfTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIGlzV3JhcHBlckZvciA9IHNjb3BlLmlzV3JhcHBlckZvcjtcbiAgICB2YXIgZWxlbWVudHMgPSB7XG4gICAgICBhOiBcIkhUTUxBbmNob3JFbGVtZW50XCIsXG4gICAgICBhcmVhOiBcIkhUTUxBcmVhRWxlbWVudFwiLFxuICAgICAgYXVkaW86IFwiSFRNTEF1ZGlvRWxlbWVudFwiLFxuICAgICAgYmFzZTogXCJIVE1MQmFzZUVsZW1lbnRcIixcbiAgICAgIGJvZHk6IFwiSFRNTEJvZHlFbGVtZW50XCIsXG4gICAgICBicjogXCJIVE1MQlJFbGVtZW50XCIsXG4gICAgICBidXR0b246IFwiSFRNTEJ1dHRvbkVsZW1lbnRcIixcbiAgICAgIGNhbnZhczogXCJIVE1MQ2FudmFzRWxlbWVudFwiLFxuICAgICAgY2FwdGlvbjogXCJIVE1MVGFibGVDYXB0aW9uRWxlbWVudFwiLFxuICAgICAgY29sOiBcIkhUTUxUYWJsZUNvbEVsZW1lbnRcIixcbiAgICAgIGNvbnRlbnQ6IFwiSFRNTENvbnRlbnRFbGVtZW50XCIsXG4gICAgICBkYXRhOiBcIkhUTUxEYXRhRWxlbWVudFwiLFxuICAgICAgZGF0YWxpc3Q6IFwiSFRNTERhdGFMaXN0RWxlbWVudFwiLFxuICAgICAgZGVsOiBcIkhUTUxNb2RFbGVtZW50XCIsXG4gICAgICBkaXI6IFwiSFRNTERpcmVjdG9yeUVsZW1lbnRcIixcbiAgICAgIGRpdjogXCJIVE1MRGl2RWxlbWVudFwiLFxuICAgICAgZGw6IFwiSFRNTERMaXN0RWxlbWVudFwiLFxuICAgICAgZW1iZWQ6IFwiSFRNTEVtYmVkRWxlbWVudFwiLFxuICAgICAgZmllbGRzZXQ6IFwiSFRNTEZpZWxkU2V0RWxlbWVudFwiLFxuICAgICAgZm9udDogXCJIVE1MRm9udEVsZW1lbnRcIixcbiAgICAgIGZvcm06IFwiSFRNTEZvcm1FbGVtZW50XCIsXG4gICAgICBmcmFtZTogXCJIVE1MRnJhbWVFbGVtZW50XCIsXG4gICAgICBmcmFtZXNldDogXCJIVE1MRnJhbWVTZXRFbGVtZW50XCIsXG4gICAgICBoMTogXCJIVE1MSGVhZGluZ0VsZW1lbnRcIixcbiAgICAgIGhlYWQ6IFwiSFRNTEhlYWRFbGVtZW50XCIsXG4gICAgICBocjogXCJIVE1MSFJFbGVtZW50XCIsXG4gICAgICBodG1sOiBcIkhUTUxIdG1sRWxlbWVudFwiLFxuICAgICAgaWZyYW1lOiBcIkhUTUxJRnJhbWVFbGVtZW50XCIsXG4gICAgICBpbWc6IFwiSFRNTEltYWdlRWxlbWVudFwiLFxuICAgICAgaW5wdXQ6IFwiSFRNTElucHV0RWxlbWVudFwiLFxuICAgICAga2V5Z2VuOiBcIkhUTUxLZXlnZW5FbGVtZW50XCIsXG4gICAgICBsYWJlbDogXCJIVE1MTGFiZWxFbGVtZW50XCIsXG4gICAgICBsZWdlbmQ6IFwiSFRNTExlZ2VuZEVsZW1lbnRcIixcbiAgICAgIGxpOiBcIkhUTUxMSUVsZW1lbnRcIixcbiAgICAgIGxpbms6IFwiSFRNTExpbmtFbGVtZW50XCIsXG4gICAgICBtYXA6IFwiSFRNTE1hcEVsZW1lbnRcIixcbiAgICAgIG1hcnF1ZWU6IFwiSFRNTE1hcnF1ZWVFbGVtZW50XCIsXG4gICAgICBtZW51OiBcIkhUTUxNZW51RWxlbWVudFwiLFxuICAgICAgbWVudWl0ZW06IFwiSFRNTE1lbnVJdGVtRWxlbWVudFwiLFxuICAgICAgbWV0YTogXCJIVE1MTWV0YUVsZW1lbnRcIixcbiAgICAgIG1ldGVyOiBcIkhUTUxNZXRlckVsZW1lbnRcIixcbiAgICAgIG9iamVjdDogXCJIVE1MT2JqZWN0RWxlbWVudFwiLFxuICAgICAgb2w6IFwiSFRNTE9MaXN0RWxlbWVudFwiLFxuICAgICAgb3B0Z3JvdXA6IFwiSFRNTE9wdEdyb3VwRWxlbWVudFwiLFxuICAgICAgb3B0aW9uOiBcIkhUTUxPcHRpb25FbGVtZW50XCIsXG4gICAgICBvdXRwdXQ6IFwiSFRNTE91dHB1dEVsZW1lbnRcIixcbiAgICAgIHA6IFwiSFRNTFBhcmFncmFwaEVsZW1lbnRcIixcbiAgICAgIHBhcmFtOiBcIkhUTUxQYXJhbUVsZW1lbnRcIixcbiAgICAgIHByZTogXCJIVE1MUHJlRWxlbWVudFwiLFxuICAgICAgcHJvZ3Jlc3M6IFwiSFRNTFByb2dyZXNzRWxlbWVudFwiLFxuICAgICAgcTogXCJIVE1MUXVvdGVFbGVtZW50XCIsXG4gICAgICBzY3JpcHQ6IFwiSFRNTFNjcmlwdEVsZW1lbnRcIixcbiAgICAgIHNlbGVjdDogXCJIVE1MU2VsZWN0RWxlbWVudFwiLFxuICAgICAgc2hhZG93OiBcIkhUTUxTaGFkb3dFbGVtZW50XCIsXG4gICAgICBzb3VyY2U6IFwiSFRNTFNvdXJjZUVsZW1lbnRcIixcbiAgICAgIHNwYW46IFwiSFRNTFNwYW5FbGVtZW50XCIsXG4gICAgICBzdHlsZTogXCJIVE1MU3R5bGVFbGVtZW50XCIsXG4gICAgICB0YWJsZTogXCJIVE1MVGFibGVFbGVtZW50XCIsXG4gICAgICB0Ym9keTogXCJIVE1MVGFibGVTZWN0aW9uRWxlbWVudFwiLFxuICAgICAgdGVtcGxhdGU6IFwiSFRNTFRlbXBsYXRlRWxlbWVudFwiLFxuICAgICAgdGV4dGFyZWE6IFwiSFRNTFRleHRBcmVhRWxlbWVudFwiLFxuICAgICAgdGhlYWQ6IFwiSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnRcIixcbiAgICAgIHRpbWU6IFwiSFRNTFRpbWVFbGVtZW50XCIsXG4gICAgICB0aXRsZTogXCJIVE1MVGl0bGVFbGVtZW50XCIsXG4gICAgICB0cjogXCJIVE1MVGFibGVSb3dFbGVtZW50XCIsXG4gICAgICB0cmFjazogXCJIVE1MVHJhY2tFbGVtZW50XCIsXG4gICAgICB1bDogXCJIVE1MVUxpc3RFbGVtZW50XCIsXG4gICAgICB2aWRlbzogXCJIVE1MVmlkZW9FbGVtZW50XCJcbiAgICB9O1xuICAgIGZ1bmN0aW9uIG92ZXJyaWRlQ29uc3RydWN0b3IodGFnTmFtZSkge1xuICAgICAgdmFyIG5hdGl2ZUNvbnN0cnVjdG9yTmFtZSA9IGVsZW1lbnRzW3RhZ05hbWVdO1xuICAgICAgdmFyIG5hdGl2ZUNvbnN0cnVjdG9yID0gd2luZG93W25hdGl2ZUNvbnN0cnVjdG9yTmFtZV07XG4gICAgICBpZiAoIW5hdGl2ZUNvbnN0cnVjdG9yKSByZXR1cm47XG4gICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG4gICAgICB2YXIgd3JhcHBlckNvbnN0cnVjdG9yID0gZWxlbWVudC5jb25zdHJ1Y3RvcjtcbiAgICAgIHdpbmRvd1tuYXRpdmVDb25zdHJ1Y3Rvck5hbWVdID0gd3JhcHBlckNvbnN0cnVjdG9yO1xuICAgIH1cbiAgICBPYmplY3Qua2V5cyhlbGVtZW50cykuZm9yRWFjaChvdmVycmlkZUNvbnN0cnVjdG9yKTtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhzY29wZS53cmFwcGVycykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICB3aW5kb3dbbmFtZV0gPSBzY29wZS53cmFwcGVyc1tuYW1lXTtcbiAgICB9KTtcbiAgfSkod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKTtcbiAgKGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgdmFyIFNoYWRvd0NTUyA9IHtcbiAgICAgIHN0cmljdFN0eWxpbmc6IGZhbHNlLFxuICAgICAgcmVnaXN0cnk6IHt9LFxuICAgICAgc2hpbVN0eWxpbmc6IGZ1bmN0aW9uKHJvb3QsIG5hbWUsIGV4dGVuZHNOYW1lKSB7XG4gICAgICAgIHZhciBzY29wZVN0eWxlcyA9IHRoaXMucHJlcGFyZVJvb3Qocm9vdCwgbmFtZSwgZXh0ZW5kc05hbWUpO1xuICAgICAgICB2YXIgdHlwZUV4dGVuc2lvbiA9IHRoaXMuaXNUeXBlRXh0ZW5zaW9uKGV4dGVuZHNOYW1lKTtcbiAgICAgICAgdmFyIHNjb3BlU2VsZWN0b3IgPSB0aGlzLm1ha2VTY29wZVNlbGVjdG9yKG5hbWUsIHR5cGVFeHRlbnNpb24pO1xuICAgICAgICB2YXIgY3NzVGV4dCA9IHN0eWxlc1RvQ3NzVGV4dChzY29wZVN0eWxlcywgdHJ1ZSk7XG4gICAgICAgIGNzc1RleHQgPSB0aGlzLnNjb3BlQ3NzVGV4dChjc3NUZXh0LCBzY29wZVNlbGVjdG9yKTtcbiAgICAgICAgaWYgKHJvb3QpIHtcbiAgICAgICAgICByb290LnNoaW1tZWRTdHlsZSA9IGNzc1RleHQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hZGRDc3NUb0RvY3VtZW50KGNzc1RleHQsIG5hbWUpO1xuICAgICAgfSxcbiAgICAgIHNoaW1TdHlsZTogZnVuY3Rpb24oc3R5bGUsIHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNoaW1Dc3NUZXh0KHN0eWxlLnRleHRDb250ZW50LCBzZWxlY3Rvcik7XG4gICAgICB9LFxuICAgICAgc2hpbUNzc1RleHQ6IGZ1bmN0aW9uKGNzc1RleHQsIHNlbGVjdG9yKSB7XG4gICAgICAgIGNzc1RleHQgPSB0aGlzLmluc2VydERpcmVjdGl2ZXMoY3NzVGV4dCk7XG4gICAgICAgIHJldHVybiB0aGlzLnNjb3BlQ3NzVGV4dChjc3NUZXh0LCBzZWxlY3Rvcik7XG4gICAgICB9LFxuICAgICAgbWFrZVNjb3BlU2VsZWN0b3I6IGZ1bmN0aW9uKG5hbWUsIHR5cGVFeHRlbnNpb24pIHtcbiAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICByZXR1cm4gdHlwZUV4dGVuc2lvbiA/IFwiW2lzPVwiICsgbmFtZSArIFwiXVwiIDogbmFtZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH0sXG4gICAgICBpc1R5cGVFeHRlbnNpb246IGZ1bmN0aW9uKGV4dGVuZHNOYW1lKSB7XG4gICAgICAgIHJldHVybiBleHRlbmRzTmFtZSAmJiBleHRlbmRzTmFtZS5pbmRleE9mKFwiLVwiKSA8IDA7XG4gICAgICB9LFxuICAgICAgcHJlcGFyZVJvb3Q6IGZ1bmN0aW9uKHJvb3QsIG5hbWUsIGV4dGVuZHNOYW1lKSB7XG4gICAgICAgIHZhciBkZWYgPSB0aGlzLnJlZ2lzdGVyUm9vdChyb290LCBuYW1lLCBleHRlbmRzTmFtZSk7XG4gICAgICAgIHRoaXMucmVwbGFjZVRleHRJblN0eWxlcyhkZWYucm9vdFN0eWxlcywgdGhpcy5pbnNlcnREaXJlY3RpdmVzKTtcbiAgICAgICAgdGhpcy5yZW1vdmVTdHlsZXMocm9vdCwgZGVmLnJvb3RTdHlsZXMpO1xuICAgICAgICBpZiAodGhpcy5zdHJpY3RTdHlsaW5nKSB7XG4gICAgICAgICAgdGhpcy5hcHBseVNjb3BlVG9Db250ZW50KHJvb3QsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWYuc2NvcGVTdHlsZXM7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlU3R5bGVzOiBmdW5jdGlvbihyb290LCBzdHlsZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBzdHlsZXMubGVuZ3RoLCBzOyBpIDwgbCAmJiAocyA9IHN0eWxlc1tpXSk7IGkrKykge1xuICAgICAgICAgIHMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHJlZ2lzdGVyUm9vdDogZnVuY3Rpb24ocm9vdCwgbmFtZSwgZXh0ZW5kc05hbWUpIHtcbiAgICAgICAgdmFyIGRlZiA9IHRoaXMucmVnaXN0cnlbbmFtZV0gPSB7XG4gICAgICAgICAgcm9vdDogcm9vdCxcbiAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgIGV4dGVuZHNOYW1lOiBleHRlbmRzTmFtZVxuICAgICAgICB9O1xuICAgICAgICB2YXIgc3R5bGVzID0gdGhpcy5maW5kU3R5bGVzKHJvb3QpO1xuICAgICAgICBkZWYucm9vdFN0eWxlcyA9IHN0eWxlcztcbiAgICAgICAgZGVmLnNjb3BlU3R5bGVzID0gZGVmLnJvb3RTdHlsZXM7XG4gICAgICAgIHZhciBleHRlbmRlZSA9IHRoaXMucmVnaXN0cnlbZGVmLmV4dGVuZHNOYW1lXTtcbiAgICAgICAgaWYgKGV4dGVuZGVlKSB7XG4gICAgICAgICAgZGVmLnNjb3BlU3R5bGVzID0gZXh0ZW5kZWUuc2NvcGVTdHlsZXMuY29uY2F0KGRlZi5zY29wZVN0eWxlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZjtcbiAgICAgIH0sXG4gICAgICBmaW5kU3R5bGVzOiBmdW5jdGlvbihyb290KSB7XG4gICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3R5bGVzID0gcm9vdC5xdWVyeVNlbGVjdG9yQWxsKFwic3R5bGVcIik7XG4gICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuZmlsdGVyLmNhbGwoc3R5bGVzLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgcmV0dXJuICFzLmhhc0F0dHJpYnV0ZShOT19TSElNX0FUVFJJQlVURSk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIGFwcGx5U2NvcGVUb0NvbnRlbnQ6IGZ1bmN0aW9uKHJvb3QsIG5hbWUpIHtcbiAgICAgICAgaWYgKHJvb3QpIHtcbiAgICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHJvb3QucXVlcnlTZWxlY3RvckFsbChcIipcIiksIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKG5hbWUsIFwiXCIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwocm9vdC5xdWVyeVNlbGVjdG9yQWxsKFwidGVtcGxhdGVcIiksIGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGx5U2NvcGVUb0NvbnRlbnQodGVtcGxhdGUuY29udGVudCwgbmFtZSk7XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBpbnNlcnREaXJlY3RpdmVzOiBmdW5jdGlvbihjc3NUZXh0KSB7XG4gICAgICAgIGNzc1RleHQgPSB0aGlzLmluc2VydFBvbHlmaWxsRGlyZWN0aXZlc0luQ3NzVGV4dChjc3NUZXh0KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5zZXJ0UG9seWZpbGxSdWxlc0luQ3NzVGV4dChjc3NUZXh0KTtcbiAgICAgIH0sXG4gICAgICBpbnNlcnRQb2x5ZmlsbERpcmVjdGl2ZXNJbkNzc1RleHQ6IGZ1bmN0aW9uKGNzc1RleHQpIHtcbiAgICAgICAgY3NzVGV4dCA9IGNzc1RleHQucmVwbGFjZShjc3NDb21tZW50TmV4dFNlbGVjdG9yUmUsIGZ1bmN0aW9uKG1hdGNoLCBwMSkge1xuICAgICAgICAgIHJldHVybiBwMS5zbGljZSgwLCAtMikgKyBcIntcIjtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjc3NUZXh0LnJlcGxhY2UoY3NzQ29udGVudE5leHRTZWxlY3RvclJlLCBmdW5jdGlvbihtYXRjaCwgcDEpIHtcbiAgICAgICAgICByZXR1cm4gcDEgKyBcIiB7XCI7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIGluc2VydFBvbHlmaWxsUnVsZXNJbkNzc1RleHQ6IGZ1bmN0aW9uKGNzc1RleHQpIHtcbiAgICAgICAgY3NzVGV4dCA9IGNzc1RleHQucmVwbGFjZShjc3NDb21tZW50UnVsZVJlLCBmdW5jdGlvbihtYXRjaCwgcDEpIHtcbiAgICAgICAgICByZXR1cm4gcDEuc2xpY2UoMCwgLTEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGNzc1RleHQucmVwbGFjZShjc3NDb250ZW50UnVsZVJlLCBmdW5jdGlvbihtYXRjaCwgcDEsIHAyLCBwMykge1xuICAgICAgICAgIHZhciBydWxlID0gbWF0Y2gucmVwbGFjZShwMSwgXCJcIikucmVwbGFjZShwMiwgXCJcIik7XG4gICAgICAgICAgcmV0dXJuIHAzICsgcnVsZTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgc2NvcGVDc3NUZXh0OiBmdW5jdGlvbihjc3NUZXh0LCBzY29wZVNlbGVjdG9yKSB7XG4gICAgICAgIHZhciB1bnNjb3BlZCA9IHRoaXMuZXh0cmFjdFVuc2NvcGVkUnVsZXNGcm9tQ3NzVGV4dChjc3NUZXh0KTtcbiAgICAgICAgY3NzVGV4dCA9IHRoaXMuaW5zZXJ0UG9seWZpbGxIb3N0SW5Dc3NUZXh0KGNzc1RleHQpO1xuICAgICAgICBjc3NUZXh0ID0gdGhpcy5jb252ZXJ0Q29sb25Ib3N0KGNzc1RleHQpO1xuICAgICAgICBjc3NUZXh0ID0gdGhpcy5jb252ZXJ0Q29sb25Ib3N0Q29udGV4dChjc3NUZXh0KTtcbiAgICAgICAgY3NzVGV4dCA9IHRoaXMuY29udmVydFNoYWRvd0RPTVNlbGVjdG9ycyhjc3NUZXh0KTtcbiAgICAgICAgaWYgKHNjb3BlU2VsZWN0b3IpIHtcbiAgICAgICAgICB2YXIgc2VsZiA9IHRoaXMsIGNzc1RleHQ7XG4gICAgICAgICAgd2l0aENzc1J1bGVzKGNzc1RleHQsIGZ1bmN0aW9uKHJ1bGVzKSB7XG4gICAgICAgICAgICBjc3NUZXh0ID0gc2VsZi5zY29wZVJ1bGVzKHJ1bGVzLCBzY29wZVNlbGVjdG9yKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjc3NUZXh0ID0gY3NzVGV4dCArIFwiXFxuXCIgKyB1bnNjb3BlZDtcbiAgICAgICAgcmV0dXJuIGNzc1RleHQudHJpbSgpO1xuICAgICAgfSxcbiAgICAgIGV4dHJhY3RVbnNjb3BlZFJ1bGVzRnJvbUNzc1RleHQ6IGZ1bmN0aW9uKGNzc1RleHQpIHtcbiAgICAgICAgdmFyIHIgPSBcIlwiLCBtO1xuICAgICAgICB3aGlsZSAobSA9IGNzc0NvbW1lbnRVbnNjb3BlZFJ1bGVSZS5leGVjKGNzc1RleHQpKSB7XG4gICAgICAgICAgciArPSBtWzFdLnNsaWNlKDAsIC0xKSArIFwiXFxuXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKG0gPSBjc3NDb250ZW50VW5zY29wZWRSdWxlUmUuZXhlYyhjc3NUZXh0KSkge1xuICAgICAgICAgIHIgKz0gbVswXS5yZXBsYWNlKG1bMl0sIFwiXCIpLnJlcGxhY2UobVsxXSwgbVszXSkgKyBcIlxcblxcblwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByO1xuICAgICAgfSxcbiAgICAgIGNvbnZlcnRDb2xvbkhvc3Q6IGZ1bmN0aW9uKGNzc1RleHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udmVydENvbG9uUnVsZShjc3NUZXh0LCBjc3NDb2xvbkhvc3RSZSwgdGhpcy5jb2xvbkhvc3RQYXJ0UmVwbGFjZXIpO1xuICAgICAgfSxcbiAgICAgIGNvbnZlcnRDb2xvbkhvc3RDb250ZXh0OiBmdW5jdGlvbihjc3NUZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRDb2xvblJ1bGUoY3NzVGV4dCwgY3NzQ29sb25Ib3N0Q29udGV4dFJlLCB0aGlzLmNvbG9uSG9zdENvbnRleHRQYXJ0UmVwbGFjZXIpO1xuICAgICAgfSxcbiAgICAgIGNvbnZlcnRDb2xvblJ1bGU6IGZ1bmN0aW9uKGNzc1RleHQsIHJlZ0V4cCwgcGFydFJlcGxhY2VyKSB7XG4gICAgICAgIHJldHVybiBjc3NUZXh0LnJlcGxhY2UocmVnRXhwLCBmdW5jdGlvbihtLCBwMSwgcDIsIHAzKSB7XG4gICAgICAgICAgcDEgPSBwb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3I7XG4gICAgICAgICAgaWYgKHAyKSB7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSBwMi5zcGxpdChcIixcIiksIHIgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcGFydHMubGVuZ3RoLCBwOyBpIDwgbCAmJiAocCA9IHBhcnRzW2ldKTsgaSsrKSB7XG4gICAgICAgICAgICAgIHAgPSBwLnRyaW0oKTtcbiAgICAgICAgICAgICAgci5wdXNoKHBhcnRSZXBsYWNlcihwMSwgcCwgcDMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByLmpvaW4oXCIsXCIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcDEgKyBwMztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIGNvbG9uSG9zdENvbnRleHRQYXJ0UmVwbGFjZXI6IGZ1bmN0aW9uKGhvc3QsIHBhcnQsIHN1ZmZpeCkge1xuICAgICAgICBpZiAocGFydC5tYXRjaChwb2x5ZmlsbEhvc3QpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY29sb25Ib3N0UGFydFJlcGxhY2VyKGhvc3QsIHBhcnQsIHN1ZmZpeCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGhvc3QgKyBwYXJ0ICsgc3VmZml4ICsgXCIsIFwiICsgcGFydCArIFwiIFwiICsgaG9zdCArIHN1ZmZpeDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGNvbG9uSG9zdFBhcnRSZXBsYWNlcjogZnVuY3Rpb24oaG9zdCwgcGFydCwgc3VmZml4KSB7XG4gICAgICAgIHJldHVybiBob3N0ICsgcGFydC5yZXBsYWNlKHBvbHlmaWxsSG9zdCwgXCJcIikgKyBzdWZmaXg7XG4gICAgICB9LFxuICAgICAgY29udmVydFNoYWRvd0RPTVNlbGVjdG9yczogZnVuY3Rpb24oY3NzVGV4dCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNoYWRvd0RPTVNlbGVjdG9yc1JlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY3NzVGV4dCA9IGNzc1RleHQucmVwbGFjZShzaGFkb3dET01TZWxlY3RvcnNSZVtpXSwgXCIgXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjc3NUZXh0O1xuICAgICAgfSxcbiAgICAgIHNjb3BlUnVsZXM6IGZ1bmN0aW9uKGNzc1J1bGVzLCBzY29wZVNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBjc3NUZXh0ID0gXCJcIjtcbiAgICAgICAgaWYgKGNzc1J1bGVzKSB7XG4gICAgICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChjc3NSdWxlcywgZnVuY3Rpb24ocnVsZSkge1xuICAgICAgICAgICAgaWYgKHJ1bGUuc2VsZWN0b3JUZXh0ICYmIChydWxlLnN0eWxlICYmIHJ1bGUuc3R5bGUuY3NzVGV4dCAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgICBjc3NUZXh0ICs9IHRoaXMuc2NvcGVTZWxlY3RvcihydWxlLnNlbGVjdG9yVGV4dCwgc2NvcGVTZWxlY3RvciwgdGhpcy5zdHJpY3RTdHlsaW5nKSArIFwiIHtcXG5cdFwiO1xuICAgICAgICAgICAgICBjc3NUZXh0ICs9IHRoaXMucHJvcGVydGllc0Zyb21SdWxlKHJ1bGUpICsgXCJcXG59XFxuXFxuXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJ1bGUudHlwZSA9PT0gQ1NTUnVsZS5NRURJQV9SVUxFKSB7XG4gICAgICAgICAgICAgIGNzc1RleHQgKz0gXCJAbWVkaWEgXCIgKyBydWxlLm1lZGlhLm1lZGlhVGV4dCArIFwiIHtcXG5cIjtcbiAgICAgICAgICAgICAgY3NzVGV4dCArPSB0aGlzLnNjb3BlUnVsZXMocnVsZS5jc3NSdWxlcywgc2NvcGVTZWxlY3Rvcik7XG4gICAgICAgICAgICAgIGNzc1RleHQgKz0gXCJcXG59XFxuXFxuXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChydWxlLmNzc1RleHQpIHtcbiAgICAgICAgICAgICAgICAgIGNzc1RleHQgKz0gcnVsZS5jc3NUZXh0ICsgXCJcXG5cXG5cIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKHgpIHtcbiAgICAgICAgICAgICAgICBpZiAocnVsZS50eXBlID09PSBDU1NSdWxlLktFWUZSQU1FU19SVUxFICYmIHJ1bGUuY3NzUnVsZXMpIHtcbiAgICAgICAgICAgICAgICAgIGNzc1RleHQgKz0gdGhpcy5pZVNhZmVDc3NUZXh0RnJvbUtleUZyYW1lUnVsZShydWxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3NzVGV4dDtcbiAgICAgIH0sXG4gICAgICBpZVNhZmVDc3NUZXh0RnJvbUtleUZyYW1lUnVsZTogZnVuY3Rpb24ocnVsZSkge1xuICAgICAgICB2YXIgY3NzVGV4dCA9IFwiQGtleWZyYW1lcyBcIiArIHJ1bGUubmFtZSArIFwiIHtcIjtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChydWxlLmNzc1J1bGVzLCBmdW5jdGlvbihydWxlKSB7XG4gICAgICAgICAgY3NzVGV4dCArPSBcIiBcIiArIHJ1bGUua2V5VGV4dCArIFwiIHtcIiArIHJ1bGUuc3R5bGUuY3NzVGV4dCArIFwifVwiO1xuICAgICAgICB9KTtcbiAgICAgICAgY3NzVGV4dCArPSBcIiB9XCI7XG4gICAgICAgIHJldHVybiBjc3NUZXh0O1xuICAgICAgfSxcbiAgICAgIHNjb3BlU2VsZWN0b3I6IGZ1bmN0aW9uKHNlbGVjdG9yLCBzY29wZVNlbGVjdG9yLCBzdHJpY3QpIHtcbiAgICAgICAgdmFyIHIgPSBbXSwgcGFydHMgPSBzZWxlY3Rvci5zcGxpdChcIixcIik7XG4gICAgICAgIHBhcnRzLmZvckVhY2goZnVuY3Rpb24ocCkge1xuICAgICAgICAgIHAgPSBwLnRyaW0oKTtcbiAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rvck5lZWRzU2NvcGluZyhwLCBzY29wZVNlbGVjdG9yKSkge1xuICAgICAgICAgICAgcCA9IHN0cmljdCAmJiAhcC5tYXRjaChwb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3IpID8gdGhpcy5hcHBseVN0cmljdFNlbGVjdG9yU2NvcGUocCwgc2NvcGVTZWxlY3RvcikgOiB0aGlzLmFwcGx5U2VsZWN0b3JTY29wZShwLCBzY29wZVNlbGVjdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgci5wdXNoKHApO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHIuam9pbihcIiwgXCIpO1xuICAgICAgfSxcbiAgICAgIHNlbGVjdG9yTmVlZHNTY29waW5nOiBmdW5jdGlvbihzZWxlY3Rvciwgc2NvcGVTZWxlY3Rvcikge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY29wZVNlbGVjdG9yKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZSA9IHRoaXMubWFrZVNjb3BlTWF0Y2hlcihzY29wZVNlbGVjdG9yKTtcbiAgICAgICAgcmV0dXJuICFzZWxlY3Rvci5tYXRjaChyZSk7XG4gICAgICB9LFxuICAgICAgbWFrZVNjb3BlTWF0Y2hlcjogZnVuY3Rpb24oc2NvcGVTZWxlY3Rvcikge1xuICAgICAgICBzY29wZVNlbGVjdG9yID0gc2NvcGVTZWxlY3Rvci5yZXBsYWNlKC9cXFsvZywgXCJcXFxcW1wiKS5yZXBsYWNlKC9cXF0vZywgXCJcXFxcXVwiKTtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoXCJeKFwiICsgc2NvcGVTZWxlY3RvciArIFwiKVwiICsgc2VsZWN0b3JSZVN1ZmZpeCwgXCJtXCIpO1xuICAgICAgfSxcbiAgICAgIGFwcGx5U2VsZWN0b3JTY29wZTogZnVuY3Rpb24oc2VsZWN0b3IsIHNlbGVjdG9yU2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoc2VsZWN0b3JTY29wZSkgPyB0aGlzLmFwcGx5U2VsZWN0b3JTY29wZUxpc3Qoc2VsZWN0b3IsIHNlbGVjdG9yU2NvcGUpIDogdGhpcy5hcHBseVNpbXBsZVNlbGVjdG9yU2NvcGUoc2VsZWN0b3IsIHNlbGVjdG9yU2NvcGUpO1xuICAgICAgfSxcbiAgICAgIGFwcGx5U2VsZWN0b3JTY29wZUxpc3Q6IGZ1bmN0aW9uKHNlbGVjdG9yLCBzY29wZVNlbGVjdG9yTGlzdCkge1xuICAgICAgICB2YXIgciA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgczsgcyA9IHNjb3BlU2VsZWN0b3JMaXN0W2ldOyBpKyspIHtcbiAgICAgICAgICByLnB1c2godGhpcy5hcHBseVNpbXBsZVNlbGVjdG9yU2NvcGUoc2VsZWN0b3IsIHMpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gci5qb2luKFwiLCBcIik7XG4gICAgICB9LFxuICAgICAgYXBwbHlTaW1wbGVTZWxlY3RvclNjb3BlOiBmdW5jdGlvbihzZWxlY3Rvciwgc2NvcGVTZWxlY3Rvcikge1xuICAgICAgICBpZiAoc2VsZWN0b3IubWF0Y2gocG9seWZpbGxIb3N0UmUpKSB7XG4gICAgICAgICAgc2VsZWN0b3IgPSBzZWxlY3Rvci5yZXBsYWNlKHBvbHlmaWxsSG9zdE5vQ29tYmluYXRvciwgc2NvcGVTZWxlY3Rvcik7XG4gICAgICAgICAgcmV0dXJuIHNlbGVjdG9yLnJlcGxhY2UocG9seWZpbGxIb3N0UmUsIHNjb3BlU2VsZWN0b3IgKyBcIiBcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHNjb3BlU2VsZWN0b3IgKyBcIiBcIiArIHNlbGVjdG9yO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgYXBwbHlTdHJpY3RTZWxlY3RvclNjb3BlOiBmdW5jdGlvbihzZWxlY3Rvciwgc2NvcGVTZWxlY3Rvcikge1xuICAgICAgICBzY29wZVNlbGVjdG9yID0gc2NvcGVTZWxlY3Rvci5yZXBsYWNlKC9cXFtpcz0oW15cXF1dKilcXF0vZywgXCIkMVwiKTtcbiAgICAgICAgdmFyIHNwbGl0cyA9IFsgXCIgXCIsIFwiPlwiLCBcIitcIiwgXCJ+XCIgXSwgc2NvcGVkID0gc2VsZWN0b3IsIGF0dHJOYW1lID0gXCJbXCIgKyBzY29wZVNlbGVjdG9yICsgXCJdXCI7XG4gICAgICAgIHNwbGl0cy5mb3JFYWNoKGZ1bmN0aW9uKHNlcCkge1xuICAgICAgICAgIHZhciBwYXJ0cyA9IHNjb3BlZC5zcGxpdChzZXApO1xuICAgICAgICAgIHNjb3BlZCA9IHBhcnRzLm1hcChmdW5jdGlvbihwKSB7XG4gICAgICAgICAgICB2YXIgdCA9IHAudHJpbSgpLnJlcGxhY2UocG9seWZpbGxIb3N0UmUsIFwiXCIpO1xuICAgICAgICAgICAgaWYgKHQgJiYgc3BsaXRzLmluZGV4T2YodCkgPCAwICYmIHQuaW5kZXhPZihhdHRyTmFtZSkgPCAwKSB7XG4gICAgICAgICAgICAgIHAgPSB0LnJlcGxhY2UoLyhbXjpdKikoOiopKC4qKS8sIFwiJDFcIiArIGF0dHJOYW1lICsgXCIkMiQzXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgICAgfSkuam9pbihzZXApO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHNjb3BlZDtcbiAgICAgIH0sXG4gICAgICBpbnNlcnRQb2x5ZmlsbEhvc3RJbkNzc1RleHQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBzZWxlY3Rvci5yZXBsYWNlKGNvbG9uSG9zdENvbnRleHRSZSwgcG9seWZpbGxIb3N0Q29udGV4dCkucmVwbGFjZShjb2xvbkhvc3RSZSwgcG9seWZpbGxIb3N0KTtcbiAgICAgIH0sXG4gICAgICBwcm9wZXJ0aWVzRnJvbVJ1bGU6IGZ1bmN0aW9uKHJ1bGUpIHtcbiAgICAgICAgdmFyIGNzc1RleHQgPSBydWxlLnN0eWxlLmNzc1RleHQ7XG4gICAgICAgIGlmIChydWxlLnN0eWxlLmNvbnRlbnQgJiYgIXJ1bGUuc3R5bGUuY29udGVudC5tYXRjaCgvWydcIl0rfGF0dHIvKSkge1xuICAgICAgICAgIGNzc1RleHQgPSBjc3NUZXh0LnJlcGxhY2UoL2NvbnRlbnQ6W147XSo7L2csIFwiY29udGVudDogJ1wiICsgcnVsZS5zdHlsZS5jb250ZW50ICsgXCInO1wiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3R5bGUgPSBydWxlLnN0eWxlO1xuICAgICAgICBmb3IgKHZhciBpIGluIHN0eWxlKSB7XG4gICAgICAgICAgaWYgKHN0eWxlW2ldID09PSBcImluaXRpYWxcIikge1xuICAgICAgICAgICAgY3NzVGV4dCArPSBpICsgXCI6IGluaXRpYWw7IFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3NzVGV4dDtcbiAgICAgIH0sXG4gICAgICByZXBsYWNlVGV4dEluU3R5bGVzOiBmdW5jdGlvbihzdHlsZXMsIGFjdGlvbikge1xuICAgICAgICBpZiAoc3R5bGVzICYmIGFjdGlvbikge1xuICAgICAgICAgIGlmICghKHN0eWxlcyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgc3R5bGVzID0gWyBzdHlsZXMgXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChzdHlsZXMsIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHMudGV4dENvbnRlbnQgPSBhY3Rpb24uY2FsbCh0aGlzLCBzLnRleHRDb250ZW50KTtcbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGFkZENzc1RvRG9jdW1lbnQ6IGZ1bmN0aW9uKGNzc1RleHQsIG5hbWUpIHtcbiAgICAgICAgaWYgKGNzc1RleHQubWF0Y2goXCJAaW1wb3J0XCIpKSB7XG4gICAgICAgICAgYWRkT3duU2hlZXQoY3NzVGV4dCwgbmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWRkQ3NzVG9Eb2N1bWVudChjc3NUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgdmFyIHNlbGVjdG9yUmUgPSAvKFtee10qKSh7W1xcc1xcU10qP30pL2dpbSwgY3NzQ29tbWVudFJlID0gL1xcL1xcKlteKl0qXFwqKyhbXlxcLypdW14qXSpcXCorKSpcXC8vZ2ltLCBjc3NDb21tZW50TmV4dFNlbGVjdG9yUmUgPSAvXFwvXFwqXFxzKkBwb2x5ZmlsbCAoW14qXSpcXCorKFteXFwvKl1bXipdKlxcKispKlxcLykoW157XSo/KXsvZ2ltLCBjc3NDb250ZW50TmV4dFNlbGVjdG9yUmUgPSAvcG9seWZpbGwtbmV4dC1zZWxlY3RvcltefV0qY29udGVudFxcOltcXHNdKj9bJ1wiXSguKj8pWydcIl1bO1xcc10qfShbXntdKj8pey9naW0sIGNzc0NvbW1lbnRSdWxlUmUgPSAvXFwvXFwqXFxzQHBvbHlmaWxsLXJ1bGUoW14qXSpcXCorKFteXFwvKl1bXipdKlxcKispKilcXC8vZ2ltLCBjc3NDb250ZW50UnVsZVJlID0gLyhwb2x5ZmlsbC1ydWxlKVtefV0qKGNvbnRlbnRcXDpbXFxzXSpbJ1wiXSguKj8pWydcIl0pWztcXHNdKltefV0qfS9naW0sIGNzc0NvbW1lbnRVbnNjb3BlZFJ1bGVSZSA9IC9cXC9cXCpcXHNAcG9seWZpbGwtdW5zY29wZWQtcnVsZShbXipdKlxcKisoW15cXC8qXVteKl0qXFwqKykqKVxcLy9naW0sIGNzc0NvbnRlbnRVbnNjb3BlZFJ1bGVSZSA9IC8ocG9seWZpbGwtdW5zY29wZWQtcnVsZSlbXn1dKihjb250ZW50XFw6W1xcc10qWydcIl0oLio/KVsnXCJdKVs7XFxzXSpbXn1dKn0vZ2ltLCBjc3NQc2V1ZG9SZSA9IC86Oih4LVteXFxzeywoXSopL2dpbSwgY3NzUGFydFJlID0gLzo6cGFydFxcKChbXildKilcXCkvZ2ltLCBwb2x5ZmlsbEhvc3QgPSBcIi1zaGFkb3djc3Nob3N0XCIsIHBvbHlmaWxsSG9zdENvbnRleHQgPSBcIi1zaGFkb3djc3Njb250ZXh0XCIsIHBhcmVuU3VmZml4ID0gXCIpKD86XFxcXCgoXCIgKyBcIig/OlxcXFwoW14pKF0qXFxcXCl8W14pKF0qKSs/XCIgKyBcIilcXFxcKSk/KFteLHtdKilcIjtcbiAgICB2YXIgY3NzQ29sb25Ib3N0UmUgPSBuZXcgUmVnRXhwKFwiKFwiICsgcG9seWZpbGxIb3N0ICsgcGFyZW5TdWZmaXgsIFwiZ2ltXCIpLCBjc3NDb2xvbkhvc3RDb250ZXh0UmUgPSBuZXcgUmVnRXhwKFwiKFwiICsgcG9seWZpbGxIb3N0Q29udGV4dCArIHBhcmVuU3VmZml4LCBcImdpbVwiKSwgc2VsZWN0b3JSZVN1ZmZpeCA9IFwiKFs+XFxcXHN+K1suLHs6XVtcXFxcc1xcXFxTXSopPyRcIiwgY29sb25Ib3N0UmUgPSAvXFw6aG9zdC9naW0sIGNvbG9uSG9zdENvbnRleHRSZSA9IC9cXDpob3N0LWNvbnRleHQvZ2ltLCBwb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3IgPSBwb2x5ZmlsbEhvc3QgKyBcIi1uby1jb21iaW5hdG9yXCIsIHBvbHlmaWxsSG9zdFJlID0gbmV3IFJlZ0V4cChwb2x5ZmlsbEhvc3QsIFwiZ2ltXCIpLCBwb2x5ZmlsbEhvc3RDb250ZXh0UmUgPSBuZXcgUmVnRXhwKHBvbHlmaWxsSG9zdENvbnRleHQsIFwiZ2ltXCIpLCBzaGFkb3dET01TZWxlY3RvcnNSZSA9IFsgLz4+Pi9nLCAvOjpzaGFkb3cvZywgLzo6Y29udGVudC9nLCAvXFwvZGVlcFxcLy9nLCAvXFwvc2hhZG93XFwvL2csIC9cXC9zaGFkb3ctZGVlcFxcLy9nLCAvXFxeXFxeL2csIC9cXF4vZyBdO1xuICAgIGZ1bmN0aW9uIHN0eWxlc1RvQ3NzVGV4dChzdHlsZXMsIHByZXNlcnZlQ29tbWVudHMpIHtcbiAgICAgIHZhciBjc3NUZXh0ID0gXCJcIjtcbiAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoc3R5bGVzLCBmdW5jdGlvbihzKSB7XG4gICAgICAgIGNzc1RleHQgKz0gcy50ZXh0Q29udGVudCArIFwiXFxuXFxuXCI7XG4gICAgICB9KTtcbiAgICAgIGlmICghcHJlc2VydmVDb21tZW50cykge1xuICAgICAgICBjc3NUZXh0ID0gY3NzVGV4dC5yZXBsYWNlKGNzc0NvbW1lbnRSZSwgXCJcIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3NzVGV4dDtcbiAgICB9XG4gICAgZnVuY3Rpb24gY3NzVGV4dFRvU3R5bGUoY3NzVGV4dCkge1xuICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSBjc3NUZXh0O1xuICAgICAgcmV0dXJuIHN0eWxlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjc3NUb1J1bGVzKGNzc1RleHQpIHtcbiAgICAgIHZhciBzdHlsZSA9IGNzc1RleHRUb1N0eWxlKGNzc1RleHQpO1xuICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgICB2YXIgcnVsZXMgPSBbXTtcbiAgICAgIGlmIChzdHlsZS5zaGVldCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJ1bGVzID0gc3R5bGUuc2hlZXQuY3NzUnVsZXM7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJzaGVldCBub3QgZm91bmRcIiwgc3R5bGUpO1xuICAgICAgfVxuICAgICAgc3R5bGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzdHlsZSk7XG4gICAgICByZXR1cm4gcnVsZXM7XG4gICAgfVxuICAgIHZhciBmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XG4gICAgZnJhbWUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIGZ1bmN0aW9uIGluaXRGcmFtZSgpIHtcbiAgICAgIGZyYW1lLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZnJhbWUpO1xuICAgICAgdmFyIGRvYyA9IGZyYW1lLmNvbnRlbnREb2N1bWVudDtcbiAgICAgIHZhciBiYXNlID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJiYXNlXCIpO1xuICAgICAgYmFzZS5ocmVmID0gZG9jdW1lbnQuYmFzZVVSSTtcbiAgICAgIGRvYy5oZWFkLmFwcGVuZENoaWxkKGJhc2UpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbkZyYW1lKGZuKSB7XG4gICAgICBpZiAoIWZyYW1lLmluaXRpYWxpemVkKSB7XG4gICAgICAgIGluaXRGcmFtZSgpO1xuICAgICAgfVxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmcmFtZSk7XG4gICAgICBmbihmcmFtZS5jb250ZW50RG9jdW1lbnQpO1xuICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChmcmFtZSk7XG4gICAgfVxuICAgIHZhciBpc0Nocm9tZSA9IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goXCJDaHJvbWVcIik7XG4gICAgZnVuY3Rpb24gd2l0aENzc1J1bGVzKGNzc1RleHQsIGNhbGxiYWNrKSB7XG4gICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBydWxlcztcbiAgICAgIGlmIChjc3NUZXh0Lm1hdGNoKFwiQGltcG9ydFwiKSAmJiBpc0Nocm9tZSkge1xuICAgICAgICB2YXIgc3R5bGUgPSBjc3NUZXh0VG9TdHlsZShjc3NUZXh0KTtcbiAgICAgICAgaW5GcmFtZShmdW5jdGlvbihkb2MpIHtcbiAgICAgICAgICBkb2MuaGVhZC5hcHBlbmRDaGlsZChzdHlsZS5pbXBsKTtcbiAgICAgICAgICBydWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHN0eWxlLnNoZWV0LmNzc1J1bGVzLCAwKTtcbiAgICAgICAgICBjYWxsYmFjayhydWxlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcnVsZXMgPSBjc3NUb1J1bGVzKGNzc1RleHQpO1xuICAgICAgICBjYWxsYmFjayhydWxlcyk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJ1bGVzVG9Dc3MoY3NzUnVsZXMpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBjc3MgPSBbXTsgaSA8IGNzc1J1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNzcy5wdXNoKGNzc1J1bGVzW2ldLmNzc1RleHQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNzcy5qb2luKFwiXFxuXFxuXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhZGRDc3NUb0RvY3VtZW50KGNzc1RleHQpIHtcbiAgICAgIGlmIChjc3NUZXh0KSB7XG4gICAgICAgIGdldFNoZWV0KCkuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzVGV4dCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBhZGRPd25TaGVldChjc3NUZXh0LCBuYW1lKSB7XG4gICAgICB2YXIgc3R5bGUgPSBjc3NUZXh0VG9TdHlsZShjc3NUZXh0KTtcbiAgICAgIHN0eWxlLnNldEF0dHJpYnV0ZShuYW1lLCBcIlwiKTtcbiAgICAgIHN0eWxlLnNldEF0dHJpYnV0ZShTSElNTUVEX0FUVFJJQlVURSwgXCJcIik7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICB9XG4gICAgdmFyIFNISU1fQVRUUklCVVRFID0gXCJzaGltLXNoYWRvd2RvbVwiO1xuICAgIHZhciBTSElNTUVEX0FUVFJJQlVURSA9IFwic2hpbS1zaGFkb3dkb20tY3NzXCI7XG4gICAgdmFyIE5PX1NISU1fQVRUUklCVVRFID0gXCJuby1zaGltXCI7XG4gICAgdmFyIHNoZWV0O1xuICAgIGZ1bmN0aW9uIGdldFNoZWV0KCkge1xuICAgICAgaWYgKCFzaGVldCkge1xuICAgICAgICBzaGVldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgICAgc2hlZXQuc2V0QXR0cmlidXRlKFNISU1NRURfQVRUUklCVVRFLCBcIlwiKTtcbiAgICAgICAgc2hlZXRbU0hJTU1FRF9BVFRSSUJVVEVdID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzaGVldDtcbiAgICB9XG4gICAgaWYgKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCkge1xuICAgICAgYWRkQ3NzVG9Eb2N1bWVudChcInN0eWxlIHsgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50OyB9XFxuXCIpO1xuICAgICAgdmFyIGRvYyA9IFNoYWRvd0RPTVBvbHlmaWxsLndyYXAoZG9jdW1lbnQpO1xuICAgICAgdmFyIGhlYWQgPSBkb2MucXVlcnlTZWxlY3RvcihcImhlYWRcIik7XG4gICAgICBoZWFkLmluc2VydEJlZm9yZShnZXRTaGVldCgpLCBoZWFkLmNoaWxkTm9kZXNbMF0pO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB1cmxSZXNvbHZlciA9IHNjb3BlLnVybFJlc29sdmVyO1xuICAgICAgICBpZiAod2luZG93LkhUTUxJbXBvcnRzICYmICFIVE1MSW1wb3J0cy51c2VOYXRpdmUpIHtcbiAgICAgICAgICB2YXIgU0hJTV9TSEVFVF9TRUxFQ1RPUiA9IFwibGlua1tyZWw9c3R5bGVzaGVldF1cIiArIFwiW1wiICsgU0hJTV9BVFRSSUJVVEUgKyBcIl1cIjtcbiAgICAgICAgICB2YXIgU0hJTV9TVFlMRV9TRUxFQ1RPUiA9IFwic3R5bGVbXCIgKyBTSElNX0FUVFJJQlVURSArIFwiXVwiO1xuICAgICAgICAgIEhUTUxJbXBvcnRzLmltcG9ydGVyLmRvY3VtZW50UHJlbG9hZFNlbGVjdG9ycyArPSBcIixcIiArIFNISU1fU0hFRVRfU0VMRUNUT1I7XG4gICAgICAgICAgSFRNTEltcG9ydHMuaW1wb3J0ZXIuaW1wb3J0c1ByZWxvYWRTZWxlY3RvcnMgKz0gXCIsXCIgKyBTSElNX1NIRUVUX1NFTEVDVE9SO1xuICAgICAgICAgIEhUTUxJbXBvcnRzLnBhcnNlci5kb2N1bWVudFNlbGVjdG9ycyA9IFsgSFRNTEltcG9ydHMucGFyc2VyLmRvY3VtZW50U2VsZWN0b3JzLCBTSElNX1NIRUVUX1NFTEVDVE9SLCBTSElNX1NUWUxFX1NFTEVDVE9SIF0uam9pbihcIixcIik7XG4gICAgICAgICAgdmFyIG9yaWdpbmFsUGFyc2VHZW5lcmljID0gSFRNTEltcG9ydHMucGFyc2VyLnBhcnNlR2VuZXJpYztcbiAgICAgICAgICBIVE1MSW1wb3J0cy5wYXJzZXIucGFyc2VHZW5lcmljID0gZnVuY3Rpb24oZWx0KSB7XG4gICAgICAgICAgICBpZiAoZWx0W1NISU1NRURfQVRUUklCVVRFXSkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSBlbHQuX19pbXBvcnRFbGVtZW50IHx8IGVsdDtcbiAgICAgICAgICAgIGlmICghc3R5bGUuaGFzQXR0cmlidXRlKFNISU1fQVRUUklCVVRFKSkge1xuICAgICAgICAgICAgICBvcmlnaW5hbFBhcnNlR2VuZXJpYy5jYWxsKHRoaXMsIGVsdCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbHQuX19yZXNvdXJjZSkge1xuICAgICAgICAgICAgICBzdHlsZSA9IGVsdC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgICAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSBlbHQuX19yZXNvdXJjZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEhUTUxJbXBvcnRzLnBhdGgucmVzb2x2ZVVybHNJblN0eWxlKHN0eWxlLCBlbHQuaHJlZik7XG4gICAgICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IFNoYWRvd0NTUy5zaGltU3R5bGUoc3R5bGUpO1xuICAgICAgICAgICAgc3R5bGUucmVtb3ZlQXR0cmlidXRlKFNISU1fQVRUUklCVVRFLCBcIlwiKTtcbiAgICAgICAgICAgIHN0eWxlLnNldEF0dHJpYnV0ZShTSElNTUVEX0FUVFJJQlVURSwgXCJcIik7XG4gICAgICAgICAgICBzdHlsZVtTSElNTUVEX0FUVFJJQlVURV0gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHN0eWxlLnBhcmVudE5vZGUgIT09IGhlYWQpIHtcbiAgICAgICAgICAgICAgaWYgKGVsdC5wYXJlbnROb2RlID09PSBoZWFkKSB7XG4gICAgICAgICAgICAgICAgaGVhZC5yZXBsYWNlQ2hpbGQoc3R5bGUsIGVsdCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9Eb2N1bWVudChzdHlsZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0eWxlLl9faW1wb3J0UGFyc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMubWFya1BhcnNpbmdDb21wbGV0ZShlbHQpO1xuICAgICAgICAgICAgdGhpcy5wYXJzZU5leHQoKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHZhciBoYXNSZXNvdXJjZSA9IEhUTUxJbXBvcnRzLnBhcnNlci5oYXNSZXNvdXJjZTtcbiAgICAgICAgICBIVE1MSW1wb3J0cy5wYXJzZXIuaGFzUmVzb3VyY2UgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5sb2NhbE5hbWUgPT09IFwibGlua1wiICYmIG5vZGUucmVsID09PSBcInN0eWxlc2hlZXRcIiAmJiBub2RlLmhhc0F0dHJpYnV0ZShTSElNX0FUVFJJQlVURSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuX19yZXNvdXJjZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBoYXNSZXNvdXJjZS5jYWxsKHRoaXMsIG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBzY29wZS5TaGFkb3dDU1MgPSBTaGFkb3dDU1M7XG4gIH0pKHdpbmRvdy5XZWJDb21wb25lbnRzKTtcbn1cblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIGlmICh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpIHtcbiAgICB3aW5kb3cud3JhcCA9IFNoYWRvd0RPTVBvbHlmaWxsLndyYXBJZk5lZWRlZDtcbiAgICB3aW5kb3cudW53cmFwID0gU2hhZG93RE9NUG9seWZpbGwudW53cmFwSWZOZWVkZWQ7XG4gIH0gZWxzZSB7XG4gICAgd2luZG93LndyYXAgPSB3aW5kb3cudW53cmFwID0gZnVuY3Rpb24obikge1xuICAgICAgcmV0dXJuIG47XG4gICAgfTtcbiAgfVxufSkod2luZG93LldlYkNvbXBvbmVudHMpO1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBoYXNXb3JraW5nVXJsID0gZmFsc2U7XG4gIGlmICghc2NvcGUuZm9yY2VKVVJMKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciB1ID0gbmV3IFVSTChcImJcIiwgXCJodHRwOi8vYVwiKTtcbiAgICAgIHUucGF0aG5hbWUgPSBcImMlMjBkXCI7XG4gICAgICBoYXNXb3JraW5nVXJsID0gdS5ocmVmID09PSBcImh0dHA6Ly9hL2MlMjBkXCI7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuICBpZiAoaGFzV29ya2luZ1VybCkgcmV0dXJuO1xuICB2YXIgcmVsYXRpdmUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICByZWxhdGl2ZVtcImZ0cFwiXSA9IDIxO1xuICByZWxhdGl2ZVtcImZpbGVcIl0gPSAwO1xuICByZWxhdGl2ZVtcImdvcGhlclwiXSA9IDcwO1xuICByZWxhdGl2ZVtcImh0dHBcIl0gPSA4MDtcbiAgcmVsYXRpdmVbXCJodHRwc1wiXSA9IDQ0MztcbiAgcmVsYXRpdmVbXCJ3c1wiXSA9IDgwO1xuICByZWxhdGl2ZVtcIndzc1wiXSA9IDQ0MztcbiAgdmFyIHJlbGF0aXZlUGF0aERvdE1hcHBpbmcgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICByZWxhdGl2ZVBhdGhEb3RNYXBwaW5nW1wiJTJlXCJdID0gXCIuXCI7XG4gIHJlbGF0aXZlUGF0aERvdE1hcHBpbmdbXCIuJTJlXCJdID0gXCIuLlwiO1xuICByZWxhdGl2ZVBhdGhEb3RNYXBwaW5nW1wiJTJlLlwiXSA9IFwiLi5cIjtcbiAgcmVsYXRpdmVQYXRoRG90TWFwcGluZ1tcIiUyZSUyZVwiXSA9IFwiLi5cIjtcbiAgZnVuY3Rpb24gaXNSZWxhdGl2ZVNjaGVtZShzY2hlbWUpIHtcbiAgICByZXR1cm4gcmVsYXRpdmVbc2NoZW1lXSAhPT0gdW5kZWZpbmVkO1xuICB9XG4gIGZ1bmN0aW9uIGludmFsaWQoKSB7XG4gICAgY2xlYXIuY2FsbCh0aGlzKTtcbiAgICB0aGlzLl9pc0ludmFsaWQgPSB0cnVlO1xuICB9XG4gIGZ1bmN0aW9uIElETkFUb0FTQ0lJKGgpIHtcbiAgICBpZiAoXCJcIiA9PSBoKSB7XG4gICAgICBpbnZhbGlkLmNhbGwodGhpcyk7XG4gICAgfVxuICAgIHJldHVybiBoLnRvTG93ZXJDYXNlKCk7XG4gIH1cbiAgZnVuY3Rpb24gcGVyY2VudEVzY2FwZShjKSB7XG4gICAgdmFyIHVuaWNvZGUgPSBjLmNoYXJDb2RlQXQoMCk7XG4gICAgaWYgKHVuaWNvZGUgPiAzMiAmJiB1bmljb2RlIDwgMTI3ICYmIFsgMzQsIDM1LCA2MCwgNjIsIDYzLCA5NiBdLmluZGV4T2YodW5pY29kZSkgPT0gLTEpIHtcbiAgICAgIHJldHVybiBjO1xuICAgIH1cbiAgICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KGMpO1xuICB9XG4gIGZ1bmN0aW9uIHBlcmNlbnRFc2NhcGVRdWVyeShjKSB7XG4gICAgdmFyIHVuaWNvZGUgPSBjLmNoYXJDb2RlQXQoMCk7XG4gICAgaWYgKHVuaWNvZGUgPiAzMiAmJiB1bmljb2RlIDwgMTI3ICYmIFsgMzQsIDM1LCA2MCwgNjIsIDk2IF0uaW5kZXhPZih1bmljb2RlKSA9PSAtMSkge1xuICAgICAgcmV0dXJuIGM7XG4gICAgfVxuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoYyk7XG4gIH1cbiAgdmFyIEVPRiA9IHVuZGVmaW5lZCwgQUxQSEEgPSAvW2EtekEtWl0vLCBBTFBIQU5VTUVSSUMgPSAvW2EtekEtWjAtOVxcK1xcLVxcLl0vO1xuICBmdW5jdGlvbiBwYXJzZShpbnB1dCwgc3RhdGVPdmVycmlkZSwgYmFzZSkge1xuICAgIGZ1bmN0aW9uIGVycihtZXNzYWdlKSB7XG4gICAgICBlcnJvcnMucHVzaChtZXNzYWdlKTtcbiAgICB9XG4gICAgdmFyIHN0YXRlID0gc3RhdGVPdmVycmlkZSB8fCBcInNjaGVtZSBzdGFydFwiLCBjdXJzb3IgPSAwLCBidWZmZXIgPSBcIlwiLCBzZWVuQXQgPSBmYWxzZSwgc2VlbkJyYWNrZXQgPSBmYWxzZSwgZXJyb3JzID0gW107XG4gICAgbG9vcDogd2hpbGUgKChpbnB1dFtjdXJzb3IgLSAxXSAhPSBFT0YgfHwgY3Vyc29yID09IDApICYmICF0aGlzLl9pc0ludmFsaWQpIHtcbiAgICAgIHZhciBjID0gaW5wdXRbY3Vyc29yXTtcbiAgICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICBjYXNlIFwic2NoZW1lIHN0YXJ0XCI6XG4gICAgICAgIGlmIChjICYmIEFMUEhBLnRlc3QoYykpIHtcbiAgICAgICAgICBidWZmZXIgKz0gYy50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIHN0YXRlID0gXCJzY2hlbWVcIjtcbiAgICAgICAgfSBlbHNlIGlmICghc3RhdGVPdmVycmlkZSkge1xuICAgICAgICAgIGJ1ZmZlciA9IFwiXCI7XG4gICAgICAgICAgc3RhdGUgPSBcIm5vIHNjaGVtZVwiO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVycihcIkludmFsaWQgc2NoZW1lLlwiKTtcbiAgICAgICAgICBicmVhayBsb29wO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcInNjaGVtZVwiOlxuICAgICAgICBpZiAoYyAmJiBBTFBIQU5VTUVSSUMudGVzdChjKSkge1xuICAgICAgICAgIGJ1ZmZlciArPSBjLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoXCI6XCIgPT0gYykge1xuICAgICAgICAgIHRoaXMuX3NjaGVtZSA9IGJ1ZmZlcjtcbiAgICAgICAgICBidWZmZXIgPSBcIlwiO1xuICAgICAgICAgIGlmIChzdGF0ZU92ZXJyaWRlKSB7XG4gICAgICAgICAgICBicmVhayBsb29wO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXNSZWxhdGl2ZVNjaGVtZSh0aGlzLl9zY2hlbWUpKSB7XG4gICAgICAgICAgICB0aGlzLl9pc1JlbGF0aXZlID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKFwiZmlsZVwiID09IHRoaXMuX3NjaGVtZSkge1xuICAgICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlXCI7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9pc1JlbGF0aXZlICYmIGJhc2UgJiYgYmFzZS5fc2NoZW1lID09IHRoaXMuX3NjaGVtZSkge1xuICAgICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlIG9yIGF1dGhvcml0eVwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5faXNSZWxhdGl2ZSkge1xuICAgICAgICAgICAgc3RhdGUgPSBcImF1dGhvcml0eSBmaXJzdCBzbGFzaFwiO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGF0ZSA9IFwic2NoZW1lIGRhdGFcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXN0YXRlT3ZlcnJpZGUpIHtcbiAgICAgICAgICBidWZmZXIgPSBcIlwiO1xuICAgICAgICAgIGN1cnNvciA9IDA7XG4gICAgICAgICAgc3RhdGUgPSBcIm5vIHNjaGVtZVwiO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKEVPRiA9PSBjKSB7XG4gICAgICAgICAgYnJlYWsgbG9vcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlcnIoXCJDb2RlIHBvaW50IG5vdCBhbGxvd2VkIGluIHNjaGVtZTogXCIgKyBjKTtcbiAgICAgICAgICBicmVhayBsb29wO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcInNjaGVtZSBkYXRhXCI6XG4gICAgICAgIGlmIChcIj9cIiA9PSBjKSB7XG4gICAgICAgICAgdGhpcy5fcXVlcnkgPSBcIj9cIjtcbiAgICAgICAgICBzdGF0ZSA9IFwicXVlcnlcIjtcbiAgICAgICAgfSBlbHNlIGlmIChcIiNcIiA9PSBjKSB7XG4gICAgICAgICAgdGhpcy5fZnJhZ21lbnQgPSBcIiNcIjtcbiAgICAgICAgICBzdGF0ZSA9IFwiZnJhZ21lbnRcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoRU9GICE9IGMgJiYgXCJcdFwiICE9IGMgJiYgXCJcXG5cIiAhPSBjICYmIFwiXFxyXCIgIT0gYykge1xuICAgICAgICAgICAgdGhpcy5fc2NoZW1lRGF0YSArPSBwZXJjZW50RXNjYXBlKGMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJubyBzY2hlbWVcIjpcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFpc1JlbGF0aXZlU2NoZW1lKGJhc2UuX3NjaGVtZSkpIHtcbiAgICAgICAgICBlcnIoXCJNaXNzaW5nIHNjaGVtZS5cIik7XG4gICAgICAgICAgaW52YWxpZC5jYWxsKHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZVwiO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcInJlbGF0aXZlIG9yIGF1dGhvcml0eVwiOlxuICAgICAgICBpZiAoXCIvXCIgPT0gYyAmJiBcIi9cIiA9PSBpbnB1dFtjdXJzb3IgKyAxXSkge1xuICAgICAgICAgIHN0YXRlID0gXCJhdXRob3JpdHkgaWdub3JlIHNsYXNoZXNcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlcnIoXCJFeHBlY3RlZCAvLCBnb3Q6IFwiICsgYyk7XG4gICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlXCI7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwicmVsYXRpdmVcIjpcbiAgICAgICAgdGhpcy5faXNSZWxhdGl2ZSA9IHRydWU7XG4gICAgICAgIGlmIChcImZpbGVcIiAhPSB0aGlzLl9zY2hlbWUpIHRoaXMuX3NjaGVtZSA9IGJhc2UuX3NjaGVtZTtcbiAgICAgICAgaWYgKEVPRiA9PSBjKSB7XG4gICAgICAgICAgdGhpcy5faG9zdCA9IGJhc2UuX2hvc3Q7XG4gICAgICAgICAgdGhpcy5fcG9ydCA9IGJhc2UuX3BvcnQ7XG4gICAgICAgICAgdGhpcy5fcGF0aCA9IGJhc2UuX3BhdGguc2xpY2UoKTtcbiAgICAgICAgICB0aGlzLl9xdWVyeSA9IGJhc2UuX3F1ZXJ5O1xuICAgICAgICAgIHRoaXMuX3VzZXJuYW1lID0gYmFzZS5fdXNlcm5hbWU7XG4gICAgICAgICAgdGhpcy5fcGFzc3dvcmQgPSBiYXNlLl9wYXNzd29yZDtcbiAgICAgICAgICBicmVhayBsb29wO1xuICAgICAgICB9IGVsc2UgaWYgKFwiL1wiID09IGMgfHwgXCJcXFxcXCIgPT0gYykge1xuICAgICAgICAgIGlmIChcIlxcXFxcIiA9PSBjKSBlcnIoXCJcXFxcIGlzIGFuIGludmFsaWQgY29kZSBwb2ludC5cIik7XG4gICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlIHNsYXNoXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoXCI/XCIgPT0gYykge1xuICAgICAgICAgIHRoaXMuX2hvc3QgPSBiYXNlLl9ob3N0O1xuICAgICAgICAgIHRoaXMuX3BvcnQgPSBiYXNlLl9wb3J0O1xuICAgICAgICAgIHRoaXMuX3BhdGggPSBiYXNlLl9wYXRoLnNsaWNlKCk7XG4gICAgICAgICAgdGhpcy5fcXVlcnkgPSBcIj9cIjtcbiAgICAgICAgICB0aGlzLl91c2VybmFtZSA9IGJhc2UuX3VzZXJuYW1lO1xuICAgICAgICAgIHRoaXMuX3Bhc3N3b3JkID0gYmFzZS5fcGFzc3dvcmQ7XG4gICAgICAgICAgc3RhdGUgPSBcInF1ZXJ5XCI7XG4gICAgICAgIH0gZWxzZSBpZiAoXCIjXCIgPT0gYykge1xuICAgICAgICAgIHRoaXMuX2hvc3QgPSBiYXNlLl9ob3N0O1xuICAgICAgICAgIHRoaXMuX3BvcnQgPSBiYXNlLl9wb3J0O1xuICAgICAgICAgIHRoaXMuX3BhdGggPSBiYXNlLl9wYXRoLnNsaWNlKCk7XG4gICAgICAgICAgdGhpcy5fcXVlcnkgPSBiYXNlLl9xdWVyeTtcbiAgICAgICAgICB0aGlzLl9mcmFnbWVudCA9IFwiI1wiO1xuICAgICAgICAgIHRoaXMuX3VzZXJuYW1lID0gYmFzZS5fdXNlcm5hbWU7XG4gICAgICAgICAgdGhpcy5fcGFzc3dvcmQgPSBiYXNlLl9wYXNzd29yZDtcbiAgICAgICAgICBzdGF0ZSA9IFwiZnJhZ21lbnRcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgbmV4dEMgPSBpbnB1dFtjdXJzb3IgKyAxXTtcbiAgICAgICAgICB2YXIgbmV4dE5leHRDID0gaW5wdXRbY3Vyc29yICsgMl07XG4gICAgICAgICAgaWYgKFwiZmlsZVwiICE9IHRoaXMuX3NjaGVtZSB8fCAhQUxQSEEudGVzdChjKSB8fCBuZXh0QyAhPSBcIjpcIiAmJiBuZXh0QyAhPSBcInxcIiB8fCBFT0YgIT0gbmV4dE5leHRDICYmIFwiL1wiICE9IG5leHROZXh0QyAmJiBcIlxcXFxcIiAhPSBuZXh0TmV4dEMgJiYgXCI/XCIgIT0gbmV4dE5leHRDICYmIFwiI1wiICE9IG5leHROZXh0Qykge1xuICAgICAgICAgICAgdGhpcy5faG9zdCA9IGJhc2UuX2hvc3Q7XG4gICAgICAgICAgICB0aGlzLl9wb3J0ID0gYmFzZS5fcG9ydDtcbiAgICAgICAgICAgIHRoaXMuX3VzZXJuYW1lID0gYmFzZS5fdXNlcm5hbWU7XG4gICAgICAgICAgICB0aGlzLl9wYXNzd29yZCA9IGJhc2UuX3Bhc3N3b3JkO1xuICAgICAgICAgICAgdGhpcy5fcGF0aCA9IGJhc2UuX3BhdGguc2xpY2UoKTtcbiAgICAgICAgICAgIHRoaXMuX3BhdGgucG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZSBwYXRoXCI7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwicmVsYXRpdmUgc2xhc2hcIjpcbiAgICAgICAgaWYgKFwiL1wiID09IGMgfHwgXCJcXFxcXCIgPT0gYykge1xuICAgICAgICAgIGlmIChcIlxcXFxcIiA9PSBjKSB7XG4gICAgICAgICAgICBlcnIoXCJcXFxcIGlzIGFuIGludmFsaWQgY29kZSBwb2ludC5cIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChcImZpbGVcIiA9PSB0aGlzLl9zY2hlbWUpIHtcbiAgICAgICAgICAgIHN0YXRlID0gXCJmaWxlIGhvc3RcIjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdGUgPSBcImF1dGhvcml0eSBpZ25vcmUgc2xhc2hlc1wiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoXCJmaWxlXCIgIT0gdGhpcy5fc2NoZW1lKSB7XG4gICAgICAgICAgICB0aGlzLl9ob3N0ID0gYmFzZS5faG9zdDtcbiAgICAgICAgICAgIHRoaXMuX3BvcnQgPSBiYXNlLl9wb3J0O1xuICAgICAgICAgICAgdGhpcy5fdXNlcm5hbWUgPSBiYXNlLl91c2VybmFtZTtcbiAgICAgICAgICAgIHRoaXMuX3Bhc3N3b3JkID0gYmFzZS5fcGFzc3dvcmQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZSBwYXRoXCI7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiYXV0aG9yaXR5IGZpcnN0IHNsYXNoXCI6XG4gICAgICAgIGlmIChcIi9cIiA9PSBjKSB7XG4gICAgICAgICAgc3RhdGUgPSBcImF1dGhvcml0eSBzZWNvbmQgc2xhc2hcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlcnIoXCJFeHBlY3RlZCAnLycsIGdvdDogXCIgKyBjKTtcbiAgICAgICAgICBzdGF0ZSA9IFwiYXV0aG9yaXR5IGlnbm9yZSBzbGFzaGVzXCI7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiYXV0aG9yaXR5IHNlY29uZCBzbGFzaFwiOlxuICAgICAgICBzdGF0ZSA9IFwiYXV0aG9yaXR5IGlnbm9yZSBzbGFzaGVzXCI7XG4gICAgICAgIGlmIChcIi9cIiAhPSBjKSB7XG4gICAgICAgICAgZXJyKFwiRXhwZWN0ZWQgJy8nLCBnb3Q6IFwiICsgYyk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiYXV0aG9yaXR5IGlnbm9yZSBzbGFzaGVzXCI6XG4gICAgICAgIGlmIChcIi9cIiAhPSBjICYmIFwiXFxcXFwiICE9IGMpIHtcbiAgICAgICAgICBzdGF0ZSA9IFwiYXV0aG9yaXR5XCI7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyKFwiRXhwZWN0ZWQgYXV0aG9yaXR5LCBnb3Q6IFwiICsgYyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiYXV0aG9yaXR5XCI6XG4gICAgICAgIGlmIChcIkBcIiA9PSBjKSB7XG4gICAgICAgICAgaWYgKHNlZW5BdCkge1xuICAgICAgICAgICAgZXJyKFwiQCBhbHJlYWR5IHNlZW4uXCIpO1xuICAgICAgICAgICAgYnVmZmVyICs9IFwiJTQwXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlZW5BdCA9IHRydWU7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWZmZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjcCA9IGJ1ZmZlcltpXTtcbiAgICAgICAgICAgIGlmIChcIlx0XCIgPT0gY3AgfHwgXCJcXG5cIiA9PSBjcCB8fCBcIlxcclwiID09IGNwKSB7XG4gICAgICAgICAgICAgIGVycihcIkludmFsaWQgd2hpdGVzcGFjZSBpbiBhdXRob3JpdHkuXCIpO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcIjpcIiA9PSBjcCAmJiBudWxsID09PSB0aGlzLl9wYXNzd29yZCkge1xuICAgICAgICAgICAgICB0aGlzLl9wYXNzd29yZCA9IFwiXCI7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRlbXBDID0gcGVyY2VudEVzY2FwZShjcCk7XG4gICAgICAgICAgICBudWxsICE9PSB0aGlzLl9wYXNzd29yZCA/IHRoaXMuX3Bhc3N3b3JkICs9IHRlbXBDIDogdGhpcy5fdXNlcm5hbWUgKz0gdGVtcEM7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJ1ZmZlciA9IFwiXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoRU9GID09IGMgfHwgXCIvXCIgPT0gYyB8fCBcIlxcXFxcIiA9PSBjIHx8IFwiP1wiID09IGMgfHwgXCIjXCIgPT0gYykge1xuICAgICAgICAgIGN1cnNvciAtPSBidWZmZXIubGVuZ3RoO1xuICAgICAgICAgIGJ1ZmZlciA9IFwiXCI7XG4gICAgICAgICAgc3RhdGUgPSBcImhvc3RcIjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBidWZmZXIgKz0gYztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJmaWxlIGhvc3RcIjpcbiAgICAgICAgaWYgKEVPRiA9PSBjIHx8IFwiL1wiID09IGMgfHwgXCJcXFxcXCIgPT0gYyB8fCBcIj9cIiA9PSBjIHx8IFwiI1wiID09IGMpIHtcbiAgICAgICAgICBpZiAoYnVmZmVyLmxlbmd0aCA9PSAyICYmIEFMUEhBLnRlc3QoYnVmZmVyWzBdKSAmJiAoYnVmZmVyWzFdID09IFwiOlwiIHx8IGJ1ZmZlclsxXSA9PSBcInxcIikpIHtcbiAgICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZSBwYXRoXCI7XG4gICAgICAgICAgfSBlbHNlIGlmIChidWZmZXIubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZSBwYXRoIHN0YXJ0XCI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2hvc3QgPSBJRE5BVG9BU0NJSS5jYWxsKHRoaXMsIGJ1ZmZlcik7XG4gICAgICAgICAgICBidWZmZXIgPSBcIlwiO1xuICAgICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlIHBhdGggc3RhcnRcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJcdFwiID09IGMgfHwgXCJcXG5cIiA9PSBjIHx8IFwiXFxyXCIgPT0gYykge1xuICAgICAgICAgIGVycihcIkludmFsaWQgd2hpdGVzcGFjZSBpbiBmaWxlIGhvc3QuXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJ1ZmZlciArPSBjO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcImhvc3RcIjpcbiAgICAgICBjYXNlIFwiaG9zdG5hbWVcIjpcbiAgICAgICAgaWYgKFwiOlwiID09IGMgJiYgIXNlZW5CcmFja2V0KSB7XG4gICAgICAgICAgdGhpcy5faG9zdCA9IElETkFUb0FTQ0lJLmNhbGwodGhpcywgYnVmZmVyKTtcbiAgICAgICAgICBidWZmZXIgPSBcIlwiO1xuICAgICAgICAgIHN0YXRlID0gXCJwb3J0XCI7XG4gICAgICAgICAgaWYgKFwiaG9zdG5hbWVcIiA9PSBzdGF0ZU92ZXJyaWRlKSB7XG4gICAgICAgICAgICBicmVhayBsb29wO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChFT0YgPT0gYyB8fCBcIi9cIiA9PSBjIHx8IFwiXFxcXFwiID09IGMgfHwgXCI/XCIgPT0gYyB8fCBcIiNcIiA9PSBjKSB7XG4gICAgICAgICAgdGhpcy5faG9zdCA9IElETkFUb0FTQ0lJLmNhbGwodGhpcywgYnVmZmVyKTtcbiAgICAgICAgICBidWZmZXIgPSBcIlwiO1xuICAgICAgICAgIHN0YXRlID0gXCJyZWxhdGl2ZSBwYXRoIHN0YXJ0XCI7XG4gICAgICAgICAgaWYgKHN0YXRlT3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIGJyZWFrIGxvb3A7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKFwiXHRcIiAhPSBjICYmIFwiXFxuXCIgIT0gYyAmJiBcIlxcclwiICE9IGMpIHtcbiAgICAgICAgICBpZiAoXCJbXCIgPT0gYykge1xuICAgICAgICAgICAgc2VlbkJyYWNrZXQgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXCJdXCIgPT0gYykge1xuICAgICAgICAgICAgc2VlbkJyYWNrZXQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnVmZmVyICs9IGM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyKFwiSW52YWxpZCBjb2RlIHBvaW50IGluIGhvc3QvaG9zdG5hbWU6IFwiICsgYyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwicG9ydFwiOlxuICAgICAgICBpZiAoL1swLTldLy50ZXN0KGMpKSB7XG4gICAgICAgICAgYnVmZmVyICs9IGM7XG4gICAgICAgIH0gZWxzZSBpZiAoRU9GID09IGMgfHwgXCIvXCIgPT0gYyB8fCBcIlxcXFxcIiA9PSBjIHx8IFwiP1wiID09IGMgfHwgXCIjXCIgPT0gYyB8fCBzdGF0ZU92ZXJyaWRlKSB7XG4gICAgICAgICAgaWYgKFwiXCIgIT0gYnVmZmVyKSB7XG4gICAgICAgICAgICB2YXIgdGVtcCA9IHBhcnNlSW50KGJ1ZmZlciwgMTApO1xuICAgICAgICAgICAgaWYgKHRlbXAgIT0gcmVsYXRpdmVbdGhpcy5fc2NoZW1lXSkge1xuICAgICAgICAgICAgICB0aGlzLl9wb3J0ID0gdGVtcCArIFwiXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBidWZmZXIgPSBcIlwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc3RhdGVPdmVycmlkZSkge1xuICAgICAgICAgICAgYnJlYWsgbG9vcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlIHBhdGggc3RhcnRcIjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIGlmIChcIlx0XCIgPT0gYyB8fCBcIlxcblwiID09IGMgfHwgXCJcXHJcIiA9PSBjKSB7XG4gICAgICAgICAgZXJyKFwiSW52YWxpZCBjb2RlIHBvaW50IGluIHBvcnQ6IFwiICsgYyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW52YWxpZC5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcInJlbGF0aXZlIHBhdGggc3RhcnRcIjpcbiAgICAgICAgaWYgKFwiXFxcXFwiID09IGMpIGVycihcIidcXFxcJyBub3QgYWxsb3dlZCBpbiBwYXRoLlwiKTtcbiAgICAgICAgc3RhdGUgPSBcInJlbGF0aXZlIHBhdGhcIjtcbiAgICAgICAgaWYgKFwiL1wiICE9IGMgJiYgXCJcXFxcXCIgIT0gYykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcInJlbGF0aXZlIHBhdGhcIjpcbiAgICAgICAgaWYgKEVPRiA9PSBjIHx8IFwiL1wiID09IGMgfHwgXCJcXFxcXCIgPT0gYyB8fCAhc3RhdGVPdmVycmlkZSAmJiAoXCI/XCIgPT0gYyB8fCBcIiNcIiA9PSBjKSkge1xuICAgICAgICAgIGlmIChcIlxcXFxcIiA9PSBjKSB7XG4gICAgICAgICAgICBlcnIoXCJcXFxcIG5vdCBhbGxvd2VkIGluIHJlbGF0aXZlIHBhdGguXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgdG1wO1xuICAgICAgICAgIGlmICh0bXAgPSByZWxhdGl2ZVBhdGhEb3RNYXBwaW5nW2J1ZmZlci50b0xvd2VyQ2FzZSgpXSkge1xuICAgICAgICAgICAgYnVmZmVyID0gdG1wO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoXCIuLlwiID09IGJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5fcGF0aC5wb3AoKTtcbiAgICAgICAgICAgIGlmIChcIi9cIiAhPSBjICYmIFwiXFxcXFwiICE9IGMpIHtcbiAgICAgICAgICAgICAgdGhpcy5fcGF0aC5wdXNoKFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoXCIuXCIgPT0gYnVmZmVyICYmIFwiL1wiICE9IGMgJiYgXCJcXFxcXCIgIT0gYykge1xuICAgICAgICAgICAgdGhpcy5fcGF0aC5wdXNoKFwiXCIpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXCIuXCIgIT0gYnVmZmVyKSB7XG4gICAgICAgICAgICBpZiAoXCJmaWxlXCIgPT0gdGhpcy5fc2NoZW1lICYmIHRoaXMuX3BhdGgubGVuZ3RoID09IDAgJiYgYnVmZmVyLmxlbmd0aCA9PSAyICYmIEFMUEhBLnRlc3QoYnVmZmVyWzBdKSAmJiBidWZmZXJbMV0gPT0gXCJ8XCIpIHtcbiAgICAgICAgICAgICAgYnVmZmVyID0gYnVmZmVyWzBdICsgXCI6XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9wYXRoLnB1c2goYnVmZmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnVmZmVyID0gXCJcIjtcbiAgICAgICAgICBpZiAoXCI/XCIgPT0gYykge1xuICAgICAgICAgICAgdGhpcy5fcXVlcnkgPSBcIj9cIjtcbiAgICAgICAgICAgIHN0YXRlID0gXCJxdWVyeVwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXCIjXCIgPT0gYykge1xuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnQgPSBcIiNcIjtcbiAgICAgICAgICAgIHN0YXRlID0gXCJmcmFnbWVudFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChcIlx0XCIgIT0gYyAmJiBcIlxcblwiICE9IGMgJiYgXCJcXHJcIiAhPSBjKSB7XG4gICAgICAgICAgYnVmZmVyICs9IHBlcmNlbnRFc2NhcGUoYyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwicXVlcnlcIjpcbiAgICAgICAgaWYgKCFzdGF0ZU92ZXJyaWRlICYmIFwiI1wiID09IGMpIHtcbiAgICAgICAgICB0aGlzLl9mcmFnbWVudCA9IFwiI1wiO1xuICAgICAgICAgIHN0YXRlID0gXCJmcmFnbWVudFwiO1xuICAgICAgICB9IGVsc2UgaWYgKEVPRiAhPSBjICYmIFwiXHRcIiAhPSBjICYmIFwiXFxuXCIgIT0gYyAmJiBcIlxcclwiICE9IGMpIHtcbiAgICAgICAgICB0aGlzLl9xdWVyeSArPSBwZXJjZW50RXNjYXBlUXVlcnkoYyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiZnJhZ21lbnRcIjpcbiAgICAgICAgaWYgKEVPRiAhPSBjICYmIFwiXHRcIiAhPSBjICYmIFwiXFxuXCIgIT0gYyAmJiBcIlxcclwiICE9IGMpIHtcbiAgICAgICAgICB0aGlzLl9mcmFnbWVudCArPSBjO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY3Vyc29yKys7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHRoaXMuX3NjaGVtZSA9IFwiXCI7XG4gICAgdGhpcy5fc2NoZW1lRGF0YSA9IFwiXCI7XG4gICAgdGhpcy5fdXNlcm5hbWUgPSBcIlwiO1xuICAgIHRoaXMuX3Bhc3N3b3JkID0gbnVsbDtcbiAgICB0aGlzLl9ob3N0ID0gXCJcIjtcbiAgICB0aGlzLl9wb3J0ID0gXCJcIjtcbiAgICB0aGlzLl9wYXRoID0gW107XG4gICAgdGhpcy5fcXVlcnkgPSBcIlwiO1xuICAgIHRoaXMuX2ZyYWdtZW50ID0gXCJcIjtcbiAgICB0aGlzLl9pc0ludmFsaWQgPSBmYWxzZTtcbiAgICB0aGlzLl9pc1JlbGF0aXZlID0gZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24galVSTCh1cmwsIGJhc2UpIHtcbiAgICBpZiAoYmFzZSAhPT0gdW5kZWZpbmVkICYmICEoYmFzZSBpbnN0YW5jZW9mIGpVUkwpKSBiYXNlID0gbmV3IGpVUkwoU3RyaW5nKGJhc2UpKTtcbiAgICB0aGlzLl91cmwgPSB1cmw7XG4gICAgY2xlYXIuY2FsbCh0aGlzKTtcbiAgICB2YXIgaW5wdXQgPSB1cmwucmVwbGFjZSgvXlsgXFx0XFxyXFxuXFxmXSt8WyBcXHRcXHJcXG5cXGZdKyQvZywgXCJcIik7XG4gICAgcGFyc2UuY2FsbCh0aGlzLCBpbnB1dCwgbnVsbCwgYmFzZSk7XG4gIH1cbiAgalVSTC5wcm90b3R5cGUgPSB7XG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaHJlZjtcbiAgICB9LFxuICAgIGdldCBocmVmKCkge1xuICAgICAgaWYgKHRoaXMuX2lzSW52YWxpZCkgcmV0dXJuIHRoaXMuX3VybDtcbiAgICAgIHZhciBhdXRob3JpdHkgPSBcIlwiO1xuICAgICAgaWYgKFwiXCIgIT0gdGhpcy5fdXNlcm5hbWUgfHwgbnVsbCAhPSB0aGlzLl9wYXNzd29yZCkge1xuICAgICAgICBhdXRob3JpdHkgPSB0aGlzLl91c2VybmFtZSArIChudWxsICE9IHRoaXMuX3Bhc3N3b3JkID8gXCI6XCIgKyB0aGlzLl9wYXNzd29yZCA6IFwiXCIpICsgXCJAXCI7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5wcm90b2NvbCArICh0aGlzLl9pc1JlbGF0aXZlID8gXCIvL1wiICsgYXV0aG9yaXR5ICsgdGhpcy5ob3N0IDogXCJcIikgKyB0aGlzLnBhdGhuYW1lICsgdGhpcy5fcXVlcnkgKyB0aGlzLl9mcmFnbWVudDtcbiAgICB9LFxuICAgIHNldCBocmVmKGhyZWYpIHtcbiAgICAgIGNsZWFyLmNhbGwodGhpcyk7XG4gICAgICBwYXJzZS5jYWxsKHRoaXMsIGhyZWYpO1xuICAgIH0sXG4gICAgZ2V0IHByb3RvY29sKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3NjaGVtZSArIFwiOlwiO1xuICAgIH0sXG4gICAgc2V0IHByb3RvY29sKHByb3RvY29sKSB7XG4gICAgICBpZiAodGhpcy5faXNJbnZhbGlkKSByZXR1cm47XG4gICAgICBwYXJzZS5jYWxsKHRoaXMsIHByb3RvY29sICsgXCI6XCIsIFwic2NoZW1lIHN0YXJ0XCIpO1xuICAgIH0sXG4gICAgZ2V0IGhvc3QoKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXNJbnZhbGlkID8gXCJcIiA6IHRoaXMuX3BvcnQgPyB0aGlzLl9ob3N0ICsgXCI6XCIgKyB0aGlzLl9wb3J0IDogdGhpcy5faG9zdDtcbiAgICB9LFxuICAgIHNldCBob3N0KGhvc3QpIHtcbiAgICAgIGlmICh0aGlzLl9pc0ludmFsaWQgfHwgIXRoaXMuX2lzUmVsYXRpdmUpIHJldHVybjtcbiAgICAgIHBhcnNlLmNhbGwodGhpcywgaG9zdCwgXCJob3N0XCIpO1xuICAgIH0sXG4gICAgZ2V0IGhvc3RuYW1lKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2hvc3Q7XG4gICAgfSxcbiAgICBzZXQgaG9zdG5hbWUoaG9zdG5hbWUpIHtcbiAgICAgIGlmICh0aGlzLl9pc0ludmFsaWQgfHwgIXRoaXMuX2lzUmVsYXRpdmUpIHJldHVybjtcbiAgICAgIHBhcnNlLmNhbGwodGhpcywgaG9zdG5hbWUsIFwiaG9zdG5hbWVcIik7XG4gICAgfSxcbiAgICBnZXQgcG9ydCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wb3J0O1xuICAgIH0sXG4gICAgc2V0IHBvcnQocG9ydCkge1xuICAgICAgaWYgKHRoaXMuX2lzSW52YWxpZCB8fCAhdGhpcy5faXNSZWxhdGl2ZSkgcmV0dXJuO1xuICAgICAgcGFyc2UuY2FsbCh0aGlzLCBwb3J0LCBcInBvcnRcIik7XG4gICAgfSxcbiAgICBnZXQgcGF0aG5hbWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXNJbnZhbGlkID8gXCJcIiA6IHRoaXMuX2lzUmVsYXRpdmUgPyBcIi9cIiArIHRoaXMuX3BhdGguam9pbihcIi9cIikgOiB0aGlzLl9zY2hlbWVEYXRhO1xuICAgIH0sXG4gICAgc2V0IHBhdGhuYW1lKHBhdGhuYW1lKSB7XG4gICAgICBpZiAodGhpcy5faXNJbnZhbGlkIHx8ICF0aGlzLl9pc1JlbGF0aXZlKSByZXR1cm47XG4gICAgICB0aGlzLl9wYXRoID0gW107XG4gICAgICBwYXJzZS5jYWxsKHRoaXMsIHBhdGhuYW1lLCBcInJlbGF0aXZlIHBhdGggc3RhcnRcIik7XG4gICAgfSxcbiAgICBnZXQgc2VhcmNoKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2lzSW52YWxpZCB8fCAhdGhpcy5fcXVlcnkgfHwgXCI/XCIgPT0gdGhpcy5fcXVlcnkgPyBcIlwiIDogdGhpcy5fcXVlcnk7XG4gICAgfSxcbiAgICBzZXQgc2VhcmNoKHNlYXJjaCkge1xuICAgICAgaWYgKHRoaXMuX2lzSW52YWxpZCB8fCAhdGhpcy5faXNSZWxhdGl2ZSkgcmV0dXJuO1xuICAgICAgdGhpcy5fcXVlcnkgPSBcIj9cIjtcbiAgICAgIGlmIChcIj9cIiA9PSBzZWFyY2hbMF0pIHNlYXJjaCA9IHNlYXJjaC5zbGljZSgxKTtcbiAgICAgIHBhcnNlLmNhbGwodGhpcywgc2VhcmNoLCBcInF1ZXJ5XCIpO1xuICAgIH0sXG4gICAgZ2V0IGhhc2goKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXNJbnZhbGlkIHx8ICF0aGlzLl9mcmFnbWVudCB8fCBcIiNcIiA9PSB0aGlzLl9mcmFnbWVudCA/IFwiXCIgOiB0aGlzLl9mcmFnbWVudDtcbiAgICB9LFxuICAgIHNldCBoYXNoKGhhc2gpIHtcbiAgICAgIGlmICh0aGlzLl9pc0ludmFsaWQpIHJldHVybjtcbiAgICAgIHRoaXMuX2ZyYWdtZW50ID0gXCIjXCI7XG4gICAgICBpZiAoXCIjXCIgPT0gaGFzaFswXSkgaGFzaCA9IGhhc2guc2xpY2UoMSk7XG4gICAgICBwYXJzZS5jYWxsKHRoaXMsIGhhc2gsIFwiZnJhZ21lbnRcIik7XG4gICAgfSxcbiAgICBnZXQgb3JpZ2luKCkge1xuICAgICAgdmFyIGhvc3Q7XG4gICAgICBpZiAodGhpcy5faXNJbnZhbGlkIHx8ICF0aGlzLl9zY2hlbWUpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKHRoaXMuX3NjaGVtZSkge1xuICAgICAgIGNhc2UgXCJkYXRhXCI6XG4gICAgICAgY2FzZSBcImZpbGVcIjpcbiAgICAgICBjYXNlIFwiamF2YXNjcmlwdFwiOlxuICAgICAgIGNhc2UgXCJtYWlsdG9cIjpcbiAgICAgICAgcmV0dXJuIFwibnVsbFwiO1xuICAgICAgfVxuICAgICAgaG9zdCA9IHRoaXMuaG9zdDtcbiAgICAgIGlmICghaG9zdCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9zY2hlbWUgKyBcIjovL1wiICsgaG9zdDtcbiAgICB9XG4gIH07XG4gIHZhciBPcmlnaW5hbFVSTCA9IHNjb3BlLlVSTDtcbiAgaWYgKE9yaWdpbmFsVVJMKSB7XG4gICAgalVSTC5jcmVhdGVPYmplY3RVUkwgPSBmdW5jdGlvbihibG9iKSB7XG4gICAgICByZXR1cm4gT3JpZ2luYWxVUkwuY3JlYXRlT2JqZWN0VVJMLmFwcGx5KE9yaWdpbmFsVVJMLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgalVSTC5yZXZva2VPYmplY3RVUkwgPSBmdW5jdGlvbih1cmwpIHtcbiAgICAgIE9yaWdpbmFsVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuICAgIH07XG4gIH1cbiAgc2NvcGUuVVJMID0galVSTDtcbn0pKHNlbGYpO1xuXG4oZnVuY3Rpb24oZ2xvYmFsKSB7XG4gIGlmIChnbG9iYWwuSnNNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciByZWdpc3RyYXRpb25zVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICB2YXIgc2V0SW1tZWRpYXRlO1xuICBpZiAoL1RyaWRlbnR8RWRnZS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgIHNldEltbWVkaWF0ZSA9IHNldFRpbWVvdXQ7XG4gIH0gZWxzZSBpZiAod2luZG93LnNldEltbWVkaWF0ZSkge1xuICAgIHNldEltbWVkaWF0ZSA9IHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHNldEltbWVkaWF0ZVF1ZXVlID0gW107XG4gICAgdmFyIHNlbnRpbmVsID0gU3RyaW5nKE1hdGgucmFuZG9tKCkpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoZS5kYXRhID09PSBzZW50aW5lbCkge1xuICAgICAgICB2YXIgcXVldWUgPSBzZXRJbW1lZGlhdGVRdWV1ZTtcbiAgICAgICAgc2V0SW1tZWRpYXRlUXVldWUgPSBbXTtcbiAgICAgICAgcXVldWUuZm9yRWFjaChmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgICAgZnVuYygpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBzZXRJbW1lZGlhdGUgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgICBzZXRJbW1lZGlhdGVRdWV1ZS5wdXNoKGZ1bmMpO1xuICAgICAgd2luZG93LnBvc3RNZXNzYWdlKHNlbnRpbmVsLCBcIipcIik7XG4gICAgfTtcbiAgfVxuICB2YXIgaXNTY2hlZHVsZWQgPSBmYWxzZTtcbiAgdmFyIHNjaGVkdWxlZE9ic2VydmVycyA9IFtdO1xuICBmdW5jdGlvbiBzY2hlZHVsZUNhbGxiYWNrKG9ic2VydmVyKSB7XG4gICAgc2NoZWR1bGVkT2JzZXJ2ZXJzLnB1c2gob2JzZXJ2ZXIpO1xuICAgIGlmICghaXNTY2hlZHVsZWQpIHtcbiAgICAgIGlzU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgIHNldEltbWVkaWF0ZShkaXNwYXRjaENhbGxiYWNrcyk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHdyYXBJZk5lZWRlZChub2RlKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCAmJiB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwud3JhcElmTmVlZGVkKG5vZGUpIHx8IG5vZGU7XG4gIH1cbiAgZnVuY3Rpb24gZGlzcGF0Y2hDYWxsYmFja3MoKSB7XG4gICAgaXNTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICB2YXIgb2JzZXJ2ZXJzID0gc2NoZWR1bGVkT2JzZXJ2ZXJzO1xuICAgIHNjaGVkdWxlZE9ic2VydmVycyA9IFtdO1xuICAgIG9ic2VydmVycy5zb3J0KGZ1bmN0aW9uKG8xLCBvMikge1xuICAgICAgcmV0dXJuIG8xLnVpZF8gLSBvMi51aWRfO1xuICAgIH0pO1xuICAgIHZhciBhbnlOb25FbXB0eSA9IGZhbHNlO1xuICAgIG9ic2VydmVycy5mb3JFYWNoKGZ1bmN0aW9uKG9ic2VydmVyKSB7XG4gICAgICB2YXIgcXVldWUgPSBvYnNlcnZlci50YWtlUmVjb3JkcygpO1xuICAgICAgcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzRm9yKG9ic2VydmVyKTtcbiAgICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgb2JzZXJ2ZXIuY2FsbGJhY2tfKHF1ZXVlLCBvYnNlcnZlcik7XG4gICAgICAgIGFueU5vbkVtcHR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoYW55Tm9uRW1wdHkpIGRpc3BhdGNoQ2FsbGJhY2tzKCk7XG4gIH1cbiAgZnVuY3Rpb24gcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzRm9yKG9ic2VydmVyKSB7XG4gICAgb2JzZXJ2ZXIubm9kZXNfLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSByZXR1cm47XG4gICAgICByZWdpc3RyYXRpb25zLmZvckVhY2goZnVuY3Rpb24ocmVnaXN0cmF0aW9uKSB7XG4gICAgICAgIGlmIChyZWdpc3RyYXRpb24ub2JzZXJ2ZXIgPT09IG9ic2VydmVyKSByZWdpc3RyYXRpb24ucmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBmb3JFYWNoQW5jZXN0b3JBbmRPYnNlcnZlckVucXVldWVSZWNvcmQodGFyZ2V0LCBjYWxsYmFjaykge1xuICAgIGZvciAodmFyIG5vZGUgPSB0YXJnZXQ7IG5vZGU7IG5vZGUgPSBub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgIGlmIChyZWdpc3RyYXRpb25zKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHZhciByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2pdO1xuICAgICAgICAgIHZhciBvcHRpb25zID0gcmVnaXN0cmF0aW9uLm9wdGlvbnM7XG4gICAgICAgICAgaWYgKG5vZGUgIT09IHRhcmdldCAmJiAhb3B0aW9ucy5zdWJ0cmVlKSBjb250aW51ZTtcbiAgICAgICAgICB2YXIgcmVjb3JkID0gY2FsbGJhY2sob3B0aW9ucyk7XG4gICAgICAgICAgaWYgKHJlY29yZCkgcmVnaXN0cmF0aW9uLmVucXVldWUocmVjb3JkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB2YXIgdWlkQ291bnRlciA9IDA7XG4gIGZ1bmN0aW9uIEpzTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjaykge1xuICAgIHRoaXMuY2FsbGJhY2tfID0gY2FsbGJhY2s7XG4gICAgdGhpcy5ub2Rlc18gPSBbXTtcbiAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgdGhpcy51aWRfID0gKyt1aWRDb3VudGVyO1xuICB9XG4gIEpzTXV0YXRpb25PYnNlcnZlci5wcm90b3R5cGUgPSB7XG4gICAgb2JzZXJ2ZTogZnVuY3Rpb24odGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgICB0YXJnZXQgPSB3cmFwSWZOZWVkZWQodGFyZ2V0KTtcbiAgICAgIGlmICghb3B0aW9ucy5jaGlsZExpc3QgJiYgIW9wdGlvbnMuYXR0cmlidXRlcyAmJiAhb3B0aW9ucy5jaGFyYWN0ZXJEYXRhIHx8IG9wdGlvbnMuYXR0cmlidXRlT2xkVmFsdWUgJiYgIW9wdGlvbnMuYXR0cmlidXRlcyB8fCBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlciAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5sZW5ndGggJiYgIW9wdGlvbnMuYXR0cmlidXRlcyB8fCBvcHRpb25zLmNoYXJhY3RlckRhdGFPbGRWYWx1ZSAmJiAhb3B0aW9ucy5jaGFyYWN0ZXJEYXRhKSB7XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcigpO1xuICAgICAgfVxuICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KHRhcmdldCk7XG4gICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIHJlZ2lzdHJhdGlvbnNUYWJsZS5zZXQodGFyZ2V0LCByZWdpc3RyYXRpb25zID0gW10pO1xuICAgICAgdmFyIHJlZ2lzdHJhdGlvbjtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocmVnaXN0cmF0aW9uc1tpXS5vYnNlcnZlciA9PT0gdGhpcykge1xuICAgICAgICAgIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbaV07XG4gICAgICAgICAgcmVnaXN0cmF0aW9uLnJlbW92ZUxpc3RlbmVycygpO1xuICAgICAgICAgIHJlZ2lzdHJhdGlvbi5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFyZWdpc3RyYXRpb24pIHtcbiAgICAgICAgcmVnaXN0cmF0aW9uID0gbmV3IFJlZ2lzdHJhdGlvbih0aGlzLCB0YXJnZXQsIG9wdGlvbnMpO1xuICAgICAgICByZWdpc3RyYXRpb25zLnB1c2gocmVnaXN0cmF0aW9uKTtcbiAgICAgICAgdGhpcy5ub2Rlc18ucHVzaCh0YXJnZXQpO1xuICAgICAgfVxuICAgICAgcmVnaXN0cmF0aW9uLmFkZExpc3RlbmVycygpO1xuICAgIH0sXG4gICAgZGlzY29ubmVjdDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLm5vZGVzXy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tpXTtcbiAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9ic2VydmVyID09PSB0aGlzKSB7XG4gICAgICAgICAgICByZWdpc3RyYXRpb24ucmVtb3ZlTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICByZWdpc3RyYXRpb25zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwgdGhpcyk7XG4gICAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgfSxcbiAgICB0YWtlUmVjb3JkczogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY29weU9mUmVjb3JkcyA9IHRoaXMucmVjb3Jkc187XG4gICAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgICByZXR1cm4gY29weU9mUmVjb3JkcztcbiAgICB9XG4gIH07XG4gIGZ1bmN0aW9uIE11dGF0aW9uUmVjb3JkKHR5cGUsIHRhcmdldCkge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy5hZGRlZE5vZGVzID0gW107XG4gICAgdGhpcy5yZW1vdmVkTm9kZXMgPSBbXTtcbiAgICB0aGlzLnByZXZpb3VzU2libGluZyA9IG51bGw7XG4gICAgdGhpcy5uZXh0U2libGluZyA9IG51bGw7XG4gICAgdGhpcy5hdHRyaWJ1dGVOYW1lID0gbnVsbDtcbiAgICB0aGlzLmF0dHJpYnV0ZU5hbWVzcGFjZSA9IG51bGw7XG4gICAgdGhpcy5vbGRWYWx1ZSA9IG51bGw7XG4gIH1cbiAgZnVuY3Rpb24gY29weU11dGF0aW9uUmVjb3JkKG9yaWdpbmFsKSB7XG4gICAgdmFyIHJlY29yZCA9IG5ldyBNdXRhdGlvblJlY29yZChvcmlnaW5hbC50eXBlLCBvcmlnaW5hbC50YXJnZXQpO1xuICAgIHJlY29yZC5hZGRlZE5vZGVzID0gb3JpZ2luYWwuYWRkZWROb2Rlcy5zbGljZSgpO1xuICAgIHJlY29yZC5yZW1vdmVkTm9kZXMgPSBvcmlnaW5hbC5yZW1vdmVkTm9kZXMuc2xpY2UoKTtcbiAgICByZWNvcmQucHJldmlvdXNTaWJsaW5nID0gb3JpZ2luYWwucHJldmlvdXNTaWJsaW5nO1xuICAgIHJlY29yZC5uZXh0U2libGluZyA9IG9yaWdpbmFsLm5leHRTaWJsaW5nO1xuICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lID0gb3JpZ2luYWwuYXR0cmlidXRlTmFtZTtcbiAgICByZWNvcmQuYXR0cmlidXRlTmFtZXNwYWNlID0gb3JpZ2luYWwuYXR0cmlidXRlTmFtZXNwYWNlO1xuICAgIHJlY29yZC5vbGRWYWx1ZSA9IG9yaWdpbmFsLm9sZFZhbHVlO1xuICAgIHJldHVybiByZWNvcmQ7XG4gIH1cbiAgdmFyIGN1cnJlbnRSZWNvcmQsIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgZnVuY3Rpb24gZ2V0UmVjb3JkKHR5cGUsIHRhcmdldCkge1xuICAgIHJldHVybiBjdXJyZW50UmVjb3JkID0gbmV3IE11dGF0aW9uUmVjb3JkKHR5cGUsIHRhcmdldCk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0UmVjb3JkV2l0aE9sZFZhbHVlKG9sZFZhbHVlKSB7XG4gICAgaWYgKHJlY29yZFdpdGhPbGRWYWx1ZSkgcmV0dXJuIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgICByZWNvcmRXaXRoT2xkVmFsdWUgPSBjb3B5TXV0YXRpb25SZWNvcmQoY3VycmVudFJlY29yZCk7XG4gICAgcmVjb3JkV2l0aE9sZFZhbHVlLm9sZFZhbHVlID0gb2xkVmFsdWU7XG4gICAgcmV0dXJuIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgfVxuICBmdW5jdGlvbiBjbGVhclJlY29yZHMoKSB7XG4gICAgY3VycmVudFJlY29yZCA9IHJlY29yZFdpdGhPbGRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgfVxuICBmdW5jdGlvbiByZWNvcmRSZXByZXNlbnRzQ3VycmVudE11dGF0aW9uKHJlY29yZCkge1xuICAgIHJldHVybiByZWNvcmQgPT09IHJlY29yZFdpdGhPbGRWYWx1ZSB8fCByZWNvcmQgPT09IGN1cnJlbnRSZWNvcmQ7XG4gIH1cbiAgZnVuY3Rpb24gc2VsZWN0UmVjb3JkKGxhc3RSZWNvcmQsIG5ld1JlY29yZCkge1xuICAgIGlmIChsYXN0UmVjb3JkID09PSBuZXdSZWNvcmQpIHJldHVybiBsYXN0UmVjb3JkO1xuICAgIGlmIChyZWNvcmRXaXRoT2xkVmFsdWUgJiYgcmVjb3JkUmVwcmVzZW50c0N1cnJlbnRNdXRhdGlvbihsYXN0UmVjb3JkKSkgcmV0dXJuIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBmdW5jdGlvbiBSZWdpc3RyYXRpb24ob2JzZXJ2ZXIsIHRhcmdldCwgb3B0aW9ucykge1xuICAgIHRoaXMub2JzZXJ2ZXIgPSBvYnNlcnZlcjtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IFtdO1xuICB9XG4gIFJlZ2lzdHJhdGlvbi5wcm90b3R5cGUgPSB7XG4gICAgZW5xdWV1ZTogZnVuY3Rpb24ocmVjb3JkKSB7XG4gICAgICB2YXIgcmVjb3JkcyA9IHRoaXMub2JzZXJ2ZXIucmVjb3Jkc187XG4gICAgICB2YXIgbGVuZ3RoID0gcmVjb3Jkcy5sZW5ndGg7XG4gICAgICBpZiAocmVjb3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBsYXN0UmVjb3JkID0gcmVjb3Jkc1tsZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIHJlY29yZFRvUmVwbGFjZUxhc3QgPSBzZWxlY3RSZWNvcmQobGFzdFJlY29yZCwgcmVjb3JkKTtcbiAgICAgICAgaWYgKHJlY29yZFRvUmVwbGFjZUxhc3QpIHtcbiAgICAgICAgICByZWNvcmRzW2xlbmd0aCAtIDFdID0gcmVjb3JkVG9SZXBsYWNlTGFzdDtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjaGVkdWxlQ2FsbGJhY2sodGhpcy5vYnNlcnZlcik7XG4gICAgICB9XG4gICAgICByZWNvcmRzW2xlbmd0aF0gPSByZWNvcmQ7XG4gICAgfSxcbiAgICBhZGRMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5hZGRMaXN0ZW5lcnNfKHRoaXMudGFyZ2V0KTtcbiAgICB9LFxuICAgIGFkZExpc3RlbmVyc186IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlcykgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiRE9NQXR0ck1vZGlmaWVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hhcmFjdGVyRGF0YSkgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ2hhcmFjdGVyRGF0YU1vZGlmaWVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hpbGRMaXN0KSBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJET01Ob2RlSW5zZXJ0ZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QgfHwgb3B0aW9ucy5zdWJ0cmVlKSBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJET01Ob2RlUmVtb3ZlZFwiLCB0aGlzLCB0cnVlKTtcbiAgICB9LFxuICAgIHJlbW92ZUxpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyc18odGhpcy50YXJnZXQpO1xuICAgIH0sXG4gICAgcmVtb3ZlTGlzdGVuZXJzXzogZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzKSBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01BdHRyTW9kaWZpZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGFyYWN0ZXJEYXRhKSBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01DaGFyYWN0ZXJEYXRhTW9kaWZpZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QpIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIkRPTU5vZGVJbnNlcnRlZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoaWxkTGlzdCB8fCBvcHRpb25zLnN1YnRyZWUpIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIkRPTU5vZGVSZW1vdmVkXCIsIHRoaXMsIHRydWUpO1xuICAgIH0sXG4gICAgYWRkVHJhbnNpZW50T2JzZXJ2ZXI6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIGlmIChub2RlID09PSB0aGlzLnRhcmdldCkgcmV0dXJuO1xuICAgICAgdGhpcy5hZGRMaXN0ZW5lcnNfKG5vZGUpO1xuICAgICAgdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIHJlZ2lzdHJhdGlvbnNUYWJsZS5zZXQobm9kZSwgcmVnaXN0cmF0aW9ucyA9IFtdKTtcbiAgICAgIHJlZ2lzdHJhdGlvbnMucHVzaCh0aGlzKTtcbiAgICB9LFxuICAgIHJlbW92ZVRyYW5zaWVudE9ic2VydmVyczogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcztcbiAgICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IFtdO1xuICAgICAgdHJhbnNpZW50T2JzZXJ2ZWROb2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnNfKG5vZGUpO1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChyZWdpc3RyYXRpb25zW2ldID09PSB0aGlzKSB7XG4gICAgICAgICAgICByZWdpc3RyYXRpb25zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwgdGhpcyk7XG4gICAgfSxcbiAgICBoYW5kbGVFdmVudDogZnVuY3Rpb24oZSkge1xuICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICAgY2FzZSBcIkRPTUF0dHJNb2RpZmllZFwiOlxuICAgICAgICB2YXIgbmFtZSA9IGUuYXR0ck5hbWU7XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSBlLnJlbGF0ZWROb2RlLm5hbWVzcGFjZVVSSTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICB2YXIgcmVjb3JkID0gbmV3IGdldFJlY29yZChcImF0dHJpYnV0ZXNcIiwgdGFyZ2V0KTtcbiAgICAgICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWUgPSBuYW1lO1xuICAgICAgICByZWNvcmQuYXR0cmlidXRlTmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSBlLmF0dHJDaGFuZ2UgPT09IE11dGF0aW9uRXZlbnQuQURESVRJT04gPyBudWxsIDogZS5wcmV2VmFsdWU7XG4gICAgICAgIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZCh0YXJnZXQsIGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICBpZiAoIW9wdGlvbnMuYXR0cmlidXRlcykgcmV0dXJuO1xuICAgICAgICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZUZpbHRlciAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5sZW5ndGggJiYgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIuaW5kZXhPZihuYW1lKSA9PT0gLTEgJiYgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIuaW5kZXhPZihuYW1lc3BhY2UpID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVPbGRWYWx1ZSkgcmV0dXJuIGdldFJlY29yZFdpdGhPbGRWYWx1ZShvbGRWYWx1ZSk7XG4gICAgICAgICAgcmV0dXJuIHJlY29yZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcIkRPTUNoYXJhY3RlckRhdGFNb2RpZmllZFwiOlxuICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgIHZhciByZWNvcmQgPSBnZXRSZWNvcmQoXCJjaGFyYWN0ZXJEYXRhXCIsIHRhcmdldCk7XG4gICAgICAgIHZhciBvbGRWYWx1ZSA9IGUucHJldlZhbHVlO1xuICAgICAgICBmb3JFYWNoQW5jZXN0b3JBbmRPYnNlcnZlckVucXVldWVSZWNvcmQodGFyZ2V0LCBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKCFvcHRpb25zLmNoYXJhY3RlckRhdGEpIHJldHVybjtcbiAgICAgICAgICBpZiAob3B0aW9ucy5jaGFyYWN0ZXJEYXRhT2xkVmFsdWUpIHJldHVybiBnZXRSZWNvcmRXaXRoT2xkVmFsdWUob2xkVmFsdWUpO1xuICAgICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICAgIH0pO1xuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJET01Ob2RlUmVtb3ZlZFwiOlxuICAgICAgICB0aGlzLmFkZFRyYW5zaWVudE9ic2VydmVyKGUudGFyZ2V0KTtcblxuICAgICAgIGNhc2UgXCJET01Ob2RlSW5zZXJ0ZWRcIjpcbiAgICAgICAgdmFyIGNoYW5nZWROb2RlID0gZS50YXJnZXQ7XG4gICAgICAgIHZhciBhZGRlZE5vZGVzLCByZW1vdmVkTm9kZXM7XG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwiRE9NTm9kZUluc2VydGVkXCIpIHtcbiAgICAgICAgICBhZGRlZE5vZGVzID0gWyBjaGFuZ2VkTm9kZSBdO1xuICAgICAgICAgIHJlbW92ZWROb2RlcyA9IFtdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFkZGVkTm9kZXMgPSBbXTtcbiAgICAgICAgICByZW1vdmVkTm9kZXMgPSBbIGNoYW5nZWROb2RlIF07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHByZXZpb3VzU2libGluZyA9IGNoYW5nZWROb2RlLnByZXZpb3VzU2libGluZztcbiAgICAgICAgdmFyIG5leHRTaWJsaW5nID0gY2hhbmdlZE5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgIHZhciByZWNvcmQgPSBnZXRSZWNvcmQoXCJjaGlsZExpc3RcIiwgZS50YXJnZXQucGFyZW50Tm9kZSk7XG4gICAgICAgIHJlY29yZC5hZGRlZE5vZGVzID0gYWRkZWROb2RlcztcbiAgICAgICAgcmVjb3JkLnJlbW92ZWROb2RlcyA9IHJlbW92ZWROb2RlcztcbiAgICAgICAgcmVjb3JkLnByZXZpb3VzU2libGluZyA9IHByZXZpb3VzU2libGluZztcbiAgICAgICAgcmVjb3JkLm5leHRTaWJsaW5nID0gbmV4dFNpYmxpbmc7XG4gICAgICAgIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZChlLnJlbGF0ZWROb2RlLCBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKCFvcHRpb25zLmNoaWxkTGlzdCkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY2xlYXJSZWNvcmRzKCk7XG4gICAgfVxuICB9O1xuICBnbG9iYWwuSnNNdXRhdGlvbk9ic2VydmVyID0gSnNNdXRhdGlvbk9ic2VydmVyO1xuICBpZiAoIWdsb2JhbC5NdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgZ2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIgPSBKc011dGF0aW9uT2JzZXJ2ZXI7XG4gICAgSnNNdXRhdGlvbk9ic2VydmVyLl9pc1BvbHlmaWxsZWQgPSB0cnVlO1xuICB9XG59KShzZWxmKTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICBpZiAoIXdpbmRvdy5wZXJmb3JtYW5jZSkge1xuICAgIHZhciBzdGFydCA9IERhdGUubm93KCk7XG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xuICAgICAgbm93OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIERhdGUubm93KCkgLSBzdGFydDtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGlmICghd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBuYXRpdmVSYWYgPSB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gICAgICByZXR1cm4gbmF0aXZlUmFmID8gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZVJhZihmdW5jdGlvbigpIHtcbiAgICAgICAgICBjYWxsYmFjayhwZXJmb3JtYW5jZS5ub3coKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSA6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuc2V0VGltZW91dChjYWxsYmFjaywgMWUzIC8gNjApO1xuICAgICAgfTtcbiAgICB9KCk7XG4gIH1cbiAgaWYgKCF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB3aW5kb3cud2Via2l0Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgICB9O1xuICAgIH0oKTtcbiAgfVxuICB2YXIgd29ya2luZ0RlZmF1bHRQcmV2ZW50ZWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiRXZlbnRcIik7XG4gICAgZS5pbml0RXZlbnQoXCJmb29cIiwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHJldHVybiBlLmRlZmF1bHRQcmV2ZW50ZWQ7XG4gIH0oKTtcbiAgaWYgKCF3b3JraW5nRGVmYXVsdFByZXZlbnRlZCkge1xuICAgIHZhciBvcmlnUHJldmVudERlZmF1bHQgPSBFdmVudC5wcm90b3R5cGUucHJldmVudERlZmF1bHQ7XG4gICAgRXZlbnQucHJvdG90eXBlLnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuY2FuY2VsYWJsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBvcmlnUHJldmVudERlZmF1bHQuY2FsbCh0aGlzKTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImRlZmF1bHRQcmV2ZW50ZWRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cbiAgdmFyIGlzSUUgPSAvVHJpZGVudC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgaWYgKCF3aW5kb3cuQ3VzdG9tRXZlbnQgfHwgaXNJRSAmJiB0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB3aW5kb3cuQ3VzdG9tRXZlbnQgPSBmdW5jdGlvbihpblR5cGUsIHBhcmFtcykge1xuICAgICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgICAgZS5pbml0Q3VzdG9tRXZlbnQoaW5UeXBlLCBCb29sZWFuKHBhcmFtcy5idWJibGVzKSwgQm9vbGVhbihwYXJhbXMuY2FuY2VsYWJsZSksIHBhcmFtcy5kZXRhaWwpO1xuICAgICAgcmV0dXJuIGU7XG4gICAgfTtcbiAgICB3aW5kb3cuQ3VzdG9tRXZlbnQucHJvdG90eXBlID0gd2luZG93LkV2ZW50LnByb3RvdHlwZTtcbiAgfVxuICBpZiAoIXdpbmRvdy5FdmVudCB8fCBpc0lFICYmIHR5cGVvZiB3aW5kb3cuRXZlbnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHZhciBvcmlnRXZlbnQgPSB3aW5kb3cuRXZlbnQ7XG4gICAgd2luZG93LkV2ZW50ID0gZnVuY3Rpb24oaW5UeXBlLCBwYXJhbXMpIHtcbiAgICAgIHBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcbiAgICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKTtcbiAgICAgIGUuaW5pdEV2ZW50KGluVHlwZSwgQm9vbGVhbihwYXJhbXMuYnViYmxlcyksIEJvb2xlYW4ocGFyYW1zLmNhbmNlbGFibGUpKTtcbiAgICAgIHJldHVybiBlO1xuICAgIH07XG4gICAgd2luZG93LkV2ZW50LnByb3RvdHlwZSA9IG9yaWdFdmVudC5wcm90b3R5cGU7XG4gIH1cbn0pKHdpbmRvdy5XZWJDb21wb25lbnRzKTtcblxud2luZG93LkhUTUxJbXBvcnRzID0gd2luZG93LkhUTUxJbXBvcnRzIHx8IHtcbiAgZmxhZ3M6IHt9XG59O1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIElNUE9SVF9MSU5LX1RZUEUgPSBcImltcG9ydFwiO1xuICB2YXIgdXNlTmF0aXZlID0gQm9vbGVhbihJTVBPUlRfTElOS19UWVBFIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaW5rXCIpKTtcbiAgdmFyIGhhc1NoYWRvd0RPTVBvbHlmaWxsID0gQm9vbGVhbih3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpO1xuICB2YXIgd3JhcCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICByZXR1cm4gaGFzU2hhZG93RE9NUG9seWZpbGwgPyB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwud3JhcElmTmVlZGVkKG5vZGUpIDogbm9kZTtcbiAgfTtcbiAgdmFyIHJvb3REb2N1bWVudCA9IHdyYXAoZG9jdW1lbnQpO1xuICB2YXIgY3VycmVudFNjcmlwdERlc2NyaXB0b3IgPSB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzY3JpcHQgPSB3aW5kb3cuSFRNTEltcG9ydHMuY3VycmVudFNjcmlwdCB8fCBkb2N1bWVudC5jdXJyZW50U2NyaXB0IHx8IChkb2N1bWVudC5yZWFkeVN0YXRlICE9PSBcImNvbXBsZXRlXCIgPyBkb2N1bWVudC5zY3JpcHRzW2RvY3VtZW50LnNjcmlwdHMubGVuZ3RoIC0gMV0gOiBudWxsKTtcbiAgICAgIHJldHVybiB3cmFwKHNjcmlwdCk7XG4gICAgfSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGRvY3VtZW50LCBcIl9jdXJyZW50U2NyaXB0XCIsIGN1cnJlbnRTY3JpcHREZXNjcmlwdG9yKTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHJvb3REb2N1bWVudCwgXCJfY3VycmVudFNjcmlwdFwiLCBjdXJyZW50U2NyaXB0RGVzY3JpcHRvcik7XG4gIHZhciBpc0lFID0gL1RyaWRlbnQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gIGZ1bmN0aW9uIHdoZW5SZWFkeShjYWxsYmFjaywgZG9jKSB7XG4gICAgZG9jID0gZG9jIHx8IHJvb3REb2N1bWVudDtcbiAgICB3aGVuRG9jdW1lbnRSZWFkeShmdW5jdGlvbigpIHtcbiAgICAgIHdhdGNoSW1wb3J0c0xvYWQoY2FsbGJhY2ssIGRvYyk7XG4gICAgfSwgZG9jKTtcbiAgfVxuICB2YXIgcmVxdWlyZWRSZWFkeVN0YXRlID0gaXNJRSA/IFwiY29tcGxldGVcIiA6IFwiaW50ZXJhY3RpdmVcIjtcbiAgdmFyIFJFQURZX0VWRU5UID0gXCJyZWFkeXN0YXRlY2hhbmdlXCI7XG4gIGZ1bmN0aW9uIGlzRG9jdW1lbnRSZWFkeShkb2MpIHtcbiAgICByZXR1cm4gZG9jLnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIiB8fCBkb2MucmVhZHlTdGF0ZSA9PT0gcmVxdWlyZWRSZWFkeVN0YXRlO1xuICB9XG4gIGZ1bmN0aW9uIHdoZW5Eb2N1bWVudFJlYWR5KGNhbGxiYWNrLCBkb2MpIHtcbiAgICBpZiAoIWlzRG9jdW1lbnRSZWFkeShkb2MpKSB7XG4gICAgICB2YXIgY2hlY2tSZWFkeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoZG9jLnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIiB8fCBkb2MucmVhZHlTdGF0ZSA9PT0gcmVxdWlyZWRSZWFkeVN0YXRlKSB7XG4gICAgICAgICAgZG9jLnJlbW92ZUV2ZW50TGlzdGVuZXIoUkVBRFlfRVZFTlQsIGNoZWNrUmVhZHkpO1xuICAgICAgICAgIHdoZW5Eb2N1bWVudFJlYWR5KGNhbGxiYWNrLCBkb2MpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoUkVBRFlfRVZFTlQsIGNoZWNrUmVhZHkpO1xuICAgIH0gZWxzZSBpZiAoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIG1hcmtUYXJnZXRMb2FkZWQoZXZlbnQpIHtcbiAgICBldmVudC50YXJnZXQuX19sb2FkZWQgPSB0cnVlO1xuICB9XG4gIGZ1bmN0aW9uIHdhdGNoSW1wb3J0c0xvYWQoY2FsbGJhY2ssIGRvYykge1xuICAgIHZhciBpbXBvcnRzID0gZG9jLnF1ZXJ5U2VsZWN0b3JBbGwoXCJsaW5rW3JlbD1pbXBvcnRdXCIpO1xuICAgIHZhciBwYXJzZWRDb3VudCA9IDAsIGltcG9ydENvdW50ID0gaW1wb3J0cy5sZW5ndGgsIG5ld0ltcG9ydHMgPSBbXSwgZXJyb3JJbXBvcnRzID0gW107XG4gICAgZnVuY3Rpb24gY2hlY2tEb25lKCkge1xuICAgICAgaWYgKHBhcnNlZENvdW50ID09IGltcG9ydENvdW50ICYmIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKHtcbiAgICAgICAgICBhbGxJbXBvcnRzOiBpbXBvcnRzLFxuICAgICAgICAgIGxvYWRlZEltcG9ydHM6IG5ld0ltcG9ydHMsXG4gICAgICAgICAgZXJyb3JJbXBvcnRzOiBlcnJvckltcG9ydHNcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGxvYWRlZEltcG9ydChlKSB7XG4gICAgICBtYXJrVGFyZ2V0TG9hZGVkKGUpO1xuICAgICAgbmV3SW1wb3J0cy5wdXNoKHRoaXMpO1xuICAgICAgcGFyc2VkQ291bnQrKztcbiAgICAgIGNoZWNrRG9uZSgpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBlcnJvckxvYWRpbmdJbXBvcnQoZSkge1xuICAgICAgZXJyb3JJbXBvcnRzLnB1c2godGhpcyk7XG4gICAgICBwYXJzZWRDb3VudCsrO1xuICAgICAgY2hlY2tEb25lKCk7XG4gICAgfVxuICAgIGlmIChpbXBvcnRDb3VudCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGltcDsgaSA8IGltcG9ydENvdW50ICYmIChpbXAgPSBpbXBvcnRzW2ldKTsgaSsrKSB7XG4gICAgICAgIGlmIChpc0ltcG9ydExvYWRlZChpbXApKSB7XG4gICAgICAgICAgbmV3SW1wb3J0cy5wdXNoKHRoaXMpO1xuICAgICAgICAgIHBhcnNlZENvdW50Kys7XG4gICAgICAgICAgY2hlY2tEb25lKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW1wLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGxvYWRlZEltcG9ydCk7XG4gICAgICAgICAgaW1wLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCBlcnJvckxvYWRpbmdJbXBvcnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNoZWNrRG9uZSgpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBpc0ltcG9ydExvYWRlZChsaW5rKSB7XG4gICAgcmV0dXJuIHVzZU5hdGl2ZSA/IGxpbmsuX19sb2FkZWQgfHwgbGluay5pbXBvcnQgJiYgbGluay5pbXBvcnQucmVhZHlTdGF0ZSAhPT0gXCJsb2FkaW5nXCIgOiBsaW5rLl9faW1wb3J0UGFyc2VkO1xuICB9XG4gIGlmICh1c2VOYXRpdmUpIHtcbiAgICBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbihteG5zKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG14bnMubGVuZ3RoLCBtOyBpIDwgbCAmJiAobSA9IG14bnNbaV0pOyBpKyspIHtcbiAgICAgICAgaWYgKG0uYWRkZWROb2Rlcykge1xuICAgICAgICAgIGhhbmRsZUltcG9ydHMobS5hZGRlZE5vZGVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLm9ic2VydmUoZG9jdW1lbnQuaGVhZCwge1xuICAgICAgY2hpbGRMaXN0OiB0cnVlXG4gICAgfSk7XG4gICAgZnVuY3Rpb24gaGFuZGxlSW1wb3J0cyhub2Rlcykge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBub2Rlcy5sZW5ndGgsIG47IGkgPCBsICYmIChuID0gbm9kZXNbaV0pOyBpKyspIHtcbiAgICAgICAgaWYgKGlzSW1wb3J0KG4pKSB7XG4gICAgICAgICAgaGFuZGxlSW1wb3J0KG4pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzSW1wb3J0KGVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBlbGVtZW50LmxvY2FsTmFtZSA9PT0gXCJsaW5rXCIgJiYgZWxlbWVudC5yZWwgPT09IFwiaW1wb3J0XCI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhhbmRsZUltcG9ydChlbGVtZW50KSB7XG4gICAgICB2YXIgbG9hZGVkID0gZWxlbWVudC5pbXBvcnQ7XG4gICAgICBpZiAobG9hZGVkKSB7XG4gICAgICAgIG1hcmtUYXJnZXRMb2FkZWQoe1xuICAgICAgICAgIHRhcmdldDogZWxlbWVudFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgbWFya1RhcmdldExvYWRlZCk7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIG1hcmtUYXJnZXRMb2FkZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJsb2FkaW5nXCIpIHtcbiAgICAgICAgdmFyIGltcG9ydHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwibGlua1tyZWw9aW1wb3J0XVwiKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBpbXBvcnRzLmxlbmd0aCwgaW1wOyBpIDwgbCAmJiAoaW1wID0gaW1wb3J0c1tpXSk7IGkrKykge1xuICAgICAgICAgIGhhbmRsZUltcG9ydChpbXApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkoKTtcbiAgfVxuICB3aGVuUmVhZHkoZnVuY3Rpb24oZGV0YWlsKSB7XG4gICAgd2luZG93LkhUTUxJbXBvcnRzLnJlYWR5ID0gdHJ1ZTtcbiAgICB3aW5kb3cuSFRNTEltcG9ydHMucmVhZHlUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdmFyIGV2dCA9IHJvb3REb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgIGV2dC5pbml0Q3VzdG9tRXZlbnQoXCJIVE1MSW1wb3J0c0xvYWRlZFwiLCB0cnVlLCB0cnVlLCBkZXRhaWwpO1xuICAgIHJvb3REb2N1bWVudC5kaXNwYXRjaEV2ZW50KGV2dCk7XG4gIH0pO1xuICBzY29wZS5JTVBPUlRfTElOS19UWVBFID0gSU1QT1JUX0xJTktfVFlQRTtcbiAgc2NvcGUudXNlTmF0aXZlID0gdXNlTmF0aXZlO1xuICBzY29wZS5yb290RG9jdW1lbnQgPSByb290RG9jdW1lbnQ7XG4gIHNjb3BlLndoZW5SZWFkeSA9IHdoZW5SZWFkeTtcbiAgc2NvcGUuaXNJRSA9IGlzSUU7XG59KSh3aW5kb3cuSFRNTEltcG9ydHMpO1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIG1vZHVsZXMgPSBbXTtcbiAgdmFyIGFkZE1vZHVsZSA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuICAgIG1vZHVsZXMucHVzaChtb2R1bGUpO1xuICB9O1xuICB2YXIgaW5pdGlhbGl6ZU1vZHVsZXMgPSBmdW5jdGlvbigpIHtcbiAgICBtb2R1bGVzLmZvckVhY2goZnVuY3Rpb24obW9kdWxlKSB7XG4gICAgICBtb2R1bGUoc2NvcGUpO1xuICAgIH0pO1xuICB9O1xuICBzY29wZS5hZGRNb2R1bGUgPSBhZGRNb2R1bGU7XG4gIHNjb3BlLmluaXRpYWxpemVNb2R1bGVzID0gaW5pdGlhbGl6ZU1vZHVsZXM7XG59KSh3aW5kb3cuSFRNTEltcG9ydHMpO1xuXG53aW5kb3cuSFRNTEltcG9ydHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBDU1NfVVJMX1JFR0VYUCA9IC8odXJsXFwoKShbXildKikoXFwpKS9nO1xuICB2YXIgQ1NTX0lNUE9SVF9SRUdFWFAgPSAvKEBpbXBvcnRbXFxzXSsoPyF1cmxcXCgpKShbXjtdKikoOykvZztcbiAgdmFyIHBhdGggPSB7XG4gICAgcmVzb2x2ZVVybHNJblN0eWxlOiBmdW5jdGlvbihzdHlsZSwgbGlua1VybCkge1xuICAgICAgdmFyIGRvYyA9IHN0eWxlLm93bmVyRG9jdW1lbnQ7XG4gICAgICB2YXIgcmVzb2x2ZXIgPSBkb2MuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICBzdHlsZS50ZXh0Q29udGVudCA9IHRoaXMucmVzb2x2ZVVybHNJbkNzc1RleHQoc3R5bGUudGV4dENvbnRlbnQsIGxpbmtVcmwsIHJlc29sdmVyKTtcbiAgICAgIHJldHVybiBzdHlsZTtcbiAgICB9LFxuICAgIHJlc29sdmVVcmxzSW5Dc3NUZXh0OiBmdW5jdGlvbihjc3NUZXh0LCBsaW5rVXJsLCB1cmxPYmopIHtcbiAgICAgIHZhciByID0gdGhpcy5yZXBsYWNlVXJscyhjc3NUZXh0LCB1cmxPYmosIGxpbmtVcmwsIENTU19VUkxfUkVHRVhQKTtcbiAgICAgIHIgPSB0aGlzLnJlcGxhY2VVcmxzKHIsIHVybE9iaiwgbGlua1VybCwgQ1NTX0lNUE9SVF9SRUdFWFApO1xuICAgICAgcmV0dXJuIHI7XG4gICAgfSxcbiAgICByZXBsYWNlVXJsczogZnVuY3Rpb24odGV4dCwgdXJsT2JqLCBsaW5rVXJsLCByZWdleHApIHtcbiAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UocmVnZXhwLCBmdW5jdGlvbihtLCBwcmUsIHVybCwgcG9zdCkge1xuICAgICAgICB2YXIgdXJsUGF0aCA9IHVybC5yZXBsYWNlKC9bXCInXS9nLCBcIlwiKTtcbiAgICAgICAgaWYgKGxpbmtVcmwpIHtcbiAgICAgICAgICB1cmxQYXRoID0gbmV3IFVSTCh1cmxQYXRoLCBsaW5rVXJsKS5ocmVmO1xuICAgICAgICB9XG4gICAgICAgIHVybE9iai5ocmVmID0gdXJsUGF0aDtcbiAgICAgICAgdXJsUGF0aCA9IHVybE9iai5ocmVmO1xuICAgICAgICByZXR1cm4gcHJlICsgXCInXCIgKyB1cmxQYXRoICsgXCInXCIgKyBwb3N0O1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuICBzY29wZS5wYXRoID0gcGF0aDtcbn0pO1xuXG53aW5kb3cuSFRNTEltcG9ydHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciB4aHIgPSB7XG4gICAgYXN5bmM6IHRydWUsXG4gICAgb2s6IGZ1bmN0aW9uKHJlcXVlc3QpIHtcbiAgICAgIHJldHVybiByZXF1ZXN0LnN0YXR1cyA+PSAyMDAgJiYgcmVxdWVzdC5zdGF0dXMgPCAzMDAgfHwgcmVxdWVzdC5zdGF0dXMgPT09IDMwNCB8fCByZXF1ZXN0LnN0YXR1cyA9PT0gMDtcbiAgICB9LFxuICAgIGxvYWQ6IGZ1bmN0aW9uKHVybCwgbmV4dCwgbmV4dENvbnRleHQpIHtcbiAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICBpZiAoc2NvcGUuZmxhZ3MuZGVidWcgfHwgc2NvcGUuZmxhZ3MuYnVzdCkge1xuICAgICAgICB1cmwgKz0gXCI/XCIgKyBNYXRoLnJhbmRvbSgpO1xuICAgICAgfVxuICAgICAgcmVxdWVzdC5vcGVuKFwiR0VUXCIsIHVybCwgeGhyLmFzeW5jKTtcbiAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihcInJlYWR5c3RhdGVjaGFuZ2VcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAocmVxdWVzdC5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgdmFyIHJlZGlyZWN0ZWRVcmwgPSBudWxsO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb25IZWFkZXIgPSByZXF1ZXN0LmdldFJlc3BvbnNlSGVhZGVyKFwiTG9jYXRpb25cIik7XG4gICAgICAgICAgICBpZiAobG9jYXRpb25IZWFkZXIpIHtcbiAgICAgICAgICAgICAgcmVkaXJlY3RlZFVybCA9IGxvY2F0aW9uSGVhZGVyLnN1YnN0cigwLCAxKSA9PT0gXCIvXCIgPyBsb2NhdGlvbi5vcmlnaW4gKyBsb2NhdGlvbkhlYWRlciA6IGxvY2F0aW9uSGVhZGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmV4dC5jYWxsKG5leHRDb250ZXh0LCAheGhyLm9rKHJlcXVlc3QpICYmIHJlcXVlc3QsIHJlcXVlc3QucmVzcG9uc2UgfHwgcmVxdWVzdC5yZXNwb25zZVRleHQsIHJlZGlyZWN0ZWRVcmwpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJlcXVlc3Quc2VuZCgpO1xuICAgICAgcmV0dXJuIHJlcXVlc3Q7XG4gICAgfSxcbiAgICBsb2FkRG9jdW1lbnQ6IGZ1bmN0aW9uKHVybCwgbmV4dCwgbmV4dENvbnRleHQpIHtcbiAgICAgIHRoaXMubG9hZCh1cmwsIG5leHQsIG5leHRDb250ZXh0KS5yZXNwb25zZVR5cGUgPSBcImRvY3VtZW50XCI7XG4gICAgfVxuICB9O1xuICBzY29wZS54aHIgPSB4aHI7XG59KTtcblxud2luZG93LkhUTUxJbXBvcnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgeGhyID0gc2NvcGUueGhyO1xuICB2YXIgZmxhZ3MgPSBzY29wZS5mbGFncztcbiAgdmFyIExvYWRlciA9IGZ1bmN0aW9uKG9uTG9hZCwgb25Db21wbGV0ZSkge1xuICAgIHRoaXMuY2FjaGUgPSB7fTtcbiAgICB0aGlzLm9ubG9hZCA9IG9uTG9hZDtcbiAgICB0aGlzLm9uY29tcGxldGUgPSBvbkNvbXBsZXRlO1xuICAgIHRoaXMuaW5mbGlnaHQgPSAwO1xuICAgIHRoaXMucGVuZGluZyA9IHt9O1xuICB9O1xuICBMb2FkZXIucHJvdG90eXBlID0ge1xuICAgIGFkZE5vZGVzOiBmdW5jdGlvbihub2Rlcykge1xuICAgICAgdGhpcy5pbmZsaWdodCArPSBub2Rlcy5sZW5ndGg7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5vZGVzLmxlbmd0aCwgbjsgaSA8IGwgJiYgKG4gPSBub2Rlc1tpXSk7IGkrKykge1xuICAgICAgICB0aGlzLnJlcXVpcmUobik7XG4gICAgICB9XG4gICAgICB0aGlzLmNoZWNrRG9uZSgpO1xuICAgIH0sXG4gICAgYWRkTm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgdGhpcy5pbmZsaWdodCsrO1xuICAgICAgdGhpcy5yZXF1aXJlKG5vZGUpO1xuICAgICAgdGhpcy5jaGVja0RvbmUoKTtcbiAgICB9LFxuICAgIHJlcXVpcmU6IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgdmFyIHVybCA9IGVsdC5zcmMgfHwgZWx0LmhyZWY7XG4gICAgICBlbHQuX19ub2RlVXJsID0gdXJsO1xuICAgICAgaWYgKCF0aGlzLmRlZHVwZSh1cmwsIGVsdCkpIHtcbiAgICAgICAgdGhpcy5mZXRjaCh1cmwsIGVsdCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBkZWR1cGU6IGZ1bmN0aW9uKHVybCwgZWx0KSB7XG4gICAgICBpZiAodGhpcy5wZW5kaW5nW3VybF0pIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nW3VybF0ucHVzaChlbHQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHZhciByZXNvdXJjZTtcbiAgICAgIGlmICh0aGlzLmNhY2hlW3VybF0pIHtcbiAgICAgICAgdGhpcy5vbmxvYWQodXJsLCBlbHQsIHRoaXMuY2FjaGVbdXJsXSk7XG4gICAgICAgIHRoaXMudGFpbCgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGVuZGluZ1t1cmxdID0gWyBlbHQgXTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuICAgIGZldGNoOiBmdW5jdGlvbih1cmwsIGVsdCkge1xuICAgICAgZmxhZ3MubG9hZCAmJiBjb25zb2xlLmxvZyhcImZldGNoXCIsIHVybCwgZWx0KTtcbiAgICAgIGlmICghdXJsKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGhpcy5yZWNlaXZlKHVybCwgZWx0LCB7XG4gICAgICAgICAgICBlcnJvcjogXCJocmVmIG11c3QgYmUgc3BlY2lmaWVkXCJcbiAgICAgICAgICB9LCBudWxsKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAwKTtcbiAgICAgIH0gZWxzZSBpZiAodXJsLm1hdGNoKC9eZGF0YTovKSkge1xuICAgICAgICB2YXIgcGllY2VzID0gdXJsLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgdmFyIGhlYWRlciA9IHBpZWNlc1swXTtcbiAgICAgICAgdmFyIGJvZHkgPSBwaWVjZXNbMV07XG4gICAgICAgIGlmIChoZWFkZXIuaW5kZXhPZihcIjtiYXNlNjRcIikgPiAtMSkge1xuICAgICAgICAgIGJvZHkgPSBhdG9iKGJvZHkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJvZHkgPSBkZWNvZGVVUklDb21wb25lbnQoYm9keSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICB0aGlzLnJlY2VpdmUodXJsLCBlbHQsIG51bGwsIGJvZHkpO1xuICAgICAgICB9LmJpbmQodGhpcyksIDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHJlY2VpdmVYaHIgPSBmdW5jdGlvbihlcnIsIHJlc291cmNlLCByZWRpcmVjdGVkVXJsKSB7XG4gICAgICAgICAgdGhpcy5yZWNlaXZlKHVybCwgZWx0LCBlcnIsIHJlc291cmNlLCByZWRpcmVjdGVkVXJsKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICB4aHIubG9hZCh1cmwsIHJlY2VpdmVYaHIpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmVjZWl2ZTogZnVuY3Rpb24odXJsLCBlbHQsIGVyciwgcmVzb3VyY2UsIHJlZGlyZWN0ZWRVcmwpIHtcbiAgICAgIHRoaXMuY2FjaGVbdXJsXSA9IHJlc291cmNlO1xuICAgICAgdmFyICRwID0gdGhpcy5wZW5kaW5nW3VybF07XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9ICRwLmxlbmd0aCwgcDsgaSA8IGwgJiYgKHAgPSAkcFtpXSk7IGkrKykge1xuICAgICAgICB0aGlzLm9ubG9hZCh1cmwsIHAsIHJlc291cmNlLCBlcnIsIHJlZGlyZWN0ZWRVcmwpO1xuICAgICAgICB0aGlzLnRhaWwoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGVuZGluZ1t1cmxdID0gbnVsbDtcbiAgICB9LFxuICAgIHRhaWw6IGZ1bmN0aW9uKCkge1xuICAgICAgLS10aGlzLmluZmxpZ2h0O1xuICAgICAgdGhpcy5jaGVja0RvbmUoKTtcbiAgICB9LFxuICAgIGNoZWNrRG9uZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuaW5mbGlnaHQpIHtcbiAgICAgICAgdGhpcy5vbmNvbXBsZXRlKCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBzY29wZS5Mb2FkZXIgPSBMb2FkZXI7XG59KTtcblxud2luZG93LkhUTUxJbXBvcnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgT2JzZXJ2ZXIgPSBmdW5jdGlvbihhZGRDYWxsYmFjaykge1xuICAgIHRoaXMuYWRkQ2FsbGJhY2sgPSBhZGRDYWxsYmFjaztcbiAgICB0aGlzLm1vID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIodGhpcy5oYW5kbGVyLmJpbmQodGhpcykpO1xuICB9O1xuICBPYnNlcnZlci5wcm90b3R5cGUgPSB7XG4gICAgaGFuZGxlcjogZnVuY3Rpb24obXV0YXRpb25zKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG11dGF0aW9ucy5sZW5ndGgsIG07IGkgPCBsICYmIChtID0gbXV0YXRpb25zW2ldKTsgaSsrKSB7XG4gICAgICAgIGlmIChtLnR5cGUgPT09IFwiY2hpbGRMaXN0XCIgJiYgbS5hZGRlZE5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuYWRkZWROb2RlcyhtLmFkZGVkTm9kZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBhZGRlZE5vZGVzOiBmdW5jdGlvbihub2Rlcykge1xuICAgICAgaWYgKHRoaXMuYWRkQ2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5hZGRDYWxsYmFjayhub2Rlcyk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5vZGVzLmxlbmd0aCwgbiwgbG9hZGluZzsgaSA8IGwgJiYgKG4gPSBub2Rlc1tpXSk7IGkrKykge1xuICAgICAgICBpZiAobi5jaGlsZHJlbiAmJiBuLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuYWRkZWROb2RlcyhuLmNoaWxkcmVuKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgb2JzZXJ2ZTogZnVuY3Rpb24ocm9vdCkge1xuICAgICAgdGhpcy5tby5vYnNlcnZlKHJvb3QsIHtcbiAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gIH07XG4gIHNjb3BlLk9ic2VydmVyID0gT2JzZXJ2ZXI7XG59KTtcblxud2luZG93LkhUTUxJbXBvcnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgcGF0aCA9IHNjb3BlLnBhdGg7XG4gIHZhciByb290RG9jdW1lbnQgPSBzY29wZS5yb290RG9jdW1lbnQ7XG4gIHZhciBmbGFncyA9IHNjb3BlLmZsYWdzO1xuICB2YXIgaXNJRSA9IHNjb3BlLmlzSUU7XG4gIHZhciBJTVBPUlRfTElOS19UWVBFID0gc2NvcGUuSU1QT1JUX0xJTktfVFlQRTtcbiAgdmFyIElNUE9SVF9TRUxFQ1RPUiA9IFwibGlua1tyZWw9XCIgKyBJTVBPUlRfTElOS19UWVBFICsgXCJdXCI7XG4gIHZhciBpbXBvcnRQYXJzZXIgPSB7XG4gICAgZG9jdW1lbnRTZWxlY3RvcnM6IElNUE9SVF9TRUxFQ1RPUixcbiAgICBpbXBvcnRzU2VsZWN0b3JzOiBbIElNUE9SVF9TRUxFQ1RPUiwgXCJsaW5rW3JlbD1zdHlsZXNoZWV0XTpub3QoW3R5cGVdKVwiLCBcInN0eWxlOm5vdChbdHlwZV0pXCIsIFwic2NyaXB0Om5vdChbdHlwZV0pXCIsICdzY3JpcHRbdHlwZT1cImFwcGxpY2F0aW9uL2phdmFzY3JpcHRcIl0nLCAnc2NyaXB0W3R5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIl0nIF0uam9pbihcIixcIiksXG4gICAgbWFwOiB7XG4gICAgICBsaW5rOiBcInBhcnNlTGlua1wiLFxuICAgICAgc2NyaXB0OiBcInBhcnNlU2NyaXB0XCIsXG4gICAgICBzdHlsZTogXCJwYXJzZVN0eWxlXCJcbiAgICB9LFxuICAgIGR5bmFtaWNFbGVtZW50czogW10sXG4gICAgcGFyc2VOZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBuZXh0ID0gdGhpcy5uZXh0VG9QYXJzZSgpO1xuICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgdGhpcy5wYXJzZShuZXh0KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhcnNlOiBmdW5jdGlvbihlbHQpIHtcbiAgICAgIGlmICh0aGlzLmlzUGFyc2VkKGVsdCkpIHtcbiAgICAgICAgZmxhZ3MucGFyc2UgJiYgY29uc29sZS5sb2coXCJbJXNdIGlzIGFscmVhZHkgcGFyc2VkXCIsIGVsdC5sb2NhbE5hbWUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgZm4gPSB0aGlzW3RoaXMubWFwW2VsdC5sb2NhbE5hbWVdXTtcbiAgICAgIGlmIChmbikge1xuICAgICAgICB0aGlzLm1hcmtQYXJzaW5nKGVsdCk7XG4gICAgICAgIGZuLmNhbGwodGhpcywgZWx0KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhcnNlRHluYW1pYzogZnVuY3Rpb24oZWx0LCBxdWlldCkge1xuICAgICAgdGhpcy5keW5hbWljRWxlbWVudHMucHVzaChlbHQpO1xuICAgICAgaWYgKCFxdWlldCkge1xuICAgICAgICB0aGlzLnBhcnNlTmV4dCgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgbWFya1BhcnNpbmc6IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgZmxhZ3MucGFyc2UgJiYgY29uc29sZS5sb2coXCJwYXJzaW5nXCIsIGVsdCk7XG4gICAgICB0aGlzLnBhcnNpbmdFbGVtZW50ID0gZWx0O1xuICAgIH0sXG4gICAgbWFya1BhcnNpbmdDb21wbGV0ZTogZnVuY3Rpb24oZWx0KSB7XG4gICAgICBlbHQuX19pbXBvcnRQYXJzZWQgPSB0cnVlO1xuICAgICAgdGhpcy5tYXJrRHluYW1pY1BhcnNpbmdDb21wbGV0ZShlbHQpO1xuICAgICAgaWYgKGVsdC5fX2ltcG9ydEVsZW1lbnQpIHtcbiAgICAgICAgZWx0Ll9faW1wb3J0RWxlbWVudC5fX2ltcG9ydFBhcnNlZCA9IHRydWU7XG4gICAgICAgIHRoaXMubWFya0R5bmFtaWNQYXJzaW5nQ29tcGxldGUoZWx0Ll9faW1wb3J0RWxlbWVudCk7XG4gICAgICB9XG4gICAgICB0aGlzLnBhcnNpbmdFbGVtZW50ID0gbnVsbDtcbiAgICAgIGZsYWdzLnBhcnNlICYmIGNvbnNvbGUubG9nKFwiY29tcGxldGVkXCIsIGVsdCk7XG4gICAgfSxcbiAgICBtYXJrRHluYW1pY1BhcnNpbmdDb21wbGV0ZTogZnVuY3Rpb24oZWx0KSB7XG4gICAgICB2YXIgaSA9IHRoaXMuZHluYW1pY0VsZW1lbnRzLmluZGV4T2YoZWx0KTtcbiAgICAgIGlmIChpID49IDApIHtcbiAgICAgICAgdGhpcy5keW5hbWljRWxlbWVudHMuc3BsaWNlKGksIDEpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFyc2VJbXBvcnQ6IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgZWx0LmltcG9ydCA9IGVsdC5fX2RvYztcbiAgICAgIGlmICh3aW5kb3cuSFRNTEltcG9ydHMuX19pbXBvcnRzUGFyc2luZ0hvb2spIHtcbiAgICAgICAgd2luZG93LkhUTUxJbXBvcnRzLl9faW1wb3J0c1BhcnNpbmdIb29rKGVsdCk7XG4gICAgICB9XG4gICAgICBpZiAoZWx0LmltcG9ydCkge1xuICAgICAgICBlbHQuaW1wb3J0Ll9faW1wb3J0UGFyc2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWFya1BhcnNpbmdDb21wbGV0ZShlbHQpO1xuICAgICAgaWYgKGVsdC5fX3Jlc291cmNlICYmICFlbHQuX19lcnJvcikge1xuICAgICAgICBlbHQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJsb2FkXCIsIHtcbiAgICAgICAgICBidWJibGVzOiBmYWxzZVxuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbHQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJlcnJvclwiLCB7XG4gICAgICAgICAgYnViYmxlczogZmFsc2VcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgaWYgKGVsdC5fX3BlbmRpbmcpIHtcbiAgICAgICAgdmFyIGZuO1xuICAgICAgICB3aGlsZSAoZWx0Ll9fcGVuZGluZy5sZW5ndGgpIHtcbiAgICAgICAgICBmbiA9IGVsdC5fX3BlbmRpbmcuc2hpZnQoKTtcbiAgICAgICAgICBpZiAoZm4pIHtcbiAgICAgICAgICAgIGZuKHtcbiAgICAgICAgICAgICAgdGFyZ2V0OiBlbHRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5wYXJzZU5leHQoKTtcbiAgICB9LFxuICAgIHBhcnNlTGluazogZnVuY3Rpb24obGlua0VsdCkge1xuICAgICAgaWYgKG5vZGVJc0ltcG9ydChsaW5rRWx0KSkge1xuICAgICAgICB0aGlzLnBhcnNlSW1wb3J0KGxpbmtFbHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlua0VsdC5ocmVmID0gbGlua0VsdC5ocmVmO1xuICAgICAgICB0aGlzLnBhcnNlR2VuZXJpYyhsaW5rRWx0KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhcnNlU3R5bGU6IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgdmFyIHNyYyA9IGVsdDtcbiAgICAgIGVsdCA9IGNsb25lU3R5bGUoZWx0KTtcbiAgICAgIHNyYy5fX2FwcGxpZWRFbGVtZW50ID0gZWx0O1xuICAgICAgZWx0Ll9faW1wb3J0RWxlbWVudCA9IHNyYztcbiAgICAgIHRoaXMucGFyc2VHZW5lcmljKGVsdCk7XG4gICAgfSxcbiAgICBwYXJzZUdlbmVyaWM6IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgdGhpcy50cmFja0VsZW1lbnQoZWx0KTtcbiAgICAgIHRoaXMuYWRkRWxlbWVudFRvRG9jdW1lbnQoZWx0KTtcbiAgICB9LFxuICAgIHJvb3RJbXBvcnRGb3JFbGVtZW50OiBmdW5jdGlvbihlbHQpIHtcbiAgICAgIHZhciBuID0gZWx0O1xuICAgICAgd2hpbGUgKG4ub3duZXJEb2N1bWVudC5fX2ltcG9ydExpbmspIHtcbiAgICAgICAgbiA9IG4ub3duZXJEb2N1bWVudC5fX2ltcG9ydExpbms7XG4gICAgICB9XG4gICAgICByZXR1cm4gbjtcbiAgICB9LFxuICAgIGFkZEVsZW1lbnRUb0RvY3VtZW50OiBmdW5jdGlvbihlbHQpIHtcbiAgICAgIHZhciBwb3J0ID0gdGhpcy5yb290SW1wb3J0Rm9yRWxlbWVudChlbHQuX19pbXBvcnRFbGVtZW50IHx8IGVsdCk7XG4gICAgICBwb3J0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsdCwgcG9ydCk7XG4gICAgfSxcbiAgICB0cmFja0VsZW1lbnQ6IGZ1bmN0aW9uKGVsdCwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBkb25lID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBlbHQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZG9uZSk7XG4gICAgICAgIGVsdC5yZW1vdmVFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgZG9uZSk7XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIGNhbGxiYWNrKGUpO1xuICAgICAgICB9XG4gICAgICAgIHNlbGYubWFya1BhcnNpbmdDb21wbGV0ZShlbHQpO1xuICAgICAgICBzZWxmLnBhcnNlTmV4dCgpO1xuICAgICAgfTtcbiAgICAgIGVsdC5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBkb25lKTtcbiAgICAgIGVsdC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgZG9uZSk7XG4gICAgICBpZiAoaXNJRSAmJiBlbHQubG9jYWxOYW1lID09PSBcInN0eWxlXCIpIHtcbiAgICAgICAgdmFyIGZha2VMb2FkID0gZmFsc2U7XG4gICAgICAgIGlmIChlbHQudGV4dENvbnRlbnQuaW5kZXhPZihcIkBpbXBvcnRcIikgPT0gLTEpIHtcbiAgICAgICAgICBmYWtlTG9hZCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAoZWx0LnNoZWV0KSB7XG4gICAgICAgICAgZmFrZUxvYWQgPSB0cnVlO1xuICAgICAgICAgIHZhciBjc3IgPSBlbHQuc2hlZXQuY3NzUnVsZXM7XG4gICAgICAgICAgdmFyIGxlbiA9IGNzciA/IGNzci5sZW5ndGggOiAwO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCByOyBpIDwgbGVuICYmIChyID0gY3NyW2ldKTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoci50eXBlID09PSBDU1NSdWxlLklNUE9SVF9SVUxFKSB7XG4gICAgICAgICAgICAgIGZha2VMb2FkID0gZmFrZUxvYWQgJiYgQm9vbGVhbihyLnN0eWxlU2hlZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZmFrZUxvYWQpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZWx0LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwibG9hZFwiLCB7XG4gICAgICAgICAgICAgIGJ1YmJsZXM6IGZhbHNlXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHBhcnNlU2NyaXB0OiBmdW5jdGlvbihzY3JpcHRFbHQpIHtcbiAgICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuICAgICAgc2NyaXB0Ll9faW1wb3J0RWxlbWVudCA9IHNjcmlwdEVsdDtcbiAgICAgIHNjcmlwdC5zcmMgPSBzY3JpcHRFbHQuc3JjID8gc2NyaXB0RWx0LnNyYyA6IGdlbmVyYXRlU2NyaXB0RGF0YVVybChzY3JpcHRFbHQpO1xuICAgICAgc2NvcGUuY3VycmVudFNjcmlwdCA9IHNjcmlwdEVsdDtcbiAgICAgIHRoaXMudHJhY2tFbGVtZW50KHNjcmlwdCwgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoc2NyaXB0LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xuICAgICAgICB9XG4gICAgICAgIHNjb3BlLmN1cnJlbnRTY3JpcHQgPSBudWxsO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmFkZEVsZW1lbnRUb0RvY3VtZW50KHNjcmlwdCk7XG4gICAgfSxcbiAgICBuZXh0VG9QYXJzZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9tYXlQYXJzZSA9IFtdO1xuICAgICAgcmV0dXJuICF0aGlzLnBhcnNpbmdFbGVtZW50ICYmICh0aGlzLm5leHRUb1BhcnNlSW5Eb2Mocm9vdERvY3VtZW50KSB8fCB0aGlzLm5leHRUb1BhcnNlRHluYW1pYygpKTtcbiAgICB9LFxuICAgIG5leHRUb1BhcnNlSW5Eb2M6IGZ1bmN0aW9uKGRvYywgbGluaykge1xuICAgICAgaWYgKGRvYyAmJiB0aGlzLl9tYXlQYXJzZS5pbmRleE9mKGRvYykgPCAwKSB7XG4gICAgICAgIHRoaXMuX21heVBhcnNlLnB1c2goZG9jKTtcbiAgICAgICAgdmFyIG5vZGVzID0gZG9jLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5wYXJzZVNlbGVjdG9yc0Zvck5vZGUoZG9jKSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbm9kZXMubGVuZ3RoLCBuOyBpIDwgbCAmJiAobiA9IG5vZGVzW2ldKTsgaSsrKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUGFyc2VkKG4pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5oYXNSZXNvdXJjZShuKSkge1xuICAgICAgICAgICAgICByZXR1cm4gbm9kZUlzSW1wb3J0KG4pID8gdGhpcy5uZXh0VG9QYXJzZUluRG9jKG4uX19kb2MsIG4pIDogbjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBsaW5rO1xuICAgIH0sXG4gICAgbmV4dFRvUGFyc2VEeW5hbWljOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmR5bmFtaWNFbGVtZW50c1swXTtcbiAgICB9LFxuICAgIHBhcnNlU2VsZWN0b3JzRm9yTm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIGRvYyA9IG5vZGUub3duZXJEb2N1bWVudCB8fCBub2RlO1xuICAgICAgcmV0dXJuIGRvYyA9PT0gcm9vdERvY3VtZW50ID8gdGhpcy5kb2N1bWVudFNlbGVjdG9ycyA6IHRoaXMuaW1wb3J0c1NlbGVjdG9ycztcbiAgICB9LFxuICAgIGlzUGFyc2VkOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICByZXR1cm4gbm9kZS5fX2ltcG9ydFBhcnNlZDtcbiAgICB9LFxuICAgIG5lZWRzRHluYW1pY1BhcnNpbmc6IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgcmV0dXJuIHRoaXMuZHluYW1pY0VsZW1lbnRzLmluZGV4T2YoZWx0KSA+PSAwO1xuICAgIH0sXG4gICAgaGFzUmVzb3VyY2U6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIGlmIChub2RlSXNJbXBvcnQobm9kZSkgJiYgbm9kZS5fX2RvYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfTtcbiAgZnVuY3Rpb24gbm9kZUlzSW1wb3J0KGVsdCkge1xuICAgIHJldHVybiBlbHQubG9jYWxOYW1lID09PSBcImxpbmtcIiAmJiBlbHQucmVsID09PSBJTVBPUlRfTElOS19UWVBFO1xuICB9XG4gIGZ1bmN0aW9uIGdlbmVyYXRlU2NyaXB0RGF0YVVybChzY3JpcHQpIHtcbiAgICB2YXIgc2NyaXB0Q29udGVudCA9IGdlbmVyYXRlU2NyaXB0Q29udGVudChzY3JpcHQpO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qYXZhc2NyaXB0O2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoc2NyaXB0Q29udGVudCk7XG4gIH1cbiAgZnVuY3Rpb24gZ2VuZXJhdGVTY3JpcHRDb250ZW50KHNjcmlwdCkge1xuICAgIHJldHVybiBzY3JpcHQudGV4dENvbnRlbnQgKyBnZW5lcmF0ZVNvdXJjZU1hcEhpbnQoc2NyaXB0KTtcbiAgfVxuICBmdW5jdGlvbiBnZW5lcmF0ZVNvdXJjZU1hcEhpbnQoc2NyaXB0KSB7XG4gICAgdmFyIG93bmVyID0gc2NyaXB0Lm93bmVyRG9jdW1lbnQ7XG4gICAgb3duZXIuX19pbXBvcnRlZFNjcmlwdHMgPSBvd25lci5fX2ltcG9ydGVkU2NyaXB0cyB8fCAwO1xuICAgIHZhciBtb25pa2VyID0gc2NyaXB0Lm93bmVyRG9jdW1lbnQuYmFzZVVSSTtcbiAgICB2YXIgbnVtID0gb3duZXIuX19pbXBvcnRlZFNjcmlwdHMgPyBcIi1cIiArIG93bmVyLl9faW1wb3J0ZWRTY3JpcHRzIDogXCJcIjtcbiAgICBvd25lci5fX2ltcG9ydGVkU2NyaXB0cysrO1xuICAgIHJldHVybiBcIlxcbi8vIyBzb3VyY2VVUkw9XCIgKyBtb25pa2VyICsgbnVtICsgXCIuanNcXG5cIjtcbiAgfVxuICBmdW5jdGlvbiBjbG9uZVN0eWxlKHN0eWxlKSB7XG4gICAgdmFyIGNsb25lID0gc3R5bGUub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgY2xvbmUudGV4dENvbnRlbnQgPSBzdHlsZS50ZXh0Q29udGVudDtcbiAgICBwYXRoLnJlc29sdmVVcmxzSW5TdHlsZShjbG9uZSk7XG4gICAgcmV0dXJuIGNsb25lO1xuICB9XG4gIHNjb3BlLnBhcnNlciA9IGltcG9ydFBhcnNlcjtcbiAgc2NvcGUuSU1QT1JUX1NFTEVDVE9SID0gSU1QT1JUX1NFTEVDVE9SO1xufSk7XG5cbndpbmRvdy5IVE1MSW1wb3J0cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGZsYWdzID0gc2NvcGUuZmxhZ3M7XG4gIHZhciBJTVBPUlRfTElOS19UWVBFID0gc2NvcGUuSU1QT1JUX0xJTktfVFlQRTtcbiAgdmFyIElNUE9SVF9TRUxFQ1RPUiA9IHNjb3BlLklNUE9SVF9TRUxFQ1RPUjtcbiAgdmFyIHJvb3REb2N1bWVudCA9IHNjb3BlLnJvb3REb2N1bWVudDtcbiAgdmFyIExvYWRlciA9IHNjb3BlLkxvYWRlcjtcbiAgdmFyIE9ic2VydmVyID0gc2NvcGUuT2JzZXJ2ZXI7XG4gIHZhciBwYXJzZXIgPSBzY29wZS5wYXJzZXI7XG4gIHZhciBpbXBvcnRlciA9IHtcbiAgICBkb2N1bWVudHM6IHt9LFxuICAgIGRvY3VtZW50UHJlbG9hZFNlbGVjdG9yczogSU1QT1JUX1NFTEVDVE9SLFxuICAgIGltcG9ydHNQcmVsb2FkU2VsZWN0b3JzOiBbIElNUE9SVF9TRUxFQ1RPUiBdLmpvaW4oXCIsXCIpLFxuICAgIGxvYWROb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICBpbXBvcnRMb2FkZXIuYWRkTm9kZShub2RlKTtcbiAgICB9LFxuICAgIGxvYWRTdWJ0cmVlOiBmdW5jdGlvbihwYXJlbnQpIHtcbiAgICAgIHZhciBub2RlcyA9IHRoaXMubWFyc2hhbE5vZGVzKHBhcmVudCk7XG4gICAgICBpbXBvcnRMb2FkZXIuYWRkTm9kZXMobm9kZXMpO1xuICAgIH0sXG4gICAgbWFyc2hhbE5vZGVzOiBmdW5jdGlvbihwYXJlbnQpIHtcbiAgICAgIHJldHVybiBwYXJlbnQucXVlcnlTZWxlY3RvckFsbCh0aGlzLmxvYWRTZWxlY3RvcnNGb3JOb2RlKHBhcmVudCkpO1xuICAgIH0sXG4gICAgbG9hZFNlbGVjdG9yc0Zvck5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHZhciBkb2MgPSBub2RlLm93bmVyRG9jdW1lbnQgfHwgbm9kZTtcbiAgICAgIHJldHVybiBkb2MgPT09IHJvb3REb2N1bWVudCA/IHRoaXMuZG9jdW1lbnRQcmVsb2FkU2VsZWN0b3JzIDogdGhpcy5pbXBvcnRzUHJlbG9hZFNlbGVjdG9ycztcbiAgICB9LFxuICAgIGxvYWRlZDogZnVuY3Rpb24odXJsLCBlbHQsIHJlc291cmNlLCBlcnIsIHJlZGlyZWN0ZWRVcmwpIHtcbiAgICAgIGZsYWdzLmxvYWQgJiYgY29uc29sZS5sb2coXCJsb2FkZWRcIiwgdXJsLCBlbHQpO1xuICAgICAgZWx0Ll9fcmVzb3VyY2UgPSByZXNvdXJjZTtcbiAgICAgIGVsdC5fX2Vycm9yID0gZXJyO1xuICAgICAgaWYgKGlzSW1wb3J0TGluayhlbHQpKSB7XG4gICAgICAgIHZhciBkb2MgPSB0aGlzLmRvY3VtZW50c1t1cmxdO1xuICAgICAgICBpZiAoZG9jID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBkb2MgPSBlcnIgPyBudWxsIDogbWFrZURvY3VtZW50KHJlc291cmNlLCByZWRpcmVjdGVkVXJsIHx8IHVybCk7XG4gICAgICAgICAgaWYgKGRvYykge1xuICAgICAgICAgICAgZG9jLl9faW1wb3J0TGluayA9IGVsdDtcbiAgICAgICAgICAgIHRoaXMuYm9vdERvY3VtZW50KGRvYyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZG9jdW1lbnRzW3VybF0gPSBkb2M7XG4gICAgICAgIH1cbiAgICAgICAgZWx0Ll9fZG9jID0gZG9jO1xuICAgICAgfVxuICAgICAgcGFyc2VyLnBhcnNlTmV4dCgpO1xuICAgIH0sXG4gICAgYm9vdERvY3VtZW50OiBmdW5jdGlvbihkb2MpIHtcbiAgICAgIHRoaXMubG9hZFN1YnRyZWUoZG9jKTtcbiAgICAgIHRoaXMub2JzZXJ2ZXIub2JzZXJ2ZShkb2MpO1xuICAgICAgcGFyc2VyLnBhcnNlTmV4dCgpO1xuICAgIH0sXG4gICAgbG9hZGVkQWxsOiBmdW5jdGlvbigpIHtcbiAgICAgIHBhcnNlci5wYXJzZU5leHQoKTtcbiAgICB9XG4gIH07XG4gIHZhciBpbXBvcnRMb2FkZXIgPSBuZXcgTG9hZGVyKGltcG9ydGVyLmxvYWRlZC5iaW5kKGltcG9ydGVyKSwgaW1wb3J0ZXIubG9hZGVkQWxsLmJpbmQoaW1wb3J0ZXIpKTtcbiAgaW1wb3J0ZXIub2JzZXJ2ZXIgPSBuZXcgT2JzZXJ2ZXIoKTtcbiAgZnVuY3Rpb24gaXNJbXBvcnRMaW5rKGVsdCkge1xuICAgIHJldHVybiBpc0xpbmtSZWwoZWx0LCBJTVBPUlRfTElOS19UWVBFKTtcbiAgfVxuICBmdW5jdGlvbiBpc0xpbmtSZWwoZWx0LCByZWwpIHtcbiAgICByZXR1cm4gZWx0LmxvY2FsTmFtZSA9PT0gXCJsaW5rXCIgJiYgZWx0LmdldEF0dHJpYnV0ZShcInJlbFwiKSA9PT0gcmVsO1xuICB9XG4gIGZ1bmN0aW9uIGhhc0Jhc2VVUklBY2Nlc3Nvcihkb2MpIHtcbiAgICByZXR1cm4gISFPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGRvYywgXCJiYXNlVVJJXCIpO1xuICB9XG4gIGZ1bmN0aW9uIG1ha2VEb2N1bWVudChyZXNvdXJjZSwgdXJsKSB7XG4gICAgdmFyIGRvYyA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudChJTVBPUlRfTElOS19UWVBFKTtcbiAgICBkb2MuX1VSTCA9IHVybDtcbiAgICB2YXIgYmFzZSA9IGRvYy5jcmVhdGVFbGVtZW50KFwiYmFzZVwiKTtcbiAgICBiYXNlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgdXJsKTtcbiAgICBpZiAoIWRvYy5iYXNlVVJJICYmICFoYXNCYXNlVVJJQWNjZXNzb3IoZG9jKSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGRvYywgXCJiYXNlVVJJXCIsIHtcbiAgICAgICAgdmFsdWU6IHVybFxuICAgICAgfSk7XG4gICAgfVxuICAgIHZhciBtZXRhID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJtZXRhXCIpO1xuICAgIG1ldGEuc2V0QXR0cmlidXRlKFwiY2hhcnNldFwiLCBcInV0Zi04XCIpO1xuICAgIGRvYy5oZWFkLmFwcGVuZENoaWxkKG1ldGEpO1xuICAgIGRvYy5oZWFkLmFwcGVuZENoaWxkKGJhc2UpO1xuICAgIGRvYy5ib2R5LmlubmVySFRNTCA9IHJlc291cmNlO1xuICAgIGlmICh3aW5kb3cuSFRNTFRlbXBsYXRlRWxlbWVudCAmJiBIVE1MVGVtcGxhdGVFbGVtZW50LmJvb3RzdHJhcCkge1xuICAgICAgSFRNTFRlbXBsYXRlRWxlbWVudC5ib290c3RyYXAoZG9jKTtcbiAgICB9XG4gICAgcmV0dXJuIGRvYztcbiAgfVxuICBpZiAoIWRvY3VtZW50LmJhc2VVUkkpIHtcbiAgICB2YXIgYmFzZVVSSURlc2NyaXB0b3IgPSB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYmFzZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJiYXNlXCIpO1xuICAgICAgICByZXR1cm4gYmFzZSA/IGJhc2UuaHJlZiA6IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgICAgfSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGRvY3VtZW50LCBcImJhc2VVUklcIiwgYmFzZVVSSURlc2NyaXB0b3IpO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyb290RG9jdW1lbnQsIFwiYmFzZVVSSVwiLCBiYXNlVVJJRGVzY3JpcHRvcik7XG4gIH1cbiAgc2NvcGUuaW1wb3J0ZXIgPSBpbXBvcnRlcjtcbiAgc2NvcGUuaW1wb3J0TG9hZGVyID0gaW1wb3J0TG9hZGVyO1xufSk7XG5cbndpbmRvdy5IVE1MSW1wb3J0cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIHBhcnNlciA9IHNjb3BlLnBhcnNlcjtcbiAgdmFyIGltcG9ydGVyID0gc2NvcGUuaW1wb3J0ZXI7XG4gIHZhciBkeW5hbWljID0ge1xuICAgIGFkZGVkOiBmdW5jdGlvbihub2Rlcykge1xuICAgICAgdmFyIG93bmVyLCBwYXJzZWQsIGxvYWRpbmc7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5vZGVzLmxlbmd0aCwgbjsgaSA8IGwgJiYgKG4gPSBub2Rlc1tpXSk7IGkrKykge1xuICAgICAgICBpZiAoIW93bmVyKSB7XG4gICAgICAgICAgb3duZXIgPSBuLm93bmVyRG9jdW1lbnQ7XG4gICAgICAgICAgcGFyc2VkID0gcGFyc2VyLmlzUGFyc2VkKG93bmVyKTtcbiAgICAgICAgfVxuICAgICAgICBsb2FkaW5nID0gdGhpcy5zaG91bGRMb2FkTm9kZShuKTtcbiAgICAgICAgaWYgKGxvYWRpbmcpIHtcbiAgICAgICAgICBpbXBvcnRlci5sb2FkTm9kZShuKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zaG91bGRQYXJzZU5vZGUobikgJiYgcGFyc2VkKSB7XG4gICAgICAgICAgcGFyc2VyLnBhcnNlRHluYW1pYyhuLCBsb2FkaW5nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgc2hvdWxkTG9hZE5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAxICYmIG1hdGNoZXMuY2FsbChub2RlLCBpbXBvcnRlci5sb2FkU2VsZWN0b3JzRm9yTm9kZShub2RlKSk7XG4gICAgfSxcbiAgICBzaG91bGRQYXJzZU5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAxICYmIG1hdGNoZXMuY2FsbChub2RlLCBwYXJzZXIucGFyc2VTZWxlY3RvcnNGb3JOb2RlKG5vZGUpKTtcbiAgICB9XG4gIH07XG4gIGltcG9ydGVyLm9ic2VydmVyLmFkZENhbGxiYWNrID0gZHluYW1pYy5hZGRlZC5iaW5kKGR5bmFtaWMpO1xuICB2YXIgbWF0Y2hlcyA9IEhUTUxFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzIHx8IEhUTUxFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzU2VsZWN0b3IgfHwgSFRNTEVsZW1lbnQucHJvdG90eXBlLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBIVE1MRWxlbWVudC5wcm90b3R5cGUubW96TWF0Y2hlc1NlbGVjdG9yIHx8IEhUTUxFbGVtZW50LnByb3RvdHlwZS5tc01hdGNoZXNTZWxlY3Rvcjtcbn0pO1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGluaXRpYWxpemVNb2R1bGVzID0gc2NvcGUuaW5pdGlhbGl6ZU1vZHVsZXM7XG4gIHZhciBpc0lFID0gc2NvcGUuaXNJRTtcbiAgaWYgKHNjb3BlLnVzZU5hdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBpbml0aWFsaXplTW9kdWxlcygpO1xuICB2YXIgcm9vdERvY3VtZW50ID0gc2NvcGUucm9vdERvY3VtZW50O1xuICBmdW5jdGlvbiBib290c3RyYXAoKSB7XG4gICAgd2luZG93LkhUTUxJbXBvcnRzLmltcG9ydGVyLmJvb3REb2N1bWVudChyb290RG9jdW1lbnQpO1xuICB9XG4gIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIgfHwgZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJpbnRlcmFjdGl2ZVwiICYmICF3aW5kb3cuYXR0YWNoRXZlbnQpIHtcbiAgICBib290c3RyYXAoKTtcbiAgfSBlbHNlIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBib290c3RyYXApO1xuICB9XG59KSh3aW5kb3cuSFRNTEltcG9ydHMpO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMgPSB3aW5kb3cuQ3VzdG9tRWxlbWVudHMgfHwge1xuICBmbGFnczoge31cbn07XG5cbihmdW5jdGlvbihzY29wZSkge1xuICB2YXIgZmxhZ3MgPSBzY29wZS5mbGFncztcbiAgdmFyIG1vZHVsZXMgPSBbXTtcbiAgdmFyIGFkZE1vZHVsZSA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuICAgIG1vZHVsZXMucHVzaChtb2R1bGUpO1xuICB9O1xuICB2YXIgaW5pdGlhbGl6ZU1vZHVsZXMgPSBmdW5jdGlvbigpIHtcbiAgICBtb2R1bGVzLmZvckVhY2goZnVuY3Rpb24obW9kdWxlKSB7XG4gICAgICBtb2R1bGUoc2NvcGUpO1xuICAgIH0pO1xuICB9O1xuICBzY29wZS5hZGRNb2R1bGUgPSBhZGRNb2R1bGU7XG4gIHNjb3BlLmluaXRpYWxpemVNb2R1bGVzID0gaW5pdGlhbGl6ZU1vZHVsZXM7XG4gIHNjb3BlLmhhc05hdGl2ZSA9IEJvb2xlYW4oZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KTtcbiAgc2NvcGUuaXNJRSA9IC9UcmlkZW50Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICBzY29wZS51c2VOYXRpdmUgPSAhZmxhZ3MucmVnaXN0ZXIgJiYgc2NvcGUuaGFzTmF0aXZlICYmICF3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwgJiYgKCF3aW5kb3cuSFRNTEltcG9ydHMgfHwgd2luZG93LkhUTUxJbXBvcnRzLnVzZU5hdGl2ZSk7XG59KSh3aW5kb3cuQ3VzdG9tRWxlbWVudHMpO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBJTVBPUlRfTElOS19UWVBFID0gd2luZG93LkhUTUxJbXBvcnRzID8gd2luZG93LkhUTUxJbXBvcnRzLklNUE9SVF9MSU5LX1RZUEUgOiBcIm5vbmVcIjtcbiAgZnVuY3Rpb24gZm9yU3VidHJlZShub2RlLCBjYikge1xuICAgIGZpbmRBbGxFbGVtZW50cyhub2RlLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoY2IoZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBmb3JSb290cyhlLCBjYik7XG4gICAgfSk7XG4gICAgZm9yUm9vdHMobm9kZSwgY2IpO1xuICB9XG4gIGZ1bmN0aW9uIGZpbmRBbGxFbGVtZW50cyhub2RlLCBmaW5kLCBkYXRhKSB7XG4gICAgdmFyIGUgPSBub2RlLmZpcnN0RWxlbWVudENoaWxkO1xuICAgIGlmICghZSkge1xuICAgICAgZSA9IG5vZGUuZmlyc3RDaGlsZDtcbiAgICAgIHdoaWxlIChlICYmIGUubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIGUgPSBlLm5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoZSkge1xuICAgICAgaWYgKGZpbmQoZSwgZGF0YSkgIT09IHRydWUpIHtcbiAgICAgICAgZmluZEFsbEVsZW1lbnRzKGUsIGZpbmQsIGRhdGEpO1xuICAgICAgfVxuICAgICAgZSA9IGUubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBmdW5jdGlvbiBmb3JSb290cyhub2RlLCBjYikge1xuICAgIHZhciByb290ID0gbm9kZS5zaGFkb3dSb290O1xuICAgIHdoaWxlIChyb290KSB7XG4gICAgICBmb3JTdWJ0cmVlKHJvb3QsIGNiKTtcbiAgICAgIHJvb3QgPSByb290Lm9sZGVyU2hhZG93Um9vdDtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZm9yRG9jdW1lbnRUcmVlKGRvYywgY2IpIHtcbiAgICBfZm9yRG9jdW1lbnRUcmVlKGRvYywgY2IsIFtdKTtcbiAgfVxuICBmdW5jdGlvbiBfZm9yRG9jdW1lbnRUcmVlKGRvYywgY2IsIHByb2Nlc3NpbmdEb2N1bWVudHMpIHtcbiAgICBkb2MgPSB3aW5kb3cud3JhcChkb2MpO1xuICAgIGlmIChwcm9jZXNzaW5nRG9jdW1lbnRzLmluZGV4T2YoZG9jKSA+PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHByb2Nlc3NpbmdEb2N1bWVudHMucHVzaChkb2MpO1xuICAgIHZhciBpbXBvcnRzID0gZG9jLnF1ZXJ5U2VsZWN0b3JBbGwoXCJsaW5rW3JlbD1cIiArIElNUE9SVF9MSU5LX1RZUEUgKyBcIl1cIik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBpbXBvcnRzLmxlbmd0aCwgbjsgaSA8IGwgJiYgKG4gPSBpbXBvcnRzW2ldKTsgaSsrKSB7XG4gICAgICBpZiAobi5pbXBvcnQpIHtcbiAgICAgICAgX2ZvckRvY3VtZW50VHJlZShuLmltcG9ydCwgY2IsIHByb2Nlc3NpbmdEb2N1bWVudHMpO1xuICAgICAgfVxuICAgIH1cbiAgICBjYihkb2MpO1xuICB9XG4gIHNjb3BlLmZvckRvY3VtZW50VHJlZSA9IGZvckRvY3VtZW50VHJlZTtcbiAgc2NvcGUuZm9yU3VidHJlZSA9IGZvclN1YnRyZWU7XG59KTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgZmxhZ3MgPSBzY29wZS5mbGFncztcbiAgdmFyIGZvclN1YnRyZWUgPSBzY29wZS5mb3JTdWJ0cmVlO1xuICB2YXIgZm9yRG9jdW1lbnRUcmVlID0gc2NvcGUuZm9yRG9jdW1lbnRUcmVlO1xuICBmdW5jdGlvbiBhZGRlZE5vZGUobm9kZSwgaXNBdHRhY2hlZCkge1xuICAgIHJldHVybiBhZGRlZChub2RlLCBpc0F0dGFjaGVkKSB8fCBhZGRlZFN1YnRyZWUobm9kZSwgaXNBdHRhY2hlZCk7XG4gIH1cbiAgZnVuY3Rpb24gYWRkZWQobm9kZSwgaXNBdHRhY2hlZCkge1xuICAgIGlmIChzY29wZS51cGdyYWRlKG5vZGUsIGlzQXR0YWNoZWQpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGlzQXR0YWNoZWQpIHtcbiAgICAgIGF0dGFjaGVkKG5vZGUpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBhZGRlZFN1YnRyZWUobm9kZSwgaXNBdHRhY2hlZCkge1xuICAgIGZvclN1YnRyZWUobm9kZSwgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGFkZGVkKGUsIGlzQXR0YWNoZWQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHZhciBoYXNUaHJvdHRsZWRBdHRhY2hlZCA9IHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyLl9pc1BvbHlmaWxsZWQgJiYgZmxhZ3NbXCJ0aHJvdHRsZS1hdHRhY2hlZFwiXTtcbiAgc2NvcGUuaGFzUG9seWZpbGxNdXRhdGlvbnMgPSBoYXNUaHJvdHRsZWRBdHRhY2hlZDtcbiAgc2NvcGUuaGFzVGhyb3R0bGVkQXR0YWNoZWQgPSBoYXNUaHJvdHRsZWRBdHRhY2hlZDtcbiAgdmFyIGlzUGVuZGluZ011dGF0aW9ucyA9IGZhbHNlO1xuICB2YXIgcGVuZGluZ011dGF0aW9ucyA9IFtdO1xuICBmdW5jdGlvbiBkZWZlck11dGF0aW9uKGZuKSB7XG4gICAgcGVuZGluZ011dGF0aW9ucy5wdXNoKGZuKTtcbiAgICBpZiAoIWlzUGVuZGluZ011dGF0aW9ucykge1xuICAgICAgaXNQZW5kaW5nTXV0YXRpb25zID0gdHJ1ZTtcbiAgICAgIHNldFRpbWVvdXQodGFrZU11dGF0aW9ucyk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHRha2VNdXRhdGlvbnMoKSB7XG4gICAgaXNQZW5kaW5nTXV0YXRpb25zID0gZmFsc2U7XG4gICAgdmFyICRwID0gcGVuZGluZ011dGF0aW9ucztcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9ICRwLmxlbmd0aCwgcDsgaSA8IGwgJiYgKHAgPSAkcFtpXSk7IGkrKykge1xuICAgICAgcCgpO1xuICAgIH1cbiAgICBwZW5kaW5nTXV0YXRpb25zID0gW107XG4gIH1cbiAgZnVuY3Rpb24gYXR0YWNoZWQoZWxlbWVudCkge1xuICAgIGlmIChoYXNUaHJvdHRsZWRBdHRhY2hlZCkge1xuICAgICAgZGVmZXJNdXRhdGlvbihmdW5jdGlvbigpIHtcbiAgICAgICAgX2F0dGFjaGVkKGVsZW1lbnQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9hdHRhY2hlZChlbGVtZW50KTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gX2F0dGFjaGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5fX3VwZ3JhZGVkX18gJiYgIWVsZW1lbnQuX19hdHRhY2hlZCkge1xuICAgICAgZWxlbWVudC5fX2F0dGFjaGVkID0gdHJ1ZTtcbiAgICAgIGlmIChlbGVtZW50LmF0dGFjaGVkQ2FsbGJhY2spIHtcbiAgICAgICAgZWxlbWVudC5hdHRhY2hlZENhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGRldGFjaGVkTm9kZShub2RlKSB7XG4gICAgZGV0YWNoZWQobm9kZSk7XG4gICAgZm9yU3VidHJlZShub2RlLCBmdW5jdGlvbihlKSB7XG4gICAgICBkZXRhY2hlZChlKTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBkZXRhY2hlZChlbGVtZW50KSB7XG4gICAgaWYgKGhhc1Rocm90dGxlZEF0dGFjaGVkKSB7XG4gICAgICBkZWZlck11dGF0aW9uKGZ1bmN0aW9uKCkge1xuICAgICAgICBfZGV0YWNoZWQoZWxlbWVudCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgX2RldGFjaGVkKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBfZGV0YWNoZWQoZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50Ll9fdXBncmFkZWRfXyAmJiBlbGVtZW50Ll9fYXR0YWNoZWQpIHtcbiAgICAgIGVsZW1lbnQuX19hdHRhY2hlZCA9IGZhbHNlO1xuICAgICAgaWYgKGVsZW1lbnQuZGV0YWNoZWRDYWxsYmFjaykge1xuICAgICAgICBlbGVtZW50LmRldGFjaGVkQ2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaW5Eb2N1bWVudChlbGVtZW50KSB7XG4gICAgdmFyIHAgPSBlbGVtZW50O1xuICAgIHZhciBkb2MgPSB3aW5kb3cud3JhcChkb2N1bWVudCk7XG4gICAgd2hpbGUgKHApIHtcbiAgICAgIGlmIChwID09IGRvYykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHAgPSBwLnBhcmVudE5vZGUgfHwgcC5ub2RlVHlwZSA9PT0gTm9kZS5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFICYmIHAuaG9zdDtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gd2F0Y2hTaGFkb3cobm9kZSkge1xuICAgIGlmIChub2RlLnNoYWRvd1Jvb3QgJiYgIW5vZGUuc2hhZG93Um9vdC5fX3dhdGNoZWQpIHtcbiAgICAgIGZsYWdzLmRvbSAmJiBjb25zb2xlLmxvZyhcIndhdGNoaW5nIHNoYWRvdy1yb290IGZvcjogXCIsIG5vZGUubG9jYWxOYW1lKTtcbiAgICAgIHZhciByb290ID0gbm9kZS5zaGFkb3dSb290O1xuICAgICAgd2hpbGUgKHJvb3QpIHtcbiAgICAgICAgb2JzZXJ2ZShyb290KTtcbiAgICAgICAgcm9vdCA9IHJvb3Qub2xkZXJTaGFkb3dSb290O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBoYW5kbGVyKHJvb3QsIG11dGF0aW9ucykge1xuICAgIGlmIChmbGFncy5kb20pIHtcbiAgICAgIHZhciBteCA9IG11dGF0aW9uc1swXTtcbiAgICAgIGlmIChteCAmJiBteC50eXBlID09PSBcImNoaWxkTGlzdFwiICYmIG14LmFkZGVkTm9kZXMpIHtcbiAgICAgICAgaWYgKG14LmFkZGVkTm9kZXMpIHtcbiAgICAgICAgICB2YXIgZCA9IG14LmFkZGVkTm9kZXNbMF07XG4gICAgICAgICAgd2hpbGUgKGQgJiYgZCAhPT0gZG9jdW1lbnQgJiYgIWQuaG9zdCkge1xuICAgICAgICAgICAgZCA9IGQucGFyZW50Tm9kZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHUgPSBkICYmIChkLlVSTCB8fCBkLl9VUkwgfHwgZC5ob3N0ICYmIGQuaG9zdC5sb2NhbE5hbWUpIHx8IFwiXCI7XG4gICAgICAgICAgdSA9IHUuc3BsaXQoXCIvP1wiKS5zaGlmdCgpLnNwbGl0KFwiL1wiKS5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc29sZS5ncm91cChcIm11dGF0aW9ucyAoJWQpIFslc11cIiwgbXV0YXRpb25zLmxlbmd0aCwgdSB8fCBcIlwiKTtcbiAgICB9XG4gICAgdmFyIGlzQXR0YWNoZWQgPSBpbkRvY3VtZW50KHJvb3QpO1xuICAgIG11dGF0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKG14KSB7XG4gICAgICBpZiAobXgudHlwZSA9PT0gXCJjaGlsZExpc3RcIikge1xuICAgICAgICBmb3JFYWNoKG14LmFkZGVkTm9kZXMsIGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICBpZiAoIW4ubG9jYWxOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGFkZGVkTm9kZShuLCBpc0F0dGFjaGVkKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZvckVhY2gobXgucmVtb3ZlZE5vZGVzLCBmdW5jdGlvbihuKSB7XG4gICAgICAgICAgaWYgKCFuLmxvY2FsTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkZXRhY2hlZE5vZGUobik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGZsYWdzLmRvbSAmJiBjb25zb2xlLmdyb3VwRW5kKCk7XG4gIH1cbiAgZnVuY3Rpb24gdGFrZVJlY29yZHMobm9kZSkge1xuICAgIG5vZGUgPSB3aW5kb3cud3JhcChub2RlKTtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIG5vZGUgPSB3aW5kb3cud3JhcChkb2N1bWVudCk7XG4gICAgfVxuICAgIHdoaWxlIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIHZhciBvYnNlcnZlciA9IG5vZGUuX19vYnNlcnZlcjtcbiAgICBpZiAob2JzZXJ2ZXIpIHtcbiAgICAgIGhhbmRsZXIobm9kZSwgb2JzZXJ2ZXIudGFrZVJlY29yZHMoKSk7XG4gICAgICB0YWtlTXV0YXRpb25zKCk7XG4gICAgfVxuICB9XG4gIHZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbC5iaW5kKEFycmF5LnByb3RvdHlwZS5mb3JFYWNoKTtcbiAgZnVuY3Rpb24gb2JzZXJ2ZShpblJvb3QpIHtcbiAgICBpZiAoaW5Sb290Ll9fb2JzZXJ2ZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoaGFuZGxlci5iaW5kKHRoaXMsIGluUm9vdCkpO1xuICAgIG9ic2VydmVyLm9ic2VydmUoaW5Sb290LCB7XG4gICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgfSk7XG4gICAgaW5Sb290Ll9fb2JzZXJ2ZXIgPSBvYnNlcnZlcjtcbiAgfVxuICBmdW5jdGlvbiB1cGdyYWRlRG9jdW1lbnQoZG9jKSB7XG4gICAgZG9jID0gd2luZG93LndyYXAoZG9jKTtcbiAgICBmbGFncy5kb20gJiYgY29uc29sZS5ncm91cChcInVwZ3JhZGVEb2N1bWVudDogXCIsIGRvYy5iYXNlVVJJLnNwbGl0KFwiL1wiKS5wb3AoKSk7XG4gICAgdmFyIGlzTWFpbkRvY3VtZW50ID0gZG9jID09PSB3aW5kb3cud3JhcChkb2N1bWVudCk7XG4gICAgYWRkZWROb2RlKGRvYywgaXNNYWluRG9jdW1lbnQpO1xuICAgIG9ic2VydmUoZG9jKTtcbiAgICBmbGFncy5kb20gJiYgY29uc29sZS5ncm91cEVuZCgpO1xuICB9XG4gIGZ1bmN0aW9uIHVwZ3JhZGVEb2N1bWVudFRyZWUoZG9jKSB7XG4gICAgZm9yRG9jdW1lbnRUcmVlKGRvYywgdXBncmFkZURvY3VtZW50KTtcbiAgfVxuICB2YXIgb3JpZ2luYWxDcmVhdGVTaGFkb3dSb290ID0gRWxlbWVudC5wcm90b3R5cGUuY3JlYXRlU2hhZG93Um9vdDtcbiAgaWYgKG9yaWdpbmFsQ3JlYXRlU2hhZG93Um9vdCkge1xuICAgIEVsZW1lbnQucHJvdG90eXBlLmNyZWF0ZVNoYWRvd1Jvb3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByb290ID0gb3JpZ2luYWxDcmVhdGVTaGFkb3dSb290LmNhbGwodGhpcyk7XG4gICAgICB3aW5kb3cuQ3VzdG9tRWxlbWVudHMud2F0Y2hTaGFkb3codGhpcyk7XG4gICAgICByZXR1cm4gcm9vdDtcbiAgICB9O1xuICB9XG4gIHNjb3BlLndhdGNoU2hhZG93ID0gd2F0Y2hTaGFkb3c7XG4gIHNjb3BlLnVwZ3JhZGVEb2N1bWVudFRyZWUgPSB1cGdyYWRlRG9jdW1lbnRUcmVlO1xuICBzY29wZS51cGdyYWRlRG9jdW1lbnQgPSB1cGdyYWRlRG9jdW1lbnQ7XG4gIHNjb3BlLnVwZ3JhZGVTdWJ0cmVlID0gYWRkZWRTdWJ0cmVlO1xuICBzY29wZS51cGdyYWRlQWxsID0gYWRkZWROb2RlO1xuICBzY29wZS5hdHRhY2hlZCA9IGF0dGFjaGVkO1xuICBzY29wZS50YWtlUmVjb3JkcyA9IHRha2VSZWNvcmRzO1xufSk7XG5cbndpbmRvdy5DdXN0b21FbGVtZW50cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGZsYWdzID0gc2NvcGUuZmxhZ3M7XG4gIGZ1bmN0aW9uIHVwZ3JhZGUobm9kZSwgaXNBdHRhY2hlZCkge1xuICAgIGlmIChub2RlLmxvY2FsTmFtZSA9PT0gXCJ0ZW1wbGF0ZVwiKSB7XG4gICAgICBpZiAod2luZG93LkhUTUxUZW1wbGF0ZUVsZW1lbnQgJiYgSFRNTFRlbXBsYXRlRWxlbWVudC5kZWNvcmF0ZSkge1xuICAgICAgICBIVE1MVGVtcGxhdGVFbGVtZW50LmRlY29yYXRlKG5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIW5vZGUuX191cGdyYWRlZF9fICYmIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICB2YXIgaXMgPSBub2RlLmdldEF0dHJpYnV0ZShcImlzXCIpO1xuICAgICAgdmFyIGRlZmluaXRpb24gPSBzY29wZS5nZXRSZWdpc3RlcmVkRGVmaW5pdGlvbihub2RlLmxvY2FsTmFtZSkgfHwgc2NvcGUuZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24oaXMpO1xuICAgICAgaWYgKGRlZmluaXRpb24pIHtcbiAgICAgICAgaWYgKGlzICYmIGRlZmluaXRpb24udGFnID09IG5vZGUubG9jYWxOYW1lIHx8ICFpcyAmJiAhZGVmaW5pdGlvbi5leHRlbmRzKSB7XG4gICAgICAgICAgcmV0dXJuIHVwZ3JhZGVXaXRoRGVmaW5pdGlvbihub2RlLCBkZWZpbml0aW9uLCBpc0F0dGFjaGVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB1cGdyYWRlV2l0aERlZmluaXRpb24oZWxlbWVudCwgZGVmaW5pdGlvbiwgaXNBdHRhY2hlZCkge1xuICAgIGZsYWdzLnVwZ3JhZGUgJiYgY29uc29sZS5ncm91cChcInVwZ3JhZGU6XCIsIGVsZW1lbnQubG9jYWxOYW1lKTtcbiAgICBpZiAoZGVmaW5pdGlvbi5pcykge1xuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJpc1wiLCBkZWZpbml0aW9uLmlzKTtcbiAgICB9XG4gICAgaW1wbGVtZW50UHJvdG90eXBlKGVsZW1lbnQsIGRlZmluaXRpb24pO1xuICAgIGVsZW1lbnQuX191cGdyYWRlZF9fID0gdHJ1ZTtcbiAgICBjcmVhdGVkKGVsZW1lbnQpO1xuICAgIGlmIChpc0F0dGFjaGVkKSB7XG4gICAgICBzY29wZS5hdHRhY2hlZChlbGVtZW50KTtcbiAgICB9XG4gICAgc2NvcGUudXBncmFkZVN1YnRyZWUoZWxlbWVudCwgaXNBdHRhY2hlZCk7XG4gICAgZmxhZ3MudXBncmFkZSAmJiBjb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cbiAgZnVuY3Rpb24gaW1wbGVtZW50UHJvdG90eXBlKGVsZW1lbnQsIGRlZmluaXRpb24pIHtcbiAgICBpZiAoT2JqZWN0Ll9fcHJvdG9fXykge1xuICAgICAgZWxlbWVudC5fX3Byb3RvX18gPSBkZWZpbml0aW9uLnByb3RvdHlwZTtcbiAgICB9IGVsc2Uge1xuICAgICAgY3VzdG9tTWl4aW4oZWxlbWVudCwgZGVmaW5pdGlvbi5wcm90b3R5cGUsIGRlZmluaXRpb24ubmF0aXZlKTtcbiAgICAgIGVsZW1lbnQuX19wcm90b19fID0gZGVmaW5pdGlvbi5wcm90b3R5cGU7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGN1c3RvbU1peGluKGluVGFyZ2V0LCBpblNyYywgaW5OYXRpdmUpIHtcbiAgICB2YXIgdXNlZCA9IHt9O1xuICAgIHZhciBwID0gaW5TcmM7XG4gICAgd2hpbGUgKHAgIT09IGluTmF0aXZlICYmIHAgIT09IEhUTUxFbGVtZW50LnByb3RvdHlwZSkge1xuICAgICAgdmFyIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBrOyBrID0ga2V5c1tpXTsgaSsrKSB7XG4gICAgICAgIGlmICghdXNlZFtrXSkge1xuICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpblRhcmdldCwgaywgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihwLCBrKSk7XG4gICAgICAgICAgdXNlZFtrXSA9IDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHAgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGNyZWF0ZWQoZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50LmNyZWF0ZWRDYWxsYmFjaykge1xuICAgICAgZWxlbWVudC5jcmVhdGVkQ2FsbGJhY2soKTtcbiAgICB9XG4gIH1cbiAgc2NvcGUudXBncmFkZSA9IHVwZ3JhZGU7XG4gIHNjb3BlLnVwZ3JhZGVXaXRoRGVmaW5pdGlvbiA9IHVwZ3JhZGVXaXRoRGVmaW5pdGlvbjtcbiAgc2NvcGUuaW1wbGVtZW50UHJvdG90eXBlID0gaW1wbGVtZW50UHJvdG90eXBlO1xufSk7XG5cbndpbmRvdy5DdXN0b21FbGVtZW50cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGlzSUUgPSBzY29wZS5pc0lFO1xuICB2YXIgdXBncmFkZURvY3VtZW50VHJlZSA9IHNjb3BlLnVwZ3JhZGVEb2N1bWVudFRyZWU7XG4gIHZhciB1cGdyYWRlQWxsID0gc2NvcGUudXBncmFkZUFsbDtcbiAgdmFyIHVwZ3JhZGVXaXRoRGVmaW5pdGlvbiA9IHNjb3BlLnVwZ3JhZGVXaXRoRGVmaW5pdGlvbjtcbiAgdmFyIGltcGxlbWVudFByb3RvdHlwZSA9IHNjb3BlLmltcGxlbWVudFByb3RvdHlwZTtcbiAgdmFyIHVzZU5hdGl2ZSA9IHNjb3BlLnVzZU5hdGl2ZTtcbiAgZnVuY3Rpb24gcmVnaXN0ZXIobmFtZSwgb3B0aW9ucykge1xuICAgIHZhciBkZWZpbml0aW9uID0gb3B0aW9ucyB8fCB7fTtcbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudDogZmlyc3QgYXJndW1lbnQgYG5hbWVgIG11c3Qgbm90IGJlIGVtcHR5XCIpO1xuICAgIH1cbiAgICBpZiAobmFtZS5pbmRleE9mKFwiLVwiKSA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudDogZmlyc3QgYXJndW1lbnQgKCduYW1lJykgbXVzdCBjb250YWluIGEgZGFzaCAoJy0nKS4gQXJndW1lbnQgcHJvdmlkZWQgd2FzICdcIiArIFN0cmluZyhuYW1lKSArIFwiJy5cIik7XG4gICAgfVxuICAgIGlmIChpc1Jlc2VydmVkVGFnKG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gZXhlY3V0ZSAncmVnaXN0ZXJFbGVtZW50JyBvbiAnRG9jdW1lbnQnOiBSZWdpc3RyYXRpb24gZmFpbGVkIGZvciB0eXBlICdcIiArIFN0cmluZyhuYW1lKSArIFwiJy4gVGhlIHR5cGUgbmFtZSBpcyBpbnZhbGlkLlwiKTtcbiAgICB9XG4gICAgaWYgKGdldFJlZ2lzdGVyZWREZWZpbml0aW9uKG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEdXBsaWNhdGVEZWZpbml0aW9uRXJyb3I6IGEgdHlwZSB3aXRoIG5hbWUgJ1wiICsgU3RyaW5nKG5hbWUpICsgXCInIGlzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKCFkZWZpbml0aW9uLnByb3RvdHlwZSkge1xuICAgICAgZGVmaW5pdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgfVxuICAgIGRlZmluaXRpb24uX19uYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChkZWZpbml0aW9uLmV4dGVuZHMpIHtcbiAgICAgIGRlZmluaXRpb24uZXh0ZW5kcyA9IGRlZmluaXRpb24uZXh0ZW5kcy50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgICBkZWZpbml0aW9uLmxpZmVjeWNsZSA9IGRlZmluaXRpb24ubGlmZWN5Y2xlIHx8IHt9O1xuICAgIGRlZmluaXRpb24uYW5jZXN0cnkgPSBhbmNlc3RyeShkZWZpbml0aW9uLmV4dGVuZHMpO1xuICAgIHJlc29sdmVUYWdOYW1lKGRlZmluaXRpb24pO1xuICAgIHJlc29sdmVQcm90b3R5cGVDaGFpbihkZWZpbml0aW9uKTtcbiAgICBvdmVycmlkZUF0dHJpYnV0ZUFwaShkZWZpbml0aW9uLnByb3RvdHlwZSk7XG4gICAgcmVnaXN0ZXJEZWZpbml0aW9uKGRlZmluaXRpb24uX19uYW1lLCBkZWZpbml0aW9uKTtcbiAgICBkZWZpbml0aW9uLmN0b3IgPSBnZW5lcmF0ZUNvbnN0cnVjdG9yKGRlZmluaXRpb24pO1xuICAgIGRlZmluaXRpb24uY3Rvci5wcm90b3R5cGUgPSBkZWZpbml0aW9uLnByb3RvdHlwZTtcbiAgICBkZWZpbml0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGRlZmluaXRpb24uY3RvcjtcbiAgICBpZiAoc2NvcGUucmVhZHkpIHtcbiAgICAgIHVwZ3JhZGVEb2N1bWVudFRyZWUoZG9jdW1lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gZGVmaW5pdGlvbi5jdG9yO1xuICB9XG4gIGZ1bmN0aW9uIG92ZXJyaWRlQXR0cmlidXRlQXBpKHByb3RvdHlwZSkge1xuICAgIGlmIChwcm90b3R5cGUuc2V0QXR0cmlidXRlLl9wb2x5ZmlsbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBzZXRBdHRyaWJ1dGUgPSBwcm90b3R5cGUuc2V0QXR0cmlidXRlO1xuICAgIHByb3RvdHlwZS5zZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgY2hhbmdlQXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSwgdmFsdWUsIHNldEF0dHJpYnV0ZSk7XG4gICAgfTtcbiAgICB2YXIgcmVtb3ZlQXR0cmlidXRlID0gcHJvdG90eXBlLnJlbW92ZUF0dHJpYnV0ZTtcbiAgICBwcm90b3R5cGUucmVtb3ZlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSkge1xuICAgICAgY2hhbmdlQXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSwgbnVsbCwgcmVtb3ZlQXR0cmlidXRlKTtcbiAgICB9O1xuICAgIHByb3RvdHlwZS5zZXRBdHRyaWJ1dGUuX3BvbHlmaWxsZWQgPSB0cnVlO1xuICB9XG4gIGZ1bmN0aW9uIGNoYW5nZUF0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgb3BlcmF0aW9uKSB7XG4gICAgbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICBvcGVyYXRpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB2YXIgbmV3VmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICBpZiAodGhpcy5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgJiYgbmV3VmFsdWUgIT09IG9sZFZhbHVlKSB7XG4gICAgICB0aGlzLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBpc1Jlc2VydmVkVGFnKG5hbWUpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc2VydmVkVGFnTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKG5hbWUgPT09IHJlc2VydmVkVGFnTGlzdFtpXSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdmFyIHJlc2VydmVkVGFnTGlzdCA9IFsgXCJhbm5vdGF0aW9uLXhtbFwiLCBcImNvbG9yLXByb2ZpbGVcIiwgXCJmb250LWZhY2VcIiwgXCJmb250LWZhY2Utc3JjXCIsIFwiZm9udC1mYWNlLXVyaVwiLCBcImZvbnQtZmFjZS1mb3JtYXRcIiwgXCJmb250LWZhY2UtbmFtZVwiLCBcIm1pc3NpbmctZ2x5cGhcIiBdO1xuICBmdW5jdGlvbiBhbmNlc3RyeShleHRuZHMpIHtcbiAgICB2YXIgZXh0ZW5kZWUgPSBnZXRSZWdpc3RlcmVkRGVmaW5pdGlvbihleHRuZHMpO1xuICAgIGlmIChleHRlbmRlZSkge1xuICAgICAgcmV0dXJuIGFuY2VzdHJ5KGV4dGVuZGVlLmV4dGVuZHMpLmNvbmNhdChbIGV4dGVuZGVlIF0pO1xuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cbiAgZnVuY3Rpb24gcmVzb2x2ZVRhZ05hbWUoZGVmaW5pdGlvbikge1xuICAgIHZhciBiYXNlVGFnID0gZGVmaW5pdGlvbi5leHRlbmRzO1xuICAgIGZvciAodmFyIGkgPSAwLCBhOyBhID0gZGVmaW5pdGlvbi5hbmNlc3RyeVtpXTsgaSsrKSB7XG4gICAgICBiYXNlVGFnID0gYS5pcyAmJiBhLnRhZztcbiAgICB9XG4gICAgZGVmaW5pdGlvbi50YWcgPSBiYXNlVGFnIHx8IGRlZmluaXRpb24uX19uYW1lO1xuICAgIGlmIChiYXNlVGFnKSB7XG4gICAgICBkZWZpbml0aW9uLmlzID0gZGVmaW5pdGlvbi5fX25hbWU7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlc29sdmVQcm90b3R5cGVDaGFpbihkZWZpbml0aW9uKSB7XG4gICAgaWYgKCFPYmplY3QuX19wcm90b19fKSB7XG4gICAgICB2YXIgbmF0aXZlUHJvdG90eXBlID0gSFRNTEVsZW1lbnQucHJvdG90eXBlO1xuICAgICAgaWYgKGRlZmluaXRpb24uaXMpIHtcbiAgICAgICAgdmFyIGluc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRlZmluaXRpb24udGFnKTtcbiAgICAgICAgbmF0aXZlUHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGluc3QpO1xuICAgICAgfVxuICAgICAgdmFyIHByb3RvID0gZGVmaW5pdGlvbi5wcm90b3R5cGUsIGFuY2VzdG9yO1xuICAgICAgdmFyIGZvdW5kUHJvdG90eXBlID0gZmFsc2U7XG4gICAgICB3aGlsZSAocHJvdG8pIHtcbiAgICAgICAgaWYgKHByb3RvID09IG5hdGl2ZVByb3RvdHlwZSkge1xuICAgICAgICAgIGZvdW5kUHJvdG90eXBlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBhbmNlc3RvciA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90byk7XG4gICAgICAgIGlmIChhbmNlc3Rvcikge1xuICAgICAgICAgIHByb3RvLl9fcHJvdG9fXyA9IGFuY2VzdG9yO1xuICAgICAgICB9XG4gICAgICAgIHByb3RvID0gYW5jZXN0b3I7XG4gICAgICB9XG4gICAgICBpZiAoIWZvdW5kUHJvdG90eXBlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihkZWZpbml0aW9uLnRhZyArIFwiIHByb3RvdHlwZSBub3QgZm91bmQgaW4gcHJvdG90eXBlIGNoYWluIGZvciBcIiArIGRlZmluaXRpb24uaXMpO1xuICAgICAgfVxuICAgICAgZGVmaW5pdGlvbi5uYXRpdmUgPSBuYXRpdmVQcm90b3R5cGU7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGluc3RhbnRpYXRlKGRlZmluaXRpb24pIHtcbiAgICByZXR1cm4gdXBncmFkZVdpdGhEZWZpbml0aW9uKGRvbUNyZWF0ZUVsZW1lbnQoZGVmaW5pdGlvbi50YWcpLCBkZWZpbml0aW9uKTtcbiAgfVxuICB2YXIgcmVnaXN0cnkgPSB7fTtcbiAgZnVuY3Rpb24gZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24obmFtZSkge1xuICAgIGlmIChuYW1lKSB7XG4gICAgICByZXR1cm4gcmVnaXN0cnlbbmFtZS50b0xvd2VyQ2FzZSgpXTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVnaXN0ZXJEZWZpbml0aW9uKG5hbWUsIGRlZmluaXRpb24pIHtcbiAgICByZWdpc3RyeVtuYW1lXSA9IGRlZmluaXRpb247XG4gIH1cbiAgZnVuY3Rpb24gZ2VuZXJhdGVDb25zdHJ1Y3RvcihkZWZpbml0aW9uKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGluc3RhbnRpYXRlKGRlZmluaXRpb24pO1xuICAgIH07XG4gIH1cbiAgdmFyIEhUTUxfTkFNRVNQQUNFID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCI7XG4gIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIHRhZywgdHlwZUV4dGVuc2lvbikge1xuICAgIGlmIChuYW1lc3BhY2UgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICByZXR1cm4gY3JlYXRlRWxlbWVudCh0YWcsIHR5cGVFeHRlbnNpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZG9tQ3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudCh0YWcsIHR5cGVFeHRlbnNpb24pIHtcbiAgICBpZiAodGFnKSB7XG4gICAgICB0YWcgPSB0YWcudG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVFeHRlbnNpb24pIHtcbiAgICAgIHR5cGVFeHRlbnNpb24gPSB0eXBlRXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuICAgIHZhciBkZWZpbml0aW9uID0gZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24odHlwZUV4dGVuc2lvbiB8fCB0YWcpO1xuICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICBpZiAodGFnID09IGRlZmluaXRpb24udGFnICYmIHR5cGVFeHRlbnNpb24gPT0gZGVmaW5pdGlvbi5pcykge1xuICAgICAgICByZXR1cm4gbmV3IGRlZmluaXRpb24uY3RvcigpO1xuICAgICAgfVxuICAgICAgaWYgKCF0eXBlRXh0ZW5zaW9uICYmICFkZWZpbml0aW9uLmlzKSB7XG4gICAgICAgIHJldHVybiBuZXcgZGVmaW5pdGlvbi5jdG9yKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBlbGVtZW50O1xuICAgIGlmICh0eXBlRXh0ZW5zaW9uKSB7XG4gICAgICBlbGVtZW50ID0gY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJpc1wiLCB0eXBlRXh0ZW5zaW9uKTtcbiAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICBlbGVtZW50ID0gZG9tQ3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIGlmICh0YWcuaW5kZXhPZihcIi1cIikgPj0gMCkge1xuICAgICAgaW1wbGVtZW50UHJvdG90eXBlKGVsZW1lbnQsIEhUTUxFbGVtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cbiAgdmFyIGRvbUNyZWF0ZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50LmJpbmQoZG9jdW1lbnQpO1xuICB2YXIgZG9tQ3JlYXRlRWxlbWVudE5TID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TLmJpbmQoZG9jdW1lbnQpO1xuICB2YXIgaXNJbnN0YW5jZTtcbiAgaWYgKCFPYmplY3QuX19wcm90b19fICYmICF1c2VOYXRpdmUpIHtcbiAgICBpc0luc3RhbmNlID0gZnVuY3Rpb24ob2JqLCBjdG9yKSB7XG4gICAgICBpZiAob2JqIGluc3RhbmNlb2YgY3Rvcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBwID0gb2JqO1xuICAgICAgd2hpbGUgKHApIHtcbiAgICAgICAgaWYgKHAgPT09IGN0b3IucHJvdG90eXBlKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcCA9IHAuX19wcm90b19fO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgaXNJbnN0YW5jZSA9IGZ1bmN0aW9uKG9iaiwgYmFzZSkge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIGJhc2U7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiB3cmFwRG9tTWV0aG9kVG9Gb3JjZVVwZ3JhZGUob2JqLCBtZXRob2ROYW1lKSB7XG4gICAgdmFyIG9yaWcgPSBvYmpbbWV0aG9kTmFtZV07XG4gICAgb2JqW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbiA9IG9yaWcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHVwZ3JhZGVBbGwobik7XG4gICAgICByZXR1cm4gbjtcbiAgICB9O1xuICB9XG4gIHdyYXBEb21NZXRob2RUb0ZvcmNlVXBncmFkZShOb2RlLnByb3RvdHlwZSwgXCJjbG9uZU5vZGVcIik7XG4gIHdyYXBEb21NZXRob2RUb0ZvcmNlVXBncmFkZShkb2N1bWVudCwgXCJpbXBvcnROb2RlXCIpO1xuICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgPSByZWdpc3RlcjtcbiAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCA9IGNyZWF0ZUVsZW1lbnQ7XG4gIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyA9IGNyZWF0ZUVsZW1lbnROUztcbiAgc2NvcGUucmVnaXN0cnkgPSByZWdpc3RyeTtcbiAgc2NvcGUuaW5zdGFuY2VvZiA9IGlzSW5zdGFuY2U7XG4gIHNjb3BlLnJlc2VydmVkVGFnTGlzdCA9IHJlc2VydmVkVGFnTGlzdDtcbiAgc2NvcGUuZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24gPSBnZXRSZWdpc3RlcmVkRGVmaW5pdGlvbjtcbiAgZG9jdW1lbnQucmVnaXN0ZXIgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQ7XG59KTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciB1c2VOYXRpdmUgPSBzY29wZS51c2VOYXRpdmU7XG4gIHZhciBpbml0aWFsaXplTW9kdWxlcyA9IHNjb3BlLmluaXRpYWxpemVNb2R1bGVzO1xuICB2YXIgaXNJRSA9IHNjb3BlLmlzSUU7XG4gIGlmICh1c2VOYXRpdmUpIHtcbiAgICB2YXIgbm9wID0gZnVuY3Rpb24oKSB7fTtcbiAgICBzY29wZS53YXRjaFNoYWRvdyA9IG5vcDtcbiAgICBzY29wZS51cGdyYWRlID0gbm9wO1xuICAgIHNjb3BlLnVwZ3JhZGVBbGwgPSBub3A7XG4gICAgc2NvcGUudXBncmFkZURvY3VtZW50VHJlZSA9IG5vcDtcbiAgICBzY29wZS51cGdyYWRlU3VidHJlZSA9IG5vcDtcbiAgICBzY29wZS50YWtlUmVjb3JkcyA9IG5vcDtcbiAgICBzY29wZS5pbnN0YW5jZW9mID0gZnVuY3Rpb24ob2JqLCBiYXNlKSB7XG4gICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgYmFzZTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGluaXRpYWxpemVNb2R1bGVzKCk7XG4gIH1cbiAgdmFyIHVwZ3JhZGVEb2N1bWVudFRyZWUgPSBzY29wZS51cGdyYWRlRG9jdW1lbnRUcmVlO1xuICB2YXIgdXBncmFkZURvY3VtZW50ID0gc2NvcGUudXBncmFkZURvY3VtZW50O1xuICBpZiAoIXdpbmRvdy53cmFwKSB7XG4gICAgaWYgKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCkge1xuICAgICAgd2luZG93LndyYXAgPSB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwud3JhcElmTmVlZGVkO1xuICAgICAgd2luZG93LnVud3JhcCA9IHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbC51bndyYXBJZk5lZWRlZDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93LndyYXAgPSB3aW5kb3cudW53cmFwID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIGlmICh3aW5kb3cuSFRNTEltcG9ydHMpIHtcbiAgICB3aW5kb3cuSFRNTEltcG9ydHMuX19pbXBvcnRzUGFyc2luZ0hvb2sgPSBmdW5jdGlvbihlbHQpIHtcbiAgICAgIGlmIChlbHQuaW1wb3J0KSB7XG4gICAgICAgIHVwZ3JhZGVEb2N1bWVudCh3cmFwKGVsdC5pbXBvcnQpKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGJvb3RzdHJhcCgpIHtcbiAgICB1cGdyYWRlRG9jdW1lbnRUcmVlKHdpbmRvdy53cmFwKGRvY3VtZW50KSk7XG4gICAgd2luZG93LkN1c3RvbUVsZW1lbnRzLnJlYWR5ID0gdHJ1ZTtcbiAgICB2YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCBmdW5jdGlvbihmKSB7XG4gICAgICBzZXRUaW1lb3V0KGYsIDE2KTtcbiAgICB9O1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cy5yZWFkeVRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICBpZiAod2luZG93LkhUTUxJbXBvcnRzKSB7XG4gICAgICAgICAgd2luZG93LkN1c3RvbUVsZW1lbnRzLmVsYXBzZWQgPSB3aW5kb3cuQ3VzdG9tRWxlbWVudHMucmVhZHlUaW1lIC0gd2luZG93LkhUTUxJbXBvcnRzLnJlYWR5VGltZTtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcIldlYkNvbXBvbmVudHNSZWFkeVwiLCB7XG4gICAgICAgICAgYnViYmxlczogdHJ1ZVxuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiIHx8IHNjb3BlLmZsYWdzLmVhZ2VyKSB7XG4gICAgYm9vdHN0cmFwKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJpbnRlcmFjdGl2ZVwiICYmICF3aW5kb3cuYXR0YWNoRXZlbnQgJiYgKCF3aW5kb3cuSFRNTEltcG9ydHMgfHwgd2luZG93LkhUTUxJbXBvcnRzLnJlYWR5KSkge1xuICAgIGJvb3RzdHJhcCgpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsb2FkRXZlbnQgPSB3aW5kb3cuSFRNTEltcG9ydHMgJiYgIXdpbmRvdy5IVE1MSW1wb3J0cy5yZWFkeSA/IFwiSFRNTEltcG9ydHNMb2FkZWRcIiA6IFwiRE9NQ29udGVudExvYWRlZFwiO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKGxvYWRFdmVudCwgYm9vdHN0cmFwKTtcbiAgfVxufSkod2luZG93LkN1c3RvbUVsZW1lbnRzKTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIGlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzMiA9IGFyZ3Muc2xpY2UoKTtcbiAgICAgICAgYXJnczIucHVzaC5hcHBseShhcmdzMiwgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHNlbGYuYXBwbHkoc2NvcGUsIGFyZ3MyKTtcbiAgICAgIH07XG4gICAgfTtcbiAgfVxufSkod2luZG93LldlYkNvbXBvbmVudHMpO1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IFwiXCIgKyBcImJvZHkge1wiICsgXCJ0cmFuc2l0aW9uOiBvcGFjaXR5IGVhc2UtaW4gMC4ycztcIiArIFwiIH0gXFxuXCIgKyBcImJvZHlbdW5yZXNvbHZlZF0ge1wiICsgXCJvcGFjaXR5OiAwOyBkaXNwbGF5OiBibG9jazsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiICsgXCIgfSBcXG5cIjtcbiAgdmFyIGhlYWQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaGVhZFwiKTtcbiAgaGVhZC5pbnNlcnRCZWZvcmUoc3R5bGUsIGhlYWQuZmlyc3RDaGlsZCk7XG59KSh3aW5kb3cuV2ViQ29tcG9uZW50cyk7XG5cbihmdW5jdGlvbihzY29wZSkge1xuICB3aW5kb3cuUGxhdGZvcm0gPSBzY29wZTtcbn0pKHdpbmRvdy5XZWJDb21wb25lbnRzKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwia200VW1mXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3dlYmNvbXBvbmVudHMuanMvd2ViY29tcG9uZW50cy5qc1wiLFwiLy4uLy4uLy4uL25vZGVfbW9kdWxlcy93ZWJjb21wb25lbnRzLmpzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFBuQmFzZUVsZW1lbnQgPSB7fTtcbnZhciBlbGVtZW50cyA9IHt9O1xuXG5QbkJhc2VFbGVtZW50LmNyZWF0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnBvbHltZXJOYXRpdmUgPSB7fTtcbiAgICB0aGlzLnBvbHltZXJOYXRpdmUuaWQgPSBwb2x5bWVyTmF0aXZlQ2xpZW50LnV0aWxzLmdldE5leHRJZCgpO1xuICAgIGVsZW1lbnRzW3RoaXMucG9seW1lck5hdGl2ZS5pZF0gPSB0aGlzO1xufTtcblxuUG5CYXNlRWxlbWVudC5hdHRhY2hlZENhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvL3NldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnVwZGF0ZVNlcmlhbGl6ZWRQcm9wZXJ0aWVzKCk7XG4gICAgICAgIGlmICh3aW5kb3cucG9seW1lck5hdGl2ZUhvc3QpIHtcbiAgICAgICAgICAgIHNlbGYuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgICAgICAgcG9seW1lck5hdGl2ZUhvc3QuY3JlYXRlRWxlbWVudChzZWxmLnBvbHltZXJOYXRpdmUuc2VyaWFsaXplZFByb3BlcnRpZXMpO1xuICAgICAgICB9XG4gICAgLy99LCAwKTtcbn07XG5cblBuQmFzZUVsZW1lbnQuZGV0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAod2luZG93LnBvbHltZXJOYXRpdmVIb3N0KSB7XG4gICAgICAgIHBvbHltZXJOYXRpdmVIb3N0LnJlbW92ZUVsZW1lbnQodGhpcy5wb2x5bWVyTmF0aXZlLmlkKTtcbiAgICB9XG59O1xuXG5QbkJhc2VFbGVtZW50LnVwZGF0ZSA9IGZ1bmN0aW9uIChyZWN1cnNpdmUpIHtcbiAgICB0aGlzLnVwZGF0ZVNlcmlhbGl6ZWRQcm9wZXJ0aWVzKCk7XG4gICAgaWYgKHdpbmRvdy5wb2x5bWVyTmF0aXZlSG9zdCkge1xuICAgICAgICBwb2x5bWVyTmF0aXZlSG9zdC51cGRhdGVFbGVtZW50KHRoaXMucG9seW1lck5hdGl2ZS5zZXJpYWxpemVkUHJvcGVydGllcyk7XG4gICAgfVxuICAgIGlmIChyZWN1cnNpdmUpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZE5vZGUgPSB0aGlzLmNoaWxkTm9kZXNbaV07XG4gICAgICAgICAgICBpZiAoY2hpbGROb2RlLnBvbHltZXJOYXRpdmUpIHtcbiAgICAgICAgICAgICAgICBjaGlsZE5vZGUudXBkYXRlKHJlY3Vyc2l2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5QbkJhc2VFbGVtZW50LnVwZGF0ZVNlcmlhbGl6ZWRQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucG9seW1lck5hdGl2ZS5zZXJpYWxpemVkUHJvcGVydGllcyA9IEpTT04uc3RyaW5naWZ5KHBvbHltZXJOYXRpdmVDbGllbnQudXRpbHMuZ2V0RWxlbWVudFByb3BlcnRpZXModGhpcykpO1xufTtcblxuUG5CYXNlRWxlbWVudC5nZXRQTlBhcmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcGFyZW50ID0gdGhpcztcblxuICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG5cbiAgICAgICAgaWYgKHBhcmVudCAmJiBwYXJlbnQucG9seW1lck5hdGl2ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcmVudDtcbiAgICAgICAgfSBlbHNlIGlmIChwYXJlbnQgPT09IHdpbmRvdy5kb2N1bWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG53aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudCA9IHdpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50IHx8IHt9O1xud2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQuZWxlbWVudHMgPSBlbGVtZW50cztcbndpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50LlBuQmFzZUVsZW1lbnQgPSBQbkJhc2VFbGVtZW50O1xuXG5cbi8vR2xvYmFsIG9ic2VydmVyc1xuXG5QbkJhc2VFbGVtZW50Lm9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yICh2YXIgZWxlbWVudElkIGluIHdpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50LmVsZW1lbnRzKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IHdpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50LmVsZW1lbnRzW2VsZW1lbnRJZF07XG4gICAgICAgICAgICBlbGVtZW50LnVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgfSwgMCk7XG59O1xuXG5QbkJhc2VFbGVtZW50Lm9uTXV0YXRpb25zID0gZnVuY3Rpb24gKG11dGF0aW9ucykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBtdXRhdGlvbiA9IG11dGF0aW9uc1tpXTtcblxuICAgICAgICBjb25zb2xlLmxvZygnTXV0YXRlZCAnICsgbXV0YXRpb24udGFyZ2V0LnRhZ05hbWUpO1xuXG4gICAgICAgIHZhciBzdHJ1Y3R1cmVDaGFuZ2VkID0gbXV0YXRpb24ucmVtb3ZlZE5vZGVzLmxlbmd0aCB8fCBtdXRhdGlvbi5hZGRlZE5vZGVzLmxlbmd0aDtcbiAgICAgICAgbXV0YXRpb24udGFyZ2V0LnVwZGF0ZShzdHJ1Y3R1cmVDaGFuZ2VkKTtcbiAgICB9XG59O1xuXG5QbkJhc2VFbGVtZW50LmluaXRpYWxpemVPYnNlcnZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgIGNoYXJhY3RlckRhdGE6IHRydWUsXG4gICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgICAgIGF0dHJpYnV0ZUZpbHRlcjogWydzdHlsZSddXG4gICAgICAgIH07XG5cbiAgICB0aGlzLm9ic2VydmVyID0gdGhpcy5vYnNlcnZlciB8fCBuZXcgTXV0YXRpb25PYnNlcnZlcihQbkJhc2VFbGVtZW50Lm9uTXV0YXRpb25zKTtcbiAgICB0aGlzLm9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwgY29uZmlnKTtcbn07XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgUG5CYXNlRWxlbWVudC5pbml0aWFsaXplT2JzZXJ2ZXIpO1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgUG5CYXNlRWxlbWVudC5vblJlc2l6ZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG5CYXNlRWxlbWVudDtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwia200VW1mXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZWxlbWVudHMvYmFzZS9wbi1iYXNlLWVsZW1lbnQuanNcIixcIi9lbGVtZW50cy9iYXNlXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuL3BuLWJhc2UtZWxlbWVudC5qcycpO1xudmFyIFBuVXRpbHMgPSByZXF1aXJlKCcuLi8uLi9wbi11dGlscy5qcycpO1xuXG52YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxEaXZFbGVtZW50LnByb3RvdHlwZSk7XG5wcm90byA9IE9iamVjdC5hc3NpZ24ocHJvdG8sIFBuQmFzZUVsZW1lbnQpO1xuXG5QblV0aWxzLnJlZ2lzdGVyKCd2aWV3Jywge1xuICAgIHByb3RvdHlwZTogcHJvdG9cbn0pO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9lbGVtZW50cy9iYXNlL3BuLXZpZXcuanNcIixcIi9lbGVtZW50cy9iYXNlXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzJyk7XG52YXIgUG5VdGlscyA9IHJlcXVpcmUoJy4uL3BuLXV0aWxzLmpzJyk7XG5cbnZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEJ1dHRvbkVsZW1lbnQucHJvdG90eXBlKTtcbnByb3RvID0gT2JqZWN0LmFzc2lnbihwcm90bywgUG5CYXNlRWxlbWVudCk7XG5cblBuVXRpbHMucmVnaXN0ZXIoJ2J1dHRvbicsIHtcbiAgICBleHRlbmRzOiAnYnV0dG9uJyxcbiAgICBwcm90b3R5cGU6IHByb3RvXG59KTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwia200VW1mXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZWxlbWVudHMvcG4tYnV0dG9uLmpzXCIsXCIvZWxlbWVudHNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgUG5CYXNlRWxlbWVudCA9IHJlcXVpcmUoJy4vYmFzZS9wbi1iYXNlLWVsZW1lbnQuanMnKTtcbnZhciBQblV0aWxzID0gcmVxdWlyZSgnLi4vcG4tdXRpbHMuanMnKTtcblxudmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MSW5wdXRFbGVtZW50LnByb3RvdHlwZSk7XG5wcm90byA9IE9iamVjdC5hc3NpZ24ocHJvdG8sIFBuQmFzZUVsZW1lbnQpO1xuXG5QblV0aWxzLnJlZ2lzdGVyKCdjaGVja2JveCcsIHtcbiAgICBleHRlbmRzOiAnaW5wdXQnLFxuICAgIHByb3RvdHlwZTogcHJvdG9cbn0pO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9lbGVtZW50cy9wbi1jaGVja2JveC5qc1wiLFwiL2VsZW1lbnRzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzJyk7XG52YXIgUG5VdGlscyA9IHJlcXVpcmUoJy4uL3BuLXV0aWxzLmpzJyk7XG5cbnZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEltYWdlRWxlbWVudC5wcm90b3R5cGUpO1xucHJvdG8gPSBPYmplY3QuYXNzaWduKHByb3RvLCBQbkJhc2VFbGVtZW50KTtcblxuUG5VdGlscy5yZWdpc3RlcignaW1nJywge1xuICAgIGV4dGVuZHM6ICdpbWcnLFxuICAgIHByb3RvdHlwZTogcHJvdG9cbn0pO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9lbGVtZW50cy9wbi1pbWcuanNcIixcIi9lbGVtZW50c1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBQbkJhc2VFbGVtZW50ID0gcmVxdWlyZSgnLi9iYXNlL3BuLWJhc2UtZWxlbWVudC5qcycpO1xudmFyIFBuVXRpbHMgPSByZXF1aXJlKCcuLi9wbi11dGlscy5qcycpO1xuXG52YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxJbnB1dEVsZW1lbnQucHJvdG90eXBlKTtcbnByb3RvID0gT2JqZWN0LmFzc2lnbihwcm90bywgUG5CYXNlRWxlbWVudCk7XG5cbnByb3RvLnNldFZhbHVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufVxuXG5QblV0aWxzLnJlZ2lzdGVyKCdpbnB1dCcsIHtcbiAgICBleHRlbmRzOiAnaW5wdXQnLFxuICAgIHByb3RvdHlwZTogcHJvdG9cbn0pO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9lbGVtZW50cy9wbi1pbnB1dC5qc1wiLFwiL2VsZW1lbnRzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzJyk7XG52YXIgUG5VdGlscyA9IHJlcXVpcmUoJy4uL3BuLXV0aWxzLmpzJyk7XG5cbnZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTERpdkVsZW1lbnQucHJvdG90eXBlKTtcbnByb3RvID0gT2JqZWN0LmFzc2lnbihwcm90bywgUG5CYXNlRWxlbWVudCk7XG5cblBuVXRpbHMucmVnaXN0ZXIoJ2xhYmVsJywge1xuICAgIHByb3RvdHlwZTogcHJvdG9cbn0pO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9lbGVtZW50cy9wbi1sYWJlbC5qc1wiLFwiL2VsZW1lbnRzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFBuQmFzZUVsZW1lbnQgPSByZXF1aXJlKCcuL2Jhc2UvcG4tYmFzZS1lbGVtZW50LmpzJyk7XG52YXIgUG5VdGlscyA9IHJlcXVpcmUoJy4uL3BuLXV0aWxzLmpzJyk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKXtcblxuICAgIHZhciBib2R5RWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG4gICAgYm9keUVsZW1lbnQucG9seW1lck5hdGl2ZSA9IHt9O1xuICAgIGJvZHlFbGVtZW50LnBvbHltZXJOYXRpdmUuaWQgPSAncm9vdCc7XG5cbiAgICB2YXIgYm9keVByb3BzID0gUG5VdGlscy5nZXRFbGVtZW50UHJvcGVydGllcyhib2R5RWxlbWVudCk7XG4gICAgYm9keVByb3BzLnRhZ05hbWUgPSAncG4tcm9vdCc7XG5cbiAgICBjb25zb2xlLmxvZygnVXBkYXRpbmcgcm9vdCB2aWV3Jyk7XG5cbiAgICBpZiAod2luZG93LnBvbHltZXJOYXRpdmVIb3N0KSB7XG4gICAgICAgIHBvbHltZXJOYXRpdmVIb3N0LnVwZGF0ZUVsZW1lbnQoSlNPTi5zdHJpbmdpZnkoYm9keVByb3BzKSk7XG4gICAgfVxuXG4gICAgd2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQuZWxlbWVudHNbJ3Jvb3QnXSA9IHRoaXM7XG59KTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwia200VW1mXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZWxlbWVudHMvcG4tcm9vdHZpZXcuanNcIixcIi9lbGVtZW50c1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBSZWJlbFJvdXRlID0gcmVxdWlyZSgnLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3JlYmVsLXJvdXRlci9lczUvcmViZWwtcm91dGVyLmpzJykuUmViZWxSb3V0ZTtcbnZhciBQbkJhc2VFbGVtZW50ID0gcmVxdWlyZSgnLi4vYmFzZS9wbi1iYXNlLWVsZW1lbnQuanMnKTtcbnZhciBQblV0aWxzID0gcmVxdWlyZSgnLi4vLi4vcG4tdXRpbHMuanMnKTtcblxudmFyIFJvdXRlID0gKGZ1bmN0aW9uIChfUmViZWxSb3V0ZSkge1xuXG4gICAgUm91dGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShfUmViZWxSb3V0ZS5wcm90b3R5cGUpO1xuICAgIFJvdXRlLnByb3RvdHlwZSA9IE9iamVjdC5hc3NpZ24oUm91dGUucHJvdG90eXBlLCBQbkJhc2VFbGVtZW50KTtcblxuICAgIGZ1bmN0aW9uIFJvdXRlKCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKFJvdXRlKS5hcHBseSh0aGlzKTtcbiAgICB9XG5cbiAgICBSb3V0ZS5wcm90b3R5cGUuY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFBuQmFzZUVsZW1lbnQuY3JlYXRlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xuICAgIH07XG5cbiAgICBSb3V0ZS5wcm90b3R5cGUuYXR0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHNjb3BlID0gdGhpcztcbiAgICAgICAgUG5CYXNlRWxlbWVudC5hdHRhY2hlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xuICAgICAgICBpZiAod2luZG93LnBvbHltZXJOYXRpdmVIb3N0KSB7XG4gICAgICAgICAgICB3aW5kb3cucG9seW1lck5hdGl2ZUhvc3QuYWN0aXZhdGVSb3V0ZSgkc2NvcGUucG9seW1lck5hdGl2ZS5pZCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgUm91dGUucHJvdG90eXBlLmRldGFjaGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgUG5CYXNlRWxlbWVudC5kZXRhY2hlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xuICAgIH07XG5cbiAgICByZXR1cm4gUm91dGU7XG5cbn0pKFJlYmVsUm91dGUpO1xuXG5QblV0aWxzLnJlZ2lzdGVyKCdyb3V0ZScsIHtcbiAgICBwcm90b3R5cGU6IFJvdXRlLnByb3RvdHlwZVxufSk7XG5cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9lbGVtZW50cy9yb3V0ZXIvcG4tcm91dGUuanNcIixcIi9lbGVtZW50cy9yb3V0ZXJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgUmViZWxSb3V0ZXIgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcmViZWwtcm91dGVyL2VzNS9yZWJlbC1yb3V0ZXIuanMnKS5SZWJlbFJvdXRlcjtcbnZhciBQbkJhc2VFbGVtZW50ID0gcmVxdWlyZSgnLi4vYmFzZS9wbi1iYXNlLWVsZW1lbnQuanMnKTtcbnZhciBQblV0aWxzID0gcmVxdWlyZSgnLi4vLi4vcG4tdXRpbHMuanMnKTtcblxuLy9wb2x5bWVyTmF0aXZlQ2xpZW50IHNob3VsZCBiZSBnbG9iYWwgdG8gYmUgYWJsZSB0byBjYWxsIGl0IGZyb20gbmF0aXZlIGNvZGVcbndpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50ID0gd2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQgfHwge307XG5cbnZhciBSb3V0ZXIgPSAoZnVuY3Rpb24gKF9SZWJlbFJvdXRlcikge1xuXG4gICAgUm91dGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoX1JlYmVsUm91dGVyLnByb3RvdHlwZSk7XG4gICAgUm91dGVyLnByb3RvdHlwZSA9IE9iamVjdC5hc3NpZ24oUm91dGVyLnByb3RvdHlwZSwgUG5CYXNlRWxlbWVudCk7XG5cbiAgICBmdW5jdGlvbiBSb3V0ZXIoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUm91dGVyKS5hcHBseSh0aGlzKTtcbiAgICB9XG5cbiAgICBSb3V0ZXIucHJvdG90eXBlLmNyZWF0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBQbkJhc2VFbGVtZW50LmNyZWF0ZWRDYWxsYmFjay5hcHBseSh0aGlzKTtcbiAgICAgICAgT2JqZWN0LmdldFByb3RvdHlwZU9mKFJvdXRlci5wcm90b3R5cGUpLmNyZWF0ZWRDYWxsYmFjay5jYWxsKHRoaXMsIFwibmF0aXZlXCIpO1xuICAgIH07XG5cbiAgICBSb3V0ZXIucHJvdG90eXBlLmF0dGFjaGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgUG5CYXNlRWxlbWVudC5hdHRhY2hlZENhbGxiYWNrLmFwcGx5KHRoaXMpO1xuICAgIH07XG5cbiAgICByZXR1cm4gUm91dGVyO1xuXG59KShSZWJlbFJvdXRlcik7XG5cbi8vTm90IHN1cmUgd2hhdCB0aGlzIGlzIGZvcj9cbnZhciBzeW5jaW5nSGlzdG9yeVdpdGhOYXRpdmUgPSBmYWxzZTtcbndpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50LmJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgc3luY2luZ0hpc3RvcnlXaXRoTmF0aXZlID0gdHJ1ZTtcbiAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBzeW5jaW5nSGlzdG9yeVdpdGhOYXRpdmUgPSBmYWxzZTtcbiAgICB9LCAwKTtcbn07XG5cblBuVXRpbHMucmVnaXN0ZXIoJ3JvdXRlcicsIHtcbiAgICBwcm90b3R5cGU6IFJvdXRlci5wcm90b3R5cGVcbn0pO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9lbGVtZW50cy9yb3V0ZXIvcG4tcm91dGVyLmpzXCIsXCIvZWxlbWVudHMvcm91dGVyXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xucmVxdWlyZSgnd2ViY29tcG9uZW50cy5qcycpO1xucmVxdWlyZSgnLi9wbi11dGlscy5qcycpO1xucmVxdWlyZSgnLi9lbGVtZW50cy9iYXNlL3BuLWJhc2UtZWxlbWVudC5qcycpO1xucmVxdWlyZSgnLi9lbGVtZW50cy9iYXNlL3BuLXZpZXcuanMnKTtcbnJlcXVpcmUoJy4vZWxlbWVudHMvcG4tcm9vdHZpZXcuanMnKTtcbnJlcXVpcmUoJy4vZWxlbWVudHMvcG4taW1nLmpzJyk7XG5yZXF1aXJlKCcuL2VsZW1lbnRzL3BuLWxhYmVsLmpzJyk7XG5yZXF1aXJlKCcuL2VsZW1lbnRzL3BuLWJ1dHRvbi5qcycpO1xucmVxdWlyZSgnLi9lbGVtZW50cy9wbi1pbnB1dC5qcycpO1xucmVxdWlyZSgnLi9lbGVtZW50cy9wbi1jaGVja2JveC5qcycpO1xucmVxdWlyZSgnLi9lbGVtZW50cy9yb3V0ZXIvcG4tcm91dGUuanMnKTtcbnJlcXVpcmUoJy4vZWxlbWVudHMvcm91dGVyL3BuLXJvdXRlci5qcycpO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9mYWtlX2Q1MjRiYmM5LmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIHBvbHltZXJOYXRpdmVPYmplY3RJZCA9IDA7XG5cbnZhciB1dGlscyA9IHtcblxuICAgIGRyb3BJZDogZnVuY3Rpb24gKCkge1xuICAgICAgICBwb2x5bWVyTmF0aXZlT2JqZWN0SWQgPSAwO1xuICAgIH0sXG5cbiAgICBnZXROZXh0SWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHBvbHltZXJOYXRpdmVPYmplY3RJZCsrICsgJyc7XG4gICAgfSxcblxuICAgIGdldEVsZW1lbnRQcm9wZXJ0aWVzOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICB2YXIgaWQgPSBlbGVtZW50LnBvbHltZXJOYXRpdmUuaWQ7XG4gICAgICAgIHZhciB0YWdOYW1lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2lzJykgfHwgZWxlbWVudC50YWdOYW1lO1xuICAgICAgICB2YXIgcGFyZW50ID0gZWxlbWVudC5nZXRQTlBhcmVudCAmJiBlbGVtZW50LmdldFBOUGFyZW50KCk7XG4gICAgICAgIHZhciBwYXJlbnRJZCA9IHBhcmVudCA/IHBhcmVudC5wb2x5bWVyTmF0aXZlLmlkIDogbnVsbDtcbiAgICAgICAgdmFyIGJvdW5kcyA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpO1xuICAgICAgICB2YXIgdGV4dCA9IGVsZW1lbnQudGV4dENvbnRlbnQucmVwbGFjZSgvXFxzezIsfS9nLCcnKTtcbiAgICAgICAgdmFyIHNyYyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdzcmMnKTtcbiAgICAgICAgdmFyIHZhbHVlID0gZWxlbWVudC52YWx1ZTtcbiAgICAgICAgdmFyIHBsYWNlaG9sZGVyID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJyk7XG4gICAgICAgIHZhciBhdHRyaWJ1dGVzID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50LmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVOYW1lID0gZWxlbWVudC5hdHRyaWJ1dGVzW2ldLm5hbWU7XG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlTmFtZSAhPT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZSA9IGVsZW1lbnQuYXR0cmlidXRlc1tpXS52YWx1ZTtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdID0gYXR0cmlidXRlVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnVXBkYXRpbmcgJyArIGVsZW1lbnQudGFnTmFtZSArICcsIGlkPScgKyBpZCArICcsIHRvICcgKyAocGFyZW50ID8gcGFyZW50LnRhZ05hbWUgOiAncm9vdCcpICsgJyAnICsgcGFyZW50SWQgKyAnLCBzaXplPScgKyBib3VuZHMud2lkdGggKyAneCcgKyBib3VuZHMuaGVpZ2h0KTtcblxuICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50Qm91bmRzID0gcGFyZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgYm91bmRzID0ge1xuICAgICAgICAgICAgICAgIHdpZHRoOiBib3VuZHMud2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBib3VuZHMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgIGxlZnQ6IGJvdW5kcy5sZWZ0IC0gcGFyZW50Qm91bmRzLmxlZnQsXG4gICAgICAgICAgICAgICAgdG9wOiBib3VuZHMudG9wIC0gcGFyZW50Qm91bmRzLnRvcFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICAgICAgICBib3VuZHM6IGJvdW5kcyxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMsXG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IHN0eWxlLmRpc3BsYXksXG4gICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogc3R5bGUudmlzaWJpbGl0eSxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHN0eWxlLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2U6IHN0eWxlLmJhY2tncm91bmRJbWFnZSA9PT0gJ25vbmUnID8gdW5kZWZpbmVkIDogc3R5bGUuYmFja2dyb3VuZEltYWdlLnJlcGxhY2UoJ3VybCgnLCcnKS5yZXBsYWNlKCcpJywnJyksXG4gICAgICAgICAgICAgICAgZm9udFNpemU6IHN0eWxlLmZvbnRTaXplLFxuICAgICAgICAgICAgICAgIGNvbG9yOiBzdHlsZS5jb2xvcixcbiAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IHN0eWxlLmJvcmRlclJhZGl1cyxcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogc3R5bGUuYm9yZGVyQ29sb3IsXG4gICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IHN0eWxlLmJvcmRlcldpZHRoLFxuICAgICAgICAgICAgICAgIHRleHRBbGlnbjogc3R5bGUudGV4dEFsaWduXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGV4dDogdGV4dCxcbiAgICAgICAgICAgIHNyYzogc3JjLFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IHBsYWNlaG9sZGVyLFxuICAgICAgICAgICAgcGFyZW50SWQ6IHBhcmVudElkXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0RWxlbWVudEJ5SWQ6IGZ1bmN0aW9uIChlbGVtZW50SWQpIHtcbiAgICAgICAgcmV0dXJuIHBvbHltZXJOYXRpdmVDbGllbnQuZWxlbWVudHNbZWxlbWVudElkXTtcbiAgICB9LFxuXG4gICAgY2FsbE1ldGhvZDogZnVuY3Rpb24gKGVsZW1lbnRJZCwgbWV0aG9kTmFtZSwgYXJndW1lbnQpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC51dGlscy5nZXRFbGVtZW50QnlJZChlbGVtZW50SWQpO1xuICAgICAgICBlbGVtZW50W21ldGhvZE5hbWVdLmNhbGwoZWxlbWVudCwgYXJndW1lbnQpO1xuICAgIH0sXG5cbiAgICBkaXNwYXRjaEV2ZW50OiBmdW5jdGlvbiAoZWxlbWVudElkLCBldmVudE5hbWUsIGRhdGEpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC51dGlscy5nZXRFbGVtZW50QnlJZChlbGVtZW50SWQpO1xuICAgICAgICB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC51dGlscy5maXJlRXZlbnQoZWxlbWVudCwgZXZlbnROYW1lKTtcbiAgICB9LFxuXG4gICAgZmlyZUV2ZW50OiBmdW5jdGlvbiAobm9kZSwgZXZlbnROYW1lKSB7XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSB1c2UgdGhlIG93bmVyRG9jdW1lbnQgZnJvbSB0aGUgcHJvdmlkZWQgbm9kZSB0byBhdm9pZCBjcm9zcy13aW5kb3cgcHJvYmxlbXNcbiAgICAgICAgdmFyIGRvYztcbiAgICAgICAgaWYgKG5vZGUub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgZG9jID0gbm9kZS5vd25lckRvY3VtZW50O1xuICAgICAgICB9IGVsc2UgaWYgKG5vZGUubm9kZVR5cGUgPT0gOSkge1xuICAgICAgICAgICAgLy8gdGhlIG5vZGUgbWF5IGJlIHRoZSBkb2N1bWVudCBpdHNlbGYsIG5vZGVUeXBlIDkgPSBET0NVTUVOVF9OT0RFXG4gICAgICAgICAgICBkb2MgPSBub2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBub2RlIHBhc3NlZCB0byBmaXJlRXZlbnQ6IFwiICsgbm9kZS5pZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZS5kaXNwYXRjaEV2ZW50KSB7XG4gICAgICAgICAgICAvLyBHZWNrby1zdHlsZSBhcHByb2FjaCAobm93IHRoZSBzdGFuZGFyZCkgdGFrZXMgbW9yZSB3b3JrXG4gICAgICAgICAgICB2YXIgZXZlbnRDbGFzcyA9IFwiXCI7XG5cbiAgICAgICAgICAgIC8vIERpZmZlcmVudCBldmVudHMgaGF2ZSBkaWZmZXJlbnQgZXZlbnQgY2xhc3Nlcy5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgc3dpdGNoIHN0YXRlbWVudCBjYW4ndCBtYXAgYW4gZXZlbnROYW1lIHRvIGFuIGV2ZW50Q2xhc3MsXG4gICAgICAgICAgICAvLyB0aGUgZXZlbnQgZmlyaW5nIGlzIGdvaW5nIHRvIGZhaWwuXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJjbGlja1wiOiAvLyBEaXNwYXRjaGluZyBvZiAnY2xpY2snIGFwcGVhcnMgdG8gbm90IHdvcmsgY29ycmVjdGx5IGluIFNhZmFyaS4gVXNlICdtb3VzZWRvd24nIG9yICdtb3VzZXVwJyBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgIGNhc2UgXCJtb3VzZWRvd25cIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwibW91c2V1cFwiOlxuICAgICAgICAgICAgICAgICAgICBldmVudENsYXNzID0gXCJNb3VzZUV2ZW50c1wiO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgXCJmb2N1c1wiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJjaGFuZ2VcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiYmx1clwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJzZWxlY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRDbGFzcyA9IFwiSFRNTEV2ZW50c1wiO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiZmlyZUV2ZW50OiBDb3VsZG4ndCBmaW5kIGFuIGV2ZW50IGNsYXNzIGZvciBldmVudCAnXCIgKyBldmVudE5hbWUgKyBcIicuXCI7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGV2ZW50ID0gZG9jLmNyZWF0ZUV2ZW50KGV2ZW50Q2xhc3MpO1xuICAgICAgICAgICAgZXZlbnQuaW5pdEV2ZW50KGV2ZW50TmFtZSwgdHJ1ZSwgdHJ1ZSk7IC8vIEFsbCBldmVudHMgY3JlYXRlZCBhcyBidWJibGluZyBhbmQgY2FuY2VsYWJsZS5cblxuICAgICAgICAgICAgZXZlbnQuc3ludGhldGljID0gdHJ1ZTsgLy8gYWxsb3cgZGV0ZWN0aW9uIG9mIHN5bnRoZXRpYyBldmVudHNcbiAgICAgICAgICAgIC8vIFRoZSBzZWNvbmQgcGFyYW1ldGVyIHNheXMgZ28gYWhlYWQgd2l0aCB0aGUgZGVmYXVsdCBhY3Rpb25cbiAgICAgICAgICAgIG5vZGUuZGlzcGF0Y2hFdmVudChldmVudCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5maXJlRXZlbnQpIHtcbiAgICAgICAgICAgIC8vIElFLW9sZCBzY2hvb2wgc3R5bGVcbiAgICAgICAgICAgIHZhciBldmVudCA9IGRvYy5jcmVhdGVFdmVudE9iamVjdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3ludGhldGljID0gdHJ1ZTsgLy8gYWxsb3cgZGV0ZWN0aW9uIG9mIHN5bnRoZXRpYyBldmVudHNcbiAgICAgICAgICAgIG5vZGUuZmlyZUV2ZW50KFwib25cIiArIGV2ZW50TmFtZSwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICByZWdpc3RlcjogZnVuY3Rpb24gKG5hbWUsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgdmFyIHRhZ05hbWUgPSAnbmF0aXZlLScgKyBuYW1lO1xuICAgICAgICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQodGFnTmFtZSwgcHJvcGVydGllcyk7XG4gICAgfVxufTtcblxud2luZG93LnBvbHltZXJOYXRpdmVDbGllbnQgPSB3aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudCB8fCB7fTtcbndpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50LnV0aWxzID0gdXRpbHM7XG53aW5kb3cucG9seW1lck5hdGl2ZUNsaWVudC5kaXNwYXRjaEV2ZW50ID0gdXRpbHMuZGlzcGF0Y2hFdmVudDtcbndpbmRvdy5wb2x5bWVyTmF0aXZlQ2xpZW50LmNhbGxNZXRob2QgPSB1dGlscy5jYWxsTWV0aG9kO1xuXG5pZiAod2luZG93LnBvbHltZXJOYXRpdmVIb3N0KSB7XG4gICAgd2luZG93LmFsZXJ0ID0gcG9seW1lck5hdGl2ZUhvc3QuYWxlcnQ7XG4gICAgd2luZG93LmNvbnNvbGUubG9nID0gcG9seW1lck5hdGl2ZUhvc3QubG9nO1xufVxuXG5cbmlmICh0eXBlb2YgT2JqZWN0LmFzc2lnbiAhPSAnZnVuY3Rpb24nKSB7XG4gICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbiA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCB8fCB0YXJnZXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG91dHB1dCA9IE9iamVjdCh0YXJnZXQpO1xuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQgJiYgc291cmNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG5leHRLZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KG5leHRLZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0W25leHRLZXldID0gc291cmNlW25leHRLZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfTtcbiAgICB9KSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJrbTRVbWZcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9wbi11dGlscy5qc1wiLFwiL1wiKSJdfQ==

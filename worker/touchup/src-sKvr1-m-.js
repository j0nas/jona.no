["open", "published", "resolved", "dismissed", "folded"].filter((s) => s !== "published");
// ../shared/src/page.ts
/** Query parameters that say where a visitor came from rather than what they're looking at. */
const TRACKING = /^(utm_[a-z]+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid)$/;
/**
 * The page an item belongs to: path and query, without tracking parameters and the hash. In a
 * single-page app this is the route, so notes stay with the route they were written on.
 */
function pageKey(url) {
  const params = new URLSearchParams(url.search);
  for (const key of new Set(params.keys())) if (TRACKING.test(key)) params.delete(key);
  const search = params.toString();
  return url.pathname + (search ? `?${search}` : "");
}
/** Where the server keeps an uploaded photo: size "s" fits 900 px, "l" fits 2000 px. */
const photoUrl = (api, project, name, size) => `${api}/f/${project}/${name}-${size}.jpg`;
// ../shared/src/edits.ts
/** The data-edit id a block added by an edit gets. Its caption, if a photo, is "<id>/cap". */
const blockId = (editId) => `new/${editId}`;
/**
 * Folds a page's live edits, oldest first, into one state; later edits win. `carries` says
 * whether any element on the page has a field ref; without it, every ref is taken to be there.
 */
function reduce(edits, carries = () => true) {
  const s = {
    text: /* @__PURE__ */ new Map(),
    fields: /* @__PURE__ */ new Map(),
    photo: /* @__PURE__ */ new Map(),
    removed: /* @__PURE__ */ new Set(),
    after: /* @__PURE__ */ new Map(),
    blocks: /* @__PURE__ */ new Map(),
    loose: [],
  };
  for (const e of edits) {
    const id = e.anchor.editId;
    const c = e.change;
    if (c.kind === "text" && e.anchor.field && carries(e.anchor.field)) {
      s.fields.delete(e.anchor.field);
      s.fields.set(e.anchor.field, c.text);
      continue;
    }
    if (!id) {
      if (c.kind === "text") s.loose.push(e);
      continue;
    }
    if (c.kind === "text") s.text.set(id, c.text);
    else if (c.kind === "photo") s.photo.set(id, c.photo);
    else if (c.kind === "remove") s.removed.add(id);
    else if (c.kind === "insert" && BLOCKS.has(c.block?.type)) {
      const added = blockId(e.id);
      s.blocks.set(added, c.block);
      s.after.set(id, [added, ...(s.after.get(id) ?? [])]);
    }
  }
  return s;
}
const BLOCKS = /* @__PURE__ */ new Set(["p", "li", "shot"]);
/**
 * The blocks that follow an element, in page order, each followed by its own followers. Edit ids
 * are the widget's own, so blocks can be made to follow each other in a ring; each is taken once.
 */
function following(id, s, seen = /* @__PURE__ */ new Set([id])) {
  return (s.after.get(id) ?? []).flatMap((next) => {
    if (seen.has(next)) return [];
    seen.add(next);
    return [next, ...following(next, s, seen)];
  });
}
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/common/unicode.js
const UNDEFINED_CODE_POINTS = /* @__PURE__ */ new Set([
  65534, 65535, 131070, 131071, 196606, 196607, 262142, 262143, 327678, 327679, 393214, 393215,
  458750, 458751, 524286, 524287, 589822, 589823, 655358, 655359, 720894, 720895, 786430, 786431,
  851966, 851967, 917502, 917503, 983038, 983039, 1048574, 1048575, 1114110, 1114111,
]);
var CODE_POINTS;
(function (CODE_POINTS) {
  CODE_POINTS[(CODE_POINTS["EOF"] = -1)] = "EOF";
  CODE_POINTS[(CODE_POINTS["NULL"] = 0)] = "NULL";
  CODE_POINTS[(CODE_POINTS["TABULATION"] = 9)] = "TABULATION";
  CODE_POINTS[(CODE_POINTS["CARRIAGE_RETURN"] = 13)] = "CARRIAGE_RETURN";
  CODE_POINTS[(CODE_POINTS["LINE_FEED"] = 10)] = "LINE_FEED";
  CODE_POINTS[(CODE_POINTS["FORM_FEED"] = 12)] = "FORM_FEED";
  CODE_POINTS[(CODE_POINTS["SPACE"] = 32)] = "SPACE";
  CODE_POINTS[(CODE_POINTS["EXCLAMATION_MARK"] = 33)] = "EXCLAMATION_MARK";
  CODE_POINTS[(CODE_POINTS["QUOTATION_MARK"] = 34)] = "QUOTATION_MARK";
  CODE_POINTS[(CODE_POINTS["AMPERSAND"] = 38)] = "AMPERSAND";
  CODE_POINTS[(CODE_POINTS["APOSTROPHE"] = 39)] = "APOSTROPHE";
  CODE_POINTS[(CODE_POINTS["HYPHEN_MINUS"] = 45)] = "HYPHEN_MINUS";
  CODE_POINTS[(CODE_POINTS["SOLIDUS"] = 47)] = "SOLIDUS";
  CODE_POINTS[(CODE_POINTS["DIGIT_0"] = 48)] = "DIGIT_0";
  CODE_POINTS[(CODE_POINTS["DIGIT_9"] = 57)] = "DIGIT_9";
  CODE_POINTS[(CODE_POINTS["SEMICOLON"] = 59)] = "SEMICOLON";
  CODE_POINTS[(CODE_POINTS["LESS_THAN_SIGN"] = 60)] = "LESS_THAN_SIGN";
  CODE_POINTS[(CODE_POINTS["EQUALS_SIGN"] = 61)] = "EQUALS_SIGN";
  CODE_POINTS[(CODE_POINTS["GREATER_THAN_SIGN"] = 62)] = "GREATER_THAN_SIGN";
  CODE_POINTS[(CODE_POINTS["QUESTION_MARK"] = 63)] = "QUESTION_MARK";
  CODE_POINTS[(CODE_POINTS["LATIN_CAPITAL_A"] = 65)] = "LATIN_CAPITAL_A";
  CODE_POINTS[(CODE_POINTS["LATIN_CAPITAL_Z"] = 90)] = "LATIN_CAPITAL_Z";
  CODE_POINTS[(CODE_POINTS["RIGHT_SQUARE_BRACKET"] = 93)] = "RIGHT_SQUARE_BRACKET";
  CODE_POINTS[(CODE_POINTS["GRAVE_ACCENT"] = 96)] = "GRAVE_ACCENT";
  CODE_POINTS[(CODE_POINTS["LATIN_SMALL_A"] = 97)] = "LATIN_SMALL_A";
  CODE_POINTS[(CODE_POINTS["LATIN_SMALL_Z"] = 122)] = "LATIN_SMALL_Z";
})(CODE_POINTS || (CODE_POINTS = {}));
const SEQUENCES = {
  DASH_DASH: "--",
  CDATA_START: "[CDATA[",
  DOCTYPE: "doctype",
  SCRIPT: "script",
  PUBLIC: "public",
  SYSTEM: "system",
};
function isSurrogate(cp) {
  return cp >= 55296 && cp <= 57343;
}
function isSurrogatePair(cp) {
  return cp >= 56320 && cp <= 57343;
}
function getSurrogatePairCodePoint(cp1, cp2) {
  return (cp1 - 55296) * 1024 + 9216 + cp2;
}
function isControlCodePoint(cp) {
  return (
    (cp !== 32 && cp !== 10 && cp !== 13 && cp !== 9 && cp !== 12 && cp >= 1 && cp <= 31) ||
    (cp >= 127 && cp <= 159)
  );
}
function isUndefinedCodePoint(cp) {
  return (cp >= 64976 && cp <= 65007) || UNDEFINED_CODE_POINTS.has(cp);
}
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/common/error-codes.js
var ERR;
(function (ERR) {
  ERR["controlCharacterInInputStream"] = "control-character-in-input-stream";
  ERR["noncharacterInInputStream"] = "noncharacter-in-input-stream";
  ERR["surrogateInInputStream"] = "surrogate-in-input-stream";
  ERR["nonVoidHtmlElementStartTagWithTrailingSolidus"] =
    "non-void-html-element-start-tag-with-trailing-solidus";
  ERR["endTagWithAttributes"] = "end-tag-with-attributes";
  ERR["endTagWithTrailingSolidus"] = "end-tag-with-trailing-solidus";
  ERR["unexpectedSolidusInTag"] = "unexpected-solidus-in-tag";
  ERR["unexpectedNullCharacter"] = "unexpected-null-character";
  ERR["unexpectedQuestionMarkInsteadOfTagName"] = "unexpected-question-mark-instead-of-tag-name";
  ERR["invalidFirstCharacterOfTagName"] = "invalid-first-character-of-tag-name";
  ERR["unexpectedEqualsSignBeforeAttributeName"] = "unexpected-equals-sign-before-attribute-name";
  ERR["missingEndTagName"] = "missing-end-tag-name";
  ERR["unexpectedCharacterInAttributeName"] = "unexpected-character-in-attribute-name";
  ERR["unknownNamedCharacterReference"] = "unknown-named-character-reference";
  ERR["missingSemicolonAfterCharacterReference"] = "missing-semicolon-after-character-reference";
  ERR["unexpectedCharacterAfterDoctypeSystemIdentifier"] =
    "unexpected-character-after-doctype-system-identifier";
  ERR["unexpectedCharacterInUnquotedAttributeValue"] =
    "unexpected-character-in-unquoted-attribute-value";
  ERR["eofBeforeTagName"] = "eof-before-tag-name";
  ERR["eofInTag"] = "eof-in-tag";
  ERR["missingAttributeValue"] = "missing-attribute-value";
  ERR["missingWhitespaceBetweenAttributes"] = "missing-whitespace-between-attributes";
  ERR["missingWhitespaceAfterDoctypePublicKeyword"] =
    "missing-whitespace-after-doctype-public-keyword";
  ERR["missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers"] =
    "missing-whitespace-between-doctype-public-and-system-identifiers";
  ERR["missingWhitespaceAfterDoctypeSystemKeyword"] =
    "missing-whitespace-after-doctype-system-keyword";
  ERR["missingQuoteBeforeDoctypePublicIdentifier"] =
    "missing-quote-before-doctype-public-identifier";
  ERR["missingQuoteBeforeDoctypeSystemIdentifier"] =
    "missing-quote-before-doctype-system-identifier";
  ERR["missingDoctypePublicIdentifier"] = "missing-doctype-public-identifier";
  ERR["missingDoctypeSystemIdentifier"] = "missing-doctype-system-identifier";
  ERR["abruptDoctypePublicIdentifier"] = "abrupt-doctype-public-identifier";
  ERR["abruptDoctypeSystemIdentifier"] = "abrupt-doctype-system-identifier";
  ERR["cdataInHtmlContent"] = "cdata-in-html-content";
  ERR["incorrectlyOpenedComment"] = "incorrectly-opened-comment";
  ERR["eofInScriptHtmlCommentLikeText"] = "eof-in-script-html-comment-like-text";
  ERR["eofInDoctype"] = "eof-in-doctype";
  ERR["nestedComment"] = "nested-comment";
  ERR["abruptClosingOfEmptyComment"] = "abrupt-closing-of-empty-comment";
  ERR["eofInComment"] = "eof-in-comment";
  ERR["incorrectlyClosedComment"] = "incorrectly-closed-comment";
  ERR["eofInCdata"] = "eof-in-cdata";
  ERR["absenceOfDigitsInNumericCharacterReference"] =
    "absence-of-digits-in-numeric-character-reference";
  ERR["nullCharacterReference"] = "null-character-reference";
  ERR["surrogateCharacterReference"] = "surrogate-character-reference";
  ERR["characterReferenceOutsideUnicodeRange"] = "character-reference-outside-unicode-range";
  ERR["controlCharacterReference"] = "control-character-reference";
  ERR["noncharacterCharacterReference"] = "noncharacter-character-reference";
  ERR["missingWhitespaceBeforeDoctypeName"] = "missing-whitespace-before-doctype-name";
  ERR["missingDoctypeName"] = "missing-doctype-name";
  ERR["invalidCharacterSequenceAfterDoctypeName"] = "invalid-character-sequence-after-doctype-name";
  ERR["duplicateAttribute"] = "duplicate-attribute";
  ERR["nonConformingDoctype"] = "non-conforming-doctype";
  ERR["missingDoctype"] = "missing-doctype";
  ERR["misplacedDoctype"] = "misplaced-doctype";
  ERR["endTagWithoutMatchingOpenElement"] = "end-tag-without-matching-open-element";
  ERR["closingOfElementWithOpenChildElements"] = "closing-of-element-with-open-child-elements";
  ERR["disallowedContentInNoscriptInHead"] = "disallowed-content-in-noscript-in-head";
  ERR["openElementsLeftAfterEof"] = "open-elements-left-after-eof";
  ERR["abandonedHeadElementChild"] = "abandoned-head-element-child";
  ERR["misplacedStartTagForHeadElement"] = "misplaced-start-tag-for-head-element";
  ERR["nestedNoscriptInHead"] = "nested-noscript-in-head";
  ERR["eofInElementThatCanContainOnlyText"] = "eof-in-element-that-can-contain-only-text";
})(ERR || (ERR = {}));
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/tokenizer/preprocessor.js
const DEFAULT_BUFFER_WATERLINE = 65536;
var Preprocessor = class {
  constructor(handler) {
    this.handler = handler;
    this.html = "";
    this.pos = -1;
    this.lastGapPos = -2;
    this.gapStack = [];
    this.skipNextNewLine = false;
    this.lastChunkWritten = false;
    this.endOfChunkHit = false;
    this.bufferWaterline = DEFAULT_BUFFER_WATERLINE;
    this.isEol = false;
    this.lineStartPos = 0;
    this.droppedBufferSize = 0;
    this.line = 1;
    this.lastErrOffset = -1;
  }
  /** The column on the current line. If we just saw a gap (eg. a surrogate pair), return the index before. */
  get col() {
    return this.pos - this.lineStartPos + Number(this.lastGapPos !== this.pos);
  }
  /** The index in `html` at which the current code point starts (the high surrogate of a pair). */
  get codePointStart() {
    return this.pos - Number(this.lastGapPos === this.pos);
  }
  /** The offset of the current code point, before the second unit of a surrogate pair. */
  get offset() {
    return this.droppedBufferSize + this.codePointStart;
  }
  getError(code, cpOffset) {
    const { line, col, offset } = this;
    const startCol = col + cpOffset;
    const startOffset = offset + cpOffset;
    return {
      code,
      startLine: line,
      endLine: line,
      startCol,
      endCol: startCol,
      startOffset,
      endOffset: startOffset,
    };
  }
  _err(code) {
    if (this.handler.onParseError && this.lastErrOffset !== this.offset) {
      this.lastErrOffset = this.offset;
      this.handler.onParseError(this.getError(code, 0));
    }
  }
  _addGap() {
    this.gapStack.push(this.lastGapPos);
    this.lastGapPos = this.pos;
  }
  _processSurrogate(cp) {
    if (this.pos !== this.html.length - 1) {
      const nextCp = this.html.charCodeAt(this.pos + 1);
      if (isSurrogatePair(nextCp)) {
        this.pos++;
        this._addGap();
        return getSurrogatePairCodePoint(cp, nextCp);
      }
    } else if (!this.lastChunkWritten) {
      this.endOfChunkHit = true;
      return CODE_POINTS.EOF;
    }
    this._err(ERR.surrogateInInputStream);
    return cp;
  }
  willDropParsedChunk() {
    return this.pos > this.bufferWaterline;
  }
  dropParsedChunk() {
    if (this.willDropParsedChunk()) {
      const droppedSize = this.offset - this.droppedBufferSize;
      this.html = this.html.substring(droppedSize);
      this.lineStartPos -= droppedSize;
      this.droppedBufferSize += droppedSize;
      this.pos -= droppedSize;
      this.lastGapPos = -2;
      this.gapStack.length = 0;
      if (this.pos > 0) this._addGap();
    }
  }
  write(chunk, isLastChunk) {
    if (this.html.length > 0) this.html += chunk;
    else this.html = chunk;
    this.endOfChunkHit = false;
    this.lastChunkWritten = isLastChunk;
  }
  insertHtmlAtCurrentPos(chunk) {
    this.html = this.html.substring(0, this.pos + 1) + chunk + this.html.substring(this.pos + 1);
    this.endOfChunkHit = false;
  }
  startsWith(pattern, caseSensitive) {
    if (this.pos + pattern.length > this.html.length) {
      this.endOfChunkHit = !this.lastChunkWritten;
      return false;
    }
    if (caseSensitive) return this.html.startsWith(pattern, this.pos);
    for (let i = 0; i < pattern.length; i++)
      if ((this.html.charCodeAt(this.pos + i) | 32) !== pattern.charCodeAt(i)) return false;
    return true;
  }
  peek(offset) {
    const pos = this.pos + offset;
    if (pos >= this.html.length) {
      this.endOfChunkHit = !this.lastChunkWritten;
      return CODE_POINTS.EOF;
    }
    const code = this.html.charCodeAt(pos);
    return code === CODE_POINTS.CARRIAGE_RETURN ? CODE_POINTS.LINE_FEED : code;
  }
  advance() {
    this.pos++;
    if (this.isEol) {
      this.isEol = false;
      this.line++;
      this.lineStartPos = this.pos;
    }
    if (this.pos >= this.html.length) {
      this.endOfChunkHit = !this.lastChunkWritten;
      return CODE_POINTS.EOF;
    }
    let cp = this.html.charCodeAt(this.pos);
    if (cp === CODE_POINTS.CARRIAGE_RETURN) {
      this.isEol = true;
      this.skipNextNewLine = true;
      return CODE_POINTS.LINE_FEED;
    }
    if (cp === CODE_POINTS.LINE_FEED) {
      this.isEol = true;
      if (this.skipNextNewLine) {
        this.line--;
        this.skipNextNewLine = false;
        this._addGap();
        return this.advance();
      }
    }
    this.skipNextNewLine = false;
    if (isSurrogate(cp)) cp = this._processSurrogate(cp);
    if (
      !(
        this.handler.onParseError === null ||
        (cp > 31 && cp < 127) ||
        cp === CODE_POINTS.LINE_FEED ||
        cp === CODE_POINTS.CARRIAGE_RETURN ||
        (cp > 159 && cp < 64976)
      )
    )
      this._checkForProblematicCharacters(cp);
    return cp;
  }
  _checkForProblematicCharacters(cp) {
    if (isControlCodePoint(cp)) this._err(ERR.controlCharacterInInputStream);
    else if (isUndefinedCodePoint(cp)) this._err(ERR.noncharacterInInputStream);
  }
  retreat(count) {
    this.pos -= count;
    while (this.pos < this.lastGapPos) {
      this.lastGapPos = this.gapStack.pop();
      this.pos--;
    }
    this.isEol = false;
  }
};
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/common/token.js
var TokenType;
(function (TokenType) {
  TokenType[(TokenType["CHARACTER"] = 0)] = "CHARACTER";
  TokenType[(TokenType["NULL_CHARACTER"] = 1)] = "NULL_CHARACTER";
  TokenType[(TokenType["WHITESPACE_CHARACTER"] = 2)] = "WHITESPACE_CHARACTER";
  TokenType[(TokenType["START_TAG"] = 3)] = "START_TAG";
  TokenType[(TokenType["END_TAG"] = 4)] = "END_TAG";
  TokenType[(TokenType["COMMENT"] = 5)] = "COMMENT";
  TokenType[(TokenType["DOCTYPE"] = 6)] = "DOCTYPE";
  TokenType[(TokenType["EOF"] = 7)] = "EOF";
  TokenType[(TokenType["HIBERNATION"] = 8)] = "HIBERNATION";
})(TokenType || (TokenType = {}));
function getTokenAttr(token, attrName) {
  for (let i = token.attrs.length - 1; i >= 0; i--)
    if (token.attrs[i].name === attrName) return token.attrs[i].value;
  return null;
}
// ../../node_modules/.pnpm/entities@9.0.0/node_modules/entities/dist/decode-codepoint.js
/**
 * C1 Unicode control character reference replacements (code points 128-159).
 * Index i gives the replacement for code point 128+i; 0 means "no replacement".
 */
const c1 = [
  8364, 0, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 0, 381, 0, 0, 8216, 8217,
  8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 0, 382, 376,
];
/**
 * True for NUL, UTF-16 surrogates, and values past U+10FFFF.
 * @param codePoint Unicode code point to check.
 */
function isInvalidCodePoint(codePoint) {
  return codePoint === 0 || (codePoint >= 55296 && codePoint <= 57343) || codePoint > 1114111;
}
/**
 * Replace the given code point with U+FFFD if it is NUL (0), a surrogate, or
 * outside the valid Unicode range. Code points in the C1 controls range
 * (128-159) are remapped to their Windows-1252 equivalents, following the
 * HTML spec. All other code points are returned unchanged.
 * @param codePoint Unicode code point to convert.
 */
function replaceCodePoint(codePoint) {
  if (isInvalidCodePoint(codePoint)) return 65533;
  if (codePoint >= 128 && codePoint <= 159) return c1[codePoint - 128] || codePoint;
  return codePoint;
}
// ../../node_modules/.pnpm/entities@9.0.0/node_modules/entities/dist/generated/decode-data-html.js
/**
 * Serialized decode data; the format is documented in
 * `src/internal/decode-data-format.ts`. `[0]` is one-byte data (all char
 * codes <= 0xFF: header, front-coded name suffixes, per-name metadata,
 * cuckoo choice bits); `[1]` holds the replacement values.
 */
const htmlDecodeData = [
  "Q=¨`p0AEligMPacutebrevecircyfrgravelphamacrndogonpfpplyFunctionringscrsigntildeumlBackslashrvwedcyecausernoullistafropfrevescrumpeqCHcyOPYacutepitalDifferentialDyleyscaronedilirconintdotedillanterDotfrhiircleDotMinusPlusTimeslockwiseContourIntegralseCurlyDoubleQuoteQuoteolonengruentinttourIntegralpfroductunterClockwiseContourIntegralrossscrupCapDDotrahdJcyScyZcyaggerrrshvcaronyeltafriacriticalAcuteDotubleAcuteGraveTildemondfferentialDopftDotEqualubleContourIntegralDotwnArrowLeftArrowRightArrowTeeongLeftArrowRightArrowRightArrowRightArrowTeeUpArrowDownArrowVerticalBarwnArrowBarUpArrowBreveLeftRightVectorTeeVectorVectorBarRightTeeVectorVectorBarTeeArrowarrowscrtrokENGTHacutecaronircydotfrgravelementmacrptySmallSquareVerySmallSquareogonpfpsilonqualTildeilibriumscrimtaumlxistsponentialEFcyfrilledSmallSquareVerySmallSquareopfrAlluriertrfscrGJcyTammadbrevecedilircydotfrgopfreaterEqualLessFullEqualGreaterLessSlantEqualTildescrtHARDcyacektcircfrilbertSpaceopfrizontalLinescrtrokumpDownHumpEqualIEcyJligOcyacutecircydotfrgravemacrginaryIpliesntegralrsectionvisibleCommaTimesogonpftascrtildeukcymlJcircyfropfscrercyukcyKHcyJcyappacedilyfropfscrLJcyTacutembdangplacetrfrrcaronedilyeftAngleBracketrrowBarRightArrowCeilingDoubleBracketwnTeeVectorVectorBarFloorRightArrowVectorTeeArrowVectorriangleBarEqualUpDownVectorTeeVectorVectorBarVectorBararrowrightarrowssEqualGreaterFullEqualGreaterLessSlantEqualTildefrleftarrowmidotongLeftArrowRightArrowRightArrowleftarrowrightarrowrightarrowpfwerLeftArrowRightArrowscrhtroktMapcyediumSpacellintrffrinusPlusopfscruNJcyacutecaronedilyegativeMediumSpaceThickSpacenSpaceVeryThinSpacestedGreaterGreaterLessLesswLinefroBreaknBreakingSpacepftCongruentupCapDoubleVerticalBarElementqualTildexistsGreaterEqualFullEqualGreaterLessSlantEqualTildeHumpDownHumpEqualLeftTriangleBarEqualssEqualGreaterLessSlantEqualTildeNestedGreaterGreaterLessLessPrecedesEqualSlantEqualReverseElementightTriangleBarEqualSquareSubsetEqualpersetEqualubsetEqualcceedsEqualSlantEqualTildepersetEqualTildeEqualFullEqualTildeVerticalBarscrtildeuOEligacutecircydblacfrgravemacregaicronopfpenCurlyDoubleQuoteQuoterscrlashtildemesumlverBarraceketParenthesisPartialDcyfrhiilusMinusoincareplanepfrecedesEqualSlantEqualTildeimeoductportionalscriQUOTfropfscrRBarrEGacutengrrtlcaronedilyeverseElementquilibriumUpEquilibriumfrhoightAngleBracketrrowBarLeftArrowCeilingDoubleBracketwnTeeVectorVectorBarFloorTeeArrowVectorriangleBarEqualUpDownVectorTeeVectorVectorBarVectorBararrowopfundImpliesrightarrowscrhuleDelayedSHCHcycyOFTcyacutecaronedilircyfrhortDownArrowLeftArrowRightArrowUpArrowigmamallCircleopfqrtuareIntersectionSubsetEqualpersetEqualUnionscrtarubsetEqualcceedsEqualSlantEqualTildehThatmpersetEqualsetTHORNRADESHcycyabucaronedilyfrhereforetaickSpacenSpaceildeEqualFullEqualTildeopfripleDotscrtrokUacuterrocirbrcyevecircydblacfrgravemacrnderBarraceketParenthesisionPlusogonpfpArrowBarDownArrowDownArrowEquilibriumTeeArrowarrowdownarrowperLeftArrowRightArrowsilonringscrtildeumlVDashbarcydashleerbarticalBarLineSeparatorTildeyThinSpacefropfscrvdashWcircedgefropfscrXfriopfscrYAcyIcyUcyacutecircyfropfscrumlZHcyacutecaronydoteroWidthSpacetafropfscraacutebrevecEdircuteyeligfrgravelefsymphphamacrlgpndanddslopevgelemsdaabcdefghrtvbdsphtzarrogonpfpEacireidosproxeqringscrtympeqtildeumlwconintintbNotackcongepsilonprimesimeqrveewedgebrktbrkcongydquoecausemptyvpsirnoutahweenfrigcapircupodotplustimessqcuptartriangledownupuplusveewedgekarowlacklozengesquaretriangledownleftrightnkk12434ocknequivotopfttomwtiexDLRlrHDUduULRlrVHLRhlrboxdLRlrhDUduminusplustimesuLRlrvHLRhlrprimerevevbarscremiimeolbhsubulletmpEeqcacutepandbrcupcapupdotsretoncapsronedilircupssmdotedilmptyvnterdotfrhcyeckmarkiirEceqlearrowleftrightdRSastcircdashefnintmidscirlubsuitoloneqmmatpfnlementxesngdotintpfrodysrrarrossscrubepetdotudarrlreprsclarrppbrcapcapupdotorsrarrmlyeqprecsuccveewedgerenvearrowleftrightveewedwconintintylctydArrHaraggerlethrrshvbkarowlaccaronydaggerrrotseqegltamptyvfishtrharlriamondsuitsegammasinvideontimesonxjcylcornropollarpfteqdotminusplussquareublebarwedgewnarrowdownarrowsharpoonleftrightrbkarowcornropscryoltroktdotrifuarrharwanglezcyigrarreDDototacutestercaronircolonydotefDotrgravesdotlinterslsdotmacrptysetvsp134ngspogonpfparsllussilonvqcircolonsimlantgtrlessualsestivDDvparslrDotarrscrdotimtahumlroxclistpectationonentialefallingdotseqcyemalefiligligligriligjliglatligtnsnofopfrallkvpartintrac123456823534584556878slownscrgElacutemmadpbrevecircydotelqqslantsccdotollesfrggimeljcylEajnEapproxeqqsimopfravescrimeltccirdotlParquestrapproxrrdoteqlessqlesslesssimvertneqqnEhArrairsplfmiltrdcyrcirwbarcirceartsuitlliprconfrksearowwarowoarrmthtokleftarrowrightarrowpfrbarscrlashtrokybullpheniacutecircyecyxclffrgraveiiintntnfinotajligmacrgelinepartthofpedncarefintieodottcalegersrcallarhkprodocygonpftaprodquestscrinEdotsvvtildeukcymljcircyfrmathopfscrercyukcykappavcedilyfrgreenhcyjcyopfscrlAarrrrtailBarrEgHaracuteemptyvgranmbdangdlepquorrbfsfshklpplsimtltailesbarrbrkracekkeslducaronedililubydcaquorrdharusharsheftarrowtailharpoondownupleftarrowsrightarrowsharpoonssquigarrowthreetimesgqqslantsccdotorgessapproxdoteqgtrqgtrgtrsimfishtloorrgEhardulblkjcylarrcornerhardtrimidotoustachenEapproxeqqsimoangrrbrkngleftarrowrightarrowmapstorightarrowoparrowleftrightparflustimeswastbarzengefparltrarrcornerhardmtrisaquocrhimegqbuortroktccirdothreeimeslarrquestrPariefurdsharuharvertneqqnEmDDotacrletesepstodownleftuprkercommaydasheasuredanglefrhoicrodastcirdotnusbdulcpdrnplusodelspfpscrtposultimapmapnGgtvLeftarrowrightarrowltvRightarrowVDashdashablacutengpEidosproxturalsbspumpecapronedilongdotupydasheArrarhkrowdotquivsearimxistsfrgEeqqslantssimtrhArrarrparisdvjcylArrEarrdreftarrowrightarrowqqslantsssimtriemidopftinEdotvabcnivabcparallelsltolintrcueeceqrArrarrcwightarrowtriesccueerhortmidparallelimeqmidparqsubepeubEeseteqqcceqpEeseteqqtglildelgrianglelefteqrightequmerospvDashHarrapdashgetinfinlArretrierArrtriesimwArrarhkrownearoSacutestcircydashblacivotsoldeligfcirrgonravethbarmintlarrcirrossinetmacregaicrondnusopfparerplusrarrderoffmigoforslopevscrlasholtildemesasumlvbarparallelsimltcyercntiodmilptenkfrhivmmatoneitchforkvlanckhkvusacirbcirdouemnsimtwomointintpfundrEapcueecapproxcurlyeqeqnapproxeqqsimsimimesnEapsimodfalarlinesurfptosimurelscriuncspqfrintopfprimescruaternionsintesteqotrAarrrrtailBarrHaraceutedicemptyvngdelequorrapbfscfshklpplsimtlwtailionalsbarrbrkracekkeslducaronedililubydcaldharquorshealinepartsctgfishtloorrhardulovightarrowtailharpoondownupleftarrowsharpoonsrightarrowssquigarrowthreetimesngsingdotseqlarrharmmoustachenmidoangrrbrkparflustimespargtpolintrarrsaquocrhqbuorthreeimesriefltriuluharxsacutebquocEaproncueedilircnEapsimpolintsimydotbeeArrarhkrowctmiswartminusnxtfrownharpchcyyortmidparallelyigmafvmdoteqgElEneplusrarrlarrmallsetminusshpeparslidletesoftcylbarpfpadesuitrqcapsupssubeseteqpesetequareffrarrscretmnmiletarftarfraightepsilonphinsubEdotedotmultnEeplusrarrseteqqneqqimubpccapproxcurlyeqeqnapproxeqqsimsimmngp123EdotsubedothsolublarrmultnEeplusseteqqneqqimubpwArrarhkrownwarzligtargetubrkcaronedilydotelrecfrhere4foretasymvickapproxsimnspkapsimornildemesbardntoeapbotcirforksaprimeradeiangledownlefteqqrighteqdoteminusplussbtimepeziumscryhcytrokwixtoheadleftarrowrightarrowuArrHaracuterrbrcyevecircydarrblacharfishtrgraveharlrblklcornerroptrimacrlogonpfparrowdownarrowharpoonleftrightlussihlonuparrowsrcornerropingtriscrtdotilderifuarrmlwanglevArrBarvDashangrtrepsilonkappanothingphiiroptorhosigmaubsetneqqpsetneqqthetariangleleftrightcydasheebareqlliprbartfrltrinsubpopfproprtriscrubnEepnEezigzagwcircedbargeqierpfropfpreathscrxcapircupdtrifrhArrarrilArrarrmapnisodotpflustimerArrarrscrqcupuplustriveewedgeyacuteycircyenfricyopfscrucymlzacutecaronydoteetrftafrhcyigrarropfscrwjnjC(D%D($(D'%$$ED($'$'$%$'%E$/D'$F%'D(D&#,%%&&$%$)%+%%$E$F$'$&$(#'D&$(%$&4%($(E'%&%($&$)%*$%$%$+)()')($:&5-($'($%*&&&/%%&)%@$'$F$%&&#%%)$&$&$&$(%%%&$(%$$%&%$E$2.&0,.(.(&'%.$F%$&&&(%6)&+*),---&*/1---)-.&)*+,).%*,&,*'('2+,+)1&'1,)2&'&*('($F%'#&D%D($(E&%$$&$ED($)$'%1(2$'%E$)$'((&+$&%%$%D&$(%-#&$E$3)2$F%'%+$&#'D$$'($$($(%&%$$&$E$$$F$./'*,***'*-*($F$$#)$'%$$'$%$.$&%/$&%'$.'(#'$'$&D(D'%$$&$%D($$%&&*%($%&('+%/,($'%E%%$&$($'E%#(%$$E$F$F%'$'#'$&$'$(%$$E$F$F#'D$$(%'%%%+%%$(%'%$$2(',&,-'*'0).+)1&'('-,)'&*(*)(*/&/('/),))/&')-&'('-%1','*'''-'($E$$%+$($/+-'-',+-'-%E%/(-$&%$%'$$#&$%$-%*$E$+$F$&$$#'$($(%'%$$5+-.)+0%5)+%($E$)%1%%%$&,'(&4&*''+H'(&*-(-L-J-'-M-(&O*H&/2F2((%*(***G*M*(&W,K&+.H.-&1'/3F3(&O2(.I4('H,(().H.-.H(I.(&(+(+,+(&.$FD($$#(D(D'%$$($ED($'%&%($F$6,($$$FE'D(&&D&$)('+&'.#+$%$E$%$$$+$/%%$$%)+(+-+(%&%(&*-%$F%$C'$E$&$F#(D%$(%%%%'%$(%'%$$$%/+-*0$%$%$3)'-&-,(*(0*.,)2&(((&+(+))*0&0((/*,*)0&().&(($&%-$-$&%$$-#)%%$($($$%'%'%&%$$E$0(,(-(*$'$-$F$&%')/))/(+)1()($F$&$%&&)(%)+(+-+(&(%$%$&(+(&&C($'$'%%$%%$$(%'%$$E$+&%%K&)$'(((,(($F$+$F%'C)%%''$'&&D'%$$($ED($'$*)',&(.%&('$'%E$)*&*,%,%.%&((%(%,%/(-%%'&$'$F$(D&#($&$%$'($$%%'&$'*+'+,+(&-$E$F$F$(#($'$E$F$F#F$$$F$F#'$&$&D($'%$$E$F$F$&#'$($(%$$&$0%%$%$&$FC)$($$%D%$E&E&%$D'$$%DD($)&%%&$'&%E$$%&&&$&(&$%$&$&%&&)%*$*$*$*$*$*$*$&%(%*$&&'$&'$'%E$$%$%'%$%%%%%')%D'$F%$%&(%D(D&$*%&#'$*'*'('&*%%'&&)%$&''$'%$$'$()$%(%&%'%%&$&'$E$('&'%&''''(&('&&/.%&(&&&($($.()(+0'0'0(&%%&'$&%%&$E&G%%$F%$&&%'%&'$'$'$&$'$'$'$'$&%'$'$'$&$'$'$'$'$'$'$&&&%'$'$'$&$'$'$'$'$&(&'&(&%'$'$'$&$'$'$'$'$'$'$$($'E'$F%&%%'$%%'$''$&'%%%'$'$($#)%$&&&(&&'%&&&D%&&%$'&&E'%&%&(%$&D'%(E%'($E$&%&('%$$%&$&$'%'..()%*$*&*'*'&$&(&&&'$'(&$'($)$%&($&$'%'))&%%'&&&%E&&F$'%$'%&$F%%'$&$'$$'$))$%&&%%')$%$&(&&'%&&&%&D%')$&+*'(&((F&&.-(%&%&$*%&$(#'$&$(%'%%%%'$$)%&$(%$$$%(&%%(D%%&%($(%D$''$$&'&*''$%$%(%&%$F&)*&&$&$(&&$(%E%$&%(&&(&'&)%/%*'-'..($*%'&&$F&$%%%'$'%%'$$'%&$)$&%)#(%%D(%'$(%%G$%'%$$&$$$'%D$$E'%$&&$$%)%$%$&&$'%&(&($%%'%($$%%%$'%E$&'%%&%%'&'$$(&'%&&**'%'&&&%(%%)$'%&$&%&%%$%E$D&%%$&%&%,&,#0$%$($(%&&&%D$'$G$&%&%&$&$F%'&$'$$*D(($H$($($($'%($G%($($'%'%($'%&%%&$F#%%$$(%&($%$$($'%$$&$$%$%$&$&(%$&%&&)$*$&D'%$E$$%$$'$&$$%$%$%$$%%%''%$&$'$%&$F$'$&%%'$'$D$%%&%%&%'%(%*'%&&&)((&'&&$K%E#'$(%%%'%'&$'&'$$&$'$()&%'%'$E$*&($'%'%.'-%E%'$F%'%'$(%'C)$$E&%$$&E&$%%DD($$%'&%%'%&$'$'&%''''&%%%%&$$%'%&(&%'%$&&&(''&(&'$&%&%E%%$'D($F%%'$'&'$($'$$$%'$'E%#(%$$E$'$F$F%'$'#(($$(%$$E$($&$&$F$F#(%%%'$'$$%$$&$(%)%'%'%%'$'%%$E&%%'$(%'%'%'%'%'&'%%$&&&$'D$'%&%'($&%'&)$$(%'&%%%%$$&%&($%(&(%%$$%*,''..%'-'-1$,+,-'-%$%$&$&(%$&%&&)$*$&D'%&*'&'()''&'&$(%'%D$$%$$''$($%&$&$$%&%)%'%&$(%')'$%%%''%$&$'$%&$'&%%&%.+-')'-%.,(%&&D&&%(%'&&%$&'&$$&'%$'%)%&($%$%&$(%E%$%%'$'$%%&%($%'D$%%&%%&%'%'%'%(%'&$'$'$$*&'$K%E#(D&%%&$'&%$&&)')')%%'$(%$$'$/$E$%D'%$&&&&F&%&($($)$$&%%$($(%E$$$F%'$$%)%&#F%D&D$,(-%D%D&D$-$(%'$'%'%E%$&D&E&%&'%&(%*$D&%F(D$&&&%'%&(F%%%$$'$$%&%''$(%%F%'%'&E%')$$E$E%$&$'D'H&D%&%$&$$'%&%&$$%$&$%$$&$'%D%&%%%$&*(-&$'D'H&D'$%&%$&%($$&$FE$&%(D(F(%)$)$&%(%)$)$$&'('E'D%(%$&&&D'$(E$'%&(D(D%,%&($$%&&&D&D%*)+%%'$($%&%&%((%%%'D'$'F*%,D&%(E&$'D'$'F*%,D$&E'%%%.0%,(1%$$%$&&&%$(%'%E%'%E&D%(%'&D&D'F%'&G%F$'%''$(%%'#%D(%%$&G$%$$'%'%%%%%'$'$'%D$&E'%$$'%$$&$'%&&'%&%$$'%&%(&$&&$F$&%&%&$$%&%$&%(%F$F$%'%%%(%$$&E'%%D(&&)%D&$'#&F$''&&'$&$$%$(&&&&&$&'$E$%&$%'%&$$%*%$$()$'%%%'''$'&'%($'$G%'&'&$$$*%EE&$$%$%%%&%$&$')'*'%'*(&(&'&%&($%%&%&&%%&(''''&$'%%&%'$F%$$(#F$&$F$($F$-'&%&(%E%#(%%%'$'$&$F&&%&%)%%'$'$'%E&%%'%'$(%'$'%'%'%'%'&'%'$%'&%('$'%&%'($&%'&)$$(%'&%%%%$$&%(%&($%%$&'&'''$%%E$$(%'%D$''$($%$&$$,-'(./%(-,+(.(-(-%%%-$'%&%$$()'$'$'&%%&%&&D&&%($&'%%)$'$(%E%$%%&%($$(%'%%'$'$''$)$$#)$'$$%$%%&&%&%$&&%&%%&%&&%)%&%$$&'$'$$'%''$(%E%%%%'%)'$%%$E&&$'%'&$%)(+E$$'($($%$&&&$'$&$'$&$'$&%&'&'$'$/&&%)%%&%%$&$'D$(%$&$'%%E$()&&$$'(D&%(D%&($(&+%'$($(&+%%$&&($&$$'$F%'%'%'$&'$%0+&&%$%&$&&&$'&&'&%'$&'&'&&)%+$)&,$'%'%($%%')'*'%'*(&(&'&%$%%%$F$F$F$&$&&'&&$'&&'(%&'&'&%'$&'&&)%+$)&,$'%'%($$'%''$(%%'D'#)%$$&$(%'%$$&$($E$(('&%(&($%,(&&&%&&&E&$'E&($)%($%%$&%$&&&&&D'&%%$($'%)+'+'/%+$+(0%&&&$&(&'&%&'%)$F&$%&%'$'%1*-#'$&D(%%$'&&D'%$$'%'%&$(%DD($''$%&$()%&&%&$'E$$'%E$)%,%.,(%&%%'$'&%+$()%&&%&%&$F$'%'%%'$$'E%$)#'$&'$$'$(%+&(&*&&'$'(&$'%&('K/D(J/D&('..($%$'$%&&&%%'%'&$$E$'$G'D$F$'$'$F%G(D&F(D$)#($(&%($%'$E$F$$$$%'$F#'%&%%$'$E$'%&$$$'%&$&$&$'%E&&%'$'%&$F%'$(%&$&$(C)&$$'%$D%$E$&$F$F$&E%#)$(%$$&$(%%$E$&$)$F$F$%%%0@0000H8H40H000047P00P@001000@0B0HP@:H9T8P000LB8d@800@I0<110000QQ8400P10030005940@410020000Q02000@0200000@P0101@8000440400000000808000000000@00000000P`0000000040400@0004<000000000008000030000000000P020T400020@0@00000000000000000000000000P0000000400400000400220080000100000000000000000P000000000000P000000@00402000000000@00000000000000000000040000000000000",
  'Æ&ÁĂÂА𝔄ÀΑĀ⩓Ą𝔸⁡Å𝒜≔ÃÄ∖⫧⌆Б∵ℬΒ𝔅𝔹˘ℬ≎Ч©Ć⋒ⅅℭČÇĈ∰Ċ¸·ℭΧ⊙⊖⊕⊗∲”’∷⩴≡∯∮ℂ∐∳⨯𝒞⋓≍ⅅ⤑ЂЅЏ‡↡⫤ĎД∇Δ𝔇´˙˝`˜⋄ⅆ𝔻¨⃜≐∯¨⇓⇐⇔⫤⟸⟺⟹⇒⊨⇑⇕∥↓⤓⇵̑⥐⥞↽⥖⥟⇁⥗⊤↧⇓𝒟ĐŊÐÉĚÊЭĖ𝔈È∈Ē◻▫Ę𝔼Ε⩵≂⇌ℰ⩳ΗË∃ⅇФ𝔉◼▪𝔽∀ℱℱЃ>ΓϜĞĢĜГĠ𝔊⋙𝔾≥⋛≧⪢≷⩾≳𝒢≫Ъˇ^Ĥℌℋℍ─ℋĦ≎≏ЕĲЁÍÎИİℑÌℑĪⅈ⇒∬∫⋂⁣⁢Į𝕀ΙℐĨІÏĴЙ𝔍𝕁𝒥ЈЄХЌΚĶК𝔎𝕂𝒦Љ<ĹΛ⟪ℒ↞ĽĻЛ⟨←⇤⇆⌈⟦⥡⇃⥙⌊↔⥎⊣↤⥚⊲⧏⊴⥑⥠↿⥘↼⥒⇐⇔⋚≦≶⪡⩽≲𝔏⋘⇚Ŀ⟵⟷⟶⟸⟺⟹𝕃↙↘ℒ↰Ł≪⤅М ℳ𝔐∓𝕄ℳΜЊŃŇŅН​​​​≫≪\n𝔑⁠\xA0ℕ⫬≢≭∦∉≠≂̸∄≯≱≧̸≫̸≹⩾̸≵≎̸≏̸⋪⧏̸⋬≮≰≸≪̸⩽̸≴⪢̸⪡̸⊀⪯̸⋠∌⋫⧐̸⋭⊏̸⋢⊐̸⋣⊂⃒⊈⊁⪰̸⋡≿̸⊃⃒⊉≁≄≇≉∤𝒩ÑΝŒÓÔОŐ𝔒ÒŌΩΟ𝕆“‘⩔𝒪ØÕ⨷Ö‾⏞⎴⏜∂П𝔓ΦΠ±ℌℙ⪻≺⪯≼≾″∏∷∝𝒫Ψ"𝔔ℚ𝒬⤐®Ŕ⟫↠⤖ŘŖРℜ∋⇋⥯ℜΡ⟩→⇥⇄⌉⟧⥝⇂⥕⌋⊢↦⥛⊳⧐⊵⥏⥜↾⥔⇀⥓⇒ℝ⥰⇛ℛ↱⧴ЩШЬŚ⪼ŠŞŜС𝔖↓←→↑Σ∘𝕊√□⊓⊏⊑⊐⊒⊔𝒮⋆⋐⋐⊆≻⪰≽≿∋∑⋑⊃⊇⋑Þ™ЋЦ	ΤŤŢТ𝔗∴Θ   ∼≃≅≈𝕋⃛𝒯ŦÚ↟⥉ЎŬÛУŰ𝔘ÙŪ_⏟⎵⏝⋃⊎Ų𝕌↑⤒⇅↕⥮⊥↥⇑⇕↖↗ϒΥŮ𝒰ŨÜ⊫⫫В⊩⫦⋁‖‖∣|❘≀ 𝔙𝕍𝒱⊪Ŵ⋀𝔚𝕎𝒲𝔛Ξ𝕏𝒳ЯЇЮÝŶЫ𝔜𝕐𝒴ŸЖŹŽЗŻ​Ζℨℤ𝒵áă∾∾̳∿â´аæ⁡𝔞àℵℵαā⨿&∧⩕⩜⩘⩚∠⦤∠∡⦨⦩⦪⦫⦬⦭⦮⦯∟⊾⦝∢Å⍼ą𝕒≈⩰⩯≊≋\'≈≊å𝒶*≈≍ãä∳⨑⫭≌϶‵∽⋍⊽⌅⌅⎵⎶≌б„∵∵⦰϶ℬβℶ≬𝔟⋂◯⋃⨀⨁⨂⨆★▽△⨄⋁⋀⤍⧫▪▴▾◂▸␣▒░▓█=⃥≡⃥⌐𝕓⊥⊥⋈╗╔╖╓═╦╩╤╧╝╚╜╙║╬╣╠╫╢╟⧉╕╒┐┌─╥╨┬┴⊟⊞⊠╛╘┘└│╪╡╞┼┤├‵˘¦𝒷⁏∽⋍\\⧅⟈••≎⪮≏≏ć∩⩄⩉⩋⩇⩀∩︀⁁ˇ⩍čçĉ⩌⩐ċ¸⦲¢·𝔠ч✓✓χ○⧃ˆ≗↺↻®Ⓢ⊛⊚⊝≗⨐⫯⧂♣♣:≔≔,@∁∘∁ℂ≅⩭∮𝕔∐©℗↵✗𝒸⫏⫑⫐⫒⋯⤸⤵⋞⋟↶⤽∪⩈⩆⩊⊍⩅∪︀↷⤼⋞⋟⋎⋏¤↶↷⋎⋏∲∱⌭⇓⥥†ℸ↓‐⊣⤏˝ďдⅆ‡⇊⩷°δ⦱⥿𝔡⇃⇂⋄⋄♦♦¨ϝ⋲÷÷⋇⋇ђ⌞⌍$𝕕˙≐≑∸∔⊡⌆↓⇊⇃⇂⤐⌟⌌𝒹ѕ⧶đ⋱▿▾⇵⥯⦦џ⟿⩷≑é⩮ě≖ê≕эėⅇ≒𝔢⪚è⪖⪘⪙⏧ℓ⪕⪗ē∅∅∅   ŋ ę𝕖⋕⧣⩱εεϵ≖≕≂⪖⪕=≟≡⩸⧥≓⥱ℯ≐≂ηðë€!∃ℰⅇ≒ф♀ﬃﬀﬄ𝔣ﬁfj♭ﬂ▱ƒ𝕗∀⋔⫙⨍½⅓¼⅕⅙⅛⅔⅖¾⅗⅜⅘⅚⅝⅞⁄⌢𝒻≧⪌ǵγϝ⪆ğĝгġ≥⋛≥≧⩾⩾⪩⪀⪂⪄⋛︀⪔𝔤≫⋙ℷѓ≷⪒⪥⪤≩⪊⪊⪈⪈≩⋧𝕘`ℊ≳⪎⪐>⪧⩺⋗⦕⩼⪆⥸⋗⋛⪌≷≳≩︀≩︀⇔ ½ℋъ↔⥈↭ℏĥ♥♥…⊹𝔥⤥⤦⇿∻↩↪𝕙―𝒽ℏħ⁃‐í⁣îие¡⇔𝔦ìⅈ⨌∭⧜℩ĳīℑℐℑı⊷Ƶ∈℅∞⧝ı∫⊺ℤ⊺⨗⨼ёį𝕚ι⨼¿𝒾∈⋹⋵⋴⋳∈⁢ĩіïĵй𝔧ȷ𝕛𝒿јєκϰķк𝔨ĸхќ𝕜𝓀⇚⇐⤛⤎≦⪋⥢ĺ⦴ℒλ⟨⦑⟨⪅«←⇤⤟⤝↩↫⤹⥳↢⪫⤙⪭⪭︀⤌❲{[⦋⦏⦍ľļ⌈{л⤶“„⥧⥋↲≤←↢↽↼⇇↔⇆⇋↭⋋⋚≤≦⩽⩽⪨⩿⪁⪃⋚︀⪓⪅⋖⋚⪋≶≲⥼⌊𝔩≶⪑↽↼⥪▄љ≪⇇⌞⥫◺ŀ⎰⎰≨⪉⪉⪇⪇≨⋦⟬⇽⟦⟵⟷⟼⟶↫↬⦅𝕝⨭⨴∗_◊◊⧫(⦓⇆⌟⇋⥭‎⊿‹𝓁↰≲⪍⪏[‘‚ł<⪦⩹⋖⋋⋉⥶⩻⦖◃⊴◂⥊⥦≨︀≨︀∺¯♂✠✠↦↦↧↤↥▮⨩м—∡𝔪℧µ∣*⫰·−⊟∸⨪⫛…∓⊧𝕞∓𝓂∾μ⊸⊸⋙̸≫⃒≫̸⇍⇎⋘̸≪⃒≪̸⇏⊯⊮∇ń∠⃒≉⩰̸≋̸ŉ≉♮♮ℕ\xA0≎̸≏̸⩃ňņ≇⩭̸⩂н–≠⇗⤤↗↗≐̸≢⤨≂̸∄∄𝔫≧̸≱≱≧̸⩾̸⩾̸≵≯≯⇎↮⫲∋⋼⋺∋њ⇍≦̸↚‥≰↚↮≰≦̸⩽̸⩽̸≮≴≮⋪⋬∤𝕟¬∉⋹̸⋵̸∉⋷⋶∌∌⋾⋽∦∦⫽⃥∂̸⨔⊀⋠⪯̸⊀⪯̸⇏↛⤳̸↝̸↛⋫⋭⊁⋡⪰̸𝓃∤∦≁≄≄∤∦⋢⋣⊄⫅̸⊈⊂⃒⊈⫅̸⊁⪰̸⊅⫆̸⊉⊃⃒⊉⫆̸≹ñ≸⋪⋬⋫⋭ν#№ ⊭⤄≍⃒⊬≥⃒>⃒⧞⤂≤⃒<⃒⊴⃒⤃⊵⃒∼⃒⇖⤣↖↖⤧Ⓢó⊛⊚ôо⊝ő⨸⊙⦼œ⦿𝔬˛ò⧁⦵Ω∮↺⦾⦻‾⧀ōωο⦶⊖𝕠⦷⦹⊕∨↻⩝ℴℴªº⊶⩖⩗⩛ℴø⊘õ⊗⨶ö⌽∥¶∥⫳⫽∂п%.‰⊥‱𝔭φϕℳ☎π⋔ϖℏℎℏ+⨣⊞⨢∔⨥⩲±⨦⨧±⨕𝕡£≺⪳⪷≼⪯≺⪷≼⪯⪹⪵⋨≾′ℙ⪵⪹⋨∏⌮⌒⌓∝∝≾⊰𝓅ψ 𝔮⨌𝕢⁗𝓆ℍ⨖?≟"⇛⇒⤜⤏⥤∽̱ŕ√⦳⟩⦒⦥⟩»→⥵⇥⤠⤳⤞↪↬⥅⥴↣↝⤚∶ℚ⤍❳}]⦌⦎⦐řŗ⌉}р⤷⥩””↳ℜℛℜℝ▭®⥽⌋𝔯⇁⇀⥬ρϱ→↣⇁⇀⇄⇌⇉↝⋌˚≓⇄⇌‏⎱⎱⫮⟭⇾⟧⦆𝕣⨮⨵)⦔⨒⇉›𝓇↱]’’⋌⋊▹⊵▸⧎⥨℞ś‚≻⪴⪸š≽⪰şŝ⪶⪺⋩⨓≿с⋅⊡⩦⇘⤥↘↘§;⤩∖∖✶𝔰⌢♯щш∣∥­σςς∼⩪≃≃⪞⪠⪝⪟≆⨤⥲←∖⨳⧤∣⌣⪪⪬⪬︀ь/⧄⌿𝕤♠♠∥⊓⊓︀⊔⊔︀⊏⊑⊏⊑⊐⊒⊐⊒□□▪▪→𝓈∖⌣⋆☆★ϵϕ¯⊂⫅⪽⊆⫃⫁⫋⊊⪿⥹⊂⊆⫅⊊⫋⫇⫕⫓≻⪸≽⪰⪺⪶⋩≿∑♪⊃¹²³⫆⪾⫘⊇⫄⟉⫗⥻⫂⫌⊋⫀⊃⊇⫆⊋⫌⫈⫔⫖⇙⤦↙↙⤪ß⌖τ⎴ťţт⃛⌕𝔱∴∴θϑϑ≈∼ ≈∼þ˜×⊠⨱⨰∭⤨⊤⌶⫱𝕥⫚⤩‴™▵▿◃⊴≜▹⊵◬≜⨺⨹⧍⨻⏢𝓉цћŧ≬↞↠⇑⥣ú↑ўŭûу⇅ű⥮⥾𝔲ù↿↾▀⌜⌜⌏◸ū¨ų𝕦↑↕↿↾⊎υϒυ⇈⌝⌝⌎ů◹𝓊⋰ũ▵▴⇈ü⦧⇕⫨⫩⊨⦜ϵϰ∅ϕϖ∝↕ϱς⊊︀⫋︀⊋︀⫌︀ϑ⊲⊳в⊢∨⊻≚⋮||𝔳⊲⊂⃒⊃⃒𝕧∝⊳𝓋⫋︀⊊︀⫌︀⊋︀⦚ŵ⩟∧≙℘𝔴𝕨℘≀≀𝓌⋂◯⋃▽𝔵⟺⟷ξ⟸⟵⟼⋻⨀𝕩⨁⨂⟹⟶𝓍⨆⨄△⋁⋀ýяŷы¥𝔶ї𝕪𝓎юÿźžзżℨζ𝔷ж⇝𝕫𝓏‍‌',
];
/** Multiplier deriving the first candidate bucket from a key. */
const BUCKET_HASH_1 = 2654435761;
/** Multiplier deriving the second candidate bucket from a key. */
const BUCKET_HASH_2 = 2246822507;
/** Size of the (c0,c1) class table (10-bit index). */
const PAIR_TABLE_SIZE = 1024;
/**
 * Map an alphanumeric char code to 6 bits (1..62); 0 = not alphanumeric.
 * Used for the key's last-character field.
 */
const CHAR_REMAP = (() => {
  const remap = /* @__PURE__ */ new Uint8Array(128);
  for (let code = 48; code <= 57; code++) remap[code] = code - 47;
  for (let code = 65; code <= 90; code++) remap[code] = code - 54;
  for (let code = 97; code <= 122; code++) remap[code] = code - 60;
  return remap;
})();
/**
 * The exact 32-bit key for a name occurring at `nameStart` with `length`
 * chars. Covers the first two and last two characters plus the length;
 * middle characters are verified separately against the names blob.
 *
 * The hot decoder inlines this computation; tests assert both stay in sync
 * by looking every entity up through the public API.
 * @param text Text containing the name.
 * @param nameStart Index of the name's first character.
 * @param length Length of the name.
 */
function exactKey(text, nameStart, length) {
  return (
    (text.charCodeAt(nameStart) << 25) |
    (text.charCodeAt(nameStart + 1) << 18) |
    (text.charCodeAt(nameStart + length - 2) << 11) |
    (CHAR_REMAP[text.charCodeAt(nameStart + length - 1)] << 5) |
    length
  );
}
/**
 * The 10-bit (c0,c1) class index used by the probe front end. The function
 * was chosen by exhaustive search over load-free mixers for minimal
 * candidate-set collisions on the real entity set.
 * @param c0 First char code of the candidate name.
 * @param c1 Second char code.
 */
function pairIndex(c0, c1) {
  return (((c0 * 3) << 3) ^ c1) & 1023;
}
/**
 * First candidate bucket for a key in a table of `buckets` buckets.
 * @param key Exact key.
 * @param buckets Bucket count.
 */
function bucketOne(key, buckets) {
  return ((Math.imul(key, BUCKET_HASH_1) >>> 16) * buckets) >>> 16;
}
/**
 * Second candidate bucket for a key.
 * @param key Exact key.
 * @param buckets Bucket count.
 */
function bucketTwo(key, buckets) {
  return ((Math.imul(key, BUCKET_HASH_2) >>> 16) * buckets) >>> 16;
}
/**
 * Build the lookup structures from a serialized dataset.
 * @param packed Serialized decode data, see `decode-data-format.ts`.
 */
function initDecodeData(packed) {
  const [data, values] = packed;
  const nameCount = ((data.charCodeAt(0) - 48) << 6) | (data.charCodeAt(1) - 48);
  const suffixesLength = ((data.charCodeAt(2) - 48) << 6) | (data.charCodeAt(3) - 48);
  const buckets = ((data.charCodeAt(4) - 48) << 6) | (data.charCodeAt(5) - 48);
  const metaStart = 6 + suffixesLength;
  const choicesStart = metaStart + 2 * nameCount;
  const slotCount = 2 * buckets;
  const keys = new Int32Array(slotCount);
  const slotMidOff = new Uint16Array(slotCount);
  const slotValue = new Uint16Array(slotCount);
  const lengthBits = new Uint32Array(PAIR_TABLE_SIZE);
  const middleOffsets = /* @__PURE__ */ new Map();
  const middles = [];
  let name = "";
  let suffixOffset = 6;
  let valueOffset = 0;
  for (let index = 0; index < nameCount; index++) {
    const meta0 = data.charCodeAt(metaStart + 2 * index) - 35;
    const meta1 = data.charCodeAt(metaStart + 2 * index + 1) - 35;
    const prefixLength = meta0 & 31;
    const length = prefixLength + (meta1 & 31);
    const valueLength = (meta1 >> 5) + 1;
    name =
      name.slice(0, prefixLength) + data.slice(suffixOffset, suffixOffset + length - prefixLength);
    suffixOffset += length - prefixLength;
    const key = exactKey(name, 0, length);
    let slot =
      2 *
      (((data.charCodeAt(choicesStart + Math.floor(index / 6)) - 48) & (1 << (index % 6))) === 0
        ? bucketOne
        : bucketTwo)(key, buckets);
    if (keys[slot] !== 0) slot += 1;
    keys[slot] = key;
    if (length > 4) {
      const middle = name.slice(2, length - 2);
      const existing = middleOffsets.get(middle);
      if (existing === void 0) {
        middleOffsets.set(middle, middles.length);
        slotMidOff[slot] = middles.length;
        for (let middleIndex = 0; middleIndex < middle.length; middleIndex += 2)
          middles.push(middle.charCodeAt(middleIndex) | (middle.charCodeAt(middleIndex + 1) << 16));
      } else slotMidOff[slot] = existing;
    }
    const pair = pairIndex(name.charCodeAt(0), name.charCodeAt(1));
    lengthBits[pair] |= length <= 16 ? 1 << (length - 2) : 32768;
    if ((meta0 & 32) !== 0) lengthBits[pair] |= 1 << (length - 2 + 16);
    slotValue[slot] = (valueOffset << 2) | (valueLength - 1) | ((meta0 & 32) >> 4);
    valueOffset += valueLength;
  }
  return {
    keys,
    buckets,
    slotMidOff,
    slotValue,
    values,
    lengthBits,
    middles: new Uint32Array(middles),
  };
}
// ../../node_modules/.pnpm/entities@9.0.0/node_modules/entities/dist/decode.js
const CHAR_NUM = 35;
const CHAR_SEMI = 59;
const CHAR_EQUALS = 61;
const CHAR_ZERO = 48;
const CHAR_LOWER_A = 97;
const CHAR_LOWER_X = 120;
const CHAR_UPPER_A = 65;
/** Bit that needs to be set to convert an upper case ASCII character to lower case */
const TO_LOWER_BIT = 32;
/**
 * Unsigned subtraction trick: (code - lo) >>> 0 wraps negatives to large
 * values, so a single `<=` covers the entire [lo..hi] range check.
 * @param code Code point to check.
 */
function isNumber(code) {
  return (code - CHAR_ZERO) >>> 0 <= 9;
}
function isAlphaNumeric(code) {
  return isNumber(code) || ((code | TO_LOWER_BIT) - CHAR_LOWER_A) >>> 0 <= 25;
}
/**
 * Checks if the given character is a valid end character for an entity in an attribute.
 *
 * Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
 * See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
 * @param code Code point to check.
 */
function isEntityInAttributeInvalidEnd(code) {
  return code === CHAR_EQUALS || isAlphaNumeric(code);
}
/**
 * Decoding mode for named entities.
 */
var DecodingMode;
(function (DecodingMode) {
  /** Entities in text nodes that can end with any character. */
  DecodingMode[(DecodingMode["Legacy"] = 0)] = "Legacy";
  /** Only allow entities terminated with a semicolon. */
  DecodingMode[(DecodingMode["Strict"] = 1)] = "Strict";
  /** Entities in attributes have limitations on ending characters. */
  DecodingMode[(DecodingMode["Attribute"] = 2)] = "Attribute";
})(DecodingMode || (DecodingMode = {}));
/** Decode data for HTML entities. */
const htmlDecode = /* #__PURE__ */ initDecodeData(htmlDecodeData);
const htmlKeys = /* #__PURE__ */ (() => htmlDecode.keys)();
const htmlBuckets = /* #__PURE__ */ (() => htmlDecode.buckets)();
const htmlSlotMidOff = /* #__PURE__ */ (() => htmlDecode.slotMidOff)();
const htmlLengthBits = /* #__PURE__ */ (() => htmlDecode.lengthBits)();
const htmlMiddles = /* #__PURE__ */ (() => htmlDecode.middles)();
/** Hoisted for the specialized HTML cores; see `emitHtmlValue`. */
const htmlSlotValue = /* #__PURE__ */ (() => htmlDecode.slotValue)();
const htmlValues = /* #__PURE__ */ (() => htmlDecode.values)();
/**
 * Find the slot matching `text[start..start+length)`, or -1. A match proves
 * every character of the span (exact key + middle comparison).
 * @param text Input text.
 * @param start Start of the span in `text`.
 * @param length Length of the span.
 */
function findSlotHtml(text, start, length) {
  const c0 = text.charCodeAt(start);
  const c1 = text.charCodeAt(start + 1);
  const c2 = text.charCodeAt(start + length - 2);
  const c3 = text.charCodeAt(start + length - 1);
  if ((c0 | c1 | c2 | c3) > 127) return -1;
  const key = (c0 << 25) | (c1 << 18) | (c2 << 11) | (CHAR_REMAP[c3] << 5) | length;
  let slot = 2 * (((Math.imul(key, BUCKET_HASH_1) >>> 16) * htmlBuckets) >>> 16);
  for (let attempt = 0; ; attempt++) {
    if (htmlKeys[slot] === key && (length <= 4 || isMidMatchHtml(slot, text, start, length)))
      return slot;
    if (
      htmlKeys[slot + 1] === key &&
      (length <= 4 || isMidMatchHtml(slot + 1, text, start, length))
    )
      return slot + 1;
    if (attempt === 1) return -1;
    slot = 2 * (((Math.imul(key, BUCKET_HASH_2) >>> 16) * htmlBuckets) >>> 16);
  }
}
/**
 * Compare the middle characters (positions 2..length-3) of the candidate at
 * `slot` against the input. The key already proves the outer characters and
 * the length. Names of length at most four are accepted by the caller.
 * @param slot Slot of the candidate.
 * @param text Input text.
 * @param start Start of the span in `text`.
 * @param length Length of the span.
 */
function isMidMatchHtml(slot, text, start, length) {
  let wordIndex = htmlSlotMidOff[slot];
  let index = start + 2;
  const end = start + length - 2;
  while (index + 1 < end) {
    if ((text.charCodeAt(index) | (text.charCodeAt(index + 1) << 16)) !== htmlMiddles[wordIndex++])
      return false;
    index += 2;
  }
  return index === end || text.charCodeAt(index) === (htmlMiddles[wordIndex] & 65535);
}
/** ASCII digit values; 0xff marks characters outside the hexadecimal range. */
const numericDigits = /* #__PURE__ */ (() => {
  const digits = /* @__PURE__ */ new Uint8Array(128).fill(255);
  for (let digit = 0; digit < 10; digit++) digits[CHAR_ZERO + digit] = digit;
  for (let digit = 0; digit < 6; digit++) {
    digits[CHAR_UPPER_A + digit] = digit + 10;
    digits[CHAR_LOWER_A + digit] = digit + 10;
  }
  return digits;
})();
/**
 * Find the longest legacy (semicolon-less) match for the name starting at
 * `start`, using the per-class legacy length bits. Returns
 * `slot << 3 | matchLength`, or -1 if there is no match. Only called after
 * the exact probes failed (the miss path).
 * @param input Input text.
 * @param start Start of the name.
 * @param maxLength Number of available run characters.
 */
function findLegacySlot(input, start, maxLength) {
  let legacy =
    (htmlLengthBits[pairIndex(input.charCodeAt(start), input.charCodeAt(start + 1))] >>> 16) & 31;
  while (legacy !== 0) {
    const top = 31 - Math.clz32(legacy);
    legacy ^= 1 << top;
    if (top + 2 > maxLength) continue;
    const slot = findSlotHtml(input, start, top + 2);
    if (slot >= 0 && (htmlSlotValue[slot] & 2) !== 0) return (slot << 3) | (top + 2);
  }
  return -1;
}
/**
 * Match a class containing long names without probing all its shorter lengths.
 * The 32-character window bounds the scan even for invalid or unterminated runs.
 * Returns `(slot << 6) | consumed`, excluding the `&`, or -1 on a miss.
 * @param input Input containing the candidate name.
 * @param start Start of the name.
 * @param mode Decoding mode, including the rules for legacy matches.
 */
function findLongClassMatch(input, start, mode) {
  const length = input.slice(start, start + 32).indexOf(";");
  if ((length - 2) >>> 0 <= 29) {
    const slot = findSlotHtml(input, start, length);
    if (slot >= 0) return (slot << 6) | (length + 1);
  }
  if (mode !== DecodingMode.Strict) {
    const packed = findLegacySlot(input, start, Math.min(31, input.length - start));
    if (packed >= 0) {
      const length = packed & 7;
      if (
        mode !== DecodingMode.Attribute ||
        start + length >= input.length ||
        !isEntityInAttributeInvalidEnd(input.charCodeAt(start + length))
      )
        return ((packed >> 3) << 6) | length;
    }
  }
  return -1;
}
const STATE_ENTITY_START = 0;
const STATE_NUMERIC_START = 1;
const STATE_NUMERIC_DECIMAL = 2;
const STATE_NUMERIC_HEX = 3;
const STATE_NAMED_ENTITY = 4;
/**
 * Token decoder with support of writing partial entities; the shared base
 * of `HtmlEntityDecoder` and `XmlEntityDecoder`. Numeric entities are
 * identical in both document types and are handled here; named entities are
 * left to the subclasses.
 *
 * The decoder is driven by a tokenizer: after a `&`, write the following
 * input (possibly in chunks). `write` returns the number of characters
 * consumed once the entity is decided, or -1 while more input is needed.
 * Rejection may surface later than strictly possible (the decoder buffers
 * until a terminator or the name-length limit), but emitted code points,
 * consumed counts, and final return values are exact.
 */
var EntityDecoderBase = class {
  emitCodePoint;
  errors;
  /** The current state of the decoder. */
  state = STATE_ENTITY_START;
  /** Characters that were consumed while parsing an entity. */
  consumed = 1;
  /** Accumulated numeric code point, or a packed partial XML name. */
  result = 0;
  /** The mode in which the decoder is operating. */
  decodeMode = DecodingMode.Strict;
  /** Replacement rules for numeric character references. */
  replaceNumericCodePoint = replaceCodePoint;
  constructor(emitCodePoint, errors) {
    this.emitCodePoint = emitCodePoint;
    this.errors = errors;
  }
  /**
   * Switches between the numeric decimal and hexadecimal states.
   *
   * Equivalent to the `Numeric character reference state` in the HTML spec.
   * @param input The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericStart(input, offset) {
    if (offset >= input.length) return -1;
    if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CHAR_LOWER_X) {
      this.state = STATE_NUMERIC_HEX;
      this.consumed += 1;
      return this.stateNumericHex(input, offset + 1);
    }
    this.state = STATE_NUMERIC_DECIMAL;
    return this.stateNumericDecimal(input, offset);
  }
  /**
   * Parses a hexadecimal numeric entity.
   *
   * Equivalent to the `Hexadecimal character reference state` in the HTML spec.
   * @param input The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericHex(input, offset) {
    const inputLength = input.length;
    let { result, consumed } = this;
    let index = offset;
    while (index < inputLength) {
      const char = input.charCodeAt(index);
      const digit = numericDigits[char];
      if (digit <= 15) result = result * 16 + digit;
      else {
        this.result = result;
        this.consumed = consumed;
        return this.emitNumericEntity(char, 3);
      }
      consumed += 1;
      index += 1;
    }
    this.result = result;
    this.consumed = consumed;
    return -1;
  }
  /**
   * Parses a decimal numeric entity.
   *
   * Equivalent to the `Decimal character reference state` in the HTML spec.
   * @param input The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericDecimal(input, offset) {
    const inputLength = input.length;
    let { result, consumed } = this;
    let index = offset;
    while (index < inputLength) {
      const digit = input.charCodeAt(index) - CHAR_ZERO;
      if (digit >>> 0 > 9) {
        this.result = result;
        this.consumed = consumed;
        return this.emitNumericEntity(digit + CHAR_ZERO, 2);
      }
      result = result * 10 + digit;
      consumed += 1;
      index += 1;
    }
    this.result = result;
    this.consumed = consumed;
    return -1;
  }
  /**
   * Validate and emit a numeric entity.
   *
   * Implements the logic from the `Hexadecimal character reference start
   * state` and `Numeric character reference end state` in the HTML spec.
   * @param lastCp The last code point of the entity. Used to see if the
   *               entity was terminated with a semicolon.
   * @param expectedLength The minimum number of characters that should be
   *                       consumed. Used to validate that at least one digit
   *                       was consumed.
   * @returns The number of characters that were consumed.
   */
  emitNumericEntity(lastCp, expectedLength) {
    if (this.consumed <= expectedLength) {
      this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed);
      return 0;
    }
    if (lastCp === CHAR_SEMI) this.consumed += 1;
    else if (this.decodeMode === DecodingMode.Strict) return 0;
    this.emitCodePoint(this.replaceNumericCodePoint(this.result), this.consumed);
    if (this.errors) {
      if (lastCp !== CHAR_SEMI) this.errors.missingSemicolonAfterCharacterReference();
      this.errors.validateNumericCharacterReference(this.result);
    }
    return this.consumed;
  }
  /**
   * Resets the instance to make it reusable.
   * @param decodeMode Entity decoding mode to use.
   */
  startEntity(decodeMode) {
    this.decodeMode = decodeMode;
    this.state = STATE_ENTITY_START;
    this.result = 0;
    this.consumed = 1;
  }
  /**
   * Write an entity to the decoder. This can be called multiple times with partial entities.
   * If the entity is incomplete, the decoder will return -1.
   * @param input The string containing the entity (or a continuation of the entity).
   * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  write(input, offset) {
    switch (this.state) {
      case STATE_ENTITY_START:
        if (input.charCodeAt(offset) === CHAR_NUM) {
          this.state = STATE_NUMERIC_START;
          this.consumed += 1;
          return this.stateNumericStart(input, offset + 1);
        }
        this.state = STATE_NAMED_ENTITY;
        return this.stateNamedEntity(input, offset);
      case STATE_NUMERIC_START:
        return this.stateNumericStart(input, offset);
      case STATE_NUMERIC_DECIMAL:
        return this.stateNumericDecimal(input, offset);
      case STATE_NUMERIC_HEX:
        return this.stateNumericHex(input, offset);
      default:
        return this.stateNamedEntity(input, offset);
    }
  }
  /**
   * Signal to the parser that the end of the input was reached.
   *
   * Remaining data will be emitted and relevant errors will be produced.
   * @returns The number of characters consumed.
   */
  end() {
    switch (this.state) {
      case STATE_NAMED_ENTITY:
        return this.endNamedEntity();
      case STATE_NUMERIC_DECIMAL:
        return this.emitNumericEntity(0, 2);
      case STATE_NUMERIC_HEX:
        return this.emitNumericEntity(0, 3);
      case STATE_NUMERIC_START:
        this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed);
        return 0;
      default:
        return 0;
    }
  }
};
/**
 * Streaming decoder for HTML entities.
 *
 * When the entity fits inside the current chunk (the common case), the
 * lookup runs directly on the chunk via the same length-probe scheme as the
 * synchronous decoder; chunk-boundary runs use a reusable character buffer.
 */
var HtmlEntityDecoder = class extends EntityDecoderBase {
  /** Total name characters seen for the current named entity. */
  runLength = 0;
  /** Reused for ASCII alphanumerics; the 32nd character rules out an exact match. */
  nameBuffer = /* @__PURE__ */ new Uint8Array(32);
  /**
   * Emit the replacement for a matched slot. Values are at most two
   * UTF-16 code units; like previous versions, each unit is emitted as
   * its own callback (surrogate halves included).
   * @param slot The matched slot.
   */
  emitSlot(slot) {
    const packed = htmlSlotValue[slot];
    const off = packed >> 2;
    this.emitCodePoint(htmlValues.charCodeAt(off), this.consumed);
    if ((packed & 1) !== 0) this.emitCodePoint(htmlValues.charCodeAt(off + 1), this.consumed);
  }
  startEntity(decodeMode) {
    super.startEntity(decodeMode);
    this.runLength = 0;
  }
  stateNamedEntity(input, offset) {
    const inputLength = input.length;
    if (this.runLength === 0 && offset + 17 <= inputLength) {
      const pair = pairIndex(input.charCodeAt(offset), input.charCodeAt(offset + 1));
      const bits = htmlLengthBits[pair];
      if ((bits & 32768) !== 0 && offset + 32 <= inputLength) {
        const packed = findLongClassMatch(input, offset, this.decodeMode);
        if (packed >= 0) {
          const length = packed & 63;
          this.consumed = length + 1;
          this.emitSlot(packed >> 6);
          if (input.charCodeAt(offset + length - 1) !== CHAR_SEMI)
            this.errors?.missingSemicolonAfterCharacterReference();
          return this.consumed;
        }
        return 0;
      }
      let probed = bits & 32767;
      while (probed !== 0) {
        const low = probed & -probed;
        probed ^= low;
        const length = 33 - Math.clz32(low);
        if (input.charCodeAt(offset + length) === CHAR_SEMI) {
          const slot = findSlotHtml(input, offset, length);
          if (slot >= 0) {
            this.consumed = length + 2;
            this.emitSlot(slot);
            return this.consumed;
          }
        }
      }
      if ((bits & 32768) === 0) {
        if (this.decodeMode !== DecodingMode.Strict) {
          const packed = findLegacySlot(input, offset, 31);
          if (packed >= 0) {
            const matchLength = packed & 7;
            const next = input.charCodeAt(offset + matchLength);
            if (this.decodeMode === DecodingMode.Attribute && isEntityInAttributeInvalidEnd(next))
              return 0;
            this.consumed = matchLength + 1;
            this.emitSlot(packed >> 3);
            this.errors?.missingSemicolonAfterCharacterReference();
            return this.consumed;
          }
        }
        return 0;
      }
    }
    let index = offset;
    let { runLength } = this;
    let terminator = -1;
    const scanEnd = Math.min(inputLength, offset + 32 - runLength);
    while (index < scanEnd) {
      const char = input.charCodeAt(index);
      if (!isAlphaNumeric(char)) {
        terminator = char;
        break;
      }
      this.nameBuffer[runLength++] = char;
      index++;
    }
    if (terminator < 0 && runLength < 32) {
      this.runLength = runLength;
      return -1;
    }
    if (terminator === CHAR_SEMI && (runLength - 2) >>> 0 <= 29) {
      const slot = findBufferedHtmlSlot(this.nameBuffer, runLength);
      if (slot >= 0) {
        this.consumed = runLength + 2;
        this.emitSlot(slot);
        return this.consumed;
      }
    }
    if (this.decodeMode !== DecodingMode.Strict && runLength >= 2) {
      const packed = findBufferedLegacySlot(this.nameBuffer, runLength);
      if (packed >= 0) {
        const length = packed & 7;
        const next = length < runLength ? this.nameBuffer[length] : terminator;
        if (this.decodeMode === DecodingMode.Attribute && isEntityInAttributeInvalidEnd(next))
          return 0;
        this.consumed = length + 1;
        this.emitSlot(packed >> 3);
        this.errors?.missingSemicolonAfterCharacterReference();
        return this.consumed;
      }
    }
    return 0;
  }
  endNamedEntity() {
    if (this.decodeMode === DecodingMode.Strict || this.runLength < 2) return 0;
    const packed = findBufferedLegacySlot(this.nameBuffer, this.runLength);
    if (packed < 0) return 0;
    if (this.decodeMode === DecodingMode.Attribute && (packed & 7) < this.runLength) return 0;
    this.consumed = (packed & 7) + 1;
    this.emitSlot(packed >> 3);
    this.errors?.missingSemicolonAfterCharacterReference();
    return this.consumed;
  }
};
/**
 * Find a buffered name. Its characters were already checked as ASCII
 * alphanumerics while scanning, so no outer-character range check is needed.
 * @param buffer Reusable character buffer.
 * @param length Number of characters to match.
 */
function findBufferedHtmlSlot(buffer, length) {
  const key =
    (buffer[0] << 25) |
    (buffer[1] << 18) |
    (buffer[length - 2] << 11) |
    (CHAR_REMAP[buffer[length - 1]] << 5) |
    length;
  let slot = 2 * (((Math.imul(key, BUCKET_HASH_1) >>> 16) * htmlBuckets) >>> 16);
  for (let attempt = 0; ; attempt++) {
    if (htmlKeys[slot] === key && (length <= 4 || isBufferedMiddle(slot, buffer, length)))
      return slot;
    if (htmlKeys[slot + 1] === key && (length <= 4 || isBufferedMiddle(slot + 1, buffer, length)))
      return slot + 1;
    if (attempt === 1) return -1;
    slot = 2 * (((Math.imul(key, BUCKET_HASH_2) >>> 16) * htmlBuckets) >>> 16);
  }
}
function isBufferedMiddle(slot, buffer, length) {
  let wordIndex = htmlSlotMidOff[slot];
  let index = 2;
  const end = length - 2;
  while (index + 1 < end) {
    if ((buffer[index] | (buffer[index + 1] << 16)) !== htmlMiddles[wordIndex++]) return false;
    index += 2;
  }
  return index === end || buffer[index] === (htmlMiddles[wordIndex] & 65535);
}
/**
 * Find the longest legacy name in the buffer, packed as `(slot << 3) | length`.
 * @param buffer Reusable character buffer.
 * @param length Number of buffered characters.
 */
function findBufferedLegacySlot(buffer, length) {
  let legacy = (htmlLengthBits[pairIndex(buffer[0], buffer[1])] >>> 16) & 31;
  while (legacy !== 0) {
    const top = 31 - Math.clz32(legacy);
    legacy ^= 1 << top;
    if (top + 2 > length) continue;
    const slot = findBufferedHtmlSlot(buffer, top + 2);
    if (slot >= 0 && (htmlSlotValue[slot] & 2) !== 0) return (slot << 3) | (top + 2);
  }
  return -1;
}
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/common/html.js
/** All valid namespaces in HTML. */
var NS;
(function (NS) {
  NS["HTML"] = "http://www.w3.org/1999/xhtml";
  NS["MATHML"] = "http://www.w3.org/1998/Math/MathML";
  NS["SVG"] = "http://www.w3.org/2000/svg";
  NS["XLINK"] = "http://www.w3.org/1999/xlink";
  NS["XML"] = "http://www.w3.org/XML/1998/namespace";
  NS["XMLNS"] = "http://www.w3.org/2000/xmlns/";
})(NS || (NS = {}));
var ATTRS;
(function (ATTRS) {
  ATTRS["TYPE"] = "type";
  ATTRS["ACTION"] = "action";
  ATTRS["ENCODING"] = "encoding";
  ATTRS["PROMPT"] = "prompt";
  ATTRS["NAME"] = "name";
  ATTRS["COLOR"] = "color";
  ATTRS["FACE"] = "face";
  ATTRS["SIZE"] = "size";
})(ATTRS || (ATTRS = {}));
/**
 * The mode of the document.
 *
 * @see {@link https://dom.spec.whatwg.org/#concept-document-limited-quirks}
 */
var DOCUMENT_MODE;
(function (DOCUMENT_MODE) {
  DOCUMENT_MODE["NO_QUIRKS"] = "no-quirks";
  DOCUMENT_MODE["QUIRKS"] = "quirks";
  DOCUMENT_MODE["LIMITED_QUIRKS"] = "limited-quirks";
})(DOCUMENT_MODE || (DOCUMENT_MODE = {}));
var TAG_NAMES;
(function (TAG_NAMES) {
  TAG_NAMES["A"] = "a";
  TAG_NAMES["ADDRESS"] = "address";
  TAG_NAMES["ANNOTATION_XML"] = "annotation-xml";
  TAG_NAMES["APPLET"] = "applet";
  TAG_NAMES["AREA"] = "area";
  TAG_NAMES["ARTICLE"] = "article";
  TAG_NAMES["ASIDE"] = "aside";
  TAG_NAMES["B"] = "b";
  TAG_NAMES["BASE"] = "base";
  TAG_NAMES["BASEFONT"] = "basefont";
  TAG_NAMES["BGSOUND"] = "bgsound";
  TAG_NAMES["BIG"] = "big";
  TAG_NAMES["BLOCKQUOTE"] = "blockquote";
  TAG_NAMES["BODY"] = "body";
  TAG_NAMES["BR"] = "br";
  TAG_NAMES["BUTTON"] = "button";
  TAG_NAMES["CAPTION"] = "caption";
  TAG_NAMES["CENTER"] = "center";
  TAG_NAMES["CODE"] = "code";
  TAG_NAMES["COL"] = "col";
  TAG_NAMES["COLGROUP"] = "colgroup";
  TAG_NAMES["DD"] = "dd";
  TAG_NAMES["DESC"] = "desc";
  TAG_NAMES["DETAILS"] = "details";
  TAG_NAMES["DIALOG"] = "dialog";
  TAG_NAMES["DIR"] = "dir";
  TAG_NAMES["DIV"] = "div";
  TAG_NAMES["DL"] = "dl";
  TAG_NAMES["DT"] = "dt";
  TAG_NAMES["EM"] = "em";
  TAG_NAMES["EMBED"] = "embed";
  TAG_NAMES["FIELDSET"] = "fieldset";
  TAG_NAMES["FIGCAPTION"] = "figcaption";
  TAG_NAMES["FIGURE"] = "figure";
  TAG_NAMES["FONT"] = "font";
  TAG_NAMES["FOOTER"] = "footer";
  TAG_NAMES["FOREIGN_OBJECT"] = "foreignObject";
  TAG_NAMES["FORM"] = "form";
  TAG_NAMES["FRAME"] = "frame";
  TAG_NAMES["FRAMESET"] = "frameset";
  TAG_NAMES["H1"] = "h1";
  TAG_NAMES["H2"] = "h2";
  TAG_NAMES["H3"] = "h3";
  TAG_NAMES["H4"] = "h4";
  TAG_NAMES["H5"] = "h5";
  TAG_NAMES["H6"] = "h6";
  TAG_NAMES["HEAD"] = "head";
  TAG_NAMES["HEADER"] = "header";
  TAG_NAMES["HGROUP"] = "hgroup";
  TAG_NAMES["HR"] = "hr";
  TAG_NAMES["HTML"] = "html";
  TAG_NAMES["I"] = "i";
  TAG_NAMES["IMG"] = "img";
  TAG_NAMES["IMAGE"] = "image";
  TAG_NAMES["INPUT"] = "input";
  TAG_NAMES["IFRAME"] = "iframe";
  TAG_NAMES["KEYGEN"] = "keygen";
  TAG_NAMES["LABEL"] = "label";
  TAG_NAMES["LI"] = "li";
  TAG_NAMES["LINK"] = "link";
  TAG_NAMES["LISTING"] = "listing";
  TAG_NAMES["MAIN"] = "main";
  TAG_NAMES["MALIGNMARK"] = "malignmark";
  TAG_NAMES["MARQUEE"] = "marquee";
  TAG_NAMES["MATH"] = "math";
  TAG_NAMES["MENU"] = "menu";
  TAG_NAMES["META"] = "meta";
  TAG_NAMES["MGLYPH"] = "mglyph";
  TAG_NAMES["MI"] = "mi";
  TAG_NAMES["MO"] = "mo";
  TAG_NAMES["MN"] = "mn";
  TAG_NAMES["MS"] = "ms";
  TAG_NAMES["MTEXT"] = "mtext";
  TAG_NAMES["NAV"] = "nav";
  TAG_NAMES["NOBR"] = "nobr";
  TAG_NAMES["NOFRAMES"] = "noframes";
  TAG_NAMES["NOEMBED"] = "noembed";
  TAG_NAMES["NOSCRIPT"] = "noscript";
  TAG_NAMES["OBJECT"] = "object";
  TAG_NAMES["OL"] = "ol";
  TAG_NAMES["OPTGROUP"] = "optgroup";
  TAG_NAMES["OPTION"] = "option";
  TAG_NAMES["P"] = "p";
  TAG_NAMES["PARAM"] = "param";
  TAG_NAMES["PLAINTEXT"] = "plaintext";
  TAG_NAMES["PRE"] = "pre";
  TAG_NAMES["RB"] = "rb";
  TAG_NAMES["RP"] = "rp";
  TAG_NAMES["RT"] = "rt";
  TAG_NAMES["RTC"] = "rtc";
  TAG_NAMES["RUBY"] = "ruby";
  TAG_NAMES["S"] = "s";
  TAG_NAMES["SCRIPT"] = "script";
  TAG_NAMES["SEARCH"] = "search";
  TAG_NAMES["SECTION"] = "section";
  TAG_NAMES["SELECT"] = "select";
  TAG_NAMES["SOURCE"] = "source";
  TAG_NAMES["SMALL"] = "small";
  TAG_NAMES["SPAN"] = "span";
  TAG_NAMES["STRIKE"] = "strike";
  TAG_NAMES["STRONG"] = "strong";
  TAG_NAMES["STYLE"] = "style";
  TAG_NAMES["SUB"] = "sub";
  TAG_NAMES["SUMMARY"] = "summary";
  TAG_NAMES["SUP"] = "sup";
  TAG_NAMES["TABLE"] = "table";
  TAG_NAMES["TBODY"] = "tbody";
  TAG_NAMES["TEMPLATE"] = "template";
  TAG_NAMES["TEXTAREA"] = "textarea";
  TAG_NAMES["TFOOT"] = "tfoot";
  TAG_NAMES["TD"] = "td";
  TAG_NAMES["TH"] = "th";
  TAG_NAMES["THEAD"] = "thead";
  TAG_NAMES["TITLE"] = "title";
  TAG_NAMES["TR"] = "tr";
  TAG_NAMES["TRACK"] = "track";
  TAG_NAMES["TT"] = "tt";
  TAG_NAMES["U"] = "u";
  TAG_NAMES["UL"] = "ul";
  TAG_NAMES["SVG"] = "svg";
  TAG_NAMES["VAR"] = "var";
  TAG_NAMES["WBR"] = "wbr";
  TAG_NAMES["XMP"] = "xmp";
})(TAG_NAMES || (TAG_NAMES = {}));
/**
 * Tag IDs are numeric IDs for known tag names.
 *
 * We use tag IDs to improve the performance of tag name comparisons.
 */
var TAG_ID;
(function (TAG_ID) {
  TAG_ID[(TAG_ID["UNKNOWN"] = 0)] = "UNKNOWN";
  TAG_ID[(TAG_ID["A"] = 1)] = "A";
  TAG_ID[(TAG_ID["ADDRESS"] = 2)] = "ADDRESS";
  TAG_ID[(TAG_ID["ANNOTATION_XML"] = 3)] = "ANNOTATION_XML";
  TAG_ID[(TAG_ID["APPLET"] = 4)] = "APPLET";
  TAG_ID[(TAG_ID["AREA"] = 5)] = "AREA";
  TAG_ID[(TAG_ID["ARTICLE"] = 6)] = "ARTICLE";
  TAG_ID[(TAG_ID["ASIDE"] = 7)] = "ASIDE";
  TAG_ID[(TAG_ID["B"] = 8)] = "B";
  TAG_ID[(TAG_ID["BASE"] = 9)] = "BASE";
  TAG_ID[(TAG_ID["BASEFONT"] = 10)] = "BASEFONT";
  TAG_ID[(TAG_ID["BGSOUND"] = 11)] = "BGSOUND";
  TAG_ID[(TAG_ID["BIG"] = 12)] = "BIG";
  TAG_ID[(TAG_ID["BLOCKQUOTE"] = 13)] = "BLOCKQUOTE";
  TAG_ID[(TAG_ID["BODY"] = 14)] = "BODY";
  TAG_ID[(TAG_ID["BR"] = 15)] = "BR";
  TAG_ID[(TAG_ID["BUTTON"] = 16)] = "BUTTON";
  TAG_ID[(TAG_ID["CAPTION"] = 17)] = "CAPTION";
  TAG_ID[(TAG_ID["CENTER"] = 18)] = "CENTER";
  TAG_ID[(TAG_ID["CODE"] = 19)] = "CODE";
  TAG_ID[(TAG_ID["COL"] = 20)] = "COL";
  TAG_ID[(TAG_ID["COLGROUP"] = 21)] = "COLGROUP";
  TAG_ID[(TAG_ID["DD"] = 22)] = "DD";
  TAG_ID[(TAG_ID["DESC"] = 23)] = "DESC";
  TAG_ID[(TAG_ID["DETAILS"] = 24)] = "DETAILS";
  TAG_ID[(TAG_ID["DIALOG"] = 25)] = "DIALOG";
  TAG_ID[(TAG_ID["DIR"] = 26)] = "DIR";
  TAG_ID[(TAG_ID["DIV"] = 27)] = "DIV";
  TAG_ID[(TAG_ID["DL"] = 28)] = "DL";
  TAG_ID[(TAG_ID["DT"] = 29)] = "DT";
  TAG_ID[(TAG_ID["EM"] = 30)] = "EM";
  TAG_ID[(TAG_ID["EMBED"] = 31)] = "EMBED";
  TAG_ID[(TAG_ID["FIELDSET"] = 32)] = "FIELDSET";
  TAG_ID[(TAG_ID["FIGCAPTION"] = 33)] = "FIGCAPTION";
  TAG_ID[(TAG_ID["FIGURE"] = 34)] = "FIGURE";
  TAG_ID[(TAG_ID["FONT"] = 35)] = "FONT";
  TAG_ID[(TAG_ID["FOOTER"] = 36)] = "FOOTER";
  TAG_ID[(TAG_ID["FOREIGN_OBJECT"] = 37)] = "FOREIGN_OBJECT";
  TAG_ID[(TAG_ID["FORM"] = 38)] = "FORM";
  TAG_ID[(TAG_ID["FRAME"] = 39)] = "FRAME";
  TAG_ID[(TAG_ID["FRAMESET"] = 40)] = "FRAMESET";
  TAG_ID[(TAG_ID["H1"] = 41)] = "H1";
  TAG_ID[(TAG_ID["H2"] = 42)] = "H2";
  TAG_ID[(TAG_ID["H3"] = 43)] = "H3";
  TAG_ID[(TAG_ID["H4"] = 44)] = "H4";
  TAG_ID[(TAG_ID["H5"] = 45)] = "H5";
  TAG_ID[(TAG_ID["H6"] = 46)] = "H6";
  TAG_ID[(TAG_ID["HEAD"] = 47)] = "HEAD";
  TAG_ID[(TAG_ID["HEADER"] = 48)] = "HEADER";
  TAG_ID[(TAG_ID["HGROUP"] = 49)] = "HGROUP";
  TAG_ID[(TAG_ID["HR"] = 50)] = "HR";
  TAG_ID[(TAG_ID["HTML"] = 51)] = "HTML";
  TAG_ID[(TAG_ID["I"] = 52)] = "I";
  TAG_ID[(TAG_ID["IMG"] = 53)] = "IMG";
  TAG_ID[(TAG_ID["IMAGE"] = 54)] = "IMAGE";
  TAG_ID[(TAG_ID["INPUT"] = 55)] = "INPUT";
  TAG_ID[(TAG_ID["IFRAME"] = 56)] = "IFRAME";
  TAG_ID[(TAG_ID["KEYGEN"] = 57)] = "KEYGEN";
  TAG_ID[(TAG_ID["LABEL"] = 58)] = "LABEL";
  TAG_ID[(TAG_ID["LI"] = 59)] = "LI";
  TAG_ID[(TAG_ID["LINK"] = 60)] = "LINK";
  TAG_ID[(TAG_ID["LISTING"] = 61)] = "LISTING";
  TAG_ID[(TAG_ID["MAIN"] = 62)] = "MAIN";
  TAG_ID[(TAG_ID["MALIGNMARK"] = 63)] = "MALIGNMARK";
  TAG_ID[(TAG_ID["MARQUEE"] = 64)] = "MARQUEE";
  TAG_ID[(TAG_ID["MATH"] = 65)] = "MATH";
  TAG_ID[(TAG_ID["MENU"] = 66)] = "MENU";
  TAG_ID[(TAG_ID["META"] = 67)] = "META";
  TAG_ID[(TAG_ID["MGLYPH"] = 68)] = "MGLYPH";
  TAG_ID[(TAG_ID["MI"] = 69)] = "MI";
  TAG_ID[(TAG_ID["MO"] = 70)] = "MO";
  TAG_ID[(TAG_ID["MN"] = 71)] = "MN";
  TAG_ID[(TAG_ID["MS"] = 72)] = "MS";
  TAG_ID[(TAG_ID["MTEXT"] = 73)] = "MTEXT";
  TAG_ID[(TAG_ID["NAV"] = 74)] = "NAV";
  TAG_ID[(TAG_ID["NOBR"] = 75)] = "NOBR";
  TAG_ID[(TAG_ID["NOFRAMES"] = 76)] = "NOFRAMES";
  TAG_ID[(TAG_ID["NOEMBED"] = 77)] = "NOEMBED";
  TAG_ID[(TAG_ID["NOSCRIPT"] = 78)] = "NOSCRIPT";
  TAG_ID[(TAG_ID["OBJECT"] = 79)] = "OBJECT";
  TAG_ID[(TAG_ID["OL"] = 80)] = "OL";
  TAG_ID[(TAG_ID["OPTGROUP"] = 81)] = "OPTGROUP";
  TAG_ID[(TAG_ID["OPTION"] = 82)] = "OPTION";
  TAG_ID[(TAG_ID["P"] = 83)] = "P";
  TAG_ID[(TAG_ID["PARAM"] = 84)] = "PARAM";
  TAG_ID[(TAG_ID["PLAINTEXT"] = 85)] = "PLAINTEXT";
  TAG_ID[(TAG_ID["PRE"] = 86)] = "PRE";
  TAG_ID[(TAG_ID["RB"] = 87)] = "RB";
  TAG_ID[(TAG_ID["RP"] = 88)] = "RP";
  TAG_ID[(TAG_ID["RT"] = 89)] = "RT";
  TAG_ID[(TAG_ID["RTC"] = 90)] = "RTC";
  TAG_ID[(TAG_ID["RUBY"] = 91)] = "RUBY";
  TAG_ID[(TAG_ID["S"] = 92)] = "S";
  TAG_ID[(TAG_ID["SCRIPT"] = 93)] = "SCRIPT";
  TAG_ID[(TAG_ID["SEARCH"] = 94)] = "SEARCH";
  TAG_ID[(TAG_ID["SECTION"] = 95)] = "SECTION";
  TAG_ID[(TAG_ID["SELECT"] = 96)] = "SELECT";
  TAG_ID[(TAG_ID["SOURCE"] = 97)] = "SOURCE";
  TAG_ID[(TAG_ID["SMALL"] = 98)] = "SMALL";
  TAG_ID[(TAG_ID["SPAN"] = 99)] = "SPAN";
  TAG_ID[(TAG_ID["STRIKE"] = 100)] = "STRIKE";
  TAG_ID[(TAG_ID["STRONG"] = 101)] = "STRONG";
  TAG_ID[(TAG_ID["STYLE"] = 102)] = "STYLE";
  TAG_ID[(TAG_ID["SUB"] = 103)] = "SUB";
  TAG_ID[(TAG_ID["SUMMARY"] = 104)] = "SUMMARY";
  TAG_ID[(TAG_ID["SUP"] = 105)] = "SUP";
  TAG_ID[(TAG_ID["TABLE"] = 106)] = "TABLE";
  TAG_ID[(TAG_ID["TBODY"] = 107)] = "TBODY";
  TAG_ID[(TAG_ID["TEMPLATE"] = 108)] = "TEMPLATE";
  TAG_ID[(TAG_ID["TEXTAREA"] = 109)] = "TEXTAREA";
  TAG_ID[(TAG_ID["TFOOT"] = 110)] = "TFOOT";
  TAG_ID[(TAG_ID["TD"] = 111)] = "TD";
  TAG_ID[(TAG_ID["TH"] = 112)] = "TH";
  TAG_ID[(TAG_ID["THEAD"] = 113)] = "THEAD";
  TAG_ID[(TAG_ID["TITLE"] = 114)] = "TITLE";
  TAG_ID[(TAG_ID["TR"] = 115)] = "TR";
  TAG_ID[(TAG_ID["TRACK"] = 116)] = "TRACK";
  TAG_ID[(TAG_ID["TT"] = 117)] = "TT";
  TAG_ID[(TAG_ID["U"] = 118)] = "U";
  TAG_ID[(TAG_ID["UL"] = 119)] = "UL";
  TAG_ID[(TAG_ID["SVG"] = 120)] = "SVG";
  TAG_ID[(TAG_ID["VAR"] = 121)] = "VAR";
  TAG_ID[(TAG_ID["WBR"] = 122)] = "WBR";
  TAG_ID[(TAG_ID["XMP"] = 123)] = "XMP";
})(TAG_ID || (TAG_ID = {}));
const TAG_NAME_TO_ID = /* @__PURE__ */ new Map([
  [TAG_NAMES.A, TAG_ID.A],
  [TAG_NAMES.ADDRESS, TAG_ID.ADDRESS],
  [TAG_NAMES.ANNOTATION_XML, TAG_ID.ANNOTATION_XML],
  [TAG_NAMES.APPLET, TAG_ID.APPLET],
  [TAG_NAMES.AREA, TAG_ID.AREA],
  [TAG_NAMES.ARTICLE, TAG_ID.ARTICLE],
  [TAG_NAMES.ASIDE, TAG_ID.ASIDE],
  [TAG_NAMES.B, TAG_ID.B],
  [TAG_NAMES.BASE, TAG_ID.BASE],
  [TAG_NAMES.BASEFONT, TAG_ID.BASEFONT],
  [TAG_NAMES.BGSOUND, TAG_ID.BGSOUND],
  [TAG_NAMES.BIG, TAG_ID.BIG],
  [TAG_NAMES.BLOCKQUOTE, TAG_ID.BLOCKQUOTE],
  [TAG_NAMES.BODY, TAG_ID.BODY],
  [TAG_NAMES.BR, TAG_ID.BR],
  [TAG_NAMES.BUTTON, TAG_ID.BUTTON],
  [TAG_NAMES.CAPTION, TAG_ID.CAPTION],
  [TAG_NAMES.CENTER, TAG_ID.CENTER],
  [TAG_NAMES.CODE, TAG_ID.CODE],
  [TAG_NAMES.COL, TAG_ID.COL],
  [TAG_NAMES.COLGROUP, TAG_ID.COLGROUP],
  [TAG_NAMES.DD, TAG_ID.DD],
  [TAG_NAMES.DESC, TAG_ID.DESC],
  [TAG_NAMES.DETAILS, TAG_ID.DETAILS],
  [TAG_NAMES.DIALOG, TAG_ID.DIALOG],
  [TAG_NAMES.DIR, TAG_ID.DIR],
  [TAG_NAMES.DIV, TAG_ID.DIV],
  [TAG_NAMES.DL, TAG_ID.DL],
  [TAG_NAMES.DT, TAG_ID.DT],
  [TAG_NAMES.EM, TAG_ID.EM],
  [TAG_NAMES.EMBED, TAG_ID.EMBED],
  [TAG_NAMES.FIELDSET, TAG_ID.FIELDSET],
  [TAG_NAMES.FIGCAPTION, TAG_ID.FIGCAPTION],
  [TAG_NAMES.FIGURE, TAG_ID.FIGURE],
  [TAG_NAMES.FONT, TAG_ID.FONT],
  [TAG_NAMES.FOOTER, TAG_ID.FOOTER],
  [TAG_NAMES.FOREIGN_OBJECT, TAG_ID.FOREIGN_OBJECT],
  [TAG_NAMES.FORM, TAG_ID.FORM],
  [TAG_NAMES.FRAME, TAG_ID.FRAME],
  [TAG_NAMES.FRAMESET, TAG_ID.FRAMESET],
  [TAG_NAMES.H1, TAG_ID.H1],
  [TAG_NAMES.H2, TAG_ID.H2],
  [TAG_NAMES.H3, TAG_ID.H3],
  [TAG_NAMES.H4, TAG_ID.H4],
  [TAG_NAMES.H5, TAG_ID.H5],
  [TAG_NAMES.H6, TAG_ID.H6],
  [TAG_NAMES.HEAD, TAG_ID.HEAD],
  [TAG_NAMES.HEADER, TAG_ID.HEADER],
  [TAG_NAMES.HGROUP, TAG_ID.HGROUP],
  [TAG_NAMES.HR, TAG_ID.HR],
  [TAG_NAMES.HTML, TAG_ID.HTML],
  [TAG_NAMES.I, TAG_ID.I],
  [TAG_NAMES.IMG, TAG_ID.IMG],
  [TAG_NAMES.IMAGE, TAG_ID.IMAGE],
  [TAG_NAMES.INPUT, TAG_ID.INPUT],
  [TAG_NAMES.IFRAME, TAG_ID.IFRAME],
  [TAG_NAMES.KEYGEN, TAG_ID.KEYGEN],
  [TAG_NAMES.LABEL, TAG_ID.LABEL],
  [TAG_NAMES.LI, TAG_ID.LI],
  [TAG_NAMES.LINK, TAG_ID.LINK],
  [TAG_NAMES.LISTING, TAG_ID.LISTING],
  [TAG_NAMES.MAIN, TAG_ID.MAIN],
  [TAG_NAMES.MALIGNMARK, TAG_ID.MALIGNMARK],
  [TAG_NAMES.MARQUEE, TAG_ID.MARQUEE],
  [TAG_NAMES.MATH, TAG_ID.MATH],
  [TAG_NAMES.MENU, TAG_ID.MENU],
  [TAG_NAMES.META, TAG_ID.META],
  [TAG_NAMES.MGLYPH, TAG_ID.MGLYPH],
  [TAG_NAMES.MI, TAG_ID.MI],
  [TAG_NAMES.MO, TAG_ID.MO],
  [TAG_NAMES.MN, TAG_ID.MN],
  [TAG_NAMES.MS, TAG_ID.MS],
  [TAG_NAMES.MTEXT, TAG_ID.MTEXT],
  [TAG_NAMES.NAV, TAG_ID.NAV],
  [TAG_NAMES.NOBR, TAG_ID.NOBR],
  [TAG_NAMES.NOFRAMES, TAG_ID.NOFRAMES],
  [TAG_NAMES.NOEMBED, TAG_ID.NOEMBED],
  [TAG_NAMES.NOSCRIPT, TAG_ID.NOSCRIPT],
  [TAG_NAMES.OBJECT, TAG_ID.OBJECT],
  [TAG_NAMES.OL, TAG_ID.OL],
  [TAG_NAMES.OPTGROUP, TAG_ID.OPTGROUP],
  [TAG_NAMES.OPTION, TAG_ID.OPTION],
  [TAG_NAMES.P, TAG_ID.P],
  [TAG_NAMES.PARAM, TAG_ID.PARAM],
  [TAG_NAMES.PLAINTEXT, TAG_ID.PLAINTEXT],
  [TAG_NAMES.PRE, TAG_ID.PRE],
  [TAG_NAMES.RB, TAG_ID.RB],
  [TAG_NAMES.RP, TAG_ID.RP],
  [TAG_NAMES.RT, TAG_ID.RT],
  [TAG_NAMES.RTC, TAG_ID.RTC],
  [TAG_NAMES.RUBY, TAG_ID.RUBY],
  [TAG_NAMES.S, TAG_ID.S],
  [TAG_NAMES.SCRIPT, TAG_ID.SCRIPT],
  [TAG_NAMES.SEARCH, TAG_ID.SEARCH],
  [TAG_NAMES.SECTION, TAG_ID.SECTION],
  [TAG_NAMES.SELECT, TAG_ID.SELECT],
  [TAG_NAMES.SOURCE, TAG_ID.SOURCE],
  [TAG_NAMES.SMALL, TAG_ID.SMALL],
  [TAG_NAMES.SPAN, TAG_ID.SPAN],
  [TAG_NAMES.STRIKE, TAG_ID.STRIKE],
  [TAG_NAMES.STRONG, TAG_ID.STRONG],
  [TAG_NAMES.STYLE, TAG_ID.STYLE],
  [TAG_NAMES.SUB, TAG_ID.SUB],
  [TAG_NAMES.SUMMARY, TAG_ID.SUMMARY],
  [TAG_NAMES.SUP, TAG_ID.SUP],
  [TAG_NAMES.TABLE, TAG_ID.TABLE],
  [TAG_NAMES.TBODY, TAG_ID.TBODY],
  [TAG_NAMES.TEMPLATE, TAG_ID.TEMPLATE],
  [TAG_NAMES.TEXTAREA, TAG_ID.TEXTAREA],
  [TAG_NAMES.TFOOT, TAG_ID.TFOOT],
  [TAG_NAMES.TD, TAG_ID.TD],
  [TAG_NAMES.TH, TAG_ID.TH],
  [TAG_NAMES.THEAD, TAG_ID.THEAD],
  [TAG_NAMES.TITLE, TAG_ID.TITLE],
  [TAG_NAMES.TR, TAG_ID.TR],
  [TAG_NAMES.TRACK, TAG_ID.TRACK],
  [TAG_NAMES.TT, TAG_ID.TT],
  [TAG_NAMES.U, TAG_ID.U],
  [TAG_NAMES.UL, TAG_ID.UL],
  [TAG_NAMES.SVG, TAG_ID.SVG],
  [TAG_NAMES.VAR, TAG_ID.VAR],
  [TAG_NAMES.WBR, TAG_ID.WBR],
  [TAG_NAMES.XMP, TAG_ID.XMP],
]);
function getTagID(tagName) {
  var _a;
  return (_a = TAG_NAME_TO_ID.get(tagName)) !== null && _a !== void 0 ? _a : TAG_ID.UNKNOWN;
}
const $ = TAG_ID;
const SPECIAL_ELEMENTS = {
  [NS.HTML]: /* @__PURE__ */ new Set([
    $.ADDRESS,
    $.APPLET,
    $.AREA,
    $.ARTICLE,
    $.ASIDE,
    $.BASE,
    $.BASEFONT,
    $.BGSOUND,
    $.BLOCKQUOTE,
    $.BODY,
    $.BR,
    $.BUTTON,
    $.CAPTION,
    $.CENTER,
    $.COL,
    $.COLGROUP,
    $.DD,
    $.DETAILS,
    $.DIR,
    $.DIV,
    $.DL,
    $.DT,
    $.EMBED,
    $.FIELDSET,
    $.FIGCAPTION,
    $.FIGURE,
    $.FOOTER,
    $.FORM,
    $.FRAME,
    $.FRAMESET,
    $.H1,
    $.H2,
    $.H3,
    $.H4,
    $.H5,
    $.H6,
    $.HEAD,
    $.HEADER,
    $.HGROUP,
    $.HR,
    $.HTML,
    $.IFRAME,
    $.IMG,
    $.INPUT,
    $.LI,
    $.LINK,
    $.LISTING,
    $.MAIN,
    $.MARQUEE,
    $.MENU,
    $.META,
    $.NAV,
    $.NOEMBED,
    $.NOFRAMES,
    $.NOSCRIPT,
    $.OBJECT,
    $.OL,
    $.P,
    $.PARAM,
    $.PLAINTEXT,
    $.PRE,
    $.SCRIPT,
    $.SECTION,
    $.SELECT,
    $.SOURCE,
    $.STYLE,
    $.SUMMARY,
    $.TABLE,
    $.TBODY,
    $.TD,
    $.TEMPLATE,
    $.TEXTAREA,
    $.TFOOT,
    $.TH,
    $.THEAD,
    $.TITLE,
    $.TR,
    $.TRACK,
    $.UL,
    $.WBR,
    $.XMP,
  ]),
  [NS.MATHML]: /* @__PURE__ */ new Set([$.MI, $.MO, $.MN, $.MS, $.MTEXT, $.ANNOTATION_XML]),
  [NS.SVG]: /* @__PURE__ */ new Set([$.TITLE, $.FOREIGN_OBJECT, $.DESC]),
  [NS.XLINK]: /* @__PURE__ */ new Set(),
  [NS.XML]: /* @__PURE__ */ new Set(),
  [NS.XMLNS]: /* @__PURE__ */ new Set(),
};
const NUMBERED_HEADERS = /* @__PURE__ */ new Set([$.H1, $.H2, $.H3, $.H4, $.H5, $.H6]);
(TAG_NAMES.STYLE,
  TAG_NAMES.SCRIPT,
  TAG_NAMES.XMP,
  TAG_NAMES.IFRAME,
  TAG_NAMES.NOEMBED,
  TAG_NAMES.NOFRAMES,
  TAG_NAMES.PLAINTEXT);
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/tokenizer/index.js
var State;
(function (State) {
  State[(State["DATA"] = 0)] = "DATA";
  State[(State["RCDATA"] = 1)] = "RCDATA";
  State[(State["RAWTEXT"] = 2)] = "RAWTEXT";
  State[(State["SCRIPT_DATA"] = 3)] = "SCRIPT_DATA";
  State[(State["PLAINTEXT"] = 4)] = "PLAINTEXT";
  State[(State["TAG_OPEN"] = 5)] = "TAG_OPEN";
  State[(State["END_TAG_OPEN"] = 6)] = "END_TAG_OPEN";
  State[(State["TAG_NAME"] = 7)] = "TAG_NAME";
  State[(State["RCDATA_LESS_THAN_SIGN"] = 8)] = "RCDATA_LESS_THAN_SIGN";
  State[(State["RCDATA_END_TAG_OPEN"] = 9)] = "RCDATA_END_TAG_OPEN";
  State[(State["RCDATA_END_TAG_NAME"] = 10)] = "RCDATA_END_TAG_NAME";
  State[(State["RAWTEXT_LESS_THAN_SIGN"] = 11)] = "RAWTEXT_LESS_THAN_SIGN";
  State[(State["RAWTEXT_END_TAG_OPEN"] = 12)] = "RAWTEXT_END_TAG_OPEN";
  State[(State["RAWTEXT_END_TAG_NAME"] = 13)] = "RAWTEXT_END_TAG_NAME";
  State[(State["SCRIPT_DATA_LESS_THAN_SIGN"] = 14)] = "SCRIPT_DATA_LESS_THAN_SIGN";
  State[(State["SCRIPT_DATA_END_TAG_OPEN"] = 15)] = "SCRIPT_DATA_END_TAG_OPEN";
  State[(State["SCRIPT_DATA_END_TAG_NAME"] = 16)] = "SCRIPT_DATA_END_TAG_NAME";
  State[(State["SCRIPT_DATA_ESCAPE_START"] = 17)] = "SCRIPT_DATA_ESCAPE_START";
  State[(State["SCRIPT_DATA_ESCAPE_START_DASH"] = 18)] = "SCRIPT_DATA_ESCAPE_START_DASH";
  State[(State["SCRIPT_DATA_ESCAPED"] = 19)] = "SCRIPT_DATA_ESCAPED";
  State[(State["SCRIPT_DATA_ESCAPED_DASH"] = 20)] = "SCRIPT_DATA_ESCAPED_DASH";
  State[(State["SCRIPT_DATA_ESCAPED_DASH_DASH"] = 21)] = "SCRIPT_DATA_ESCAPED_DASH_DASH";
  State[(State["SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN"] = 22)] = "SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN";
  State[(State["SCRIPT_DATA_ESCAPED_END_TAG_OPEN"] = 23)] = "SCRIPT_DATA_ESCAPED_END_TAG_OPEN";
  State[(State["SCRIPT_DATA_ESCAPED_END_TAG_NAME"] = 24)] = "SCRIPT_DATA_ESCAPED_END_TAG_NAME";
  State[(State["SCRIPT_DATA_DOUBLE_ESCAPE_START"] = 25)] = "SCRIPT_DATA_DOUBLE_ESCAPE_START";
  State[(State["SCRIPT_DATA_DOUBLE_ESCAPED"] = 26)] = "SCRIPT_DATA_DOUBLE_ESCAPED";
  State[(State["SCRIPT_DATA_DOUBLE_ESCAPED_DASH"] = 27)] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH";
  State[(State["SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH"] = 28)] =
    "SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH";
  State[(State["SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN"] = 29)] =
    "SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN";
  State[(State["SCRIPT_DATA_DOUBLE_ESCAPE_END"] = 30)] = "SCRIPT_DATA_DOUBLE_ESCAPE_END";
  State[(State["BEFORE_ATTRIBUTE_NAME"] = 31)] = "BEFORE_ATTRIBUTE_NAME";
  State[(State["ATTRIBUTE_NAME"] = 32)] = "ATTRIBUTE_NAME";
  State[(State["AFTER_ATTRIBUTE_NAME"] = 33)] = "AFTER_ATTRIBUTE_NAME";
  State[(State["BEFORE_ATTRIBUTE_VALUE"] = 34)] = "BEFORE_ATTRIBUTE_VALUE";
  State[(State["ATTRIBUTE_VALUE_DOUBLE_QUOTED"] = 35)] = "ATTRIBUTE_VALUE_DOUBLE_QUOTED";
  State[(State["ATTRIBUTE_VALUE_SINGLE_QUOTED"] = 36)] = "ATTRIBUTE_VALUE_SINGLE_QUOTED";
  State[(State["ATTRIBUTE_VALUE_UNQUOTED"] = 37)] = "ATTRIBUTE_VALUE_UNQUOTED";
  State[(State["AFTER_ATTRIBUTE_VALUE_QUOTED"] = 38)] = "AFTER_ATTRIBUTE_VALUE_QUOTED";
  State[(State["SELF_CLOSING_START_TAG"] = 39)] = "SELF_CLOSING_START_TAG";
  State[(State["BOGUS_COMMENT"] = 40)] = "BOGUS_COMMENT";
  State[(State["MARKUP_DECLARATION_OPEN"] = 41)] = "MARKUP_DECLARATION_OPEN";
  State[(State["COMMENT_START"] = 42)] = "COMMENT_START";
  State[(State["COMMENT_START_DASH"] = 43)] = "COMMENT_START_DASH";
  State[(State["COMMENT"] = 44)] = "COMMENT";
  State[(State["COMMENT_LESS_THAN_SIGN"] = 45)] = "COMMENT_LESS_THAN_SIGN";
  State[(State["COMMENT_LESS_THAN_SIGN_BANG"] = 46)] = "COMMENT_LESS_THAN_SIGN_BANG";
  State[(State["COMMENT_LESS_THAN_SIGN_BANG_DASH"] = 47)] = "COMMENT_LESS_THAN_SIGN_BANG_DASH";
  State[(State["COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH"] = 48)] =
    "COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH";
  State[(State["COMMENT_END_DASH"] = 49)] = "COMMENT_END_DASH";
  State[(State["COMMENT_END"] = 50)] = "COMMENT_END";
  State[(State["COMMENT_END_BANG"] = 51)] = "COMMENT_END_BANG";
  State[(State["DOCTYPE"] = 52)] = "DOCTYPE";
  State[(State["BEFORE_DOCTYPE_NAME"] = 53)] = "BEFORE_DOCTYPE_NAME";
  State[(State["DOCTYPE_NAME"] = 54)] = "DOCTYPE_NAME";
  State[(State["AFTER_DOCTYPE_NAME"] = 55)] = "AFTER_DOCTYPE_NAME";
  State[(State["AFTER_DOCTYPE_PUBLIC_KEYWORD"] = 56)] = "AFTER_DOCTYPE_PUBLIC_KEYWORD";
  State[(State["BEFORE_DOCTYPE_PUBLIC_IDENTIFIER"] = 57)] = "BEFORE_DOCTYPE_PUBLIC_IDENTIFIER";
  State[(State["DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED"] = 58)] =
    "DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED";
  State[(State["DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED"] = 59)] =
    "DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED";
  State[(State["AFTER_DOCTYPE_PUBLIC_IDENTIFIER"] = 60)] = "AFTER_DOCTYPE_PUBLIC_IDENTIFIER";
  State[(State["BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS"] = 61)] =
    "BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS";
  State[(State["AFTER_DOCTYPE_SYSTEM_KEYWORD"] = 62)] = "AFTER_DOCTYPE_SYSTEM_KEYWORD";
  State[(State["BEFORE_DOCTYPE_SYSTEM_IDENTIFIER"] = 63)] = "BEFORE_DOCTYPE_SYSTEM_IDENTIFIER";
  State[(State["DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED"] = 64)] =
    "DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED";
  State[(State["DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED"] = 65)] =
    "DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED";
  State[(State["AFTER_DOCTYPE_SYSTEM_IDENTIFIER"] = 66)] = "AFTER_DOCTYPE_SYSTEM_IDENTIFIER";
  State[(State["BOGUS_DOCTYPE"] = 67)] = "BOGUS_DOCTYPE";
  State[(State["CDATA_SECTION"] = 68)] = "CDATA_SECTION";
  State[(State["CDATA_SECTION_BRACKET"] = 69)] = "CDATA_SECTION_BRACKET";
  State[(State["CDATA_SECTION_END"] = 70)] = "CDATA_SECTION_END";
  State[(State["CHARACTER_REFERENCE"] = 71)] = "CHARACTER_REFERENCE";
  State[(State["AMBIGUOUS_AMPERSAND"] = 72)] = "AMBIGUOUS_AMPERSAND";
})(State || (State = {}));
const TokenizerMode = {
  DATA: State.DATA,
  RCDATA: State.RCDATA,
  RAWTEXT: State.RAWTEXT,
  SCRIPT_DATA: State.SCRIPT_DATA,
  PLAINTEXT: State.PLAINTEXT,
  CDATA_SECTION: State.CDATA_SECTION,
};
function isAsciiDigit(cp) {
  return cp >= CODE_POINTS.DIGIT_0 && cp <= CODE_POINTS.DIGIT_9;
}
function isAsciiUpper(cp) {
  return cp >= CODE_POINTS.LATIN_CAPITAL_A && cp <= CODE_POINTS.LATIN_CAPITAL_Z;
}
function isAsciiLower(cp) {
  return cp >= CODE_POINTS.LATIN_SMALL_A && cp <= CODE_POINTS.LATIN_SMALL_Z;
}
function isAsciiLetter(cp) {
  return isAsciiLower(cp) || isAsciiUpper(cp);
}
function isAsciiAlphaNumeric(cp) {
  return isAsciiLetter(cp) || isAsciiDigit(cp);
}
function toAsciiLower(cp) {
  return cp + 32;
}
function isWhitespace(cp) {
  return (
    cp === CODE_POINTS.SPACE ||
    cp === CODE_POINTS.LINE_FEED ||
    cp === CODE_POINTS.TABULATION ||
    cp === CODE_POINTS.FORM_FEED ||
    cp === CODE_POINTS.CARRIAGE_RETURN
  );
}
function isScriptDataDoubleEscapeSequenceEnd(cp) {
  return isWhitespace(cp) || cp === CODE_POINTS.SOLIDUS || cp === CODE_POINTS.GREATER_THAN_SIGN;
}
function getErrorForNumericCharacterReference(code) {
  if (code === CODE_POINTS.NULL) return ERR.nullCharacterReference;
  else if (code > 1114111) return ERR.characterReferenceOutsideUnicodeRange;
  else if (isSurrogate(code)) return ERR.surrogateCharacterReference;
  else if (isUndefinedCodePoint(code)) return ERR.noncharacterCharacterReference;
  else if (isControlCodePoint(code) || code === CODE_POINTS.CARRIAGE_RETURN)
    return ERR.controlCharacterReference;
  return null;
}
var Tokenizer = class {
  constructor(options, handler) {
    this.options = options;
    this.handler = handler;
    this.paused = false;
    /** Ensures that the parsing loop isn't run multiple times at once. */
    this.inLoop = false;
    /**
     * Indicates that the current adjusted node exists, is not an element in the HTML namespace,
     * and that it is not an integration point for either MathML or HTML.
     *
     * @see {@link https://html.spec.whatwg.org/multipage/parsing.html#tree-construction}
     */
    this.inForeignNode = false;
    this.lastStartTagName = "";
    this.active = false;
    this.state = State.DATA;
    this.returnState = State.DATA;
    this.entityStartPos = 0;
    this.consumedAfterSnapshot = -1;
    this.currentCharacterToken = null;
    this.currentToken = null;
    this.currentAttr = {
      name: "",
      value: "",
    };
    this.currentAttrLocation = null;
    /**
     * `[start, end)` of `preprocessor.html` still to be appended to the attribute value, comment data or character
     * token being built (`_flushRun`): input that is used as is is appended as one slice, not a code point at a time.
     */
    this.runStart = 0;
    this.runEnd = 0;
    this.preprocessor = new Preprocessor(handler);
    this.currentLocation = this.getCurrentLocation(-1);
    this.entityDecoder = new HtmlEntityDecoder(
      (cp, consumed) => {
        this.preprocessor.pos = this.entityStartPos + consumed - 1;
        if (!this._isCharacterReferenceInAttribute())
          this._ensureCharacterToken(
            isWhitespace(cp)
              ? TokenType.WHITESPACE_CHARACTER
              : cp === CODE_POINTS.NULL
                ? TokenType.NULL_CHARACTER
                : TokenType.CHARACTER,
          );
        this._extendRunWith(String.fromCodePoint(cp), 0);
      },
      handler.onParseError
        ? {
            missingSemicolonAfterCharacterReference: () => {
              this._err(ERR.missingSemicolonAfterCharacterReference, 1);
            },
            absenceOfDigitsInNumericCharacterReference: (consumed) => {
              this._err(
                ERR.absenceOfDigitsInNumericCharacterReference,
                this.entityStartPos - this.preprocessor.pos + consumed,
              );
            },
            validateNumericCharacterReference: (code) => {
              const error = getErrorForNumericCharacterReference(code);
              if (error) this._err(error, 1);
            },
          }
        : void 0,
    );
  }
  _err(code, cpOffset = 0) {
    var _a, _b;
    (_b = (_a = this.handler).onParseError) === null ||
      _b === void 0 ||
      _b.call(_a, this.preprocessor.getError(code, cpOffset));
  }
  getCurrentLocation(offset) {
    if (!this.options.sourceCodeLocationInfo) return null;
    return {
      startLine: this.preprocessor.line,
      startCol: this.preprocessor.col - offset,
      startOffset: this.preprocessor.offset - offset,
      endLine: -1,
      endCol: -1,
      endOffset: -1,
    };
  }
  _runParsingLoop() {
    if (this.inLoop) return;
    this.inLoop = true;
    while (this.active && !this.paused) {
      this.consumedAfterSnapshot = 0;
      const cp = this._consume();
      if (!this._ensureHibernation()) this._callState(cp);
    }
    this.inLoop = false;
  }
  /** Emit buffered character tokens without completing the current token or emitting EOF. */
  flushCharacters() {
    var _a;
    if (this.inLoop) throw new Error("Cannot flush characters from a tokenizer callback");
    const location =
      (_a = this.currentCharacterToken) === null || _a === void 0 ? void 0 : _a.location;
    let nextLocation = null;
    if (location) {
      nextLocation = this.getCharacterTokenEndLocation(location);
      this.currentLocation = nextLocation;
    }
    this.inLoop = true;
    try {
      this._emitCurrentCharacterToken(nextLocation);
    } finally {
      this.inLoop = false;
    }
    this._runParsingLoop();
  }
  getCharacterTokenEndLocation(location) {
    const endOffset = this.getCharacterTokenEndOffset();
    const html = this.preprocessor.html.slice(
      location.startOffset - this.preprocessor.droppedBufferSize,
      endOffset - this.preprocessor.droppedBufferSize,
    );
    let line = location.startLine;
    let lastLineBreak = -1;
    for (let i = html.indexOf("\n"); i !== -1; i = html.indexOf("\n", i + 1)) {
      line++;
      lastLineBreak = i;
    }
    for (let i = html.indexOf("\r"); i !== -1; i = html.indexOf("\r", i + 1))
      if (html.charCodeAt(i + 1) !== CODE_POINTS.LINE_FEED) {
        line++;
        lastLineBreak = Math.max(lastLineBreak, i);
      }
    return {
      startLine: line,
      startCol:
        lastLineBreak === -1 ? location.startCol + html.length : html.length - lastLineBreak,
      startOffset: endOffset,
      endLine: -1,
      endCol: -1,
      endOffset: -1,
    };
  }
  getCharacterTokenEndOffset() {
    var _a;
    const end = this.preprocessor.droppedBufferSize + this.preprocessor.pos + 1;
    const tokenLocation = (_a = this.currentToken) === null || _a === void 0 ? void 0 : _a.location;
    switch (this.state) {
      case State.TAG_OPEN:
      case State.RCDATA_LESS_THAN_SIGN:
      case State.RAWTEXT_LESS_THAN_SIGN:
      case State.SCRIPT_DATA_LESS_THAN_SIGN:
      case State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN:
      case State.CDATA_SECTION_BRACKET:
        return end - 1;
      case State.END_TAG_OPEN:
      case State.MARKUP_DECLARATION_OPEN:
      case State.RCDATA_END_TAG_OPEN:
      case State.RCDATA_END_TAG_NAME:
      case State.RAWTEXT_END_TAG_OPEN:
      case State.RAWTEXT_END_TAG_NAME:
      case State.SCRIPT_DATA_END_TAG_OPEN:
      case State.SCRIPT_DATA_END_TAG_NAME:
      case State.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:
      case State.SCRIPT_DATA_ESCAPED_END_TAG_NAME:
      case State.CDATA_SECTION_END:
        return end - 2;
      case State.CHARACTER_REFERENCE:
        return this._isCharacterReferenceInAttribute() && tokenLocation
          ? tokenLocation.startOffset
          : this.preprocessor.droppedBufferSize + this.entityStartPos;
      case State.DOCTYPE:
      case State.BEFORE_DOCTYPE_NAME:
        return this.currentLocation.startOffset;
      default:
        if (
          tokenLocation &&
          (this.state === State.TAG_NAME ||
            (this.state >= State.BEFORE_ATTRIBUTE_NAME && this.state <= State.BOGUS_COMMENT) ||
            (this.state >= State.COMMENT_START && this.state <= State.BOGUS_DOCTYPE))
        )
          return tokenLocation.startOffset;
        return end;
    }
  }
  pause() {
    this.paused = true;
  }
  resume(writeCallback) {
    if (!this.paused) throw new Error("Parser was already resumed");
    this.paused = false;
    if (this.inLoop) return;
    this._runParsingLoop();
    if (!this.paused) writeCallback === null || writeCallback === void 0 || writeCallback();
  }
  write(chunk, isLastChunk, writeCallback) {
    this.active = true;
    this.preprocessor.write(chunk, isLastChunk);
    this._runParsingLoop();
    if (!this.paused) writeCallback === null || writeCallback === void 0 || writeCallback();
  }
  insertHtmlAtCurrentPos(chunk) {
    this.active = true;
    this.preprocessor.insertHtmlAtCurrentPos(chunk);
    this._runParsingLoop();
  }
  _ensureHibernation() {
    if (this.preprocessor.endOfChunkHit) {
      this.preprocessor.retreat(this.consumedAfterSnapshot);
      this.consumedAfterSnapshot = 0;
      this.active = false;
      return true;
    }
    return false;
  }
  _consume() {
    this.consumedAfterSnapshot++;
    return this.preprocessor.advance();
  }
  _advanceBy(count) {
    this.consumedAfterSnapshot += count;
    for (let i = 0; i < count; i++) this.preprocessor.advance();
  }
  _consumeSequenceIfMatch(pattern, caseSensitive) {
    if (this.preprocessor.startsWith(pattern, caseSensitive)) {
      this._advanceBy(pattern.length - 1);
      return true;
    }
    return false;
  }
  _createStartTagToken() {
    this._flushRun("");
    this.currentToken = {
      type: TokenType.START_TAG,
      tagName: "",
      tagID: TAG_ID.UNKNOWN,
      selfClosing: false,
      ackSelfClosing: false,
      attrs: [],
      location: this.getCurrentLocation(1),
    };
  }
  _createEndTagToken() {
    this._flushRun("");
    this.currentToken = {
      type: TokenType.END_TAG,
      tagName: "",
      tagID: TAG_ID.UNKNOWN,
      selfClosing: false,
      ackSelfClosing: false,
      attrs: [],
      location: this.getCurrentLocation(2),
    };
  }
  _createCommentToken(offset) {
    this._flushRun("");
    this.currentToken = {
      type: TokenType.COMMENT,
      data: "",
      location: this.getCurrentLocation(offset),
    };
  }
  _createDoctypeToken(initialName) {
    this._flushRun("");
    this.currentToken = {
      type: TokenType.DOCTYPE,
      name: initialName,
      forceQuirks: false,
      publicId: null,
      systemId: null,
      location: this.currentLocation,
    };
  }
  _createCharacterToken(type) {
    if (this.currentLocation) {
      const start = this.currentLocation.startOffset - this.preprocessor.droppedBufferSize;
      if (this.preprocessor.html[start] === "\n" && this.preprocessor.html[start - 1] === "\r")
        this.currentLocation.startOffset++;
    }
    this.currentCharacterToken = {
      type,
      chars: "",
      location: this.currentLocation,
    };
  }
  _createAttr(attrNameFirstCh) {
    this._flushRun("");
    this.currentAttr = {
      name: attrNameFirstCh,
      value: "",
    };
    this.currentAttrLocation = this.getCurrentLocation(0);
  }
  _leaveAttrName() {
    var _a;
    var _b;
    const token = this.currentToken;
    if (getTokenAttr(token, this.currentAttr.name) === null) {
      token.attrs.push(this.currentAttr);
      if (token.location && this.currentAttrLocation) {
        const attrLocations =
          (_a = (_b = token.location).attrs) !== null && _a !== void 0
            ? _a
            : (_b.attrs = Object.create(null));
        attrLocations[this.currentAttr.name] = this.currentAttrLocation;
        this._leaveAttrValue();
      }
    } else this._err(ERR.duplicateAttribute);
  }
  _leaveAttrValue() {
    if (this.currentAttrLocation) {
      this.currentAttrLocation.endLine = this.preprocessor.line;
      this.currentAttrLocation.endCol = this.preprocessor.col;
      this.currentAttrLocation.endOffset = this.preprocessor.offset;
    }
  }
  /**
   * Append the pending run and `text` to the attribute value, comment data or character token being built.
   * The run is a string of its own: V8 copies a slice of fewer than 13 characters but lets a longer one share
   * the input's buffer, which would keep that buffer alive for as long as any attribute value or text cut from
   * it is; a concatenation is flattened into a buffer of its own when it is sliced.
   */
  _flushRun(text) {
    if (this.runEnd === this.runStart && text.length === 0) return;
    const slice = this.preprocessor.html.slice(this.runStart, this.runEnd);
    const run = (slice.length < 13 ? slice : ` ${slice}`.slice(1)) + text;
    const token = this.currentToken;
    this.runStart = this.runEnd;
    if (token === null) this.currentCharacterToken.chars += run;
    else if (token.type === TokenType.COMMENT) token.data += run;
    else this.currentAttr.value += run;
  }
  /** Extend the pending run by the current input code point, read as `cp`, or flush it and start a new one. */
  _extendRun(cp) {
    const { preprocessor } = this;
    if (
      cp === CODE_POINTS.LINE_FEED &&
      preprocessor.html.charCodeAt(preprocessor.pos) !== CODE_POINTS.LINE_FEED
    ) {
      this._flushRun("\n");
      this.runStart = preprocessor.pos + 1;
    } else {
      const start = preprocessor.pos - Number(cp > 65535);
      if (start !== this.runEnd) {
        this._flushRun("");
        this.runStart = start;
      }
    }
    this.runEnd = preprocessor.pos + 1;
  }
  /**
   * Extend the pending run by `text`, the input that ends `cpOffset` code points after the current one, or flush
   * the run and append `text` where the input differs (a NUL replacement, a decoded reference, a dropped chunk).
   */
  _extendRunWith(text, cpOffset) {
    const { preprocessor } = this;
    const start = preprocessor.codePointStart + 1 + cpOffset - text.length;
    if (start >= 0 && preprocessor.html.startsWith(text, start)) {
      if (start !== this.runEnd) {
        this._flushRun("");
        this.runStart = start;
      }
    } else {
      this._flushRun(text);
      this.runStart = start + text.length;
    }
    this.runEnd = start + text.length;
  }
  prepareToken(ct) {
    this._emitCurrentCharacterToken(ct.location);
    this.currentToken = null;
    if (ct.location) {
      ct.location.endLine = this.preprocessor.line;
      ct.location.endCol = this.preprocessor.col + 1;
      ct.location.endOffset = this.preprocessor.offset + 1;
    }
    this.currentLocation = this.getCurrentLocation(-1);
  }
  emitCurrentTagToken() {
    const ct = this.currentToken;
    this.prepareToken(ct);
    ct.tagID = getTagID(ct.tagName);
    if (ct.type === TokenType.START_TAG) {
      this.lastStartTagName = ct.tagName;
      this.handler.onStartTag(ct);
    } else {
      if (ct.attrs.length > 0) this._err(ERR.endTagWithAttributes);
      if (ct.selfClosing) this._err(ERR.endTagWithTrailingSolidus);
      this.handler.onEndTag(ct);
    }
    this.preprocessor.dropParsedChunk();
  }
  emitCurrentComment(ct) {
    this.prepareToken(ct);
    this.handler.onComment(ct);
    this.preprocessor.dropParsedChunk();
  }
  emitCurrentDoctype(ct) {
    this.prepareToken(ct);
    this.handler.onDoctype(ct);
    this.preprocessor.dropParsedChunk();
  }
  _emitCurrentCharacterToken(nextLocation) {
    this._flushRun("");
    if (this.currentCharacterToken) {
      if (nextLocation && this.currentCharacterToken.location) {
        this.currentCharacterToken.location.endLine = nextLocation.startLine;
        this.currentCharacterToken.location.endCol = nextLocation.startCol;
        this.currentCharacterToken.location.endOffset = nextLocation.startOffset;
      }
      switch (this.currentCharacterToken.type) {
        case TokenType.CHARACTER:
          this.handler.onCharacter(this.currentCharacterToken);
          break;
        case TokenType.NULL_CHARACTER:
          this.handler.onNullCharacter(this.currentCharacterToken);
          break;
        case TokenType.WHITESPACE_CHARACTER:
          this.handler.onWhitespaceCharacter(this.currentCharacterToken);
      }
      this.currentCharacterToken = null;
    }
  }
  _emitEOFToken() {
    const location = this.getCurrentLocation(0);
    if (location) {
      location.endLine = location.startLine;
      location.endCol = location.startCol;
      location.endOffset = location.startOffset;
    }
    this._emitCurrentCharacterToken(location);
    this.handler.onEof({
      type: TokenType.EOF,
      location,
    });
    this.active = false;
  }
  /** Make the current character token one of `type`, emitting the current one if it has another type. */
  _ensureCharacterToken(type) {
    if (this.currentCharacterToken) {
      if (this.currentCharacterToken.type === type) return;
      this.currentLocation = this.getCurrentLocation(0);
      this._emitCurrentCharacterToken(this.currentLocation);
      this.preprocessor.dropParsedChunk();
    }
    this._createCharacterToken(type);
  }
  /** Emit the current input code point, read as `cp`. */
  _emitCodePoint(cp) {
    const type = isWhitespace(cp)
      ? TokenType.WHITESPACE_CHARACTER
      : cp === CODE_POINTS.NULL
        ? TokenType.NULL_CHARACTER
        : TokenType.CHARACTER;
    const token = this.currentCharacterToken;
    if (token === null || token.type !== type) this._ensureCharacterToken(type);
    this._extendRun(cp);
  }
  _emitChars(ch, cpOffset = 0) {
    if (
      this.options.sourceCodeLocationInfo &&
      cpOffset !== 0 &&
      this.currentCharacterToken &&
      this.currentCharacterToken.type !== TokenType.CHARACTER
    ) {
      this.currentLocation = this.getCurrentLocation(ch.length - 1 - cpOffset);
      this._emitCurrentCharacterToken(this.currentLocation);
      this._createCharacterToken(TokenType.CHARACTER);
    } else this._ensureCharacterToken(TokenType.CHARACTER);
    this._extendRunWith(ch, cpOffset);
  }
  _startCharacterReference() {
    this.returnState = this.state;
    this.state = State.CHARACTER_REFERENCE;
    this.entityStartPos = this.preprocessor.pos;
    this.entityDecoder.startEntity(
      this._isCharacterReferenceInAttribute() ? DecodingMode.Attribute : DecodingMode.Legacy,
    );
  }
  _isCharacterReferenceInAttribute() {
    return (
      this.returnState === State.ATTRIBUTE_VALUE_DOUBLE_QUOTED ||
      this.returnState === State.ATTRIBUTE_VALUE_SINGLE_QUOTED ||
      this.returnState === State.ATTRIBUTE_VALUE_UNQUOTED
    );
  }
  _flushCodePointConsumedAsCharacterReference(cp) {
    if (this._isCharacterReferenceInAttribute()) this._extendRun(cp);
    else this._emitCodePoint(cp);
  }
  _callState(cp) {
    switch (this.state) {
      case State.DATA:
        this._stateData(cp);
        break;
      case State.RCDATA:
        this._stateRcdata(cp);
        break;
      case State.RAWTEXT:
        this._stateRawtext(cp);
        break;
      case State.SCRIPT_DATA:
        this._stateScriptData(cp);
        break;
      case State.PLAINTEXT:
        this._statePlaintext(cp);
        break;
      case State.TAG_OPEN:
        this._stateTagOpen(cp);
        break;
      case State.END_TAG_OPEN:
        this._stateEndTagOpen(cp);
        break;
      case State.TAG_NAME:
        this._stateTagName(cp);
        break;
      case State.RCDATA_LESS_THAN_SIGN:
        this._stateRcdataLessThanSign(cp);
        break;
      case State.RCDATA_END_TAG_OPEN:
        this._stateRcdataEndTagOpen(cp);
        break;
      case State.RCDATA_END_TAG_NAME:
        this._stateRcdataEndTagName(cp);
        break;
      case State.RAWTEXT_LESS_THAN_SIGN:
        this._stateRawtextLessThanSign(cp);
        break;
      case State.RAWTEXT_END_TAG_OPEN:
        this._stateRawtextEndTagOpen(cp);
        break;
      case State.RAWTEXT_END_TAG_NAME:
        this._stateRawtextEndTagName(cp);
        break;
      case State.SCRIPT_DATA_LESS_THAN_SIGN:
        this._stateScriptDataLessThanSign(cp);
        break;
      case State.SCRIPT_DATA_END_TAG_OPEN:
        this._stateScriptDataEndTagOpen(cp);
        break;
      case State.SCRIPT_DATA_END_TAG_NAME:
        this._stateScriptDataEndTagName(cp);
        break;
      case State.SCRIPT_DATA_ESCAPE_START:
        this._stateScriptDataEscapeStart(cp);
        break;
      case State.SCRIPT_DATA_ESCAPE_START_DASH:
        this._stateScriptDataEscapeStartDash(cp);
        break;
      case State.SCRIPT_DATA_ESCAPED:
        this._stateScriptDataEscaped(cp);
        break;
      case State.SCRIPT_DATA_ESCAPED_DASH:
        this._stateScriptDataEscapedDash(cp);
        break;
      case State.SCRIPT_DATA_ESCAPED_DASH_DASH:
        this._stateScriptDataEscapedDashDash(cp);
        break;
      case State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN:
        this._stateScriptDataEscapedLessThanSign(cp);
        break;
      case State.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:
        this._stateScriptDataEscapedEndTagOpen(cp);
        break;
      case State.SCRIPT_DATA_ESCAPED_END_TAG_NAME:
        this._stateScriptDataEscapedEndTagName(cp);
        break;
      case State.SCRIPT_DATA_DOUBLE_ESCAPE_START:
        this._stateScriptDataDoubleEscapeStart(cp);
        break;
      case State.SCRIPT_DATA_DOUBLE_ESCAPED:
        this._stateScriptDataDoubleEscaped(cp);
        break;
      case State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH:
        this._stateScriptDataDoubleEscapedDash(cp);
        break;
      case State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH:
        this._stateScriptDataDoubleEscapedDashDash(cp);
        break;
      case State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN:
        this._stateScriptDataDoubleEscapedLessThanSign(cp);
        break;
      case State.SCRIPT_DATA_DOUBLE_ESCAPE_END:
        this._stateScriptDataDoubleEscapeEnd(cp);
        break;
      case State.BEFORE_ATTRIBUTE_NAME:
        this._stateBeforeAttributeName(cp);
        break;
      case State.ATTRIBUTE_NAME:
        this._stateAttributeName(cp);
        break;
      case State.AFTER_ATTRIBUTE_NAME:
        this._stateAfterAttributeName(cp);
        break;
      case State.BEFORE_ATTRIBUTE_VALUE:
        this._stateBeforeAttributeValue(cp);
        break;
      case State.ATTRIBUTE_VALUE_DOUBLE_QUOTED:
        this._stateAttributeValueDoubleQuoted(cp);
        break;
      case State.ATTRIBUTE_VALUE_SINGLE_QUOTED:
        this._stateAttributeValueSingleQuoted(cp);
        break;
      case State.ATTRIBUTE_VALUE_UNQUOTED:
        this._stateAttributeValueUnquoted(cp);
        break;
      case State.AFTER_ATTRIBUTE_VALUE_QUOTED:
        this._stateAfterAttributeValueQuoted(cp);
        break;
      case State.SELF_CLOSING_START_TAG:
        this._stateSelfClosingStartTag(cp);
        break;
      case State.BOGUS_COMMENT:
        this._stateBogusComment(cp);
        break;
      case State.MARKUP_DECLARATION_OPEN:
        this._stateMarkupDeclarationOpen(cp);
        break;
      case State.COMMENT_START:
        this._stateCommentStart(cp);
        break;
      case State.COMMENT_START_DASH:
        this._stateCommentStartDash(cp);
        break;
      case State.COMMENT:
        this._stateComment(cp);
        break;
      case State.COMMENT_LESS_THAN_SIGN:
        this._stateCommentLessThanSign(cp);
        break;
      case State.COMMENT_LESS_THAN_SIGN_BANG:
        this._stateCommentLessThanSignBang(cp);
        break;
      case State.COMMENT_LESS_THAN_SIGN_BANG_DASH:
        this._stateCommentLessThanSignBangDash(cp);
        break;
      case State.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH:
        this._stateCommentLessThanSignBangDashDash(cp);
        break;
      case State.COMMENT_END_DASH:
        this._stateCommentEndDash(cp);
        break;
      case State.COMMENT_END:
        this._stateCommentEnd(cp);
        break;
      case State.COMMENT_END_BANG:
        this._stateCommentEndBang(cp);
        break;
      case State.DOCTYPE:
        this._stateDoctype(cp);
        break;
      case State.BEFORE_DOCTYPE_NAME:
        this._stateBeforeDoctypeName(cp);
        break;
      case State.DOCTYPE_NAME:
        this._stateDoctypeName(cp);
        break;
      case State.AFTER_DOCTYPE_NAME:
        this._stateAfterDoctypeName(cp);
        break;
      case State.AFTER_DOCTYPE_PUBLIC_KEYWORD:
        this._stateAfterDoctypePublicKeyword(cp);
        break;
      case State.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER:
        this._stateBeforeDoctypePublicIdentifier(cp);
        break;
      case State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED:
        this._stateDoctypePublicIdentifierDoubleQuoted(cp);
        break;
      case State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED:
        this._stateDoctypePublicIdentifierSingleQuoted(cp);
        break;
      case State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER:
        this._stateAfterDoctypePublicIdentifier(cp);
        break;
      case State.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS:
        this._stateBetweenDoctypePublicAndSystemIdentifiers(cp);
        break;
      case State.AFTER_DOCTYPE_SYSTEM_KEYWORD:
        this._stateAfterDoctypeSystemKeyword(cp);
        break;
      case State.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER:
        this._stateBeforeDoctypeSystemIdentifier(cp);
        break;
      case State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED:
        this._stateDoctypeSystemIdentifierDoubleQuoted(cp);
        break;
      case State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED:
        this._stateDoctypeSystemIdentifierSingleQuoted(cp);
        break;
      case State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER:
        this._stateAfterDoctypeSystemIdentifier(cp);
        break;
      case State.BOGUS_DOCTYPE:
        this._stateBogusDoctype(cp);
        break;
      case State.CDATA_SECTION:
        this._stateCdataSection(cp);
        break;
      case State.CDATA_SECTION_BRACKET:
        this._stateCdataSectionBracket(cp);
        break;
      case State.CDATA_SECTION_END:
        this._stateCdataSectionEnd(cp);
        break;
      case State.CHARACTER_REFERENCE:
        this._stateCharacterReference();
        break;
      case State.AMBIGUOUS_AMPERSAND:
        this._stateAmbiguousAmpersand(cp);
        break;
      default:
        throw new Error("Unknown state");
    }
  }
  _stateData(cp) {
    switch (cp) {
      case CODE_POINTS.LESS_THAN_SIGN:
        this.state = State.TAG_OPEN;
        break;
      case CODE_POINTS.AMPERSAND:
        this._startCharacterReference();
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._emitCodePoint(cp);
        break;
      case CODE_POINTS.EOF:
        this._emitEOFToken();
        break;
      default:
        this._emitCodePoint(cp);
    }
  }
  _stateRcdata(cp) {
    switch (cp) {
      case CODE_POINTS.AMPERSAND:
        this._startCharacterReference();
        break;
      case CODE_POINTS.LESS_THAN_SIGN:
        this.state = State.RCDATA_LESS_THAN_SIGN;
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._emitChars("�");
        break;
      case CODE_POINTS.EOF:
        this._emitEOFToken();
        break;
      default:
        this._emitCodePoint(cp);
    }
  }
  _stateRawtext(cp) {
    switch (cp) {
      case CODE_POINTS.LESS_THAN_SIGN:
        this.state = State.RAWTEXT_LESS_THAN_SIGN;
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._emitChars("�");
        break;
      case CODE_POINTS.EOF:
        this._emitEOFToken();
        break;
      default:
        this._emitCodePoint(cp);
    }
  }
  _stateScriptData(cp) {
    switch (cp) {
      case CODE_POINTS.LESS_THAN_SIGN:
        this.state = State.SCRIPT_DATA_LESS_THAN_SIGN;
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._emitChars("�");
        break;
      case CODE_POINTS.EOF:
        this._emitEOFToken();
        break;
      default:
        this._emitCodePoint(cp);
    }
  }
  _statePlaintext(cp) {
    switch (cp) {
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._emitChars("�");
        break;
      case CODE_POINTS.EOF:
        this._emitEOFToken();
        break;
      default:
        this._emitCodePoint(cp);
    }
  }
  _stateTagOpen(cp) {
    if (isAsciiLetter(cp)) {
      this._createStartTagToken();
      this.state = State.TAG_NAME;
      this._stateTagName(cp);
    } else
      switch (cp) {
        case CODE_POINTS.EXCLAMATION_MARK:
          this.state = State.MARKUP_DECLARATION_OPEN;
          break;
        case CODE_POINTS.SOLIDUS:
          this.state = State.END_TAG_OPEN;
          break;
        case CODE_POINTS.QUESTION_MARK:
          this._err(ERR.unexpectedQuestionMarkInsteadOfTagName);
          this._createCommentToken(1);
          this.state = State.BOGUS_COMMENT;
          this._stateBogusComment(cp);
          break;
        case CODE_POINTS.EOF:
          this._err(ERR.eofBeforeTagName);
          this._emitChars("<", -1);
          this._emitEOFToken();
          break;
        default:
          this._err(ERR.invalidFirstCharacterOfTagName);
          this._emitChars("<", -1);
          this.state = State.DATA;
          this._stateData(cp);
      }
  }
  _stateEndTagOpen(cp) {
    if (isAsciiLetter(cp)) {
      this._createEndTagToken();
      this.state = State.TAG_NAME;
      this._stateTagName(cp);
    } else
      switch (cp) {
        case CODE_POINTS.GREATER_THAN_SIGN:
          this._err(ERR.missingEndTagName);
          this.state = State.DATA;
          break;
        case CODE_POINTS.EOF:
          this._err(ERR.eofBeforeTagName);
          this._emitChars("</", -1);
          this._emitEOFToken();
          break;
        default:
          this._err(ERR.invalidFirstCharacterOfTagName);
          this._createCommentToken(2);
          this.state = State.BOGUS_COMMENT;
          this._stateBogusComment(cp);
      }
  }
  _stateTagName(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        this.state = State.BEFORE_ATTRIBUTE_NAME;
        break;
      case CODE_POINTS.SOLIDUS:
        this.state = State.SELF_CLOSING_START_TAG;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.state = State.DATA;
        this.emitCurrentTagToken();
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        token.tagName += "�";
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInTag);
        this._emitEOFToken();
        break;
      default:
        token.tagName += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
    }
  }
  _stateRcdataLessThanSign(cp) {
    if (cp === CODE_POINTS.SOLIDUS) this.state = State.RCDATA_END_TAG_OPEN;
    else {
      this._emitChars("<", -1);
      this.state = State.RCDATA;
      this._stateRcdata(cp);
    }
  }
  _stateRcdataEndTagOpen(cp) {
    if (isAsciiLetter(cp)) {
      this.state = State.RCDATA_END_TAG_NAME;
      this._stateRcdataEndTagName(cp);
    } else {
      this._emitChars("</", -1);
      this.state = State.RCDATA;
      this._stateRcdata(cp);
    }
  }
  handleSpecialEndTag(_cp) {
    if (!this.preprocessor.startsWith(this.lastStartTagName, false))
      return !this._ensureHibernation();
    this._createEndTagToken();
    const token = this.currentToken;
    token.tagName = this.lastStartTagName;
    switch (this.preprocessor.peek(this.lastStartTagName.length)) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        this._advanceBy(this.lastStartTagName.length);
        this.state = State.BEFORE_ATTRIBUTE_NAME;
        return false;
      case CODE_POINTS.SOLIDUS:
        this._advanceBy(this.lastStartTagName.length);
        this.state = State.SELF_CLOSING_START_TAG;
        return false;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._advanceBy(this.lastStartTagName.length);
        this.emitCurrentTagToken();
        this.state = State.DATA;
        return false;
      default:
        this.currentToken = null;
        return !this._ensureHibernation();
    }
  }
  _stateRcdataEndTagName(cp) {
    if (this.handleSpecialEndTag(cp)) {
      this._emitChars("</", -1);
      this.state = State.RCDATA;
      this._stateRcdata(cp);
    }
  }
  _stateRawtextLessThanSign(cp) {
    if (cp === CODE_POINTS.SOLIDUS) this.state = State.RAWTEXT_END_TAG_OPEN;
    else {
      this._emitChars("<", -1);
      this.state = State.RAWTEXT;
      this._stateRawtext(cp);
    }
  }
  _stateRawtextEndTagOpen(cp) {
    if (isAsciiLetter(cp)) {
      this.state = State.RAWTEXT_END_TAG_NAME;
      this._stateRawtextEndTagName(cp);
    } else {
      this._emitChars("</", -1);
      this.state = State.RAWTEXT;
      this._stateRawtext(cp);
    }
  }
  _stateRawtextEndTagName(cp) {
    if (this.handleSpecialEndTag(cp)) {
      this._emitChars("</", -1);
      this.state = State.RAWTEXT;
      this._stateRawtext(cp);
    }
  }
  _stateScriptDataLessThanSign(cp) {
    switch (cp) {
      case CODE_POINTS.SOLIDUS:
        this.state = State.SCRIPT_DATA_END_TAG_OPEN;
        break;
      case CODE_POINTS.EXCLAMATION_MARK:
        this.state = State.SCRIPT_DATA_ESCAPE_START;
        this._emitChars("<!");
        break;
      default:
        this._emitChars("<", -1);
        this.state = State.SCRIPT_DATA;
        this._stateScriptData(cp);
    }
  }
  _stateScriptDataEndTagOpen(cp) {
    if (isAsciiLetter(cp)) {
      this.state = State.SCRIPT_DATA_END_TAG_NAME;
      this._stateScriptDataEndTagName(cp);
    } else {
      this._emitChars("</", -1);
      this.state = State.SCRIPT_DATA;
      this._stateScriptData(cp);
    }
  }
  _stateScriptDataEndTagName(cp) {
    if (this.handleSpecialEndTag(cp)) {
      this._emitChars("</", -1);
      this.state = State.SCRIPT_DATA;
      this._stateScriptData(cp);
    }
  }
  _stateScriptDataEscapeStart(cp) {
    if (cp === CODE_POINTS.HYPHEN_MINUS) {
      this.state = State.SCRIPT_DATA_ESCAPE_START_DASH;
      this._emitChars("-");
    } else {
      this.state = State.SCRIPT_DATA;
      this._stateScriptData(cp);
    }
  }
  _stateScriptDataEscapeStartDash(cp) {
    if (cp === CODE_POINTS.HYPHEN_MINUS) {
      this.state = State.SCRIPT_DATA_ESCAPED_DASH_DASH;
      this._emitChars("-");
    } else {
      this.state = State.SCRIPT_DATA;
      this._stateScriptData(cp);
    }
  }
  _stateScriptDataEscaped(cp) {
    switch (cp) {
      case CODE_POINTS.HYPHEN_MINUS:
        this.state = State.SCRIPT_DATA_ESCAPED_DASH;
        this._emitChars("-");
        break;
      case CODE_POINTS.LESS_THAN_SIGN:
        this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._emitChars("�");
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInScriptHtmlCommentLikeText);
        this._emitEOFToken();
        break;
      default:
        this._emitCodePoint(cp);
    }
  }
  _stateScriptDataEscapedDash(cp) {
    switch (cp) {
      case CODE_POINTS.HYPHEN_MINUS:
        this.state = State.SCRIPT_DATA_ESCAPED_DASH_DASH;
        this._emitChars("-");
        break;
      case CODE_POINTS.LESS_THAN_SIGN:
        this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this.state = State.SCRIPT_DATA_ESCAPED;
        this._emitChars("�");
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInScriptHtmlCommentLikeText);
        this._emitEOFToken();
        break;
      default:
        this.state = State.SCRIPT_DATA_ESCAPED;
        this._emitCodePoint(cp);
    }
  }
  _stateScriptDataEscapedDashDash(cp) {
    switch (cp) {
      case CODE_POINTS.HYPHEN_MINUS:
        this._emitChars("-");
        break;
      case CODE_POINTS.LESS_THAN_SIGN:
        this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.state = State.SCRIPT_DATA;
        this._emitChars(">");
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this.state = State.SCRIPT_DATA_ESCAPED;
        this._emitChars("�");
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInScriptHtmlCommentLikeText);
        this._emitEOFToken();
        break;
      default:
        this.state = State.SCRIPT_DATA_ESCAPED;
        this._emitCodePoint(cp);
    }
  }
  _stateScriptDataEscapedLessThanSign(cp) {
    if (cp === CODE_POINTS.SOLIDUS) this.state = State.SCRIPT_DATA_ESCAPED_END_TAG_OPEN;
    else if (isAsciiLetter(cp)) {
      this._emitChars("<", -1);
      this.state = State.SCRIPT_DATA_DOUBLE_ESCAPE_START;
      this._stateScriptDataDoubleEscapeStart(cp);
    } else {
      this._emitChars("<", -1);
      this.state = State.SCRIPT_DATA_ESCAPED;
      this._stateScriptDataEscaped(cp);
    }
  }
  _stateScriptDataEscapedEndTagOpen(cp) {
    if (isAsciiLetter(cp)) {
      this.state = State.SCRIPT_DATA_ESCAPED_END_TAG_NAME;
      this._stateScriptDataEscapedEndTagName(cp);
    } else {
      this._emitChars("</", -1);
      this.state = State.SCRIPT_DATA_ESCAPED;
      this._stateScriptDataEscaped(cp);
    }
  }
  _stateScriptDataEscapedEndTagName(cp) {
    if (this.handleSpecialEndTag(cp)) {
      this._emitChars("</", -1);
      this.state = State.SCRIPT_DATA_ESCAPED;
      this._stateScriptDataEscaped(cp);
    }
  }
  _stateScriptDataDoubleEscapeStart(cp) {
    if (
      this.preprocessor.startsWith(SEQUENCES.SCRIPT, false) &&
      isScriptDataDoubleEscapeSequenceEnd(this.preprocessor.peek(SEQUENCES.SCRIPT.length))
    ) {
      this._emitCodePoint(cp);
      for (let i = 0; i < SEQUENCES.SCRIPT.length; i++) this._emitCodePoint(this._consume());
      this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
    } else if (!this._ensureHibernation()) {
      this.state = State.SCRIPT_DATA_ESCAPED;
      this._stateScriptDataEscaped(cp);
    }
  }
  _stateScriptDataDoubleEscaped(cp) {
    switch (cp) {
      case CODE_POINTS.HYPHEN_MINUS:
        this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH;
        this._emitChars("-");
        break;
      case CODE_POINTS.LESS_THAN_SIGN:
        this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
        this._emitChars("<");
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._emitChars("�");
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInScriptHtmlCommentLikeText);
        this._emitEOFToken();
        break;
      default:
        this._emitCodePoint(cp);
    }
  }
  _stateScriptDataDoubleEscapedDash(cp) {
    switch (cp) {
      case CODE_POINTS.HYPHEN_MINUS:
        this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH;
        this._emitChars("-");
        break;
      case CODE_POINTS.LESS_THAN_SIGN:
        this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
        this._emitChars("<");
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
        this._emitChars("�");
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInScriptHtmlCommentLikeText);
        this._emitEOFToken();
        break;
      default:
        this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
        this._emitCodePoint(cp);
    }
  }
  _stateScriptDataDoubleEscapedDashDash(cp) {
    switch (cp) {
      case CODE_POINTS.HYPHEN_MINUS:
        this._emitChars("-");
        break;
      case CODE_POINTS.LESS_THAN_SIGN:
        this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
        this._emitChars("<");
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.state = State.SCRIPT_DATA;
        this._emitChars(">");
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
        this._emitChars("�");
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInScriptHtmlCommentLikeText);
        this._emitEOFToken();
        break;
      default:
        this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
        this._emitCodePoint(cp);
    }
  }
  _stateScriptDataDoubleEscapedLessThanSign(cp) {
    if (cp === CODE_POINTS.SOLIDUS) {
      this.state = State.SCRIPT_DATA_DOUBLE_ESCAPE_END;
      this._emitChars("/");
    } else {
      this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
      this._stateScriptDataDoubleEscaped(cp);
    }
  }
  _stateScriptDataDoubleEscapeEnd(cp) {
    if (
      this.preprocessor.startsWith(SEQUENCES.SCRIPT, false) &&
      isScriptDataDoubleEscapeSequenceEnd(this.preprocessor.peek(SEQUENCES.SCRIPT.length))
    ) {
      this._emitCodePoint(cp);
      for (let i = 0; i < SEQUENCES.SCRIPT.length; i++) this._emitCodePoint(this._consume());
      this.state = State.SCRIPT_DATA_ESCAPED;
    } else if (!this._ensureHibernation()) {
      this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
      this._stateScriptDataDoubleEscaped(cp);
    }
  }
  _stateBeforeAttributeName(cp) {
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        break;
      case CODE_POINTS.SOLIDUS:
      case CODE_POINTS.GREATER_THAN_SIGN:
      case CODE_POINTS.EOF:
        this.state = State.AFTER_ATTRIBUTE_NAME;
        this._stateAfterAttributeName(cp);
        break;
      case CODE_POINTS.EQUALS_SIGN:
        this._err(ERR.unexpectedEqualsSignBeforeAttributeName);
        this._createAttr("=");
        this.state = State.ATTRIBUTE_NAME;
        break;
      default:
        this._createAttr("");
        this.state = State.ATTRIBUTE_NAME;
        this._stateAttributeName(cp);
    }
  }
  _stateAttributeName(cp) {
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
      case CODE_POINTS.SOLIDUS:
      case CODE_POINTS.GREATER_THAN_SIGN:
      case CODE_POINTS.EOF:
        this._leaveAttrName();
        this.state = State.AFTER_ATTRIBUTE_NAME;
        this._stateAfterAttributeName(cp);
        break;
      case CODE_POINTS.EQUALS_SIGN:
        this._leaveAttrName();
        this.state = State.BEFORE_ATTRIBUTE_VALUE;
        break;
      case CODE_POINTS.QUOTATION_MARK:
      case CODE_POINTS.APOSTROPHE:
      case CODE_POINTS.LESS_THAN_SIGN:
        this._err(ERR.unexpectedCharacterInAttributeName);
        this.currentAttr.name += String.fromCodePoint(cp);
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this.currentAttr.name += "�";
        break;
      default:
        this.currentAttr.name += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
    }
  }
  _stateAfterAttributeName(cp) {
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        break;
      case CODE_POINTS.SOLIDUS:
        this.state = State.SELF_CLOSING_START_TAG;
        break;
      case CODE_POINTS.EQUALS_SIGN:
        this.state = State.BEFORE_ATTRIBUTE_VALUE;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.state = State.DATA;
        this.emitCurrentTagToken();
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInTag);
        this._emitEOFToken();
        break;
      default:
        this._createAttr("");
        this.state = State.ATTRIBUTE_NAME;
        this._stateAttributeName(cp);
    }
  }
  _stateBeforeAttributeValue(cp) {
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        break;
      case CODE_POINTS.QUOTATION_MARK:
        this.state = State.ATTRIBUTE_VALUE_DOUBLE_QUOTED;
        break;
      case CODE_POINTS.APOSTROPHE:
        this.state = State.ATTRIBUTE_VALUE_SINGLE_QUOTED;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._err(ERR.missingAttributeValue);
        this.state = State.DATA;
        this.emitCurrentTagToken();
        break;
      default:
        this.state = State.ATTRIBUTE_VALUE_UNQUOTED;
        this._stateAttributeValueUnquoted(cp);
    }
  }
  _stateAttributeValueDoubleQuoted(cp) {
    switch (cp) {
      case CODE_POINTS.QUOTATION_MARK:
        this.state = State.AFTER_ATTRIBUTE_VALUE_QUOTED;
        break;
      case CODE_POINTS.AMPERSAND:
        this._startCharacterReference();
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._extendRunWith("�", 0);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInTag);
        this._emitEOFToken();
        break;
      default:
        this._extendRun(cp);
    }
  }
  _stateAttributeValueSingleQuoted(cp) {
    switch (cp) {
      case CODE_POINTS.APOSTROPHE:
        this.state = State.AFTER_ATTRIBUTE_VALUE_QUOTED;
        break;
      case CODE_POINTS.AMPERSAND:
        this._startCharacterReference();
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._extendRunWith("�", 0);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInTag);
        this._emitEOFToken();
        break;
      default:
        this._extendRun(cp);
    }
  }
  _stateAttributeValueUnquoted(cp) {
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        this._leaveAttrValue();
        this.state = State.BEFORE_ATTRIBUTE_NAME;
        break;
      case CODE_POINTS.AMPERSAND:
        this._startCharacterReference();
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._leaveAttrValue();
        this.state = State.DATA;
        this.emitCurrentTagToken();
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._extendRunWith("�", 0);
        break;
      case CODE_POINTS.QUOTATION_MARK:
      case CODE_POINTS.APOSTROPHE:
      case CODE_POINTS.LESS_THAN_SIGN:
      case CODE_POINTS.EQUALS_SIGN:
      case CODE_POINTS.GRAVE_ACCENT:
        this._err(ERR.unexpectedCharacterInUnquotedAttributeValue);
        this._extendRun(cp);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInTag);
        this._emitEOFToken();
        break;
      default:
        this._extendRun(cp);
    }
  }
  _stateAfterAttributeValueQuoted(cp) {
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        this._leaveAttrValue();
        this.state = State.BEFORE_ATTRIBUTE_NAME;
        break;
      case CODE_POINTS.SOLIDUS:
        this._leaveAttrValue();
        this.state = State.SELF_CLOSING_START_TAG;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._leaveAttrValue();
        this.state = State.DATA;
        this.emitCurrentTagToken();
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInTag);
        this._emitEOFToken();
        break;
      default:
        this._err(ERR.missingWhitespaceBetweenAttributes);
        this._leaveAttrValue();
        this.state = State.BEFORE_ATTRIBUTE_NAME;
        this._stateBeforeAttributeName(cp);
    }
  }
  _stateSelfClosingStartTag(cp) {
    switch (cp) {
      case CODE_POINTS.GREATER_THAN_SIGN: {
        const token = this.currentToken;
        token.selfClosing = true;
        this.state = State.DATA;
        this.emitCurrentTagToken();
        break;
      }
      case CODE_POINTS.EOF:
        this._err(ERR.eofInTag);
        this._emitEOFToken();
        break;
      default:
        this._err(ERR.unexpectedSolidusInTag);
        this.state = State.BEFORE_ATTRIBUTE_NAME;
        this._stateBeforeAttributeName(cp);
    }
  }
  _stateBogusComment(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.state = State.DATA;
        this.emitCurrentComment(token);
        break;
      case CODE_POINTS.EOF:
        this.emitCurrentComment(token);
        this._emitEOFToken();
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._extendRunWith("�", 0);
        break;
      default:
        this._extendRun(cp);
    }
  }
  _stateMarkupDeclarationOpen(cp) {
    if (this._consumeSequenceIfMatch(SEQUENCES.DASH_DASH, true)) {
      this._createCommentToken(SEQUENCES.DASH_DASH.length + 1);
      this.state = State.COMMENT_START;
    } else if (this._consumeSequenceIfMatch(SEQUENCES.DOCTYPE, false)) {
      this.currentLocation = this.getCurrentLocation(SEQUENCES.DOCTYPE.length + 1);
      this.state = State.DOCTYPE;
    } else if (this._consumeSequenceIfMatch(SEQUENCES.CDATA_START, true)) {
      if (this.inForeignNode) this.state = State.CDATA_SECTION;
      else {
        this._err(ERR.cdataInHtmlContent);
        this._createCommentToken(SEQUENCES.CDATA_START.length + 1);
        this.currentToken.data = "[CDATA[";
        this.state = State.BOGUS_COMMENT;
      }
    } else if (!this._ensureHibernation()) {
      this._err(ERR.incorrectlyOpenedComment);
      this._createCommentToken(2);
      this.state = State.BOGUS_COMMENT;
      this._stateBogusComment(cp);
    }
  }
  _stateCommentStart(cp) {
    switch (cp) {
      case CODE_POINTS.HYPHEN_MINUS:
        this.state = State.COMMENT_START_DASH;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN: {
        this._err(ERR.abruptClosingOfEmptyComment);
        this.state = State.DATA;
        const token = this.currentToken;
        this.emitCurrentComment(token);
        break;
      }
      default:
        this.state = State.COMMENT;
        this._stateComment(cp);
    }
  }
  _stateCommentStartDash(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.HYPHEN_MINUS:
        this.state = State.COMMENT_END;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._err(ERR.abruptClosingOfEmptyComment);
        this.state = State.DATA;
        this.emitCurrentComment(token);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInComment);
        this.emitCurrentComment(token);
        this._emitEOFToken();
        break;
      default:
        this._extendRunWith("-", -1);
        this.state = State.COMMENT;
        this._stateComment(cp);
    }
  }
  _stateComment(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.HYPHEN_MINUS:
        this.state = State.COMMENT_END_DASH;
        break;
      case CODE_POINTS.LESS_THAN_SIGN:
        this._extendRunWith("<", 0);
        this.state = State.COMMENT_LESS_THAN_SIGN;
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        this._extendRunWith("�", 0);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInComment);
        this.emitCurrentComment(token);
        this._emitEOFToken();
        break;
      default:
        this._extendRun(cp);
    }
  }
  _stateCommentLessThanSign(cp) {
    switch (cp) {
      case CODE_POINTS.EXCLAMATION_MARK:
        this._extendRunWith("!", 0);
        this.state = State.COMMENT_LESS_THAN_SIGN_BANG;
        break;
      case CODE_POINTS.LESS_THAN_SIGN:
        this._extendRunWith("<", 0);
        break;
      default:
        this.state = State.COMMENT;
        this._stateComment(cp);
    }
  }
  _stateCommentLessThanSignBang(cp) {
    if (cp === CODE_POINTS.HYPHEN_MINUS) this.state = State.COMMENT_LESS_THAN_SIGN_BANG_DASH;
    else {
      this.state = State.COMMENT;
      this._stateComment(cp);
    }
  }
  _stateCommentLessThanSignBangDash(cp) {
    if (cp === CODE_POINTS.HYPHEN_MINUS) this.state = State.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH;
    else {
      this.state = State.COMMENT_END_DASH;
      this._stateCommentEndDash(cp);
    }
  }
  _stateCommentLessThanSignBangDashDash(cp) {
    if (cp !== CODE_POINTS.GREATER_THAN_SIGN && cp !== CODE_POINTS.EOF)
      this._err(ERR.nestedComment);
    this.state = State.COMMENT_END;
    this._stateCommentEnd(cp);
  }
  _stateCommentEndDash(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.HYPHEN_MINUS:
        this.state = State.COMMENT_END;
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInComment);
        this.emitCurrentComment(token);
        this._emitEOFToken();
        break;
      default:
        this._extendRunWith("-", -1);
        this.state = State.COMMENT;
        this._stateComment(cp);
    }
  }
  _stateCommentEnd(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.state = State.DATA;
        this.emitCurrentComment(token);
        break;
      case CODE_POINTS.EXCLAMATION_MARK:
        this.state = State.COMMENT_END_BANG;
        break;
      case CODE_POINTS.HYPHEN_MINUS:
        this._extendRunWith("-", -2);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInComment);
        this.emitCurrentComment(token);
        this._emitEOFToken();
        break;
      default:
        this._extendRunWith("--", -1);
        this.state = State.COMMENT;
        this._stateComment(cp);
    }
  }
  _stateCommentEndBang(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.HYPHEN_MINUS:
        this._extendRunWith("--!", -1);
        this.state = State.COMMENT_END_DASH;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._err(ERR.incorrectlyClosedComment);
        this.state = State.DATA;
        this.emitCurrentComment(token);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInComment);
        this.emitCurrentComment(token);
        this._emitEOFToken();
        break;
      default:
        this._extendRunWith("--!", -1);
        this.state = State.COMMENT;
        this._stateComment(cp);
    }
  }
  _stateDoctype(cp) {
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        this.state = State.BEFORE_DOCTYPE_NAME;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.state = State.BEFORE_DOCTYPE_NAME;
        this._stateBeforeDoctypeName(cp);
        break;
      case CODE_POINTS.EOF: {
        this._err(ERR.eofInDoctype);
        this._createDoctypeToken(null);
        const token = this.currentToken;
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      }
      default:
        this._err(ERR.missingWhitespaceBeforeDoctypeName);
        this.state = State.BEFORE_DOCTYPE_NAME;
        this._stateBeforeDoctypeName(cp);
    }
  }
  _stateBeforeDoctypeName(cp) {
    if (isAsciiUpper(cp)) {
      this._createDoctypeToken(String.fromCharCode(toAsciiLower(cp)));
      this.state = State.DOCTYPE_NAME;
    } else
      switch (cp) {
        case CODE_POINTS.SPACE:
        case CODE_POINTS.LINE_FEED:
        case CODE_POINTS.TABULATION:
        case CODE_POINTS.FORM_FEED:
          break;
        case CODE_POINTS.NULL:
          this._err(ERR.unexpectedNullCharacter);
          this._createDoctypeToken("�");
          this.state = State.DOCTYPE_NAME;
          break;
        case CODE_POINTS.GREATER_THAN_SIGN: {
          this._err(ERR.missingDoctypeName);
          this._createDoctypeToken(null);
          const token = this.currentToken;
          token.forceQuirks = true;
          this.emitCurrentDoctype(token);
          this.state = State.DATA;
          break;
        }
        case CODE_POINTS.EOF: {
          this._err(ERR.eofInDoctype);
          this._createDoctypeToken(null);
          const token = this.currentToken;
          token.forceQuirks = true;
          this.emitCurrentDoctype(token);
          this._emitEOFToken();
          break;
        }
        default:
          this._createDoctypeToken(String.fromCodePoint(cp));
          this.state = State.DOCTYPE_NAME;
      }
  }
  _stateDoctypeName(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        this.state = State.AFTER_DOCTYPE_NAME;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.state = State.DATA;
        this.emitCurrentDoctype(token);
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        token.name += "�";
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        token.name += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
    }
  }
  _stateAfterDoctypeName(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.state = State.DATA;
        this.emitCurrentDoctype(token);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        if (this._consumeSequenceIfMatch(SEQUENCES.PUBLIC, false))
          this.state = State.AFTER_DOCTYPE_PUBLIC_KEYWORD;
        else if (this._consumeSequenceIfMatch(SEQUENCES.SYSTEM, false))
          this.state = State.AFTER_DOCTYPE_SYSTEM_KEYWORD;
        else if (!this._ensureHibernation()) {
          this._err(ERR.invalidCharacterSequenceAfterDoctypeName);
          token.forceQuirks = true;
          this.state = State.BOGUS_DOCTYPE;
          this._stateBogusDoctype(cp);
        }
    }
  }
  _stateAfterDoctypePublicKeyword(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        this.state = State.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER;
        break;
      case CODE_POINTS.QUOTATION_MARK:
        this._err(ERR.missingWhitespaceAfterDoctypePublicKeyword);
        token.publicId = "";
        this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
        break;
      case CODE_POINTS.APOSTROPHE:
        this._err(ERR.missingWhitespaceAfterDoctypePublicKeyword);
        token.publicId = "";
        this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._err(ERR.missingDoctypePublicIdentifier);
        token.forceQuirks = true;
        this.state = State.DATA;
        this.emitCurrentDoctype(token);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        this._err(ERR.missingQuoteBeforeDoctypePublicIdentifier);
        token.forceQuirks = true;
        this.state = State.BOGUS_DOCTYPE;
        this._stateBogusDoctype(cp);
    }
  }
  _stateBeforeDoctypePublicIdentifier(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        break;
      case CODE_POINTS.QUOTATION_MARK:
        token.publicId = "";
        this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
        break;
      case CODE_POINTS.APOSTROPHE:
        token.publicId = "";
        this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._err(ERR.missingDoctypePublicIdentifier);
        token.forceQuirks = true;
        this.state = State.DATA;
        this.emitCurrentDoctype(token);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        this._err(ERR.missingQuoteBeforeDoctypePublicIdentifier);
        token.forceQuirks = true;
        this.state = State.BOGUS_DOCTYPE;
        this._stateBogusDoctype(cp);
    }
  }
  _stateDoctypePublicIdentifierDoubleQuoted(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.QUOTATION_MARK:
        this.state = State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        token.publicId += "�";
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._err(ERR.abruptDoctypePublicIdentifier);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this.state = State.DATA;
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        token.publicId += String.fromCodePoint(cp);
    }
  }
  _stateDoctypePublicIdentifierSingleQuoted(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.APOSTROPHE:
        this.state = State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        token.publicId += "�";
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._err(ERR.abruptDoctypePublicIdentifier);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this.state = State.DATA;
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        token.publicId += String.fromCodePoint(cp);
    }
  }
  _stateAfterDoctypePublicIdentifier(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        this.state = State.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.state = State.DATA;
        this.emitCurrentDoctype(token);
        break;
      case CODE_POINTS.QUOTATION_MARK:
        this._err(ERR.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers);
        token.systemId = "";
        this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
        break;
      case CODE_POINTS.APOSTROPHE:
        this._err(ERR.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers);
        token.systemId = "";
        this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
        token.forceQuirks = true;
        this.state = State.BOGUS_DOCTYPE;
        this._stateBogusDoctype(cp);
    }
  }
  _stateBetweenDoctypePublicAndSystemIdentifiers(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.emitCurrentDoctype(token);
        this.state = State.DATA;
        break;
      case CODE_POINTS.QUOTATION_MARK:
        token.systemId = "";
        this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
        break;
      case CODE_POINTS.APOSTROPHE:
        token.systemId = "";
        this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
        token.forceQuirks = true;
        this.state = State.BOGUS_DOCTYPE;
        this._stateBogusDoctype(cp);
    }
  }
  _stateAfterDoctypeSystemKeyword(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        this.state = State.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER;
        break;
      case CODE_POINTS.QUOTATION_MARK:
        this._err(ERR.missingWhitespaceAfterDoctypeSystemKeyword);
        token.systemId = "";
        this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
        break;
      case CODE_POINTS.APOSTROPHE:
        this._err(ERR.missingWhitespaceAfterDoctypeSystemKeyword);
        token.systemId = "";
        this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._err(ERR.missingDoctypeSystemIdentifier);
        token.forceQuirks = true;
        this.state = State.DATA;
        this.emitCurrentDoctype(token);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
        token.forceQuirks = true;
        this.state = State.BOGUS_DOCTYPE;
        this._stateBogusDoctype(cp);
    }
  }
  _stateBeforeDoctypeSystemIdentifier(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        break;
      case CODE_POINTS.QUOTATION_MARK:
        token.systemId = "";
        this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
        break;
      case CODE_POINTS.APOSTROPHE:
        token.systemId = "";
        this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._err(ERR.missingDoctypeSystemIdentifier);
        token.forceQuirks = true;
        this.state = State.DATA;
        this.emitCurrentDoctype(token);
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
        token.forceQuirks = true;
        this.state = State.BOGUS_DOCTYPE;
        this._stateBogusDoctype(cp);
    }
  }
  _stateDoctypeSystemIdentifierDoubleQuoted(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.QUOTATION_MARK:
        this.state = State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        token.systemId += "�";
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._err(ERR.abruptDoctypeSystemIdentifier);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this.state = State.DATA;
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        token.systemId += String.fromCodePoint(cp);
    }
  }
  _stateDoctypeSystemIdentifierSingleQuoted(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.APOSTROPHE:
        this.state = State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        token.systemId += "�";
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this._err(ERR.abruptDoctypeSystemIdentifier);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this.state = State.DATA;
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        token.systemId += String.fromCodePoint(cp);
    }
  }
  _stateAfterDoctypeSystemIdentifier(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.SPACE:
      case CODE_POINTS.LINE_FEED:
      case CODE_POINTS.TABULATION:
      case CODE_POINTS.FORM_FEED:
        break;
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.emitCurrentDoctype(token);
        this.state = State.DATA;
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInDoctype);
        token.forceQuirks = true;
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
        break;
      default:
        this._err(ERR.unexpectedCharacterAfterDoctypeSystemIdentifier);
        this.state = State.BOGUS_DOCTYPE;
        this._stateBogusDoctype(cp);
    }
  }
  _stateBogusDoctype(cp) {
    const token = this.currentToken;
    switch (cp) {
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.emitCurrentDoctype(token);
        this.state = State.DATA;
        break;
      case CODE_POINTS.NULL:
        this._err(ERR.unexpectedNullCharacter);
        break;
      case CODE_POINTS.EOF:
        this.emitCurrentDoctype(token);
        this._emitEOFToken();
    }
  }
  _stateCdataSection(cp) {
    switch (cp) {
      case CODE_POINTS.RIGHT_SQUARE_BRACKET:
        this.state = State.CDATA_SECTION_BRACKET;
        break;
      case CODE_POINTS.EOF:
        this._err(ERR.eofInCdata);
        this._emitEOFToken();
        break;
      default:
        this._emitCodePoint(cp);
    }
  }
  _stateCdataSectionBracket(cp) {
    if (cp === CODE_POINTS.RIGHT_SQUARE_BRACKET) this.state = State.CDATA_SECTION_END;
    else {
      this._emitChars("]", -1);
      this.state = State.CDATA_SECTION;
      this._stateCdataSection(cp);
    }
  }
  _stateCdataSectionEnd(cp) {
    switch (cp) {
      case CODE_POINTS.GREATER_THAN_SIGN:
        this.state = State.DATA;
        break;
      case CODE_POINTS.RIGHT_SQUARE_BRACKET:
        this._emitChars("]", -2);
        break;
      default:
        this._emitChars("]]", -1);
        this.state = State.CDATA_SECTION;
        this._stateCdataSection(cp);
    }
  }
  _stateCharacterReference() {
    let length = this.entityDecoder.write(this.preprocessor.html, this.preprocessor.pos);
    if (length < 0) {
      if (this.preprocessor.lastChunkWritten) length = this.entityDecoder.end();
      else {
        this.active = false;
        this.preprocessor.pos = this.preprocessor.html.length - 1;
        this.consumedAfterSnapshot = 0;
        this.preprocessor.endOfChunkHit = true;
        return;
      }
    }
    if (length === 0) {
      this.preprocessor.pos = this.entityStartPos;
      this._flushCodePointConsumedAsCharacterReference(CODE_POINTS.AMPERSAND);
      this.state =
        !this._isCharacterReferenceInAttribute() && isAsciiAlphaNumeric(this.preprocessor.peek(1))
          ? State.AMBIGUOUS_AMPERSAND
          : this.returnState;
    } else this.state = this.returnState;
  }
  _stateAmbiguousAmpersand(cp) {
    if (isAsciiAlphaNumeric(cp)) this._flushCodePointConsumedAsCharacterReference(cp);
    else {
      if (cp === CODE_POINTS.SEMICOLON) this._err(ERR.unknownNamedCharacterReference);
      this.state = this.returnState;
      this._callState(cp);
    }
  }
};
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/parser/open-element-stack.js
const IMPLICIT_END_TAG_REQUIRED = /* @__PURE__ */ new Set([
  TAG_ID.DD,
  TAG_ID.DT,
  TAG_ID.LI,
  TAG_ID.OPTGROUP,
  TAG_ID.OPTION,
  TAG_ID.P,
  TAG_ID.RB,
  TAG_ID.RP,
  TAG_ID.RT,
  TAG_ID.RTC,
]);
const IMPLICIT_END_TAG_REQUIRED_THOROUGHLY = /* @__PURE__ */ new Set([
  ...IMPLICIT_END_TAG_REQUIRED,
  TAG_ID.CAPTION,
  TAG_ID.COLGROUP,
  TAG_ID.TBODY,
  TAG_ID.TD,
  TAG_ID.TFOOT,
  TAG_ID.TH,
  TAG_ID.THEAD,
  TAG_ID.TR,
]);
const SCOPING_ELEMENTS_HTML = /* @__PURE__ */ new Set([
  TAG_ID.APPLET,
  TAG_ID.CAPTION,
  TAG_ID.HTML,
  TAG_ID.MARQUEE,
  TAG_ID.OBJECT,
  TAG_ID.TABLE,
  TAG_ID.TD,
  TAG_ID.TEMPLATE,
  TAG_ID.TH,
]);
const SCOPING_ELEMENTS_HTML_LIST = /* @__PURE__ */ new Set([
  ...SCOPING_ELEMENTS_HTML,
  TAG_ID.OL,
  TAG_ID.UL,
]);
const SCOPING_ELEMENTS_HTML_BUTTON = /* @__PURE__ */ new Set([
  ...SCOPING_ELEMENTS_HTML,
  TAG_ID.BUTTON,
]);
const SCOPING_ELEMENTS_MATHML = /* @__PURE__ */ new Set([
  TAG_ID.ANNOTATION_XML,
  TAG_ID.MI,
  TAG_ID.MN,
  TAG_ID.MO,
  TAG_ID.MS,
  TAG_ID.MTEXT,
]);
const SCOPING_ELEMENTS_SVG = /* @__PURE__ */ new Set([
  TAG_ID.DESC,
  TAG_ID.FOREIGN_OBJECT,
  TAG_ID.TITLE,
]);
const TABLE_ROW_CONTEXT = /* @__PURE__ */ new Set([TAG_ID.TR, TAG_ID.TEMPLATE, TAG_ID.HTML]);
const TABLE_BODY_CONTEXT = /* @__PURE__ */ new Set([
  TAG_ID.TBODY,
  TAG_ID.TFOOT,
  TAG_ID.THEAD,
  TAG_ID.TEMPLATE,
  TAG_ID.HTML,
]);
const TABLE_CONTEXT = /* @__PURE__ */ new Set([TAG_ID.TABLE, TAG_ID.TEMPLATE, TAG_ID.HTML]);
const TABLE_CELLS = /* @__PURE__ */ new Set([TAG_ID.TD, TAG_ID.TH]);
var OpenElementStack = class {
  get currentTmplContentOrNode() {
    return this._isInTemplate() ? this.treeAdapter.getTemplateContent(this.current) : this.current;
  }
  constructor(document, treeAdapter, handler) {
    this.treeAdapter = treeAdapter;
    this.handler = handler;
    this.items = [];
    this.tagIDs = [];
    this.stackTop = -1;
    this.tmplCount = 0;
    this.currentTagId = TAG_ID.UNKNOWN;
    this.current = document;
  }
  _indexOf(element) {
    return this.items.lastIndexOf(element, this.stackTop);
  }
  _isInTemplate() {
    return (
      this.currentTagId === TAG_ID.TEMPLATE &&
      this.treeAdapter.getNamespaceURI(this.current) === NS.HTML
    );
  }
  _updateCurrentElement() {
    this.current = this.items[this.stackTop];
    this.currentTagId = this.tagIDs[this.stackTop];
  }
  push(element, tagID) {
    this.stackTop++;
    this.items[this.stackTop] = element;
    this.current = element;
    this.tagIDs[this.stackTop] = tagID;
    this.currentTagId = tagID;
    if (this._isInTemplate()) this.tmplCount++;
    this.handler.onItemPush(element, tagID, true);
  }
  pop() {
    const popped = this.current;
    if (this.tmplCount > 0 && this._isInTemplate()) this.tmplCount--;
    this.stackTop--;
    this._updateCurrentElement();
    this.handler.onItemPop(popped, true);
  }
  replace(oldElement, newElement) {
    const idx = this._indexOf(oldElement);
    this.items[idx] = newElement;
    if (idx === this.stackTop) this.current = newElement;
  }
  insertAfter(referenceElement, newElement, newElementID) {
    const insertionIdx = this._indexOf(referenceElement) + 1;
    this.items.splice(insertionIdx, 0, newElement);
    this.tagIDs.splice(insertionIdx, 0, newElementID);
    this.stackTop++;
    if (insertionIdx === this.stackTop) this._updateCurrentElement();
    if (this.current && this.currentTagId !== void 0)
      this.handler.onItemPush(this.current, this.currentTagId, insertionIdx === this.stackTop);
  }
  popUntilTagNamePopped(tagName) {
    let targetIdx = this.stackTop + 1;
    do targetIdx = this.tagIDs.lastIndexOf(tagName, targetIdx - 1);
    while (targetIdx > 0 && this.treeAdapter.getNamespaceURI(this.items[targetIdx]) !== NS.HTML);
    this.shortenToLength(Math.max(targetIdx, 0));
  }
  shortenToLength(idx) {
    while (this.stackTop >= idx) {
      const popped = this.current;
      if (this.tmplCount > 0 && this._isInTemplate()) this.tmplCount -= 1;
      this.stackTop--;
      this._updateCurrentElement();
      this.handler.onItemPop(popped, this.stackTop < idx);
    }
  }
  popUntilElementPopped(element) {
    const idx = this._indexOf(element);
    this.shortenToLength(Math.max(idx, 0));
  }
  popUntilPopped(tagNames, targetNS) {
    const idx = this._indexOfTagNames(tagNames, targetNS);
    this.shortenToLength(Math.max(idx, 0));
  }
  popUntilNumberedHeaderPopped() {
    this.popUntilPopped(NUMBERED_HEADERS, NS.HTML);
  }
  popUntilTableCellPopped() {
    this.popUntilPopped(TABLE_CELLS, NS.HTML);
  }
  popAllUpToHtmlElement() {
    this.tmplCount = 0;
    this.shortenToLength(1);
  }
  _indexOfTagNames(tagNames, namespace) {
    for (let i = this.stackTop; i >= 0; i--)
      if (
        tagNames.has(this.tagIDs[i]) &&
        this.treeAdapter.getNamespaceURI(this.items[i]) === namespace
      )
        return i;
    return -1;
  }
  clearBackTo(tagNames, targetNS) {
    const idx = this._indexOfTagNames(tagNames, targetNS);
    this.shortenToLength(idx + 1);
  }
  clearBackToTableContext() {
    this.clearBackTo(TABLE_CONTEXT, NS.HTML);
  }
  clearBackToTableBodyContext() {
    this.clearBackTo(TABLE_BODY_CONTEXT, NS.HTML);
  }
  clearBackToTableRowContext() {
    this.clearBackTo(TABLE_ROW_CONTEXT, NS.HTML);
  }
  remove(element) {
    const idx = this._indexOf(element);
    if (idx >= 0) {
      if (idx === this.stackTop) this.pop();
      else {
        this.items.splice(idx, 1);
        this.tagIDs.splice(idx, 1);
        this.stackTop--;
        this._updateCurrentElement();
        this.handler.onItemPop(element, false);
      }
    }
  }
  tryPeekProperlyNestedBodyElement() {
    return this.stackTop >= 1 && this.tagIDs[1] === TAG_ID.BODY ? this.items[1] : null;
  }
  contains(element) {
    return this._indexOf(element) > -1;
  }
  getCommonAncestor(element) {
    const elementIdx = this._indexOf(element) - 1;
    return elementIdx >= 0 ? this.items[elementIdx] : null;
  }
  isRootHtmlElementCurrent() {
    return this.stackTop === 0 && this.tagIDs[0] === TAG_ID.HTML;
  }
  hasInDynamicScope(tagName, htmlScope) {
    for (let i = this.stackTop; i >= 0; i--) {
      const tn = this.tagIDs[i];
      switch (this.treeAdapter.getNamespaceURI(this.items[i])) {
        case NS.HTML:
          if (tn === tagName) return true;
          if (htmlScope.has(tn)) return false;
          break;
        case NS.SVG:
          if (SCOPING_ELEMENTS_SVG.has(tn)) return false;
          break;
        case NS.MATHML:
          if (SCOPING_ELEMENTS_MATHML.has(tn)) return false;
      }
    }
    return true;
  }
  hasInScope(tagName) {
    return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML);
  }
  hasInListItemScope(tagName) {
    return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML_LIST);
  }
  hasInButtonScope(tagName) {
    return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML_BUTTON);
  }
  hasNumberedHeaderInScope() {
    for (let i = this.stackTop; i >= 0; i--) {
      const tn = this.tagIDs[i];
      switch (this.treeAdapter.getNamespaceURI(this.items[i])) {
        case NS.HTML:
          if (NUMBERED_HEADERS.has(tn)) return true;
          if (SCOPING_ELEMENTS_HTML.has(tn)) return false;
          break;
        case NS.SVG:
          if (SCOPING_ELEMENTS_SVG.has(tn)) return false;
          break;
        case NS.MATHML:
          if (SCOPING_ELEMENTS_MATHML.has(tn)) return false;
      }
    }
    return true;
  }
  hasInTableScope(tagName) {
    for (let i = this.stackTop; i >= 0; i--) {
      if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) continue;
      switch (this.tagIDs[i]) {
        case tagName:
          return true;
        case TAG_ID.TABLE:
        case TAG_ID.HTML:
          return false;
      }
    }
    return true;
  }
  hasTableBodyContextInTableScope() {
    for (let i = this.stackTop; i >= 0; i--) {
      if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) continue;
      switch (this.tagIDs[i]) {
        case TAG_ID.TBODY:
        case TAG_ID.THEAD:
        case TAG_ID.TFOOT:
          return true;
        case TAG_ID.TABLE:
        case TAG_ID.HTML:
          return false;
      }
    }
    return true;
  }
  hasInSelectScope(tagName) {
    for (let i = this.stackTop; i >= 0; i--) {
      if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) continue;
      switch (this.tagIDs[i]) {
        case tagName:
          return true;
        case TAG_ID.OPTION:
        case TAG_ID.OPTGROUP:
          break;
        default:
          return false;
      }
    }
    return true;
  }
  generateImpliedEndTags() {
    while (this.currentTagId !== void 0 && IMPLICIT_END_TAG_REQUIRED.has(this.currentTagId))
      this.pop();
  }
  generateImpliedEndTagsThoroughly() {
    while (
      this.currentTagId !== void 0 &&
      IMPLICIT_END_TAG_REQUIRED_THOROUGHLY.has(this.currentTagId)
    )
      this.pop();
  }
  generateImpliedEndTagsWithExclusion(exclusionId) {
    while (
      this.currentTagId !== void 0 &&
      this.currentTagId !== exclusionId &&
      IMPLICIT_END_TAG_REQUIRED_THOROUGHLY.has(this.currentTagId)
    )
      this.pop();
  }
};
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/parser/formatting-element-list.js
const NOAH_ARK_CAPACITY = 3;
var EntryType;
(function (EntryType) {
  EntryType[(EntryType["Marker"] = 0)] = "Marker";
  EntryType[(EntryType["Element"] = 1)] = "Element";
})(EntryType || (EntryType = {}));
const MARKER = { type: EntryType.Marker };
var FormattingElementList = class {
  constructor(treeAdapter) {
    this.treeAdapter = treeAdapter;
    this.entries = [];
    this.bookmark = null;
  }
  _getNoahArkConditionCandidates(newElement, neAttrs) {
    const candidates = [];
    const neAttrsLength = neAttrs.length;
    const neTagName = this.treeAdapter.getTagName(newElement);
    const neNamespaceURI = this.treeAdapter.getNamespaceURI(newElement);
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      if (entry.type === EntryType.Marker) break;
      const { element } = entry;
      if (
        this.treeAdapter.getTagName(element) === neTagName &&
        this.treeAdapter.getNamespaceURI(element) === neNamespaceURI
      ) {
        const elementAttrs = this.treeAdapter.getAttrList(element);
        if (elementAttrs.length === neAttrsLength)
          candidates.push({
            idx: i,
            attrs: elementAttrs,
          });
      }
    }
    return candidates;
  }
  _ensureNoahArkCondition(newElement) {
    if (this.entries.length < NOAH_ARK_CAPACITY) return;
    const neAttrs = this.treeAdapter.getAttrList(newElement);
    const candidates = this._getNoahArkConditionCandidates(newElement, neAttrs);
    if (candidates.length < NOAH_ARK_CAPACITY) return;
    const neAttrsMap = new Map(neAttrs.map((neAttr) => [neAttr.name, neAttr.value]));
    let validCandidates = 0;
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (candidate.attrs.every((cAttr) => neAttrsMap.get(cAttr.name) === cAttr.value)) {
        validCandidates += 1;
        if (validCandidates >= NOAH_ARK_CAPACITY) this.entries.splice(candidate.idx, 1);
      }
    }
  }
  insertMarker() {
    this.entries.unshift(MARKER);
  }
  pushElement(element, token) {
    this._ensureNoahArkCondition(element);
    this.entries.unshift({
      type: EntryType.Element,
      element,
      token,
    });
  }
  insertElementAfterBookmark(element, token) {
    const bookmarkIdx = this.entries.indexOf(this.bookmark);
    this.entries.splice(bookmarkIdx, 0, {
      type: EntryType.Element,
      element,
      token,
    });
  }
  removeEntry(entry) {
    const entryIndex = this.entries.indexOf(entry);
    if (entryIndex !== -1) this.entries.splice(entryIndex, 1);
  }
  /**
   * Clears the list of formatting elements up to the last marker.
   *
   * @see https://html.spec.whatwg.org/multipage/parsing.html#clear-the-list-of-active-formatting-elements-up-to-the-last-marker
   */
  clearToLastMarker() {
    const markerIdx = this.entries.indexOf(MARKER);
    if (markerIdx === -1) this.entries.length = 0;
    else this.entries.splice(0, markerIdx + 1);
  }
  getElementEntryInScopeWithTagName(tagName) {
    const entry = this.entries.find(
      (entry) =>
        entry.type === EntryType.Marker || this.treeAdapter.getTagName(entry.element) === tagName,
    );
    return entry && entry.type === EntryType.Element ? entry : null;
  }
  getElementEntry(element) {
    return this.entries.find(
      (entry) => entry.type === EntryType.Element && entry.element === element,
    );
  }
};
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/tree-adapters/default.js
const defaultTreeAdapter = {
  createDocument() {
    return {
      nodeName: "#document",
      mode: DOCUMENT_MODE.NO_QUIRKS,
      childNodes: [],
    };
  },
  createDocumentFragment() {
    return {
      nodeName: "#document-fragment",
      childNodes: [],
    };
  },
  createElement(tagName, namespaceURI, attrs) {
    return {
      nodeName: tagName,
      tagName,
      attrs,
      namespaceURI,
      childNodes: [],
      parentNode: null,
    };
  },
  createCommentNode(data) {
    return {
      nodeName: "#comment",
      data,
      parentNode: null,
    };
  },
  createTextNode(value) {
    return {
      nodeName: "#text",
      value,
      parentNode: null,
    };
  },
  appendChild(parentNode, newNode) {
    parentNode.childNodes.push(newNode);
    newNode.parentNode = parentNode;
  },
  insertBefore(parentNode, newNode, referenceNode) {
    const insertionIdx = parentNode.childNodes.indexOf(referenceNode);
    parentNode.childNodes.splice(insertionIdx, 0, newNode);
    newNode.parentNode = parentNode;
  },
  setTemplateContent(templateElement, contentElement) {
    templateElement.content = contentElement;
  },
  getTemplateContent(templateElement) {
    return templateElement.content;
  },
  setDocumentType(document, name, publicId, systemId) {
    const doctypeNode = document.childNodes.find((node) => node.nodeName === "#documentType");
    if (doctypeNode) {
      doctypeNode.name = name;
      doctypeNode.publicId = publicId;
      doctypeNode.systemId = systemId;
    } else {
      const node = {
        nodeName: "#documentType",
        name,
        publicId,
        systemId,
        parentNode: null,
      };
      defaultTreeAdapter.appendChild(document, node);
    }
  },
  setDocumentMode(document, mode) {
    document.mode = mode;
  },
  getDocumentMode(document) {
    return document.mode;
  },
  detachNode(node) {
    if (node.parentNode) {
      const idx = node.parentNode.childNodes.indexOf(node);
      node.parentNode.childNodes.splice(idx, 1);
      node.parentNode = null;
    }
  },
  insertText(parentNode, text) {
    if (parentNode.childNodes.length > 0) {
      const prevNode = parentNode.childNodes[parentNode.childNodes.length - 1];
      if (defaultTreeAdapter.isTextNode(prevNode)) {
        prevNode.value += text;
        return;
      }
    }
    defaultTreeAdapter.appendChild(parentNode, defaultTreeAdapter.createTextNode(text));
  },
  insertTextBefore(parentNode, text, referenceNode) {
    const prevNode = parentNode.childNodes[parentNode.childNodes.indexOf(referenceNode) - 1];
    if (prevNode && defaultTreeAdapter.isTextNode(prevNode)) prevNode.value += text;
    else
      defaultTreeAdapter.insertBefore(
        parentNode,
        defaultTreeAdapter.createTextNode(text),
        referenceNode,
      );
  },
  adoptAttributes(recipient, attrs) {
    const recipientAttrsMap = new Set(recipient.attrs.map((attr) => attr.name));
    for (let j = 0; j < attrs.length; j++)
      if (!recipientAttrsMap.has(attrs[j].name)) recipient.attrs.push(attrs[j]);
  },
  getFirstChild(node) {
    return node.childNodes[0];
  },
  getChildNodes(node) {
    return node.childNodes;
  },
  getParentNode(node) {
    return node.parentNode;
  },
  getAttrList(element) {
    return element.attrs;
  },
  getTagName(element) {
    return element.tagName;
  },
  getNamespaceURI(element) {
    return element.namespaceURI;
  },
  getTextNodeContent(textNode) {
    return textNode.value;
  },
  getCommentNodeContent(commentNode) {
    return commentNode.data;
  },
  getDocumentTypeNodeName(doctypeNode) {
    return doctypeNode.name;
  },
  getDocumentTypeNodePublicId(doctypeNode) {
    return doctypeNode.publicId;
  },
  getDocumentTypeNodeSystemId(doctypeNode) {
    return doctypeNode.systemId;
  },
  isTextNode(node) {
    return node.nodeName === "#text";
  },
  isCommentNode(node) {
    return node.nodeName === "#comment";
  },
  isDocumentTypeNode(node) {
    return node.nodeName === "#documentType";
  },
  isElementNode(node) {
    return Object.prototype.hasOwnProperty.call(node, "tagName");
  },
  setNodeSourceCodeLocation(node, location) {
    node.sourceCodeLocation = location;
  },
  getNodeSourceCodeLocation(node) {
    return node.sourceCodeLocation;
  },
  updateNodeSourceCodeLocation(node, endLocation) {
    node.sourceCodeLocation = {
      ...node.sourceCodeLocation,
      ...endLocation,
    };
  },
};
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/common/doctype.js
const VALID_DOCTYPE_NAME = "html";
const VALID_SYSTEM_ID = "about:legacy-compat";
const QUIRKS_MODE_SYSTEM_ID = "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd";
const QUIRKS_MODE_PUBLIC_ID_PREFIXES = [
  "+//silmaril//dtd html pro v0r11 19970101//",
  "-//as//dtd html 3.0 aswedit + extensions//",
  "-//advasoft ltd//dtd html 3.0 aswedit + extensions//",
  "-//ietf//dtd html 2.0 level 1//",
  "-//ietf//dtd html 2.0 level 2//",
  "-//ietf//dtd html 2.0 strict level 1//",
  "-//ietf//dtd html 2.0 strict level 2//",
  "-//ietf//dtd html 2.0 strict//",
  "-//ietf//dtd html 2.0//",
  "-//ietf//dtd html 2.1e//",
  "-//ietf//dtd html 3.0//",
  "-//ietf//dtd html 3.2 final//",
  "-//ietf//dtd html 3.2//",
  "-//ietf//dtd html 3//",
  "-//ietf//dtd html level 0//",
  "-//ietf//dtd html level 1//",
  "-//ietf//dtd html level 2//",
  "-//ietf//dtd html level 3//",
  "-//ietf//dtd html strict level 0//",
  "-//ietf//dtd html strict level 1//",
  "-//ietf//dtd html strict level 2//",
  "-//ietf//dtd html strict level 3//",
  "-//ietf//dtd html strict//",
  "-//ietf//dtd html//",
  "-//metrius//dtd metrius presentational//",
  "-//microsoft//dtd internet explorer 2.0 html strict//",
  "-//microsoft//dtd internet explorer 2.0 html//",
  "-//microsoft//dtd internet explorer 2.0 tables//",
  "-//microsoft//dtd internet explorer 3.0 html strict//",
  "-//microsoft//dtd internet explorer 3.0 html//",
  "-//microsoft//dtd internet explorer 3.0 tables//",
  "-//netscape comm. corp.//dtd html//",
  "-//netscape comm. corp.//dtd strict html//",
  "-//o'reilly and associates//dtd html 2.0//",
  "-//o'reilly and associates//dtd html extended 1.0//",
  "-//o'reilly and associates//dtd html extended relaxed 1.0//",
  "-//sq//dtd html 2.0 hotmetal + extensions//",
  "-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//",
  "-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//",
  "-//spyglass//dtd html 2.0 extended//",
  "-//sun microsystems corp.//dtd hotjava html//",
  "-//sun microsystems corp.//dtd hotjava strict html//",
  "-//w3c//dtd html 3 1995-03-24//",
  "-//w3c//dtd html 3.2 draft//",
  "-//w3c//dtd html 3.2 final//",
  "-//w3c//dtd html 3.2//",
  "-//w3c//dtd html 3.2s draft//",
  "-//w3c//dtd html 4.0 frameset//",
  "-//w3c//dtd html 4.0 transitional//",
  "-//w3c//dtd html experimental 19960712//",
  "-//w3c//dtd html experimental 970421//",
  "-//w3c//dtd w3 html//",
  "-//w3o//dtd w3 html 3.0//",
  "-//webtechs//dtd mozilla html 2.0//",
  "-//webtechs//dtd mozilla html//",
];
const QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
  ...QUIRKS_MODE_PUBLIC_ID_PREFIXES,
  "-//w3c//dtd html 4.01 frameset//",
  "-//w3c//dtd html 4.01 transitional//",
];
const QUIRKS_MODE_PUBLIC_IDS = /* @__PURE__ */ new Set([
  "-//w3o//dtd w3 html strict 3.0//en//",
  "-/w3c/dtd html 4.0 transitional/en",
  "html",
]);
const LIMITED_QUIRKS_PUBLIC_ID_PREFIXES = [
  "-//w3c//dtd xhtml 1.0 frameset//",
  "-//w3c//dtd xhtml 1.0 transitional//",
];
const LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
  ...LIMITED_QUIRKS_PUBLIC_ID_PREFIXES,
  "-//w3c//dtd html 4.01 frameset//",
  "-//w3c//dtd html 4.01 transitional//",
];
function hasPrefix(publicId, prefixes) {
  return prefixes.some((prefix) => publicId.startsWith(prefix));
}
function isConforming(token) {
  return (
    token.name === VALID_DOCTYPE_NAME &&
    token.publicId === null &&
    (token.systemId === null || token.systemId === VALID_SYSTEM_ID)
  );
}
function getDocumentMode(token) {
  if (token.name !== VALID_DOCTYPE_NAME) return DOCUMENT_MODE.QUIRKS;
  const { systemId } = token;
  if (systemId && systemId.toLowerCase() === QUIRKS_MODE_SYSTEM_ID) return DOCUMENT_MODE.QUIRKS;
  let { publicId } = token;
  if (publicId !== null) {
    publicId = publicId.toLowerCase();
    if (QUIRKS_MODE_PUBLIC_IDS.has(publicId)) return DOCUMENT_MODE.QUIRKS;
    let prefixes =
      systemId === null
        ? QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES
        : QUIRKS_MODE_PUBLIC_ID_PREFIXES;
    if (hasPrefix(publicId, prefixes)) return DOCUMENT_MODE.QUIRKS;
    prefixes =
      systemId === null
        ? LIMITED_QUIRKS_PUBLIC_ID_PREFIXES
        : LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES;
    if (hasPrefix(publicId, prefixes)) return DOCUMENT_MODE.LIMITED_QUIRKS;
  }
  return DOCUMENT_MODE.NO_QUIRKS;
}
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/common/foreign-content.js
const MIME_TYPES = {
  TEXT_HTML: "text/html",
  APPLICATION_XML: "application/xhtml+xml",
};
const DEFINITION_URL_ATTR = "definitionurl";
const ADJUSTED_DEFINITION_URL_ATTR = "definitionURL";
const SVG_ATTRS_ADJUSTMENT_MAP = new Map(
  [
    "attributeName",
    "attributeType",
    "baseFrequency",
    "baseProfile",
    "calcMode",
    "clipPathUnits",
    "diffuseConstant",
    "edgeMode",
    "filterUnits",
    "glyphRef",
    "gradientTransform",
    "gradientUnits",
    "kernelMatrix",
    "kernelUnitLength",
    "keyPoints",
    "keySplines",
    "keyTimes",
    "lengthAdjust",
    "limitingConeAngle",
    "markerHeight",
    "markerUnits",
    "markerWidth",
    "maskContentUnits",
    "maskUnits",
    "numOctaves",
    "pathLength",
    "patternContentUnits",
    "patternTransform",
    "patternUnits",
    "pointsAtX",
    "pointsAtY",
    "pointsAtZ",
    "preserveAlpha",
    "preserveAspectRatio",
    "primitiveUnits",
    "refX",
    "refY",
    "repeatCount",
    "repeatDur",
    "requiredExtensions",
    "requiredFeatures",
    "specularConstant",
    "specularExponent",
    "spreadMethod",
    "startOffset",
    "stdDeviation",
    "stitchTiles",
    "surfaceScale",
    "systemLanguage",
    "tableValues",
    "targetX",
    "targetY",
    "textLength",
    "viewBox",
    "viewTarget",
    "xChannelSelector",
    "yChannelSelector",
    "zoomAndPan",
  ].map((attr) => [attr.toLowerCase(), attr]),
);
const XML_ATTRS_ADJUSTMENT_MAP = /* @__PURE__ */ new Map([
  [
    "xlink:actuate",
    {
      prefix: "xlink",
      name: "actuate",
      namespace: NS.XLINK,
    },
  ],
  [
    "xlink:arcrole",
    {
      prefix: "xlink",
      name: "arcrole",
      namespace: NS.XLINK,
    },
  ],
  [
    "xlink:href",
    {
      prefix: "xlink",
      name: "href",
      namespace: NS.XLINK,
    },
  ],
  [
    "xlink:role",
    {
      prefix: "xlink",
      name: "role",
      namespace: NS.XLINK,
    },
  ],
  [
    "xlink:show",
    {
      prefix: "xlink",
      name: "show",
      namespace: NS.XLINK,
    },
  ],
  [
    "xlink:title",
    {
      prefix: "xlink",
      name: "title",
      namespace: NS.XLINK,
    },
  ],
  [
    "xlink:type",
    {
      prefix: "xlink",
      name: "type",
      namespace: NS.XLINK,
    },
  ],
  [
    "xml:lang",
    {
      prefix: "xml",
      name: "lang",
      namespace: NS.XML,
    },
  ],
  [
    "xml:space",
    {
      prefix: "xml",
      name: "space",
      namespace: NS.XML,
    },
  ],
  [
    "xmlns",
    {
      prefix: "",
      name: "xmlns",
      namespace: NS.XMLNS,
    },
  ],
  [
    "xmlns:xlink",
    {
      prefix: "xmlns",
      name: "xlink",
      namespace: NS.XMLNS,
    },
  ],
]);
const SVG_TAG_NAMES_ADJUSTMENT_MAP = new Map(
  [
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "clipPath",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "foreignObject",
    "glyphRef",
    "linearGradient",
    "radialGradient",
    "textPath",
  ].map((tn) => [tn.toLowerCase(), tn]),
);
const EXITS_FOREIGN_CONTENT = /* @__PURE__ */ new Set([
  TAG_ID.B,
  TAG_ID.BIG,
  TAG_ID.BLOCKQUOTE,
  TAG_ID.BODY,
  TAG_ID.BR,
  TAG_ID.CENTER,
  TAG_ID.CODE,
  TAG_ID.DD,
  TAG_ID.DIV,
  TAG_ID.DL,
  TAG_ID.DT,
  TAG_ID.EM,
  TAG_ID.EMBED,
  TAG_ID.H1,
  TAG_ID.H2,
  TAG_ID.H3,
  TAG_ID.H4,
  TAG_ID.H5,
  TAG_ID.H6,
  TAG_ID.HEAD,
  TAG_ID.HR,
  TAG_ID.I,
  TAG_ID.IMG,
  TAG_ID.LI,
  TAG_ID.LISTING,
  TAG_ID.MENU,
  TAG_ID.META,
  TAG_ID.NOBR,
  TAG_ID.OL,
  TAG_ID.P,
  TAG_ID.PRE,
  TAG_ID.RUBY,
  TAG_ID.S,
  TAG_ID.SMALL,
  TAG_ID.SPAN,
  TAG_ID.STRONG,
  TAG_ID.STRIKE,
  TAG_ID.SUB,
  TAG_ID.SUP,
  TAG_ID.TABLE,
  TAG_ID.TT,
  TAG_ID.U,
  TAG_ID.UL,
  TAG_ID.VAR,
]);
function causesExit(startTagToken) {
  const tn = startTagToken.tagID;
  return (
    (tn === TAG_ID.FONT &&
      startTagToken.attrs.some(
        ({ name }) => name === ATTRS.COLOR || name === ATTRS.SIZE || name === ATTRS.FACE,
      )) ||
    EXITS_FOREIGN_CONTENT.has(tn)
  );
}
function adjustTokenMathMLAttrs(token) {
  for (let i = 0; i < token.attrs.length; i++)
    if (token.attrs[i].name === DEFINITION_URL_ATTR) {
      token.attrs[i].name = ADJUSTED_DEFINITION_URL_ATTR;
      break;
    }
}
function adjustTokenSVGAttrs(token) {
  for (let i = 0; i < token.attrs.length; i++) {
    const adjustedAttrName = SVG_ATTRS_ADJUSTMENT_MAP.get(token.attrs[i].name);
    if (adjustedAttrName != null) token.attrs[i].name = adjustedAttrName;
  }
}
function adjustTokenXMLAttrs(token) {
  for (let i = 0; i < token.attrs.length; i++) {
    const adjustedAttrEntry = XML_ATTRS_ADJUSTMENT_MAP.get(token.attrs[i].name);
    if (adjustedAttrEntry) {
      token.attrs[i].prefix = adjustedAttrEntry.prefix;
      token.attrs[i].name = adjustedAttrEntry.name;
      token.attrs[i].namespace = adjustedAttrEntry.namespace;
    }
  }
}
function adjustTokenSVGTagName(token) {
  const adjustedTagName = SVG_TAG_NAMES_ADJUSTMENT_MAP.get(token.tagName);
  if (adjustedTagName != null) {
    token.tagName = adjustedTagName;
    token.tagID = getTagID(token.tagName);
  }
}
function isMathMLTextIntegrationPoint(tn, ns) {
  return (
    ns === NS.MATHML &&
    (tn === TAG_ID.MI ||
      tn === TAG_ID.MO ||
      tn === TAG_ID.MN ||
      tn === TAG_ID.MS ||
      tn === TAG_ID.MTEXT)
  );
}
function isHtmlIntegrationPoint(tn, ns, attrs) {
  if (ns === NS.MATHML && tn === TAG_ID.ANNOTATION_XML) {
    for (let i = 0; i < attrs.length; i++)
      if (attrs[i].name === ATTRS.ENCODING) {
        const value = attrs[i].value.toLowerCase();
        return value === MIME_TYPES.TEXT_HTML || value === MIME_TYPES.APPLICATION_XML;
      }
  }
  return (
    ns === NS.SVG && (tn === TAG_ID.FOREIGN_OBJECT || tn === TAG_ID.DESC || tn === TAG_ID.TITLE)
  );
}
function isIntegrationPoint(tn, ns, attrs, foreignNS) {
  return (
    ((!foreignNS || foreignNS === NS.HTML) && isHtmlIntegrationPoint(tn, ns, attrs)) ||
    ((!foreignNS || foreignNS === NS.MATHML) && isMathMLTextIntegrationPoint(tn, ns))
  );
}
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/parser/index.js
const HIDDEN_INPUT_TYPE = "hidden";
const AA_OUTER_LOOP_ITER = 8;
const AA_INNER_LOOP_ITER = 3;
var InsertionMode;
(function (InsertionMode) {
  InsertionMode[(InsertionMode["INITIAL"] = 0)] = "INITIAL";
  InsertionMode[(InsertionMode["BEFORE_HTML"] = 1)] = "BEFORE_HTML";
  InsertionMode[(InsertionMode["BEFORE_HEAD"] = 2)] = "BEFORE_HEAD";
  InsertionMode[(InsertionMode["IN_HEAD"] = 3)] = "IN_HEAD";
  InsertionMode[(InsertionMode["IN_HEAD_NO_SCRIPT"] = 4)] = "IN_HEAD_NO_SCRIPT";
  InsertionMode[(InsertionMode["AFTER_HEAD"] = 5)] = "AFTER_HEAD";
  InsertionMode[(InsertionMode["IN_BODY"] = 6)] = "IN_BODY";
  InsertionMode[(InsertionMode["TEXT"] = 7)] = "TEXT";
  InsertionMode[(InsertionMode["IN_TABLE"] = 8)] = "IN_TABLE";
  InsertionMode[(InsertionMode["IN_TABLE_TEXT"] = 9)] = "IN_TABLE_TEXT";
  InsertionMode[(InsertionMode["IN_CAPTION"] = 10)] = "IN_CAPTION";
  InsertionMode[(InsertionMode["IN_COLUMN_GROUP"] = 11)] = "IN_COLUMN_GROUP";
  InsertionMode[(InsertionMode["IN_TABLE_BODY"] = 12)] = "IN_TABLE_BODY";
  InsertionMode[(InsertionMode["IN_ROW"] = 13)] = "IN_ROW";
  InsertionMode[(InsertionMode["IN_CELL"] = 14)] = "IN_CELL";
  InsertionMode[(InsertionMode["IN_SELECT"] = 15)] = "IN_SELECT";
  InsertionMode[(InsertionMode["IN_SELECT_IN_TABLE"] = 16)] = "IN_SELECT_IN_TABLE";
  InsertionMode[(InsertionMode["IN_TEMPLATE"] = 17)] = "IN_TEMPLATE";
  InsertionMode[(InsertionMode["AFTER_BODY"] = 18)] = "AFTER_BODY";
  InsertionMode[(InsertionMode["IN_FRAMESET"] = 19)] = "IN_FRAMESET";
  InsertionMode[(InsertionMode["AFTER_FRAMESET"] = 20)] = "AFTER_FRAMESET";
  InsertionMode[(InsertionMode["AFTER_AFTER_BODY"] = 21)] = "AFTER_AFTER_BODY";
  InsertionMode[(InsertionMode["AFTER_AFTER_FRAMESET"] = 22)] = "AFTER_AFTER_FRAMESET";
})(InsertionMode || (InsertionMode = {}));
const BASE_LOC = {
  startLine: -1,
  startCol: -1,
  startOffset: -1,
  endLine: -1,
  endCol: -1,
  endOffset: -1,
};
const TABLE_STRUCTURE_TAGS = /* @__PURE__ */ new Set([
  TAG_ID.TABLE,
  TAG_ID.TBODY,
  TAG_ID.TFOOT,
  TAG_ID.THEAD,
  TAG_ID.TR,
]);
const defaultParserOptions = {
  scriptingEnabled: true,
  sourceCodeLocationInfo: false,
  treeAdapter: defaultTreeAdapter,
  onParseError: null,
};
var Parser = class {
  constructor(options, document, fragmentContext = null, scriptHandler = null) {
    this.fragmentContext = fragmentContext;
    this.scriptHandler = scriptHandler;
    this.currentToken = null;
    this.stopped = false;
    /** @internal */
    this.insertionMode = InsertionMode.INITIAL;
    /** @internal */
    this.originalInsertionMode = InsertionMode.INITIAL;
    /** @internal */
    this.headElement = null;
    /** @internal */
    this.formElement = null;
    /** Indicates that the current node is not an element in the HTML namespace */
    this.currentNotInHTML = false;
    /**
     * The template insertion mode stack is maintained from the left.
     * Ie. the topmost element will always have index 0.
     *
     * @internal
     */
    this.tmplInsertionModeStack = [];
    /** @internal */
    this.pendingCharacterTokens = [];
    /** @internal */
    this.hasNonWhitespacePendingCharacterToken = false;
    /** @internal */
    this.framesetOk = true;
    /** @internal */
    this.skipNextNewLine = false;
    /** @internal */
    this.fosterParentingEnabled = false;
    this.options = {
      ...defaultParserOptions,
      ...options,
    };
    this.treeAdapter = this.options.treeAdapter;
    this.onParseError = this.options.onParseError;
    if (this.onParseError) this.options.sourceCodeLocationInfo = true;
    this.document =
      document !== null && document !== void 0 ? document : this.treeAdapter.createDocument();
    this.tokenizer = new Tokenizer(this.options, this);
    this.activeFormattingElements = new FormattingElementList(this.treeAdapter);
    this.fragmentContextID = fragmentContext
      ? getTagID(this.treeAdapter.getTagName(fragmentContext))
      : TAG_ID.UNKNOWN;
    this._setContextModes(
      fragmentContext !== null && fragmentContext !== void 0 ? fragmentContext : this.document,
      this.fragmentContextID,
    );
    this.openElements = new OpenElementStack(this.document, this.treeAdapter, this);
  }
  static parse(html, options) {
    const parser = new this(options);
    parser.tokenizer.write(html, true);
    return parser.document;
  }
  static getFragmentParser(fragmentContext, options) {
    const opts = {
      ...defaultParserOptions,
      ...options,
    };
    (fragmentContext !== null && fragmentContext !== void 0) ||
      (fragmentContext = opts.treeAdapter.createElement(TAG_NAMES.TEMPLATE, NS.HTML, []));
    const documentMock = opts.treeAdapter.createElement("documentmock", NS.HTML, []);
    const parser = new this(opts, documentMock, fragmentContext);
    if (parser.fragmentContextID === TAG_ID.TEMPLATE)
      parser.tmplInsertionModeStack.unshift(InsertionMode.IN_TEMPLATE);
    parser._initTokenizerForFragmentParsing();
    parser._insertFakeRootElement();
    parser._resetInsertionMode();
    parser._findFormInFragmentContext();
    return parser;
  }
  getFragment() {
    const rootElement = this.treeAdapter.getFirstChild(this.document);
    const fragment = this.treeAdapter.createDocumentFragment();
    this._adoptNodes(rootElement, fragment);
    return fragment;
  }
  /** @internal */
  _err(token, code, beforeToken) {
    var _a;
    if (!this.onParseError) return;
    const loc = (_a = token.location) !== null && _a !== void 0 ? _a : BASE_LOC;
    const err = {
      code,
      startLine: loc.startLine,
      startCol: loc.startCol,
      startOffset: loc.startOffset,
      endLine: beforeToken ? loc.startLine : loc.endLine,
      endCol: beforeToken ? loc.startCol : loc.endCol,
      endOffset: beforeToken ? loc.startOffset : loc.endOffset,
    };
    this.onParseError(err);
  }
  /** @internal */
  onItemPush(node, tid, isTop) {
    var _a, _b;
    (_b = (_a = this.treeAdapter).onItemPush) === null || _b === void 0 || _b.call(_a, node);
    if (isTop && this.openElements.stackTop > 0) this._setContextModes(node, tid);
  }
  /** @internal */
  onItemPop(node, isTop) {
    var _a, _b;
    if (this.options.sourceCodeLocationInfo) this._setEndLocation(node, this.currentToken);
    (_b = (_a = this.treeAdapter).onItemPop) === null ||
      _b === void 0 ||
      _b.call(_a, node, this.openElements.current);
    if (isTop) {
      let current;
      let currentTagId;
      if (this.openElements.stackTop === 0 && this.fragmentContext) {
        current = this.fragmentContext;
        currentTagId = this.fragmentContextID;
      } else ({ current, currentTagId } = this.openElements);
      this._setContextModes(current, currentTagId);
    }
  }
  _setContextModes(current, tid) {
    const isHTML =
      current === this.document ||
      (current && this.treeAdapter.getNamespaceURI(current) === NS.HTML);
    this.currentNotInHTML = !isHTML;
    this.tokenizer.inForeignNode =
      !isHTML && current !== void 0 && tid !== void 0 && !this._isIntegrationPoint(tid, current);
  }
  /** @protected */
  _switchToTextParsing(currentToken, nextTokenizerState) {
    this._insertElement(currentToken, NS.HTML);
    this.tokenizer.state = nextTokenizerState;
    this.originalInsertionMode = this.insertionMode;
    this.insertionMode = InsertionMode.TEXT;
  }
  switchToPlaintextParsing() {
    this.insertionMode = InsertionMode.TEXT;
    this.originalInsertionMode = InsertionMode.IN_BODY;
    this.tokenizer.state = TokenizerMode.PLAINTEXT;
  }
  /** @protected */
  _getAdjustedCurrentElement() {
    return this.openElements.stackTop === 0 && this.fragmentContext
      ? this.fragmentContext
      : this.openElements.current;
  }
  /** @protected */
  _findFormInFragmentContext() {
    let node = this.fragmentContext;
    while (node) {
      if (this.treeAdapter.getTagName(node) === TAG_NAMES.FORM) {
        this.formElement = node;
        break;
      }
      node = this.treeAdapter.getParentNode(node);
    }
  }
  _initTokenizerForFragmentParsing() {
    if (!this.fragmentContext || this.treeAdapter.getNamespaceURI(this.fragmentContext) !== NS.HTML)
      return;
    switch (this.fragmentContextID) {
      case TAG_ID.TITLE:
      case TAG_ID.TEXTAREA:
        this.tokenizer.state = TokenizerMode.RCDATA;
        break;
      case TAG_ID.STYLE:
      case TAG_ID.XMP:
      case TAG_ID.IFRAME:
      case TAG_ID.NOEMBED:
      case TAG_ID.NOFRAMES:
      case TAG_ID.NOSCRIPT:
        this.tokenizer.state = TokenizerMode.RAWTEXT;
        break;
      case TAG_ID.SCRIPT:
        this.tokenizer.state = TokenizerMode.SCRIPT_DATA;
        break;
      case TAG_ID.PLAINTEXT:
        this.tokenizer.state = TokenizerMode.PLAINTEXT;
    }
  }
  /** @protected */
  _setDocumentType(token) {
    const name = token.name || "";
    const publicId = token.publicId || "";
    const systemId = token.systemId || "";
    this.treeAdapter.setDocumentType(this.document, name, publicId, systemId);
    if (token.location) {
      const docTypeNode = this.treeAdapter
        .getChildNodes(this.document)
        .find((node) => this.treeAdapter.isDocumentTypeNode(node));
      if (docTypeNode) this.treeAdapter.setNodeSourceCodeLocation(docTypeNode, token.location);
    }
  }
  /** @protected */
  _attachElementToTree(element, location, insertionLocation) {
    if (this.options.sourceCodeLocationInfo) {
      const loc = location && {
        ...location,
        startTag: location,
      };
      this.treeAdapter.setNodeSourceCodeLocation(element, loc);
    }
    if (insertionLocation.beforeElement)
      this.treeAdapter.insertBefore(
        insertionLocation.parent,
        element,
        insertionLocation.beforeElement,
      );
    else this.treeAdapter.appendChild(insertionLocation.parent, element);
  }
  /** @protected */
  _getInsertionLocation() {
    var _a;
    if (this._shouldFosterParentOnInsertion()) return this._findFosterParentingLocation();
    return {
      parent:
        (_a = this.openElements.currentTmplContentOrNode) !== null && _a !== void 0
          ? _a
          : this.document,
      beforeElement: null,
    };
  }
  /** @protected */
  _createElement(tagName, namespaceURI, attrs, intendedParent) {
    var _a, _b;
    const element = this.treeAdapter.createElement(tagName, namespaceURI, attrs);
    (_b = (_a = this.treeAdapter).onElementCreated) === null ||
      _b === void 0 ||
      _b.call(_a, element, {
        intendedParent,
        formElement: this.formElement,
        isInTemplate: this.openElements.tmplCount > 0,
      });
    return element;
  }
  /**
   * For self-closing tags. Add an element to the tree, but skip adding it
   * to the stack.
   */
  /** @protected */
  _appendElement(token, namespaceURI) {
    const insertionLocation = this._getInsertionLocation();
    const element = this._createElement(
      token.tagName,
      namespaceURI,
      token.attrs,
      insertionLocation.parent,
    );
    this._attachElementToTree(element, token.location, insertionLocation);
  }
  /** @protected */
  _insertElement(token, namespaceURI) {
    const insertionLocation = this._getInsertionLocation();
    const element = this._createElement(
      token.tagName,
      namespaceURI,
      token.attrs,
      insertionLocation.parent,
    );
    this._attachElementToTree(element, token.location, insertionLocation);
    this.openElements.push(element, token.tagID);
  }
  /** @protected */
  _insertFakeElement(tagName, tagID) {
    const insertionLocation = this._getInsertionLocation();
    const element = this._createElement(tagName, NS.HTML, [], insertionLocation.parent);
    this._attachElementToTree(element, null, insertionLocation);
    this.openElements.push(element, tagID);
  }
  /** @protected */
  _insertTemplate(token) {
    const insertionLocation = this._getInsertionLocation();
    const tmpl = this._createElement(token.tagName, NS.HTML, token.attrs, insertionLocation.parent);
    const content = this.treeAdapter.createDocumentFragment();
    this.treeAdapter.setTemplateContent(tmpl, content);
    this._attachElementToTree(tmpl, token.location, insertionLocation);
    this.openElements.push(tmpl, token.tagID);
    if (this.options.sourceCodeLocationInfo)
      this.treeAdapter.setNodeSourceCodeLocation(content, null);
  }
  /** @protected */
  _insertFakeRootElement() {
    const element = this._createElement(TAG_NAMES.HTML, NS.HTML, [], this.document);
    if (this.options.sourceCodeLocationInfo)
      this.treeAdapter.setNodeSourceCodeLocation(element, null);
    this.treeAdapter.appendChild(this.document, element);
    this.openElements.push(element, TAG_ID.HTML);
  }
  /** @protected */
  _appendCommentNode(token, parent) {
    const commentNode = this.treeAdapter.createCommentNode(token.data);
    this.treeAdapter.appendChild(parent, commentNode);
    if (this.options.sourceCodeLocationInfo)
      this.treeAdapter.setNodeSourceCodeLocation(commentNode, token.location);
  }
  /** @protected */
  _insertCharacters(token) {
    let parent;
    let beforeElement;
    if (this._shouldFosterParentOnInsertion()) {
      ({ parent, beforeElement } = this._findFosterParentingLocation());
      if (beforeElement) this.treeAdapter.insertTextBefore(parent, token.chars, beforeElement);
      else this.treeAdapter.insertText(parent, token.chars);
    } else {
      parent = this.openElements.currentTmplContentOrNode;
      this.treeAdapter.insertText(parent, token.chars);
    }
    if (!token.location) return;
    const siblings = this.treeAdapter.getChildNodes(parent);
    const textNode =
      siblings[(beforeElement ? siblings.lastIndexOf(beforeElement) : siblings.length) - 1];
    if (this.treeAdapter.getNodeSourceCodeLocation(textNode)) {
      const { endLine, endCol, endOffset } = token.location;
      this.treeAdapter.updateNodeSourceCodeLocation(textNode, {
        endLine,
        endCol,
        endOffset,
      });
    } else if (this.options.sourceCodeLocationInfo)
      this.treeAdapter.setNodeSourceCodeLocation(textNode, token.location);
  }
  /** @protected */
  _adoptNodes(donor, recipient) {
    for (
      let child = this.treeAdapter.getFirstChild(donor);
      child;
      child = this.treeAdapter.getFirstChild(donor)
    ) {
      this.treeAdapter.detachNode(child);
      this.treeAdapter.appendChild(recipient, child);
    }
  }
  /** @protected */
  _setEndLocation(element, closingToken) {
    if (this.treeAdapter.getNodeSourceCodeLocation(element) && closingToken.location) {
      const ctLoc = closingToken.location;
      const tn = this.treeAdapter.getTagName(element);
      const endLoc =
        closingToken.type === TokenType.END_TAG && tn === closingToken.tagName
          ? {
              endTag: { ...ctLoc },
              endLine: ctLoc.endLine,
              endCol: ctLoc.endCol,
              endOffset: ctLoc.endOffset,
            }
          : {
              endLine: ctLoc.startLine,
              endCol: ctLoc.startCol,
              endOffset: ctLoc.startOffset,
            };
      this.treeAdapter.updateNodeSourceCodeLocation(element, endLoc);
    }
  }
  shouldProcessStartTagTokenInForeignContent(token) {
    if (!this.currentNotInHTML) return false;
    let current;
    let currentTagId;
    if (this.openElements.stackTop === 0 && this.fragmentContext) {
      current = this.fragmentContext;
      currentTagId = this.fragmentContextID;
    } else ({ current, currentTagId } = this.openElements);
    if (
      token.tagID === TAG_ID.SVG &&
      this.treeAdapter.getTagName(current) === TAG_NAMES.ANNOTATION_XML &&
      this.treeAdapter.getNamespaceURI(current) === NS.MATHML
    )
      return false;
    return (
      this.tokenizer.inForeignNode ||
      ((token.tagID === TAG_ID.MGLYPH || token.tagID === TAG_ID.MALIGNMARK) &&
        currentTagId !== void 0 &&
        !this._isIntegrationPoint(currentTagId, current, NS.HTML))
    );
  }
  /** @protected */
  _processToken(token) {
    switch (token.type) {
      case TokenType.CHARACTER:
        this.onCharacter(token);
        break;
      case TokenType.NULL_CHARACTER:
        this.onNullCharacter(token);
        break;
      case TokenType.COMMENT:
        this.onComment(token);
        break;
      case TokenType.DOCTYPE:
        this.onDoctype(token);
        break;
      case TokenType.START_TAG:
        this._processStartTag(token);
        break;
      case TokenType.END_TAG:
        this.onEndTag(token);
        break;
      case TokenType.EOF:
        this.onEof(token);
        break;
      case TokenType.WHITESPACE_CHARACTER:
        this.onWhitespaceCharacter(token);
    }
  }
  /** @protected */
  _isIntegrationPoint(tid, element, foreignNS) {
    return isIntegrationPoint(
      tid,
      this.treeAdapter.getNamespaceURI(element),
      this.treeAdapter.getAttrList(element),
      foreignNS,
    );
  }
  /** @protected */
  _reconstructActiveFormattingElements() {
    const listLength = this.activeFormattingElements.entries.length;
    if (listLength) {
      const endIndex = this.activeFormattingElements.entries.findIndex(
        (entry) => entry.type === EntryType.Marker || this.openElements.contains(entry.element),
      );
      const unopenIdx = endIndex === -1 ? listLength - 1 : endIndex - 1;
      for (let i = unopenIdx; i >= 0; i--) {
        const entry = this.activeFormattingElements.entries[i];
        this._insertElement(entry.token, this.treeAdapter.getNamespaceURI(entry.element));
        entry.element = this.openElements.current;
      }
    }
  }
  /** @protected */
  _closeTableCell() {
    this.openElements.generateImpliedEndTags();
    this.openElements.popUntilTableCellPopped();
    this.activeFormattingElements.clearToLastMarker();
    this.insertionMode = InsertionMode.IN_ROW;
  }
  /** @protected */
  _closePElement() {
    this.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.P);
    this.openElements.popUntilTagNamePopped(TAG_ID.P);
  }
  /** @protected */
  _resetInsertionMode() {
    for (let i = this.openElements.stackTop; i >= 0; i--)
      switch (
        i === 0 && this.fragmentContext ? this.fragmentContextID : this.openElements.tagIDs[i]
      ) {
        case TAG_ID.TR:
          this.insertionMode = InsertionMode.IN_ROW;
          return;
        case TAG_ID.TBODY:
        case TAG_ID.THEAD:
        case TAG_ID.TFOOT:
          this.insertionMode = InsertionMode.IN_TABLE_BODY;
          return;
        case TAG_ID.CAPTION:
          this.insertionMode = InsertionMode.IN_CAPTION;
          return;
        case TAG_ID.COLGROUP:
          this.insertionMode = InsertionMode.IN_COLUMN_GROUP;
          return;
        case TAG_ID.TABLE:
          this.insertionMode = InsertionMode.IN_TABLE;
          return;
        case TAG_ID.BODY:
          this.insertionMode = InsertionMode.IN_BODY;
          return;
        case TAG_ID.FRAMESET:
          this.insertionMode = InsertionMode.IN_FRAMESET;
          return;
        case TAG_ID.SELECT:
          this._resetInsertionModeForSelect(i);
          return;
        case TAG_ID.TEMPLATE:
          this.insertionMode = this.tmplInsertionModeStack[0];
          return;
        case TAG_ID.HTML:
          this.insertionMode = this.headElement
            ? InsertionMode.AFTER_HEAD
            : InsertionMode.BEFORE_HEAD;
          return;
        case TAG_ID.TD:
        case TAG_ID.TH:
          if (i > 0) {
            this.insertionMode = InsertionMode.IN_CELL;
            return;
          }
          break;
        case TAG_ID.HEAD:
          if (i > 0) {
            this.insertionMode = InsertionMode.IN_HEAD;
            return;
          }
      }
    this.insertionMode = InsertionMode.IN_BODY;
  }
  /** @protected */
  _resetInsertionModeForSelect(selectIdx) {
    if (selectIdx > 0)
      for (let i = selectIdx - 1; i > 0; i--) {
        const tn = this.openElements.tagIDs[i];
        if (tn === TAG_ID.TEMPLATE) break;
        else if (tn === TAG_ID.TABLE) {
          this.insertionMode = InsertionMode.IN_SELECT_IN_TABLE;
          return;
        }
      }
    this.insertionMode = InsertionMode.IN_SELECT;
  }
  /** @protected */
  _isElementCausesFosterParenting(tn) {
    return TABLE_STRUCTURE_TAGS.has(tn);
  }
  /** @protected */
  _shouldFosterParentOnInsertion() {
    return (
      this.fosterParentingEnabled &&
      this.openElements.currentTagId !== void 0 &&
      this._isElementCausesFosterParenting(this.openElements.currentTagId)
    );
  }
  /** @protected */
  _findFosterParentingLocation() {
    for (let i = this.openElements.stackTop; i >= 0; i--) {
      const openElement = this.openElements.items[i];
      switch (this.openElements.tagIDs[i]) {
        case TAG_ID.TEMPLATE:
          if (this.treeAdapter.getNamespaceURI(openElement) === NS.HTML)
            return {
              parent: this.treeAdapter.getTemplateContent(openElement),
              beforeElement: null,
            };
          break;
        case TAG_ID.TABLE: {
          const parent = this.treeAdapter.getParentNode(openElement);
          if (parent)
            return {
              parent,
              beforeElement: openElement,
            };
          return {
            parent: this.openElements.items[i - 1],
            beforeElement: null,
          };
        }
      }
    }
    return {
      parent: this.openElements.items[0],
      beforeElement: null,
    };
  }
  /** @protected */
  _fosterParentElement(element) {
    const location = this._findFosterParentingLocation();
    if (location.beforeElement)
      this.treeAdapter.insertBefore(location.parent, element, location.beforeElement);
    else this.treeAdapter.appendChild(location.parent, element);
  }
  /** @protected */
  _isSpecialElement(element, id) {
    const ns = this.treeAdapter.getNamespaceURI(element);
    return SPECIAL_ELEMENTS[ns].has(id);
  }
  /** @internal */
  onCharacter(token) {
    this.skipNextNewLine = false;
    if (this.tokenizer.inForeignNode) {
      characterInForeignContent(this, token);
      return;
    }
    switch (this.insertionMode) {
      case InsertionMode.INITIAL:
        tokenInInitialMode(this, token);
        break;
      case InsertionMode.BEFORE_HTML:
        tokenBeforeHtml(this, token);
        break;
      case InsertionMode.BEFORE_HEAD:
        tokenBeforeHead(this, token);
        break;
      case InsertionMode.IN_HEAD:
        tokenInHead(this, token);
        break;
      case InsertionMode.IN_HEAD_NO_SCRIPT:
        tokenInHeadNoScript(this, token);
        break;
      case InsertionMode.AFTER_HEAD:
        tokenAfterHead(this, token);
        break;
      case InsertionMode.IN_BODY:
      case InsertionMode.IN_CAPTION:
      case InsertionMode.IN_CELL:
      case InsertionMode.IN_TEMPLATE:
        characterInBody(this, token);
        break;
      case InsertionMode.TEXT:
      case InsertionMode.IN_SELECT:
      case InsertionMode.IN_SELECT_IN_TABLE:
        this._insertCharacters(token);
        break;
      case InsertionMode.IN_TABLE:
      case InsertionMode.IN_TABLE_BODY:
      case InsertionMode.IN_ROW:
        characterInTable(this, token);
        break;
      case InsertionMode.IN_TABLE_TEXT:
        characterInTableText(this, token);
        break;
      case InsertionMode.IN_COLUMN_GROUP:
        tokenInColumnGroup(this, token);
        break;
      case InsertionMode.AFTER_BODY:
        tokenAfterBody(this, token);
        break;
      case InsertionMode.AFTER_AFTER_BODY:
        tokenAfterAfterBody(this, token);
    }
  }
  /** @internal */
  onNullCharacter(token) {
    this.skipNextNewLine = false;
    if (this.tokenizer.inForeignNode) {
      nullCharacterInForeignContent(this, token);
      return;
    }
    switch (this.insertionMode) {
      case InsertionMode.INITIAL:
        tokenInInitialMode(this, token);
        break;
      case InsertionMode.BEFORE_HTML:
        tokenBeforeHtml(this, token);
        break;
      case InsertionMode.BEFORE_HEAD:
        tokenBeforeHead(this, token);
        break;
      case InsertionMode.IN_HEAD:
        tokenInHead(this, token);
        break;
      case InsertionMode.IN_HEAD_NO_SCRIPT:
        tokenInHeadNoScript(this, token);
        break;
      case InsertionMode.AFTER_HEAD:
        tokenAfterHead(this, token);
        break;
      case InsertionMode.TEXT:
        this._insertCharacters(token);
        break;
      case InsertionMode.IN_TABLE:
      case InsertionMode.IN_TABLE_BODY:
      case InsertionMode.IN_ROW:
        characterInTable(this, token);
        break;
      case InsertionMode.IN_COLUMN_GROUP:
        tokenInColumnGroup(this, token);
        break;
      case InsertionMode.AFTER_BODY:
        tokenAfterBody(this, token);
        break;
      case InsertionMode.AFTER_AFTER_BODY:
        tokenAfterAfterBody(this, token);
    }
  }
  /** @internal */
  onComment(token) {
    this.skipNextNewLine = false;
    if (this.currentNotInHTML) {
      appendComment(this, token);
      return;
    }
    switch (this.insertionMode) {
      case InsertionMode.INITIAL:
      case InsertionMode.BEFORE_HTML:
      case InsertionMode.BEFORE_HEAD:
      case InsertionMode.IN_HEAD:
      case InsertionMode.IN_HEAD_NO_SCRIPT:
      case InsertionMode.AFTER_HEAD:
      case InsertionMode.IN_BODY:
      case InsertionMode.IN_TABLE:
      case InsertionMode.IN_CAPTION:
      case InsertionMode.IN_COLUMN_GROUP:
      case InsertionMode.IN_TABLE_BODY:
      case InsertionMode.IN_ROW:
      case InsertionMode.IN_CELL:
      case InsertionMode.IN_SELECT:
      case InsertionMode.IN_SELECT_IN_TABLE:
      case InsertionMode.IN_TEMPLATE:
      case InsertionMode.IN_FRAMESET:
      case InsertionMode.AFTER_FRAMESET:
        appendComment(this, token);
        break;
      case InsertionMode.IN_TABLE_TEXT:
        tokenInTableText(this, token);
        break;
      case InsertionMode.AFTER_BODY:
        appendCommentToRootHtmlElement(this, token);
        break;
      case InsertionMode.AFTER_AFTER_BODY:
      case InsertionMode.AFTER_AFTER_FRAMESET:
        appendCommentToDocument(this, token);
    }
  }
  /** @internal */
  onDoctype(token) {
    this.skipNextNewLine = false;
    switch (this.insertionMode) {
      case InsertionMode.INITIAL:
        doctypeInInitialMode(this, token);
        break;
      case InsertionMode.BEFORE_HEAD:
      case InsertionMode.IN_HEAD:
      case InsertionMode.IN_HEAD_NO_SCRIPT:
      case InsertionMode.AFTER_HEAD:
        this._err(token, ERR.misplacedDoctype);
        break;
      case InsertionMode.IN_TABLE_TEXT:
        tokenInTableText(this, token);
    }
  }
  /** @internal */
  onStartTag(token) {
    this.skipNextNewLine = false;
    this.currentToken = token;
    this._processStartTag(token);
    if (token.selfClosing && !token.ackSelfClosing)
      this._err(token, ERR.nonVoidHtmlElementStartTagWithTrailingSolidus);
  }
  /**
   * Processes a given start tag.
   *
   * `onStartTag` checks if a self-closing tag was recognized. When a token
   * is moved inbetween multiple insertion modes, this check for self-closing
   * could lead to false positives. To avoid this, `_processStartTag` is used
   * for nested calls.
   *
   * @param token The token to process.
   * @protected
   */
  _processStartTag(token) {
    if (this.shouldProcessStartTagTokenInForeignContent(token))
      startTagInForeignContent(this, token);
    else this._startTagOutsideForeignContent(token);
  }
  /** @protected */
  _startTagOutsideForeignContent(token) {
    switch (this.insertionMode) {
      case InsertionMode.INITIAL:
        tokenInInitialMode(this, token);
        break;
      case InsertionMode.BEFORE_HTML:
        startTagBeforeHtml(this, token);
        break;
      case InsertionMode.BEFORE_HEAD:
        startTagBeforeHead(this, token);
        break;
      case InsertionMode.IN_HEAD:
        startTagInHead(this, token);
        break;
      case InsertionMode.IN_HEAD_NO_SCRIPT:
        startTagInHeadNoScript(this, token);
        break;
      case InsertionMode.AFTER_HEAD:
        startTagAfterHead(this, token);
        break;
      case InsertionMode.IN_BODY:
        startTagInBody(this, token);
        break;
      case InsertionMode.IN_TABLE:
        startTagInTable(this, token);
        break;
      case InsertionMode.IN_TABLE_TEXT:
        tokenInTableText(this, token);
        break;
      case InsertionMode.IN_CAPTION:
        startTagInCaption(this, token);
        break;
      case InsertionMode.IN_COLUMN_GROUP:
        startTagInColumnGroup(this, token);
        break;
      case InsertionMode.IN_TABLE_BODY:
        startTagInTableBody(this, token);
        break;
      case InsertionMode.IN_ROW:
        startTagInRow(this, token);
        break;
      case InsertionMode.IN_CELL:
        startTagInCell(this, token);
        break;
      case InsertionMode.IN_SELECT:
        startTagInSelect(this, token);
        break;
      case InsertionMode.IN_SELECT_IN_TABLE:
        startTagInSelectInTable(this, token);
        break;
      case InsertionMode.IN_TEMPLATE:
        startTagInTemplate(this, token);
        break;
      case InsertionMode.AFTER_BODY:
        startTagAfterBody(this, token);
        break;
      case InsertionMode.IN_FRAMESET:
        startTagInFrameset(this, token);
        break;
      case InsertionMode.AFTER_FRAMESET:
        startTagAfterFrameset(this, token);
        break;
      case InsertionMode.AFTER_AFTER_BODY:
        startTagAfterAfterBody(this, token);
        break;
      case InsertionMode.AFTER_AFTER_FRAMESET:
        startTagAfterAfterFrameset(this, token);
    }
  }
  /** @internal */
  onEndTag(token) {
    this.skipNextNewLine = false;
    this.currentToken = token;
    if (this.currentNotInHTML) endTagInForeignContent(this, token);
    else this._endTagOutsideForeignContent(token);
  }
  /** @protected */
  _endTagOutsideForeignContent(token) {
    switch (this.insertionMode) {
      case InsertionMode.INITIAL:
        tokenInInitialMode(this, token);
        break;
      case InsertionMode.BEFORE_HTML:
        endTagBeforeHtml(this, token);
        break;
      case InsertionMode.BEFORE_HEAD:
        endTagBeforeHead(this, token);
        break;
      case InsertionMode.IN_HEAD:
        endTagInHead(this, token);
        break;
      case InsertionMode.IN_HEAD_NO_SCRIPT:
        endTagInHeadNoScript(this, token);
        break;
      case InsertionMode.AFTER_HEAD:
        endTagAfterHead(this, token);
        break;
      case InsertionMode.IN_BODY:
        endTagInBody(this, token);
        break;
      case InsertionMode.TEXT:
        endTagInText(this, token);
        break;
      case InsertionMode.IN_TABLE:
        endTagInTable(this, token);
        break;
      case InsertionMode.IN_TABLE_TEXT:
        tokenInTableText(this, token);
        break;
      case InsertionMode.IN_CAPTION:
        endTagInCaption(this, token);
        break;
      case InsertionMode.IN_COLUMN_GROUP:
        endTagInColumnGroup(this, token);
        break;
      case InsertionMode.IN_TABLE_BODY:
        endTagInTableBody(this, token);
        break;
      case InsertionMode.IN_ROW:
        endTagInRow(this, token);
        break;
      case InsertionMode.IN_CELL:
        endTagInCell(this, token);
        break;
      case InsertionMode.IN_SELECT:
        endTagInSelect(this, token);
        break;
      case InsertionMode.IN_SELECT_IN_TABLE:
        endTagInSelectInTable(this, token);
        break;
      case InsertionMode.IN_TEMPLATE:
        endTagInTemplate(this, token);
        break;
      case InsertionMode.AFTER_BODY:
        endTagAfterBody(this, token);
        break;
      case InsertionMode.IN_FRAMESET:
        endTagInFrameset(this, token);
        break;
      case InsertionMode.AFTER_FRAMESET:
        endTagAfterFrameset(this, token);
        break;
      case InsertionMode.AFTER_AFTER_BODY:
        tokenAfterAfterBody(this, token);
    }
  }
  /** @internal */
  onEof(token) {
    switch (this.insertionMode) {
      case InsertionMode.INITIAL:
        tokenInInitialMode(this, token);
        break;
      case InsertionMode.BEFORE_HTML:
        tokenBeforeHtml(this, token);
        break;
      case InsertionMode.BEFORE_HEAD:
        tokenBeforeHead(this, token);
        break;
      case InsertionMode.IN_HEAD:
        tokenInHead(this, token);
        break;
      case InsertionMode.IN_HEAD_NO_SCRIPT:
        tokenInHeadNoScript(this, token);
        break;
      case InsertionMode.AFTER_HEAD:
        tokenAfterHead(this, token);
        break;
      case InsertionMode.IN_BODY:
      case InsertionMode.IN_TABLE:
      case InsertionMode.IN_CAPTION:
      case InsertionMode.IN_COLUMN_GROUP:
      case InsertionMode.IN_TABLE_BODY:
      case InsertionMode.IN_ROW:
      case InsertionMode.IN_CELL:
      case InsertionMode.IN_SELECT:
      case InsertionMode.IN_SELECT_IN_TABLE:
        eofInBody(this, token);
        break;
      case InsertionMode.TEXT:
        eofInText(this, token);
        break;
      case InsertionMode.IN_TABLE_TEXT:
        tokenInTableText(this, token);
        break;
      case InsertionMode.IN_TEMPLATE:
        eofInTemplate(this, token);
        break;
      case InsertionMode.AFTER_BODY:
      case InsertionMode.IN_FRAMESET:
      case InsertionMode.AFTER_FRAMESET:
      case InsertionMode.AFTER_AFTER_BODY:
      case InsertionMode.AFTER_AFTER_FRAMESET:
        stopParsing(this, token);
    }
  }
  /** @internal */
  onWhitespaceCharacter(token) {
    if (this.skipNextNewLine) {
      this.skipNextNewLine = false;
      if (token.chars.charCodeAt(0) === CODE_POINTS.LINE_FEED) {
        if (token.chars.length === 1) return;
        token.chars = token.chars.substr(1);
      }
    }
    if (this.tokenizer.inForeignNode) {
      this._insertCharacters(token);
      return;
    }
    switch (this.insertionMode) {
      case InsertionMode.IN_HEAD:
      case InsertionMode.IN_HEAD_NO_SCRIPT:
      case InsertionMode.AFTER_HEAD:
      case InsertionMode.TEXT:
      case InsertionMode.IN_COLUMN_GROUP:
      case InsertionMode.IN_SELECT:
      case InsertionMode.IN_SELECT_IN_TABLE:
      case InsertionMode.IN_FRAMESET:
      case InsertionMode.AFTER_FRAMESET:
        this._insertCharacters(token);
        break;
      case InsertionMode.IN_BODY:
      case InsertionMode.IN_CAPTION:
      case InsertionMode.IN_CELL:
      case InsertionMode.IN_TEMPLATE:
      case InsertionMode.AFTER_BODY:
      case InsertionMode.AFTER_AFTER_BODY:
      case InsertionMode.AFTER_AFTER_FRAMESET:
        whitespaceCharacterInBody(this, token);
        break;
      case InsertionMode.IN_TABLE:
      case InsertionMode.IN_TABLE_BODY:
      case InsertionMode.IN_ROW:
        characterInTable(this, token);
        break;
      case InsertionMode.IN_TABLE_TEXT:
        whitespaceCharacterInTableText(this, token);
    }
  }
};
function aaObtainFormattingElementEntry(p, token) {
  let formattingElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName(
    token.tagName,
  );
  if (formattingElementEntry) {
    if (!p.openElements.contains(formattingElementEntry.element)) {
      p.activeFormattingElements.removeEntry(formattingElementEntry);
      formattingElementEntry = null;
    } else if (!p.openElements.hasInScope(token.tagID)) formattingElementEntry = null;
  } else genericEndTagInBody(p, token);
  return formattingElementEntry;
}
function aaObtainFurthestBlock(p, formattingElementEntry) {
  let furthestBlock = null;
  let idx = p.openElements.stackTop;
  for (; idx >= 0; idx--) {
    const element = p.openElements.items[idx];
    if (element === formattingElementEntry.element) break;
    if (p._isSpecialElement(element, p.openElements.tagIDs[idx])) furthestBlock = element;
  }
  if (!furthestBlock) {
    p.openElements.shortenToLength(Math.max(idx, 0));
    p.activeFormattingElements.removeEntry(formattingElementEntry);
  }
  return furthestBlock;
}
function aaInnerLoop(p, furthestBlock, formattingElement) {
  let lastElement = furthestBlock;
  let nextElement = p.openElements.getCommonAncestor(furthestBlock);
  const intendedParent = p.openElements.getCommonAncestor(formattingElement);
  for (
    let i = 0, element = nextElement;
    element !== formattingElement;
    i++, element = nextElement
  ) {
    nextElement = p.openElements.getCommonAncestor(element);
    const elementEntry = p.activeFormattingElements.getElementEntry(element);
    const counterOverflow = elementEntry && i >= AA_INNER_LOOP_ITER;
    if (!elementEntry || counterOverflow) {
      if (counterOverflow) p.activeFormattingElements.removeEntry(elementEntry);
      p.openElements.remove(element);
    } else {
      element = aaRecreateElementFromEntry(p, elementEntry, intendedParent);
      if (lastElement === furthestBlock) p.activeFormattingElements.bookmark = elementEntry;
      p.treeAdapter.detachNode(lastElement);
      p.treeAdapter.appendChild(element, lastElement);
      lastElement = element;
    }
  }
  return lastElement;
}
function aaRecreateElementFromEntry(p, elementEntry, intendedParent) {
  const ns = p.treeAdapter.getNamespaceURI(elementEntry.element);
  const newElement = p._createElement(
    elementEntry.token.tagName,
    ns,
    elementEntry.token.attrs,
    intendedParent,
  );
  p.openElements.replace(elementEntry.element, newElement);
  elementEntry.element = newElement;
  return newElement;
}
function aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement) {
  const tid = getTagID(p.treeAdapter.getTagName(commonAncestor));
  if (p._isElementCausesFosterParenting(tid)) p._fosterParentElement(lastElement);
  else {
    const ns = p.treeAdapter.getNamespaceURI(commonAncestor);
    if (tid === TAG_ID.TEMPLATE && ns === NS.HTML)
      commonAncestor = p.treeAdapter.getTemplateContent(commonAncestor);
    p.treeAdapter.appendChild(commonAncestor, lastElement);
  }
}
function aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry) {
  const ns = p.treeAdapter.getNamespaceURI(formattingElementEntry.element);
  const { token } = formattingElementEntry;
  const newElement = p._createElement(token.tagName, ns, token.attrs, furthestBlock);
  p._adoptNodes(furthestBlock, newElement);
  p.treeAdapter.appendChild(furthestBlock, newElement);
  p.activeFormattingElements.insertElementAfterBookmark(newElement, token);
  p.activeFormattingElements.removeEntry(formattingElementEntry);
  p.openElements.remove(formattingElementEntry.element);
  p.openElements.insertAfter(furthestBlock, newElement, token.tagID);
}
function callAdoptionAgency(p, token) {
  for (let i = 0; i < AA_OUTER_LOOP_ITER; i++) {
    const formattingElementEntry = aaObtainFormattingElementEntry(p, token);
    if (!formattingElementEntry) break;
    const furthestBlock = aaObtainFurthestBlock(p, formattingElementEntry);
    if (!furthestBlock) break;
    p.activeFormattingElements.bookmark = formattingElementEntry;
    const lastElement = aaInnerLoop(p, furthestBlock, formattingElementEntry.element);
    const commonAncestor = p.openElements.getCommonAncestor(formattingElementEntry.element);
    p.treeAdapter.detachNode(lastElement);
    if (commonAncestor) aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement);
    aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry);
  }
}
function appendComment(p, token) {
  p._appendCommentNode(token, p.openElements.currentTmplContentOrNode);
}
function appendCommentToRootHtmlElement(p, token) {
  p._appendCommentNode(token, p.openElements.items[0]);
}
function appendCommentToDocument(p, token) {
  p._appendCommentNode(token, p.document);
}
function stopParsing(p, token) {
  p.stopped = true;
  if (token.location) {
    const target = p.fragmentContext ? 0 : 2;
    for (let i = p.openElements.stackTop; i >= target; i--)
      p._setEndLocation(p.openElements.items[i], token);
    if (!p.fragmentContext && p.openElements.stackTop >= 0) {
      const htmlElement = p.openElements.items[0];
      const htmlLocation = p.treeAdapter.getNodeSourceCodeLocation(htmlElement);
      if (htmlLocation && !htmlLocation.endTag) {
        p._setEndLocation(htmlElement, token);
        if (p.openElements.stackTop >= 1) {
          const bodyElement = p.openElements.items[1];
          const bodyLocation = p.treeAdapter.getNodeSourceCodeLocation(bodyElement);
          if (bodyLocation && !bodyLocation.endTag) p._setEndLocation(bodyElement, token);
        }
      }
    }
  }
}
function doctypeInInitialMode(p, token) {
  p._setDocumentType(token);
  const mode = token.forceQuirks ? DOCUMENT_MODE.QUIRKS : getDocumentMode(token);
  if (!isConforming(token)) p._err(token, ERR.nonConformingDoctype);
  p.treeAdapter.setDocumentMode(p.document, mode);
  p.insertionMode = InsertionMode.BEFORE_HTML;
}
function tokenInInitialMode(p, token) {
  p._err(token, ERR.missingDoctype, true);
  p.treeAdapter.setDocumentMode(p.document, DOCUMENT_MODE.QUIRKS);
  p.insertionMode = InsertionMode.BEFORE_HTML;
  p._processToken(token);
}
function startTagBeforeHtml(p, token) {
  if (token.tagID === TAG_ID.HTML) {
    p._insertElement(token, NS.HTML);
    p.insertionMode = InsertionMode.BEFORE_HEAD;
  } else tokenBeforeHtml(p, token);
}
function endTagBeforeHtml(p, token) {
  const tn = token.tagID;
  if (tn === TAG_ID.HTML || tn === TAG_ID.HEAD || tn === TAG_ID.BODY || tn === TAG_ID.BR)
    tokenBeforeHtml(p, token);
}
function tokenBeforeHtml(p, token) {
  p._insertFakeRootElement();
  p.insertionMode = InsertionMode.BEFORE_HEAD;
  p._processToken(token);
}
function startTagBeforeHead(p, token) {
  switch (token.tagID) {
    case TAG_ID.HTML:
      startTagInBody(p, token);
      break;
    case TAG_ID.HEAD:
      p._insertElement(token, NS.HTML);
      p.headElement = p.openElements.current;
      p.insertionMode = InsertionMode.IN_HEAD;
      break;
    default:
      tokenBeforeHead(p, token);
  }
}
function endTagBeforeHead(p, token) {
  const tn = token.tagID;
  if (tn === TAG_ID.HEAD || tn === TAG_ID.BODY || tn === TAG_ID.HTML || tn === TAG_ID.BR)
    tokenBeforeHead(p, token);
  else p._err(token, ERR.endTagWithoutMatchingOpenElement);
}
function tokenBeforeHead(p, token) {
  p._insertFakeElement(TAG_NAMES.HEAD, TAG_ID.HEAD);
  p.headElement = p.openElements.current;
  p.insertionMode = InsertionMode.IN_HEAD;
  p._processToken(token);
}
function startTagInHead(p, token) {
  switch (token.tagID) {
    case TAG_ID.HTML:
      startTagInBody(p, token);
      break;
    case TAG_ID.BASE:
    case TAG_ID.BASEFONT:
    case TAG_ID.BGSOUND:
    case TAG_ID.LINK:
    case TAG_ID.META:
      p._appendElement(token, NS.HTML);
      token.ackSelfClosing = true;
      break;
    case TAG_ID.TITLE:
      p._switchToTextParsing(token, TokenizerMode.RCDATA);
      break;
    case TAG_ID.NOSCRIPT:
      if (p.options.scriptingEnabled) p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
      else {
        p._insertElement(token, NS.HTML);
        p.insertionMode = InsertionMode.IN_HEAD_NO_SCRIPT;
      }
      break;
    case TAG_ID.NOFRAMES:
    case TAG_ID.STYLE:
      p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
      break;
    case TAG_ID.SCRIPT:
      p._switchToTextParsing(token, TokenizerMode.SCRIPT_DATA);
      break;
    case TAG_ID.TEMPLATE:
      p._insertTemplate(token);
      p.activeFormattingElements.insertMarker();
      p.framesetOk = false;
      p.insertionMode = InsertionMode.IN_TEMPLATE;
      p.tmplInsertionModeStack.unshift(InsertionMode.IN_TEMPLATE);
      break;
    case TAG_ID.HEAD:
      p._err(token, ERR.misplacedStartTagForHeadElement);
      break;
    default:
      tokenInHead(p, token);
  }
}
function endTagInHead(p, token) {
  switch (token.tagID) {
    case TAG_ID.HEAD:
      p.openElements.pop();
      p.insertionMode = InsertionMode.AFTER_HEAD;
      break;
    case TAG_ID.BODY:
    case TAG_ID.BR:
    case TAG_ID.HTML:
      tokenInHead(p, token);
      break;
    case TAG_ID.TEMPLATE:
      templateEndTagInHead(p, token);
      break;
    default:
      p._err(token, ERR.endTagWithoutMatchingOpenElement);
  }
}
function templateEndTagInHead(p, token) {
  if (p.openElements.tmplCount > 0) {
    p.openElements.generateImpliedEndTagsThoroughly();
    if (p.openElements.currentTagId !== TAG_ID.TEMPLATE)
      p._err(token, ERR.closingOfElementWithOpenChildElements);
    p.openElements.popUntilTagNamePopped(TAG_ID.TEMPLATE);
    p.activeFormattingElements.clearToLastMarker();
    p.tmplInsertionModeStack.shift();
    p._resetInsertionMode();
  } else p._err(token, ERR.endTagWithoutMatchingOpenElement);
}
function tokenInHead(p, token) {
  p.openElements.pop();
  p.insertionMode = InsertionMode.AFTER_HEAD;
  p._processToken(token);
}
function startTagInHeadNoScript(p, token) {
  switch (token.tagID) {
    case TAG_ID.HTML:
      startTagInBody(p, token);
      break;
    case TAG_ID.BASEFONT:
    case TAG_ID.BGSOUND:
    case TAG_ID.HEAD:
    case TAG_ID.LINK:
    case TAG_ID.META:
    case TAG_ID.NOFRAMES:
    case TAG_ID.STYLE:
      startTagInHead(p, token);
      break;
    case TAG_ID.NOSCRIPT:
      p._err(token, ERR.nestedNoscriptInHead);
      break;
    default:
      tokenInHeadNoScript(p, token);
  }
}
function endTagInHeadNoScript(p, token) {
  switch (token.tagID) {
    case TAG_ID.NOSCRIPT:
      p.openElements.pop();
      p.insertionMode = InsertionMode.IN_HEAD;
      break;
    case TAG_ID.BR:
      tokenInHeadNoScript(p, token);
      break;
    default:
      p._err(token, ERR.endTagWithoutMatchingOpenElement);
  }
}
function tokenInHeadNoScript(p, token) {
  const errCode =
    token.type === TokenType.EOF
      ? ERR.openElementsLeftAfterEof
      : ERR.disallowedContentInNoscriptInHead;
  p._err(token, errCode);
  p.openElements.pop();
  p.insertionMode = InsertionMode.IN_HEAD;
  p._processToken(token);
}
function startTagAfterHead(p, token) {
  switch (token.tagID) {
    case TAG_ID.HTML:
      startTagInBody(p, token);
      break;
    case TAG_ID.BODY:
      p._insertElement(token, NS.HTML);
      p.framesetOk = false;
      p.insertionMode = InsertionMode.IN_BODY;
      break;
    case TAG_ID.FRAMESET:
      p._insertElement(token, NS.HTML);
      p.insertionMode = InsertionMode.IN_FRAMESET;
      break;
    case TAG_ID.BASE:
    case TAG_ID.BASEFONT:
    case TAG_ID.BGSOUND:
    case TAG_ID.LINK:
    case TAG_ID.META:
    case TAG_ID.NOFRAMES:
    case TAG_ID.SCRIPT:
    case TAG_ID.STYLE:
    case TAG_ID.TEMPLATE:
    case TAG_ID.TITLE:
      p._err(token, ERR.abandonedHeadElementChild);
      p.openElements.push(p.headElement, TAG_ID.HEAD);
      startTagInHead(p, token);
      p.openElements.remove(p.headElement);
      break;
    case TAG_ID.HEAD:
      p._err(token, ERR.misplacedStartTagForHeadElement);
      break;
    default:
      tokenAfterHead(p, token);
  }
}
function endTagAfterHead(p, token) {
  switch (token.tagID) {
    case TAG_ID.BODY:
    case TAG_ID.HTML:
    case TAG_ID.BR:
      tokenAfterHead(p, token);
      break;
    case TAG_ID.TEMPLATE:
      templateEndTagInHead(p, token);
      break;
    default:
      p._err(token, ERR.endTagWithoutMatchingOpenElement);
  }
}
function tokenAfterHead(p, token) {
  p._insertFakeElement(TAG_NAMES.BODY, TAG_ID.BODY);
  p.insertionMode = InsertionMode.IN_BODY;
  modeInBody(p, token);
}
function modeInBody(p, token) {
  switch (token.type) {
    case TokenType.CHARACTER:
      characterInBody(p, token);
      break;
    case TokenType.WHITESPACE_CHARACTER:
      whitespaceCharacterInBody(p, token);
      break;
    case TokenType.COMMENT:
      appendComment(p, token);
      break;
    case TokenType.START_TAG:
      startTagInBody(p, token);
      break;
    case TokenType.END_TAG:
      endTagInBody(p, token);
      break;
    case TokenType.EOF:
      eofInBody(p, token);
  }
}
function whitespaceCharacterInBody(p, token) {
  p._reconstructActiveFormattingElements();
  p._insertCharacters(token);
}
function characterInBody(p, token) {
  p._reconstructActiveFormattingElements();
  p._insertCharacters(token);
  p.framesetOk = false;
}
function htmlStartTagInBody(p, token) {
  if (p.openElements.tmplCount === 0)
    p.treeAdapter.adoptAttributes(p.openElements.items[0], token.attrs);
}
function bodyStartTagInBody(p, token) {
  const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
  if (bodyElement && p.openElements.tmplCount === 0) {
    p.framesetOk = false;
    p.treeAdapter.adoptAttributes(bodyElement, token.attrs);
  }
}
function framesetStartTagInBody(p, token) {
  const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
  if (p.framesetOk && bodyElement) {
    p.treeAdapter.detachNode(bodyElement);
    p.openElements.popAllUpToHtmlElement();
    p._insertElement(token, NS.HTML);
    p.insertionMode = InsertionMode.IN_FRAMESET;
  }
}
function addressStartTagInBody(p, token) {
  if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
  p._insertElement(token, NS.HTML);
}
function numberedHeaderStartTagInBody(p, token) {
  if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
  if (p.openElements.currentTagId !== void 0 && NUMBERED_HEADERS.has(p.openElements.currentTagId))
    p.openElements.pop();
  p._insertElement(token, NS.HTML);
}
function preStartTagInBody(p, token) {
  if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
  p._insertElement(token, NS.HTML);
  p.skipNextNewLine = true;
  p.framesetOk = false;
}
function formStartTagInBody(p, token) {
  const inTemplate = p.openElements.tmplCount > 0;
  if (!p.formElement || inTemplate) {
    if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
    p._insertElement(token, NS.HTML);
    if (!inTemplate) p.formElement = p.openElements.current;
  }
}
function listItemStartTagInBody(p, token) {
  p.framesetOk = false;
  const tn = token.tagID;
  for (let i = p.openElements.stackTop; i >= 0; i--) {
    const elementId = p.openElements.tagIDs[i];
    if (
      (tn === TAG_ID.LI && elementId === TAG_ID.LI) ||
      ((tn === TAG_ID.DD || tn === TAG_ID.DT) &&
        (elementId === TAG_ID.DD || elementId === TAG_ID.DT))
    ) {
      p.openElements.generateImpliedEndTagsWithExclusion(elementId);
      p.openElements.popUntilTagNamePopped(elementId);
      break;
    }
    if (
      elementId !== TAG_ID.ADDRESS &&
      elementId !== TAG_ID.DIV &&
      elementId !== TAG_ID.P &&
      p._isSpecialElement(p.openElements.items[i], elementId)
    )
      break;
  }
  if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
  p._insertElement(token, NS.HTML);
}
function plaintextStartTagInBody(p, token) {
  if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
  p._insertElement(token, NS.HTML);
  p.tokenizer.state = TokenizerMode.PLAINTEXT;
}
function buttonStartTagInBody(p, token) {
  if (p.openElements.hasInScope(TAG_ID.BUTTON)) {
    p.openElements.generateImpliedEndTags();
    p.openElements.popUntilTagNamePopped(TAG_ID.BUTTON);
  }
  p._reconstructActiveFormattingElements();
  p._insertElement(token, NS.HTML);
  p.framesetOk = false;
}
function aStartTagInBody(p, token) {
  const activeElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName(
    TAG_NAMES.A,
  );
  if (activeElementEntry) {
    callAdoptionAgency(p, token);
    p.openElements.remove(activeElementEntry.element);
    p.activeFormattingElements.removeEntry(activeElementEntry);
  }
  p._reconstructActiveFormattingElements();
  p._insertElement(token, NS.HTML);
  p.activeFormattingElements.pushElement(p.openElements.current, token);
}
function bStartTagInBody(p, token) {
  p._reconstructActiveFormattingElements();
  p._insertElement(token, NS.HTML);
  p.activeFormattingElements.pushElement(p.openElements.current, token);
}
function nobrStartTagInBody(p, token) {
  p._reconstructActiveFormattingElements();
  if (p.openElements.hasInScope(TAG_ID.NOBR)) {
    callAdoptionAgency(p, token);
    p._reconstructActiveFormattingElements();
  }
  p._insertElement(token, NS.HTML);
  p.activeFormattingElements.pushElement(p.openElements.current, token);
}
function appletStartTagInBody(p, token) {
  p._reconstructActiveFormattingElements();
  p._insertElement(token, NS.HTML);
  p.activeFormattingElements.insertMarker();
  p.framesetOk = false;
}
function tableStartTagInBody(p, token) {
  if (
    p.treeAdapter.getDocumentMode(p.document) !== DOCUMENT_MODE.QUIRKS &&
    p.openElements.hasInButtonScope(TAG_ID.P)
  )
    p._closePElement();
  p._insertElement(token, NS.HTML);
  p.framesetOk = false;
  p.insertionMode = InsertionMode.IN_TABLE;
}
function areaStartTagInBody(p, token) {
  p._reconstructActiveFormattingElements();
  p._appendElement(token, NS.HTML);
  p.framesetOk = false;
  token.ackSelfClosing = true;
}
function isHiddenInput(token) {
  const inputType = getTokenAttr(token, ATTRS.TYPE);
  return inputType != null && inputType.toLowerCase() === HIDDEN_INPUT_TYPE;
}
function inputStartTagInBody(p, token) {
  p._reconstructActiveFormattingElements();
  p._appendElement(token, NS.HTML);
  if (!isHiddenInput(token)) p.framesetOk = false;
  token.ackSelfClosing = true;
}
function paramStartTagInBody(p, token) {
  p._appendElement(token, NS.HTML);
  token.ackSelfClosing = true;
}
function hrStartTagInBody(p, token) {
  if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
  p._appendElement(token, NS.HTML);
  p.framesetOk = false;
  token.ackSelfClosing = true;
}
function imageStartTagInBody(p, token) {
  token.tagName = TAG_NAMES.IMG;
  token.tagID = TAG_ID.IMG;
  areaStartTagInBody(p, token);
}
function textareaStartTagInBody(p, token) {
  p._insertElement(token, NS.HTML);
  p.skipNextNewLine = true;
  p.tokenizer.state = TokenizerMode.RCDATA;
  p.originalInsertionMode = p.insertionMode;
  p.framesetOk = false;
  p.insertionMode = InsertionMode.TEXT;
}
function xmpStartTagInBody(p, token) {
  if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
  p._reconstructActiveFormattingElements();
  p.framesetOk = false;
  p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
}
function iframeStartTagInBody(p, token) {
  p.framesetOk = false;
  p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
}
function rawTextStartTagInBody(p, token) {
  p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
}
function selectStartTagInBody(p, token) {
  p._reconstructActiveFormattingElements();
  p._insertElement(token, NS.HTML);
  p.framesetOk = false;
  p.insertionMode =
    p.insertionMode === InsertionMode.IN_TABLE ||
    p.insertionMode === InsertionMode.IN_CAPTION ||
    p.insertionMode === InsertionMode.IN_TABLE_BODY ||
    p.insertionMode === InsertionMode.IN_ROW ||
    p.insertionMode === InsertionMode.IN_CELL
      ? InsertionMode.IN_SELECT_IN_TABLE
      : InsertionMode.IN_SELECT;
}
function optgroupStartTagInBody(p, token) {
  if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
  p._reconstructActiveFormattingElements();
  p._insertElement(token, NS.HTML);
}
function rbStartTagInBody(p, token) {
  if (p.openElements.hasInScope(TAG_ID.RUBY)) p.openElements.generateImpliedEndTags();
  p._insertElement(token, NS.HTML);
}
function rtStartTagInBody(p, token) {
  if (p.openElements.hasInScope(TAG_ID.RUBY))
    p.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.RTC);
  p._insertElement(token, NS.HTML);
}
function mathStartTagInBody(p, token) {
  p._reconstructActiveFormattingElements();
  adjustTokenMathMLAttrs(token);
  adjustTokenXMLAttrs(token);
  if (token.selfClosing) p._appendElement(token, NS.MATHML);
  else p._insertElement(token, NS.MATHML);
  token.ackSelfClosing = true;
}
function svgStartTagInBody(p, token) {
  p._reconstructActiveFormattingElements();
  adjustTokenSVGAttrs(token);
  adjustTokenXMLAttrs(token);
  if (token.selfClosing) p._appendElement(token, NS.SVG);
  else p._insertElement(token, NS.SVG);
  token.ackSelfClosing = true;
}
function genericStartTagInBody(p, token) {
  p._reconstructActiveFormattingElements();
  p._insertElement(token, NS.HTML);
}
function startTagInBody(p, token) {
  switch (token.tagID) {
    case TAG_ID.I:
    case TAG_ID.S:
    case TAG_ID.B:
    case TAG_ID.U:
    case TAG_ID.EM:
    case TAG_ID.TT:
    case TAG_ID.BIG:
    case TAG_ID.CODE:
    case TAG_ID.FONT:
    case TAG_ID.SMALL:
    case TAG_ID.STRIKE:
    case TAG_ID.STRONG:
      bStartTagInBody(p, token);
      break;
    case TAG_ID.A:
      aStartTagInBody(p, token);
      break;
    case TAG_ID.H1:
    case TAG_ID.H2:
    case TAG_ID.H3:
    case TAG_ID.H4:
    case TAG_ID.H5:
    case TAG_ID.H6:
      numberedHeaderStartTagInBody(p, token);
      break;
    case TAG_ID.P:
    case TAG_ID.DL:
    case TAG_ID.OL:
    case TAG_ID.UL:
    case TAG_ID.DIV:
    case TAG_ID.DIR:
    case TAG_ID.NAV:
    case TAG_ID.MAIN:
    case TAG_ID.MENU:
    case TAG_ID.ASIDE:
    case TAG_ID.CENTER:
    case TAG_ID.FIGURE:
    case TAG_ID.FOOTER:
    case TAG_ID.HEADER:
    case TAG_ID.HGROUP:
    case TAG_ID.DIALOG:
    case TAG_ID.DETAILS:
    case TAG_ID.ADDRESS:
    case TAG_ID.ARTICLE:
    case TAG_ID.SEARCH:
    case TAG_ID.SECTION:
    case TAG_ID.SUMMARY:
    case TAG_ID.FIELDSET:
    case TAG_ID.BLOCKQUOTE:
    case TAG_ID.FIGCAPTION:
      addressStartTagInBody(p, token);
      break;
    case TAG_ID.LI:
    case TAG_ID.DD:
    case TAG_ID.DT:
      listItemStartTagInBody(p, token);
      break;
    case TAG_ID.BR:
    case TAG_ID.IMG:
    case TAG_ID.WBR:
    case TAG_ID.AREA:
    case TAG_ID.EMBED:
    case TAG_ID.KEYGEN:
      areaStartTagInBody(p, token);
      break;
    case TAG_ID.HR:
      hrStartTagInBody(p, token);
      break;
    case TAG_ID.RB:
    case TAG_ID.RTC:
      rbStartTagInBody(p, token);
      break;
    case TAG_ID.RT:
    case TAG_ID.RP:
      rtStartTagInBody(p, token);
      break;
    case TAG_ID.PRE:
    case TAG_ID.LISTING:
      preStartTagInBody(p, token);
      break;
    case TAG_ID.XMP:
      xmpStartTagInBody(p, token);
      break;
    case TAG_ID.SVG:
      svgStartTagInBody(p, token);
      break;
    case TAG_ID.HTML:
      htmlStartTagInBody(p, token);
      break;
    case TAG_ID.BASE:
    case TAG_ID.LINK:
    case TAG_ID.META:
    case TAG_ID.STYLE:
    case TAG_ID.TITLE:
    case TAG_ID.SCRIPT:
    case TAG_ID.BGSOUND:
    case TAG_ID.BASEFONT:
    case TAG_ID.TEMPLATE:
      startTagInHead(p, token);
      break;
    case TAG_ID.BODY:
      bodyStartTagInBody(p, token);
      break;
    case TAG_ID.FORM:
      formStartTagInBody(p, token);
      break;
    case TAG_ID.NOBR:
      nobrStartTagInBody(p, token);
      break;
    case TAG_ID.MATH:
      mathStartTagInBody(p, token);
      break;
    case TAG_ID.TABLE:
      tableStartTagInBody(p, token);
      break;
    case TAG_ID.INPUT:
      inputStartTagInBody(p, token);
      break;
    case TAG_ID.PARAM:
    case TAG_ID.TRACK:
    case TAG_ID.SOURCE:
      paramStartTagInBody(p, token);
      break;
    case TAG_ID.IMAGE:
      imageStartTagInBody(p, token);
      break;
    case TAG_ID.BUTTON:
      buttonStartTagInBody(p, token);
      break;
    case TAG_ID.APPLET:
    case TAG_ID.OBJECT:
    case TAG_ID.MARQUEE:
      appletStartTagInBody(p, token);
      break;
    case TAG_ID.IFRAME:
      iframeStartTagInBody(p, token);
      break;
    case TAG_ID.SELECT:
      selectStartTagInBody(p, token);
      break;
    case TAG_ID.OPTION:
    case TAG_ID.OPTGROUP:
      optgroupStartTagInBody(p, token);
      break;
    case TAG_ID.NOEMBED:
    case TAG_ID.NOFRAMES:
      rawTextStartTagInBody(p, token);
      break;
    case TAG_ID.FRAMESET:
      framesetStartTagInBody(p, token);
      break;
    case TAG_ID.TEXTAREA:
      textareaStartTagInBody(p, token);
      break;
    case TAG_ID.NOSCRIPT:
      if (p.options.scriptingEnabled) rawTextStartTagInBody(p, token);
      else genericStartTagInBody(p, token);
      break;
    case TAG_ID.PLAINTEXT:
      plaintextStartTagInBody(p, token);
      break;
    case TAG_ID.COL:
    case TAG_ID.TH:
    case TAG_ID.TD:
    case TAG_ID.TR:
    case TAG_ID.HEAD:
    case TAG_ID.FRAME:
    case TAG_ID.TBODY:
    case TAG_ID.TFOOT:
    case TAG_ID.THEAD:
    case TAG_ID.CAPTION:
    case TAG_ID.COLGROUP:
      break;
    default:
      genericStartTagInBody(p, token);
  }
}
function bodyEndTagInBody(p, token) {
  if (p.openElements.hasInScope(TAG_ID.BODY)) {
    p.insertionMode = InsertionMode.AFTER_BODY;
    if (p.options.sourceCodeLocationInfo) {
      const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
      if (bodyElement) p._setEndLocation(bodyElement, token);
    }
  }
}
function htmlEndTagInBody(p, token) {
  if (p.openElements.hasInScope(TAG_ID.BODY)) {
    p.insertionMode = InsertionMode.AFTER_BODY;
    endTagAfterBody(p, token);
  }
}
function addressEndTagInBody(p, token) {
  const tn = token.tagID;
  if (p.openElements.hasInScope(tn)) {
    p.openElements.generateImpliedEndTags();
    p.openElements.popUntilTagNamePopped(tn);
  }
}
function formEndTagInBody(p) {
  const inTemplate = p.openElements.tmplCount > 0;
  const { formElement } = p;
  if (!inTemplate) p.formElement = null;
  if ((formElement || inTemplate) && p.openElements.hasInScope(TAG_ID.FORM)) {
    p.openElements.generateImpliedEndTags();
    if (inTemplate) p.openElements.popUntilTagNamePopped(TAG_ID.FORM);
    else if (formElement) p.openElements.remove(formElement);
  }
}
function pEndTagInBody(p) {
  if (!p.openElements.hasInButtonScope(TAG_ID.P)) p._insertFakeElement(TAG_NAMES.P, TAG_ID.P);
  p._closePElement();
}
function liEndTagInBody(p) {
  if (p.openElements.hasInListItemScope(TAG_ID.LI)) {
    p.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.LI);
    p.openElements.popUntilTagNamePopped(TAG_ID.LI);
  }
}
function ddEndTagInBody(p, token) {
  const tn = token.tagID;
  if (p.openElements.hasInScope(tn)) {
    p.openElements.generateImpliedEndTagsWithExclusion(tn);
    p.openElements.popUntilTagNamePopped(tn);
  }
}
function numberedHeaderEndTagInBody(p) {
  if (p.openElements.hasNumberedHeaderInScope()) {
    p.openElements.generateImpliedEndTags();
    p.openElements.popUntilNumberedHeaderPopped();
  }
}
function appletEndTagInBody(p, token) {
  const tn = token.tagID;
  if (p.openElements.hasInScope(tn)) {
    p.openElements.generateImpliedEndTags();
    p.openElements.popUntilTagNamePopped(tn);
    p.activeFormattingElements.clearToLastMarker();
  }
}
function brEndTagInBody(p) {
  p._reconstructActiveFormattingElements();
  p._insertFakeElement(TAG_NAMES.BR, TAG_ID.BR);
  p.openElements.pop();
  p.framesetOk = false;
}
function genericEndTagInBody(p, token) {
  const tn = token.tagName;
  const tid = token.tagID;
  for (let i = p.openElements.stackTop; i > 0; i--) {
    const element = p.openElements.items[i];
    const elementId = p.openElements.tagIDs[i];
    if (
      tid === elementId &&
      p.treeAdapter.getNamespaceURI(element) === NS.HTML &&
      (tid !== TAG_ID.UNKNOWN || p.treeAdapter.getTagName(element) === tn)
    ) {
      p.openElements.generateImpliedEndTagsWithExclusion(tid);
      if (p.openElements.stackTop >= i) p.openElements.shortenToLength(i);
      break;
    }
    if (p._isSpecialElement(element, elementId)) break;
  }
}
function endTagInBody(p, token) {
  switch (token.tagID) {
    case TAG_ID.A:
    case TAG_ID.B:
    case TAG_ID.I:
    case TAG_ID.S:
    case TAG_ID.U:
    case TAG_ID.EM:
    case TAG_ID.TT:
    case TAG_ID.BIG:
    case TAG_ID.CODE:
    case TAG_ID.FONT:
    case TAG_ID.NOBR:
    case TAG_ID.SMALL:
    case TAG_ID.STRIKE:
    case TAG_ID.STRONG:
      callAdoptionAgency(p, token);
      break;
    case TAG_ID.P:
      pEndTagInBody(p);
      break;
    case TAG_ID.DL:
    case TAG_ID.UL:
    case TAG_ID.OL:
    case TAG_ID.DIR:
    case TAG_ID.DIV:
    case TAG_ID.NAV:
    case TAG_ID.PRE:
    case TAG_ID.MAIN:
    case TAG_ID.MENU:
    case TAG_ID.ASIDE:
    case TAG_ID.BUTTON:
    case TAG_ID.CENTER:
    case TAG_ID.FIGURE:
    case TAG_ID.FOOTER:
    case TAG_ID.HEADER:
    case TAG_ID.HGROUP:
    case TAG_ID.DIALOG:
    case TAG_ID.ADDRESS:
    case TAG_ID.ARTICLE:
    case TAG_ID.DETAILS:
    case TAG_ID.SEARCH:
    case TAG_ID.SECTION:
    case TAG_ID.SUMMARY:
    case TAG_ID.LISTING:
    case TAG_ID.FIELDSET:
    case TAG_ID.BLOCKQUOTE:
    case TAG_ID.FIGCAPTION:
      addressEndTagInBody(p, token);
      break;
    case TAG_ID.LI:
      liEndTagInBody(p);
      break;
    case TAG_ID.DD:
    case TAG_ID.DT:
      ddEndTagInBody(p, token);
      break;
    case TAG_ID.H1:
    case TAG_ID.H2:
    case TAG_ID.H3:
    case TAG_ID.H4:
    case TAG_ID.H5:
    case TAG_ID.H6:
      numberedHeaderEndTagInBody(p);
      break;
    case TAG_ID.BR:
      brEndTagInBody(p);
      break;
    case TAG_ID.BODY:
      bodyEndTagInBody(p, token);
      break;
    case TAG_ID.HTML:
      htmlEndTagInBody(p, token);
      break;
    case TAG_ID.FORM:
      formEndTagInBody(p);
      break;
    case TAG_ID.APPLET:
    case TAG_ID.OBJECT:
    case TAG_ID.MARQUEE:
      appletEndTagInBody(p, token);
      break;
    case TAG_ID.TEMPLATE:
      templateEndTagInHead(p, token);
      break;
    default:
      genericEndTagInBody(p, token);
  }
}
function eofInBody(p, token) {
  if (p.tmplInsertionModeStack.length > 0) eofInTemplate(p, token);
  else stopParsing(p, token);
}
function endTagInText(p, token) {
  var _a;
  if (token.tagID === TAG_ID.SCRIPT)
    (_a = p.scriptHandler) === null || _a === void 0 || _a.call(p, p.openElements.current);
  p.openElements.pop();
  p.insertionMode = p.originalInsertionMode;
}
function eofInText(p, token) {
  p._err(token, ERR.eofInElementThatCanContainOnlyText);
  p.openElements.pop();
  p.insertionMode = p.originalInsertionMode;
  p.onEof(token);
}
function characterInTable(p, token) {
  if (
    p.openElements.currentTagId !== void 0 &&
    TABLE_STRUCTURE_TAGS.has(p.openElements.currentTagId)
  ) {
    p.pendingCharacterTokens.length = 0;
    p.hasNonWhitespacePendingCharacterToken = false;
    p.originalInsertionMode = p.insertionMode;
    p.insertionMode = InsertionMode.IN_TABLE_TEXT;
    switch (token.type) {
      case TokenType.CHARACTER:
        characterInTableText(p, token);
        break;
      case TokenType.WHITESPACE_CHARACTER:
        whitespaceCharacterInTableText(p, token);
    }
  } else tokenInTable(p, token);
}
function captionStartTagInTable(p, token) {
  p.openElements.clearBackToTableContext();
  p.activeFormattingElements.insertMarker();
  p._insertElement(token, NS.HTML);
  p.insertionMode = InsertionMode.IN_CAPTION;
}
function colgroupStartTagInTable(p, token) {
  p.openElements.clearBackToTableContext();
  p._insertElement(token, NS.HTML);
  p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
}
function colStartTagInTable(p, token) {
  p.openElements.clearBackToTableContext();
  p._insertFakeElement(TAG_NAMES.COLGROUP, TAG_ID.COLGROUP);
  p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
  startTagInColumnGroup(p, token);
}
function tbodyStartTagInTable(p, token) {
  p.openElements.clearBackToTableContext();
  p._insertElement(token, NS.HTML);
  p.insertionMode = InsertionMode.IN_TABLE_BODY;
}
function tdStartTagInTable(p, token) {
  p.openElements.clearBackToTableContext();
  p._insertFakeElement(TAG_NAMES.TBODY, TAG_ID.TBODY);
  p.insertionMode = InsertionMode.IN_TABLE_BODY;
  startTagInTableBody(p, token);
}
function tableStartTagInTable(p, token) {
  if (p.openElements.hasInTableScope(TAG_ID.TABLE)) {
    p.openElements.popUntilTagNamePopped(TAG_ID.TABLE);
    p._resetInsertionMode();
    p._processStartTag(token);
  }
}
function inputStartTagInTable(p, token) {
  if (isHiddenInput(token)) p._appendElement(token, NS.HTML);
  else tokenInTable(p, token);
  token.ackSelfClosing = true;
}
function formStartTagInTable(p, token) {
  if (!p.formElement && p.openElements.tmplCount === 0) {
    p._insertElement(token, NS.HTML);
    p.formElement = p.openElements.current;
    p.openElements.pop();
  }
}
function startTagInTable(p, token) {
  switch (token.tagID) {
    case TAG_ID.TD:
    case TAG_ID.TH:
    case TAG_ID.TR:
      tdStartTagInTable(p, token);
      break;
    case TAG_ID.STYLE:
    case TAG_ID.SCRIPT:
    case TAG_ID.TEMPLATE:
      startTagInHead(p, token);
      break;
    case TAG_ID.COL:
      colStartTagInTable(p, token);
      break;
    case TAG_ID.FORM:
      formStartTagInTable(p, token);
      break;
    case TAG_ID.TABLE:
      tableStartTagInTable(p, token);
      break;
    case TAG_ID.TBODY:
    case TAG_ID.TFOOT:
    case TAG_ID.THEAD:
      tbodyStartTagInTable(p, token);
      break;
    case TAG_ID.INPUT:
      inputStartTagInTable(p, token);
      break;
    case TAG_ID.CAPTION:
      captionStartTagInTable(p, token);
      break;
    case TAG_ID.COLGROUP:
      colgroupStartTagInTable(p, token);
      break;
    default:
      tokenInTable(p, token);
  }
}
function endTagInTable(p, token) {
  switch (token.tagID) {
    case TAG_ID.TABLE:
      if (p.openElements.hasInTableScope(TAG_ID.TABLE)) {
        p.openElements.popUntilTagNamePopped(TAG_ID.TABLE);
        p._resetInsertionMode();
      }
      break;
    case TAG_ID.TEMPLATE:
      templateEndTagInHead(p, token);
      break;
    case TAG_ID.BODY:
    case TAG_ID.CAPTION:
    case TAG_ID.COL:
    case TAG_ID.COLGROUP:
    case TAG_ID.HTML:
    case TAG_ID.TBODY:
    case TAG_ID.TD:
    case TAG_ID.TFOOT:
    case TAG_ID.TH:
    case TAG_ID.THEAD:
    case TAG_ID.TR:
      break;
    default:
      tokenInTable(p, token);
  }
}
function tokenInTable(p, token) {
  const savedFosterParentingState = p.fosterParentingEnabled;
  p.fosterParentingEnabled = true;
  modeInBody(p, token);
  p.fosterParentingEnabled = savedFosterParentingState;
}
function whitespaceCharacterInTableText(p, token) {
  p.pendingCharacterTokens.push(token);
}
function characterInTableText(p, token) {
  p.pendingCharacterTokens.push(token);
  p.hasNonWhitespacePendingCharacterToken = true;
}
function tokenInTableText(p, token) {
  let i = 0;
  if (p.hasNonWhitespacePendingCharacterToken)
    for (; i < p.pendingCharacterTokens.length; i++) tokenInTable(p, p.pendingCharacterTokens[i]);
  else
    for (; i < p.pendingCharacterTokens.length; i++)
      p._insertCharacters(p.pendingCharacterTokens[i]);
  p.insertionMode = p.originalInsertionMode;
  p._processToken(token);
}
const TABLE_VOID_ELEMENTS = /* @__PURE__ */ new Set([
  TAG_ID.CAPTION,
  TAG_ID.COL,
  TAG_ID.COLGROUP,
  TAG_ID.TBODY,
  TAG_ID.TD,
  TAG_ID.TFOOT,
  TAG_ID.TH,
  TAG_ID.THEAD,
  TAG_ID.TR,
]);
function startTagInCaption(p, token) {
  const tn = token.tagID;
  if (TABLE_VOID_ELEMENTS.has(tn)) {
    if (p.openElements.hasInTableScope(TAG_ID.CAPTION)) {
      p.openElements.generateImpliedEndTags();
      p.openElements.popUntilTagNamePopped(TAG_ID.CAPTION);
      p.activeFormattingElements.clearToLastMarker();
      p.insertionMode = InsertionMode.IN_TABLE;
      startTagInTable(p, token);
    }
  } else startTagInBody(p, token);
}
function endTagInCaption(p, token) {
  const tn = token.tagID;
  switch (tn) {
    case TAG_ID.CAPTION:
    case TAG_ID.TABLE:
      if (p.openElements.hasInTableScope(TAG_ID.CAPTION)) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilTagNamePopped(TAG_ID.CAPTION);
        p.activeFormattingElements.clearToLastMarker();
        p.insertionMode = InsertionMode.IN_TABLE;
        if (tn === TAG_ID.TABLE) endTagInTable(p, token);
      }
      break;
    case TAG_ID.BODY:
    case TAG_ID.COL:
    case TAG_ID.COLGROUP:
    case TAG_ID.HTML:
    case TAG_ID.TBODY:
    case TAG_ID.TD:
    case TAG_ID.TFOOT:
    case TAG_ID.TH:
    case TAG_ID.THEAD:
    case TAG_ID.TR:
      break;
    default:
      endTagInBody(p, token);
  }
}
function startTagInColumnGroup(p, token) {
  switch (token.tagID) {
    case TAG_ID.HTML:
      startTagInBody(p, token);
      break;
    case TAG_ID.COL:
      p._appendElement(token, NS.HTML);
      token.ackSelfClosing = true;
      break;
    case TAG_ID.TEMPLATE:
      startTagInHead(p, token);
      break;
    default:
      tokenInColumnGroup(p, token);
  }
}
function endTagInColumnGroup(p, token) {
  switch (token.tagID) {
    case TAG_ID.COLGROUP:
      if (p.openElements.currentTagId === TAG_ID.COLGROUP) {
        p.openElements.pop();
        p.insertionMode = InsertionMode.IN_TABLE;
      }
      break;
    case TAG_ID.TEMPLATE:
      templateEndTagInHead(p, token);
      break;
    case TAG_ID.COL:
      break;
    default:
      tokenInColumnGroup(p, token);
  }
}
function tokenInColumnGroup(p, token) {
  if (p.openElements.currentTagId === TAG_ID.COLGROUP) {
    p.openElements.pop();
    p.insertionMode = InsertionMode.IN_TABLE;
    p._processToken(token);
  }
}
function startTagInTableBody(p, token) {
  switch (token.tagID) {
    case TAG_ID.TR:
      p.openElements.clearBackToTableBodyContext();
      p._insertElement(token, NS.HTML);
      p.insertionMode = InsertionMode.IN_ROW;
      break;
    case TAG_ID.TH:
    case TAG_ID.TD:
      p.openElements.clearBackToTableBodyContext();
      p._insertFakeElement(TAG_NAMES.TR, TAG_ID.TR);
      p.insertionMode = InsertionMode.IN_ROW;
      startTagInRow(p, token);
      break;
    case TAG_ID.CAPTION:
    case TAG_ID.COL:
    case TAG_ID.COLGROUP:
    case TAG_ID.TBODY:
    case TAG_ID.TFOOT:
    case TAG_ID.THEAD:
      if (p.openElements.hasTableBodyContextInTableScope()) {
        p.openElements.clearBackToTableBodyContext();
        p.openElements.pop();
        p.insertionMode = InsertionMode.IN_TABLE;
        startTagInTable(p, token);
      }
      break;
    default:
      startTagInTable(p, token);
  }
}
function endTagInTableBody(p, token) {
  const tn = token.tagID;
  switch (token.tagID) {
    case TAG_ID.TBODY:
    case TAG_ID.TFOOT:
    case TAG_ID.THEAD:
      if (p.openElements.hasInTableScope(tn)) {
        p.openElements.clearBackToTableBodyContext();
        p.openElements.pop();
        p.insertionMode = InsertionMode.IN_TABLE;
      }
      break;
    case TAG_ID.TABLE:
      if (p.openElements.hasTableBodyContextInTableScope()) {
        p.openElements.clearBackToTableBodyContext();
        p.openElements.pop();
        p.insertionMode = InsertionMode.IN_TABLE;
        endTagInTable(p, token);
      }
      break;
    case TAG_ID.BODY:
    case TAG_ID.CAPTION:
    case TAG_ID.COL:
    case TAG_ID.COLGROUP:
    case TAG_ID.HTML:
    case TAG_ID.TD:
    case TAG_ID.TH:
    case TAG_ID.TR:
      break;
    default:
      endTagInTable(p, token);
  }
}
function startTagInRow(p, token) {
  switch (token.tagID) {
    case TAG_ID.TH:
    case TAG_ID.TD:
      p.openElements.clearBackToTableRowContext();
      p._insertElement(token, NS.HTML);
      p.insertionMode = InsertionMode.IN_CELL;
      p.activeFormattingElements.insertMarker();
      break;
    case TAG_ID.CAPTION:
    case TAG_ID.COL:
    case TAG_ID.COLGROUP:
    case TAG_ID.TBODY:
    case TAG_ID.TFOOT:
    case TAG_ID.THEAD:
    case TAG_ID.TR:
      if (p.openElements.hasInTableScope(TAG_ID.TR)) {
        p.openElements.clearBackToTableRowContext();
        p.openElements.pop();
        p.insertionMode = InsertionMode.IN_TABLE_BODY;
        startTagInTableBody(p, token);
      }
      break;
    default:
      startTagInTable(p, token);
  }
}
function endTagInRow(p, token) {
  switch (token.tagID) {
    case TAG_ID.TR:
      if (p.openElements.hasInTableScope(TAG_ID.TR)) {
        p.openElements.clearBackToTableRowContext();
        p.openElements.pop();
        p.insertionMode = InsertionMode.IN_TABLE_BODY;
      }
      break;
    case TAG_ID.TABLE:
      if (p.openElements.hasInTableScope(TAG_ID.TR)) {
        p.openElements.clearBackToTableRowContext();
        p.openElements.pop();
        p.insertionMode = InsertionMode.IN_TABLE_BODY;
        endTagInTableBody(p, token);
      }
      break;
    case TAG_ID.TBODY:
    case TAG_ID.TFOOT:
    case TAG_ID.THEAD:
      if (
        p.openElements.hasInTableScope(token.tagID) ||
        p.openElements.hasInTableScope(TAG_ID.TR)
      ) {
        p.openElements.clearBackToTableRowContext();
        p.openElements.pop();
        p.insertionMode = InsertionMode.IN_TABLE_BODY;
        endTagInTableBody(p, token);
      }
      break;
    case TAG_ID.BODY:
    case TAG_ID.CAPTION:
    case TAG_ID.COL:
    case TAG_ID.COLGROUP:
    case TAG_ID.HTML:
    case TAG_ID.TD:
    case TAG_ID.TH:
      break;
    default:
      endTagInTable(p, token);
  }
}
function startTagInCell(p, token) {
  const tn = token.tagID;
  if (TABLE_VOID_ELEMENTS.has(tn)) {
    if (p.openElements.hasInTableScope(TAG_ID.TD) || p.openElements.hasInTableScope(TAG_ID.TH)) {
      p._closeTableCell();
      startTagInRow(p, token);
    }
  } else startTagInBody(p, token);
}
function endTagInCell(p, token) {
  const tn = token.tagID;
  switch (tn) {
    case TAG_ID.TD:
    case TAG_ID.TH:
      if (p.openElements.hasInTableScope(tn)) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilTagNamePopped(tn);
        p.activeFormattingElements.clearToLastMarker();
        p.insertionMode = InsertionMode.IN_ROW;
      }
      break;
    case TAG_ID.TABLE:
    case TAG_ID.TBODY:
    case TAG_ID.TFOOT:
    case TAG_ID.THEAD:
    case TAG_ID.TR:
      if (p.openElements.hasInTableScope(tn)) {
        p._closeTableCell();
        endTagInRow(p, token);
      }
      break;
    case TAG_ID.BODY:
    case TAG_ID.CAPTION:
    case TAG_ID.COL:
    case TAG_ID.COLGROUP:
    case TAG_ID.HTML:
      break;
    default:
      endTagInBody(p, token);
  }
}
function startTagInSelect(p, token) {
  switch (token.tagID) {
    case TAG_ID.HTML:
      startTagInBody(p, token);
      break;
    case TAG_ID.OPTION:
      if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
      p._insertElement(token, NS.HTML);
      break;
    case TAG_ID.OPTGROUP:
      if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
      if (p.openElements.currentTagId === TAG_ID.OPTGROUP) p.openElements.pop();
      p._insertElement(token, NS.HTML);
      break;
    case TAG_ID.HR:
      if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
      if (p.openElements.currentTagId === TAG_ID.OPTGROUP) p.openElements.pop();
      p._appendElement(token, NS.HTML);
      token.ackSelfClosing = true;
      break;
    case TAG_ID.INPUT:
    case TAG_ID.KEYGEN:
    case TAG_ID.TEXTAREA:
    case TAG_ID.SELECT:
      if (p.openElements.hasInSelectScope(TAG_ID.SELECT)) {
        p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
        p._resetInsertionMode();
        if (token.tagID !== TAG_ID.SELECT) p._processStartTag(token);
      }
      break;
    case TAG_ID.SCRIPT:
    case TAG_ID.TEMPLATE:
      startTagInHead(p, token);
  }
}
function endTagInSelect(p, token) {
  switch (token.tagID) {
    case TAG_ID.OPTGROUP:
      if (
        p.openElements.stackTop > 0 &&
        p.openElements.currentTagId === TAG_ID.OPTION &&
        p.openElements.tagIDs[p.openElements.stackTop - 1] === TAG_ID.OPTGROUP
      )
        p.openElements.pop();
      if (p.openElements.currentTagId === TAG_ID.OPTGROUP) p.openElements.pop();
      break;
    case TAG_ID.OPTION:
      if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
      break;
    case TAG_ID.SELECT:
      if (p.openElements.hasInSelectScope(TAG_ID.SELECT)) {
        p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
        p._resetInsertionMode();
      }
      break;
    case TAG_ID.TEMPLATE:
      templateEndTagInHead(p, token);
  }
}
function startTagInSelectInTable(p, token) {
  const tn = token.tagID;
  if (
    tn === TAG_ID.CAPTION ||
    tn === TAG_ID.TABLE ||
    tn === TAG_ID.TBODY ||
    tn === TAG_ID.TFOOT ||
    tn === TAG_ID.THEAD ||
    tn === TAG_ID.TR ||
    tn === TAG_ID.TD ||
    tn === TAG_ID.TH
  ) {
    p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
    p._resetInsertionMode();
    p._processStartTag(token);
  } else startTagInSelect(p, token);
}
function endTagInSelectInTable(p, token) {
  const tn = token.tagID;
  if (
    tn === TAG_ID.CAPTION ||
    tn === TAG_ID.TABLE ||
    tn === TAG_ID.TBODY ||
    tn === TAG_ID.TFOOT ||
    tn === TAG_ID.THEAD ||
    tn === TAG_ID.TR ||
    tn === TAG_ID.TD ||
    tn === TAG_ID.TH
  ) {
    if (p.openElements.hasInTableScope(tn)) {
      p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
      p._resetInsertionMode();
      p.onEndTag(token);
    }
  } else endTagInSelect(p, token);
}
function startTagInTemplate(p, token) {
  switch (token.tagID) {
    case TAG_ID.BASE:
    case TAG_ID.BASEFONT:
    case TAG_ID.BGSOUND:
    case TAG_ID.LINK:
    case TAG_ID.META:
    case TAG_ID.NOFRAMES:
    case TAG_ID.SCRIPT:
    case TAG_ID.STYLE:
    case TAG_ID.TEMPLATE:
    case TAG_ID.TITLE:
      startTagInHead(p, token);
      break;
    case TAG_ID.CAPTION:
    case TAG_ID.COLGROUP:
    case TAG_ID.TBODY:
    case TAG_ID.TFOOT:
    case TAG_ID.THEAD:
      p.tmplInsertionModeStack[0] = InsertionMode.IN_TABLE;
      p.insertionMode = InsertionMode.IN_TABLE;
      startTagInTable(p, token);
      break;
    case TAG_ID.COL:
      p.tmplInsertionModeStack[0] = InsertionMode.IN_COLUMN_GROUP;
      p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
      startTagInColumnGroup(p, token);
      break;
    case TAG_ID.TR:
      p.tmplInsertionModeStack[0] = InsertionMode.IN_TABLE_BODY;
      p.insertionMode = InsertionMode.IN_TABLE_BODY;
      startTagInTableBody(p, token);
      break;
    case TAG_ID.TD:
    case TAG_ID.TH:
      p.tmplInsertionModeStack[0] = InsertionMode.IN_ROW;
      p.insertionMode = InsertionMode.IN_ROW;
      startTagInRow(p, token);
      break;
    default:
      p.tmplInsertionModeStack[0] = InsertionMode.IN_BODY;
      p.insertionMode = InsertionMode.IN_BODY;
      startTagInBody(p, token);
  }
}
function endTagInTemplate(p, token) {
  if (token.tagID === TAG_ID.TEMPLATE) templateEndTagInHead(p, token);
}
function eofInTemplate(p, token) {
  if (p.openElements.tmplCount > 0) {
    p.openElements.popUntilTagNamePopped(TAG_ID.TEMPLATE);
    p.activeFormattingElements.clearToLastMarker();
    p.tmplInsertionModeStack.shift();
    p._resetInsertionMode();
    p.onEof(token);
  } else stopParsing(p, token);
}
function startTagAfterBody(p, token) {
  if (token.tagID === TAG_ID.HTML) startTagInBody(p, token);
  else tokenAfterBody(p, token);
}
function endTagAfterBody(p, token) {
  var _a;
  if (token.tagID === TAG_ID.HTML) {
    if (!p.fragmentContext) p.insertionMode = InsertionMode.AFTER_AFTER_BODY;
    if (p.options.sourceCodeLocationInfo && p.openElements.tagIDs[0] === TAG_ID.HTML) {
      p._setEndLocation(p.openElements.items[0], token);
      const bodyElement = p.openElements.items[1];
      if (
        bodyElement &&
        !((_a = p.treeAdapter.getNodeSourceCodeLocation(bodyElement)) === null || _a === void 0
          ? void 0
          : _a.endTag)
      )
        p._setEndLocation(bodyElement, token);
    }
  } else tokenAfterBody(p, token);
}
function tokenAfterBody(p, token) {
  p.insertionMode = InsertionMode.IN_BODY;
  modeInBody(p, token);
}
function startTagInFrameset(p, token) {
  switch (token.tagID) {
    case TAG_ID.HTML:
      startTagInBody(p, token);
      break;
    case TAG_ID.FRAMESET:
      p._insertElement(token, NS.HTML);
      break;
    case TAG_ID.FRAME:
      p._appendElement(token, NS.HTML);
      token.ackSelfClosing = true;
      break;
    case TAG_ID.NOFRAMES:
      startTagInHead(p, token);
  }
}
function endTagInFrameset(p, token) {
  if (token.tagID === TAG_ID.FRAMESET && !p.openElements.isRootHtmlElementCurrent()) {
    p.openElements.pop();
    if (!p.fragmentContext && p.openElements.currentTagId !== TAG_ID.FRAMESET)
      p.insertionMode = InsertionMode.AFTER_FRAMESET;
  }
}
function startTagAfterFrameset(p, token) {
  switch (token.tagID) {
    case TAG_ID.HTML:
      startTagInBody(p, token);
      break;
    case TAG_ID.NOFRAMES:
      startTagInHead(p, token);
  }
}
function endTagAfterFrameset(p, token) {
  if (token.tagID === TAG_ID.HTML) p.insertionMode = InsertionMode.AFTER_AFTER_FRAMESET;
}
function startTagAfterAfterBody(p, token) {
  if (token.tagID === TAG_ID.HTML) startTagInBody(p, token);
  else tokenAfterAfterBody(p, token);
}
function tokenAfterAfterBody(p, token) {
  p.insertionMode = InsertionMode.IN_BODY;
  modeInBody(p, token);
}
function startTagAfterAfterFrameset(p, token) {
  switch (token.tagID) {
    case TAG_ID.HTML:
      startTagInBody(p, token);
      break;
    case TAG_ID.NOFRAMES:
      startTagInHead(p, token);
  }
}
function nullCharacterInForeignContent(p, token) {
  token.chars = "�";
  p._insertCharacters(token);
}
function characterInForeignContent(p, token) {
  p._insertCharacters(token);
  p.framesetOk = false;
}
function popUntilHtmlOrIntegrationPoint(p) {
  while (
    p.treeAdapter.getNamespaceURI(p.openElements.current) !== NS.HTML &&
    p.openElements.currentTagId !== void 0 &&
    !p._isIntegrationPoint(p.openElements.currentTagId, p.openElements.current)
  )
    p.openElements.pop();
}
function startTagInForeignContent(p, token) {
  if (causesExit(token)) {
    popUntilHtmlOrIntegrationPoint(p);
    p._startTagOutsideForeignContent(token);
  } else {
    const current = p._getAdjustedCurrentElement();
    const currentNs = p.treeAdapter.getNamespaceURI(current);
    if (currentNs === NS.MATHML) adjustTokenMathMLAttrs(token);
    else if (currentNs === NS.SVG) {
      adjustTokenSVGTagName(token);
      adjustTokenSVGAttrs(token);
    }
    adjustTokenXMLAttrs(token);
    if (token.selfClosing) p._appendElement(token, currentNs);
    else p._insertElement(token, currentNs);
    token.ackSelfClosing = true;
  }
}
function endTagInForeignContent(p, token) {
  if (token.tagID === TAG_ID.P || token.tagID === TAG_ID.BR) {
    popUntilHtmlOrIntegrationPoint(p);
    p._endTagOutsideForeignContent(token);
    return;
  }
  for (let i = p.openElements.stackTop; i > 0; i--) {
    const element = p.openElements.items[i];
    if (p.treeAdapter.getNamespaceURI(element) === NS.HTML) {
      p._endTagOutsideForeignContent(token);
      break;
    }
    const tagName = p.treeAdapter.getTagName(element);
    if (tagName.toLowerCase() === token.tagName) {
      token.tagName = tagName;
      p.openElements.shortenToLength(i);
      break;
    }
  }
}
(TAG_NAMES.AREA,
  TAG_NAMES.BASE,
  TAG_NAMES.BASEFONT,
  TAG_NAMES.BGSOUND,
  TAG_NAMES.BR,
  TAG_NAMES.COL,
  TAG_NAMES.EMBED,
  TAG_NAMES.FRAME,
  TAG_NAMES.HR,
  TAG_NAMES.IMG,
  TAG_NAMES.INPUT,
  TAG_NAMES.KEYGEN,
  TAG_NAMES.LINK,
  TAG_NAMES.META,
  TAG_NAMES.PARAM,
  TAG_NAMES.SOURCE,
  TAG_NAMES.TRACK,
  TAG_NAMES.WBR);
// ../../node_modules/.pnpm/parse5@8.1.0/node_modules/parse5/dist/index.js
/**
 * Parses an HTML string.
 *
 * @param html Input HTML string.
 * @param options Parsing options.
 * @returns Document
 *
 * @example
 *
 * ```js
 * const parse5 = require('parse5');
 *
 * const document = parse5.parse('<!DOCTYPE html><html><head></head><body>Hi there!</body></html>');
 *
 * console.log(document.childNodes[1].tagName); //> 'html'
 *```
 */
function parse(html, options) {
  return Parser.parse(html, options);
}
// src/html.ts
/** A page's edits, oldest first, applied to its HTML. */
function editHtml(html, edits, where) {
  const page = new Page(html);
  const s = reduce(edits, (ref) => page.fields.has(ref));
  const urls = (p) => ({
    small: photoUrl(where.api, where.project, p.name, "s"),
    large: photoUrl(where.api, where.project, p.name, "l"),
  });
  const byField = /* @__PURE__ */ new Set();
  for (const [ref, text] of [...s.fields].reverse())
    for (const el of page.fields.get(ref) ?? []) {
      if (!oneLine(allText(el))) continue;
      const at = textOnly(el) ? el : soleText(el);
      if (!at || RAW_TEXT.has(at.tagName) || byField.has(at)) continue;
      byField.add(at);
      page.replaceInner(at, escText(text));
    }
  for (const [id, els] of page.marked)
    for (const el of els) {
      const base = {
        tag: el.tagName,
        className: attr(el, "class"),
      };
      const after = following(id, s)
        .filter((next) => !s.removed.has(next))
        .map((next) => block(next, s.blocks.get(next), s, base, urls, where.renderPhoto))
        .join("");
      if (s.removed.has(id)) {
        if (!RAW_TEXT.has(el.tagName)) page.replaceOuter(el, after);
        continue;
      }
      const text = s.text.get(id);
      if (text !== void 0 && !RAW_TEXT.has(el.tagName) && !byField.has(el))
        page.replaceInner(el, escText(text));
      const photo = s.photo.get(id);
      const style = page.getAttribute(el, "style");
      if (photo && style?.includes("--r"))
        page.setAttribute(el, "style", style.replace(/--r:\s*[^;]+/, `--r:${ratio(photo)}`));
      if (after) page.insertAfter(el, after);
    }
  for (const [id, photo] of s.photo) {
    const u = urls(photo);
    for (const media of page.marked.get(`${id}/photo`) ?? []) {
      if (media.tagName === "img") setImage(page, media, photo, u);
      else if (media.tagName === "video") page.replaceOuter(media, image(`${id}/photo`, photo, u));
      if (page.hasAttribute(media, "data-full")) page.setAttribute(media, "data-full", u.large);
      for (const el of descendants(media))
        if (el.tagName === "img") setImage(page, el, photo, u);
        else if (el.tagName === "source") page.replaceOuter(el, "");
    }
    const first = (page.marked.get(id) ?? [])
      .flatMap((fig) => [...descendants(fig)])
      .find((el) => el.tagName === "img");
    if (first && !page.hasAttribute(first, "data-edit")) setImage(page, first, photo, u);
  }
  const now = /* @__PURE__ */ new Map();
  for (const e of s.loose) {
    if (e.change.kind !== "text" || !e.anchor.selector) continue;
    const found = page.select(e.anchor.selector);
    if (found.length !== 1) continue;
    const el = found[0];
    if (RAW_TEXT.has(el.tagName) || !textOnly(el) || byField.has(el)) continue;
    if ((now.get(el) ?? oneLine(textContent(el))) === e.change.before) now.set(el, e.change.text);
  }
  for (const [el, text] of now) page.replaceInner(el, escText(text));
  return page.result();
}
/** The HTML of a block added by an edit, with any later edits to its own text or photo. */
function block(id, b, s, base, urls, renderPhoto) {
  if (b.type === "p" || b.type === "li") {
    const cls = base.tag === b.type && base.className ? ` class="${esc(base.className)}"` : "";
    return `<${b.type}${cls} data-edit="${esc(id)}" data-edit-kind="${b.type}">${escText(s.text.get(id) ?? b.text)}</${b.type}>`;
  }
  if (b.type !== "shot") return "";
  const photo = s.photo.get(id) ?? b.photo;
  return (renderPhoto ?? figure)({
    id,
    photo,
    caption: s.text.get(`${id}/cap`) ?? b.caption,
    ...urls(photo),
    className: base.tag === "figure" ? base.className : null,
  });
}
/** The default markup of an added photo: a figure with the image and an editable caption. */
function figure(p) {
  return (
    `<figure${p.className ? ` class="${esc(p.className)}"` : ""} data-edit="${esc(p.id)}" data-edit-kind="shot">` +
    image(`${p.id}/photo`, p.photo, p) +
    `<figcaption><span data-edit="${esc(p.id)}/cap" data-edit-kind="text">${esc(p.caption)}</span></figcaption></figure>`
  );
}
/** An img for an uploaded photo, at the size that fits, with the large one for wide screens. */
function image(id, p, u) {
  return `<img data-edit="${esc(id)}" src="${esc(u.small)}" srcset="${esc(u.small)} ${Number(p.w)}w, ${esc(u.large)} ${Number(p.wl)}w" sizes="100vw" width="${Number(p.w)}" height="${Number(p.h)}" alt="" loading="lazy" decoding="async">`;
}
function setImage(page, el, p, u) {
  page.setAttribute(el, "src", u.small);
  page.setAttribute(el, "srcset", `${u.small} ${Number(p.w)}w, ${u.large} ${Number(p.wl)}w`);
  if (!page.hasAttribute(el, "sizes")) page.setAttribute(el, "sizes", "100vw");
  page.setAttribute(el, "width", String(Number(p.w)));
  page.setAttribute(el, "height", String(Number(p.h)));
}
/**
 * Elements whose content isn't text a reader sees (a script's code, a style sheet) or that hold
 * text the page doesn't show as it's written. A text edit never applies to them, found by its
 * path or marked with an id: on a script it would put a reviewer's text into every visitor's page
 * as code. Inside SVG, a script or style element is code too, and has the same name.
 */
const RAW_TEXT = /* @__PURE__ */ new Set([
  "script",
  "style",
  "title",
  "textarea",
  "template",
  "noscript",
  "iframe",
  "xmp",
  "noembed",
  "noframes",
  "plaintext",
]);
/** Elements that never have content or an end tag. */
const VOID = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);
const ratio = (p) => (p.w / p.h).toFixed(4);
const oneLine = (s) => s.replace(/\s+/g, " ").trim();
/** Escapes text for HTML, for a site's renderPhoto: safe in text and in quoted attributes. */
function esc(s) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
/** Escapes text that goes between tags. */
const escText = (s) =>
  s.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
const isElement = (n) => "tagName" in n;
function attr(el, name) {
  return el.attrs.find((a) => a.name === name && !a.namespace)?.value ?? null;
}
function* descendants(el) {
  for (const child of el.childNodes) {
    if (!isElement(child)) continue;
    yield child;
    yield* descendants(child);
  }
}
/** An element whose content is text alone (and line breaks), which can be replaced as text. */
function textOnly(el) {
  return el.childNodes.every((n) => n.nodeName === "#text" || (isElement(n) && n.tagName === "br"));
}
function textContent(el) {
  return el.childNodes.map((n) => ("value" in n && n.nodeName === "#text" ? n.value : "")).join("");
}
/** All the text in an element, its descendants' too, as the DOM's textContent has it. */
function allText(el) {
  return el.childNodes
    .map((n) => (isElement(n) ? allText(n) : n.nodeName === "#text" && "value" in n ? n.value : ""))
    .join("");
}
/**
 * The one element inside another that holds all its text, alone (a label in a link, beside an
 * icon); null where the text is in several, as the widget's replay has it (copiesOf).
 */
function soleText(el) {
  const all = oneLine(allText(el));
  const inner = [...descendants(el)].filter((e) => textOnly(e) && oneLine(textContent(e)));
  return inner.length === 1 && oneLine(textContent(inner[0])) === all ? inner[0] : null;
}
/**
 * The parsed page, and the changes to make to its source. Changes are collected and made at the
 * end, from the last to the first, so each one's offsets still mean what parse5 said.
 */
var Page = class {
  /** Elements with a data-edit id, in page order, by id. */
  marked = /* @__PURE__ */ new Map();
  /** Elements with a field ref (data-touchup-field), in page order, by ref. */
  fields = /* @__PURE__ */ new Map();
  body = [];
  ids = /* @__PURE__ */ new Map();
  splices = [];
  attrs = /* @__PURE__ */ new Map();
  html;
  constructor(html) {
    this.html = html;
    const doc = parse(html, { sourceCodeLocationInfo: true });
    const walk = (node) => {
      if (!("childNodes" in node)) return;
      for (const child of node.childNodes) {
        if (!isElement(child)) continue;
        const edit = attr(child, "data-edit");
        if (edit !== null) this.marked.set(edit, [...(this.marked.get(edit) ?? []), child]);
        const field = attr(child, "data-touchup-field");
        if (field !== null) this.fields.set(field, [...(this.fields.get(field) ?? []), child]);
        const id = attr(child, "id");
        if (id !== null) this.ids.set(id, [...(this.ids.get(id) ?? []), child]);
        if (child.tagName === "body") this.body.push(child);
        walk(child);
      }
    };
    walk(doc);
  }
  /**
   * The elements a CSS path of the widget's (anchor.ts selectorOf; the server accepts no other
   * shape) leads to: from body or an id, through tags and their positions among their siblings
   * of the same tag. Any other selector leads nowhere.
   */
  select(selector) {
    const parts = selector.split(" > ");
    const root = parts.shift();
    let found =
      root === "body"
        ? this.body
        : /^#[A-Za-z][\w-]*$/.test(root)
          ? this.ids.get(root.slice(1))
          : [];
    for (const part of parts) {
      const m = /^([a-z][a-z0-9-]*):nth-of-type\((\d+)\)$/.exec(part);
      if (!m || !found) return [];
      const [, tag, n] = m;
      found = found.flatMap((parent) => {
        const el = parent.childNodes.filter((c) => isElement(c) && c.tagName === tag)[
          Number(n) - 1
        ];
        return el ? [el] : [];
      });
    }
    return found ?? [];
  }
  getAttribute(el, name) {
    return this.attrs.get(el)?.get(name) ?? attr(el, name);
  }
  hasAttribute(el, name) {
    return this.getAttribute(el, name) !== null;
  }
  setAttribute(el, name, value) {
    if (!el.sourceCodeLocation?.startTag) return;
    const changed = this.attrs.get(el) ?? /* @__PURE__ */ new Map();
    changed.set(name, value);
    this.attrs.set(el, changed);
  }
  /** Puts HTML in place of everything between an element's tags. */
  replaceInner(el, html) {
    const r = inner(el);
    if (r)
      this.splices.push({
        start: r[0],
        end: r[1],
        text: html,
      });
  }
  /** Puts HTML in place of the element itself. */
  replaceOuter(el, html) {
    const r = outer(el);
    if (r)
      this.splices.push({
        start: r[0],
        end: r[1],
        text: html,
      });
  }
  insertAfter(el, html) {
    const r = outer(el);
    if (r)
      this.splices.push({
        start: r[1],
        end: r[1],
        text: html,
      });
  }
  result() {
    for (const [el, changed] of this.attrs) {
      const loc = el.sourceCodeLocation;
      const added = [];
      for (const [name, value] of changed) {
        const at = loc.attrs?.[name];
        const markup = `${name}="${esc(value)}"`;
        if (at)
          this.splices.push({
            start: at.startOffset,
            end: at.endOffset,
            text: markup,
          });
        else added.push(` ${markup}`);
      }
      if (!added.length) continue;
      const startTag = loc.startTag;
      const ends = Object.values(loc.attrs ?? {}).map((a) => a.endOffset);
      const at = ends.length ? Math.max(...ends) : startTag.startOffset + 1 + el.tagName.length;
      this.splices.push({
        start: at,
        end: at,
        text: added.join(""),
      });
    }
    const order = this.splices
      .map((s, n) => ({
        ...s,
        n,
      }))
      .sort(
        (a, b) =>
          a.start - b.start ||
          Number(a.end > a.start) - Number(b.end > b.start) ||
          b.end - a.end ||
          a.n - b.n,
      );
    let out = "";
    let at = 0;
    for (const s of order) {
      if (s.start < at) continue;
      out += this.html.slice(at, s.start) + s.text;
      at = s.end;
    }
    return out + this.html.slice(at);
  }
};
/**
 * The source range of an element's content: between its start tag and its end tag (or what
 * closed it). Only where its children fill that range exactly and in order; where the parser
 * moved things (a misnested tag, text in a table) the offsets don't add up, and it's left alone.
 */
function inner(el) {
  const loc = el.sourceCodeLocation;
  if (!loc?.startTag || VOID.has(el.tagName)) return null;
  const start = loc.startTag.endOffset;
  const end = loc.endTag ? loc.endTag.startOffset : loc.endOffset;
  if (!(end >= start)) return null;
  let at = start;
  for (const child of el.childNodes) {
    const c = child.sourceCodeLocation;
    if (!c || c.startOffset !== at) return null;
    at = c.endOffset;
  }
  return at === end ? [start, end] : null;
}
/** The source range of the element itself, where it can be told (see inner()). */
function outer(el) {
  const loc = el.sourceCodeLocation;
  if (!loc?.startTag) return null;
  if (VOID.has(el.tagName)) return [loc.startTag.startOffset, loc.startTag.endOffset];
  const r = inner(el);
  if (!r) return null;
  return [loc.startTag.startOffset, loc.endTag ? loc.endTag.endOffset : r[1]];
}
// src/index.ts
/** Touchup asked at most this often per ttl, whatever hosts a request claims to be for. */
const ASKS_PER_TTL = 10;
function touchup(options) {
  const get = options.fetch ?? fetch;
  const ttl = (options.ttl ?? 5) * 1e3;
  const hosts = /* @__PURE__ */ new Map();
  let asked = {
    at: 0,
    count: 0,
  };
  /**
   * All of a host's live edits, asked for at most once per ttl whichever pages are served, so that
   * a stream of made-up query strings can't become a stream of requests to Touchup. A server that
   * answers any Host header could be sent made-up hosts as well; those are capped.
   */
  function liveEdits(host) {
    const now = Date.now();
    const cached = hosts.get(host);
    if (cached && now - cached.at < ttl) return cached.edits;
    if (now - asked.at >= ttl)
      asked = {
        at: now,
        count: 0,
      };
    if (++asked.count > ASKS_PER_TTL) return cached?.edits ?? Promise.resolve([]);
    const url = `${options.api}/api/p/${options.project}/edits?host=${encodeURIComponent(host)}`;
    const edits = get(url, {
      headers: { authorization: `Bearer ${options.key}` },
      signal: AbortSignal.timeout(options.timeout ?? 1500),
    }).then(async (res) => {
      if (!res.ok) {
        res.body?.cancel();
        throw new Error(`touchup edits ${res.status}`);
      }
      return await res.json();
    });
    const entry = {
      at: now,
      edits,
    };
    hosts.set(host, entry);
    for (const [h, e] of hosts) if (now - e.at >= ttl) hosts.delete(h);
    edits.catch(() => {
      if (hosts.get(host) === entry) hosts.delete(host);
    });
    return edits;
  }
  /** The live edits on the page at a URL, oldest first; none when Touchup can't be reached. */
  async function editsFor(url) {
    const u = new URL(url);
    const page = pageKey(u);
    try {
      return (await liveEdits(options.host ?? u.host)).filter((e) => e.page === page);
    } catch (err) {
      console.warn(err);
      return [];
    }
  }
  /** Edits applied to a page's HTML, or the HTML as it was if they can't be. */
  function edit(html, edits) {
    if (!edits.length) return html;
    try {
      return editHtml(html, edits, options);
    } catch (err) {
      console.warn(err);
      return html;
    }
  }
  /** The HTML of the page at a URL, with its live edits applied. */
  async function html(url, page) {
    const [edits, source] = await Promise.all([editsFor(url), read(page)]);
    return source.utf8 ? edit(source.text, edits) : source.text;
  }
  /**
   * A response with the page's live edits, for an HTML page answering a GET; any other response
   * as it was. A 304 can't be edited: handle() asks without the conditions instead.
   */
  async function apply(req, res, edits) {
    if (req.method !== "GET" || res.status !== 200 || !isHtml(res.headers.get("content-type")))
      return res;
    edits ??= await editsFor(req.url);
    if (!edits.length) return res;
    const page = await read(res);
    const out = page.utf8 ? edit(page.text, edits) : page.text;
    if (out === page.text) return new Response(page.bytes, res);
    const headers = new Headers(res.headers);
    for (const name of ["etag", "last-modified", "content-length", "content-encoding"])
      headers.delete(name);
    return new Response(out, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }
  /**
   * Serves a request through `next` (the site's own handler) and applies the page's edits to what
   * it answers. A page with edits is asked for without If-None-Match or If-Modified-Since, since
   * the browser's copy may be from before they were made.
   */
  async function handle(req, next) {
    if (req.method !== "GET") return next(req);
    const edits = await editsFor(req.url);
    if (!edits.length) return next(req);
    return apply(req, await next(unconditional(req)), edits);
  }
  return {
    editsFor,
    edit,
    html,
    apply,
    handle,
  };
}
/** A request without the headers that let a server answer 304. */
function unconditional(req) {
  if (!req.headers.has("if-none-match") && !req.headers.has("if-modified-since")) return req;
  const headers = new Headers(req.headers);
  headers.delete("if-none-match");
  headers.delete("if-modified-since");
  return new Request(req, { headers });
}
/** HTML in UTF-8: what the parser reads. A page in another encoding goes out as it is. */
function isHtml(type) {
  if (!type || !/^\s*text\/html\s*(;|$)/i.test(type)) return false;
  const charset = /;\s*charset\s*=\s*"?([\w-]+)/i.exec(type)?.[1];
  return !charset || /^utf-?8$/i.test(charset);
}
/**
 * A page's bytes, and its text as UTF-8. `utf8` is false for a page that says near its start that
 * it's in another encoding: its bytes go out untouched.
 */
async function read(page) {
  const bytes =
    typeof page === "string"
      ? new TextEncoder().encode(page)
      : new Uint8Array(
          await new Response(page instanceof Response ? page.body : page).arrayBuffer(),
        );
  const text = typeof page === "string" ? page : new TextDecoder().decode(bytes);
  return {
    text,
    bytes,
    utf8: declaresUtf8(text),
  };
}
/** False for a page whose meta tag, near its start, names another encoding than UTF-8. */
function declaresUtf8(html) {
  const meta = /<meta[^>]+charset\s*=\s*["']?\s*([\w-]+)/i.exec(html.slice(0, 1024))?.[1];
  return !meta || /^utf-?8$/i.test(meta);
}
export {
  unconditional as a,
  figure as c,
  touchup as i,
  image as l,
  isHtml as n,
  editHtml as o,
  read as r,
  esc as s,
  declaresUtf8 as t,
};

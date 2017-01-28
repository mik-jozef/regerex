/**
 * Regex that organizes its matches into objects.
**/

"use strict";

(() => { // Use local scope. LATER remove when modules are natively supported.
  0; // Tell Github correct number of spaces (otherwise it would use 6).

const browser = typeof window !== "undefined";

// Exported object. Assigned to a global variable in browser.  Note 'exports'
// can also exist in browser (SystemJS).
const RegeRex = typeof exports === "object" && (typeof window === "undefined"
      || exports !== window.exports) ? exports : {};

RegeRex.default = RegeRex;

browser && (window.RegeRex = RegeRex);

const startLine = Symbol("startLine")
    , endLine = Symbol("endLine")
    , startString = Symbol("startString")
    , endString = Symbol("endString")
    , startPosition = Symbol("startPosition")
    , endPosition = Symbol("endPosition")
    , wordBoundary = Symbol("wordBoundary")
    , alternationStart = Symbol("alternationStart")
    , alternationEnd = Symbol("alternationEnd")
    , assertionStart = Symbol("assertionStart")
    , assertionEnd = Symbol("assertionEnd")
    , backreference = Symbol("backreference")
    , capturingGroupStart = Symbol("capturingGroupStart")
    , capturingGroupEnd = Symbol("capturingGroupEnd")
    , conditionCheck = Symbol("conditionCheck")
    , group = Symbol("group")
    , greedyStart = Symbol("greedyStart")
    , greedyEnd = Symbol("greedyEnd")
    , possesiveStart = Symbol("possesiveStart")
    , possesiveEnd = Symbol("possesiveEnd")
    , lazyStart = Symbol("lazyStart")
    , lazyEnd = Symbol("lazyEnd")
    , subroutine = Symbol("subroutine")
    , quantifierBreak = Symbol("quantifierBreak")
    , quantifierNested = Symbol("quantifierNested")
    ;

function addProp(props, name, shallow) {
  props.every(p => p.name !== name) && props.push({ name, shallow });
}

/** (internal)
 * Returns Array of all capturing groups between 'start' and 'end' regexParts.
 */
function getProps(start, end) {
  const props = [];
  
  while (start !== end) {
    start.type === capturingGroupStart
          && addProp(props, start.name, start.shallow);
    
    if (start.type === alternationStart) {
      start.next.forEach(option => option.props.forEach(
            prop => addProp(props, prop.name, prop.shallow)));
      
      start = start.end;
    } else if ((start.type === greedyStart || start.type === possesiveStart
            || start.type === lazyStart) && start.props) {
      start.props.forEach(prop =>  addProp(props, prop.name, prop.shallow));
      
      start = start.end;
    } else start = start.next;
  }
  
  return props;
}

/** (internal)
 * Creates regexParts.
 */
function factory(what, ...rest) {
  const next = null, prev = null;
  
  switch (what) {
    case "alternation": {
      const [ preserve, optionsUnprocessed ] = rest
          , last = { type: alternationEnd, next, prev }
          , first = { type: alternationStart, end: last, next, prev }
          , options = (() => {
              const options = [], props = [];
              
              optionsUnprocessed.forEach((option) => {
                if (option.first.type === alternationStart) {
                  for (let f = 0; f < option.first.length; f++) {
                    props.push(...options.first.next[f].props);
                    
                    options.push({ first: options.first.next[f].regexPart,
                          last: options.last.prev[f].regexPart, matchable: true });
                  }
                } else options.push(option);
              });
              
              if (props.length > 0) {
                const optionWithProps = factory("quantifier", lazyStart,
                      lazyEnd, 0, 1, factory("group", []), true);
                
                optionWithProps.props = props;
                optionWithProps.matchable = false;
                
                options.push(optionWithProps);
              }
              
              return options;
            })()
          , optionsFiltered = options.filter(option => option.matchable)
          , props = []
          ;
      
      options.forEach(option => (option.props = getProps(option.first,
            option.last)).forEach(prop => addProp(props, prop.name, prop.shallow)));
      
      optionsFiltered.forEach(option => option.props =
            props.filter(prop => option.props.every(p => p.name !== prop.name)));
      
      if (optionsFiltered.length === 1 && optionsFiltered[0].props.length === 0
              && !preserve) return optionsFiltered[0];
      
      optionsFiltered.forEach(option =>
            (option.first.prev = first, option.last.next = last));
      
      first.next = optionsFiltered.map(option =>
            ({ props: option.props, regexPart: option.first }));
      
      last.prev = optionsFiltered.map(option =>
            ({ props: option.props, regexPart: option.last }));
      
      return { first, last, matchable: optionsFiltered.length !== 0 };
    }
    case "assertion": {
      const [ name, dimensions, condition, then, thenNot ] = rest
          , first =
            { type: assertionStart, name, dimensions, condition
            , then: then.first, thenNot: thenNot.first, prev }
          , last =
            { type: assertionEnd, name, dimensions, condition
            , then: then.last, thenNot: thenNot.last, next }
          ;
      
      then.first.prev = first; thenNot.first.prev = first;
      then.last.next = last; thenNot.last.next = last;
      
      return { first, last , matchable: then.matchable || thenNot.matchable };
    }
    case "backreference": {
      const [ name, dimensions, ] = rest
          , backref = { type: backreference, name, dimensions, next, prev }
          ;
      
      return { first: backref, last: backref, matchable: true };
    }
    case "captrGroup": {
      const [ name, shallow, content ] = rest
          , objName = content.first.type === subroutine ? content.first.name : null
          , first = { type: capturingGroupStart, name, objName,
                  shallow, next: content.first, prev }
          , last = { type: capturingGroupEnd,
                  next: null, prev: content.last }
          ;
      
      if (name === "loc" || name === "input" || name === "name")
            throw new Error("Capturing group cannot be named \"" + name + "\".");
      
      content.first.prev = first;
      content.last.next = last;
      
      return { first, last, matchable: content.matchable };
    }
    case "group": {
      const [ arr ] = rest, obj = { type: group, arr, next, prev };
      
      return { first: obj, last: obj, matchable: true}; // TODO Check for unmatchable groups (eg. a|b) and remove always-matching symbols.
    }
    case "lookahead": {
      const [condition, then, thenNot, lookbehind] = rest
          , cndCheck =
            { type: conditionCheck, condition, negated: false, lookbehind, next, prev }
          , cndCheckNegated =
            { type: conditionCheck, condition, negated: true, lookbehind, next, prev }
          ;
      
      if (lookbehind) {
        cndCheck.next = then.first; then.first.prev = cndCheck;
        cndCheckNegated.next = thenNot.first; thenNot.first.prev = cndCheckNegated;
        
        return factory("alternative", false, false,
              [ { first: cndCheck, last: then.last
                , matchable: condition.matchable && then.matchable }
              , { first: cndCheckNegated, last: thenNot.last
                , matchable: thenNot.matchable }
              ]);
      } else {
        then.last.next = cndCheck; cndCheck.prev = then.last;
        thenNot.last.next = cndCheckNegated; cndCheckNegated.prev = thenNot.last;
        
        return factory("alternative", false, false,
              [ { first: then.first, last: cndCheck
                , matchable: then.matchable && condition.matchable }
              , { first: thenNot.first, last: cndCheckNegated
                , matchable: thenNot.matchable }
              ]);
      }
    }
    case "subroutine": {
      const [ name ] = rest, subr = { type: subroutine, name, next, prev };
      
      return { first: subr, last: subr, matchable: true };
    }
    case "quantifier": {
      const [ qTypeStart, qTypeEnd, min, max, content, special ] = rest
          , props = getProps(content.first, content.last)
          , first =
            { type: qTypeStart, min, max, props, special
            , end: null, next: content.first, prev }
          , last =
            { type: qTypeEnd, min, max, props, special
            , start: first, next, prev: content.last }
          ;
      
      first.end = last;
      content.first.prev = first;
      content.last.next = last;
      
      return { first, last, matchable: content.matchable };
    }
  }
}

/** (internal)
 * Converts escape sequences to what they represent or undefined if 'ch' is not
 * an escape character.
 * 
 * :Params
 * ch string: escape character.
 * 
 * :Returns Object | undefined
 */
function escapedChar(ch) {
  const next = null, prev = null, upperCase = ch.toUpperCase() === ch;
  
  switch (ch) {
    case "d": 
    case "D": return { min: "0", max: "9", negated: uppercase };
    case "w": {
      return factory("alternation", false,
            [ factory("group", [ "_" ])
            , factory("group", [ { min: "a", max: "z", negated: false } ])
            , factory("group", [ { min: "A", max: "Z", negated: false } ])
            , factory("group", [ { min: "0", max: "9", negated: false } ])
            ]);
    }
    case "W": {
      return (
        [ "_", { min: "a", max: "z", negated: false }
        , { min: "A", max: "Z", negated: false }
        , { min: "0", max: "9", negated: false } ]);
    }
    case "s": {
      return factory("alternation", false,
            [ factory("group", [ "\n" ])
            , factory("group", [ "\r" ])
            , factory("group", [ "\t" ])
            , factory("group", [ "\u0020" ])
            , factory("group", [ "\u00a0" ])
            , factory("group", [ "\u1680" ])
            , factory("group", [ "\u180e" ])
            , factory("group",
                    [ { min: "\u8192", max: "\u8202", negated: false } ])
            , factory("group", [ "\u2028" ])
            , factory("group", [ "\u2029" ])
            , factory("group", [ "\u202f" ])
            , factory("group", [ "\u205f" ])
            , factory("group", [ "\u3000" ])
            , factory("group", [ "\ufeff" ])
            ]);
    }
    case "S": {
      return (
        [ "\n", "\r", "\t", "\u00a0", "\u1680", "\u180e"
        , { min: "\u8192", max: "\u8202", negated: false }
        , "\u2028", "\u2029", "\u202f", "\u205f", "\u3000", "\ufeff" ]);
    }
    case "l": {
      return factory("alternation", false,
            [ factory("group", [ "\n" ])
            , factory("group", [ "\r" ])
            , factory("group", [ "\u2028" ])
            , factory("group", [ "\u2029" ])
            ]);
    }
    case "L": return [ "\n", "\r", "\t", "\u2028", "\u2029" ];
    case "n": return "\n";
    case "N": return { min: "\n", max: "\n", negated: true };
    case "r": return "\r";
    case "R": return { min: "\r", max: "\r", negated: true };
    case "t": return "\t";
    case "T": return { min: "\t", max: "\t", negated: true };
    case "a": return startString;
    case "z": return endString;
    case "`": return startPosition;
    case "'": return endPosition;
    default: return null;
  }
}

escapedChar.l = new Set(["\n", "\r", "\u2028", "\u2029"]);

/** (internal)
 * Characters that can be prefixed with a backslash.
 */
const specialChars = new Set(["[", "]", "(", ")",
      "^", "$", "|", "\\", "*", "+", "?", "{", "}"]);

/**
 * Group of regexes. Regexes in the same group are able to reference each other.
 * 
 * :Constructor
 * name string: name of this regex group and also name of the default regex.
 * trackLines boolean: also track current position in number of lines and columns.
 * 
 * :Fields
 * regexMap Map: map of all regexes in this group, their name is the key.
 * name string: name of this regex group and also name of the default regex.
 * trackLines boolean: also track current position in number of lines and columns.
 */
const RegexGroup = RegeRex.RegexGroup = class RegexGroup {
  constructor(name, trackLines = false) {
    if (typeof name !== "string") throw new Error("Name must be a string");
    
    this.regexMap = new Map();
    this.name = name;
    this.trackLines = !!trackLines;
  }
  
  /**
   * Adds 'regex' to this group.
   * 
   * :Params
   * regex string | Regex: regex to add to this group.
   * 
   * :Returns this
   */
  add(regex) {
    typeof regex === "string" && (regex = new Regex(regex));
    
    if (!(regex instanceof Regex)) throw new Error("Argument regex must be "
          + "a string or an instance of Regex.");
    
    if (this.regexMap.has(regex.name))
          throw new Error("Regex \"" + regex.name + "\" already exists.");
    
    this.regexMap.set(regex.name, regex);
    
    return this;
  }
  
  /**
   * Match string 'str' with 'regex'.
   * 
   * :Params
   * str string: string to match.
   * (regex string): optional if this group contains default regex.
   * (start number): where to start matching.
   * (end number): where to end matching.
   * (trackLines boolean): also track current position in number of lines and
   *   columns.
   * 
   * :Returns Object | null
   * Match or null if the string doesn't match, see documentation.
   */
  match(str, start = 0, end = str.length, trackLines = this.trackLines) {
    arguments.length === 2 && typeof start === "boolean"
          && (trackLines = start, start = 0);
    
    arguments.length === 3 && typeof end === "boolean"
          && (trackLines = end, end = str.length);
    
    if (typeof str !== "string")
          throw new Error("Parameter 'str' must be a string.");
    
    if (typeof start !== "number" || start % 1 !== 0 || start < 0)
          throw new Error("Invalid parameter 'start'.");
    
    if (typeof end !== "number" || end % 1 !== 0)
          throw new Error("Invalid parameter 'start'.");
    
    if (start > str.length) return null;
    if (end > str.length) end = str.length;
    trackLines = !!trackLines;
    
    const subroutineOpenStack = []
        , subroutineClosedStack = []
        , regexMap = this.regexMap
        ;
    
    let strLowerCase = null, strOrig = str, line = 0, column = 0;
    
    function last(what) {
      switch (what) {
        case "subroutine": {
          if (subroutineOpenStack.length === 0) return null;
          
          return subroutineOpenStack[subroutineOpenStack.length - 1];
        }
        case "quantifier": {
          const lastSubroutine = last("subroutine");
          
          if (lastSubroutine === null) return null;
          
          const qStack = lastSubroutine.quantifierOpenStack;
          
          return qStack.length === 0 ? null : qStack[qStack.length - 1];
        }
        case "captrGroup": {
          const lastQuantifier = last("quantifier");
          
          if (lastQuantifier === null) return null;
          
          const cStack = lastQuantifier.captrGroupOpenStack;
          
          return cStack.length === 0 ? null : cStack[cStack.length - 1];
        }
      }
    }
    
    function finishOne(what, reverse = false) {
      switch (what) {
        case "subroutine": {
          if (reverse) {
            const subroutine = subroutineClosedStack.pop();
            
            return subroutineOpenStack.push(subroutine), subroutine;
          }
          
          const subroutine = subroutineOpenStack.pop();
          
          return subroutineClosedStack.push(subroutine), subroutine;
        }
        case "quantifier": {
          const lastSub = last("subroutine");
          
          if (reverse) {
            const quantifier = lastSub.quantifierClosedStack.pop();
            
            return lastSub.quantifierOpenStack.push(quantifier), quantifier;
          }
          
          const quantifier = lastSub.quantifierOpenStack.pop();
          
          return lastSub.quantifierClosedStack.push(quantifier), quantifier;
        }
        case "captrGroup": {
          const lastQ = last("quantifier");
          
          if (reverse) {
            const captrGroup = lastQ.captrGroupClosedStack.pop();
            
            return lastQ.captrGroupOpenStack.push(captrGroup), captrGroup;
          }
          
          const captrGroup = lastQ.captrGroupOpenStack.pop();
          
          return lastQ.captrGroupClosedStack.push(captrGroup), captrGroup;
        }
      }
    }
    
    function addOne(what, ...rest) {
      switch (what) {
        case "quantifier": {
          let lastQ = last(what);
          
          if (rest.length === 0) {
            lastQ.end === 0 && (last("subroutine").quantifierOpenStack.pop(),
                  lastQ = last(what));
            
            return lastQ && lastQ.captrGroupClosedStack.pop(), lastQ;
          } else {
            lastQ && lastQ.captrGroupClosedStack.push(lastQ.start === lastQ.end
                  ? quantifierBreak : quantifierNested);
            
            if (!lastQ || lastQ.start !== lastQ.end) {
              const [ props, special, start, end ] = rest, lastSub = last("subroutine");
              
              lastSub.quantifierOpenStack.push(lastQ =
                    { captrGroupOpenStack: [], captrGroupClosedStack: []
                    , start, end, props, special, flag: true
                    , depth: lastSub.quantifierOpenStack.length });
            }
            
            return lastQ;
          }
        }
        case "captrGroup": {
          const lastQuantifier = last("quantifier");
          
          if (rest.length === 0) return lastQuantifier.captrGroupOpenStack.pop();
          
          const [ name, objName, shallow, posStart ] = rest
              , lastC = { name , objName, shallow, posStart, posEnd: 0 }
              ;
          
          return lastQuantifier.captrGroupOpenStack.push(lastC), lastC;
        }
      }
    }
    
    if (!this.regexMap.has(this.name)) throw new Error("Default regex is "
          + "required to start matching");
    
    if (trackLines) {
      for (let f = 0; f < start; f++) {
        column++;
        
        if (escapedChar.l.has(str.charAt(f))) {
          column = 0;
          line++;
        }
      }
    }
    
    while (start < end) {
      const obj = matchRegexPart(start, line, column,
            this.regexMap.get(this.name).parsed.subroutine);
      
      if (obj) return obj;
      
      column++;
      
      if (escapedChar.l.has(str.charAt(start++))) {
        column = 0;
        line++;
      }
    }
    
    return null;
    
    function matchRegexPart(pos, line, column, regexPart) {
      if (regexPart === null) {
        if (last("subroutine") === null) {
          const depthArr = [ [] ];
          
          let lastDepth = 0;
          
          // Transforms 'subroutineClosedStack' to tree of subroutines as they
          // appear in regex.
          subroutineClosedStack.forEach((sub) => {
            if (sub.depth === lastDepth) {
              depthArr[lastDepth].push({ sub, children: [] });
            } else if (sub.depth < lastDepth) {
              depthArr[sub.depth].push({ sub, children: depthArr[lastDepth] });
              
              depthArr[lastDepth] = [];
            } else {
              while (depthArr.length <= sub.depth) depthArr.push([]);
              
              depthArr[sub.depth].push({ sub, children: [] });
            }
            
            lastDepth = sub.depth;
          });
          
          return constructObj(depthArr[0][0]);
          
          function constructObj({ sub, children }) {
            const depthArr = [ { props: [], qIndex: 0 } ];
            
            let lastDepth = 0, childrenIndex = 0;
            
            sub.quantifierClosedStack.forEach((qItem) => {
              const props = {}, propUsed = {};
              
              qItem.props.forEach((prop) => {
                if (prop.shallow) return (prop.name in sub.retObj
                      || (sub.retObj[prop.name] = []));
                
                propUsed[prop.name] = 0;
                props[prop.name] = qItem.special ? null : [];
              });
              
              function addValue(name, value) {
                const prop = props[name];
                
                switch (propUsed[name]) {
                  case 0: {
                    qItem.special ? props[name] = value : prop.push(value); break;
                  }
                  case 1: {
                    if (qItem.special) {
                      props[name] = [ props[name], value ];
                    } else prop[prop.length - 1] =
                          [ prop[prop.length - 1], value ];
                    
                    break;
                  }
                  default: {
                    qItem.special ? prop.push(value)
                          : prop[prop.length - 1].push(value); break;
                  }
                }
                
                propUsed[name]++;
              }
              
              qItem.captrGroupClosedStack.forEach((captrGroup) => {
                if (captrGroup === quantifierBreak) {
                  return qItem.props.forEach(prop => propUsed[prop.name] = 0);
                } else if (captrGroup === quantifierNested) {
                  const nestedProps =
                        depthArr[lastDepth].props[depthArr[lastDepth].qIndex++];
                  
                  return Object.keys(nestedProps).forEach(
                        key => addValue(key, nestedProps[key]));
                }
                
                const { name, objName, shallow, posStart, posEnd } = captrGroup
                    , value = (() => {
                        if (objName === null)
                              return strOrig.substring(posStart, posEnd);
                        
                        while (children[childrenIndex].sub.retObj.name !== objName)
                              childrenIndex++;
                        
                        return constructObj(children[childrenIndex++]);
                      })()
                    ;
                
                if (shallow) return (name in sub.retObj
                      ? sub.retObj[name].push(value) : sub.retObj[name] = [ value ]);
                
                addValue(name, value);
              });
              
              if (lastDepth === qItem.depth) {
                depthArr[lastDepth].props.push(props);
              } else if (lastDepth > qItem.depth) {
                depthArr[lastDepth] = { props: [], qIndex: 0 };
                depthArr[qItem.depth].props.push(props);
              } else if (lastDepth < qItem.depth) {
                while (depthArr.length <= qItem.depth)
                      depthArr.push({ props: [], qIndex: 0 });
                
                depthArr[qItem.depth].props.push(props);
              }
              
              lastDepth = qItem.depth;
            });
            
            return Object.assign(depthArr[0].props[0], sub.retObj);
          }
        }
        
        const { retObj: obj, next } = finishOne("subroutine")
            , lastSub = last("subroutine")
            , strBefore = str
            ;
        
        let loc = obj.loc.end;
        loc.pos = (trackLines && (loc.line = line, loc.column = column), pos);
        
        str = (lastSub && lastSub.ignoreCase) ? strLowerCase : strOrig;
        
        const retObj = matchRegexPart(pos, line, column, next);
        
        return retObj || (finishOne("subroutine", true), str = strBefore), retObj;
      }
      
      regexPart.type === assertionEnd && (regexPart = regexPart.next);
      
      switch (regexPart.type) {
        case assertionStart: throw new Error("Not implemented yet, see issue #1.") // TODO match assertion
        case alternationStart: {
          for (let f = 0; f < regexPart.next.length; f++) {
            addOne("quantifier", regexPart.next[f].props, true, 1, 0)
            
            const retObj = matchRegexPart(pos, line, column,
                  regexPart.next[f].regexPart);
            
            if (retObj) return retObj; else addOne("quantifier");
          }
          
          return null;
        }
        case alternationEnd: {
          finishOne("quantifier");
          
          const retObj = matchRegexPart(pos, line, column, regexPart.next);
          
          return retObj || finishOne("quantifier", true), retObj;
        }
        case backreference: throw new Error("Not implemented yet, see issue # 2."); // TODO match backreference
        case capturingGroupStart: {
          addOne("captrGroup", regexPart.name, regexPart.objName,
                regexPart.shallow, pos);
          
          const retObj = matchRegexPart(pos, line, column, regexPart.next);
          
          return retObj || addOne("captrGroup"), retObj;
        }
        case capturingGroupEnd: {
          finishOne("captrGroup").posEnd = pos;
          
          const retObj = matchRegexPart(pos, line, column, regexPart.next);
          
          return retObj || finishOne("captrGroup", true), retObj;
        }
        case conditionCheck: {
          const obj = condition.lookbehind
                      ? matchRegexPart(pos, line, column, regexPart.condition)
                      : matchBackwards(pos, line, column, regexPart.condition);
          
          return ((regexPart.negated ? !obj : !!obj)
                ? matchRegexPart(pos, line, column, regexPart.next) : null);
        }
        case greedyStart:
        case possesiveStart:
        case lazyStart: {
          let qItem = addOne("quantifier",
                regexPart.props, regexPart.special, 0, 0);
          
          const retObj = (regexPart.type === lazyStart)
                ? matchEnd() || matchNext()
                : matchNext() || matchEnd();
          
          return retObj || addOne("quantifier"), retObj;
          
          function matchNext() {
            if (qItem.start < regexPart.max) {
              qItem.start++;
              
              const retObj = matchRegexPart(pos, line, column, regexPart.next);
              
              return retObj || qItem.start--, retObj;
            } else return null;
          }
          
          function matchEnd() {
            if ((regexPart.type !== possesiveStart || qItem.flag)
                    && qItem.start >= regexPart.min) {
              qItem.flag = false;
              
              finishOne("quantifier");
              
              const retObj = matchRegexPart(pos, line, column, regexPart.end.next);
              
              return retObj || finishOne("quantifier", true), retObj;
            } else return null;
          }
        }
        case greedyEnd:
        case possesiveEnd:
        case lazyEnd: {
          const qItem = last("quantifier");
          
          qItem.end++;
          
          const retObj = matchRegexPart(pos, line, column, regexPart.start);
          
          return retObj || qItem.end--, retObj;
        }
        case group: {
          let chPrev, ch = pos > 0 ? str.charAt(pos - 1) : null;
          
          return regexPart.arr.every((groupPart) => {
            chPrev = ch;
            ch = str.charAt(pos++);
            
            if (typeof groupPart === "symbol") {
              let boundaryMatches;
              
              switch (groupPart) {
                case startLine: boundaryMatches = escapedChar.l.has(chPrev); break;
                case endLine: boundaryMatches = escapedChar.l.has(ch); break;
                case startString: boundaryMatches = pos === 1; break;
                case endString: boundaryMatches = pos === str.length; break;
                case startPosition: boundaryMatches = pos === start + 1; break;
                case endPosition: boundaryMatches = pos === end; break;
                case wordBoundary: throw new Error("Not implemented yet, see issue #3."); // TODO word boundary
              }
              
              return boundaryMatches ? (pos--, ch = chPrev, true) : false;
            }
            
            if (pos > end) return false;
            
            escapedChar.l.has(ch) ? (line++, column = 0) : column++;
            
            if (typeof groupPart === "object") {
              let chInsideBounds = groupPart.min <= ch && ch <= groupPart.max;
              
              return groupPart.negated ? !chInsideBounds : chInsideBounds;
            }
            
            if (groupPart instanceof Array) {
              return groupPart.every((notHere) => {
                if (typeof notHere === "string") return notHere !== ch;
                
                const matches = ch < notHere.min || ch > notHere.max;
                
                return notHere.negated ? !matches : matches;
              });
            }
            
            return ch === groupPart;
          }) ? matchRegexPart(pos, line, column, regexPart.next) : null;
        }
        case subroutine: {
            const regex = regexMap.get(regexPart.name)
                , stackItem =
                  { retObj:
                    { input: strOrig
                    , loc:
                      { start:
                        { pos: null
                        , line: null
                        , column: null
                        }
                      , end:
                        { pos: null
                        , line: null
                        , column: null
                        }
                      }
                    , name: regex.name
                    }
                  , quantifierOpenStack: []
                  , quantifierClosedStack: []
                  , ignoreCase: regex.ignoreCase
                  , next: regexPart.next
                  , depth: subroutineOpenStack.length
                  }
                ;
          
          subroutineOpenStack.push(stackItem);
          
          let loc = stackItem.retObj.loc.start;
          loc.pos = (trackLines && (loc.line = line, loc.column = column), pos);
          
          regex.ignoreCase && strLowerCase === null
                && (strLowerCase = str.toLowerCase());
          
          str = regex.ignoreCase ? strLowerCase : strOrig;
          
          const retObj = matchRegexPart(pos, line, column, regex.parsed.first);
          
          return retObj || subroutineOpenStack.pop(), retObj;
        }
      }
    }
  }
  
  /**
   * TODO how should replacing work, actually?. maybe 'replace' (or 'reconstruct')
   * should be a method  of the object returned by match(), that uses values from
   * that object?
   */
  replace(str, options, start, end) {
    throw new Error("Not implemented yet.");
  }
  
  /**
   * Generator. Yields matches.
   */
  *matchAll(str, start, end, trackLines = this.trackLines) {
    let match = null;
    
    while (match = this.match(str, start, end, trackLines)) {
      yield match;
      
      start = match.loc.end.pos;
    }
    
    return match;
  }
}

/**
 * Regex.
 * 
 * :Constructor
 * str string: regex.
 * 
 * :Fields
 * name string: name of this regex.
 * ignoreCase boolean: ignore letter case if true.
 * parsed Object: (private) parsed regex.
 *   first Object: first part of this regex.
 *   last Object: last part of this regex.
 */
const Regex = RegeRex.Regex = class Regex {
  constructor(str) {
    let pos = 0, ch; // Position and current character.
    
    // Parse start of regex.
    const colonPos = str.indexOf(":");
    
    if (colonPos === -1) throw new Error("Regexp must contain a colon.");
    
    let ignoreCase = this.ignoreCase =
          !!(str.substring(0,2) === "i|" && (pos += 2));
    this.name = str.substring(pos, colonPos);
    
    pos = colonPos + 1;
    
    this.ignoreCase && (str = str.toLowerCase());
    
    // Parse the rest
    this.parsed = factory("quantifier",
          greedyStart, greedyEnd, 1, 1, parse(""), true);
    
    this.parsed.subroutine = factory("subroutine", this.name).first;
    
    function parse(endChar, justOnePart = false) {
      const next = null, prev = null, captrGroups = new Map();
      
      let firstParsed = null, lastParsed = null, matchable = true;
      
      function getName(endChars) {
        let name = "";
        
        while ((ch = str.charAt(pos++)).match(/[A-Za-z_]/)) {
          name += ch;
        }
        
        if (!endChars.includes(ch) || name === "") {
          throw new Error((ch === "") ? "Unexpected end of string."
                : (pos - 1) + ": Invalid character:" + ch);
        }
        
        return name;
      }
      
      /// Unline getName, can return null, useful for quantifier "{n,}".
      function getNumber(endChars) {
        let number = null, negative = false;
        
        if (str.charAt(pos) === "-") {
          negative = true;
          pos++;
        }
        
        while ((ch = str.charAt(pos++)).match(/\d/)) {
          number = (number === null) ? +ch : +ch + 10 * number;
        }
        
        if (!endChars.includes(ch) || negative && number === null) {
          throw new Error((ch === "") ? "Unexpected end of string."
                : (pos - 1) + ": Invalid character:" + ch);
        }
        
        if (negative  && number === 0) throw new Error("Zero cannot be negative");
        
        return negative ? -1 * number : number;
      }
      
      while (ch = str.charAt(pos++)) {
        let regexPart;
        
        switch (ch) {
          case "^": regexPart = startLine; break;
          case "$": regexPart = endLine; break;
          case "|": regexPart = wordBoundary; break;
          case "\\": {
            ch = str.charAt(pos++);
            
            if (ch === "") throw new Error("Unexpected end of string.");
            
            if (regexPart = escapedChar(ch)
                  || ((specialChars.has(ch) || endChar.includes(ch))
                  && (regexPart = ch))) break;
            
            switch (ch) {
              case "u": {
                const substring = str.substring(pos, pos + 3)
                    , match = substring.match(/\{([0-9a-f]{4,5})\}/)
                    ;
                
                if (!match) throw new Error(pos + ": Invalid escape sequance.");
                
                regexPart = String.fromCharCode(parseInt(match[1], 16));
                
                break;
              }
              case "p":
              case "x":
              default: throw new Error((pos - 1)
                    + ": Unknown escape character: " + ch);
            }
            break;
          }
          case ")":
          case "]":
          case "}":
          case ":":
          case "<":
          case ">": {
            if (endChar.includes(ch)) {
              firstParsed || (firstParsed = lastParsed =
                    { type: group, arr: [], next, prev});
              
              return { first: firstParsed, last: lastParsed, matchable };
            } else if (")]}".includes(ch)) throw new Error((pos - 1)
                  + ": Unmatched brace/bracket/parenthesis.");
            
            regexPart = ch;
            
            break;
          }
          case "*":
          case "+":
          case "?":
          case "{": throw new Error((pos - 1)
                + "Unescaped special character: " + ch);
          default: regexPart = ignoreCase ? ch.toLowerCase() : ch; break;
          case "(": {
            ch = str.charAt(pos++);
            
            if (!ch) throw new Error("Unexpected end of string.");
            
            switch (ch) {
              default: pos--, regexPart = parse(")"); break;
              case "=": {
                const name = getName(")["), dimensions = [];
                
                while (ch === "[") {
                  let number = getNumber("]")
                  
                  ch = str.charAt(pos++);
                  
                  dimensions.push(number);
                }
                
                if (ch !== ")") throw new Error((pos - 1)
                        + ": Invalid character: " + ch);
                
                regexPart = factory("backreference", name, dimensions);
                
                break;
              }
              case ":": {
                const name = getName(":.)"), shallow = ch === ".";
                
                if (regexPart = (ch === ")")) {
                  regexPart = factory("subroutine", name); 
                }else {
                  if (captrGroups.has(name)) {
                    if (captrGroups.get(name) !== shallow)
                          throw new Error("Capturing groups with the same "
                          + "name cannot be both shallow and normal");
                  } else captrGroups.set(name, shallow);
                  
                  regexPart = factory("captrGroup", name, shallow, parse(")"));
                }
                
                break;
              }
              case "?": {
                const part1 = parse(":>");
                
                let condition, then, thenNot, lookbehind = false;
                
                if (ch === ">") {
                  condition = part1.last; then = parse(":"); thenNot = parse(")");
                  lookbehind = true;
                } else {
                  then = part1; thenNot = parse("<"); condition = parse(")").first;
                }
                
                regexPart =
                      factory("lookahead", condition, then, thenNot, lookbehind);
                
                break;
              }
              case "|": {
                const name = getName("[=>")
                    , dimensions = []
                    ;
                
                while (ch === "[") {
                  const num = getNumber("]");
                  
                  if (num === null)
                        throw new Error((pos - 1) + "Invalid character: ]");
                  
                  dimensions.push(num);
                  
                  ch = str.charAt(pos++);
                }
                
                const condition = (ch === "=") ? parse(">").first : null
                    , then = parse(":")
                    , thenNot = parse(")")
                    ;
                
                regexPart = factory("assertion", name,
                      dimensions, condition, then, thenNot);
                
                break;
              }
            }
            
            break;
          }
          case "[": {
            const match = str.substring(pos, pos + 5)
                  .match(/^(\^?)-([^]?)([^]?)([^]?)/); // Match character class
            
            if (match) {
              let [ , negated, min, max, end] = match;
              
              if (end === "") throw new Error("Unexpected end of string.");
              if (end !== "]") throw new Error((pos + (negated ? 4 : 3))
                    + ": Unexpected character: " + end);
              
              if (min === max) {
                regexPart = min;
                
                break;
              }
              
              if (min > max) [ min, max ] = [ max, min ];
              
              regexPart = { min, max, negated: !!negated };
              
              pos += negated ? 5 : 4;
            } else {
              const negated = str.charAt(pos) === "^" && (pos++, true)
                  , options = []
                  , set = negated && new Set();
              
              let option;
              
              while (option = parse("]", true), !(option.first.type === group
                    && option.first.arr.length === 0)) {
                if (negated) {
                  if (option.first.type !== group
                        || option.first.arr.some((item) => {
                          set.add(item);
                          
                          return typeof item === "symbol";
                        })) throw new Error((pos - 1) + ": Negated alternation "
                        + "can only contain characters, character classes and "
                        + "negated alternations.");
                } else options.push(option);
              }
              
              regexPart = negated ? Array.from(set) : factory("alternation",
                    lastParsed && lastParsed.type === capturingGroupStart,
                    options);
            }
            
            break;
          }
        }
        
        ch = str.charAt(pos++);
        
        let boundaries, special = false;
        
        switch (ch) {
          default: pos--; break;
          case "?": boundaries = [0, 1]; special = true; break;
          case "*": boundaries = [0, Infinity]; break;
          case "+": boundaries = [1, Infinity]; break;
          case "{": {
            const min = getNumber("},");
            
            if (!min) throw new Error((pos - 1) + ": Empty quantifier: {}");
            
            boundaries = [min, (ch === ",") ? getNumber("}") : min];
            
            boundaries[1] === null && (boundaries[1] = Infinity);
            
            if (boundaries.length > 0
                  && (boundaries[0] < 0 || boundaries[1] < boundaries[0])) {
              throw new Error((pos - 1)
                    + ": Quantifier with negative or swapped boundaries.");
            }
          }
        }
        
        if (boundaries) {
          ch = str.charAt(pos++);
          
          let startType, endType;
          
          switch (ch) {
            default: pos--; startType = greedyStart; endType = greedyEnd; break;
            case "+": startType = possesiveStart; endType = possesiveEnd; break;
            case "?": startType = lazyStart; endType = lazyEnd; break;
          }
          
          if (!matchable) continue;
          
          (typeof regexPart !== "object" || !("first" in regexPart))
                && (regexPart = factory("group", [ regexPart ]));
          
          if (!regexPart.matchable) {
            if (boundaries[0] === 0) continue; else {
              ({ first: firstParsed, last: lastParsed, matchable } =
                    factory("alternation", false, []));
              
              continue;
            }
          }
          
          regexPart = factory("quantifier",
                startType, endType, ...boundaries, regexPart, special);
        }
        
        if (typeof regexPart !== "object" || !("first" in regexPart)) {
          if (lastParsed && lastParsed.type === group) {
            lastParsed.arr.push(regexPart);
            
            continue;
          } else regexPart = factory("group", [ regexPart ]);
        }
        
        if (justOnePart) return regexPart;
        
        regexPart.first.prev = lastParsed;
        lastParsed && (lastParsed.next = regexPart.first);
        
        firstParsed || (firstParsed = regexPart.first);
        lastParsed = regexPart.last;
      }
      
      if (endChar) throw new Error("Unexpected end of string; expected one of: \""
            + endChar + "\".");
      
      firstParsed || (firstParsed = lastParsed =
            { type: group, arr: [], next, prev});
      
      return { first: firstParsed, last: lastParsed, matchable, subroutine: null };
    };
  }
}

})(); // End of local scope. LATER remove when modules are natively supported.
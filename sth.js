class RegeRexStringBuilder {
  constructor(str) {
    // TODO RegeRexStringBuilder constructor
  }
  
  insert(str) {
    // TODO RegeRexStringBuilder insert
  }
  
  remove(index, length) {
    // TODO RegeRexStringBuilder remove
  }
  
  charAt(index) {
    // TODO RegeRexStringBuilder charAt
  }
  
  toString() {
    // TODO RegeRexStringBuilder toString
  }
  
  get length() {
  
  }
}

class Regex {
  const refs = new Set();
  
  let name;
  let regex;
  
  constructor() {
    // TODO Regex constructor
  }
  
  static compile() {
    // TODO Regex compile
  }
}

class RegexGroup {
  const regexes = new Map();
  
  constructor(regexes) {
    for (let regex of regexes) {
      if (!(regex.prototype instanceof Regex)) {
        throw new Error("Argument 'regexes' must be an iterable of Regex subclasses.");
      }
      
      regex.compile();
      
      this.regexes.set(regex.name, regex);
    }
    
    for (let regex of this.regexes) {
      for (let ref of regex.refs) {
        if (!this.regexes.has(ref)) throw new Error("Regex " + regex.name
              + "references unknown regex " + ref + ".");
      }
    }
  }
  
  match(str, regex) {
    if (typeof str != "string") throw new Error("Argument 'str' must be a string");
    if (typeof str != "string") throw new Error("Argument 'str' must be a string");
  }
}
function parse(str) {
  const group = new RegexGroup("regex");
  
  // TODO convert to already parsed regexes
  group.add("regex:\\a(:flag:(i\\|)?+)(:nameStr:(:name)):(:parsed:(:parsed))*\\z");
  group.add("name:(:nameStr:[[-AZ][-az]][[-AZ][-az][-09]_]*+)");
  group.add("character:(:char:[^\\^\\$\\|\\\\\\*\\+\\?\\{\\}\\[\\]\\(\\):><])");
  group.add("specialChar:(:char:[\\^\\$\\|\\\\\\*\\+\\?\\{\\}\\[\\]\\(\\):><])");
  group.add("reference:(:nameStr:(:name))(\\[(:dimensions:\\d+)\\])*");
  group.add("parsed:[(:parsed:(:characterClass))(:parsed:(:alternation))(:parsed:(:negatedAlternation))(:parsed:(:assertion))(:parsed:(:backreference))(:parsed:(:boundary))(:parsed:(:captrGroup))(:parsed:(:escapeSequence))(:parsed:(:sequence))(:parsed:(:lookaround))(:parsed:(:subroutine))(:parsed:()(:character))](:quantifier:(:quantifier))?");
  group.add("alternation:\\[(:contents:(:parsed))*\\]"); // LATER lookahead to see if this is not a characterClass
  group.add("negatedAlternation:\\[^[(:contents:(:character))(:contents:(:characterClass))(:contents:(:negatedAlternation))]*\\]");
  group.add("assertion:\\(\\|(:reference:(:reference))([=](:condition:(:parsed))+)?>(:then:(:parsed))*:(:thenNot:(:parsed))*\\)");
  group.add("backreference:\\(=(:reference:(:reference))\\)");
  group.add("boundary:(:boundary:[\\^\\$\\|(\\\\a)(\\\\z)(\\\\`)(\\\\')])");
  group.add("captrGroup:\\((:hidden:[:.])(:nameStr:(:name))(:shallow:[:.])[(:subroutine:(:subroutine))(:contents:(:parsed))*]\\)");
  group.add("characterClass:\\[(:negated:^)?-[(:first:(:escapeChar))(:first:(:character))][(:second:(:escapeChar))(:second:(:character))]\\]");
  group.add("escapeSequence:[(:escapeSequence:(:escapeChar))(:escapeSequence:(:escapeRegexPart))]");
  group.add("escapeChar:\\\\(:escapeChar:[nrt(u\\{(:hex:[\d[-af]]{4,5})\\})(:specialChar)])");
  group.add("escapeRegexPart:\\\\(:escapeRegexPart:[dwslDWSLNRT])");
  group.add("sequence:\\((:contents:(:parsed))*\\)");
  group.add("lookaround:\\(\\?[((:then:(:parsed)):(:thenNot:(:parsed))(:conditionLookahead:(:parsed)))((:conditionLookbehind:(:parsed))(:then:(:parsed))(:thenNot:(:parsed)))]\\)");
  group.add("subroutine:\\((:nameStr:(:name))\\)");
  group.add("quantifier:(:boundaries:[\\?\\*\\+(\\{(:min:\d+)((:comma:,)(:max:\d+)?)?\\})])(:type:[\\?\\+]?)");
  
  const regex = group.match(str)
      , name = regex.name
      , ignoreCase = !!regex.flag
      ;
  
  const parsed = (function edit(parsed) {
    const arr = [];
    
    let matchable = true;
    
    parsed.some((regexPart) => {
      switch (regexPart.name) {
        case "alternation": {
          const edited = edit(regexPart.contents);
          
          regexPart.props = edited.props
          regexPart.contents = edited.arr.filter((a) => a.matchable);
          regexPart.matchable = regexPart.contents.length === 0;
          
          regexPart.contents.length === 1 && regexPart.props. /*TODO*/
                && (regexPart = regexPart.contents[0]);
        }
      }
      
      arr.length > 0 && arr[arr.length - 1].name === regexPart.name === "character" || regexPart.name  arr.push(regexPart);
    });
    
    return matchable ? { arr, props, matchable } : { arr: [], props, matchable };
  })(regex.parsed);
  
  
}
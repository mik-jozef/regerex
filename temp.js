let RegeRex = require("./source"), group = new RegeRex.RegexGroup("regex");
group.add("regex:\\a(:flag:(i\\|)?+)(:nameStr:(:name)):(:parsed:(:parsed))*\\z");
group.add("name:(:nameStr:[[-AZ][-az]][[-AZ][-az][-09]_]*+)");
group.add("character:(:char:[^\\^\\$\\|\\\\\\*\\+\\?\\{\\}\\[\\]\\(\\)])");
group.add("charNoColon:(:char:[^:\\^\\$\\|\\\\\\*\\+\\?\\{\\}\\[\\]\\(\\)])");
group.add("charNoLessThan:(:char:[^<\\^\\$\\|\\\\\\*\\+\\?\\{\\}\\[\\]\\(\\)])");
group.add("charNoGreaterThan:(:char:[^>\\^\\$\\|\\\\\\*\\+\\?\\{\\}\\[\\]\\(\\)])");
group.add("charNoColonGreaterThan:(:char:[^:>\\^\\$\\|\\\\\\*\\+\\?\\{\\}\\[\\]\\(\\)])");
group.add("specialChar:(:char:[\\^\\$\\|\\\\\\*\\+\\?\\{\\}\\[\\]\\(\\)])");
group.add("reference:(:nameStr:(:name))(\\[(:dimensions:\\d+)\\])*");
group.add("parsed:[(:parsed:(:characterClass))(:parsed:(:alternation))(:parsed:(:negatedAlternation))(:parsed:(:assertion))(:parsed:(:backreference))(:parsed:(:boundary))(:parsed:(:captrGroup))(:parsed:(:escapeSequence))(:parsed:(:group))(:parsed:(:lookaround))(:parsed:(:subroutine))(:parsed:[(:character)])](:quantifier:(:quantifier))?");
group.add("parsedNoColon:[(:parsed:(:characterClass))(:parsed:(:alternation))(:parsed:(:negatedAlternation))(:parsed:(:assertion))(:parsed:(:backreference))(:parsed:(:boundary))(:parsed:(:captrGroup))(:parsed:(:escapeSequence))(:parsed:(:group))(:parsed:(:lookaround))(:parsed:(:subroutine))(:parsed:[(:charNoColon)(\\\\:)])](:quantifier:(:quantifier))?");
group.add("parsedNoLessThan:[(:parsed:(:characterClass))(:parsed:(:alternation))(:parsed:(:negatedAlternation))(:parsed:(:assertion))(:parsed:(:backreference))(:parsed:(:boundary))(:parsed:(:captrGroup))(:parsed:(:escapeSequence))(:parsed:(:group))(:parsed:(:lookaround))(:parsed:(:subroutine))(:parsed:[(:charNoLessThan)(\\\\<)])](:quantifier:(:quantifier))?");
group.add("parsedNoGreaterThan:[(:parsed:(:characterClass))(:parsed:(:alternation))(:parsed:(:negatedAlternation))(:parsed:(:assertion))(:parsed:(:backreference))(:parsed:(:boundary))(:parsed:(:captrGroup))(:parsed:(:escapeSequence))(:parsed:(:group))(:parsed:(:lookaround))(:parsed:(:subroutine))(:parsed:[(:charNoGreaterThan)(\\\\>)])](:quantifier:(:quantifier))?");
group.add("parsedNoColonGreaterThan:[(:parsed:(:characterClass))(:parsed:(:alternation))(:parsed:(:negatedAlternation))(:parsed:(:assertion))(:parsed:(:backreference))(:parsed:(:boundary))(:parsed:(:captrGroup))(:parsed:(:escapeSequence))(:parsed:(:group))(:parsed:(:lookaround))(:parsed:(:subroutine))(:parsed:[(:charNoColonGreaterThan)(\\\\:)(\\\\>)])])(:quantifier:(:quantifier))?");
group.add("alternation:\\[(:contents:(:parsed))*\\]"); // LATER lookahead to see if this is not a characterClass
group.add("negatedAlternation:\\[^[(:contents:(:character))(:contents:(:characterClass))(:contents:(:negatedAlternation))]*\\]");
group.add("assertion:\\(\\|(:reference:(:reference))([=](:condition:(:parsedNoGreaterThan))+)?>(:then:(:parsedNoColon))*:(:thenNot:(:parsed))*\\)");
group.add("backreference:\\(=(:reference:(:reference))\\)");
group.add("boundary:(:boundary:[\\^\\$\\|(\\\\a)(\\\\z)(\\\\`)(\\\\')])");
group.add("captrGroup:\\((:hidden:[:.])(:nameStr:(:name))(:shallow:[:.])[(:subroutine:(:subroutine))(:contents:(:parsed))*]\\)");
group.add("characterClass:\\[(:negated:^)?-[(:first:(:escapeChar))(:first:(:character))][(:second:(:escapeChar))(:second:(:character))]\\]");
group.add("escapeSequence:[(:escapeSequence:(:escapeChar))(:escapeSequence:(:escapeRegexPart))]");
group.add("escapeChar:\\\\(:escapeChar:[nrt(u\\{(:hex:[\d[-af]]{4,5})\\})(:specialChar)])");
group.add("escapeRegexPart:\\\\(:escapeRegexPart:[dwslDWSLNRT])");
group.add("group:\\((:contents:(:parsed))*\\)");
group.add("lookaround:\\(\\?[((:then:(:parsedNoColon)):(:thenNot:(:parsedNoLessThan))(:conditionLookahead:(:parsed)))((:conditionLookbehind:(:parsedNoGreaterThan))(:then:(:parsedNoColon))(:thenNot:(:parsed)))]\\)");
group.add("subroutine:\\((:nameStr:(:name))\\)");
group.add("quantifier:(:boundaries:[\\?\\*\\+(\\{(:min:\d+)((:comma:,)(:max:\d+)?)?\\})])(:type:[\\?\\+]?)");
group.match('Tag:<(:tagName:\\w+)(:attributes:(:Attr))*>(:children:(:Tag))*</>')


let RegeRex = require("./source"), group = new RegeRex.RegexGroup("a");
group.add('a:\\aabc\\z')
group.match('abc')


let RegeRex = require("./index"), group = new RegeRex.RegexGroup("a");
group.add('a:a(:a:(:a:f)+b+)+')
group.match('affbfbbfffbbb')


let RegeRex = require("./index"), group = new RegeRex.RegexGroup("a");
group.add('a:a(f+b+)+')
group.match('affbfbbfffbbb')


let RegeRex = require("./index"), group = new RegeRex.RegexGroup("a");
group.add('a:a\\n*\n[sd]f+\\s\\w')
group.match('a\n\nsff J')


let RegeRex = require("./index"), group = new RegeRex.RegexGroup("a");
group.add('a:\\w')
group.match('f')


let RegeRex = require("./index"), group = new RegeRex.RegexGroup("Tag");
group.add('Tag:<(:tagName:\\w+)(:attributes:(:Attr))*>(:children:(:Tag))*</>')
group.add('Attr:\\s+(:attrName:\\w+)=(:value:\\w+)')
group.match('<html><head></><body id=bodyId></></>')


let RegeRex = require("./index"), group = new RegeRex.RegexGroup("a");
group.add('a:a(:a:(:a))?b')
group.match('aaaabbbb')
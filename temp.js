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
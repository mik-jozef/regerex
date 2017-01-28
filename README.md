# RegeRex

Regex library that organizes matches into objects. This allows convenient matching of nested structures like HTML.

Warning: RegeRex is a young library and this README is ahead of the actual project. Some things described here are not yet implemented and what is implemented might be buggy.

#### Simple example

```javascript
const { RegexGroup } = require("regerex"); // import RegexGroup from "regerex";

(new RegexGroup("Tag"))
.add('Tag:<(:tagName:\w+)(:attributes:(:Attr))*>(:children:(:Tag))*</(=tagName)>')
.add('Attr:\s+(:attrName:\w+)=(.quote:"?)(:value:\w+)(=quote)')
.match('<html><head></head><body id="bodyId"></body></html>');

// This is returned (some props were omitted, see API below).
{ name: "Tag"
, tagName: "html"
, attributes: []
, children:
  [ { name: "Tag"
    , tagName: "head"
    , attributes: []
    , children: []
    }
  , { name: "Tag"
    , tagName: "body"
    , attributes:
      [ { name: "Attr"
        , attrName: "id"
        , value: "bodyId"
        }
      ]
    }
  ]
}
```

### Use
[npm](https://www.npmjs.com/package/regerex): `npm install --save regerex`

`<script src=" Coming "soon" (in a few minutes). "></script>`

# API

## RegexGroup : RegexGroup extends Object
Group of regexes that can reference each other.

#### constructor(name[, trackLines])
##### Name : string
Name of this `RegexGroup`. This is also the name of default regex.

##### trackLines : boolean (optional)
Also track current position in number of lines and columns. Default false.

#### add(regex) : this
##### regex : string | Regex
See `Regex`.

#### match(str[, start[, end]][, trackLines]) : Object | null
Tries to match 'str' from position 'start' to position 'end'. Matching always
starts with the regex with the same name as `RegexGroup`.

##### str : string
String to try to match.

##### start : number (optional)
From where to start matching.

##### end : number (optional)
Where to stop matching.

##### trackLines (optional)
Overrides `this.trackLines` if provided.

##### returned object
```
{ loc:
  { start:
    { pos: number
    , line: number | null
    , column: number | null
    }
  , end:
    { pos: number
    , line: number | null
    , column: number | null
    }
, input: string
, name: string
, ... // Captured values, properties are named like the capturing groups.
}
```

#### replace(...)
In the future I'd like to support replacing, but I don't yet have an idea about how it should work.

#### *matchAll(str[, start[, end[, trackLines]]]) : Object | null
Generator that yields all matches in string "str". See `match()`.

# Reference

If something is unclear, don't hesitate to open an issue or submit a clarifying PR.

## Regex
`Name:x` - regex x with name 'Name'.  
`i|Name:x` - regex x with name 'Name'; case insensitive.

A valid regex name starts with a letter followed by letters, numbers and underscore.

### Special characters
 - global: `^$|\*+?{}[]()`
 - local (only considered special in some places): `<>:`

### Escape sequences

|  E.S.  | Meaning
| ------ | -------
| `\d`   | Matches a single digit. Equivalent to `[-09]`.
| `\w`   | Matches a single letter, digit or underscore. Equivalent to `[[-az][-AZ][-09]_]`.
| `\s`   | Matches a single space. Equivalent to: `[\n\r\t\u{0020}\u{00a0}\u{1680}\u{180e}[-\u{2000}\u{200a}]\u{2028}\u{2029}\u{202f}\u{205f}\u{3000}\u{feff}]`.
| `\l`   | Line break. Equivalent to `[\n\r\u2028\u2029]`.
| `\n`   | Linefeed.
| `\r`   | Carriage return.
| `\t`   | Horizontal tab.
| `\c{X}` | Control character, where x is an uppercase letter, or one of `@[]^_`. (Eg. `\\c{M}` is carriage return).
| `\u{hhhh}` | Unicode character (`hhhh` are hexadecimal digits).
| `\u{hhhhh}` | Unicode character (`hhhhh` are hexadecimal digits).
| `\X` | Equivalent to `[^\x]`, except `\a` and `\z`. Eg. `\S` is everything but whitespace.
| `\@` | Treats @ literaly if @ is a special character, eg. "\\{" matches "{".

### Boundaries

| Char | Meaning
| ---- | -------
| `^`  | Beggining of line
| `$`  | End of line
| `|`  | Word boundary
| `\a` | Start of string
| `\z` | End of string
| ``\` `` | Starting position
| `\'` | Ending position

### Alternation and character classes
#### [xyz...]
Matches x, y, z or any other content. All special characters work normally. Can be negated by "^" as a first character, but a negated alternation can only contain characters, character classes and negated alternations. Capturing inside alternation works as if every option was inside ? quantifier, so all skipped alternations capture `null`.

##### Examples
`[abcd]` - matches "a", "b", "c" or "d".  
`[a(bc)d]` - matches "a", "bc" or "d".  
`[^ab]` - matches everything, but "a" and "b".  
`[^a(zz)]` - this is now allowed.  
`[]` - never matches.  
`[^]` - matches everything.

#### [-xy]
Character class; matches all characters between characters x and y. Can be negated like alternation.

##### Examples
`[-09]` - matches all digits.  
`[-az]` - matches all lowercase letters.  
`[-za]` - the same.  
`[^-cg]` - matches everything but characters between "c" and "g".

### Groups and subroutines
#### (x)
Non-capturing group.

#### (:Name)
Regexp (subroutine) with name 'Name'.

#### (:name:x)
Multidimensional capturing group, captures value x under key 'name'. See 'How matching works'.

#### (:name.x)
Shallow capturing group, captures value x under key 'name'. See 'How matching works'.

#### (:name:(:Name))
Captures regexp 'Name' as an object. Subroutine must be the only thing inside capturing group.

##### Examples
`(:name:[(:Name)])` - captures regexp 'Name' as a string.  
`(:name1:(:name2.(:Name)))` - captures regexp 'Name' as both string and object.

#### (.name:x), (.name.x)
Remembers x for backreferences, but doesn't capture it. Creates separate

### Backreference
#### (=name)
Zero-dimensional backreference. Only matches text that was previously captured under name 'name'.

#### (=name[n])
One-dimensional backreference. Negative numbers are relative backreferences (eg. -3 is the third last match). Backreferences can have more dimensions.

### Quantifiers
#### x?
Matches x once and if it fails, x is skipped, capturing `null` for all capturing groups inside x. Use `{0,1}` to get behavior consistent with all other quantifiers.

##### Types of quantifiers
Q? - makes quantifier Q a lazy quantifier.  
Q+ - makes quantifier Q a possesive quantifier.

#### x*
Shorthand for `x{0,}`.

#### x+
Shorthand for `x{1,}`.

#### x{n}
Matches x 'n' times.

#### x{n,}
Matches x at least 'n' times.

#### x{n,m}
Matches x at least 'n' and at most 'm' times.

### Lookaround
#### (?x:y<z)
Lookahead, tries to match x followed by z, else tries to match y not followed by z.

##### Examples
(?a:[]<b) - matches "a" only if it's followed by "b". Empty alternation never matches.  
(?[]:a<b) - matches "a only if it's not followed by "b". Empty alternation never matches.

#### (?x>y:z)
Lookbehind, tries to match y preceded by x, else tries to match z not preceded by x.

### Assertions
#### (|name>x:y)
If 'name' was captured, match x else match y.

#### (|name=x>y:z)
If 'name' matches x, match y else match z.

#### (|name[n]>x:y)
If 'n'th (starting from zero) match of 'name' exists, match x else match y. Dimensions work like they work in beckreferences.

#### (|name[n]=x>y:z)
If 'name[n]' matches x, match y, else match z. Dimensions work like they work in beckreferences.

## How matching works
If a capturing group contains nothing but a subroutine, that capturing group captures an object, otherwise it captures string. The captured object / string will be refered to as a captured value, or just value.

There are two types of capturing groups - shallow and multidimensional. There can be multiple groups with the same name, but they must be of the same type.

Shallow groups always create a one-dimensional array of captured values. If the group is matched zero times, the result is an empty array. Shallow groups never capture `null`.

In case of multidimensional groups, imagine the regex as a tree of alternations and quantifiers, where the leafs are capturing groups. Every quantifier except '?' that has only one child will create an array of values created by the child. Every quantifier except '?' that has multiple children will create array of arrays of values, where the inner array stores values from one iteration of the quantifier. Every alternation and the '?' quantifier will create `null` if its capturing groups are skipped. Otherwise, if it has only one child, it will create the value created by its child (ie. it won't affect the value), else it will create array of values created by its children.

Behavior of multidimensional groups creates a simple special case when there is only one capturing group with the same name: if the group is inside two quantifiers, it will create a two-dimensional array of values; a group not inside any quantifier will simply create a value, etc.

Nested capturing groups with the same name behave as if the inner one was first.

##### Examples
The capturing groups in examples are multidimensional, but is is also shown what shallow groups would capture in their place.

| Regex            | String | Shallow        | Multidimensional
| ---------------- | ------ | -------------- | -----
| `a(:z:b)c`       | `abc`  | `[ "b" ]`      | `"b"`
| `a(:z:b)?c`      | `abc`  | `[ "b" ]`      | `"b"`
| `a(:z:b)?c`      | `ac`   | `[]`           | `null`
| `a[(:z:b)g]c`    | `agc`  | `[]`           | `null`
| `a(:z:b)*c`      | `ac`   | `[]`           | `[]`
| `a(:z:b)*c`      | `abc`  | `[ "b" ]`      | `[ "b" ]`
| `a(:z:b)c(:z:d)e`   | `abcde`  | `[ "b", "d" ]`      | `[ "b", "d" ]`
| `a(:z:b)+c(:z:d)e`  | `abbcde` | `[ "b", "b", "d" ]` | `[ [ "b", "b" ], "d" ]`
| `a(:z:b)+c(:z:d)*e` | `abbce`  | `[ "b", "b" ]`      | `[ [ "b", "b" ], [] ]`
| `a(:z:b)+c(:z:d)*e` | `abbcde` | `[ "b", "b", "d" ]` | `[ [ "b", "b" ], [ "d" ] ]`
| `a((:z:b)+c)+d` | `abbcbcd` | `[ "b", "b", "b" ]` | `[ [ "b", "b" ], [ "b" ] ]`
| `a((:z:b)+(:z:c))+d` | `abbcbcd` | `[ "b", "b", "c", "b", "c" ]` | `[ [ [ "b", "b" ], "c" ], [ [ "b" ], "c" ] ]`
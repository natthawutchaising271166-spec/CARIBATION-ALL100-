const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

function removeElementAndFollowingComma(str, elementRegex) {
    let startMatch = str.match(elementRegex);
    if (!startMatch) {
        console.log("Could not find regex:", elementRegex);
        return str;
    }
    
    // find the matching closing parenthesis of m.jsxDEV(
    let startIndex = startMatch.index;
    let bracketCount = 0;
    // find the first opening parenthesis for m.jsxDEV
    let firstParenIndex = str.indexOf('(', startIndex);
    let i = firstParenIndex;
    let started = false;
    while(i < str.length) {
        if (str[i] === '(') {
            bracketCount++;
            started = true;
        } else if (str[i] === ')') {
            bracketCount--;
        }
        if (started && bracketCount === 0) {
            let endIndex = i + 1;
            // check if there's a comma after
            if (str[endIndex] === ',') endIndex++;
            
            console.log('Removing:', str.substring(startIndex, endIndex).substring(0, 100) + '...');
            return str.substring(0, startIndex) + str.substring(endIndex);
        }
        i++;
    }
    return str;
}

// 1. Remove the three buttons
code = removeElementAndFollowingComma(code, /m\.jsxDEV\("button",\{onClick:\(\)=>g\("points"\)/);
code = removeElementAndFollowingComma(code, /m\.jsxDEV\("button",\{onClick:\(\)=>g\("traceability"\)/);
code = removeElementAndFollowingComma(code, /m\.jsxDEV\("button",\{onClick:\(\)=>g\("iso17025"\)/);

// 2. Remove the three tab contents
code = removeElementAndFollowingComma(code, /v==="points"&&m\.jsxDEV/);
code = removeElementAndFollowingComma(code, /v==="traceability"&&m\.jsxDEV/);
code = removeElementAndFollowingComma(code, /v==="iso17025"&&m\.jsxDEV/);

fs.writeFileSync('app_new.js', code);

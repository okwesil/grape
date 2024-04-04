# grape 
### fundamental grep functionality made in node
<br>
The functionality of the `grep` linux command made in node.js with replace
<br>

## Install 
You can install globally with: 
  ` npm install -g grape-regexp `


## Usage

You can use: 

  + `grape find "pattern" <filepath>` to print all the lines that contain a match
  + `grape transfer "pattern" <pathToCheck> <pathToDeposit> ` to transfers all the lines with a match in `<pathToCheck>` to `<pathToDeposit>`
  + `grape replace "pattern" "replaceValue" <filepath>` to replace all matches of `"pattern"` with `"replaceValue"`
  + `grape read <filepath> ` to print the entire contents of a file
  +  `grape revert [filename]`, if a filename is not provided then grape will show a list of all replace saves from you to choose from and manually revert. If a filename/path is provided then grape show a list of all saves that contain the path inputted
    <br>

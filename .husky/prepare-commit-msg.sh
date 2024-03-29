#!/bin/sh
#aHernández. Add the branch name between brackets at the start of the commit message: [branch] Commit Message. 
# updated 2022-08-20 skip when the message already start with "[" or the branch name has the text 'no branch' (wich is included in a interactive rebase)
exit 1
#!/bin/sh
#aHernández. Add the branch name between brackets at the start of the commit message: [branch] Commit Message. 
# updated 2022-08-20 skip when the message already start with "[" or the branch name has the text 'no branch' (wich is included in a interactive rebase)
NAME=$(git branch | grep '*' | sed 's/* //') 
DESCRIPTION=$(git config branch."$NAME".description)
TEXT=$(cat "$1" | sed '/^#.*/d')

if [ -n "$TEXT" ]
then
    if [[ "$NAME" != *"no branch"*  && "$TEXT" != "["* ]]
    then
        echo -n '['"$NAME"'] '|cat - "$1" > /tmp/out && mv /tmp/out "$1"
        if [ -n "$DESCRIPTION" ] 
        then
        echo "" >> "$1"
        echo $DESCRIPTION >> "$1"
        fi
    fi
else
    echo "Aborting commit due to empty commit message."
    exit 1
fi
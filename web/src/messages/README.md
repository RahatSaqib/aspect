# Aspect Web - Messages Translations

## i18n

If you are going to work with translations, request your manager the licence for PoEdit. (although you can translate by hand with the free version)

### Merging with develop

As a general rule please remember:
**NOT MERGE .PO, .MO, translations.js files with develop on your PR**

To avoid inserting bad and duplicated keys we are not going to merge these files. It doesn't matter which one you are going to accept in a merge action (Keep local changes or develop branch changes), just pick only one and accept it completely. Once this action was made and committed just continue with the next step to generate the `.pot` file and sync all the language files.

### Extracting new translations

1. Edit your components in `src/**/*`
2. `yarn run updatemessages:start`
3. Create or update `.po` files. See below.
4. `yarn run updatemessages:end`
5. Commit stuff in `src/utils/i18n/**/*`

In step 3, you'll need to create or update `.po` files inside `src/utils/i18n` folder. The `.po` files store translations for each locale.

Creating a `.po` file means adding new locale support.

Updating `.po` files means updating existing translations with newly added messages due to changes in step 1.

### Create `.po` files

1. Open [Poedit](https://poedit.net)
2. Click `Create new translation`
3. Select `diff.pot` from the file dialog
4. Select language of the translation from the dropdown
5. When done, click `File > Save`. Set filename to `web.${LOCALE_NAME}.po` and store it under `src/utils/i18n` folder.

### Update `.po` files

1. Open [Poedit](https://poedit.net)
2. Click `Edit a translation`
3. Select `src/utils/i18n/web.${LOCALE_NAME}.po` from the file dialog
4. Click `Catalog > Update from POT file`
5. Select `src/utils/i18n/diff.pot` from the file dialog
6. Update translations for each items inside the window
7. When done, click `File > Save`

### Creating a CSV file based on a po file

This is useful for sharing a CSV with a translator so they can easily edit it.
To create a CSV of all Portuguese translations:

```bash
po2csv src/utils/i18n/web.pt-PT.po portuguese.csv
```

#### Using existing GxAlert translations when adding a new new language

A lot of the strings in GxAlert and Aspect are the same. The translations on GxAlert have already been reviewed by our clients and adjusted by us over the years, so it makes sense to use them as a foundation.

We'll use "csv2po" for converting the CSV from GxAlert to .po. It's part of the [translate toolkit](http://docs.translatehouse.org/projects/translate-toolkit/en/latest/index.html)

Complete the steps under "Create `.po` files" above. Then:

1. Install the translate toolkit: `pip3 install translate-toolkit`
2. Make sure that the CSV from GxAlert has three columns:
   a. Location (resource ID)
   b. Source Language (the English string)
   c. Target Language (the translated string)
3. Run csv2po: `csv2po -i gxalert_translations.csv -o web.LANGUAGECODE.po -t diff.pot`, where:
   -i: The CSV containing translations from GxAlert
   -o: The .po file you created in POEdit
   -t: The diff.pot that is generated when running `yarn run updatemessages:start`
4. The translations should now be part of the po file and you can now edit the .po file as usual in POEdit


# Countries with States borders

Based on https://d3-geomap.github.io/docs/creating-topojson-files/, Section **Countries with Administrative Regions TopoJSON**.

## Prerequests

```sh
brew install wget gdal jq
yarn global add topojson
```

## How to generate Topojson

Edit `supported.json` with isoAlpha2Code in a JSON array. Then, run:

```sh
./index.sh
```

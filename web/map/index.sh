#! /bin/sh

wget -q -N "http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_1_states_provinces_lakes.zip"
echo "Downloaded latest ne_10m_admin_1_states_provinces_lakes.zip!"

COUNTRIES=`jq -r 'join ("\n")' supported.json`
echo "Specified countries in supported.json: `jq -r 'join (",")' supported.json`!"

rm topo/*
mkdir -p topo

mkdir geojson
for COUNTRY in $COUNTRIES; do
  ogr2ogr -f GeoJSON -where "iso_a2 IN ('$COUNTRY') AND name NOT IN ('Alaska', 'Hawaii')" geojson/$COUNTRY.json /vsizip/ne_10m_admin_1_states_provinces_lakes.zip
  geo2topo geojson/$COUNTRY.json | toposimplify -p 0.01 -f -o "topo/${COUNTRY}.json"
done

FILES=`jq 'map ("\(.)=geojson/\(.).json") | join (" ")' -r supported.json`
geo2topo $FILES | toposimplify -p 0.01 -f -o topo/_all.json
rm geojson/*
rmdir geojson

echo "Generated topo/_all.json!"

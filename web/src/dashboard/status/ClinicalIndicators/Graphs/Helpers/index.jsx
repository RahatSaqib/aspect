import without from 'lodash/without';
import omit from 'lodash/omit';
import uniq from 'lodash/uniq';
import round from 'lodash/round';
import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';
import sum from 'lodash/sum';
import values from 'lodash/values';
import { format } from 'date-fns';

const sortByInputArrayFlat = (data, sortExample) =>
  data.sort((a, b) => sortExample.indexOf(a) - sortExample.indexOf(b));

const sortByInputArray = (data, sortExample, sortKey) =>
  sortBy(data, item => sortExample.indexOf(item[sortKey]));

const getKeysFromResults = (data, keyToOmit, orderBy) => {
  const res = sortByInputArrayFlat(
    uniq(data.flatMap(a => Object.keys(a))),
    orderBy
  );
  return keyToOmit ? without(res, keyToOmit) : res;
};

const groupByKey = (data, key, cntKey, formatDate = false) => {
  return data.reduce((acc, curr) => {
    acc[curr[key]] = {
      ...acc[curr[key]],
      [key]: formatDate ? format(new Date(curr[key]), formatDate) : curr[key],
      [curr[cntKey]]: curr.cnt
    };
    return acc;
  }, {});
};

const normaliseKeys = data => {
  const normalised = [];
  for (const [key, value] of Object.entries(data)) {
    normalised.push({ ...value });
  }
  return normalised;
};

const formatDataForPie = (
  data,
  key,
  value,
  orderBy = false,
  assayFromState
) => {
  const { resultCategories } = assayFromState[0];

  return data.reduce((acc, curr) => {
    const newKey = resultCategories.filter(r => r.externalId === curr[key])[0];
    const label = (newKey && newKey.name) || curr[key];
    acc.push({ id: curr[key], label, value: curr[value] });
    return acc;
  }, []);
};

const getAverageFromData = (data, key, value) => {
  const total = filter(data, ['id', key]);
  const sum = data.reduce((acc, curr) => acc + curr.value, 0);
  return round((total[0][value] / sum) * 100);
};

const calcPercentageSplit = (data, keyToOmitDuringCalc) =>
  data.reduce((acc, curr, index) => {
    const dataPoints = omit(curr, keyToOmitDuringCalc);
    const total = sum(values(dataPoints));

    acc.push({
      [keyToOmitDuringCalc]: curr[keyToOmitDuringCalc]
    });

    for (const [key, value] of Object.entries(dataPoints)) {
      acc[index][key] = ((value / total) * 100).toFixed(2);
    }

    return acc;
  }, []);

const translateKeys = (data, assayFromState) => {
  const reduced = [];
  const { resultCategories } = assayFromState[0];

  data.map(item => {
    const newItem = {};
    for (const [key, value] of Object.entries(item)) {
      const newKey = resultCategories.filter(r => r.externalId === key)[0];
      newKey && newKey.name
        ? (newItem[newKey.name] = value)
        : (newItem[key] = value);
    }
    reduced.push({ ...newItem });
  });

  return reduced;
};

export {
  calcPercentageSplit,
  formatDataForPie,
  getAverageFromData,
  groupByKey,
  getKeysFromResults,
  normaliseKeys,
  sortByInputArray,
  translateKeys
};

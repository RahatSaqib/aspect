const { assert } = require('chai')
const { getAstmField, astmE1394MessagesToJson } = require('../../src/shared/astm')

const standardBDMGITAstmString = `H|\\^&|||Becton Dickinson|7 Loveton Circle^Sparks^MD^21152||410 316-4000||||P|V1.00|19981019184200
P|1
O|1|0970038018^1||^^^MGIT_960_AST
R|1|^^^AST_MGIT^439309967349^EMB^5.0^ug/ml|INST_COMPLETE^1234^R|||||P|||19960502115414|19960502115414|MGIT960^^^13^B/A02
R|2|^^^AST_MGIT^439309967349^RIF^1.0^ug/ml|INST_COMPLETE^12^S|||||P|||19960502115414|19960502115414|MGIT960^^^13^B/A03
L|1|N
`

describe('ASTM parser', () => {
  it('should return null if no ASTM message passed in', () => {
    const astmPosition = 'H,1,1,1'
    const expectedResult = null
    const resultString = getAstmField(null, astmPosition)
    assert.equal(resultString, expectedResult)
  })

  it('should return null if no ASTM position passed in', () => {
    const astmPosition = null
    const expectedResult = null
    const resultString = getAstmField(standardBDMGITAstmString, astmPosition)
    assert.equal(resultString, expectedResult)
  })

  it('should return null if invalid ASTM position', () => {
    const astmPosition = 'X,1'
    const expectedResult = null
    const resultString = getAstmField(standardBDMGITAstmString, astmPosition)
    assert.equal(resultString, expectedResult)
  })

  describe('When the message is from a BD MGIT DST', () => {
    it('should return the sender name if H,5,1,1 is passed in', () => {
      const astmPosition = 'H,5,1,1'
      const expectedResult = 'Becton Dickinson'
      const resultString = getAstmField(standardBDMGITAstmString, astmPosition)
      assert.equal(resultString, expectedResult)
    })

    it('should return the growth units of the second result row if R,4,2,2 is passed in', () => {
      const astmPosition = 'R,4,2,2'
      const expectedResult = '12'
      const resultString = getAstmField(standardBDMGITAstmString, astmPosition)
      assert.equal(resultString, expectedResult)
    })
  })

  describe('astmE1394MessagesToJson', () => {
    it('Should transform the ASTM payload in the explanatory comment correctly', () => {
      const astmPayload = `H|\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346
C|1|I|Example Message Comment|G
P|1|||PIDSID13|Patient^Im^A\\And^This^Is^My^Wife|19320122|F||Dr.Amesbury|ParkClinic
C|1|I|Example Patient Comment|G
O|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||F
C|1|I|Example Order Comment|G
R|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<|F||19990715081030|I20100
R|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE||||F||19990715081030|I20100
R|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU|||F||19990715081030|I20100
C|1|I|Example Result Comment|G
Q|1|^SID12345||^^^ALL||O
L|1
H|\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346
P|1
O|1|TSHBIORAD 2|TSHBIORAD 2^A123^2|^^^0241^TSH^UNDILUTED^P|R|||Q|F
R|1|^^^0241^TSH^UNDILUTED^P^0607M200^01824^40080^F|4.6011|mIU/mL|4.292500 TO 5.397300||F|ECB^RY|19990715081030|I20100
L|1`
      const expectedJsonResult = [
        {
          value:
            'H|\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\nC|1|I|Example Message Comment|G\nP|1|||PIDSID13|Patient^Im^A\\And^This^Is^My^Wife|19320122|F||Dr.Amesbury|ParkClinic\nC|1|I|Example Patient Comment|G\nO|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||F\nC|1|I|Example Order Comment|G\nR|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<|F||19990715081030|I20100\nR|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE||||F||19990715081030|I20100\nR|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU|||F||19990715081030|I20100\nC|1|I|Example Result Comment|G\nQ|1|^SID12345||^^^ALL||O\nL|1',
          H: {
            1: { value: 'H' },
            2: {
              1: { value: null },
              2: {
                1: { value: null },
                2: { value: '|' },
                value: '|',
              },
              items: ['1', '2'],
              value: '|',
            },
            3: { value: null },
            4: {
              1: { value: 'Name of Instrument' },
              2: { value: '1.0.0.0' },
              value: 'Name of Instrument 1.0.0.0',
            },
            5: { value: 'P' },
            6: { value: '1' },
            7: { value: '19930330133346' },
            value: 'H|\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346',
            P1: {
              1: { value: 'P' },
              2: { value: '1' },
              3: { value: null },
              4: { value: null },
              5: { value: 'PIDSID13' },
              6: {
                1: {
                  1: { value: 'Patient' },
                  2: { value: 'Im' },
                  3: { value: 'A' },
                  value: 'Patient Im A',
                },
                2: {
                  1: { value: 'And' },
                  2: { value: 'This' },
                  3: { value: 'Is' },
                  4: { value: 'My' },
                  5: { value: 'Wife' },
                  value: 'And This Is My Wife',
                },
                items: ['1', '2'],
                value: 'Patient Im A\nAnd This Is My Wife',
              },
              7: { value: '19320122' },
              8: { value: 'F' },
              9: { value: null },
              10: { value: 'Dr.Amesbury' },
              11: { value: 'ParkClinic' },
              value: 'P|1|||PIDSID13|Patient^Im^A\\And^This^Is^My^Wife|19320122|F||Dr.Amesbury|ParkClinic',
              O1: {
                1: { value: 'O' },
                2: { value: '1' },
                3: { value: 'SID13' },
                4: {
                  1: { value: 'SID3' },
                  2: { value: 'A123' },
                  3: { value: '5' },
                  value: 'SID3 A123 5',
                },
                5: {
                  1: { value: null },
                  2: { value: null },
                  3: { value: null },
                  4: { value: '123' },
                  5: { value: 'Assay1' },
                  6: { value: 'UNDILUTED' },
                  7: { value: 'P' },
                  value: '123 Assay1 UNDILUTED P',
                },
                6: { value: 'R' },
                7: { value: null },
                8: { value: '20010223081223' },
                9: { value: null },
                10: { value: 'F' },
                value: 'O|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||F',
                R1: {
                  1: { value: 'R' },
                  2: { value: '1' },
                  3: {
                    1: { value: null },
                    2: { value: null },
                    3: { value: null },
                    4: { value: '0021' },
                    5: { value: 'B-hCG' },
                    6: { value: 'UNDILUTED' },
                    7: { value: 'P' },
                    8: { value: '47331M100' },
                    9: { value: '00788' },
                    10: { value: null },
                    11: { value: 'F' },
                    value: '0021 B-hCG UNDILUTED P 47331M100 00788 F',
                  },
                  4: { value: '<1.20' },
                  5: { value: 'mIU/mL' },
                  6: { value: '0.35 TO 4.94' },
                  7: {
                    1: { value: 'EXP' },
                    2: { value: '<' },
                    value: 'EXP <',
                  },
                  8: { value: 'F' },
                  9: { value: null },
                  10: { value: '19990715081030' },
                  11: { value: 'I20100' },
                  value:
                    'R|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<|F||19990715081030|I20100',
                },
                results: ['R1', 'R2', 'R3'],
                R2: {
                  1: { value: 'R' },
                  2: { value: '2' },
                  3: {
                    1: { value: null },
                    2: { value: null },
                    3: { value: null },
                    4: { value: '0021' },
                    5: { value: 'B-hCG' },
                    6: { value: 'UNDILUTED' },
                    7: { value: 'P' },
                    8: { value: '47331M100' },
                    9: { value: '00788' },
                    10: { value: null },
                    11: { value: 'I' },
                    value: '0021 B-hCG UNDILUTED P 47331M100 00788 I',
                  },
                  4: { value: 'NEGATIVE' },
                  5: { value: null },
                  6: { value: null },
                  7: { value: null },
                  8: { value: 'F' },
                  9: { value: null },
                  10: { value: '19990715081030' },
                  11: { value: 'I20100' },
                  value: 'R|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE||||F||19990715081030|I20100',
                },
                R3: {
                  1: { value: 'R' },
                  2: { value: '3' },
                  3: {
                    1: { value: null },
                    2: { value: null },
                    3: { value: null },
                    4: { value: '0021' },
                    5: { value: 'B-hCG' },
                    6: { value: 'UNDILUTED' },
                    7: { value: 'P' },
                    8: { value: '47331M100' },
                    9: { value: '00788' },
                    10: { value: null },
                    11: { value: 'P' },
                    value: '0021 B-hCG UNDILUTED P 47331M100 00788 P',
                  },
                  4: { value: '9245' },
                  5: { value: 'RLU' },
                  6: { value: null },
                  7: { value: null },
                  8: { value: 'F' },
                  9: { value: null },
                  10: { value: '19990715081030' },
                  11: { value: 'I20100' },
                  value: 'R|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU|||F||19990715081030|I20100',
                  C1: {
                    1: { value: 'C' },
                    2: { value: '1' },
                    3: { value: 'I' },
                    4: { value: 'Example Result Comment' },
                    5: { value: 'G' },
                    value: '\nC|1|I|Example Result Comment|G',
                  },
                  comments: ['C1'],
                },
                C1: {
                  1: { value: 'C' },
                  2: { value: '1' },
                  3: { value: 'I' },
                  4: { value: 'Example Order Comment' },
                  5: { value: 'G' },
                  value: '\nC|1|I|Example Order Comment|G',
                },
                comments: ['C1'],
              },
              orders: ['O1'],
              C1: {
                1: { value: 'C' },
                2: { value: '1' },
                3: { value: 'I' },
                4: { value: 'Example Patient Comment' },
                5: { value: 'G' },
                value: 'C|1|I|Example Patient Comment|G',
              },
              comments: ['C1'],
            },
            patients: ['P1'],
            Q1: {
              1: { value: 'Q' },
              2: { value: '1' },
              3: {
                1: { value: null },
                2: { value: 'SID12345' },
                value: 'SID12345',
              },
              4: { value: null },
              5: {
                1: { value: null },
                2: { value: null },
                3: { value: null },
                4: { value: 'ALL' },
                value: 'ALL',
              },
              6: { value: null },
              7: { value: 'O' },
              value: 'Q|1|^SID12345||^^^ALL||O',
            },
            enquiries: ['Q1'],
            C1: {
              1: { value: 'C' },
              2: { value: '1' },
              3: { value: 'I' },
              4: { value: 'Example Message Comment' },
              5: { value: 'G' },
              value: 'C|1|I|Example Message Comment|G',
            },
            comments: ['C1'],
          },
          L: {
            1: { value: 'L' },
            2: { value: '1' },
            value: 'L|1',
          },
        },
        {
          value:
            'H|\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\nP|1\nO|1|TSHBIORAD 2|TSHBIORAD 2^A123^2|^^^0241^TSH^UNDILUTED^P|R|||Q|F\nR|1|^^^0241^TSH^UNDILUTED^P^0607M200^01824^40080^F|4.6011|mIU/mL|4.292500 TO 5.397300||F|ECB^RY|19990715081030|I20100\nL|1',
          H: {
            1: { value: 'H' },
            2: {
              1: { value: null },
              2: {
                1: { value: null },
                2: { value: '|' },
                value: '|',
              },
              items: ['1', '2'],
              value: '|',
            },
            3: { value: null },
            4: {
              1: { value: 'Name of Instrument' },
              2: { value: '1.0.0.0' },
              value: 'Name of Instrument 1.0.0.0',
            },
            5: { value: 'P' },
            6: { value: '1' },
            7: { value: '19930330133346' },
            value: 'H|\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346',
            P1: {
              1: { value: 'P' },
              2: { value: '1' },
              value: 'P|1',
              O1: {
                1: { value: 'O' },
                2: { value: '1' },
                3: { value: 'TSHBIORAD 2' },
                4: {
                  1: { value: 'TSHBIORAD 2' },
                  2: { value: 'A123' },
                  3: { value: '2' },
                  value: 'TSHBIORAD 2 A123 2',
                },
                5: {
                  1: { value: null },
                  2: { value: null },
                  3: { value: null },
                  4: { value: '0241' },
                  5: { value: 'TSH' },
                  6: { value: 'UNDILUTED' },
                  7: { value: 'P' },
                  value: '0241 TSH UNDILUTED P',
                },
                6: { value: 'R' },
                7: { value: null },
                8: { value: null },
                9: { value: 'Q' },
                10: { value: 'F' },
                value: 'O|1|TSHBIORAD 2|TSHBIORAD 2^A123^2|^^^0241^TSH^UNDILUTED^P|R|||Q|F',
                R1: {
                  1: { value: 'R' },
                  2: { value: '1' },
                  3: {
                    1: { value: null },
                    2: { value: null },
                    3: { value: null },
                    4: { value: '0241' },
                    5: { value: 'TSH' },
                    6: { value: 'UNDILUTED' },
                    7: { value: 'P' },
                    8: { value: '0607M200' },
                    9: { value: '01824' },
                    10: { value: '40080' },
                    11: { value: 'F' },
                    value: '0241 TSH UNDILUTED P 0607M200 01824 40080 F',
                  },
                  4: { value: '4.6011' },
                  5: { value: 'mIU/mL' },
                  6: { value: '4.292500 TO 5.397300' },
                  7: { value: null },
                  8: { value: 'F' },
                  9: {
                    1: { value: 'ECB' },
                    2: { value: 'RY' },
                    value: 'ECB RY',
                  },
                  10: { value: '19990715081030' },
                  11: { value: 'I20100' },
                  value:
                    'R|1|^^^0241^TSH^UNDILUTED^P^0607M200^01824^40080^F|4.6011|mIU/mL|4.292500 TO 5.397300||F|ECB^RY|19990715081030|I20100',
                },
                results: ['R1'],
              },
              orders: ['O1'],
            },
            patients: ['P1'],
          },
          L: {
            1: { value: 'L' },
            2: { value: '1' },
            value: 'L|1',
          },
        },
      ]
      const messagesInJson = astmE1394MessagesToJson(astmPayload)
      assert.deepEqual(messagesInJson, expectedJsonResult)
    })
  })
})

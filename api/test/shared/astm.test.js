const { assert } = require('chai')
const {
  getAstmField,
  astmE1394MessagesToJson,
} = require('../../src/shared/astm')

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

  describe('When repeat delimiters are present in the message', () => {
    it('should allow the caller to find the value using the number of the repetition', () => {
      const repeatDelimiterAstmString = `H|\\^&|||My^Host^Computer|||||ASI^1.0^s/n||P|1|19930631
P|1||PID1234||Doe^John|Smith|19500522|M|||||Jones^Bob^^^Dr|||||300.0^Anxiety\\311.0^Depression|
O|1|SID1000||^^^10^Test10^protocol1\\^^^22^Test22|S|19930631|19930629||||N||||SERUM|Miller^John^^^Dr|||||||||O|
P|2||PID2222||Small^Jane|Smith|19400820|M|||||Jones^John^^^Dr||||||
O|1|SID1001||^^^20^Test20^protocol4|R|19930631|19930629||||N||||SERUM|Ahmad^Joe^^^Dr|||||||||O|
L|1|N
`
      const astmPosition = 'O,5[2],1,5'
      const expectedResult = 'Test22'
      const secondTestOrderForJohnDoe = getAstmField(
        repeatDelimiterAstmString,
        astmPosition
      )
      assert.equal(secondTestOrderForJohnDoe, expectedResult)
    })
  })

  describe('astmE1394MessagesToJson', () => {
    it('Should transform the ASTM payload in the explanatory comment correctly', () => {
      const astmPayload = `H|\\\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\\r\\x0392\\r\\n
C|1|I|Example Message Comment|G\\r\\x0343\\r\\n
P|1|||PIDSID13|Patient^Im^A\\\\And^This^Is^My^Wife|19320122|F||Dr.Amesbury|ParkClinic\\r\\x033F\\r\\n
C|1|I|Example Patient Comment|G\\r\\x0343\\r\\n
O|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||F\\r\\x03D0\\r\\n
C|1|I|Example Order Comment|G\\r\\x0343\\r\\n
R|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<|F||19990715081030|I20100\\r\\x03E2\\r\\n
R|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE||||F||19990715081030|I20100\\r\\x0343\\r\\n
R|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU|||F||19990715081030|I20100\\r\\x0343\\r\\n
C|1|I|Example Result Comment|G\\r\\x0343\\r\\n
Q|1|^SID12345||^^^ALL||O\\r\\x0343\\r\\n
L|1\\r\\x033F\\r\\n
H|\\\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\\r\\x0392\\r\\n
P|1\\r\\x033F\\r\\n
O|1|TSHBIORAD 2|TSHBIORAD 2^A123^2|^^^0241^TSH^UNDILUTED^P|R|||Q|F\\r\\x03D0\\r\\n
R|1|^^^0241^TSH^UNDILUTED^P^0607M200^01824^40080^F|4.6011|mIU/mL|4.292500 TO 5.397300||F|ECB^RY|19990715081030|I20100\\r\\x03E2\\r\\n
L|1\\r\\x033F\\r\\n`
      const expectedJsonResult = [
        {
          value:
            'H|\\\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\\r\\x0392\\r\\n\nC|1|I|Example Message Comment|G\\r\\x0343\\r\\n\nP|1|||PIDSID13|Patient^Im^A\\\\And^This^Is^My^Wife|19320122|F||Dr.Amesbury|ParkClinic\\r\\x033F\\r\\n\nC|1|I|Example Patient Comment|G\\r\\x0343\\r\\n\nO|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||F\\r\\x03D0\\r\\n\nC|1|I|Example Order Comment|G\\r\\x0343\\r\\n\nR|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<|F||19990715081030|I20100\\r\\x03E2\\r\\n\nR|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE||||F||19990715081030|I20100\\r\\x0343\\r\\n\nR|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU|||F||19990715081030|I20100\\r\\x0343\\r\\n\nC|1|I|Example Result Comment|G\\r\\x0343\\r\\n\nQ|1|^SID12345||^^^ALL||O\\r\\x0343\\r\\n\nL|1\\r\\x033F\\r\\n',
          H: {
            '1': { value: 'H' },
            '2': {
              '1': { value: '' },
              '2': { value: '' },
              '3': {
                '1': { value: '' },
                '2': { value: '|' },
                value: '|',
              },
              value: '|',
            },
            '3': { value: '' },
            '4': {
              '1': { value: 'Name of Instrument' },
              '2': { value: '1.0.0.0' },
              value: 'Name of Instrument 1.0.0.0',
            },
            '5': { value: 'P' },
            '6': { value: '1' },
            '7': { value: '19930330133346' },
            value:
              'H|\\\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\\r\\x0392\\r\\n',
            P1: {
              '1': { value: 'P' },
              '2': { value: '1' },
              '3': { value: '' },
              '4': { value: '' },
              '5': { value: 'PIDSID13' },
              '6': {
                '1': {
                  '1': { value: 'Patient' },
                  '2': { value: 'Im' },
                  '3': { value: 'A' },
                  value: 'Patient Im A',
                },
                '2': { value: '' },
                '3': {
                  '1': { value: 'And' },
                  '2': { value: 'This' },
                  '3': { value: 'Is' },
                  '4': { value: 'My' },
                  '5': { value: 'Wife' },
                  value: 'And This Is My Wife',
                },
                value: 'Patient Im A\nAnd This Is My Wife',
              },
              '7': { value: '19320122' },
              '8': { value: 'F' },
              '9': { value: '' },
              '10': { value: 'Dr.Amesbury' },
              '11': { value: 'ParkClinic' },
              value:
                'P|1|||PIDSID13|Patient^Im^A\\\\And^This^Is^My^Wife|19320122|F||Dr.Amesbury|ParkClinic\\r\\x033F\\r\\n',
              O1: {
                '1': { value: 'O' },
                '2': { value: '1' },
                '3': { value: 'SID13' },
                '4': {
                  '1': { value: 'SID3' },
                  '2': { value: 'A123' },
                  '3': { value: '5' },
                  value: 'SID3 A123 5',
                },
                '5': {
                  '1': { value: '' },
                  '2': { value: '' },
                  '3': { value: '' },
                  '4': { value: '123' },
                  '5': { value: 'Assay1' },
                  '6': { value: 'UNDILUTED' },
                  '7': { value: 'P' },
                  value: '123 Assay1 UNDILUTED P',
                },
                '6': { value: 'R' },
                '7': { value: '' },
                '8': { value: '20010223081223' },
                '9': { value: '' },
                '10': { value: 'F' },
                value:
                  'O|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||F\\r\\x03D0\\r\\n',
                R1: {
                  '1': { value: 'R' },
                  '2': { value: '1' },
                  '3': {
                    '1': { value: '' },
                    '2': { value: '' },
                    '3': { value: '' },
                    '4': { value: '0021' },
                    '5': { value: 'B-hCG' },
                    '6': { value: 'UNDILUTED' },
                    '7': { value: 'P' },
                    '8': { value: '47331M100' },
                    '9': { value: '00788' },
                    '10': { value: '' },
                    '11': { value: 'F' },
                    value: '0021 B-hCG UNDILUTED P 47331M100 00788 F',
                  },
                  '4': { value: '<1.20' },
                  '5': { value: 'mIU/mL' },
                  '6': { value: '0.35 TO 4.94' },
                  '7': {
                    '1': { value: 'EXP' },
                    '2': { value: '<' },
                    value: 'EXP <',
                  },
                  '8': { value: 'F' },
                  '9': { value: '' },
                  '10': { value: '19990715081030' },
                  '11': { value: 'I20100' },
                  value:
                    'R|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<|F||19990715081030|I20100\\r\\x03E2\\r\\n',
                },
                results: ['R1', 'R2', 'R3'],
                R2: {
                  '1': { value: 'R' },
                  '2': { value: '2' },
                  '3': {
                    '1': { value: '' },
                    '2': { value: '' },
                    '3': { value: '' },
                    '4': { value: '0021' },
                    '5': { value: 'B-hCG' },
                    '6': { value: 'UNDILUTED' },
                    '7': { value: 'P' },
                    '8': { value: '47331M100' },
                    '9': { value: '00788' },
                    '10': { value: '' },
                    '11': { value: 'I' },
                    value: '0021 B-hCG UNDILUTED P 47331M100 00788 I',
                  },
                  '4': { value: 'NEGATIVE' },
                  '5': { value: '' },
                  '6': { value: '' },
                  '7': { value: '' },
                  '8': { value: 'F' },
                  '9': { value: '' },
                  '10': { value: '19990715081030' },
                  '11': { value: 'I20100' },
                  value:
                    'R|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE||||F||19990715081030|I20100\\r\\x0343\\r\\n',
                },
                R3: {
                  '1': { value: 'R' },
                  '2': { value: '3' },
                  '3': {
                    '1': { value: '' },
                    '2': { value: '' },
                    '3': { value: '' },
                    '4': { value: '0021' },
                    '5': { value: 'B-hCG' },
                    '6': { value: 'UNDILUTED' },
                    '7': { value: 'P' },
                    '8': { value: '47331M100' },
                    '9': { value: '00788' },
                    '10': { value: '' },
                    '11': { value: 'P' },
                    value: '0021 B-hCG UNDILUTED P 47331M100 00788 P',
                  },
                  '4': { value: '9245' },
                  '5': { value: 'RLU' },
                  '6': { value: '' },
                  '7': { value: '' },
                  '8': { value: 'F' },
                  '9': { value: '' },
                  '10': { value: '19990715081030' },
                  '11': { value: 'I20100' },
                  value:
                    'R|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU|||F||19990715081030|I20100\\r\\x0343\\r\\n',
                  C1: {
                    '1': { value: 'C' },
                    '2': { value: '1' },
                    '3': { value: 'I' },
                    '4': { value: 'Example Result Comment' },
                    '5': { value: 'G' },
                    value: '\nC|1|I|Example Result Comment|G\\r\\x0343\\r\\n',
                  },
                  comments: ['C1'],
                },
                C1: {
                  '1': { value: 'C' },
                  '2': { value: '1' },
                  '3': { value: 'I' },
                  '4': { value: 'Example Order Comment' },
                  '5': { value: 'G' },
                  value: '\nC|1|I|Example Order Comment|G\\r\\x0343\\r\\n',
                },
                comments: ['C1'],
              },
              orders: ['O1'],
              C1: {
                '1': { value: 'C' },
                '2': { value: '1' },
                '3': { value: 'I' },
                '4': { value: 'Example Patient Comment' },
                '5': { value: 'G' },
                value: 'C|1|I|Example Patient Comment|G\\r\\x0343\\r\\n',
              },
              comments: ['C1'],
            },
            patients: ['P1'],
            Q1: {
              '1': { value: 'Q' },
              '2': { value: '1' },
              '3': {
                '1': { value: '' },
                '2': { value: 'SID12345' },
                value: 'SID12345',
              },
              '4': { value: '' },
              '5': {
                '1': { value: '' },
                '2': { value: '' },
                '3': { value: '' },
                '4': { value: 'ALL' },
                value: 'ALL',
              },
              '6': { value: '' },
              '7': { value: 'O' },
              value: 'Q|1|^SID12345||^^^ALL||O\\r\\x0343\\r\\n',
            },
            enquiries: ['Q1'],
            C1: {
              '1': { value: 'C' },
              '2': { value: '1' },
              '3': { value: 'I' },
              '4': { value: 'Example Message Comment' },
              '5': { value: 'G' },
              value: 'C|1|I|Example Message Comment|G\\r\\x0343\\r\\n',
            },
            comments: ['C1'],
          },
          L: {
            '1': { value: 'L' },
            '2': { value: '1' },
            value: 'L|1\\r\\x033F\\r\\n',
          },
        },
        {
          value:
            'H|\\\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\\r\\x0392\\r\\n\nP|1\\r\\x033F\\r\\n\nO|1|TSHBIORAD 2|TSHBIORAD 2^A123^2|^^^0241^TSH^UNDILUTED^P|R|||Q|F\\r\\x03D0\\r\\n\nR|1|^^^0241^TSH^UNDILUTED^P^0607M200^01824^40080^F|4.6011|mIU/mL|4.292500 TO 5.397300||F|ECB^RY|19990715081030|I20100\\r\\x03E2\\r\\n\nL|1\\r\\x033F\\r\\n',
          H: {
            '1': { value: 'H' },
            '2': {
              '1': { value: '' },
              '2': { value: '' },
              '3': {
                '1': { value: '' },
                '2': { value: '|' },
                value: '|',
              },
              value: '|',
            },
            '3': { value: '' },
            '4': {
              '1': { value: 'Name of Instrument' },
              '2': { value: '1.0.0.0' },
              value: 'Name of Instrument 1.0.0.0',
            },
            '5': { value: 'P' },
            '6': { value: '1' },
            '7': { value: '19930330133346' },
            value:
              'H|\\\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\\r\\x0392\\r\\n',
            P1: {
              '1': { value: 'P' },
              '2': { value: '1' },
              value: 'P|1\\r\\x033F\\r\\n',
              O1: {
                '1': { value: 'O' },
                '2': { value: '1' },
                '3': { value: 'TSHBIORAD 2' },
                '4': {
                  '1': { value: 'TSHBIORAD 2' },
                  '2': { value: 'A123' },
                  '3': { value: '2' },
                  value: 'TSHBIORAD 2 A123 2',
                },
                '5': {
                  '1': { value: '' },
                  '2': { value: '' },
                  '3': { value: '' },
                  '4': { value: '0241' },
                  '5': { value: 'TSH' },
                  '6': { value: 'UNDILUTED' },
                  '7': { value: 'P' },
                  value: '0241 TSH UNDILUTED P',
                },
                '6': { value: 'R' },
                '7': { value: '' },
                '8': { value: '' },
                '9': { value: 'Q' },
                '10': { value: 'F' },
                value:
                  'O|1|TSHBIORAD 2|TSHBIORAD 2^A123^2|^^^0241^TSH^UNDILUTED^P|R|||Q|F\\r\\x03D0\\r\\n',
                R1: {
                  '1': { value: 'R' },
                  '2': { value: '1' },
                  '3': {
                    '1': { value: '' },
                    '2': { value: '' },
                    '3': { value: '' },
                    '4': { value: '0241' },
                    '5': { value: 'TSH' },
                    '6': { value: 'UNDILUTED' },
                    '7': { value: 'P' },
                    '8': { value: '0607M200' },
                    '9': { value: '01824' },
                    '10': { value: '40080' },
                    '11': { value: 'F' },
                    value: '0241 TSH UNDILUTED P 0607M200 01824 40080 F',
                  },
                  '4': { value: '4.6011' },
                  '5': { value: 'mIU/mL' },
                  '6': { value: '4.292500 TO 5.397300' },
                  '7': { value: '' },
                  '8': { value: 'F' },
                  '9': {
                    '1': { value: 'ECB' },
                    '2': { value: 'RY' },
                    value: 'ECB RY',
                  },
                  '10': { value: '19990715081030' },
                  '11': { value: 'I20100' },
                  value:
                    'R|1|^^^0241^TSH^UNDILUTED^P^0607M200^01824^40080^F|4.6011|mIU/mL|4.292500 TO 5.397300||F|ECB^RY|19990715081030|I20100\\r\\x03E2\\r\\n',
                },
                results: ['R1'],
              },
              orders: ['O1'],
            },
            patients: ['P1'],
          },
          L: {
            '1': { value: 'L' },
            '2': { value: '1' },
            value: 'L|1\\r\\x033F\\r\\n',
          },
        },
      ]
      const messagesInJson = astmE1394MessagesToJson(astmPayload)
      assert.deepEqual(messagesInJson, expectedJsonResult)
    })
  })
})

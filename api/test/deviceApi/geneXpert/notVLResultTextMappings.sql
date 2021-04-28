SELECT DISTINCT
    CASE
        WHEN
            resultcode2.Name IS NULL
        THEN
            CONCAT('getAssertionItem(\'',
                    CASE
                        WHEN
                            AssayName IN ('Xpert MTB-RIF Assay G4' , 'XpB-RIF',
                                'Xp-RIF',
                                'Xpert-RIF',
                                'XpertRIF',
                                'XpertIF',
                                'XpertB-RIF',
                                'XpertTB-RIF',
                                'XpertMTB-RIF',
                                'Xpert MTB-RIF G3',
                                'Xpert MTB-RIF G2',
                                'MTB-RIF Assay G4',
                                'Xpert MTB-RIF US IVD',
                                'Xpert MTB-RIF Ultra',
                                'MTB-RIF Ultra RUO 2')
                        THEN
                            'GxMtbRif'
                        ELSE (CASE
                            WHEN AssayName IN ('Ebola RUO' , 'Xpert Ebola CE-IVD') THEN 'GxEbola'
                            ELSE (CASE
                                WHEN AssayName IN ('Xpert HIV-1 Qual' , 'Xpert_HIV-1 Qual') THEN 'GxHiv1Qual'
                                ELSE (CASE
                                    WHEN AssayName IN ('Xpert Xpress SARS-CoV-2') THEN 'assayGXCovid19'
                                    ELSE AssayName
                                END)
                            END)
                        END)
                    END,
                    '\', \'',
                    ResultText,
                    '\', \'',
                    CASE
                        WHEN
                            AssayName != 'Xpert Xpress SARS-CoV-2'
                                AND resultcode1.Name = 'Negative'
                        THEN
                            'NotDetected'
                        ELSE (CASE
                            WHEN
                                AssayName != 'Xpert Xpress SARS-CoV-2'
                                    AND resultcode1.Name = 'Positive'
                            THEN
                                'Detected'
                            ELSE REPLACE(resultcode1.Name, 'No Result', 'NoResult')
                        END)
                    END,
                    '\', null),')
        ELSE CONCAT('getAssertionItem(\'',
                CASE
                    WHEN
                        AssayName IN ('Xpert MTB-RIF Assay G4', 
							'XpB-RIF',
                            'Xp-RIF',
                            'Xpert-RIF',
                            'XpertRIF',
                            'XpertIF',
                            'XpertB-RIF',
                            'XpertTB-RIF',
                            'XpertMTB-RIF',
                            'Xpert MTB-RIF G3',
                            'Xpert MTB-RIF G2',
                            'MTB-RIF Assay G4',
                            'Xpert MTB-RIF US IVD')
                    THEN
                        'GxMtbRif'
                    ELSE (CASE
                        WHEN AssayName IN ('Ebola RUO' , 'Xpert Ebola CE-IVD') THEN 'GxEbola'
                        ELSE (CASE
                            WHEN AssayName IN ('Xpert HIV-1 Qual' , 'Xpert_HIV-1 Qual') THEN 'GxHiv1Qual'
                            ELSE (CASE
                                WHEN AssayName IN ('Xpert Xpress SARS-CoV-2') THEN 'assayGXCovid19'
                                ELSE (
                                CASE WHEN AssayName IN (
									'Xpert MTB-RIF Ultra',
									'MTB-RIF Ultra RUO 2')
								THEN 'GxMtbRifUltra'
                                ELSE AssayName
                                END
                                )
                            END)
                        END)
                    END)
                END,
                '\', \'',
                ResultText,
                '\', \'',
                CASE
                    WHEN
                        AssayName != 'Xpert Xpress SARS-CoV-2'
                            AND resultcode1.Name = 'Negative'
                    THEN
                        'NotDetected'
                    ELSE (CASE
                        WHEN
                            AssayName != 'Xpert Xpress SARS-CoV-2'
                                AND resultcode1.Name = 'Positive'
                        THEN
                            'Detected'
                        ELSE REPLACE(REPLACE(resultcode1.Name, 'No Result', 'NoResult'), 'Trace', 'Trace Detected')
                    END)
                END,
                '\', \'',
                CASE
                    WHEN
                        AssayName != 'Xpert Xpress SARS-CoV-2'
                            AND resultcode2.Name = 'Negative'
                    THEN
                        'NotDetected'
                    ELSE (CASE
                        WHEN
                            AssayName != 'Xpert Xpress SARS-CoV-2'
                                AND resultcode2.Name = 'Positive'
                        THEN
                            'Detected'
                        ELSE REPLACE(REPLACE(resultcode2.Name, 'No Result', 'NoResult'), 'Trace', 'Trace Detected')
                    END)
                END,
                '\'),')
    END
FROM
    bigpicture.test
        INNER JOIN
    bigpicture.resultcode AS resultcode1 ON test.result1 = resultcode1.ResultCodeId
        LEFT JOIN
    bigpicture.resultcode AS resultcode2 ON test.result2 = resultcode2.ResultCodeId
WHERE
    AssayName NOT IN ('Xpert HIV-1 Viral Load' , 'Xpert_HIV-1 Viral Load',
        'Xpert HCV Viral Load',
        'Xpert_HCV Viral Load',
        'HCV VL WB RUO',
        'Xpert',
        'XpertF',
        'XpIF',
        5,
        'P0644 v1 50�l Tube Base',
        'XperRIF 2')
ORDER BY AssayName , ResultText , Result1 , Result2;
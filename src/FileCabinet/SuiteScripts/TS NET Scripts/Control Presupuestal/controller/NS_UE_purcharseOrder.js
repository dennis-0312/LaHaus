/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(['N/log','N/record','N/search','N/error'], function(log,record,search,error) {
    const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal';
    const CONTROL_PRESUPUESTAL_RESERVADO_PO = 'customsearch_control_ppto_reservado_po'; //Control Presupuestal RESERVADO PO - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_RESERVADO_ER = 'customsearch_control_ppto_reservado_er'; //Control Presupuestal RESERVADO ER - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_COMPROMETIDO = 'customsearch_control_ppto_comprometido'; //Control Presupuestal COMPROMETIDO - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_EJECUTADO = 'customsearch_control_ppto_ejecutado'; //Control Presupuestal EJECUTADO - PRODUCCIÓN
    const TIPO_CAMBIO_SEARCH = 'customsearch_co_tipo_cambio'; //CO Tipo Cambio Search - CP PRODUCCION
    const CATEGORIA_PPTO_PERIODOS = 'customsearch_co_categoria_ppto_periodos'; //CO Categoria Presupuesto Periodos Search - CP PRODUCCION
    const PRESUPUESTO_TRIMESTRAL = ''
    const arregloTrimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
    const anual = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const TEMPORALIDAD_MENSUAL = 1;
    const TEMPORALIDAD_TRIMESTRAL = 2;
    const TEMPORALIDAD_ANUAL = 3;
    const DESVIACION_ADVERTENCIA = 1;
    const DESVIACION_BLOQUEO = 2;
    const CECO_NIVEL_CONTROL = 1;
    const CUENTA_NIVEL_CONTROL = 2;
    const CATEGORIA_NIVEL_CONTROL = 3;

    let typeMode = '';
    let cop = 0;
    let mxn = 0;
    const beforeLoad = (scriptContext) => {
        const objRecord = scriptContext.newRecord;
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
            try {
                let transaction = objRecord.getValue({ fieldId: 'ntype' });
                let config = getConfig(transaction);
                if (config != 0) {
                    objRecord.setValue('custbody_lh_temporalidad_flag', config.temporalidad);
                    objRecord.setValue('custbody_lh_nivel_control_flag', config.nivelControl);
                    objRecord.setValue('custbody_lh_desviacion_flag', config.desviacion);
                }
                log.debug('Error: ' + config);
            } catch (error) {
                log.debug('Error-BL', error);
            }
        }
    }

    function beforeSubmit(scriptContext) {
        const objRecord = scriptContext.newRecord;
        let importacion = objRecord.getValue('custbody_lh_importacion_csv');
        if(importacion){
            if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                let tipoCambio = getTipoCambio();
        
                if (tipoCambio.co == 0 || tipoCambio.mx == 0) {
                    var myCustomError = error.create({
                        name: 'EventError',
                        message: 'No se encuentra un tipo de cambio',
                        notifyOff: false
                    });
                    throw myCustomError;
                } else {
                    cop = tipoCambio.co;
                    mxn = tipoCambio.mx;
                }
                let json = new Array();
                let msgCriterio = '';
                let msgVacio = ''
                let temporalidad = objRecord.getValue('custbody_lh_temporalidad_flag');
                var numLines = objRecord.getLineCount({sublistId: 'item'});
                
                for (let i = 0; i < numLines; i++) {
                    log.debug('numLines',i);
                    if (temporalidad != 0) {
                        let status = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_approval_status',line: i });

                            if (status == 1) {
                                let nivelControl = parseInt(objRecord.getValue('custbody_lh_nivel_control_flag'));
                                log.debug('nivelControl',nivelControl);
                                let desviacion = objRecord.getValue('custbody_lh_desviacion_flag');
                                let date = objRecord.getValue({ fieldId: 'trandate' });
                                date = sysDate(date); //! sysDate (FUNCTION)
                                // console.log(date);
                            
                                let month = date.month;
                                let criterioControl = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'department',line: i });
                                let criterioControlCategoria = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_categoria_ppto_oc',line: i });
                                switch (nivelControl) {
                                    case CECO_NIVEL_CONTROL:
                                        msgCriterio = 'No tiene presupuesto para este centro de costo.';
                                        msgVacio = 'Debe ingresar un centro de costo.';
                                        break;
                                    case CUENTA_NIVEL_CONTROL:
                                        msgCriterio = 'No tiene presupuesto para esta cuenta.';
                                        msgVacio = 'Debe ingresar una cuenta.';
                                        break;
                                    case CATEGORIA_NIVEL_CONTROL:
                                        msgVacio = 'Debe ingresar un centro de costo.';
                                        if (criterioControlCategoria.length == 0) {
                                            var myCustomError = error.create({
                                                name: 'EventError',
                                                message: 'Debe ingresar una categoría',
                                                notifyOff: false
                                            });
                                            throw myCustomError;
                                            
                                        }
                                        
                                        msgCriterio = 'No tiene presupuesto para este centro de costo.';
                                       
                                        break;
                                    default:
                                        msgCriterio = 'Revisar la configuración del Nivel de Control.'
                                        break;
                                }
            
                                if (criterioControl.length == 0) {
                                    var myCustomError = error.create({
                                        name: 'EventError',
                                        message: msgVacio,
                                        notifyOff: false
                                    });
                                    throw myCustomError;
                                }
                                let quantity = parseInt(objRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity' ,line: i }));
                                let quantityBilled = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantitybilled',line: i  });
                            
                                quantityBilled = typeof quantityBilled == 'undefined' ? 0 : parseInt(quantityBilled);
                            
                                let rate = parseFloat(objRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate',line: i }));
                                let solicitud = (quantity - quantityBilled) * rate;
                            
                                json = [criterioControl, quantity, quantityBilled, rate, status];
                               
                                
                                let disponible = getDisponible(temporalidad, month, date.year, criterioControl, objRecord,i); //! getDisponible (FUNCTION)
                                
                                
                                log.debug('solicitud',solicitud);
                                log.debug('disponible',disponible);
                                        if (disponible <= solicitud) {
                                            i=i+1;
                                            var myCustomError = error.create({
                                                name: 'EventError',
                                                message: 'No Tienes presupuesto disponible en la linea '+i,
                                                notifyOff: false
                                            });
                                            throw myCustomError;
                                        
                                        }

                            } 

                
                    }
                }
            
            }
        }
    }
    const getTipoCambio = () => {
        let objSearch = search.load({ id: TIPO_CAMBIO_SEARCH });
        // let filters = objSearch.filters;
        // const filterOne = search.createFilter({ name: 'custrecord_lh_tc_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
        // filters.push(filterOne);
        // const filterTwo = search.createFilter({ name: 'custrecord_lh_tc_periodo', operator: search.Operator.ANYOF, values: internalidPeriod });
        // filters.push(filterTwo);
        let searchResultCount = objSearch.runPaged().count;
        let co = 0;
        let mx = 0;
        if (searchResultCount != 0) {
            let result = objSearch.run().getRange({ start: 0, end: 50 });
            //console.log('result', JSON.stringify(result));
            for (let i in result) {
                let symbol = result[i].getValue({ name: "symbol", join: "CUSTRECORD_LH_TC_MONEDA", summary: "GROUP" });
                if (symbol == 'COP') {
                    co = parseFloat(result[i].getValue({ name: "custrecord_lh_tc_tipo_cambio", summary: "GROUP" }));
                }

                if (symbol == 'MXN') {
                    mx = parseFloat(result[i].getValue({ name: "custrecord_lh_tc_tipo_cambio", summary: "GROUP" }));
                }
            }
            return { co: co, mx: mx }
        } else {
            return { co: co, mx: mx }
        }
    }

    const getDisponible = (temporalidad, month, year, criterioControl, objRecord,i) => {
        let tempo = 0;
        
            if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
                //!const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
                for (let i in arregloTrimestre) {
                    let bloque = arregloTrimestre[i].includes(month.toString());
                    if (bloque == true) {
                        tempo = parseInt(i);
                        break;
                    }
                }
            }

            let presupuestado = getPresupuesto(criterioControl, tempo, year);
          
            if (presupuestado.presupuesto == 0 || presupuestado.categoria == 0) {

                var myCustomError = error.create({
                    name: 'EventError',
                    message: 'No tiene una categoría de presupuesto o no tiene un monto presupuestado.',
                    notifyOff: false
                });
                throw myCustomError;
            }
            objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_ppto_flag', value: presupuestado.categoria ,line:i});
            let reservado = getReservado(temporalidad, tempo, year, presupuestado.categoria);
            let comprometido = getComprometido(temporalidad, tempo, year, presupuestado.categoria);
            let ejecutado = getEjecutado(temporalidad, tempo, year, presupuestado.categoria);
           
            let disponible = presupuestado.presupuesto - (reservado + comprometido + ejecutado);
            return disponible;
    
    }


    const getPresupuesto = (criterioControl, tempo, year) => {
        let presupuesto = 0;
        let categoria = 0;
        const presupuestado = search.create({
            type: "customrecord_lh_presupuesto_trimestral",
            filters:
                [
                    ["custrecord_lh_detalle_cppto_status_tr", "anyof", "1"],
                    "AND",
                    ["custrecord_lh_detalle_cppto_categoria_tr.custrecord_lh_cp_centro_costo", "anyof", parseInt( criterioControl)],
                    "AND",
                    ["custrecord_lh_detalle_cppto_anio_tr.name", "haskeywords", parseInt(year)]
                ],
            columns:
                [
                    search.createColumn({ name: "custrecord_lh_detalle_cppto_categoria_tr", label: "0 Categoría" }),
                    search.createColumn({ name: "custrecord_lh_detalle_cppto_" + parseInt(tempo), label: "1 Trimestre" }),
                ]
        });
       
        let resultCount = presupuestado.runPaged().count;
    
        log.debug('resultCount',resultCount);
        if (resultCount != 0) {
            let result = presupuestado.run().getRange({ start: 0, end: 1 });
            //console.log('ReservadoPO', JSON.stringify(resultPO));
            categoria = result[0].getValue(presupuestado.columns[0]);
            presupuesto = parseFloat(result[0].getValue(presupuestado.columns[1]));
            //console.log(categoria + ' - ' + presupuesto);
        }

        return {
            categoria: categoria,
            presupuesto: presupuesto,
        }
    }



    const getReservado = (temporalidad, tempo, year, categoria) => {
        let categoriappto = 0;
        let reservadopo = 0;
        let reservadoer = 0;
        let formulaTemporalidad = '';
        let operator = ''
        let from = '';
        let to = '';
        //*=========================================================================================================================================================
        // const reservadoPo = search.load({ id: CONTROL_PRESUPUESTAL_RESERVADO_PO });
        // let filters = reservadoPo.filters;
        // const filterOne = search.createFilter({ name: 'custcol_lh_ppto_flag', operator: search.Operator.ANYOF, values: categoria });
        // filters.push(filterOne);
        // const filterTwo = search.createFilter({ name: 'formulatext', formula: 'TO_CHAR(EXTRACT(YEAR FROM {trandate}))', operator: search.Operator.STARTSWITH, values: year });
        // filters.push(filterTwo);
        // if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
        //     const filterThree = search.createFilter({ name: 'formulanumeric', formula: 'ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)', operator: search.Operator.EQUALTO, values: tempo });
        //     filters.push(filterThree);
        // }
        // let searchResultCountPO = reservadoPo.runPaged().count;
        // //console.log('CountPO', searchResultCountPO);
        // if (searchResultCountPO != 0) {
        //     let resultPO = reservadoPo.run().getRange({ start: 0, end: 1 });
        //     //console.log('ReservadoPO', JSON.stringify(resultPO));
        //     let categoriappto = resultPO[0].getValue({ name: "custcol_lh_ppto_flag", summary: "GROUP" });
        //     reservadopo = parseFloat(resultPO[0].getValue({ name: "formulacurrency", summary: "SUM", formula: "DECODE({currency.symbol}, 'MXN', NVL({rate},0)/20,'COP',NVL({rate},0)/3600,NVL({rate},0)*({quantity}-{quantitybilled}))" }));
        //     console.log('PO: ' + categoriappto + ' - ' + reservadopo)
        // } else {
        //     reservadopo = 0;
        // }
        // console.log(typeof cop + ' --- ' + typeof mxn)

        if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
            //formulaTemporalidad = "formulanumeric: ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)";
            //operator = "equalto"
            formulaTemporalidad = "trandate"
            operator = "within"
        }

        switch (tempo) {
            case 0:
                from = "1/1/" + year;
                to = "31/3/" + year;
                break;
            case 1:
                from = "1/4/" + year;
                to = "30/6/" + year;
                break;
            case 2:
                from = "1/7/" + year;
                to = "30/9/" + year;
                break;
            case 3:
                from = "1/10/" + year;
                to = "31/12/" + year;
                break;
            default:
                from = 0;
                to = 0;
                break;
        }

        if (from == 0 || to == 0) {
            alert('Vlidar temporalidad, fechas.');
            return false;
        }

        const reservadoPo = search.create({
            type: "purchaseorder",
            filters:
                [
                    ["type", "anyof", "PurchOrd"],
                    "AND",
                    ["custcol_lh_approval_status", "anyof", "1"],
                    "AND",
                    ["formulanumeric: {quantity} - {quantitybilled}", "greaterthan", "0"],
                    "AND",
                    ["custcol_lh_ppto_flag", "anyof", categoria],
                    // "AND",
                    // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
                    "AND",
                    [formulaTemporalidad, operator, from, to]
                ],
            columns:
                [
                    search.createColumn({
                        name: "custcol_lh_ppto_flag",
                        summary: "GROUP",
                        label: "0 Categoría de Presupuesto"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "DECODE({currency.symbol}, 'MXN', NVL({fxrate},0)/" + mxn + ",'COP',NVL({fxrate},0)/" + cop + ",NVL({fxrate},0)*({quantity}-{quantitybilled}))",
                        label: "1 Formula (Currency)"
                    })
                ]
        });
        let searchResultCountPO = reservadoPo.runPaged().count;
        if (searchResultCountPO != 0) {
            let resultPO = reservadoPo.run().getRange({ start: 0, end: 1 });
            categoriappto = resultPO[0].getValue(reservadoPo.columns[0]);
            reservadopo = parseFloat(resultPO[0].getValue(reservadoPo.columns[1]));
            //console.log(categoriappto + ' - ' + reservadopo);
        } else {
            reservadopo = 0;
        }
        //*=========================================================================================================================================================
        // let reservadoEr = search.load({ id: CONTROL_PRESUPUESTAL_RESERVADO_ER });
        // let filtersEr = reservadoEr.filters;
        // const filterOneEr = search.createFilter({ name: 'custcol_lh_ppto_flag', operator: search.Operator.ANYOF, values: categoria });
        // filtersEr.push(filterOneEr);
        // const filterTwoEr = search.createFilter({ name: 'formulatext', formula: 'TO_CHAR(EXTRACT(YEAR FROM {trandate}))', operator: search.Operator.STARTSWITH, values: year });
        // filtersEr.push(filterTwoEr);
        // if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
        //     const filterThreeEr = search.createFilter({ name: 'formulanumeric', formula: 'ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)', operator: search.Operator.EQUALTO, values: tempo });
        //     filtersEr.push(filterThreeEr);
        // }

        const reservadoEr = search.create({
            type: "expensereport",
            filters:
                [
                    ["approvalstatus", "anyof", "1", "3"],
                    "AND",
                    ["type", "anyof", "ExpRept"],
                    "AND",
                    ["memorized", "is", "F"],
                    "AND",
                    ["formulanumeric: NVL({debitamount},0) + NVL({creditamount},0)", "greaterthan", "0"],
                    "AND",
                    ["posting", "is", "F"],
                    "AND",
                    ["formulatext: NVL({account},'X')", "isnot", "X"],
                    "AND",
                    ["custcol_lh_ppto_flag", "anyof", categoria],
                    // "AND",
                    // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
                    "AND",
                    [formulaTemporalidad, operator, from, to]
                ],
            columns:
                [
                    search.createColumn({
                        name: "custcol_lh_ppto_flag",
                        summary: "GROUP",
                        label: "Categoría de Presupuesto"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "DECODE({currency.symbol}, 'MXN', (NVL({debitamount},0)-NVL({creditamount},0)) /" + mxn + ", 'COP',  (NVL({debitamount},0)-NVL({creditamount},0)) /" + cop + ", (NVL({debitamount},0)-NVL({creditamount},0)))* DECODE({accounttype}, 'Equity', -1, 'Income',  -1, 'Other Income', -1, 'Accounts Payable', -1, 'Credit Card', -1, 'Deferred Revenue', -1, 'Long Term Liability', -1, 'Other Current Liability', -1, 1)",
                        label: "Formula (Currency)"
                    })
                ]
        });

        let searchResultCountER = reservadoEr.runPaged().count;
        if (searchResultCountER != 0) {
            let resultER = reservadoEr.run().getRange({ start: 0, end: 1 });
            categoriappto = resultER[0].getValue(reservadoPo.columns[0]);
            reservadoer = parseFloat(resultER[0].getValue(reservadoPo.columns[1]));
            //console.log('ER: ' + categoriappto + ' - ' + reservadoer)
        } else {
            reservadoer = 0;
        }
        //*=========================================================================================================================================================
        //TODO-SUMA ===============================================================================================
        //console.log(reservadopo + ' + ' + reservadoer);
        return reservadopo + reservadoer;
    }


    const getComprometido = (temporalidad, tempo, year, categoria) => {
        let categoriappto = 0;
        let comprometido = 0;
        let formulaTemporalidad = '';
        let operator = ''
        let from = '';
        let to = '';

        if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
            formulaTemporalidad = "trandate"
            operator = "within"
        }

        switch (tempo) {
            case 0:
                from = "1/1/" + year;
                to = "31/3/" + year;
                break;
            case 1:
                from = "1/4/" + year;
                to = "30/6/" + year;
                break;
            case 2:
                from = "1/7/" + year;
                to = "30/9/" + year;
                break;
            case 3:
                from = "1/10/" + year;
                to = "31/12/" + year;
                break;
            default:
                from = 0;
                to = 0;
                break;
        }

        if (from == 0 || to == 0) {
            alert('Vlidar temporalidad, fechas.');
            return false;
        }

        const searchComprometido = search.create({
            type: "purchaseorder",
            filters:
                [
                    ["type", "anyof", "PurchOrd"],
                    "AND",
                    ["custcol_lh_approval_status", "anyof", "2"],
                    "AND",
                    ["formulanumeric: {quantity} - {quantitybilled}", "greaterthan", "0"],
                    "AND",
                    ["custcol_lh_ppto_flag", "anyof", categoria],
                    // "AND",
                    // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
                    "AND",
                    [formulaTemporalidad, operator, from, to]
                ],
            columns:
                [
                    search.createColumn({
                        name: "custcol_lh_ppto_flag",
                        summary: "GROUP",
                        label: "0 Categoría de Presupuesto"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "DECODE({currency.symbol}, 'MXN', NVL({fxrate},0)/" + mxn + ",'COP',NVL({fxrate},0)/" + cop + ",NVL({fxrate},0)*({quantity}-{quantitybilled}))",
                        label: "1 Formula (Currency)"
                    })
                ]
        });
        let resultCount = searchComprometido.runPaged().count;
        if (resultCount != 0) {
            let result = searchComprometido.run().getRange({ start: 0, end: 1 });
            categoriappto = result[0].getValue(searchComprometido.columns[0]);
            comprometido = parseFloat(result[0].getValue(searchComprometido.columns[1]));
            //console.log('CO: ' + categoriappto + ' - ' + comprometido)
        } else {
            comprometido = 0;
        }
        return comprometido;
    }


    const getEjecutado = (temporalidad, tempo, year, categoria) => {
        let categoriappto = 0;
        let ejecutado = 0;
        let formulaTemporalidad = '';
        let operator = ''
        let from = '';
        let to = '';

        if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
            formulaTemporalidad = "trandate"
            operator = "within"
        }

        switch (tempo) {
            case 0:
                from = "1/1/" + year;
                to = "31/3/" + year;
                break;
            case 1:
                from = "1/4/" + year;
                to = "30/6/" + year;
                break;
            case 2:
                from = "1/7/" + year;
                to = "30/9/" + year;
                break;
            case 3:
                from = "1/10/" + year;
                to = "31/12/" + year;
                break;
            default:
                from = 0;
                to = 0;
                break;
        }

        if (from == 0 || to == 0) {
            alert('Vlidar temporalidad, fechas.');
            return false;
        }

        const searchEjecutado = search.create({
            type: "transaction",
            filters:
                [
                    [["account.custrecordlh_aplica_ppto", "is", "T"], "AND", ["type", "anyof", "Journal"], "AND", [formulaTemporalidad, operator, from, to], "AND", ["custcol_lh_ppto_flag", "anyof", categoria]],
                    "OR",
                    [["approvalstatus", "anyof", "2"], "AND", ["type", "anyof", "VendBill", "ExpRept"], "AND", [formulaTemporalidad, operator, from, to], "AND", ["custcol_lh_ppto_flag", "anyof", categoria]],
                    "OR",
                    [["type", "anyof", "VendCred"], "AND", [formulaTemporalidad, operator, from, to], "AND", ["custcol_lh_ppto_flag", "anyof", categoria]],
                    "AND",
                    ["memorized", "is", "F"],
                    "AND",
                    ["formulanumeric: NVL({debitamount},0) + NVL({creditamount},0)", "greaterthan", "0"],
                    "AND",
                    ["posting", "is", "T"],
                    "AND",
                    ["formulatext: NVL({account},'X')", "isnot", "X"]
                ],
            columns:
                [
                    search.createColumn({
                        name: "custcol_lh_ppto_flag",
                        summary: "GROUP",
                        label: "Categoría de Presupuesto"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "DECODE({currency.symbol}, 'MXN', (NVL({debitamount},0)-NVL({creditamount},0))/" + mxn + ", 'COP',  (NVL({debitamount},0)-NVL({creditamount},0))/" + cop + ", (NVL({debitamount},0)-NVL({creditamount},0))/" + cop + ")* DECODE({accounttype}, 'Equity', -1, 'Income',  -1, 'Other Income', -1, 'Accounts Payable', -1, 'Credit Card', -1, 'Deferred Revenue', -1, 'Long Term Liability', -1, 'Other Current Liability', -1, 1)",
                        label: "Formula (Currency)"
                    })
                ]
        });

        let resultCount = searchEjecutado.runPaged().count;
        if (resultCount != 0) {
            let result = searchEjecutado.run().getRange({ start: 0, end: 1 });
            categoriappto = result[0].getValue(searchEjecutado.columns[0]);
            ejecutado = parseFloat(result[0].getValue(searchEjecutado.columns[1]));
        } else {
            ejecutado = 0;
        }
        return ejecutado;
    }

    const sysDate = (date_param) => {
        try {
            let date = new Date(date_param);
            let month = date.getMonth() + 1; // jan = 0
            let year = date.getFullYear();
            month = month <= 9 ? '0' + month : month;
            return {
                month: month,
                year: year
            }
        } catch (e) {
            console.log('Error-sysDate', e);
        }
    }
    const getConfig = (transaction) => {
        try {
            let objSearch = search.load({ id: CONFIG_PPTO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_cp_transaccion', operator: search.Operator.ANYOF, values: transaction });
            filters.push(filterOne);
            const filterThree = search.createFilter({ name: 'custrecord_lh_cp_flujo_aprobacion', operator: search.Operator.IS, values: true });
            filters.push(filterThree);

            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount != 0) {
                let resultConfig = objSearch.run().getRange({ start: 0, end: 1 });
                let temporalidad = resultConfig[0].getValue({ name: "custrecord_lh_cp_temporalidad" });
                let desviacion = resultConfig[0].getValue({ name: "custrecord_lh_cp_desviacion_ppto" });
                let nivelControl = resultConfig[0].getValue({ name: "custrecord_lh_cp_nivel_control" });
                return {
                    temporalidad: temporalidad,
                    desviacion: desviacion,
                    nivelControl: nivelControl
                }
            } else {
                return 0;
            }
        } catch (error) {
            log.error('Error-getConfig', error);
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit : beforeSubmit
    }
});


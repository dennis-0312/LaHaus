/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([
    'N/currentRecord',
    'N/search',
    'N/ui/dialog',
    'N/runtime',
    '../../Reporte Presupuestal/controller/TS_Script_Controller'
], (currentRecord, search, dialog, runtime, _controller) => {
    const CONTROL_PRESUPUESTAL_RESERVADO_PO = 'customsearch_control_ppto_reservado_po'; //Control Presupuestal RESERVADO PO - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_RESERVADO_ER = 'customsearch_control_ppto_reservado_er'; //Control Presupuestal RESERVADO ER - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_COMPROMETIDO = 'customsearch_control_ppto_comprometido'; //Control Presupuestal COMPROMETIDO - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_EJECUTADO = 'customsearch_control_ppto_ejecutado'; //Control Presupuestal EJECUTADO - PRODUCCIÓN
    const TIPO_CAMBIO_SEARCH = 'customsearch_co_tipo_cambio'; //CO Tipo Cambio Search - CP PRODUCCION
    const CATEGORIA_PPTO_PERIODOS = 'customsearch_co_categoria_ppto_periodos'; //CO Categoria Presupuesto Periodos Search - CP PRODUCCION
    const PARTIDA_PRESUPUESTAL_SEARCH = 'customsearch_partida_presupuestal'; //Partida Presupuestal - PRODUCCION
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
    const PURCHASE_ORDER = 'purchaseorder';
    const EXPENSE_REPORT = 'expensereport';
    const CURRENCY_COP = 1;
    const CURRENCY_US_DOLLAR = 2;
    const CURRENCY_CANADIAN_DOLLAR = 3;
    const CURRENCY_EURO = 4;
    const CURRENCY_PESOS_MEXICANOS = 5;
    const CURRENCY_REAL_BRASILEÑO = 6;
    let generalSolicitud = new Array();
    let maestros = new Array();
    let typeMode = '';
    // const Dennis = 27160;

    const pageInit = (scriptContext) => {
        typeMode = scriptContext.mode; //!Importante, no borrar.
        // if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
        //     let tipoCambio = getTipoCambio();
        //     console.log(tipoCambio);
        //     if (tipoCambio.co == 0 || tipoCambio.mx == 0) {
        //         alert('No se encuentra un tipo de cambio');
        //     } else {
        //         cop = tipoCambio.co;
        //         mxn = tipoCambio.mx;
        //     }
        // }
    }


    const validateLine = (scriptContext) => {
        const objRecord = scriptContext.currentRecord;
        const sublistName = scriptContext.sublistId;
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            let json = new Array();
            let msgCriterio = '';
            let msgVacio = '';
            let msgVaciCate = '';
            let list = '';
            let solicitud = 0;
            let rangeDates = new Array();
            let categoriaControl = '';
            let idpartida = '';
            let tempo = 0;
            let exchangeRate = 0;
            let temporalidad = objRecord.getValue('custbody_lh_temporalidad_flag');
            if (temporalidad != 0) {
                //let status = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_approval_status' });
                //!Si hay que hacer un ajuste para ingresar órdenes de compras retroactivas aquí va la lógica usando el quantityBilled si mayor a 1 es ejecutado
                // if (status == 1) {
                let nivelControl = parseInt(objRecord.getValue('custbody_lh_nivel_control_flag'));
                let desviacion = objRecord.getValue('custbody_lh_desviacion_flag');
                let date = objRecord.getValue({ fieldId: 'trandate' });
                date = _controller.sysDate(date); //! sysDate (FUNCTION)
                let month = date.month;
                let year = date.year

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
                        msgCriterio = 'No tiene presupuesto para este centro de costo.';
                        msgVacio = 'Debe ingresar un centro de costo.';
                        msgVaciCate = 'Debe ingresar una categoría.';
                        break;
                    default:
                        msgCriterio = 'Revisar la configuración del Nivel de Control.'
                        break;
                }

                list = scriptContext.currentRecord.type == PURCHASE_ORDER ? 'item' : 'expense';
                let line = objRecord.getCurrentSublistIndex({ sublistId: list });
                let criterioControl = objRecord.getCurrentSublistValue({ sublistId: list, fieldId: 'department' });
                if (criterioControl.length == 0) {
                    alert(msgVacio);
                    return false;
                }

                if (nivelControl == CATEGORIA_NIVEL_CONTROL) {
                    categoriaControl = objRecord.getCurrentSublistValue({ sublistId: list, fieldId: 'custcol_lh_categoria_ppto_oc' });
                    if (categoriaControl.length == 0) {
                        alert(msgVaciCate);
                        return false;
                    }
                }

                if (scriptContext.currentRecord.type == PURCHASE_ORDER) {
                    let currency = objRecord.getValue('currency');
                    exchangeRate = getTipoCambio(currency);
                    let quantity = parseInt(objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' }));
                    let quantityBilled = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantitybilled' });
                    quantityBilled = typeof quantityBilled == 'undefined' ? 0 : parseInt(quantityBilled);
                    quantityBilled = isNaN(quantityBilled) == true ? 0 : quantityBilled;
                    let rate = parseFloat(objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'rate' }));
                    generalSolicitud[line] = ((quantity - quantityBilled) * rate) / exchangeRate;
                    maestros[line] = criterioControl;
                  console.log('line: ' + generalSolicitud);
                    // solicitud = generalSolicitud.reduce((a, b) => a + b, 0);
                    for (let i = 0; i < maestros.length; i++) {
                        if (maestros[i] == criterioControl) {
                            solicitud = solicitud + parseFloat(generalSolicitud[i]);
                        }
                    }
               
                    json = [criterioControl, quantity, quantityBilled, rate, categoriaControl, status];
                    console.log(json);
                    if (typeMode == 'create') {
                        objRecord.setCurrentSublistValue({ sublistId: list, fieldId: 'custcol_lh_ppto_flag_cantidad', value: quantity });
                        objRecord.setCurrentSublistValue({ sublistId: list, fieldId: 'custcol_lh_rate', value: rate });
                    }
                }

                if (scriptContext.currentRecord.type == EXPENSE_REPORT) {
                    let currency = objRecord.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'currency' });
                    exchangeRate = getTipoCambio(currency);
                    generalSolicitud[line] = (parseFloat(objRecord.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount' }))) / exchangeRate;
                    maestros[line] = criterioControl;
                    // solicitud = generalSolicitud.reduce((a, b) => a + b, 0);
                    for (let i = 0; i < maestros.length; i++) {
                        if (maestros[i] == criterioControl) {
                            solicitud = solicitud + generalSolicitud[i]
                        }
                    }
                   
                }

                console.log('ExchangeRate', exchangeRate);
                if (exchangeRate == 0)
                    return false;

                if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
                    //!const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
                    for (let i in arregloTrimestre) {
                        let bloque = arregloTrimestre[i].includes(month.toString());
                        if (bloque == true) {
                            tempo = parseInt(i);
                            break;
                        }
                    }
                    rangeDates = _controller.getQuaterly(tempo, year);
                } else if (temporalidad == TEMPORALIDAD_MENSUAL) {
                    rangeDates = _controller.getMonthly(parseInt(month), year);
                }


                console.log(rangeDates);

                let partidaSearch = search.load({ id: PARTIDA_PRESUPUESTAL_SEARCH });
                let filters = partidaSearch.filters;
                const filterDepartment = search.createFilter({ name: 'custrecord_lh_cp_centro_costo', operator: search.Operator.ANYOF, values: criterioControl });
                filters.push(filterDepartment);
                if (nivelControl == CATEGORIA_NIVEL_CONTROL) {
                    const filterCategory = search.createFilter({ name: 'custrecord_lh_cp_nombre_categoria', operator: search.Operator.ANYOF, values: categoriaControl });
                    filters.push(filterCategory);
                }

                let searchResultCount = partidaSearch.runPaged().count;
                if (searchResultCount != 0) {
                    let result = partidaSearch.run().getRange({ start: 0, end: 1 });
                    idpartida = result[0].getValue({ name: "internalid" });
                }

                console.log('IDPartida', idpartida);
                console.log('Solicitud: ' + solicitud);

                let presupuestado = _controller.getPresupuestado(rangeDates.fdesde, rangeDates.fhasta, idpartida);
                console.log('presupuestado: ' + presupuestado);
                let reservado = _controller.getReservado(rangeDates.fdesde, rangeDates.fhasta, idpartida);
                console.log('reservado: ' + reservado);
                let comprometido = _controller.getComprometido(rangeDates.fdesde, rangeDates.fhasta, idpartida);
                console.log('comprometido: ' + comprometido);
                let ejecutado = _controller.getEjecutado(rangeDates.fdesde, rangeDates.fhasta, idpartida);
                console.log('ejecutado: ' + ejecutado);
                let disponible = parseFloat(presupuestado) - (parseFloat(reservado) + parseFloat(comprometido) + parseFloat(ejecutado));
                console.log('disponible: ' + disponible);
                let resta = disponible - solicitud;
                console.log('Resta: ' + resta);

                objRecord.setCurrentSublistValue({ sublistId: list, fieldId: 'custcol_lh_ppto_flag', value: idpartida });
                if (typeMode == 'create' || typeMode == 'copy') {
                    objRecord.setCurrentSublistValue({ sublistId: list, fieldId: 'custcol_lh_approval_status', value: 1 });
                }

                try {
                    if (sublistName === list) {
                        if (resta >= 0) {
                            console.log('Tiene ppto');
                            return true;
                        } else {
                            alert(msgCriterio)
                            if (desviacion == DESVIACION_BLOQUEO) {
                                console.log('Bloqueo');
                                return false;
                            } else {
                                console.log('Advertencia')
                                return true;
                            }
                        }
                    } return true
                } catch (error) {
                    console.log(error);
                    alert(error);
                    return false;
                }
                // }
            }
            return true;
        }
        return true;
    }

     const validateDelete = (scriptContext) => {
       const objRecord = scriptContext.currentRecord;
       list = scriptContext.currentRecord.type == PURCHASE_ORDER ? 'item' : 'expense';
       let line = objRecord.getCurrentSublistIndex({ sublistId: list });
       
       generalSolicitud.splice(line, 1);
       console.log(generalSolicitud);
       return true;
       //generalSolicitud[line] = ((quantity - quantityBilled) * rate) / exchangeRate;
       //maestros[line] = criterioControl;
                  
     }
    // const getQuaterly = (tempo, year) => {
    //     let from = '';
    //     let to = '';

    //     switch (tempo) {
    //         case 0:
    //             from = "1/1/" + year;
    //             to = "31/3/" + year;
    //             break;
    //         case 1:
    //             from = "1/4/" + year;
    //             to = "30/6/" + year;
    //             break;
    //         case 2:
    //             from = "1/7/" + year;
    //             to = "30/9/" + year;
    //             break;
    //         case 3:
    //             from = "1/10/" + year;
    //             to = "31/12/" + year;
    //             break;
    //         default:
    //             from = 0;
    //             to = 0;
    //             break;
    //     }

    //     if (from == 0 || to == 0) {
    //         alert('Validar temporalidad, fechas.');
    //         return false;
    //     }

    //     return {
    //         'fdesde': from,
    //         'fhasta': to
    //     }
    // }

    // const getMonthly = (month, year) => {
    //     let from = 0;
    //     let to = 0;

    //     if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
    //         from = "1/" + month + "/" + year;
    //         to = "31/" + month + "/" + year;
    //     } else if (month == 4 || month == 6 || month == 9 || month == 11) {
    //         from = "1/" + month + "/" + year;
    //         to = "30/" + month + "/" + year;
    //     } else if (month == 2) {
    //         from = "1/" + month + "/" + year;
    //         to = "28/" + month + "/" + year;
    //     }

    //     if (from == 0 || to == 0) {
    //         alert('Validar temporalidad, fechas.');
    //         return false;
    //     }

    //     return {
    //         'fdesde': from,
    //         'fhasta': to
    //     }
    // }


    // const getDisponible = (temporalidad, month, year, criterioControl, objRecord) => {
    //     let tempo = 0;
    //     let list = '';
    //     try {
    //         if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
    //             //!const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
    //             for (let i in arregloTrimestre) {
    //                 let bloque = arregloTrimestre[i].includes(month.toString());
    //                 if (bloque == true) {
    //                     tempo = parseInt(i);
    //                     break;
    //                 }
    //             }
    //         }

    //         let presupuestado = getPresupuesto(criterioControl, tempo, year);
    //         if (presupuestado.presupuesto == 0 || presupuestado.categoria == 0) {
    //             alert('No tiene una categoría de presupuesto o no tiene un monto presupuestado.');
    //             return false;
    //         }

    //         list = objRecord.type == PURCHASE_ORDER ? 'item' : 'expense';
    //         objRecord.setCurrentSublistValue({ sublistId: list, fieldId: 'custcol_lh_ppto_flag', value: presupuestado.categoria });
    //         if (typeMode == 'create' || typeMode == 'copy') {
    //             objRecord.setCurrentSublistValue({ sublistId: list, fieldId: 'custcol_lh_approval_status', value: 1 });
    //         }
    //         objRecord.setCurrentSublistValue({ sublistId: list, fieldId: 'custcol_lh_ppto_flag_quantity', value: presupuestado.categoria });
    //         objRecord.setCurrentSublistValue({ sublistId: list, fieldId: 'custcol_lh_ppto_flag_precio', value: presupuestado.categoria });

    //         let reservado = getReservado(temporalidad, tempo, year, presupuestado.categoria);
    //         let comprometido = getComprometido(temporalidad, tempo, year, presupuestado.categoria);
    //         let ejecutado = getEjecutado(temporalidad, tempo, year, presupuestado.categoria);
    //         console.log(presupuestado.presupuesto);
    //         console.log(reservado);
    //         console.log(comprometido);
    //         console.log(ejecutado);
    //         let disponible = presupuestado.presupuesto - (reservado + comprometido + ejecutado);
    //         return disponible;
    //     } catch (error) {
    //         alert(error);
    //     }
    // }


    // const getPresupuesto = (criterioControl, tempo, year) => {
    //     let presupuesto = 0;
    //     let categoria = 0;
    //     const presupuestado = search.create({
    //         type: "customrecord_lh_presupuesto_trimestral",
    //         filters:
    //             [
    //                 ["custrecord_lh_detalle_cppto_status_tr", "anyof", "1"],
    //                 "AND",
    //                 ["custrecord_lh_detalle_cppto_categoria_tr.custrecord_lh_cp_centro_costo", "anyof", criterioControl],
    //                 "AND",
    //                 ["custrecord_lh_detalle_cppto_anio_tr.name", "haskeywords", year]
    //             ],
    //         columns:
    //             [
    //                 search.createColumn({ name: "custrecord_lh_detalle_cppto_categoria_tr", label: "0 Categoría" }),
    //                 search.createColumn({ name: "custrecord_lh_detalle_cppto_" + tempo, label: "1 Trimestre" }),
    //             ]
    //     });

    //     let resultCount = presupuestado.runPaged().count;
    //     if (resultCount != 0) {
    //         let result = presupuestado.run().getRange({ start: 0, end: 1 });
    //         //console.log('ReservadoPO', JSON.stringify(resultPO));
    //         categoria = result[0].getValue(presupuestado.columns[0]);
    //         presupuesto = parseFloat(result[0].getValue(presupuestado.columns[1]));
    //         //console.log(categoria + ' - ' + presupuesto);
    //     }

    //     return {
    //         categoria: categoria,
    //         presupuesto: presupuesto,
    //     }
    // }


    // const getReservado = (temporalidad, tempo, year, categoria) => {
    //     let categoriappto = 0;
    //     let reservadopo = 0;
    //     let reservadoer = 0;
    //     let formulaTemporalidad = '';
    //     let operator = ''
    //     let from = '';
    //     let to = '';
    //     //*=========================================================================================================================================================
    //     // const reservadoPo = search.load({ id: CONTROL_PRESUPUESTAL_RESERVADO_PO });
    //     // let filters = reservadoPo.filters;
    //     // const filterOne = search.createFilter({ name: 'custcol_lh_ppto_flag', operator: search.Operator.ANYOF, values: categoria });
    //     // filters.push(filterOne);
    //     // const filterTwo = search.createFilter({ name: 'formulatext', formula: 'TO_CHAR(EXTRACT(YEAR FROM {trandate}))', operator: search.Operator.STARTSWITH, values: year });
    //     // filters.push(filterTwo);
    //     // if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
    //     //     const filterThree = search.createFilter({ name: 'formulanumeric', formula: 'ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)', operator: search.Operator.EQUALTO, values: tempo });
    //     //     filters.push(filterThree);
    //     // }
    //     // let searchResultCountPO = reservadoPo.runPaged().count;
    //     // //console.log('CountPO', searchResultCountPO);
    //     // if (searchResultCountPO != 0) {
    //     //     let resultPO = reservadoPo.run().getRange({ start: 0, end: 1 });
    //     //     //console.log('ReservadoPO', JSON.stringify(resultPO));
    //     //     let categoriappto = resultPO[0].getValue({ name: "custcol_lh_ppto_flag", summary: "GROUP" });
    //     //     reservadopo = parseFloat(resultPO[0].getValue({ name: "formulacurrency", summary: "SUM", formula: "DECODE({currency.symbol}, 'MXN', NVL({rate},0)/20,'COP',NVL({rate},0)/3600,NVL({rate},0)*({quantity}-{quantitybilled}))" }));
    //     //     console.log('PO: ' + categoriappto + ' - ' + reservadopo)
    //     // } else {
    //     //     reservadopo = 0;
    //     // }
    //     // console.log(typeof cop + ' --- ' + typeof mxn)

    //     if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
    //         //formulaTemporalidad = "formulanumeric: ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)";
    //         //operator = "equalto"
    //         formulaTemporalidad = "trandate"
    //         operator = "within"
    //     }

    //     switch (tempo) {
    //         case 0:
    //             from = "1/1/" + year;
    //             to = "31/3/" + year;
    //             break;
    //         case 1:
    //             from = "1/4/" + year;
    //             to = "30/6/" + year;
    //             break;
    //         case 2:
    //             from = "1/7/" + year;
    //             to = "30/9/" + year;
    //             break;
    //         case 3:
    //             from = "1/10/" + year;
    //             to = "31/12/" + year;
    //             break;
    //         default:
    //             from = 0;
    //             to = 0;
    //             break;
    //     }

    //     if (from == 0 || to == 0) {
    //         alert('Validar temporalidad, fechas.');
    //         return false;
    //     }

    //     const reservadoPo = search.create({
    //         type: "purchaseorder",
    //         filters:
    //             [
    //                 ["type", "anyof", "PurchOrd"],
    //                 "AND",
    //                 ["custcol_lh_approval_status", "anyof", "1"],
    //                 "AND",
    //                 ["formulanumeric: {quantity} - {quantitybilled}", "greaterthan", "0"],
    //                 "AND",
    //                 ["custcol_lh_ppto_flag", "anyof", categoria],
    //                 // "AND",
    //                 // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
    //                 "AND",
    //                 [formulaTemporalidad, operator, from, to]
    //             ],
    //         columns:
    //             [
    //                 search.createColumn({
    //                     name: "custcol_lh_ppto_flag",
    //                     summary: "GROUP",
    //                     label: "0 Categoría de Presupuesto"
    //                 }),
    //                 search.createColumn({
    //                     name: "formulacurrency",
    //                     summary: "SUM",
    //                     formula: "DECODE({currency.symbol}, 'MXN', NVL({fxrate},0)/" + mxn + ",'COP',NVL({fxrate},0)/" + cop + ",NVL({fxrate},0)*({quantity}-{quantitybilled}))",
    //                     label: "1 Formula (Currency)"
    //                 })
    //             ]
    //     });
    //     let searchResultCountPO = reservadoPo.runPaged().count;
    //     if (searchResultCountPO != 0) {
    //         let resultPO = reservadoPo.run().getRange({ start: 0, end: 1 });
    //         categoriappto = resultPO[0].getValue(reservadoPo.columns[0]);
    //         reservadopo = parseFloat(resultPO[0].getValue(reservadoPo.columns[1]));
    //         //console.log(categoriappto + ' - ' + reservadopo);
    //     } else {
    //         reservadopo = 0;
    //     }
    //     //*=========================================================================================================================================================
    //     // let reservadoEr = search.load({ id: CONTROL_PRESUPUESTAL_RESERVADO_ER });
    //     // let filtersEr = reservadoEr.filters;
    //     // const filterOneEr = search.createFilter({ name: 'custcol_lh_ppto_flag', operator: search.Operator.ANYOF, values: categoria });
    //     // filtersEr.push(filterOneEr);
    //     // const filterTwoEr = search.createFilter({ name: 'formulatext', formula: 'TO_CHAR(EXTRACT(YEAR FROM {trandate}))', operator: search.Operator.STARTSWITH, values: year });
    //     // filtersEr.push(filterTwoEr);
    //     // if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
    //     //     const filterThreeEr = search.createFilter({ name: 'formulanumeric', formula: 'ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)', operator: search.Operator.EQUALTO, values: tempo });
    //     //     filtersEr.push(filterThreeEr);
    //     // }

    //     const reservadoEr = search.create({
    //         type: "expensereport",
    //         filters:
    //             [
    //                 ["approvalstatus", "anyof", "1", "3"],
    //                 "AND",
    //                 ["type", "anyof", "ExpRept"],
    //                 "AND",
    //                 ["memorized", "is", "F"],
    //                 "AND",
    //                 ["formulanumeric: NVL({debitamount},0) + NVL({creditamount},0)", "greaterthan", "0"],
    //                 "AND",
    //                 ["posting", "is", "F"],
    //                 "AND",
    //                 ["formulatext: NVL({account},'X')", "isnot", "X"],
    //                 "AND",
    //                 ["custcol_lh_ppto_flag", "anyof", categoria],
    //                 // "AND",
    //                 // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
    //                 "AND",
    //                 [formulaTemporalidad, operator, from, to]
    //             ],
    //         columns:
    //             [
    //                 search.createColumn({
    //                     name: "custcol_lh_ppto_flag",
    //                     summary: "GROUP",
    //                     label: "Categoría de Presupuesto"
    //                 }),
    //                 search.createColumn({
    //                     name: "formulacurrency",
    //                     summary: "SUM",
    //                     formula: "DECODE({currency.symbol}, 'MXN', (NVL({debitamount},0)-NVL({creditamount},0)) /" + mxn + ", 'COP',  (NVL({debitamount},0)-NVL({creditamount},0)) /" + cop + ", (NVL({debitamount},0)-NVL({creditamount},0)))* DECODE({accounttype}, 'Equity', -1, 'Income',  -1, 'Other Income', -1, 'Accounts Payable', -1, 'Credit Card', -1, 'Deferred Revenue', -1, 'Long Term Liability', -1, 'Other Current Liability', -1, 1)",
    //                     label: "Formula (Currency)"
    //                 })
    //             ]
    //     });

    //     let searchResultCountER = reservadoEr.runPaged().count;
    //     if (searchResultCountER != 0) {
    //         let resultER = reservadoEr.run().getRange({ start: 0, end: 1 });
    //         categoriappto = resultER[0].getValue(reservadoPo.columns[0]);
    //         reservadoer = parseFloat(resultER[0].getValue(reservadoPo.columns[1]));
    //         //console.log('ER: ' + categoriappto + ' - ' + reservadoer)
    //     } else {
    //         reservadoer = 0;
    //     }
    //     //*=========================================================================================================================================================
    //     //?-SUMA ===============================================================================================
    //     //console.log(reservadopo + ' + ' + reservadoer);
    //     return reservadopo + reservadoer;
    // }


    // const getComprometido = (temporalidad, tempo, year, categoria) => {
    //     let categoriappto = 0;
    //     let comprometido = 0;
    //     let formulaTemporalidad = '';
    //     let operator = ''
    //     let from = '';
    //     let to = '';

    //     if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
    //         formulaTemporalidad = "trandate"
    //         operator = "within"
    //     }

    //     switch (tempo) {
    //         case 0:
    //             from = "1/1/" + year;
    //             to = "31/3/" + year;
    //             break;
    //         case 1:
    //             from = "1/4/" + year;
    //             to = "30/6/" + year;
    //             break;
    //         case 2:
    //             from = "1/7/" + year;
    //             to = "30/9/" + year;
    //             break;
    //         case 3:
    //             from = "1/10/" + year;
    //             to = "31/12/" + year;
    //             break;
    //         default:
    //             from = 0;
    //             to = 0;
    //             break;
    //     }

    //     if (from == 0 || to == 0) {
    //         alert('Vlidar temporalidad, fechas.');
    //         return false;
    //     }

    //     const searchComprometido = search.create({
    //         type: "purchaseorder",
    //         filters:
    //             [
    //                 ["type", "anyof", "PurchOrd"],
    //                 "AND",
    //                 ["custcol_lh_approval_status", "anyof", "2"],
    //                 "AND",
    //                 ["formulanumeric: {quantity} - {quantitybilled}", "greaterthan", "0"],
    //                 "AND",
    //                 ["custcol_lh_ppto_flag", "anyof", categoria],
    //                 // "AND",
    //                 // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
    //                 "AND",
    //                 [formulaTemporalidad, operator, from, to]
    //             ],
    //         columns:
    //             [
    //                 search.createColumn({
    //                     name: "custcol_lh_ppto_flag",
    //                     summary: "GROUP",
    //                     label: "0 Categoría de Presupuesto"
    //                 }),
    //                 search.createColumn({
    //                     name: "formulacurrency",
    //                     summary: "SUM",
    //                     formula: "DECODE({currency.symbol}, 'MXN', NVL({fxrate},0)/" + mxn + ",'COP',NVL({fxrate},0)/" + cop + ",NVL({fxrate},0)*({quantity}-{quantitybilled}))",
    //                     label: "1 Formula (Currency)"
    //                 })
    //             ]
    //     });
    //     let resultCount = searchComprometido.runPaged().count;
    //     if (resultCount != 0) {
    //         let result = searchComprometido.run().getRange({ start: 0, end: 1 });
    //         categoriappto = result[0].getValue(searchComprometido.columns[0]);
    //         comprometido = parseFloat(result[0].getValue(searchComprometido.columns[1]));
    //         //console.log('CO: ' + categoriappto + ' - ' + comprometido)
    //     } else {
    //         comprometido = 0;
    //     }
    //     return comprometido;
    // }


    // const getEjecutado = (temporalidad, tempo, year, categoria) => {
    //     let categoriappto = 0;
    //     let ejecutado = 0;
    //     let formulaTemporalidad = '';
    //     let operator = ''
    //     let from = '';
    //     let to = '';

    //     if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
    //         formulaTemporalidad = "trandate"
    //         operator = "within"
    //     }

    //     switch (tempo) {
    //         case 0:
    //             from = "1/1/" + year;
    //             to = "31/3/" + year;
    //             break;
    //         case 1:
    //             from = "1/4/" + year;
    //             to = "30/6/" + year;
    //             break;
    //         case 2:
    //             from = "1/7/" + year;
    //             to = "30/9/" + year;
    //             break;
    //         case 3:
    //             from = "1/10/" + year;
    //             to = "31/12/" + year;
    //             break;
    //         default:
    //             from = 0;
    //             to = 0;
    //             break;
    //     }

    //     if (from == 0 || to == 0) {
    //         alert('Vlidar temporalidad, fechas.');
    //         return false;
    //     }

    //     const searchEjecutado = search.create({
    //         type: "transaction",
    //         filters:
    //             [
    //                 [["account.custrecordlh_aplica_ppto", "is", "T"], "AND", ["type", "anyof", "Journal"], "AND", [formulaTemporalidad, operator, from, to], "AND", ["custcol_lh_ppto_flag", "anyof", categoria]],
    //                 "OR",
    //                 [["approvalstatus", "anyof", "2"], "AND", ["type", "anyof", "VendBill", "ExpRept"], "AND", [formulaTemporalidad, operator, from, to], "AND", ["custcol_lh_ppto_flag", "anyof", categoria]],
    //                 "OR",
    //                 [["type", "anyof", "VendCred"], "AND", [formulaTemporalidad, operator, from, to], "AND", ["custcol_lh_ppto_flag", "anyof", categoria]],
    //                 "AND",
    //                 ["memorized", "is", "F"],
    //                 "AND",
    //                 ["formulanumeric: NVL({debitamount},0) + NVL({creditamount},0)", "greaterthan", "0"],
    //                 "AND",
    //                 ["posting", "is", "T"],
    //                 "AND",
    //                 ["formulatext: NVL({account},'X')", "isnot", "X"]
    //             ],
    //         columns:
    //             [
    //                 search.createColumn({
    //                     name: "custcol_lh_ppto_flag",
    //                     summary: "GROUP",
    //                     label: "Categoría de Presupuesto"
    //                 }),
    //                 search.createColumn({
    //                     name: "formulacurrency",
    //                     summary: "SUM",
    //                     formula: "DECODE({currency.symbol}, 'MXN', (NVL({debitamount},0)-NVL({creditamount},0))/" + mxn + ", 'COP',  (NVL({debitamount},0)-NVL({creditamount},0))/" + cop + ", (NVL({debitamount},0)-NVL({creditamount},0))/" + cop + ")* DECODE({accounttype}, 'Equity', -1, 'Income',  -1, 'Other Income', -1, 'Accounts Payable', -1, 'Credit Card', -1, 'Deferred Revenue', -1, 'Long Term Liability', -1, 'Other Current Liability', -1, 1)",
    //                     label: "Formula (Currency)"
    //                 })
    //             ]
    //     });

    //     let resultCount = searchEjecutado.runPaged().count;
    //     if (resultCount != 0) {
    //         let result = searchEjecutado.run().getRange({ start: 0, end: 1 });
    //         categoriappto = result[0].getValue(searchEjecutado.columns[0]);
    //         ejecutado = parseFloat(result[0].getValue(searchEjecutado.columns[1]));
    //     } else {
    //         ejecutado = 0;
    //     }
    //     return ejecutado;
    // }


    // const sysDate = (fecha) => {
    //     try {
    //         let date = new Date(fecha);
    //         let month = date.getMonth() + 1; // jan = 0
    //         let year = date.getFullYear();
    //         month = month <= 9 ? '0' + month : month;
    //         return {
    //             month: month,
    //             year: year
    //         }
    //     } catch (e) {
    //         console.log('Error-sysDate', e);
    //     }
    // }


    const getTipoCambio = (currency) => {
        //let currency = new Array();
        let exchange = 0;
        if (currency == CURRENCY_US_DOLLAR || currency == CURRENCY_CANADIAN_DOLLAR) {
            exchange = 1;
        } else {
            let objSearch = search.load({ id: TIPO_CAMBIO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_tc_moneda', operator: search.Operator.ANYOF, values: currency });
            filters.push(filterOne);
            // const filterTwo = search.createFilter({ name: 'custrecord_lh_tc_periodo', operator: search.Operator.ANYOF, values: internalidPeriod });
            // filters.push(filterTwo);
            let searchResultCount = objSearch.runPaged().count;

            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                //console.log('result', JSON.stringify(result));
                exchange = parseFloat(result[0].getValue({ name: "custrecord_lh_tc_tipo_cambio", summary: "GROUP" }));
                // for (let i in result) {
                //     // let symbol = result[i].getValue({ name: "symbol", join: "CUSTRECORD_LH_TC_MONEDA", summary: "GROUP" });
                //     // if (symbol == 'COP') {
                //     //     co = parseFloat(result[i].getValue({ name: "custrecord_lh_tc_tipo_cambio", summary: "GROUP" }));
                //     // }

                //     // if (symbol == 'MXN') {
                //     //     mx = parseFloat(result[i].getValue({ name: "custrecord_lh_tc_tipo_cambio", summary: "GROUP" }));
                //     // }

                //     //let moneda = result[i].getValue({ name: "custrecord_lh_tc_moneda", summary: "GROUP" });
                //     exchange = parseFloat(result[i].getValue({ name: "custrecord_lh_tc_tipo_cambio", summary: "GROUP" }));
                //     // currency.push(moneda);
                //     // exchange.push(tipocambio);
                // }
                // console.log('currency', currency);
                // console.log('exchange', exchange);
                // return { co: co, mx: mx }
            } else {
                alert('No existe un tipo de cambio para esta moneda.');
            }
        }
        return exchange;
    }

   
    return {
        pageInit: pageInit,
        //saveRecord: saveRecord,
        //fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        validateDelete:validateDelete,
        validateLine: validateLine,
        //sublistChanged: sublistChanged
    }
});


//?COMPROMETIDO
// var purchaseorderSearchObj = search.create({
//     type: "purchaseorder",
//     filters:
//     [
//        ["type","anyof","PurchOrd"],
//        "AND",
//        ["approvalstatus","anyof","2"],
//        "AND",
//        ["formulanumeric: {quantity} - {quantitybilled}","greaterthan","0"],
//        "AND",
//        ["custcol_lh_ppto_flag","noneof","@NONE@"],
//        "AND",
//        ["formulanumeric: ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)","equalto","0"],
//        "AND",
//        ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))","startswith","2023"]
//     ],
//     columns:
//     [
//        search.createColumn({
//           name: "custcol_lh_ppto_flag",
//           summary: "GROUP",
//           label: "Categoría de Presupuesto"
//        }),
//        search.createColumn({
//           name: "formulacurrency",
//           summary: "SUM",
//           formula: "DECODE({currency.symbol}, 'MXN', NVL({rate},0)/20,'COP',NVL({rate},0)/3600,NVL({rate},0)*({quantity}-{quantitybilled}))",
//           label: "Formula (Currency)"
//        })
//     ]
//  });
//  var searchResultCount = purchaseorderSearchObj.runPaged().count;
//  log.debug("purchaseorderSearchObj result count",searchResultCount);
//  purchaseorderSearchObj.run().each(function(result){
//     // .run().each has a limit of 4,000 results
//     return true;
//  });


//?EJECUTADO
// var transactionSearchObj = search.create({
//     type: "transaction",
//     filters:
//     [
//        [["memorized","is","F"],"AND",["formulanumeric: NVL({debitamount},0) + NVL({creditamount},0)","greaterthan","0"],"AND",["posting","is","T"],"AND",["formulatext: NVL({account},'X')","isnot","X"],"AND",["account.custrecordlh_aplica_ppto","is","T"],"AND",["formulanumeric: ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)","equalto","2"],"AND",["custcol_lh_ppto_flag","noneof","@NONE@"],"AND",["type","anyof","VendBill","Journal"]],
//        "OR",
//        [["approvalstatus","anyof","2"],"AND",["type","anyof","ExpRept"]]
//     ],
//     columns:
//     [
//        search.createColumn({
//           name: "custcol_lh_ppto_flag",
//           summary: "GROUP",
//           label: "Categoría de Presupuesto"
//        }),
//        search.createColumn({
//           name: "formulacurrency",
//           summary: "SUM",
//           formula: "DECODE({currency.symbol}, 'MXN', (NVL({debitamount},0)-NVL({creditamount},0)) / 20, 'COP',  (NVL({debitamount},0)-NVL({creditamount},0)) / 3600, (NVL({debitamount},0)-NVL({creditamount},0)))* DECODE({accounttype}, 'Equity', -1, 'Income',  -1, 'Other Income', -1, 'Accounts Payable', -1, 'Credit Card', -1, 'Deferred Revenue', -1, 'Long Term Liability', -1, 'Other Current Liability', -1, 1)",
//           label: "Formula (Currency)"
//        })
//     ]
//  });
//  var searchResultCount = transactionSearchObj.runPaged().count;
//  log.debug("transactionSearchObj result count",searchResultCount);
//  transactionSearchObj.run().each(function(result){
//     // .run().each has a limit of 4,000 results
//     return true;
//  });


//?RESERVADO PO
// const reservadoPo = search.create({
        //     type: "purchaseorder",
        //     filters:
        //         [
        //             ["type", "anyof", "PurchOrd"],
        //             "AND",
        //             ["custcol_lh_approval_status", "anyof", "1"],
        //             "AND",
        //             ["formulanumeric: {quantity} - {quantitybilled}", "greaterthan", "0"],
        //             "AND",
        //             ["custcol_lh_ppto_flag", "anyof", categoria],
        //             "AND",
        //             ["formulanumeric: ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)", "equalto", tempo],
        //             "AND",
        //             ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year]
        //         ],
        //     columns:
        //         [
        //             search.createColumn({
        //                 name: "custcol_lh_ppto_flag",
        //                 summary: "GROUP",
        //                 label: "Categoría de Presupuesto"
        //             }),
        //             search.createColumn({
        //                 name: "formulacurrency",
        //                 summary: "SUM",
        //                 formula: "DECODE({currency.symbol}, 'MXN', NVL({rate},0)/20,'COP',NVL({rate},0)/3600,NVL({rate},0)*({quantity}-{quantitybilled}))",
        //                 label: "Formula (Currency)"
        //             })
        //         ]
        // });
        // let searchResultCountPO = reservadoPo.runPaged().count;
        // //console.log('CountPO', searchResultCountPO);
        // if (searchResultCountPO != 0) {
        //     let resultPO = reservadoPo.run().getRange({ start: 0, end: 1 });
        //     console.log('ReservadoPO', JSON.stringify(resultPO));
        //     let categoriappto = resultPO[0].getValue({ name: "custcol_lh_ppto_flag", summary: "GROUP" });
        //     let reservadopo = resultPO[0].getValue({ name: "formulacurrency", summary: "SUM", formula: "DECODE({currency.symbol}, 'MXN', NVL({rate},0)/20,'COP',NVL({rate},0)/3600,NVL({rate},0)*({quantity}-{quantitybilled}))" });
        //     console.log(categoriappto + ' - ' + parseFloat(reservadopo))
        //     //return {
        //     //     temporalidad: temporalidad,
        //     //     desviacion: desviacion,
        //     //     nivelControl: nivelControl
        //     // }
        //     return resultPO;
        // } else {
        //     return 0;
        // }

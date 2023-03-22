/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/log', 'N/search', 'N/record'], (log, search, record) => {
    const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal'; //CO Configuración Presupuestal Search - CP PRODUCCION
    const CATEGORIA_PRESUPUESTO_SEARCH = 'customsearch_co_cetagoria_presupuesto'; //CO Categoría Presupuesto Search - CP PRODUCCION
    const ID_AÑO_SEARCH = 'customsearch_co_cp_anio'; //CO CP Año Search - CP PRODUCCION
    const CATEGORIA_PPTO_PERIODOS = 'customsearch_co_categoria_ppto_periodos'; //CO Categoria Presupuesto Periodos Search - CP PRODUCCION
    const TIPO_CAMBIO_SEARCH = 'customsearch_co_tipo_cambio'; //CO Tipo Cambio Search - CP PRODUCCION
    const PERIODO_SEARCH = 'customsearch_co_period_search' //CO Period Search - CP PRODUCCION
    const PO_ITEM_LINES_NO_GROUP_SEARCH = 'customsearch_co_po_item_lines_2' //CO Purchase Order Item Lines NO GROUP - CP PRODUCCION
    const JE_LINE_LINES_SEARCH = 'customsearch_co_je_line_lines';  //CO Journal Entries Line Lines - CP PRODUCCION
    const ER_EXPENSE_LINES_NO_GROUP_SEARCH = 'customsearch_co_er_expense_lines_2' //CO Expense Report Expense Lines NO GROUP - CP PRODUCCION
    const NON_INVENTORY_ITEM = 'NonInvtPart';
    const INVENTORY_ITEM = 'InvtPart';
    const SERVICE_ITEM = 'Service';
    const RESERVADO = 2;
    const COMPROMETIDO = 3;
    const EJECUTADO = 4;
    const PAGADO = 5;
    const DISPONIBLE = 7;
    const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
    const anual = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const TEMPORALIDAD_MENSUAL = 1;
    const TEMPORALIDAD_TRIMESTRAL = 2;
    const TEMPORALIDAD_ANUAL = 3;
    const TEMPORALIDAD_GLOBAL = 4;
    const DESVIACION_ADVERTENCIA = 1;
    const DESVIACION_BLOQUEO = 2;
    const ITEM_SUBLIST = 'item';
    const EXPENSE_SUBLIST = 'expense';
    const JOURNAL_SUBLIST = 'line'
    const CECO_NIVEL_CONTROL = 1;
    const CUENTA_NIVEL_CONTROL = 2;
    const CATEGORIA_NIVEL_CONTROL = 3;
    const CURRENCY_COP = 1;
    const CURRENCY_US_DOLLAR = 2;
    const CURRENCY_CANADIAN_DOLLAR = 3;
    const CURRENCY_EURO = 4;
    const CURRENCY_PESOS_MEXICANOS = 5;
    const CURRENCY_REAL_BRASILEÑO = 6;
    const CATEGORIA_PRESUPUESTO_RECORD = 'customrecord_lh_categoria_presupuesto';
    const PURCHASE_ORDER = 'purchaseorder';
    const VENDOR_CREDIT = 'vendorcredit';
    const EXPENSE_REPORT = 'expensereport';
    const JOURNAL = 'journalentry';
    const ACCOUNT_TYPE_EXPENSE = 'Expense';
    const CREATE = 'create';
    const COPY = 'copy';
    const EDIT = 'edit';
    const DETALLE_TRANSACCION_RECORD = 'customrecord_lh_detalle_transaccion';
    const TRANSACTION_EXPENSE_REPORT = 28;
    const TRANSACTION_JOURNAL_ENTRY = 1;
    const TRANSACTION_PURCHASE_ORDER = 15;
    const DETALLE_TRANSACCION_SEARCH = 'customsearch_co_detalle_transac_search'; //CO Detalle Transacción Search - CP PRODUCCION
    let typeMode = '';

    const execute = (context) => {
        try {
            let arrayNoTieneDetalle = new Array();
            let arraySITieneDetalle = new Array();
            let arrayError = new Array();
            let arraySuccess = new Array();
            let from = '11/8/2022';
            let to = '17/10/2022';
            let ocid = '';
            //let objOC = search.load({ id: 'customsearch_journal_entry_valid_dev' });
            //let objOC = search.load({ id: 'customsearch_expense_report_valid_dev' });
            //let objOC = search.load({ id: 'customsearch_purchase_order_valid_dev' });
            // let objOC = search.load({ id: 'customsearch4510' });
            // let objOC = search.load({ id: 'customsearch_vendor_bill_valid_dev' });
            // let filters = objOC.filters;
            // const filterTwo = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [from, to] });
            // filters.push(filterTwo);
            // let result = objOC.run().getRange({ start: 0, end: 1000 });
            // let countResOC = objOC.runPaged().count;
            // log.debug('INICIO', 'INICIO =============> ' + from + ' = ' + to);
            // log.debug('TotalOC', countResOC);
            // for (let i in result) {
            //     ocid = result[i].getValue({ name: "internalid", summary: "GROUP" });
            //     // let res = generateArray(ocid);
            //     // log.debug('ID', ocid);
            //     // log.debug('Array', res);
            //     // record.submitFields({ type: record.Type.EXPENSE_REPORT, id: ocid, values: { 'custbody_lh_categories_id_flag': JSON.stringify(res) } });

            //     // try {
            //     //     log.debug('OC', ocid);
            //     //     let retorno = controlPresupuestal(0, ocid);
            //     //     if (retorno == 0) {
            //     //         arrayError.push(ocid);
            //     //     } else {
            //     //         arraySuccess.push([ocid, retorno]);
            //     //     }
            //     // } catch (error) {
            //     //     arrayError.push(ocid);
            //     // }

            //     let created = result[i].getValue({ name: "datecreated", summary: "GROUP" });
            //     let objDetail = search.load({ id: 'customsearch_lh_detalle_vali' });
            //     let filters2 = objDetail.filters;
            //     //const filterFour = search.createFilter({ name: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: ocid });
            //     const filterFour = search.createFilter({ name: 'custrecord_lh_cp_dt_factura_relacionada', operator: search.Operator.ANYOF, values: ocid });
            //     //const filterFour = search.createFilter({ name: 'custrecord_lh_cp_dt_pago_relacionado', operator: search.Operator.ANYOF, values: ocid });
            //     filters2.push(filterFour);
            //     let countRes = objDetail.runPaged().count;
            //     if (countRes == 0) {
            //         arrayNoTieneDetalle.push([ocid, created]);
            //     } else {
            //         arraySITieneDetalle.push([ocid, created]);
            //     }
            // }

            // // try {
            // //     log.debug('OC', ocid);
            // //     let retorno = controlPresupuestal(0, ocid);
            // //     if (retorno == 0) {
            // //         arrayError.push(ocid);
            // //     } else {
            // //         arraySuccess.push([ocid, retorno]);
            // //     }
            // // } catch (error) {
            // //     arrayError.push(ocid);
            // // }


            // log.debug('No-Tiene-Detalle', arrayNoTieneDetalle);
            // log.debug('Count-No-Tiene-Detalle', arrayNoTieneDetalle.length);
            // log.debug('Si-Tiene-Detalle', arraySITieneDetalle);
            // log.debug('Count-Si-Tiene-Detalle', arraySITieneDetalle.length);
            // log.debug('arraySuccess', arraySuccess);
            // log.debug('arrayError', arrayError);
            // log.debug('FIN', 'FIN ===============> ' + from + ' = ' + to);

            //
            // log.debug('INICIO', 'INICIO ================>');
            // //controlPresupuestal(0, idOC);
            // log.debug('FIN', 'FIN ======================>');
            record.submitFields({
                type: record.Type.VENDOR_BILL,
                id: 197085,
                values: {   
                    //'custbody_lh_categories_id_flag': JSON.stringify([["194269", "1574", 89.1], ["194269", "1573", 89.1]]),
                    // 'custbody_lh_categories_id_edit_flag': '',
                    'custbody_lh_update_flag': 7
                }
            });
        } catch (error) {
            log.error('Error-Test', error);
        }
    }

    const generateArray = (id) => {
        try {
            let array = new Array();
            let noarray = new Array();
            let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_factura_relacionada', operator: search.Operator.ANYOF, values: id });
            filters.push(filterOne);
            let countRes = objSearch.runPaged().count;
            //log.debug('Results-Count', countRes);
            if (countRes != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 50 });
                //log.debug('Results-Details', result);
                for (let i in result) {
                    let internalid = result[i].getValue({ name: "internalid" });
                    let categoria = result[i].getValue({ name: "custrecord_lh_cp_dt_category_ppto" });
                    let comprometido = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_comprometido" }));
                    let ejecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_ejecutado" }));
                    let pagado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_pagado" }));
                    let disponible = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_disponible" }));
                    let reservado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_reservado" }));

                    let amount = comprometido + ejecutado + pagado + disponible;
                    if (amount > 0) {
                        array.push([internalid.toString(), amount]);
                    } else {
                        array.push([internalid.toString(), reservado]);
                    }
                }
                return array;
            } else {
                noarray.push(id);
            }
        } catch (error) {
            log.error('Error', error);
        }
    }

    const controlPresupuestal = (typeMode = 0, idOC) => {
        //log.debug('Debug', 'Init');
        const objRecord = record.load({ type: record.Type.PURCHASE_ORDER, id: idOC, isDynamic: true });
        let json = new Array();
        let json2 = new Array();
        let json3 = new Array();
        let resta = 0;
        let view_alert = 0;
        let existe_ppto = 'Tiene presupuesto';
        let cuenta = '';
        let account = 0;
        let category = 0;
        let subList = '';
        let vueltas = '';
        let articulo = '';
        let categoryEmpty = 0;
        let message = '';
        let message2 = '';
        let tipoCambio = 1;
        let scapeValidate = 0;
        let categoryPPTO = '';
        let arrayCategoriasFirst = new Array();
        let arrayCategories = new Array();
        let sumamonto = 0;
        const CLOSE_STATUS = 'closed'

        try {
            let transaction = objRecord.getValue({ fieldId: 'ntype' });
            let statusRef = objRecord.getValue({ fieldId: 'statusRef' });
            let voided = objRecord.getValue({ fieldId: 'voided' });
            if (statusRef != CLOSE_STATUS) {
                if (voided != "T") {
                    objRecord.setValue('custbody_lh_transaction_type_flag', transaction);
                    let subsidiary = objRecord.getValue({ fieldId: 'subsidiary' });
                    //log.debug('subsidiary', subsidiary);
                    let config = getConfig(transaction, subsidiary); //! getConfig (FUNCTION)
                    //log.debug('COnfig', config);
                    if (config != 0) {
                        let currency = objRecord.getValue({ fieldId: 'currency' });
                        objRecord.setValue('custbody_lh_temporalidad_flag', config.temporalidad);
                        objRecord.setValue('custbody_lh_nivel_control_flag', config.nivelControl);
                        let date = objRecord.getValue({ fieldId: 'trandate' });
                        date = sysDate(date); //! sysDate (FUNCTION)
                        let month = date.month;
                        let year = getAnioId(date.year); //! getAnioId (FUNCTION)
                        objRecord.setValue('custbody_lh_anio_id_flag', year);
                        if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                            tipoCambio = getTipoCambio(subsidiary, month, date.year); //! getTipoCambio (FUNCTION)
                            // if (tipoCambio == 0) {
                            //     dialog.alert({ title: 'Información', message: 'No se encuentra un tipo de cambio para esta transacción' });
                            //     return false;
                            // }
                        }
                        let numLines = objRecord.getLineCount({ sublistId: 'item' });
                        let expLines = objRecord.getLineCount({ sublistId: 'expense' });
                        let jouLines = objRecord.getLineCount({ sublistId: 'line' });
                        if (numLines > 0) {
                            subList = ITEM_SUBLIST;
                            cuenta = 'custcol_bm_itemaccount';
                            vueltas = numLines;
                            articulo = 'item';
                            message = 'Los siguientes artículos no tienen una categoría de presupesto: ';
                        } else if (expLines > 0) {
                            subList = EXPENSE_SUBLIST;
                            cuenta = 'account';
                            vueltas = expLines;
                            articulo = 'category';
                            message = 'Las siguientes categorías no tienen una categoría de presupesto: ';
                        } else if (jouLines > 0) {
                            subList = JOURNAL_SUBLIST;
                            cuenta = 'custcol_bm_itemaccount';
                            vueltas = jouLines;
                            articulo = 'account';
                            message = 'Los siguientes cuentas no tienen una categoría de presupesto: ';
                        }
                        //log.debug('vueltas', vueltas);
                        objRecord.setValue('custbody_lh_sublist_type_flag', subList);
                        for (let i = 0; i < vueltas; i++) {
                            //let validateCategory = 1;
                            let art = '';
                            let aplicaPPTO = '';
                            let amount = 0;
                            let debit = 0;
                            let credit = 0;
                            let department = 0;
                            let paramCriteria = 0;
                            // if (transaction == TRANSACTION_JOURNAL_ENTRY) {//?JOURNAL
                            //     aplicaPPTO = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcollh_aplica_ppto', line: i });
                            //     console.log('aplicaPPTO', aplicaPPTO);
                            //     if (aplicaPPTO == true) {
                            //         art = objRecord.getSublistText({ sublistId: subList, fieldId: articulo, line: i });
                            //         debit = objRecord.getSublistValue({ sublistId: subList, fieldId: 'debit', line: i });
                            //         credit = objRecord.getSublistValue({ sublistId: subList, fieldId: 'credit', line: i });
                            //         if (debit.length != 0) {
                            //             amount = parseFloat(debit)
                            //         }

                            //         if (credit.length != 0) {
                            //             amount = parseFloat(-credit)
                            //         }
                            //         if (amount.length != 0) {
                            //             console.log(art + ' - ' + aplicaPPTO + ' - ' + typeof amount + ' - ' + amount + ' - ' + i);
                            //             department = objRecord.getSublistValue({ sublistId: subList, fieldId: 'department', line: i });
                            //             // paramCriteria = department;
                            //             if (department.length == 0) {
                            //                 scapeValidate = 1
                            //                 message2 = 'Debe ingresar el centro de costo';
                            //                 break;
                            //             }
                            //             let recordLine = objRecord.selectLine({ sublistId: subList, line: i });
                            //             if (config.nivelControl == CUENTA_NIVEL_CONTROL) {
                            //                 let artVal = parseInt(objRecord.getSublistValue({ sublistId: subList, fieldId: articulo, line: i }));
                            //                 account = getAccount(artVal);
                            //                 //recordLine.setCurrentSublistValue({ sublistId: subList, fieldId: 'custcol_nondeductible_account', value: account });
                            //             }

                            //             if (config.nivelControl == CATEGORIA_NIVEL_CONTROL) {
                            //                 category = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcol_lh_categoria_ppto_oc', line: i });
                            //                 if (category.length == 0) {
                            //                     scapeValidate = 1
                            //                     message2 = 'Debe ingresar la categoría de presupuesto';
                            //                     break;
                            //                 }
                            //             }

                            //             categoryPPTO = getValidateCategoriaPPTO(subsidiary, department, category, account, config.nivelControl); //! getValidateCategoriaPPTO (FUNCTION)
                            //             //recordLine.setCurrentSublistValue({ sublistId: subList, fieldId: 'custcol_lh_ppto_flag', value: categoryPPTO });
                            //             //objRecord.commitLine({ sublistId: subList });
                            //             if (categoryPPTO != 0) {
                            //                 json.push({
                            //                     category: categoryPPTO,
                            //                     amount: amount,
                            //                     ceco: department
                            //                 });

                            //                 arrayCategoriasFirst.push({
                            //                     category: categoryPPTO,
                            //                     department: department
                            //                 });
                            //             } else {
                            //                 categoryEmpty = 1;
                            //                 json3.push(' ' + art);
                            //             }
                            //         }
                            //     }
                            // } else {
                            art = objRecord.getSublistText({ sublistId: subList, fieldId: articulo, line: i });
                            amount = objRecord.getSublistValue({ sublistId: subList, fieldId: 'amount', line: i });
                            department = objRecord.getSublistValue({ sublistId: subList, fieldId: 'department', line: i });
                            paramCriteria = department;
                            if (department.length == 0) {
                                scapeValidate = 1
                                message2 = 'Debe ingresar el centro de costo';
                                break;
                            }
                            //let recordLine = objRecord.selectLine({ sublistId: subList, line: i });
                            if (config.nivelControl == CUENTA_NIVEL_CONTROL) {
                                let artVal = parseInt(objRecord.getSublistValue({ sublistId: subList, fieldId: articulo, line: i }));
                                account = getAccount(artVal);
                                //recordLine.setCurrentSublistValue({ sublistId: subList, fieldId: 'custcol_nondeductible_account', value: account });
                                paramCriteria = account;
                            }

                            if (config.nivelControl == CATEGORIA_NIVEL_CONTROL) {
                                category = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcol_lh_categoria_ppto_oc', line: i });
                                paramCriteria = category;
                                if (category.length == 0) {
                                    scapeValidate = 1;
                                    message2 = 'Debe ingresar la categoría de presupuesto';
                                    break;
                                }
                            }

                            categoryPPTO = getValidateCategoriaPPTO(subsidiary, department, category, account, config.nivelControl); //! getValidateCategoriaPPTO (FUNCTION)
                            //recordLine.setCurrentSublistValue({ sublistId: subList, fieldId: 'custcol_lh_ppto_flag', value: categoryPPTO });
                            //objRecord.commitLine({ sublistId: subList });

                            if (categoryPPTO != 0) {
                                json.push({
                                    category: categoryPPTO,
                                    amount: amount,
                                    ceco: paramCriteria
                                });
                            } else {
                                categoryEmpty = 1;
                                json3.push(' ' + art);
                            }
                            // }
                        }

                        if (transaction == TRANSACTION_JOURNAL_ENTRY) {//?JOURNAL
                            //console.log('arrayCategoriasBefore', arrayCategoriasFirst);
                            let hash = {};
                            arrayCategoriasFirst = arrayCategoriasFirst.filter(o => hash[o.category] ? false : hash[o.category] = true);
                            //console.log('arrayCategoriasAfter', arrayCategoriasFirst);
                        }

                        // if (scapeValidate == 1) {
                        //     dialog.alert({ title: 'Información', message: message2 });
                        //     return false;
                        // }

                        // if (categoryEmpty == 1) {
                        //     dialog.alert({
                        //         title: 'Advertencia',
                        //         message: message + json3
                        //     });
                        //     return false;
                        // }

                        let categorias = json.map((x) => x.category);
                        let arrayCategorias = [...new Set(categorias)];
                        let arrayMontos = [];
                        let arrayCecos = [];
                        arrayCategorias.forEach((cat) => {
                            let filtro = json.filter((x) => x.category == cat);
                            let montos = filtro.reduce((acc, valor) => acc + valor.amount, 0);
                            let cecos = filtro.reduce((acc, valor) => valor.ceco, 0);
                            arrayMontos.push(montos);
                            arrayCecos.push(cecos);
                        });
                        // log.debug('arrayCategorias', arrayCategorias);
                        // log.debug('arrayMontos', arrayMontos);
                        // log.debug('arrayCecos', arrayCecos);
                        for (let j in arrayCategorias) {
                            resta = 0;
                            let ceco = arrayCecos[j];
                            // existe_ppto = 'Tiene presupuesto';
                            let getCategoria = getDisponible(arrayCategorias[j], year, month, config.temporalidad, ceco); //! getDisponible (FUNCTION)
                            let reservado = getReservado(arrayCategorias[j], year, month, config.temporalidad); //! getReservado (FUNCTION)
                            sumamonto += parseFloat(arrayMontos[j]);
                            let monto = parseFloat(arrayMontos[j]) / tipoCambio;
                            resta = (getCategoria.disponible - reservado) - monto;
                            //log.debug('Resta', resta + ' = (' + getCategoria.disponible + ' - ' + reservado + ') - ' + monto);
                            let cate = getCategoria.cate;


                            if (resta < 0) {
                                view_alert = 1;
                                existe_ppto = 'Los siguientes centros de costo no tienen presupuesto disponible: ';
                                json2.push(' ' + getCategoria.categoria);
                                //console.log('No tiene ppto', json2)
                            }

                            if (transaction == TRANSACTION_JOURNAL_ENTRY) {//?JOURNAL
                                let ceco = '';
                                for (let k in arrayCategoriasFirst) {
                                    //console.log('Compare', arrayCategoriasFirst[k].category + ' == ' + getCategoria.cate)
                                    if (arrayCategoriasFirst[k].category == getCategoria.cate) {
                                        ceco = arrayCategoriasFirst[k].department;
                                        break;
                                    }
                                }
                                arrayCategories.push([ceco.toString(), monto]);
                            }

                            if (transaction == TRANSACTION_PURCHASE_ORDER) {
                                arrayCategories.push([cate.toString(), monto, ceco.toString()]);//!Main for update ============================
                            }
                        }

                        // if (transaction == TRANSACTION_JOURNAL_ENTRY) {
                        //     objRecord.setValue('custbody_lh_categories_id_flag', JSON.stringify(arrayCategories));
                        //     //console.log('arrayCategories', arrayCategories);
                        // }

                        // if (transaction == TRANSACTION_EXPENSE_REPORT) {
                        //     objRecord.setValue('custbody_lh_amount_flag', sumamonto);
                        // }

                        if (transaction == TRANSACTION_PURCHASE_ORDER) {
                            let retorno = record.submitFields({ type: record.Type.PURCHASE_ORDER, id: idOC, values: { 'custbody_lh_categories_id_edit_flag': JSON.stringify(arrayCategories) } });
                            //objRecord.setValue('custbody_lh_categories_id_edit_flag', JSON.stringify(arrayCategories));
                            log.debug('arrayCategories', arrayCategories);
                            return retorno;
                        }


                        // if (view_alert == 1) {
                        //     if (config.desviacion == DESVIACION_ADVERTENCIA) {
                        //         objRecord.setValue('custbody_lh_cp_estado_ppto_oc', RESERVADO);
                        //         //console.log('Advertencia, se guardó');
                        //         dialog.alert({
                        //             title: 'Advertencia',
                        //             message: existe_ppto + json2
                        //         }).then(success).catch(failure);
                        //         //return false;
                        //         return true;
                        //     } else if (config.desviacion == DESVIACION_BLOQUEO) {
                        //         //console.log('Bloqueo, no se guardó');
                        //         dialog.alert({
                        //             title: 'Bloqueo',
                        //             message: existe_ppto + json2
                        //         });
                        //         return false;
                        //     }
                        // } else if (view_alert == 0) {
                        //     return true;
                        //     //return false;
                        // }
                    }
                    // else {
                    //     alert('La subsidiaria no cuenta con una configuración de presupuesto.');
                    // }
                } else {
                    log.debug('VOID', idOC);
                }
            } else {
                log.debug('CLOSE', idOC);
            }
        } catch (error) {
            log.error('Error-Init', error);
            return 0;
            // alert(error);
            // console.log(error);
            // return false;
        }
    }

    // function success(result) { console.log('Success: ' + result) }
    // function failure(reason) { console.log('Failure: ' + reason) }


    const getConfig = (transaction, subsidiary) => {
        try {
            let objSearch = search.load({ id: CONFIG_PPTO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_cp_transaccion', operator: search.Operator.ANYOF, values: transaction });
            filters.push(filterOne);
            const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
            filters.push(filterTwo);
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
            log.error('Error1', error);
        }
    }

    const getValidateCategoriaPPTO = (subsidiary, department, category, account, nivelControl) => {
        try {
            let objSearch = search.load({ id: CATEGORIA_PRESUPUESTO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_cp_categoriap_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
            filters.push(filterOne);
            if (nivelControl == CUENTA_NIVEL_CONTROL) {
                const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_cuenta', operator: search.Operator.ANYOF, values: account });
                filters.push(filterTwo);
            } else if (nivelControl == CATEGORIA_NIVEL_CONTROL) {
                const filterFour = search.createFilter({ name: 'custrecord_lh_cp_nombre_categoria', operator: search.Operator.ANYOF, values: category });
                filters.push(filterFour);
            }
            const filterThree = search.createFilter({ name: 'custrecord_lh_cp_centro_costo', operator: search.Operator.ANYOF, values: department });
            filters.push(filterThree);
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                let cate = result[0].getValue({ name: "internalid" });
                return cate;
            } else {
                return 0;
            }
        } catch (error) {
            log.error('Error-getCategoriaPPTO', error)
        }
    }

    const getAnioId = (year) => {
        let objSearch = search.load({ id: ID_AÑO_SEARCH });
        let filters = objSearch.filters;
        const filterOne = search.createFilter({ name: 'name', operator: search.Operator.IS, values: year });
        filters.push(filterOne);
        let resultConfig = objSearch.run().getRange({ start: 0, end: 1 });
        let anio = resultConfig[0].getValue(objSearch.columns[0]);
        return anio;
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
            log.error('Error-sysDate', e);
        }
    }


    const getDisponible = (category, year, month, temporalidad, cecoid) => {
        let disponible = 0;
        let arregloTrimestre = 0;
        let suma = 0.0;
        let categoria = '';
        let cate = '';
        let ceco = '';
        //console.log('Mes', month);
        try {
            let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
            let filters = objSearch.filters;
            // console.log('CATEGROIA', category);
            // console.log('AÑO', year);
            // console.log('MES', month);
            const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
            filters.push(filterOne);
            const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: DISPONIBLE });
            filters.push(filterTwo);
            const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
            filters.push(filterThree);
            let searchResultCount = objSearch.runPaged().count;
            //console.log('searchResultCount', JSON.stringify(searchResultCount));
            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                //console.log(JSON.stringify(result));
                let cecoText = search.lookupFields({ type: search.Type.DEPARTMENT, id: cecoid, columns: ['name'] });
                //cecoText = result[0].getText({ name: "custrecord_lh_cp_centro_costo", join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA", });
                cecoText = cecoText.name;
                ceco = result[0].getValue({ name: "custrecord_lh_cp_centro_costo", join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA", });
                cate = result[0].getValue({ name: "custrecord_lh_detalle_cppto_categoria" });
                disponible = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                //console.log('DISPONIBLE', disponible);
                if (temporalidad == TEMPORALIDAD_MENSUAL) {
                    disponible = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                } else if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
                    //!const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
                    for (let i in trimestre) {
                        //console.log('TRIMESTRE', trimestre);
                        let bloque = trimestre[i].includes(month.toString());
                        //console.log('BLOQUE', bloque);
                        if (bloque == true) {
                            arregloTrimestre = parseInt(i);
                            break;
                        }
                    }
                    for (let i in trimestre[arregloTrimestre]) {
                        let elemento = trimestre[arregloTrimestre][i];
                        //console.log('elemento=====', elemento);
                        let monto = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + elemento }));
                        //console.log('monto=====', monto)
                        suma += monto
                    }
                    disponible = suma;
                    //onsole.log('Disponible', disponible);
                } else if (temporalidad == TEMPORALIDAD_ANUAL) {
                    for (let i in anual) {
                        let monto = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + anual[i] }));
                        suma += monto
                    }
                    disponible = suma;
                }
                return {
                    disponible: disponible,
                    categoria: cecoText,
                    cate: cate
                }
            } else {
                categoria = search.lookupFields({ type: CATEGORIA_PRESUPUESTO_RECORD, id: category, columns: ['custrecord_lh_cp_nombre_categoria'] });
                categoria = categoria.custrecord_lh_cp_nombre_categoria[0].text;
                cate = categoria.custrecord_lh_cp_nombre_categoria[0].value;
                return {
                    disponible: disponible,
                    categoria: categoria,
                    cate: cate
                }
            }
        } catch (error) {
            log.error('Error2', error);
        }
    }


    const getReservado = (category, year, month, temporalidad) => {
        let reservado = 0;
        let arregloTrimestre = 0;
        let suma = 0.0;
        // let categoria = '';
        try {
            let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
            filters.push(filterOne);
            const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: RESERVADO });
            filters.push(filterTwo);
            const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
            filters.push(filterThree);
            let searchResultCount = objSearch.runPaged().count;
            //console.log('searchResultCount', searchResultCount);
            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                //console.log(result);
                // categoria = result[0].getText({ name: "custrecord_lh_cp_centro_costo", join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA", });
                if (temporalidad == TEMPORALIDAD_MENSUAL) {
                    reservado = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                } else if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
                    //!const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
                    for (let i in trimestre) {
                        let bloque = trimestre[i].includes(month);
                        if (bloque == true) {
                            arregloTrimestre = parseInt(i);
                            break;
                        }
                    }
                    for (let i in trimestre[arregloTrimestre]) {
                        let elemento = trimestre[arregloTrimestre][i];
                        let monto = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + elemento }));
                        suma += monto
                    }
                    reservado = suma;
                    //console.log('Disponible', disponible);
                } else if (temporalidad == TEMPORALIDAD_ANUAL) {
                    for (let i in anual) {
                        let monto = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + anual[i] }));
                        suma += monto
                    }
                    reservado = suma;
                }
                return reservado;
            } else {
                // categoria = search.lookupFields({ type: CATEGORIA_PRESUPUESTO_RECORD, id: category, columns: ['custrecord_lh_cp_nombre_categoria'] });
                // categoria = categoria.custrecord_lh_cp_nombre_categoria[0].text;
                return reservado;
            }
        } catch (error) {
            log.error('Error3', error);
        }
    }


    const getTipoCambio = (subsidiary, month, year) => {
        //* abr 2022,ago 2022,dic 2022,ene 2022,feb 2022,jul 2022,jun 2022,mar 2022,may 2022,nov 2022,oct 2022,sep 2022
        let period = '';
        if (month == '01') {
            period = 'ene ' + year;
        } else if (month == '02') {
            period = 'feb ' + year;
        } else if (month == '03') {
            period = 'mar ' + year;
        } else if (month == '04') {
            period = 'abr ' + year;
        } else if (month == '05') {
            period = 'may ' + year;
        } else if (month == '06') {
            period = 'jun ' + year;
        } else if (month == '07') {
            period = 'jul ' + year;
        } else if (month == '08') {
            period = 'ago ' + year;
        } else if (month == '09') {
            period = 'sep ' + year;
        } else if (month == '10') {
            period = 'oct ' + year;
        } else if (month == '11') {
            period = 'nov ' + year;
        } else if (month == '12') {
            period = 'dic ' + year;
        }
        //console.log('Period', period);
        let loadSearch = search.load({ id: PERIODO_SEARCH });
        let filters2 = loadSearch.filters;
        const filterOne2 = search.createFilter({ name: 'periodname', operator: search.Operator.STARTSWITH, values: period });
        filters2.push(filterOne2);
        let result2 = loadSearch.run().getRange({ start: 0, end: 1 });
        let internalidPeriod = result2[0].getValue({ name: "internalid" });
        //log.debug('internalidPeriod', internalidPeriod);

        let objSearch = search.load({ id: TIPO_CAMBIO_SEARCH });
        let filters = objSearch.filters;
        const filterOne = search.createFilter({ name: 'custrecord_lh_tc_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
        filters.push(filterOne);
        const filterTwo = search.createFilter({ name: 'custrecord_lh_tc_periodo', operator: search.Operator.ANYOF, values: internalidPeriod });
        filters.push(filterTwo);
        let searchResultCount = objSearch.runPaged().count;
        if (searchResultCount != 0) {
            let result = objSearch.run().getRange({ start: 0, end: 1 });
            let tipoCambio = parseFloat(result[0].getValue({ name: "custrecord_lh_tc_tipo_cambio" }));
            let periodo = result[0].getText({ name: "custrecord_lh_tc_periodo" });
            //console.log('Periodo',periodo);
            //console.log('Tipo Cambio', tipoCambio);
            return tipoCambio;
        } else {
            let objSearch = search.load({ id: TIPO_CAMBIO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_tc_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
            filters.push(filterOne);
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                let tipoCambio = parseFloat(result[0].getValue({ name: "custrecord_lh_tc_tipo_cambio" }));
                let periodo = result[0].getText({ name: "custrecord_lh_tc_periodo" });
                //console.log('Periodo',periodo);
                //console.log('Tipo Cambio', tipoCambio);
                return tipoCambio;
            } else {
                return 0;
            }
        }
    }


    const getAccount = (item) => {
        let objItem = search.lookupFields({
            type: search.Type.ITEM,
            id: item,
            columns: ['expenseaccount']
        });
        //console.log('objItem', objItem);
        return objItem.expenseaccount[0].value;
    }

    return {
        execute: execute
    }
});

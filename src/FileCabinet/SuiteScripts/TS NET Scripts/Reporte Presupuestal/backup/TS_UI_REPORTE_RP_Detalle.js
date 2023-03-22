/*******************************************************************************************************************
This script for Reporte de presupuesto (Lista de oc, facturas de compra, nc y pagos) 
/******************************************************************************************************************* 
File Name: TS_UI_REPORTE_RP_Detalle.js                                                                        
Commit: 02                                                        
Version: 1.0                                                                     
Date: 18/08/2022
ApiVersion: Script 2.1
Enviroment: PR
Governance points: N/A
==================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/log', 'N/runtime', 'N/task', 'N/record'],
    (serverWidget, search, redirect, log, runtime, task, record) => {
        const PAGE_SIZE = 500;
        const SEARCH_ID = 'customsearch_co_detalle_consolidado_com'; //CO Detalle Consolidado COMPROMETIDO - RP PRODUCCION
        const SEARCH2_ID = 'customsearch_co_detalle_consolidado_eje'; //CO Detalle Consolidado EJECUTADO - RP PRODUCCION
        const SEARCH3_ID = 'customsearch_co_detalle_consolidado_pag'; //CO Detalle Consolidado PAGADO - RP PRODUCCION
        const SEARCH_SELECT1_ID = 'customsearch_co_chart_accounts_rp';//CO Chart Accounts - RP PRODUCCION
        const SEARCH_SELECT2_ID = 'customsearch_co_centro_costos_rp'; //CO Centro de Costos - RP PRODUCCION
        const SEARCH_SELECT3_ID = 'customsearch_co_categoria_rp'; //CO Categoria - RP PRODUCCION
        const SEARCH_SELECT4_ID = 'customsearch_co_period_search' //CO Period Search - CP PRODUCCION
        const SEARCH_SELECT5_ID = 'customsearch_co_estado_rp' //CO Estado - RP PRODUCCION

        const COMPROMETIDOTXT = 'Comprometido';
        const EJECUTADOTXT = 'Ejecutado';
        const PAGADOTXT = 'Pagado';
        const COMPROMETIDO = 3;
        const EJECUTADO = 4;
        const PAGADO = 5;

        const CLIENT_SCRIPT_FILE_ID = 0; //SB-251252 - PR-?
        const DETALLE_TRANSACCION_RECORD = 'customrecord_lh_detalle_transaccion';

        const onRequest = (scriptContext) => {
            try {
                if (scriptContext.request.method === 'GET') {
                    let flag = 0;
                    let param1 = '';
                    let param2 = '';
                    let param3 = '';
                    let param4 = '';
                    let param5 = '';
                    let param6 = '';
                    let param7 = '';
                    let pageCount = 0;
                    let retrieveSearch = '';
                    let addResults = '';
                    let j;
                    let param1flag = '';
                    let periodFlag = '';
                    let quantity = 0;
                    let searchId = '';
                    // Get parameters
                    let pageId = parseInt(scriptContext.request.parameters.page);

                    //=================================================================================================================================================
                    if (typeof scriptContext.request.parameters.flag != 'undefined') {
                        flag = scriptContext.request.parameters.flag;
                        if (flag == 1) {
                            param1 = scriptContext.request.parameters.param1;//*ESTADO
                            log.debug('param1', param1);
                            if (param1 == COMPROMETIDOTXT) {
                                param1flag = COMPROMETIDO;
                                searchId = SEARCH_ID;
                            } else if (param1 == EJECUTADOTXT) {
                                param1flag = EJECUTADO;
                                searchId = SEARCH2_ID
                            } else if (param1 == PAGADOTXT) {
                                param1flag = PAGADO;
                                searchId = SEARCH3_ID;
                            }
                            log.debug('param1flag', param1flag);

                            param2 = scriptContext.request.parameters.param2; //*CECO
                            param2 = param2.split(',')[0];
                            log.debug('param2', param2);
                            param3 = scriptContext.request.parameters.param3; //*CATEGORIA
                            log.debug('param3', param3);
                            param4 = scriptContext.request.parameters.param4; //*CUENTA
                            log.debug('param4', param4);
                            param5 = scriptContext.request.parameters.param5; //*PERIODO
                            log.debug('param5', param5);
                            param6 = scriptContext.request.parameters.param6; //*CATEGORIAID
                            log.debug('param6', param6);
                            param7 = scriptContext.request.parameters.param7; //*AÑO
                            log.debug('param6', param7);
                            periodFlag = getPeriodo(param5, param7);
                        }
                    }

                    //=================================================================================================================================================
                    let form = serverWidget.createForm({ title: 'LH - Detalle de Presupuesto - ' + param1, hideNavBar: false });
                    //form.clientScriptFileId = CLIENT_SCRIPT_FILE_ID;
                    //=================================================================================================================================================

                    //Filters==========================================================================================================================================
                    form.addFieldGroup({ id: 'groupInfoUser', label: 'Parámetros' });
                    let selectCeco = form.addField({
                        id: 'custpage_filter_ceco_rp',
                        type: serverWidget.FieldType.SELECT,
                        label: 'CENTRO DE COSTO',
                        container: 'groupInfoUser'
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    selectCeco.addSelectOption({
                        value: -1,
                        text: 'Seleccione...'
                    });
                    if (typeof scriptContext.request.parameters.param2 != 'undefined' && scriptContext.request.parameters.param2.length != 0) {
                        let upselectfilter2 = search.load({ id: SEARCH_SELECT2_ID });
                        upselectfilter2.run().each((result) => {
                            const val = result.getValue(upselectfilter2.columns[0]);
                            const txt = result.getValue(upselectfilter2.columns[1]);
                            selectCeco.addSelectOption({
                                value: val,
                                text: txt
                            });
                            return true;
                        });
                        selectCeco.defaultValue = param2;
                    }


                    let selectCategoria = form.addField({
                        id: 'custpage_filter_categoria_rp',
                        type: serverWidget.FieldType.SELECT,
                        label: 'CATEGORIA',
                        container: 'groupInfoUser'
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    selectCategoria.addSelectOption({
                        value: -1,
                        text: 'Seleccione...'
                    });
                    if (typeof scriptContext.request.parameters.param3 != 'undefined' && scriptContext.request.parameters.param3.length != 0) {
                        let upselectfilter3 = search.load({ id: SEARCH_SELECT3_ID });
                        upselectfilter3.run().each((result) => {
                            const val = result.getValue(upselectfilter3.columns[0]);
                            const txt = result.getValue(upselectfilter3.columns[1]);
                            selectCategoria.addSelectOption({
                                value: val,
                                text: txt
                            });
                            return true;
                        });
                        selectCategoria.defaultValue = param3;
                    }


                    let selectCuenta = form.addField({
                        id: 'custpage_filter_cuenta_rp',
                        type: serverWidget.FieldType.SELECT,
                        label: 'CUENTA',
                        container: 'groupInfoUser'
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    selectCuenta.addSelectOption({
                        value: -1,
                        text: 'Seleccione...'
                    });
                    if (typeof scriptContext.request.parameters.param4 != 'undefined' && scriptContext.request.parameters.param4.length != 0) {
                        let upselectfilter5 = search.load({ id: SEARCH_SELECT1_ID });
                        upselectfilter5.run().each((result) => {
                            const val = result.getValue(upselectfilter5.columns[0]);
                            const txt = result.getValue(upselectfilter5.columns[1]);
                            selectCuenta.addSelectOption({
                                value: val,
                                text: txt
                            });
                            return true;
                        });
                        selectCuenta.defaultValue = param4;
                    }

                    let selectPeriodo = form.addField({
                        id: 'custpage_filter_periodo_rp',
                        type: serverWidget.FieldType.SELECT,
                        label: 'PERIODO',
                        container: 'groupInfoUser'
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    selectPeriodo.addSelectOption({
                        value: -1,
                        text: 'Seleccione...'
                    });
                    if (typeof scriptContext.request.parameters.param5 != 'undefined' && scriptContext.request.parameters.param5.length != 0) {
                        let upselectfilter1 = search.load({ id: SEARCH_SELECT4_ID });
                        upselectfilter1.run().each((result) => {
                            const val = result.getValue(upselectfilter1.columns[0]);
                            const txt = result.getValue(upselectfilter1.columns[1]);
                            selectPeriodo.addSelectOption({
                                value: val,
                                text: txt
                            });
                            return true;
                        });
                        selectPeriodo.defaultValue = periodFlag;
                    }


                    let selectEstado = form.addField({
                        id: 'custpage_filter_estado_rp',
                        type: serverWidget.FieldType.SELECT,
                        label: 'ESTADO',
                        container: 'groupInfoUser'
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    selectEstado.addSelectOption({
                        value: -1,
                        text: 'Seleccione...'
                    });
                    if (typeof scriptContext.request.parameters.param1 != 'undefined' && scriptContext.request.parameters.param1.length != 0) {
                        let upselectfilter4 = search.load({ id: SEARCH_SELECT5_ID });
                        upselectfilter4.run().each((result) => {
                            const val = result.getValue(upselectfilter4.columns[0]);
                            const txt = result.getValue(upselectfilter4.columns[1]);
                            selectEstado.addSelectOption({
                                value: val,
                                text: txt
                            });
                            return true;
                        });
                        selectEstado.defaultValue = param1flag;
                    }

                    //===============================================================================================================================================================================================
                    form.addTab({ id: 'custpage_sample_tab1', label: 'Transacciones Relacionadas' });
                    form.addTab({ id: 'custpage_sample_tab2', label: 'Reportes' });

                    //LIST 2 ===============================================================================================================================================================================================
                    form.addSubtab({ id: 'custpage_main_sub_tab2', label: 'Reportes Procesados', tab: 'custpage_sample_tab2' });

                    let sublist2 = form.addSublist({
                        id: 'sublist2',
                        type: serverWidget.SublistType.LIST,
                        label: 'Reportes Procesados',
                        tab: 'custpage_sample_tab2'
                    });

                    // sublist2.addField({
                    //     id: 'sublist_field_id',
                    //     type: serverWidget.FieldType.TEXT,
                    //     label: 'ID'
                    // });

                    // sublist2.addField({
                    //     id: 'sublist_field_owner',
                    //     type: serverWidget.FieldType.TEXT,
                    //     label: 'EMITIDO POR'
                    // });

                    // sublist2.addField({
                    //     id: 'sublist_field_date',
                    //     type: serverWidget.FieldType.TEXT,
                    //     label: 'FECHA'
                    // });

                    // sublist2.addField({
                    //     id: 'sublist_field_process_status',
                    //     type: serverWidget.FieldType.TEXT,
                    //     label: 'ESTADO'
                    // });

                    // sublist2.addField({
                    //     id: 'sublist_field_url',
                    //     type: serverWidget.FieldType.TEXTAREA,
                    //     label: 'DESCARGAR'
                    // });

                    // k = 0;
                    // let jsonParse = new Array();
                    // let obj;
                    // // if (typeof scriptContext.request.parameters.year != 'undefined') {
                    // //let sysdate = sysDate();
                    // //log.debug('SYSDATE', sysdate);
                    // let searchLogProcessStatus = search.load({ id: SEARCH2_ID });
                    // let filters = searchLogProcessStatus.filters;
                    // const filterOne = search.createFilter({ name: 'owner', operator: search.Operator.ANYOF, values: userObj.id });
                    // filters.push(filterOne);
                    // // const filterThree = search.createFilter({ name: 'created', operator: search.Operator.WITHIN, values: sysdate });
                    // // filters.push(filterThree);
                    // searchLogProcessStatus.run().each((result) => {
                    //     let logid = result.getValue(searchLogProcessStatus.columns[0]);
                    //     let owner = result.getText(searchLogProcessStatus.columns[1]);
                    //     let date = result.getValue(searchLogProcessStatus.columns[2]);
                    //     let status = result.getValue(searchLogProcessStatus.columns[3]);
                    //     let url = result.getValue(searchLogProcessStatus.columns[4]);

                    //     sublist2.setSublistValue({
                    //         id: 'sublist_field_id',
                    //         line: k,
                    //         value: logid
                    //     });

                    //     sublist2.setSublistValue({
                    //         id: 'sublist_field_owner',
                    //         line: k,
                    //         value: owner
                    //     });

                    //     sublist2.setSublistValue({
                    //         id: 'sublist_field_date',
                    //         line: k,
                    //         value: date
                    //     });

                    //     sublist2.setSublistValue({
                    //         id: 'sublist_field_process_status',
                    //         line: k,
                    //         value: status
                    //     });

                    //     sublist2.setSublistValue({
                    //         id: 'sublist_field_url',
                    //         line: k,
                    //         value: "<a href='" + url + "' target='_blank' style='color:#1a6ece;'>Descargar</a>"
                    //     });


                    //     // if (status == 'Procesando...' || status == 'Proceso en espera') {
                    //     //     flagApplyStatus = status
                    //     //     jsonParse = JSON.parse(trama);
                    //     //     for (let i in jsonParse) {
                    //     //         obj = jsonParse[i].split(' - ');
                    //     //         obj = obj[0]
                    //     //         jsonInProccessing.push(obj);
                    //     //     }
                    //     //     // jsonInProccessing.push(trama);
                    //     //     flagApplyJson = jsonInProccessing;
                    //     // }

                    //     //field_exist_proccess.defaultValue = trama;
                    //     k++
                    //     return true;
                    // });
                    // // }

                    //LIST1 =================================================================================================================================================
                    form.addSubtab({ id: 'custpage_main_sub_tab', label: 'Listado de Transacciones', tab: 'custpage_sample_tab1' });

                    let sublist = form.addSublist({
                        id: 'sublist',
                        type: serverWidget.SublistType.LIST,
                        label: 'Lista de Transacciones',
                        tab: 'custpage_main_sub_tab'
                    });

                    sublist.addRefreshButton();

                    if (param1flag == COMPROMETIDO) {
                        sublist.addField({
                            id: 'sublist_field_purchase_order_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PEDIDO'
                        });
                        //.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });;

                        sublist.addField({
                            id: 'sublist_field_vendor_bill_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'FACTURA'
                        });

                        sublist.addField({
                            id: 'sublist_field_vendor_payment_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PAGO'
                        });

                        // sublist.addField({
                        //     id: 'sublist_field_amount_rp',
                        //     type: serverWidget.FieldType.TEXT,
                        //     label: 'MONTO'
                        // });


                        // sublist.addField({
                        //     id: 'sublist_field_amount_apply_rp',
                        //     type: serverWidget.FieldType.TEXT,
                        //     label: 'MONTO APLICADO'
                        // });

                        sublist.addField({
                            id: 'sublist_field_entity_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PROVEEDOR/EMPLEADO'
                        });

                        sublist.addField({
                            id: 'sublist_field_memo_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'NOTA'
                        });

                        sublist.addField({
                            id: 'sublist_field_disponible_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'DISPONIBLE'
                        });

                        sublist.addField({
                            id: 'sublist_field_comprometido_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'COMPROMETIDO'
                        });

                        sublist.addField({
                            id: 'sublist_field_ejecutado_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'EJECUTADO'
                        });

                        sublist.addField({
                            id: 'sublist_field_pagado_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PAGADO'
                        });
                    }

                    if (param1flag == EJECUTADO) {
                        sublist.addField({
                            id: 'sublist_field_purchase_order_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PEDIDO'
                        });

                        sublist.addField({
                            id: 'sublist_field_transaction_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'FACTURA/NC'
                        });

                        sublist.addField({
                            id: 'sublist_field_vendor_payment_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PAGO'
                        });

                        // sublist.addField({
                        //     id: 'sublist_field_amount_rp',
                        //     type: serverWidget.FieldType.TEXT,
                        //     label: 'MONTO'
                        // });


                        // sublist.addField({
                        //     id: 'sublist_field_amount_apply_rp',
                        //     type: serverWidget.FieldType.TEXT,
                        //     label: 'MONTO APLICADO'
                        // });

                        sublist.addField({
                            id: 'sublist_field_entity_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PROVEEDOR/EMPLEADO'
                        });

                        sublist.addField({
                            id: 'sublist_field_memo_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'NOTA'
                        });

                        sublist.addField({
                            id: 'sublist_field_disponible_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'DISPONIBLE'
                        });

                        sublist.addField({
                            id: 'sublist_field_comprometido_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'COMPROMETIDO'
                        });

                        sublist.addField({
                            id: 'sublist_field_ejecutado_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'EJECUTADO'
                        });

                        sublist.addField({
                            id: 'sublist_field_pagado_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PAGADO'
                        });
                    }

                    if (param1flag == PAGADO) {
                        sublist.addField({
                            id: 'sublist_field_purchase_order_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PEDIDO'
                        });

                        sublist.addField({
                            id: 'sublist_field_transaction_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'FACTURA/NC'
                        });

                        sublist.addField({
                            id: 'sublist_field_vendor_payment_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PAGO'
                        });

                        sublist.addField({
                            id: 'sublist_field_entity_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PROVEEDOR/EMPLEADO'
                        });

                        sublist.addField({
                            id: 'sublist_field_memo_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'NOTA'
                        });

                        sublist.addField({
                            id: 'sublist_field_disponible_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'DISPONIBLE'
                        });

                        sublist.addField({
                            id: 'sublist_field_comprometido_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'COMPROMETIDO'
                        });

                        sublist.addField({
                            id: 'sublist_field_ejecutado_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'EJECUTADO'
                        });

                        sublist.addField({
                            id: 'sublist_field_pagado_rp',
                            type: serverWidget.FieldType.TEXT,
                            label: 'PAGADO'
                        });
                    }


                    //=================================================================================================================================================
                    if (flag == 1) {
                        retrieveSearch = runSearch(searchId, PAGE_SIZE, flag, param1flag, param2, param3, param4, param6, periodFlag);
                        quantity = retrieveSearch.count;
                        pageCount = Math.ceil(quantity / PAGE_SIZE);
                        // Set pageId to correct value if out of index
                        if (!pageId || pageId == '' || pageId < 0)
                            pageId = 0;
                        else if (pageId >= pageCount)
                            pageId = pageCount - 1;
                    }

                    let selectOptions = form.addField({
                        id: 'custpage_pageid',
                        label: 'INDICE DE PAGINA',
                        type: serverWidget.FieldType.SELECT,
                        container: 'custpage_sample_tab1'
                    });

                    form.addField({
                        id: 'fieldcomodin1',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: ' ',
                        container: 'custpage_sample_tab1'
                    }).defaultValue = "<div style='font-size:15px;padding-top:30px;'>TOTAL: " + quantity + "</div>";

                    if (flag == 1) {
                        for (let i = 0; i < pageCount; i++) {
                            if (i == pageId) {
                                selectOptions.addSelectOption({
                                    value: 'pageid_' + i,
                                    text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE),
                                    isSelected: true
                                });
                            } else {
                                selectOptions.addSelectOption({
                                    value: 'pageid_' + i,
                                    text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE)
                                });
                            }
                        }

                        // Get subset of data to be shown on page
                        if (retrieveSearch.count != 0) {
                            addResults = fetchSearchResult(retrieveSearch, pageId, param1flag);
                            log.debug('addResults', addResults);
                            // Set data returned to columns
                            let field_result_disponible = form.addField({ id: 'custpage_result_disponible', type: serverWidget.FieldType.TEXT, label: 'TOTAL DISPONIBLE', container: 'custpage_sample_tab1' });
                            field_result_disponible.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                            field_result_disponible.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
                            field_result_disponible.defaultValue = addResults.sumadisponible;

                            let field_result_comprometido = form.addField({ id: 'custpage_result_comprometido', type: serverWidget.FieldType.TEXT, label: 'TOTAL COMPROMETIDO', container: 'custpage_sample_tab1' });
                            field_result_comprometido.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                            field_result_comprometido.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
                            field_result_comprometido.defaultValue = addResults.sumacomprometido;

                            let field_result_ejecutado = form.addField({ id: 'custpage_result_ejecutado', type: serverWidget.FieldType.TEXT, label: 'TOTAL EJECUTADO', container: 'custpage_sample_tab1' });
                            field_result_ejecutado.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                            field_result_ejecutado.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
                            field_result_ejecutado.defaultValue = addResults.sumaejecutado;

                            let field_result_pagado = form.addField({ id: 'custpage_result_pagado', type: serverWidget.FieldType.TEXT, label: 'TOTAL PAGADO', container: 'custpage_sample_tab1' });
                            field_result_pagado.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                            field_result_pagado.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
                            field_result_pagado.defaultValue = addResults.sumapagado;

                            //?POSIBLE APLICACION (puede ser)
                            //let comodinJson = "<a href='#!' target='_blank' style='color:#1a6ece;'>Hola</a>" + "," + "<a href='#!'>Hola2</a>"

                            j = 0;
                            if (param1flag == COMPROMETIDO) {
                                addResults.results.forEach((result) => {
                                    sublist.setSublistValue({
                                        id: 'sublist_field_purchase_order_rp',
                                        line: j,
                                        value: result.purchaseorder
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_vendor_bill_rp',
                                        line: j,
                                        value: result.bill
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_vendor_payment_rp',
                                        line: j,
                                        value: result.payment
                                    });

                                    // sublist.setSublistValue({
                                    //     id: 'sublist_field_amount_rp',
                                    //     line: j,
                                    //     value: result.amount
                                    // });

                                    // sublist.setSublistValue({
                                    //     id: 'sublist_field_amount_apply_rp',
                                    //     line: j,
                                    //     value: result.amountapply
                                    // }); 

                                    sublist.setSublistValue({
                                        id: 'sublist_field_entity_rp',
                                        line: j,
                                        value: result.entity
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_memo_rp',
                                        line: j,
                                        value: result.memo
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_disponible_rp',
                                        line: j,
                                        value: result.disponible
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_comprometido_rp',
                                        line: j,
                                        value: result.comprometido
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_ejecutado_rp',
                                        line: j,
                                        value: result.ejecutado
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_pagado_rp',
                                        line: j,
                                        value: result.pagado
                                    });
                                    j++
                                });
                            }

                            if (param1flag == EJECUTADO) {
                                addResults.results.forEach((result) => {
                                    sublist.setSublistValue({
                                        id: 'sublist_field_purchase_order_rp',
                                        line: j,
                                        value: result.purchaseorder
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_transaction_rp',
                                        line: j,
                                        value: result.transaction
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_vendor_payment_rp',
                                        line: j,
                                        value: result.payment
                                    });

                                    // sublist.setSublistValue({
                                    //     id: 'sublist_field_amount_rp',
                                    //     line: j,
                                    //     value: result.amount
                                    // });

                                    // sublist.setSublistValue({
                                    //     id: 'sublist_field_amount_apply_rp',
                                    //     line: j,
                                    //     value: result.amountapply
                                    // });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_entity_rp',
                                        line: j,
                                        value: result.entity
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_memo_rp',
                                        line: j,
                                        value: result.memo
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_disponible_rp',
                                        line: j,
                                        value: result.disponible
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_comprometido_rp',
                                        line: j,
                                        value: result.comprometido
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_ejecutado_rp',
                                        line: j,
                                        value: result.ejecutado
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_pagado_rp',
                                        line: j,
                                        value: result.pagado
                                    });
                                    j++
                                });
                            }

                            if (param1flag == PAGADO) {
                                addResults.results.forEach((result) => {
                                    sublist.setSublistValue({
                                        id: 'sublist_field_purchase_order_rp',
                                        line: j,
                                        value: result.purchaseorder
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_transaction_rp',
                                        line: j,
                                        value: result.transaction
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_vendor_payment_rp',
                                        line: j,
                                        value: result.payment
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_entity_rp',
                                        line: j,
                                        value: result.entity
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_memo_rp',
                                        line: j,
                                        value: result.memo
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_disponible_rp',
                                        line: j,
                                        value: result.disponible
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_comprometido_rp',
                                        line: j,
                                        value: result.comprometido
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_ejecutado_rp',
                                        line: j,
                                        value: result.ejecutado
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_pagado_rp',
                                        line: j,
                                        value: result.pagado
                                    });
                                    j++
                                });
                            }
                        }
                    } else {
                        selectOptions.addSelectOption({
                            value: -1,
                            text: 0
                        });
                    }


                    //=================================================================================================================================================
                    //form.addSubmitButton({ label: 'Generar Reporte' });
                    scriptContext.response.writePage(form);
                } else {
                    // //let sublistData = scriptContext.request.parameters.sublistdata;
                    // let json = new Array();
                    // json = {
                    //     'custscript_year_rp': scriptContext.request.parameters.custpage_filter_year_rp_flag,
                    //     'custscript_subsidiaria_rp': scriptContext.request.parameters.custpage_filter_subsidiaria_rp_flag,
                    //     'custscript_ceco_rp': scriptContext.request.parameters.custpage_filter_ceco_rp_flag,
                    //     'custscript_categoria_rp': scriptContext.request.parameters.custpage_filter_categoria_rp_flag,
                    //     'custscript_cuenta_rp': scriptContext.request.parameters.custpage_filter_cuenta_rp_flag,
                    //     'custscript_estado_rp': scriptContext.request.parameters.custpage_filter_estado_rp_flag
                    // }

                    // let logRecordid = createRecord(json);
                    // taskScheduled(parseInt(logRecordid));

                    // log.debug('ResponsePost', 'Json cargado idRecord: ' + logRecordid);
                    // redirect.toSuitelet({
                    //     scriptId: 'customscript_ts_ui_reporte_rp_report',
                    //     deploymentId: 'customdeploy_ts_ui_reporte_rp_report',
                    //     parameters: {}
                    // });
                }
            } catch (error) {
                log.error('Error-onRequest', error);
            }
        }

        const taskScheduled = (recordid) => {
            try {
                const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                mrTask.scriptId = 'customscript_ts_ss_reporte_rp_report';
                mrTask.deploymentId = 'customdeploy_ts_ss_reporte_rp_report';
                mrTask.params = {
                    'custscript_lh_logrecordid_rp': recordid
                }
                mrTask.submit();
            } catch (error) {
                record.submitFields({
                    type: LOG_RECORD,
                    id: recordid,
                    values: {
                        'custrecord_lh_process_status_rp': 'Proceso en espera'
                    }
                });
                //log.error('Error-taskScheduled', error);
                log.error('RegistroEspera', 'Registro: ' + recordid + ' ingresa a la cola de espera.');
            }
        }

        const runSearch = (searchId, searchPageSize, flag, param1, param2, param3, param4, param6, period) => {
            let searchObj = search.load({ id: searchId });
            let filters = searchObj.filters;

            if (param1 == COMPROMETIDO) {
                const filterFour = search.createFilter({ name: 'custcol_lh_ppto_flag', join: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: param6 });
                filters.push(filterFour);
                const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_dt_centro_costo', operator: search.Operator.ANYOF, values: param2 });
                filters.push(filterTwo);
            } else {
                const filterSeven = search.createFilter({ name: 'custrecord_lh_cp_dt_category_ppto', operator: search.Operator.ANYOF, values: param6 });
                filters.push(filterSeven);
            }

            // if (param1 == EJECUTADO) {
            //     const filterFour = search.createFilter({ name: 'custcol_lh_ppto_flag', join: 'custrecord_lh_cp_dt_factura_relacionada', operator: search.Operator.ANYOF, values: param6 });
            //     filters.push(filterFour);
            // }

            const filterThree = search.createFilter({ name: 'custrecord_lh_cp_dt_periodo', operator: search.Operator.ANYOF, values: period });
            filters.push(filterThree);
            //=================================================================================================================================================
            // if (param2 != -1 && param2.length != 0) {
            //     const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_dt_centro_costo', operator: search.Operator.ANYOF, values: param2 });
            //     filters.push(filterTwo);
            // }

            //!ESTE CAMPO ESTA POR CREAR EN EL DETALLE-VERIFICAR SI ES NECESARIO
            // if (param3 != -1 && param3.length != 0) {
            //     const filterSix = search.createFilter({ name: 'custrecord_lh_cp_dt_categoria_nombre', operator: search.Operator.ANYOF, values: param3 });
            //     filters.push(filterSix);
            // }

            // if (param4 != -1 && param4.length != 0) {
            //     const filterFive = search.createFilter({ name: 'custrecord_lh_cp_dt_cuenta_contable', operator: search.Operator.ANYOF, values: param4 });
            //     filters.push(filterFive);
            // }

            return searchObj.runPaged({ pageSize: searchPageSize });
        }

        const fetchSearchResult = (pagedData, pageIndex, param1flag) => {
            let searchPage = pagedData.fetch({ index: pageIndex });
            let results = new Array();
            let sumadisponible = 0.00;
            let sumacomprometido = 0.00;
            let sumaejecutado = 0.00;
            let sumapagado = 0.00;

            if (param1flag == COMPROMETIDO) {
                searchPage.data.forEach((result) => {
                    let internalidOC = result.getValue({ name: 'internalid', join: "CUSTRECORD_LH_CP_DT_PURCHASE_ORD_RELATED", summary: "GROUP" });
                    let lookupFields = search.lookupFields({ type: record.Type.PURCHASE_ORDER, id: internalidOC, columns: ['entity', 'custbodylh_objeto_sol'] });
                    let entity = lookupFields.entity[0].text;
                    let memo = lookupFields.custbodylh_objeto_sol;
                    memo = memo.length == 0 ? ' ' : memo;
                    let purchaseorder = result.getValue({ name: 'tranid', join: "CUSTRECORD_LH_CP_DT_PURCHASE_ORD_RELATED", summary: "GROUP" });
                    let bill = result.getText({ name: 'custrecord_lh_cp_dt_factura_relacionada', summary: "GROUP" });
                    bill = bill == '- None -' ? ' ' : bill;
                    let payment = result.getText({ name: 'custrecord_lh_cp_dt_pago_relacionado', summary: "GROUP" });
                    payment = payment == '- None -' ? ' ' : payment;
                    // let amount = parseFloat(result.getValue({ name: 'fxamount', join: "CUSTRECORD_LH_CP_DT_PURCHASE_ORD_RELATED", summary: "SUM" }));
                    // let amountapply = parseFloat(result.getValue({ name: 'formulacurrency', summary: "SUM", formula: "{CUSTRECORD_LH_CP_DT_PURCHASE_ORD_RELATED.fxamount}/{custrecord_lh_cp_dt_tipo_cambio}" }));
                    let disponible = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_disponible', summary: "GROUP" }));
                    let comprometido = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_comprometido', summary: "GROUP" }));
                    let ejecutado = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_ejecutado', summary: "GROUP" }));
                    let pagado = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_pagado', summary: "GROUP" }));

                    sumadisponible += disponible;
                    sumacomprometido += comprometido;
                    sumaejecutado += ejecutado;
                    sumapagado += pagado;
                    //let comodinJson = "<a href='#!' target='_blank' style='color:#1a6ece;'>Hola</a>" + "," + "<a href='#!'>Hola2</a>"
                    results.push({
                        "purchaseorder": purchaseorder,
                        //"bill": bill.replace(/VendBill/g, "<a href='#!' target='_blank' style='color:#1a6ece;'>" + bill + "</a>").replace(/VendCred/g, 'NC'),
                        "bill": bill.replace(/VendBill/g, "FA").replace(/VendCred/g, 'NC').replace(/ExpRept/g, 'IG'),
                        "payment": payment.replace(/VendPymt-/g, '').replace(/Journal/g, 'DI'),
                        // "amount": amount,
                        // "amountapply": amountapply,
                        'entity': entity,
                        'memo': memo,
                        'disponible': disponible,
                        'comprometido': comprometido,
                        'ejecutado': ejecutado,
                        'pagado': pagado
                    });
                });
            }

            if (param1flag == EJECUTADO) {
                searchPage.data.forEach((result) => {
                    let entity = ' ';
                    let memo = ' ';
                    let internalid = result.getValue({ name: 'internalid', summary: "GROUP" });
                    let purchaseorder = search.lookupFields({ type: DETALLE_TRANSACCION_RECORD, id: internalid, columns: ['custrecord_lh_cp_dt_purchase_ord_related'] });
                    purchaseordertxt = purchaseorder.custrecord_lh_cp_dt_purchase_ord_related[0].text;
                    let transaction = result.getText({ name: 'custrecord_lh_cp_dt_factura_relacionada', summary: "GROUP" });
                    transaction = transaction == '- None -' ? ' ' : transaction;
                    let payment = result.getText({ name: 'custrecord_lh_cp_dt_pago_relacionado', summary: "GROUP" });
                    payment = payment == '- None -' ? ' ' : payment;
                    if (purchaseordertxt.length > 1) {
                        let lookupFields = search.lookupFields({ type: record.Type.PURCHASE_ORDER, id: purchaseorder.custrecord_lh_cp_dt_purchase_ord_related[0].value, columns: ['entity', 'custbodylh_objeto_sol'] });
                        entity = lookupFields.entity[0].text;
                        memo = lookupFields.custbodylh_objeto_sol;
                        memo = memo.length == 0 ? ' ' : memo;
                    } else {
                        purchaseordertxt = ' ';
                    }
                    // let amount = parseFloat(result.getValue({ name: 'fxamount', join: "CUSTRECORD_LH_CP_DT_FACTURA_RELACIONADA", summary: "SUM" }));
                    // let amountapply = parseFloat(result.getValue({ name: 'formulacurrency', summary: "SUM", formula: "{CUSTRECORD_LH_CP_DT_FACTURA_RELACIONADA.fxamount}/{custrecord_lh_cp_dt_tipo_cambio}" }));
                    let disponible = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_disponible', summary: "GROUP" }));
                    let comprometido = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_comprometido', summary: "GROUP" }));
                    let ejecutado = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_ejecutado', summary: "GROUP" }));
                    let pagado = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_pagado', summary: "GROUP" }));

                    sumadisponible += disponible;
                    sumacomprometido += comprometido;
                    sumaejecutado += ejecutado;
                    sumapagado += pagado;

                    results.push({
                        "purchaseorder": purchaseordertxt.replace(/Purchase Order #/g, '').replace(/Pedido #/g, ''),
                        "transaction": transaction.replace(/VendBill/g, 'FA').replace(/VendCred/g, 'NC').replace(/ExpRept/g, 'IG'),
                        "payment": payment.replace(/VendPymt-/g, '').replace(/Journal/g, 'DI'),
                        // "amount": amount,
                        // "amountapply": amountapply,
                        'entity': entity,
                        'memo': memo,
                        "disponible": disponible,
                        "comprometido": comprometido,
                        "ejecutado": ejecutado,
                        "pagado": pagado
                    });
                });
            }

            if (param1flag == PAGADO) {
                searchPage.data.forEach((result) => {
                    let entity = ' ';
                    let memo = ' ';
                    let internalid = result.getValue({ name: 'internalid', summary: "GROUP" });
                    let purchaseorder = search.lookupFields({ type: DETALLE_TRANSACCION_RECORD, id: internalid, columns: ['custrecord_lh_cp_dt_purchase_ord_related'] });
                    purchaseordertxt = purchaseorder.custrecord_lh_cp_dt_purchase_ord_related[0].text;
                    let transaction = result.getText({ name: 'custrecord_lh_cp_dt_factura_relacionada', summary: "GROUP" });
                    transaction = transaction == '- None -' ? ' ' : transaction;
                    let payment = result.getText({ name: 'custrecord_lh_cp_dt_pago_relacionado', summary: "GROUP" });
                    payment = payment == '- None -' ? ' ' : payment;

                    if (purchaseordertxt.length > 1) {
                        let lookupFields = search.lookupFields({ type: record.Type.PURCHASE_ORDER, id: purchaseorder.custrecord_lh_cp_dt_purchase_ord_related[0].value, columns: ['entity', 'custbodylh_objeto_sol'] });
                        entity = lookupFields.entity[0].text;
                        memo = lookupFields.custbodylh_objeto_sol;
                        memo = memo.length == 0 ? ' ' : memo;
                    } else {
                        purchaseordertxt = ' ';
                    }

                    let disponible = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_disponible', summary: "SUM" }));
                    let comprometido = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_comprometido', summary: "SUM" }));
                    let ejecutado = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_ejecutado', summary: "SUM" }));
                    let pagado = parseFloat(result.getValue({ name: 'custrecord_lh_cp_dt_pagado', summary: "SUM" }));

                    sumadisponible += disponible;
                    sumacomprometido += comprometido;
                    sumaejecutado += ejecutado;
                    sumapagado += pagado;

                    results.push({
                        "purchaseorder": purchaseordertxt.replace(/Purchase Order #/g, '').replace(/Pedido #/g, ''),
                        "transaction": transaction.replace(/VendBill/g, 'FA').replace(/VendCred/g, 'NC').replace(/ExpRept/g, 'IG'),
                        "payment": payment.replace(/VendPymt-/g, '').replace(/Journal/g, 'DI'),
                        'entity': entity,
                        'memo': memo,
                        "disponible": disponible,
                        "comprometido": comprometido,
                        "ejecutado": ejecutado,
                        "pagado": pagado
                    });
                });
            }
            // log.debug('Results', results);
            // log.debug('sumadisponible', sumadisponible);
            // log.debug('sumacomprometido', sumacomprometido);
            // log.debug('sumaejecutado', sumaejecutado);
            // log.debug('sumapagado', sumapagado);
            return {
                'results': results,
                'sumadisponible': sumadisponible,
                'sumacomprometido': sumacomprometido,
                'sumaejecutado': sumaejecutado,
                'sumapagado': sumapagado
            }
        }

        const createRecord = (json) => {
            try {
                const recordlog = record.create({ type: LOG_RECORD, isDynamic: true });
                recordlog.setValue({ fieldId: 'custrecord_lh_task_status_rp', value: 0 });
                recordlog.setValue({ fieldId: 'custrecord_lh_process_status_rp', value: 'Procesando...' });
                recordlog.setValue({ fieldId: 'custrecord_lh_request_rp', value: JSON.stringify(json) });
                recordlog.setValue({ fieldId: 'custrecord_lh_url_file_cabinet_rp', value: 'https://7460686-sb1.app.netsuite.com/core/media/media.nl?id=66399&c=7460686_SB1&h=JiDKE6PM7BpnonXJA98sMZeiML5ZX_fY51fvYwD2eODwrrB7' });
                const recordlogid = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true });
                return recordlogid;
            } catch (error) {
                log.error('Error-createRecord', error)
            }
        }

        const sysDate = () => {
            try {
                let date = new Date();
                date.setDate(date.getDate() - 8);
                var tdate = date.getDate();
                var month = date.getMonth() + 1; // jan = 0
                var year = date.getFullYear();
                return currentDate = tdate + '/' + month + '/' + year;
                //return currentDate = '01/01/2022'
            } catch (e) {
                log.error('Error-sysDate', e);
            }
        }

        const getPeriodo = (month, year) => {
            //* abr 2022,ago 2022,dic 2022,ene 2022,feb 2022,jul 2022,jun 2022,mar 2022,may 2022,nov 2022,oct 2022,sep 2022
            let period = month + ' ' + year;
            log.debug('Period', period);
            let loadSearch = search.load({ id: SEARCH_SELECT4_ID });
            let filters2 = loadSearch.filters;
            const filterOne2 = search.createFilter({ name: 'periodname', operator: search.Operator.STARTSWITH, values: period });
            filters2.push(filterOne2);
            let result2 = loadSearch.run().getRange({ start: 0, end: 1 });
            let internalidPeriod = result2[0].getValue({ name: "internalid" });
            log.debug('internalidPeriod', internalidPeriod);
            return internalidPeriod;
        }



        // if (userObj.role == role_admin) {
        //     const upselectlocation = search.load({ id: SEARCH3_ID });;
        //     upselectlocation.run().each((result) => {
        //         const val = result.getValue(upselectlocation.columns[0]);
        //         const txt = result.getValue(upselectlocation.columns[1]);
        //         selectlocation.addSelectOption({
        //             value: val,
        //             text: txt
        //         });
        //         return true;
        //     });
        // } else {
        //     const userLocation = search.lookupFields({ type: search.Type.EMPLOYEE, id: userObj.id, columns: ['location'] });
        //     if (typeof userLocation.location[0] != 'undefined') {
        //         selectlocation.addSelectOption({
        //             value: userLocation.location[0].value,
        //             text: userLocation.location[0].text
        //         });
        //     }
        // }
        //Body ============================================================================================================================================

        return {
            onRequest: onRequest
        }
    });
/*******************************************************************************************************************
TRACKING
/*******************************************************************************************************************
Commit:01
Version: 1.0
Date: 18/08/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==================================================================================================================*/
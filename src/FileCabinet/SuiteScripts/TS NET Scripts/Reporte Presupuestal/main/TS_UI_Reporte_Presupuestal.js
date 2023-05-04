/*******************************************************************************************************************
This script for Reporte de presupuesto (Lista de oc, facturas de compra, nc y pagos) 
/******************************************************************************************************************* 
File Name: TS_UI_REPORTE_RP_Report.js                                                                        
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
define([
    'N/ui/serverWidget',
    'N/search',
    'N/redirect',
    'N/log',
    'N/runtime',
    'N/task',
    'N/record',
    'N/config',
    '../controller/TS_Script_Controller'
],
    (serverWidget, search, redirect, log, runtime, task, record, config, _Controller) => {
        const PAGE_SIZE = 500;
        const SEARCH_ID = 'customsearch_co_cate_ppto_estados_rp'; //CO Categoria PPTO Estados - RP PRODUCCION
        const SEARCH2_ID = 'customsearch_co_log_report_ppto_rp'; //CO Log Report PPTO - RP PRODUCCION
        const SEARCH_SELECT1_ID = 'customsearch_co_anio_rp'; //CO Año - RP PRODUCCION
        const SEARCH_SELECT2_ID = 'customsearch_co_subsidiary_rp'; //CO Subsidiary - RP PRODUCCION
        const SEARCH_SELECT3_ID = 'customsearch_co_centro_costos_rp'; //CO Centro de Costos - RP PRODUCCION
        const SEARCH_SELECT4_ID = 'customsearch_co_categoria_rp'; //CO Categoria - RP PRODUCCION
        const SEARCH_SELECT5_ID = 'customsearch_co_chart_accounts_rp';//CO Chart Accounts - RP PRODUCCION
        const SEARCH_SELECT6_ID = 'customsearch_co_estado_rp' //CO Estado - RP PRODUCCION
        const SEARCH_SELECT7_ID = 'customsearch_co_categoria_presupuesto_rp'; //CO Categoría de Presupuesto - RP PRODUCCION
        const COMPROMETIDO = 'Comprometido';
        const EJECUTADO = 'Ejecutado';
        const PAGADO = 'Pagado';
        const URL_DETALLE_SEARCH = '/app/common/search/searchresults.nl?searchid=' //+####&whence=
        const ID_BUSQUEDA_DETALLE_RESERVADO = 5200 //SB-5200 --- PR-?
        const ID_BUSQUEDA_DETALLE_COMPROMETIDO = 5202 //SB-5200 --- PR-?
        const ID_BUSQUEDA_DETALLE_EJECUTADO = 5203 //SB-5200 --- PR-?
        const ID_BUSQUEDA_ADICION = 5211 //SB-5200 --- PR-?
        const ID_BUSQUEDA_DISMINUCION = 5213 //SB-5200 --- PR-?
        const CLIENT_SCRIPT_FILE_ID = 603431; //SB-603431 - PR-?
        const LOG_RECORD = 'customrecord_co_log_report_ppto'; //CO Log Report PPTO
        const EJECUTADO_SEARCH = 'customsearch_control_ppto_ejecutado';
        let parametros = '';

        class Parametros {
            constructor(fdesde, fhasta, fdesdetxt, fhastatxt, partida, ceco, categoria, cuenta) {
                this.fdesde = fdesde;
                this.fhasta = fhasta;
                this.fdesdetxt = fdesdetxt;
                this.fhastatxt = fhastatxt;
                this.partida = partida;
                this.ceco = ceco;
                this.categoria = categoria;
                this.cuenta = cuenta;
            }
        }


        const onRequest = (scriptContext) => {
            try {
                if (scriptContext.request.method === 'GET') {
                    let process = 'generatereport'
                    let flag = 0;
                    let vacio = -1;
                    let from = '';
                    let to = '';
                    let budget = '';
                    let costcenter = '';
                    let category = '';
                    let account = '';
                    // let param1txt = ''
                    let fromtxt = '';
                    let totxt = '';
                    let pageCount = 0;

                    //? Config declaration ==========================================
                    const userObj = runtime.getCurrentUser();
                    let configRecObj = config.load({ type: config.Type.COMPANY_INFORMATION });
                    const URL = configRecObj.getValue({ fieldId: 'appurl' }); //!https://cuenta.app.netsuite.com
                    let form = serverWidget.createForm({ title: 'Reporte de Presupuesto', hideNavBar: false });
                    form.clientScriptFileId = CLIENT_SCRIPT_FILE_ID;
                    //?==============================================================

                    //*Parameters ======================================================
                    parametros = new Parametros(from, to, fromtxt, totxt, budget, costcenter, category, account);
                    let pageId = parseInt(scriptContext.request.parameters.page);

                    if (typeof scriptContext.request.parameters.flag != 'undefined') {
                        flag = scriptContext.request.parameters.flag;
                        if (flag == 1) {
                            from = scriptContext.request.parameters.from;
                            if (from != -1 && from.length != 0) {
                                fromtxt = scriptContext.request.parameters.from;
                            }
                            to = scriptContext.request.parameters.to;
                            if (to != -1 && to.length != 0) {
                                totxt = scriptContext.request.parameters.to;
                            }

                            budget = scriptContext.request.parameters.budget;
                            costcenter = scriptContext.request.parameters.costcenter;
                            category = scriptContext.request.parameters.category;
                            account = scriptContext.request.parameters.account;
                            //param4 = scriptContext.request.parameters.param4;
                            // if (param3 != -1 && param3.length != 0) {
                            //     param3txtFlag = scriptContext.request.parameters.param3txt;
                            // }
                            parametros = new Parametros(from, to, fromtxt, totxt, budget, costcenter, category, account);
                        }
                    }
                    //*=================================================================

                    //?Fields ==========================================================================================================================================================================
                    form.addFieldGroup({ id: 'groupFilters', label: 'Filtros' });
                    let fdesde = form.addField({ id: 'custpage_date_from', type: serverWidget.FieldType.DATE, label: 'DESDE-' + parametros.fdesdetxt, container: 'groupFilters' });

                    let selectCeco = form.addField({ id: 'custpage_centro_costo', type: serverWidget.FieldType.SELECT, label: 'CENTRO DE COSTO - ', container: 'groupFilters' });
                    selectCeco.addSelectOption({ value: vacio, text: 'Seleccione...' });
                    let upselectfilter2 = search.load({ id: SEARCH_SELECT3_ID });
                    upselectfilter2.run().each((result) => {
                        const val = result.getValue(upselectfilter2.columns[0]);
                        const txt = result.getValue(upselectfilter2.columns[1]);
                        selectCeco.addSelectOption({ value: val, text: txt });
                        return true;
                    });

                    let fhasta = form.addField({ id: 'custpage_date_to', type: serverWidget.FieldType.DATE, label: 'HASTA-' + parametros.fhastatxt, container: 'groupFilters' });

                    let selectCategoria = form.addField({ id: 'custpage_categoria', type: serverWidget.FieldType.SELECT, label: 'CATEGORIA - ', container: 'groupFilters' });
                    selectCategoria.addSelectOption({ value: vacio, text: 'Seleccione...' });
                    let upselectfilter1 = search.load({ id: SEARCH_SELECT4_ID });
                    upselectfilter1.run().each((result) => {
                        const val = result.getValue(upselectfilter1.columns[0]);
                        const txt = result.getValue(upselectfilter1.columns[1]);
                        selectCategoria.addSelectOption({ value: val, text: txt });
                        return true;
                    });

                    let selectPartida = form.addField({ id: 'custpage_categoria_presupuesto', type: serverWidget.FieldType.SELECT, label: 'PARTIDA DE PRESUPUESTO', container: 'groupFilters' });
                    selectPartida.addSelectOption({ value: vacio, text: 'Seleccione...' });
                    let upselectfilter3 = search.load({ id: SEARCH_SELECT7_ID });
                    upselectfilter3.run().each((result) => {
                        const val = result.getValue(upselectfilter3.columns[0]);
                        const txt = result.getValue(upselectfilter3.columns[1]);
                        selectPartida.addSelectOption({ value: val, text: txt });
                        return true;
                    });
                    //selectAccount.defaultValue = 4219;

                    let selectCuenta = form.addField({ id: 'custpage_cuenta', type: serverWidget.FieldType.SELECT, label: 'CUENTA - ', container: 'groupFilters' });
                    selectCuenta.addSelectOption({ value: vacio, text: 'Seleccione...' });
                    let upselectfilter4 = search.load({ id: SEARCH_SELECT5_ID });
                    upselectfilter4.run().each((result) => {
                        const val = result.getValue(upselectfilter4.columns[0]);
                        const txt = result.getValue(upselectfilter4.columns[1]);
                        selectCuenta.addSelectOption({ value: val, text: txt });
                        return true;
                    });
                    //selectAccount.defaultValue = 4219;
                    //?FLAGS ==========================================================================================================================================================================
                    let field_partida_flag = form.addField({ id: 'custpage_categoriappto_flag', type: serverWidget.FieldType.TEXT, label: "PARTIDA FLAG", container: 'groupFilters' });
                    field_partida_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_partida_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_partida_flag.defaultValue = parametros.partida;

                    let field_ceco_flag = form.addField({ id: 'custpage_ceco_flag', type: serverWidget.FieldType.TEXT, label: "CECO FLAG", container: 'groupFilters' });
                    field_ceco_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_ceco_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_ceco_flag.defaultValue = parametros.ceco;

                    let field_categoria_flag = form.addField({ id: 'custpage_categoria_flag', type: serverWidget.FieldType.TEXT, label: "CATEGORIA FLAG", container: 'groupFilters' });
                    field_categoria_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_categoria_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_categoria_flag.defaultValue = parametros.categoria;

                    let field_account_flag = form.addField({ id: 'custpage_account_flag', type: serverWidget.FieldType.TEXT, label: "CUENTA FLAG", container: 'groupFilters' });
                    field_account_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_account_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_account_flag.defaultValue = parametros.cuenta;

                    let field_date_filter_from_flag = form.addField({ id: 'custpage_date_filter_from_flag', type: serverWidget.FieldType.TEXT, label: 'FECHA EMISION DESDE FLAG', container: 'groupFilters' });
                    field_date_filter_from_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_date_filter_from_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    let field_date_filter_to_flag = form.addField({ id: 'custpage_date_filter_to_flag', type: serverWidget.FieldType.TEXT, label: 'FECHA EMISION HASTA FLAG', container: 'groupFilters' });
                    field_date_filter_to_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_date_filter_to_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    if (flag == 0) {
                        selectPartida.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                        selectCategoria.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                        selectCeco.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                        selectCuenta.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    }

                    //?=================================================================================================================================================================================
                    form.addFieldGroup({ id: 'groupDetails', label: 'Link Detalles' });
                    let urlReservado = form.addField({ id: 'field_urlreservado', type: serverWidget.FieldType.INLINEHTML, label: ' ', container: 'groupDetails' })
                    urlReservado.defaultValue = "<div style='font-size:14px;padding-top:20px;'><a href=" + URL + URL_DETALLE_SEARCH + ID_BUSQUEDA_DETALLE_RESERVADO + "&whence=" + " target='_blank' style='color:#1a6ece;'>Detalle Reservado</a></div>";

                    let urlAdicion = form.addField({ id: 'field_urladicion', type: serverWidget.FieldType.INLINEHTML, label: ' ', container: 'groupDetails' })
                    urlAdicion.defaultValue = "<div style='font-size:14px;padding-top:20px;'><a href=" + URL + URL_DETALLE_SEARCH + ID_BUSQUEDA_ADICION + "&whence=" + " target='_blank' style='color:#1a6ece;'>Detalle Adición</a></div>";

                    let urlComprometido = form.addField({ id: 'field_urlcomprometido', type: serverWidget.FieldType.INLINEHTML, label: ' ', container: 'groupDetails' })
                    urlComprometido.defaultValue = "<div style='font-size:14px;padding-top:20px;'><a href=" + URL + URL_DETALLE_SEARCH + ID_BUSQUEDA_DETALLE_COMPROMETIDO + "&whence=" + " target='_blank' style='color:#1a6ece;'>Detalle Comprometido</a></div>";

                    let urlDisminucion = form.addField({ id: 'field_urldisminucion', type: serverWidget.FieldType.INLINEHTML, label: ' ', container: 'groupDetails' })
                    urlDisminucion.defaultValue = "<div style='font-size:14px;padding-top:20px;'><a href=" + URL + URL_DETALLE_SEARCH + ID_BUSQUEDA_DISMINUCION + "&whence=" + " target='_blank' style='color:#1a6ece;'>Detalle Disminución</a></div>";

                    let urlEjecutado = form.addField({ id: 'field_urlejecutado', type: serverWidget.FieldType.INLINEHTML, label: ' ', container: 'groupDetails' })
                    urlEjecutado.defaultValue = "<div style='font-size:14px;padding-top:20px;'><a href=" + URL + URL_DETALLE_SEARCH + ID_BUSQUEDA_DETALLE_EJECUTADO + "&whence=" + " target='_blank' style='color:#1a6ece;'>Detalle Ejecutado</a></div>";
                    //?=================================================================================================================================================================================
                    //*Tabs and Sub Tabs ===============================================
                    form.addTab({ id: 'custpage_sample_tab1', label: 'Presupuestos' });
                    form.addTab({ id: 'custpage_sample_tab2', label: 'Reportes' });
                    form.addSubtab({ id: 'custpage_main_sub_tab1', label: 'Lista de Presupuestos', tab: 'custpage_sample_tab1' });
                    form.addSubtab({ id: 'custpage_main_sub_tab2', label: 'Reportes Procesados', tab: 'custpage_sample_tab2' });
                    //!Imaportant ======================================================
                    let field_process_type = form.addField({ id: 'custpage_process_type', type: serverWidget.FieldType.TEXT, label: 'PROCESO', tab: 'custpage_main_sub_tab2' });
                    field_process_type.defaultValue = process;
                    field_process_type.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_process_type.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    //!=================================================================
                    //*=================================================================

                    //*Lista Presupuestos ========================================================================================================================================
                    let sublist = form.addSublist({ id: 'sublist', type: serverWidget.SublistType.LIST, label: 'Lista de Presupuestos', tab: 'custpage_main_sub_tab1' });
                    sublist.addRefreshButton();
                    sublist.addField({ id: 'sublist_field_id', type: serverWidget.FieldType.TEXT, label: 'ID' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    sublist.addField({ id: 'sublist_field_categoria', type: serverWidget.FieldType.TEXT, label: 'PARTIDA' });
                    sublist.addField({ id: 'sublist_field_presupuestado', type: serverWidget.FieldType.CURRENCY, label: 'PRESUPUESTADO' });
                    sublist.addField({ id: 'sublist_field_reservado', type: serverWidget.FieldType.CURRENCY, label: 'RESERVADO' });
                    sublist.addField({ id: 'sublist_field_comprometido', type: serverWidget.FieldType.CURRENCY, label: 'COMPROMETIDO' });
                    sublist.addField({ id: 'sublist_field_ejecutado', type: serverWidget.FieldType.CURRENCY, label: 'EJECUTADO' });
                    sublist.addField({ id: 'sublist_field_disponible', type: serverWidget.FieldType.CURRENCY, label: 'DISPONIBLE' });

                    if (typeof scriptContext.request.parameters.flag != 'undefined') {
                        if (flag == 1) {
                            field_date_filter_from_flag.defaultValue = from;
                            field_date_filter_to_flag.defaultValue = to;
                        }
                    }

                    if (flag != 0) {
                        retrieveSearch = runSearch(SEARCH_SELECT7_ID, PAGE_SIZE, flag, budget, costcenter, category, account);
                        quantity = retrieveSearch.count;
                        pageCount = Math.ceil(quantity / PAGE_SIZE);
                        if (!pageId || pageId == '' || pageId < 0)
                            pageId = 0;
                        else if (pageId >= pageCount)
                            pageId = pageCount - 1;
                    }
                    let selectOptions = form.addField({ id: 'custpage_pageid', label: 'INDICE DE PAGINA', type: serverWidget.FieldType.SELECT, container: 'custpage_sample_tab1' });

                    if (flag != 0) {
                        for (let i = 0; i < pageCount; i++) {
                            if (i == pageId) {
                                selectOptions.addSelectOption({ value: 'pageid_' + i, text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE), isSelected: true });
                            } else {
                                selectOptions.addSelectOption({ value: 'pageid_' + i, text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE) });
                            }
                        }

                        if (retrieveSearch.count != 0) {
                            addResults = fetchSearchResult(retrieveSearch, pageId, parametros);
                            //log.debug('Res', addResults);
                            j = 0;
                            addResults.forEach((result) => {
                                sublist.setSublistValue({ id: 'sublist_field_id', line: j, value: result.internalid });
                                sublist.setSublistValue({ id: 'sublist_field_categoria', line: j, value: result.categoriappto });
                                sublist.setSublistValue({ id: 'sublist_field_presupuestado', line: j, value: result.presupuestado });
                                // sublist.setSublistValue({ id: 'sublist_field_reservado', line: j, value: "<a href=" + URL + URL_DETALLE_SEARCH + ID_BUSQUEDA_DETALLE_RESERVADO + "&whence=" + " target='_blank' style='color:#1a6ece;'>" + result.reservado + "</a>" });
                                // sublist.setSublistValue({ id: 'sublist_field_comprometido', line: j, value: "<a href=" + URL + URL_DETALLE_SEARCH + ID_BUSQUEDA_DETALLE_COMPROMETIDO + "&whence=" + " target='_blank' style='color:#1a6ece;'>" + result.comprometido + "</a>" });
                                // sublist.setSublistValue({ id: 'sublist_field_ejecutado', line: j, value: "<a href=" + URL + URL_DETALLE_SEARCH + ID_BUSQUEDA_DETALLE_EJECUTADO + "&whence=" + " target='_blank' style='color:#1a6ece;'>" + result.ejecutado + "</a>" });
                                sublist.setSublistValue({ id: 'sublist_field_reservado', line: j, value: result.reservado });
                                sublist.setSublistValue({ id: 'sublist_field_comprometido', line: j, value: result.comprometido });
                                sublist.setSublistValue({ id: 'sublist_field_ejecutado', line: j, value: result.ejecutado });
                                sublist.setSublistValue({ id: 'sublist_field_disponible', line: j, value: result.disponible });
                                //sublist.setSublistValue({ id: 'sublist_field_total_rp', line: j, value: result.total });
                                j++
                            });
                        }
                    } else {
                        selectOptions.addSelectOption({ value: -1, text: 0 });
                    }
                    //*============================================================================================================================================================
                    //log.debug('Prueba Constructor', cate.categoria);
                    //form.addSubmitButton({ label: 'Generar Reporte' });
                    form.addButton({ id: 'btnClean', label: 'Limpiar Filtros', functionName: 'cancelarFiltros' });
                    scriptContext.response.writePage(form);
                } else {
                    // let sublistData = scriptContext.request.parameters.sublistdata;
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
                    // let pruebaFunc = _Controller.test_set_getValue();
                    // log.debug('pruebaFunc', pruebaFunc);
                    // scriptContext.response.write(pruebaFunc);
                }
            } catch (error) {
                log.error('Error-onRequest', error);
            }
        }


        const runSearch = (searchId, searchPageSize, flag, budget, costcenter, category, account) => {//&& param3.length != 0
            log.debug('PARAMS', budget + '-' + costcenter + '-' + category + '-' + account)
            let searchObj = search.load({ id: searchId });
            let filters = searchObj.filters;
            if (flag == 1) {
                if (budget != -1 && budget.length != 0) {
                    const filterFour = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: budget });
                    filters.push(filterFour);
                }

                if (costcenter != -1 && costcenter.length != 0) {
                    const filterThree = search.createFilter({ name: 'custrecord_lh_cp_centro_costo', operator: search.Operator.ANYOF, values: costcenter });
                    filters.push(filterThree);
                }

                if (category != -1 && category.length != 0) {
                    const filterOne = search.createFilter({ name: 'custrecord_lh_cp_nombre_categoria', operator: search.Operator.ANYOF, values: category });
                    filters.push(filterOne);
                }

                if (account != -1 && account.length != 0) {
                    const filterFive = search.createFilter({ name: 'custrecord_lh_cp_cuenta', operator: search.Operator.ANYOF, values: account });
                    filters.push(filterFive);
                }
            }
            return searchObj.runPaged({ pageSize: searchPageSize });
        }

        const fetchSearchResult = (pagedData, pageIndex, parametros) => {
            let searchPage = pagedData.fetch({ index: pageIndex });
            let results = new Array();
            searchPage.data.forEach((result) => {
                let internalid = result.getValue({ name: 'internalid' });
                // log.debug('PARTIDA', internalid);
                let name = result.getValue({ name: 'name' });
                let presupuestado = _Controller.getPresupuestado(parametros.fdesde, parametros.fhasta, internalid);
                // log.debug('Presupuestado', presupuestado);
                let reservado = _Controller.getReservado(parametros.fdesde, parametros.fhasta, internalid);
                // log.debug('Reservado', reservado);
                let comprometido = _Controller.getComprometido(parametros.fdesde, parametros.fhasta, internalid);
                // log.debug('Presupuestado', comprometido);
                let ejecutado = _Controller.getEjecutado(parametros.fdesde, parametros.fhasta, internalid);
                // log.debug('Presupuestado', ejecutado);
                let disponible = parseFloat(presupuestado) - (parseFloat(reservado) + parseFloat(comprometido) + parseFloat(ejecutado));
                results.push({
                    'internalid': internalid,
                    'categoriappto': name,
                    'presupuestado': presupuestado,
                    'reservado': reservado,
                    'comprometido': comprometido,
                    'ejecutado': ejecutado,
                    'disponible': disponible
                });
            });
            return results;
        }


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
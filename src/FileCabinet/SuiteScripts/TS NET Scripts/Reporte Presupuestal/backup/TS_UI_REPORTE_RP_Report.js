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
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/log', 'N/runtime', 'N/task', 'N/record'],
    (serverWidget, search, redirect, log, runtime, task, record) => {
        const PAGE_SIZE = 500;
        const SEARCH_ID = 'customsearch_co_cate_ppto_estados_rp'; //CO Categoria PPTO Estados - RP PRODUCCION
        const SEARCH2_ID = 'customsearch_co_log_report_ppto_rp'; //CO Log Report PPTO - RP PRODUCCION
        const SEARCH_SELECT1_ID = 'customsearch_co_anio_rp'; //CO Año - RP PRODUCCION
        const SEARCH_SELECT2_ID = 'customsearch_co_subsidiary_rp'; //CO Subsidiary - RP PRODUCCION
        const SEARCH_SELECT3_ID = 'customsearch_co_centro_costos_rp'; //CO Centro de Costos - RP PRODUCCION
        const SEARCH_SELECT4_ID = 'customsearch_co_categoria_rp'; //CO Categoria - RP PRODUCCION
        const SEARCH_SELECT5_ID = 'customsearch_co_chart_accounts_rp';//CO Chart Accounts - RP PRODUCCION
        const SEARCH_SELECT6_ID = 'customsearch_co_estado_rp' //CO Estado - RP PRODUCCION
        const COMPROMETIDO = 'Comprometido';
        const EJECUTADO = 'Ejecutado';
        const PAGADO = 'Pagado';
        //const URL = 'https://6776158-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1650&deploy=1&compid=6776158_SB1&page=NaN&flag=1&param1=' //SB
        const URL = 'https://6776158-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2071&deploy=1&page=NaN&flag=1&param1=' //PR


        const CLIENT_SCRIPT_FILE_ID = 558817; //SB-251252 - PR-558817
        const LOG_RECORD = 'customrecord_co_log_report_ppto'; //CO Log Report PPTO

        const onRequest = (scriptContext) => {
            try {
                if (scriptContext.request.method === 'GET') {
                    let process = 'generatereport'
                    let flag = 0;
                    let param1 = '';
                    let param2 = '';
                    let param3 = '';
                    let param4 = '';
                    let param5 = '';
                    let param6 = '';
                    let paramtxt1 = '';
                    let paramtxt2 = '';
                    let paramtxt3 = '';
                    let paramtxt4 = '';
                    let paramtxt5 = '';
                    let pageCount = 0;
                    let retrieveSearch = '';
                    let addResults = '';
                    let j;
                    let k;
                    let n;
                    let role_admin = 3;
                    let year = '';
                    let yeartxt = '';
                    let yeartxtFlag = '';
                    let param1txtFlag = '';
                    let param2txtFlag = '';
                    let param3txtFlag = '';
                    let param4txtFlag = '';
                    let param5txtFlag = '';
                    let param1flag = '';
                    let param2flag = '';
                    let param3flag = '';
                    let param4flag = '';
                    let param5flag = '';
                    let param6flag = '';
                    let flagApplyJson = '';
                    let flagApplyStatus = '';
                    let jsonInProccessing = new Array();
                    let quantity = 0;

                    const userObj = runtime.getCurrentUser();
                    // Get parameters
                    let pageId = parseInt(scriptContext.request.parameters.page);

                    //=================================================================================================================================================
                    if (typeof scriptContext.request.parameters.flag != 'undefined') {
                        flag = scriptContext.request.parameters.flag;
                        if (flag == 1) {
                            param1 = scriptContext.request.parameters.param1;
                            if (param1 != -1 && param1.length != 0) {
                                param1txtFlag = scriptContext.request.parameters.param1txt;
                            }
                            param2 = scriptContext.request.parameters.param2;
                            if (param2 != -1 && param2.length != 0) {
                                param2txtFlag = scriptContext.request.parameters.param2txt;
                            }

                            param3 = scriptContext.request.parameters.param3;
                            if (param3 != -1 && param3.length != 0) {
                                param3txtFlag = scriptContext.request.parameters.param3txt;
                            }

                            param4 = scriptContext.request.parameters.param4;
                            if (param4 != -1 && param4.length != 0) {
                                param4txtFlag = scriptContext.request.parameters.param4txt;
                            }

                            param5 = scriptContext.request.parameters.param5;
                            if (param5 != -1 && param5.length != 0) {
                                param5txtFlag = scriptContext.request.parameters.param5txt;
                            }
                        }
                    }

                    if (typeof scriptContext.request.parameters.year != 'undefined') {
                        year = scriptContext.request.parameters.year;
                        yeartxtFlag = scriptContext.request.parameters.yeartxt;
                    }
                    //=================================================================================================================================================
                    let form = serverWidget.createForm({ title: 'LH - Reporte de Presupuesto', hideNavBar: false });
                    form.clientScriptFileId = CLIENT_SCRIPT_FILE_ID;
                    //=================================================================================================================================================
                    let field_process_type = form.addField({ //! Important
                        id: 'custpage_process_type',
                        type: serverWidget.FieldType.TEXT,
                        label: 'PROCESO',
                    });
                    field_process_type.defaultValue = process;
                    field_process_type.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_process_type.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    //Filters==========================================================================================================================================
                    form.addFieldGroup({ id: 'groupInfoUser', label: 'Filtros' });
                    let selectyear = form.addField({
                        id: 'custpage_filter_year_rp',
                        type: serverWidget.FieldType.SELECT,
                        label: 'AÑO - ' + yeartxtFlag,
                        container: 'groupInfoUser'
                    });
                    selectyear.addSelectOption({
                        value: -1,
                        text: 'Seleccione...'
                    });

                    const upselectyear = search.load({ id: SEARCH_SELECT1_ID });
                    upselectyear.run().each((result) => {
                        const val = result.getValue(upselectyear.columns[0]);
                        const txt = result.getValue(upselectyear.columns[1]);
                        selectyear.addSelectOption({
                            value: val,
                            text: txt
                        });
                        return true;
                    });


                    let selectSubsidiaria = form.addField({
                        id: 'custpage_filter_subsidiaria_rp',
                        type: serverWidget.FieldType.SELECT,
                        label: 'SUBSIDIARIA - ' + param1txtFlag,
                        container: 'groupInfoUser'
                    });
                    selectSubsidiaria.addSelectOption({
                        value: -1,
                        text: 'Seleccione...'
                    });
                    if (typeof scriptContext.request.parameters.year != 'undefined') {
                        let upselectfilter1 = search.load({ id: SEARCH_SELECT2_ID });
                        upselectfilter1.run().each((result) => {
                            const val = result.getValue(upselectfilter1.columns[0]);
                            const txt = result.getValue(upselectfilter1.columns[1]);
                            selectSubsidiaria.addSelectOption({
                                value: val,
                                text: txt
                            });
                            return true;
                        });
                    }


                    let selectCeco = form.addField({
                        id: 'custpage_filter_ceco_rp',
                        type: serverWidget.FieldType.SELECT,
                        label: 'CENTRO DE COSTO - ' + param2txtFlag,
                        container: 'groupInfoUser'
                    });
                    //selectSubsidiaria.isMandatory = true;
                    selectCeco.addSelectOption({
                        value: -1,
                        text: 'Seleccione...'
                    });
                    if (typeof scriptContext.request.parameters.year != 'undefined') {
                        let upselectfilter2 = search.load({ id: SEARCH_SELECT3_ID });
                        upselectfilter2.run().each((result) => {
                            const val = result.getValue(upselectfilter2.columns[0]);
                            const txt = result.getValue(upselectfilter2.columns[1]);
                            selectCeco.addSelectOption({
                                value: val,
                                text: txt
                            });
                            return true;
                        });
                        //selectAccount.defaultValue = 4219;
                    }


                    let selectCategoria = form.addField({
                        id: 'custpage_filter_categoria_rp',
                        type: serverWidget.FieldType.SELECT,
                        label: 'CATEGORIA - ' + param3txtFlag,
                        container: 'groupInfoUser'
                    });
                    //selectSubsidiaria.isMandatory = true;
                    selectCategoria.addSelectOption({
                        value: -1,
                        text: 'Seleccione...'
                    });
                    if (typeof scriptContext.request.parameters.year != 'undefined') {
                        let upselectfilter3 = search.load({ id: SEARCH_SELECT4_ID });
                        upselectfilter3.run().each((result) => {
                            const val = result.getValue(upselectfilter3.columns[0]);
                            const txt = result.getValue(upselectfilter3.columns[1]);
                            selectCategoria.addSelectOption({
                                value: val,
                                text: txt
                            });
                            return true;
                        });
                        //selectAccount.defaultValue = 4219;
                    }


                    let selectCuenta = form.addField({
                        id: 'custpage_filter_cuenta_rp',
                        type: serverWidget.FieldType.SELECT,
                        label: 'CUENTA - ' + param4txtFlag,
                        container: 'groupInfoUser'
                    });
                    //selectSubsidiaria.isMandatory = true;
                    selectCuenta.addSelectOption({
                        value: -1,
                        text: 'Seleccione...'
                    });
                    if (typeof scriptContext.request.parameters.year != 'undefined') {
                        let upselectfilter4 = search.load({ id: SEARCH_SELECT5_ID });
                        upselectfilter4.run().each((result) => {
                            const val = result.getValue(upselectfilter4.columns[0]);
                            const txt = result.getValue(upselectfilter4.columns[1]);
                            selectCuenta.addSelectOption({
                                value: val,
                                text: txt
                            });
                            return true;
                        });
                        //selectAccount.defaultValue = 4219;
                    }


                    let selectEstado = form.addField({
                        id: 'custpage_filter_estado_rp',
                        type: serverWidget.FieldType.SELECT,
                        label: 'ESTADO - ' + param5txtFlag,
                        container: 'groupInfoUser'
                    });
                    selectEstado.addSelectOption({
                        value: -1,
                        text: 'Seleccione...'
                    });
                    if (typeof scriptContext.request.parameters.year != 'undefined') {
                        let upselectfilter5 = search.load({ id: SEARCH_SELECT6_ID });
                        upselectfilter5.run().each((result) => {
                            const val = result.getValue(upselectfilter5.columns[0]);
                            const txt = result.getValue(upselectfilter5.columns[1]);
                            // if (txt !== 'Anulado') {
                            selectEstado.addSelectOption({
                                value: val,
                                text: txt
                            });
                            // }
                            return true;
                        });
                    }

                    //Flags==========================================================================================================================================
                    let field_filter_year_rp_flag = form.addField({ id: 'custpage_filter_year_rp_flag', type: serverWidget.FieldType.TEXT, label: "YEAR FLAG", container: 'groupInfoUser' });
                    field_filter_year_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_year_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_year_rp_flag.defaultValue = year;

                    let field_filter_subsidiaria_rp_flag = form.addField({ id: 'custpage_filter_subsidiaria_rp_flag', type: serverWidget.FieldType.TEXT, label: "SUBSIDIARIA FLAG", container: 'groupInfoUser' });
                    field_filter_subsidiaria_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_subsidiaria_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_subsidiaria_rp_flag.defaultValue = param1;

                    let field_filter_ceco_rp_flag = form.addField({ id: 'custpage_filter_ceco_rp_flag', type: serverWidget.FieldType.TEXT, label: "CECO FLAG", container: 'groupInfoUser' });
                    field_filter_ceco_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_ceco_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_ceco_rp_flag.defaultValue = param2;

                    let field_filter_categoria_rp_flag = form.addField({ id: 'custpage_filter_categoria_rp_flag', type: serverWidget.FieldType.TEXT, label: "CATEGORIA FLAG", container: 'groupInfoUser' });
                    field_filter_categoria_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_categoria_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_categoria_rp_flag.defaultValue = param3;

                    let field_filter_cuenta_rp_flag = form.addField({ id: 'custpage_filter_cuenta_rp_flag', type: serverWidget.FieldType.TEXT, label: "CUENTA FLAG ", container: 'groupInfoUser' });
                    field_filter_cuenta_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_cuenta_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_cuenta_rp_flag.defaultValue = param4;

                    let field_filter_estado_rp_flag = form.addField({ id: 'custpage_filter_estado_rp_flag', type: serverWidget.FieldType.TEXT, label: "ESTADO FLAG", container: 'groupInfoUser' });
                    field_filter_estado_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_estado_rp_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_estado_rp_flag.defaultValue = param5;

                    //FlagsTXT==========================================================================================================================================
                    let field_filter_year_rp_flag_txt = form.addField({ id: 'custpage_filter_year_rp_flag_txt', type: serverWidget.FieldType.TEXT, label: "YEAR FLAG TXT", container: 'groupInfoUser' });
                    field_filter_year_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_year_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_year_rp_flag_txt.defaultValue = yeartxtFlag;

                    let field_filter_subsidiaria_rp_flag_txt = form.addField({ id: 'custpage_filter_subsidiaria_rp_flag_txt', type: serverWidget.FieldType.TEXT, label: "SUBSIDIARIA FLAG TXT", container: 'groupInfoUser' });
                    field_filter_subsidiaria_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_subsidiaria_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_subsidiaria_rp_flag_txt.defaultValue = param1txtFlag;

                    let field_filter_ceco_rp_flag_txt = form.addField({ id: 'custpage_filter_ceco_rp_flag_txt', type: serverWidget.FieldType.TEXT, label: "CECO FLAG TXT", container: 'groupInfoUser' });
                    field_filter_ceco_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_ceco_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_ceco_rp_flag_txt.defaultValue = param2txtFlag;

                    let field_filter_categoria_rp_flag_txt = form.addField({ id: 'custpage_filter_categoria_rp_flag_txt', type: serverWidget.FieldType.TEXT, label: "CATEGORIA FLAG TXT", container: 'groupInfoUser' });
                    field_filter_categoria_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_categoria_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_categoria_rp_flag_txt.defaultValue = param3txtFlag;

                    let field_filter_cuenta_rp_flag_txt = form.addField({ id: 'custpage_filter_cuenta_rp_flag_txt', type: serverWidget.FieldType.TEXT, label: "CUENTA FLAG TXT", container: 'groupInfoUser' });
                    field_filter_cuenta_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_cuenta_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_cuenta_rp_flag_txt.defaultValue = param4txtFlag;

                    let field_filter_estado_rp_flag_txt = form.addField({ id: 'custpage_filter_estado_rp_flag_txt', type: serverWidget.FieldType.TEXT, label: "ESTADO FLAG TXT", container: 'groupInfoUser' });
                    field_filter_estado_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_filter_estado_rp_flag_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_filter_estado_rp_flag_txt.defaultValue = param5txtFlag;

                    //===============================================================================================================================================================================================
                    form.addTab({ id: 'custpage_sample_tab1', label: 'Presupuestos' });
                    form.addTab({ id: 'custpage_sample_tab2', label: 'Reportes' });

                    //LIST 2 ===============================================================================================================================================================================================
                    form.addSubtab({ id: 'custpage_main_sub_tab2', label: 'Reportes Procesados', tab: 'custpage_sample_tab2' });
                    let sublist2 = form.addSublist({
                        id: 'sublist2',
                        type: serverWidget.SublistType.LIST,
                        label: 'Reportes Procesados',
                        tab: 'custpage_sample_tab2'
                    });
                    sublist2.addRefreshButton();

                    sublist2.addField({
                        id: 'sublist_field_id',
                        type: serverWidget.FieldType.TEXT,
                        label: 'ID'
                    });

                    sublist2.addField({
                        id: 'sublist_field_owner',
                        type: serverWidget.FieldType.TEXT,
                        label: 'EMITIDO POR'
                    });

                    sublist2.addField({
                        id: 'sublist_field_date',
                        type: serverWidget.FieldType.TEXT,
                        label: 'FECHA'
                    });

                    sublist2.addField({
                        id: 'sublist_field_process_status',
                        type: serverWidget.FieldType.TEXT,
                        label: 'ESTADO'
                    });

                    sublist2.addField({
                        id: 'sublist_field_url',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'DESCARGAR'
                    });

                    k = 0;
                    let jsonParse = new Array();
                    let obj;
                    // if (typeof scriptContext.request.parameters.year != 'undefined') {
                    //let sysdate = sysDate();
                    //log.debug('SYSDATE', sysdate);
                    let searchLogProcessStatus = search.load({ id: SEARCH2_ID });
                    let filters = searchLogProcessStatus.filters;
                    const filterOne = search.createFilter({ name: 'owner', operator: search.Operator.ANYOF, values: userObj.id });
                    filters.push(filterOne);
                    // const filterThree = search.createFilter({ name: 'created', operator: search.Operator.WITHIN, values: sysdate });
                    // filters.push(filterThree);
                    searchLogProcessStatus.run().each((result) => {
                        let logid = result.getValue(searchLogProcessStatus.columns[0]);
                        let owner = result.getText(searchLogProcessStatus.columns[1]);
                        let date = result.getValue(searchLogProcessStatus.columns[2]);
                        let status = result.getValue(searchLogProcessStatus.columns[3]);
                        let url = result.getValue(searchLogProcessStatus.columns[4]);

                        sublist2.setSublistValue({
                            id: 'sublist_field_id',
                            line: k,
                            value: logid
                        });

                        sublist2.setSublistValue({
                            id: 'sublist_field_owner',
                            line: k,
                            value: owner
                        });

                        sublist2.setSublistValue({
                            id: 'sublist_field_date',
                            line: k,
                            value: date
                        });

                        sublist2.setSublistValue({
                            id: 'sublist_field_process_status',
                            line: k,
                            value: status
                        });

                        sublist2.setSublistValue({
                            id: 'sublist_field_url',
                            line: k,
                            value: "<a href='" + url + "' target='_blank' style='color:#1a6ece;'>Descargar</a>"
                        });


                        // if (status == 'Procesando...' || status == 'Proceso en espera') {
                        //     flagApplyStatus = status
                        //     jsonParse = JSON.parse(trama);
                        //     for (let i in jsonParse) {
                        //         obj = jsonParse[i].split(' - ');
                        //         obj = obj[0]
                        //         jsonInProccessing.push(obj);
                        //     }
                        //     // jsonInProccessing.push(trama);
                        //     flagApplyJson = jsonInProccessing;
                        // }

                        //field_exist_proccess.defaultValue = trama;
                        k++
                        return true;
                    });
                    // }

                    //LIST1 =================================================================================================================================================
                    form.addSubtab({ id: 'custpage_main_sub_tab', label: 'Lista de Presupuestos', tab: 'custpage_sample_tab1' });

                    let sublist = form.addSublist({
                        id: 'sublist',
                        type: serverWidget.SublistType.LIST,
                        label: 'Lista de Presupuestos',
                        tab: 'custpage_main_sub_tab'
                    });

                    sublist.addRefreshButton();

                    sublist.addField({
                        id: 'sublist_field_subsidiary_rp',
                        type: serverWidget.FieldType.TEXT,
                        label: 'SUBSIDIARIA'
                    })
                    //.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });;

                    sublist.addField({
                        id: 'sublist_field_ceco_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'CENTRO DE COSTO'
                    });

                    sublist.addField({
                        id: 'sublist_field_categoria_rp',
                        type: serverWidget.FieldType.TEXT,
                        label: 'CATEGORIA'
                    });

                    sublist.addField({
                        id: 'sublist_field_cuenta_rp',
                        type: serverWidget.FieldType.TEXT,
                        label: 'CUENTA'
                    });

                    sublist.addField({
                        id: 'sublist_field_year_rp',
                        type: serverWidget.FieldType.TEXT,
                        label: 'AÑO'
                    });

                    sublist.addField({
                        id: 'sublist_field_estado_rp',
                        type: serverWidget.FieldType.TEXT,
                        label: 'ESTADO'
                    });

                    sublist.addField({
                        id: 'sublist_field_enero_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'ENERO'
                    });

                    sublist.addField({
                        id: 'sublist_field_febrero_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'FEBRERO'
                    });

                    sublist.addField({
                        id: 'sublist_field_marzo_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'MARZO'
                    });

                    sublist.addField({
                        id: 'sublist_field_abril_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'ABRIL'
                    });

                    sublist.addField({
                        id: 'sublist_field_mayo_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'MAYO'
                    });

                    sublist.addField({
                        id: 'sublist_field_junio_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'JUNIO'
                    });

                    sublist.addField({
                        id: 'sublist_field_julio_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'JULIO'
                    });

                    sublist.addField({
                        id: 'sublist_field_agosto_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'AGOSTO'
                    });

                    sublist.addField({
                        id: 'sublist_field_septiembre_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'SEPTIEMBRE'
                    });

                    sublist.addField({
                        id: 'sublist_field_octubre_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'OCTUBRE'
                    });

                    sublist.addField({
                        id: 'sublist_field_noviembre_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'NOVIEMBRE'
                    });

                    sublist.addField({
                        id: 'sublist_field_diciembre_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'DICIEMBRE'
                    });

                    sublist.addField({
                        id: 'sublist_field_total_rp',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'TOTAL'
                    });

                    //=================================================================================================================================================

                    if (flag != 0 || flag == 2) {
                        retrieveSearch = runSearch(SEARCH_ID, PAGE_SIZE, flag, param1, param2, param3, param4, param5, year);
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

                    // let field_total_records = form.addField({
                    //     id: 'custpage_quantity_records',
                    //     label: 'TOTAL',
                    //     type: serverWidget.FieldType.TEXT,
                    //     container: 'custpage_sample_tab1'
                    // });
                    // field_total_records.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                    // field_total_records.defaultValue = quantity;

                    if (flag != 0 || flag == 2) {
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
                            addResults = fetchSearchResult(retrieveSearch, pageId);
                            // Set data returned to columns
                            j = 0;
                            addResults.forEach((result) => {
                                let catePPTO = result.categoriaPPTO
                                sublist.setSublistValue({
                                    id: 'sublist_field_subsidiary_rp',
                                    line: j,
                                    value: result.subsidiaria
                                });

                                sublist.setSublistValue({
                                    id: 'sublist_field_ceco_rp',
                                    line: j,
                                    value: result.ceco
                                });

                                sublist.setSublistValue({
                                    id: 'sublist_field_categoria_rp',
                                    line: j,
                                    value: result.categoria
                                });

                                sublist.setSublistValue({
                                    id: 'sublist_field_cuenta_rp',
                                    line: j,
                                    value: result.cuenta
                                });

                                sublist.setSublistValue({
                                    id: 'sublist_field_year_rp',
                                    line: j,
                                    value: result.anio
                                });

                                sublist.setSublistValue({
                                    id: 'sublist_field_estado_rp',
                                    line: j,
                                    value: result.estado
                                });

                                if (result.estado == COMPROMETIDO || result.estado == EJECUTADO || result.estado == PAGADO) {
                                    sublist.setSublistValue({
                                        id: 'sublist_field_enero_rp',
                                        line: j,
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=ene&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece;'>" + result.enero + "</a>"
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_febrero_rp',
                                        line: j,
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=feb&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece;'>" + result.febrero + "</a>"
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_marzo_rp',
                                        line: j,
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=mar&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece;'>" + result.marzo + "</a>"
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_abril_rp',
                                        line: j,
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=abr&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece;'>" + result.abril + "</a>"
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_mayo_rp',
                                        line: j,
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=may&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece;'>" + result.mayo + "</a>"
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_junio_rp',
                                        line: j,
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=jun&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece;'>" + result.junio + "</a>"
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_julio_rp',
                                        line: j,
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=jul&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece;'>" + result.julio + "</a>"
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_agosto_rp',
                                        line: j,
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=ago&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece;'>" + result.agosto + "</a>"
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_septiembre_rp',
                                        line: j,
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=sep&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece;'>" + result.septiembre + "</a>"
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_octubre_rp',
                                        line: j,
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=oct&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece;'>" + result.octubre + "</a>"
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_noviembre_rp',
                                        line: j,
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=nov&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece;'>" + result.noviembre + "</a>"
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_diciembre_rp',
                                        line: j,
                                        //value: "<a href=" + '"https://7460686.app.netsuite.com/app/accounting/transactions/custinvc.nl?id="' + catePPTO + " & whence=' target='_blank' style='color:#1a6ece; '>" + result.diciembre + "</a>"
                                        value: "<a href=" + URL + result.estado + "&param2=" + result.cecoid + "&param3=" + result.categoriaid + "&param4=" + result.cuentaid + "&param5=dic&param6=" + result.categoriaPPTO + "&param7=" + result.anio + " target='_blank' style='color:#1a6ece; '>" + result.diciembre + "</a>"

                                    });
                                } else {
                                    sublist.setSublistValue({
                                        id: 'sublist_field_enero_rp',
                                        line: j,
                                        value: result.enero
                                    });


                                    sublist.setSublistValue({
                                        id: 'sublist_field_febrero_rp',
                                        line: j,
                                        value: result.febrero
                                    });


                                    sublist.setSublistValue({
                                        id: 'sublist_field_marzo_rp',
                                        line: j,
                                        value: result.marzo
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_abril_rp',
                                        line: j,
                                        value: result.abril
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_mayo_rp',
                                        line: j,
                                        value: result.mayo
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_junio_rp',
                                        line: j,
                                        value: result.junio
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_julio_rp',
                                        line: j,
                                        value: result.julio
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_agosto_rp',
                                        line: j,
                                        value: result.agosto
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_septiembre_rp',
                                        line: j,
                                        value: result.septiembre
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_octubre_rp',
                                        line: j,
                                        value: result.octubre
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_noviembre_rp',
                                        line: j,
                                        value: result.noviembre
                                    });

                                    sublist.setSublistValue({
                                        id: 'sublist_field_diciembre_rp',
                                        line: j,
                                        value: result.diciembre
                                    });
                                }

                                sublist.setSublistValue({
                                    id: 'sublist_field_total_rp',
                                    line: j,
                                    value: result.total
                                });
                                j++
                            });
                        }
                    } else {
                        selectOptions.addSelectOption({
                            value: -1,
                            text: 0
                        });
                    }


                    //=================================================================================================================================================
                    let btnSubmit = form.addSubmitButton({ label: 'Generar Reporte' });
                    let btnClean = form.addButton({ id: 'btnClean', label: 'Limpiar Filtros', functionName: 'cancelarFiltros' });
                    if (typeof scriptContext.request.parameters.year == 'undefined') {
                        btnClean.isDisabled = true;
                        btnSubmit.isDisabled = true;
                    }
                    // form.addButton({
                    //     id: 'btnredirectPrintInvoice',
                    //     label: "Impresión Facturas",
                    //     // functionName: 'window.open("https://7460686-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=customscript_evol_bg_ui_prnt_mass_inv_so&deploy=customdeploy_evol_bg_ui_prnt_mass_inv_so");'
                    //     functionName: 'redirectPrint'
                    // });
                    scriptContext.response.writePage(form);
                } else {
                    //let sublistData = scriptContext.request.parameters.sublistdata;
                    let json = new Array();
                    json = {
                        'custscript_year_rp': scriptContext.request.parameters.custpage_filter_year_rp_flag,
                        'custscript_subsidiaria_rp': scriptContext.request.parameters.custpage_filter_subsidiaria_rp_flag,
                        'custscript_ceco_rp': scriptContext.request.parameters.custpage_filter_ceco_rp_flag,
                        'custscript_categoria_rp': scriptContext.request.parameters.custpage_filter_categoria_rp_flag,
                        'custscript_cuenta_rp': scriptContext.request.parameters.custpage_filter_cuenta_rp_flag,
                        'custscript_estado_rp': scriptContext.request.parameters.custpage_filter_estado_rp_flag
                    }

                    let logRecordid = createRecord(json);
                    taskScheduled(parseInt(logRecordid));

                    log.debug('ResponsePost', 'Json cargado idRecord: ' + logRecordid);
                    redirect.toSuitelet({
                        scriptId: 'customscript_ts_ui_reporte_rp_report',
                        deploymentId: 'customdeploy_ts_ui_reporte_rp_report',
                        parameters: {}
                    });
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

        const runSearch = (searchId, searchPageSize, flag, param1, param2, param3, param4, param5, year) => {
            let searchObj = search.load({ id: searchId });
            let filters = searchObj.filters;

            const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
            filters.push(filterOne);
            //=================================================================================================================================================
            if (flag == 1) {
                if (param1 != -1 && param1.length != 0) {
                    const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_categoriap_subsidiaria', join: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: param1 });
                    filters.push(filterTwo);
                }

                if (param2 != -1 && param2.length != 0) {
                    const filterThree = search.createFilter({ name: 'custrecord_lh_cp_centro_costo', join: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: param2 });
                    filters.push(filterThree);
                }

                if (param3 != -1 && param3.length != 0) {
                    const filterFour = search.createFilter({ name: 'custrecord_lh_cp_nombre_categoria', join: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: param3 });
                    filters.push(filterFour);
                }

                if (param4 != -1 && param4.length != 0) {
                    const filterFive = search.createFilter({ name: 'custrecord_lh_cp_cuenta', join: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: param4 });
                    filters.push(filterFive);
                }

                if (param5 != -1 && param5.length != 0) {
                    const filterSix = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: param5 });
                    filters.push(filterSix);
                }
            }
            return searchObj.runPaged({ pageSize: searchPageSize });
        }

        const fetchSearchResult = (pagedData, pageIndex) => {
            let searchPage = pagedData.fetch({ index: pageIndex });
            let results = new Array();
            searchPage.data.forEach((result) => {
                let categoriaPPTO = result.getValue({ name: 'custrecord_lh_detalle_cppto_categoria' });
                let subsidiaria = result.getText({ name: 'custrecord_lh_cp_categoriap_subsidiaria', join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA" });
                let ceco = result.getText({ name: 'custrecord_lh_cp_centro_costo', join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA" });
                ceco = ceco.length == 0 ? ' ' : ceco;
                let categoria = result.getText({ name: 'custrecord_lh_cp_nombre_categoria', join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA" });
                categoria = categoria.length == 0 ? ' ' : categoria;
                let cuenta = result.getText({ name: 'custrecord_lh_cp_cuenta', join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA" });
                cuenta = cuenta.length == 0 ? ' ' : cuenta;
                let anio = result.getText({ name: 'custrecord_lh_detalle_cppto_anio' });
                let estado = result.getText({ name: 'custrecord_lh_detalle_cppto_status' });
                let enero = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_01' }));
                let febrero = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_02' }));
                let marzo = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_03' }));
                let abril = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_04' }));
                let mayo = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_05' }));
                let junio = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_06' }));
                let julio = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_07' }));
                let agosto = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_08' }));
                let septiembre = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_09' }));
                let octubre = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_10' }));
                let noviembre = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_11' }));
                let diciembre = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_12' }));
                let total = parseFloat(result.getValue({ name: 'custrecord_lh_detalle_cppto_total' }));
                let subsidiariaid = result.getValue({ name: 'custrecord_lh_cp_categoriap_subsidiaria', join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA" });
                let cecoid = result.getValue({ name: 'custrecord_lh_cp_centro_costo', join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA" });
                let categoriaid = result.getValue({ name: 'custrecord_lh_cp_nombre_categoria', join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA" });
                let cuentaid = result.getValue({ name: 'custrecord_lh_cp_cuenta', join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA" });

                results.push({
                    "categoriaPPTO": categoriaPPTO,
                    "subsidiaria": subsidiaria,
                    "ceco": ceco,
                    "categoria": categoria,
                    'cuenta': cuenta,
                    'anio': anio,
                    'estado': estado,
                    'enero': enero,
                    "febrero": febrero,
                    "marzo": marzo,
                    "abril": abril,
                    'mayo': mayo,
                    'junio': junio,
                    'julio': julio,
                    'agosto': agosto,
                    "septiembre": septiembre,
                    "octubre": octubre,
                    "noviembre": noviembre,
                    'diciembre': diciembre,
                    'total': total,
                    'subsidiariaid': subsidiariaid,
                    'cecoid': cecoid,
                    'categoriaid': categoriaid,
                    'cuentaid': cuentaid
                });

            });
            return results;
        }

        const upSelecFilter = (searchId, location) => {
            let searchObj = search.load({ id: searchId });
            let filters = searchObj.filters;
            const filterOne = search.createFilter({ name: 'location', operator: search.Operator.ANYOF, values: location });
            filters.push(filterOne);
            //=================================================================================================================================================
            return searchObj;
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
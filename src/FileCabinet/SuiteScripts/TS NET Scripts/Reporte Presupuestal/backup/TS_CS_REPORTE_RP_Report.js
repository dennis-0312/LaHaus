/*******************************************************************************************************************
This script for Reporte de presupuesto (Lista de oc, facturas de compra, nc y pagos) 
/******************************************************************************************************************* 
File Name: TS_CS_REPORTE_RP_Report.js                                                                        
Commit: 02                                                        
Version: 1.0                                                                     
Date: 18/08/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
==================================================================================================================*/
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/ui/dialog', 'N/search', 'N/runtime'], (url, currentRecord, dialog, search, runtime) => {

    const pageInit = (context) => {
        // const userObj = runtime.getCurrentUser();
        // const userLocation = search.lookupFields({ type: search.Type.EMPLOYEE, id: userObj.id, columns: ['location'] });
        // console.log(userLocation.location[0].value);

        let custpage_process_type = context.currentRecord.getValue('custpage_process_type');
        const existSearch = searchOpen(custpage_process_type);
        console.log(existSearch);
        if (existSearch.searchResultCount != 0) {
            //context.currentRecord.setValue('custpage_exist_proccess');
            context.currentRecord.setValue({
                fieldId: 'custpage_exist_proccess',
                value: 1,
                ignoreFieldChange: true,
                forceSyncSourcing: true
            });
        } else {
            context.currentRecord.setValue({
                fieldId: 'custpage_exist_proccess',
                value: 0,
                ignoreFieldChange: true,
                forceSyncSourcing: true
            });
        }


    }

    const fieldChanged = (context) => {
        // Navigate to selected page
        //const record = currentRecord.get();
        let filter1 = '';
        let filter2 = '';
        let filter3 = '';
        let filter4 = '';
        let filter5 = '';
        let filteryear = '';
        let custpage_process_type = context.currentRecord.getValue('custpage_process_type');

        let filter_year_rp = context.currentRecord.getValue('custpage_filter_year_rp');
        let filter_subsidiaria_rp = context.currentRecord.getValue('custpage_filter_subsidiaria_rp');
        let filter_ceco_rp = context.currentRecord.getValue('custpage_filter_ceco_rp');
        let filter_categoria_rp = context.currentRecord.getValue('custpage_filter_categoria_rp');
        let filter_cuenta_rp = context.currentRecord.getValue('custpage_filter_cuenta_rp');
        let filter_estado_rp = context.currentRecord.getValue('custpage_filter_estado_rp');

        //FLAGS =====================================================================================
        let filter_year_rp_flag = context.currentRecord.getValue('custpage_filter_year_rp_flag');
        let filter_subsidiaria_rp_flag = context.currentRecord.getValue('custpage_filter_subsidiaria_rp_flag');
        let filter_ceco_rp_flag = context.currentRecord.getValue('custpage_filter_ceco_rp_flag');
        let filter_categoria_rp_flag = context.currentRecord.getValue('custpage_filter_categoria_rp_flag');
        let filter_cuenta_rp_flag = context.currentRecord.getValue('custpage_filter_cuenta_rp_flag');
        let filter_estado_rp_flag = context.currentRecord.getValue('custpage_filter_estado_rp_flag');

        //FLAGS TXT =====================================================================================
        let filter_year_rp_flag_text = context.currentRecord.getText('custpage_filter_year_rp');
        let filter_subsidiaria_rp_flag_text = context.currentRecord.getText('custpage_filter_subsidiaria_rp');
        let filter_ceco_rp_flag_text = context.currentRecord.getText('custpage_filter_ceco_rp');
        let filter_categoria_rp_flag_text = context.currentRecord.getText('custpage_filter_categoria_rp');
        let filter_cuenta_rp_flag_text = context.currentRecord.getText('custpage_filter_cuenta_rp');
        let filter_estado_rp_flag_text = context.currentRecord.getText('custpage_filter_estado_rp');

        //FLAGS TXT 2 =====================================================================================
        let filter_year_rp_flag_txt = context.currentRecord.getValue('custpage_filter_year_rp_flag_txt');
        let filter_subsidiaria_rp_flag_txt = context.currentRecord.getValue('custpage_filter_subsidiaria_rp_flag_txt');
        let filter_ceco_rp_flag_txt = context.currentRecord.getValue('custpage_filter_ceco_rp_flag_txt');
        let filter_categoria_rp_flag_txt = context.currentRecord.getValue('custpage_filter_categoria_rp_flag_txt');
        let filter_cuenta_rp_flag_txt = context.currentRecord.getValue('custpage_filter_cuenta_rp_flag_txt');
        let filter_estado_rp_flag_txt = context.currentRecord.getValue('custpage_filter_estado_rp_flag_txt');

        if (filter_year_rp != -1) {
            filteryear = filter_year_rp != -1 ? filter_year_rp : filter_year_rp_flag;
            filter1 = filter_subsidiaria_rp != -1 ? filter_subsidiaria_rp : filter_subsidiaria_rp_flag;
            filter2 = filter_ceco_rp != -1 ? filter_ceco_rp : filter_ceco_rp_flag;
            filter3 = filter_categoria_rp != -1 ? filter_categoria_rp : filter_categoria_rp_flag;
            filter4 = filter_cuenta_rp != -1 ? filter_cuenta_rp : filter_cuenta_rp_flag;
            filter5 = filter_estado_rp != -1 ? filter_estado_rp : filter_estado_rp_flag;

            let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            pageId = parseInt(pageId.split('_')[1]);
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                params: {
                    'page': pageId,
                    'flag': 1,
                    'param1': filter1,
                    'param2': filter2,
                    'param3': filter3,
                    'param4': filter4,
                    'param5': filter5,
                    'year': filteryear,
                    'param1txt': filter_subsidiaria_rp_flag_txt,
                    'param2txt': filter_ceco_rp_flag_txt,
                    'param3txt': filter_categoria_rp_flag_txt,
                    'param4txt': filter_cuenta_rp_flag_txt,
                    'param5txt': filter_estado_rp_flag_txt,
                    'yeartxt': filter_year_rp_flag_text,
                }
            });
        } else if (filter_subsidiaria_rp != -1) {
            filteryear = filter_year_rp != -1 ? filter_year_rp : filter_year_rp_flag;
            filter2 = filter_ceco_rp != -1 ? filter_ceco_rp : filter_ceco_rp_flag;
            filter3 = filter_categoria_rp != -1 ? filter_categoria_rp : filter_categoria_rp_flag;
            filter4 = filter_cuenta_rp != -1 ? filter_cuenta_rp : filter_cuenta_rp_flag;
            filter5 = filter_estado_rp != -1 ? filter_estado_rp : filter_estado_rp_flag;

            let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            pageId = parseInt(pageId.split('_')[1]);
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                params: {
                    'page': pageId,
                    'flag': 1,
                    'param1': filter_subsidiaria_rp,
                    'param2': filter2,
                    'param3': filter3,
                    'param4': filter4,
                    'param5': filter5,
                    'year': filteryear,
                    'param1txt': filter_subsidiaria_rp_flag_text,
                    'param2txt': filter_ceco_rp_flag_txt,
                    'param3txt': filter_categoria_rp_flag_txt,
                    'param4txt': filter_cuenta_rp_flag_txt,
                    'param5txt': filter_estado_rp_flag_txt,
                    'yeartxt': filter_year_rp_flag_txt,
                }
            });
        } else if (filter_ceco_rp != -1) {
            filteryear = filter_year_rp != -1 ? filter_year_rp : filter_year_rp_flag;
            filter1 = filter_subsidiaria_rp != -1 ? filter_subsidiaria_rp : filter_subsidiaria_rp_flag;
            filter3 = filter_categoria_rp != -1 ? filter_categoria_rp : filter_categoria_rp_flag;
            filter4 = filter_cuenta_rp != -1 ? filter_cuenta_rp : filter_cuenta_rp_flag;
            filter5 = filter_estado_rp != -1 ? filter_estado_rp : filter_estado_rp_flag;

            let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            pageId = parseInt(pageId.split('_')[1]);
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                params: {
                    'page': pageId,
                    'flag': 1,
                    'param1': filter1,
                    'param2': filter_ceco_rp,
                    'param3': filter3,
                    'param4': filter4,
                    'param5': filter5,
                    'year': filteryear,
                    'param1txt': filter_subsidiaria_rp_flag_txt,
                    'param2txt': filter_ceco_rp_flag_text,
                    'param3txt': filter_categoria_rp_flag_txt,
                    'param4txt': filter_cuenta_rp_flag_txt,
                    'param5txt': filter_estado_rp_flag_txt,
                    'yeartxt': filter_year_rp_flag_txt,
                }
            });
        } else if (filter_categoria_rp != -1) {
            filteryear = filter_year_rp != -1 ? filter_year_rp : filter_year_rp_flag;
            filter1 = filter_subsidiaria_rp != -1 ? filter_subsidiaria_rp : filter_subsidiaria_rp_flag;
            filter2 = filter_ceco_rp != -1 ? filter_ceco_rp : filter_ceco_rp_flag;
            filter4 = filter_cuenta_rp != -1 ? filter_cuenta_rp : filter_cuenta_rp_flag;
            filter5 = filter_estado_rp != -1 ? filter_estado_rp : filter_estado_rp_flag;

            let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            pageId = parseInt(pageId.split('_')[1]);
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                params: {
                    'page': pageId,
                    'flag': 1,
                    'param1': filter1,
                    'param2': filter2,
                    'param3': filter_categoria_rp,
                    'param4': filter4,
                    'param5': filter5,
                    'year': filteryear,
                    'param1txt': filter_subsidiaria_rp_flag_txt,
                    'param2txt': filter_ceco_rp_flag_txt,
                    'param3txt': filter_categoria_rp_flag_text,
                    'param4txt': filter_cuenta_rp_flag_txt,
                    'param5txt': filter_estado_rp_flag_txt,
                    'yeartxt': filter_year_rp_flag_txt,
                }
            });
        } else if (filter_cuenta_rp != -1) {
            filteryear = filter_year_rp != -1 ? filter_year_rp : filter_year_rp_flag;
            filter1 = filter_subsidiaria_rp != -1 ? filter_subsidiaria_rp : filter_subsidiaria_rp_flag;
            filter2 = filter_ceco_rp != -1 ? filter_ceco_rp : filter_ceco_rp_flag;
            filter3 = filter_categoria_rp != -1 ? filter_categoria_rp : filter_categoria_rp_flag;
            filter5 = filter_estado_rp != -1 ? filter_estado_rp : filter_estado_rp_flag;

            let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            pageId = parseInt(pageId.split('_')[1]);
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                params: {
                    'page': pageId,
                    'flag': 1,
                    'param1': filter1,
                    'param2': filter2,
                    'param3': filter3,
                    'param4': filter_cuenta_rp,
                    'param5': filter5,
                    'year': filteryear,
                    'param1txt': filter_subsidiaria_rp_flag_txt,
                    'param2txt': filter_ceco_rp_flag_txt,
                    'param3txt': filter_categoria_rp_flag_txt,
                    'param4txt': filter_cuenta_rp_flag_text,
                    'param5txt': filter_estado_rp_flag_txt,
                    'yeartxt': filter_year_rp_flag_txt,
                }
            });
        } else if (filter_estado_rp != -1) {
            filteryear = filter_year_rp != -1 ? filter_year_rp : filter_year_rp_flag;
            filter1 = filter_subsidiaria_rp != -1 ? filter_subsidiaria_rp : filter_subsidiaria_rp_flag;
            filter2 = filter_ceco_rp != -1 ? filter_ceco_rp : filter_ceco_rp_flag;
            filter3 = filter_categoria_rp != -1 ? filter_categoria_rp : filter_categoria_rp_flag;
            filter4 = filter_cuenta_rp != -1 ? filter_cuenta_rp : filter_cuenta_rp_flag;

            let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            pageId = parseInt(pageId.split('_')[1]);
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                params: {
                    'page': pageId,
                    'flag': 1,
                    'param1': filter1,
                    'param2': filter2,
                    'param3': filter3,
                    'param4': filter4,
                    'param5': filter_estado_rp,
                    'year': filteryear,
                    'param1txt': filter_subsidiaria_rp_flag_txt,
                    'param2txt': filter_ceco_rp_flag_txt,
                    'param3txt': filter_categoria_rp_flag_txt,
                    'param4txt': filter_cuenta_rp_flag_txt,
                    'param5txt': filter_estado_rp_flag_text,
                    'yeartxt': filter_year_rp_flag_txt,
                }
            });
        }
        // else if (context.fieldId == 'custpage_pageid' && datefilterfrom.length != 0 && datefilterto.length != 0) {
        //     filteryear = filter_year_rp != -1 ? filter_year_rp : filter_year_rp_flag;
        //     filter1 = filter_subsidiaria_rp != -1 ? filter_subsidiaria_rp : filter_subsidiaria_rp_flag;
        //     filter3 = filter_categoria_rp != -1 ? filter_categoria_rp : filter_categoria_rp_flag;
        //     filter4 = filter_cuenta_rp != -1 ? filter_cuenta_rp : filter_cuenta_rp_flag;
        //     filter5 = filter_estado_rp != -1 ? filter_estado_rp : filter_estado_rp_flag;
        //     // filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_period_flag_text;

        //     let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
        //     datefilterfrom = sysDate(datefilterfrom);
        //     datefilterto = sysDate(datefilterto);
        //     pageId = parseInt(pageId.split('_')[1]);
        //     window.onbeforeunload = null;
        //     document.location = url.resolveScript({
        //         scriptId: getParameterFromURL('script'),
        //         deploymentId: getParameterFromURL('deploy'),
        //         params: {
        //             'page': pageId,
        //             'flag': 1,
        //             'param1': datefilterfrom,
        //             'param2': datefilterto,
        //             'param3': filter3,
        //             'param4': filter4,
        //             'location': locationfilterFlag,
        //             'locationtxt': locationfilterFlagText,
        //             'param4txt': filtertxt
        //         }
        //     });
        // }
        else if (context.fieldId == 'custpage_pageid') {
            // if (datefilterfromFlag.length != 0 && datefiltertoFlag.length != 0) {
                // filter3 = carPlate.length != 0 ? carPlate : custpage_car_plate_flag;
                // filter4 = periodfilter != -1 ? periodfilter : custpage_period_flag;
                // filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_period_flag_text;

                let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
                pageId = parseInt(pageId.split('_')[1]);
                window.onbeforeunload = null;
                document.location = url.resolveScript({
                    scriptId: getParameterFromURL('script'),
                    deploymentId: getParameterFromURL('deploy'),
                    params: {
                        'page': pageId,
                        'flag': 1,
                        'param1': filter_subsidiaria_rp_flag,
                        'param2': filter_ceco_rp_flag,
                        'param3': filter_categoria_rp_flag,
                        'param4': filter_cuenta_rp_flag,
                        'param5': filter_estado_rp_flag,
                        'year': filter_year_rp_flag,
                        'param1txt': filter_subsidiaria_rp_flag_txt,
                        'param2txt': filter_ceco_rp_flag_txt,
                        'param3txt': filter_categoria_rp_flag_txt,
                        'param4txt': filter_cuenta_rp_flag_txt,
                        'param5txt': filter_estado_rp_flag_txt,
                        'yeartxt': filter_year_rp_flag_txt,
                    }
                });
            // } 
            // else if (custpage_process_type == 'generatemassinv' && custpage_period_flag.length != 0) { //! PROBAR EN PROD SI REQUIERE PAGINADO SIGUIENDO PERIOD
            //     filter = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
            //     filter2 = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
            //     filter3 = carPlate.length != 0 ? carPlate : custpage_car_plate_flag;
            //     filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_period_flag_text;

            //     let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            //     pageId = parseInt(pageId.split('_')[1]);
            //     window.onbeforeunload = null;
            //     document.location = url.resolveScript({
            //         scriptId: getParameterFromURL('script'),
            //         deploymentId: getParameterFromURL('deploy'),
            //         params: {
            //             'page': pageId,
            //             'flag': 1,
            //             'param1': filter,
            //             'param2': filter2,
            //             'param3': filter3,
            //             'param4': custpage_period_flag,
            //             'location': locationfilterFlag,
            //             'locationtxt': locationfilterFlagText,
            //             'param4txt': filtertxt
            //         }
            //     });
            // } else if (locationfilterFlag != -1) {
            //     filterloc = locationfilter != -1 ? locationfilter : locationfilterFlag;
            //     filterlocText = locationfiltertxt != 'Seleccione...' ? locationfiltertxt : locationfilterFlagText;

            //     filter = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
            //     filter2 = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
            //     filter3 = carPlate.length != 0 ? carPlate : custpage_car_plate_flag;
            //     filter4 = periodfilter != -1 ? periodfilter : custpage_period_flag;
            //     filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_period_flag_text;

            //     let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            //     pageId = parseInt(pageId.split('_')[1]);
            //     window.onbeforeunload = null;
            //     document.location = url.resolveScript({
            //         scriptId: getParameterFromURL('script'),
            //         deploymentId: getParameterFromURL('deploy'),
            //         params: {
            //             'page': pageId,
            //             'flag': 1,
            //             'param1': filter,
            //             'param2': filter2,
            //             'param3': filter3,
            //             'param4': filter4,
            //             'location': filterloc,
            //             'locationtxt': filterlocText,
            //             'param4txt': filtertxt
            //         }
            //     });
            // }
        } 
        // else if (custpage_process_type == 'generatemassinv' && periodfilter != -1) {
        //     filter = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
        //     filter2 = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
        //     filter3 = carPlate.length != 0 ? carPlate : custpage_car_plate_flag;
        //     filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_period_flag_text;

        //     let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
        //     pageId = parseInt(pageId.split('_')[1]);
        //     window.onbeforeunload = null;
        //     document.location = url.resolveScript({
        //         scriptId: getParameterFromURL('script'),
        //         deploymentId: getParameterFromURL('deploy'),
        //         params: {
        //             'page': pageId,
        //             'flag': 1,
        //             'param1': filter,
        //             'param2': filter2,
        //             'param3': filter3,
        //             'param4': periodfilter,
        //             'location': locationfilterFlag,
        //             'locationtxt': locationfilterFlagText,
        //             'param4txt': filtertxt
        //         }
        //     });
        // } else if (carPlate.length != 0) {
        //     filter = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
        //     filter2 = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
        //     filter4 = periodfilter != -1 ? periodfilter : custpage_period_flag;
        //     filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_period_flag_text;

        //     let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
        //     pageId = parseInt(pageId.split('_')[1]);
        //     window.onbeforeunload = null;
        //     document.location = url.resolveScript({
        //         scriptId: getParameterFromURL('script'),
        //         deploymentId: getParameterFromURL('deploy'),
        //         params: {
        //             'page': pageId,
        //             'flag': 1,
        //             'param1': filter,
        //             'param2': filter2,
        //             'param3': carPlate,
        //             'param4': filter4,
        //             'location': locationfilterFlag,
        //             'locationtxt': locationfilterFlagText,
        //             'param4txt': filtertxt
        //         }
        //     });
        // }
    }

    const saveRecord = (context) => {
        const record = currentRecord.get();
        try {
            let custpage_process_type = record.getValue('custpage_process_type');
            const existSearch = searchOpen(custpage_process_type);
            if (existSearch.searchResultCount != 0) {
                let message = '';
                message = 'Ya existe una tarea en proceso.\r\n Vuelva a intentarlo en unos minutos.';
                // if (existSearch.time <= 0) {
                //     message = 'Ya existe una tarea en proceso.\r\n Tiempo estimado de espera menos de un minuto.';
                // } else {
                //     message = 'Ya existe una tarea en proceso.\r\n Tiempo estimado de espera ' + existSearch.time + ' minuto(s).';
                // }
                let options = { title: 'Información', message: message }
                dialog.alert(options);
                console.log('saveRecord: False');
                return false;
            } else {
                console.log('saveRecord: True');
                return true;
            }
        } catch (e) {
            console.log('Error-saveRecord: ' + e);
        }
    }

    const getSuiteletPage = (suiteletScriptId, suiteletDeploymentId, pageId) => {
        window.onbeforeunload = null;
        document.location = url.resolveScript({
            scriptId: suiteletScriptId,
            deploymentId: suiteletDeploymentId,
            params: {
                'page': pageId
            }
        });
    }

    const getParameterFromURL = (param) => {
        let query = window.location.search.substring(1);
        let vars = query.split("&");
        for (let i = 0; i < vars.length; i++) {
            let pair = vars[i].split("=");
            if (pair[0] == param) {
                return decodeURIComponent(pair[1]);
            }
        }
        return (false);
    }

    const sysDate = (date_param) => {
        try {
            let date = new Date(date_param);
            //date.setDate(date.getDate() - 9);
            var tdate = date.getDate();
            var month = date.getMonth() + 1; // jan = 0
            var year = date.getFullYear();
            const currentDate = tdate + '/' + month + '/' + year;
            return currentDate
        } catch (e) {
            log.error('Error-sysDate', e);
        }
    }

    const searchOpen = (process) => {
        try {
            let searchLoad = search.load({ id: 'customsearch_pe_log_mass_invoice_ps' });
            let filters = searchLoad.filters;
            let filterOne = search.createFilter({ name: 'custrecord_pe_task_status_mass_invoice', operator: search.Operator.STARTSWITH, values: 0 });
            filters.push(filterOne);
            const filterTwo = search.createFilter({ name: 'custrecord_pe_process_type', operator: search.Operator.STARTSWITH, values: process });
            filters.push(filterTwo);

            const searchResultCount = searchLoad.runPaged().count;
            if (searchResultCount != 0) {
                const searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
                let time = searchResult[0].getValue(searchLoad.columns[5]);
                let fecha = searchResult[0].getValue(searchLoad.columns[6]);
                let tiempo = getTime(time, fecha);
                //console.log('searchResultCount: ' + searchResultCount);
                return {
                    searchResultCount: searchResultCount,
                    time: tiempo,
                    fecha: fecha
                }
            } else {
                return { searchResultCount: 0 };
            }
        } catch (error) {
            console.log('Error-searchOpen: ' + error);
        }
    }

    const getTime = (time, date) => {
        try {
            let fechaMain = date.split(' ');
            let fecha = fechaMain[0].split('/');
            if (typeof fechaMain[2] == 'undefined') {
                fecha = fecha[1] + '/' + fecha[0] + '/' + fecha[2] + ' ' + fechaMain[1];
            } else {
                fecha = fecha[1] + '/' + fecha[0] + '/' + fecha[2] + ' ' + fechaMain[1] + ' ' + fechaMain[2];
            }

            //console.log('Fecha: ' + fecha);
            let day1 = new Date(fecha);
            let day2 = new Date();

            let difference = day2.getTime() - day1.getTime();
            difference = (difference / 60000).toFixed();
            difference = time - difference;
            return difference;
        } catch (error) {
            console.error('Error-getTime: ' + error);
        }
    }

    // const redirectPrint = () => {
    //     window.onbeforeunload = null;
    //     document.location = url.resolveScript({
    //         scriptId: 'customscript_evol_bg_ui_prnt_mass_inv_so',
    //         deploymentId: 'customdeploy_evol_bg_ui_prnt_mass_inv_so',
    //         params: {}
    //     });
    // }

    // const redirectGenerate = () => {
    //     window.onbeforeunload = null;
    //     document.location = url.resolveScript({
    //         scriptId: 'customscript_evol_bg_ui_mass_invoice_so',
    //         deploymentId: 'customdeploy_evol_bg_ui_mass_invoice_so',
    //         params: {}
    //     });
    // }

    const cancelarFiltros = () => {
        const record = currentRecord.get();
        let filter_year_rp_flag = record.getValue('custpage_filter_year_rp_flag');
        let filter_year_rp_flag_txt = record.getValue('custpage_filter_year_rp_flag_txt');
        window.onbeforeunload = null;
        document.location = url.resolveScript({
            scriptId: getParameterFromURL('script'),
            deploymentId: getParameterFromURL('deploy'),
            params: {
                'flag': 2,
                'year': filter_year_rp_flag,
                'yeartxt': filter_year_rp_flag_txt
            }
        });
    }

    return {
        //pageInit: pageInit,
        fieldChanged: fieldChanged,
        //saveRecord: saveRecord,
        getSuiteletPage: getSuiteletPage,
        // redirectPrint: redirectPrint,
        // redirectGenerate: redirectGenerate,
        cancelarFiltros: cancelarFiltros
    };

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
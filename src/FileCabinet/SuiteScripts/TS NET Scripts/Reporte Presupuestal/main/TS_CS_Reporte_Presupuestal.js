/*******************************************************************************************************************
This script for Invoices (Lista de facturas para realizar pagos) 
/******************************************************************************************************************* 
File Name: evol_bg_cs_mass_payments.js                                                                        
Commit: 02                                                        
Version: 1.0                                                                     
Date: 19/05/2022
ApiVersion: Script 2.1
Enviroment: PR
Governance points: N/A
==================================================================================================================*/
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/ui/dialog', 'N/search'], (url, currentRecord, dialog, search) => {
    const fieldChanged = (context) => {
        // Navigate to selected page
        //const record = currentRecord.get();
        let from = '';
        let to = '';
        let budget = '';
        let costcenter = '';
        let account = '';
        let category = '';
        let filterlocText = '';
        let filtertxt = '';

        let datefilterfrom = context.currentRecord.getValue('custpage_date_from');
        let datefilterto = context.currentRecord.getValue('custpage_date_to');
        let budgetfilter = context.currentRecord.getValue('custpage_categoria_presupuesto');
        let costcenterFilter = context.currentRecord.getValue('custpage_centro_costo');
        let categoryFilter = context.currentRecord.getValue('custpage_categoria');
        let accountFilter = context.currentRecord.getValue('custpage_cuenta');

        let datefilterfromFlag = context.currentRecord.getValue('custpage_date_filter_from_flag');
        let datefiltertoFlag = context.currentRecord.getValue('custpage_date_filter_to_flag');
        let budgetfilterFlag = context.currentRecord.getValue('custpage_categoriappto_flag');
        let costcenterfilterFlag = context.currentRecord.getValue('custpage_ceco_flag');
        let categoryfilterFlag = context.currentRecord.getValue('custpage_categoria_flag');
        let accountfilterFlag = context.currentRecord.getValue('custpage_account_flag');

        if (datefilterfrom.length != 0 && datefilterto.length != 0) {
            budget = budgetfilter != -1 ? budgetfilter : budgetfilterFlag;
            costcenter = costcenterFilter != -1 ? costcenterFilter : costcenterfilterFlag;
            category = categoryFilter != -1 ? categoryFilter : categoryfilterFlag;
            account = accountFilter != -1 ? accountFilter : accountfilterFlag;

            let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            datefilterfrom = sysDate(datefilterfrom);
            datefilterto = sysDate(datefilterto);
            pageId = parseInt(pageId.split('_')[1]);
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                params: {
                    'page': pageId,
                    'flag': 1,
                    'from': datefilterfrom,
                    'to': datefilterto,
                    'budget': budget,
                    'costcenter': costcenter,
                    'category': category,
                    'account': account,
                    // 'locationtxt': locationfilterFlagText,
                    // 'param4txt': filtertxt
                }
            });
        } else if (budgetfilter != -1) {
            from = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
            to = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
            costcenter = costcenterFilter != -1 ? costcenterFilter : costcenterfilterFlag;
            category = categoryFilter != -1 ? categoryFilter : categoryfilterFlag;
            account = accountFilter != -1 ? accountFilter : accountfilterFlag;

            let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            pageId = parseInt(pageId.split('_')[1]);
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                params: {
                    'page': pageId,
                    'flag': 1,
                    'from': from,
                    'to': to,
                    'budget': budgetfilter,
                    'costcenter': costcenter,
                    'category': category,
                    'account': account,
                }
            });
        } else if (costcenterFilter != -1) {
            from = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
            to = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
            budget = budgetfilter != -1 ? budgetfilter : budgetfilterFlag;
            category = categoryFilter != -1 ? categoryFilter : categoryfilterFlag;
            account = accountFilter != -1 ? accountFilter : accountfilterFlag;

            let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            pageId = parseInt(pageId.split('_')[1]);
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                params: {
                    'page': pageId,
                    'flag': 1,
                    'from': from,
                    'to': to,
                    'budget': budget,
                    'costcenter': costcenterFilter,
                    'category': category,
                    'account': account,
                }
            });
        } else if (categoryFilter != -1) {
            from = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
            to = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
            budget = budgetfilter != -1 ? budgetfilter : budgetfilterFlag;
            costcenter = costcenterFilter != -1 ? costcenterFilter : costcenterfilterFlag;
            account = accountFilter != -1 ? accountFilter : accountfilterFlag;

            let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            pageId = parseInt(pageId.split('_')[1]);
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                params: {
                    'page': pageId,
                    'flag': 1,
                    'from': from,
                    'to': to,
                    'budget': budget,
                    'costcenter': costcenter,
                    'category': categoryFilter,
                    'account': account,
                }
            });
        } else if (accountFilter != -1) {
            from = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
            to = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
            budget = budgetfilter != -1 ? budgetfilter : budgetfilterFlag;
            costcenter = costcenterFilter != -1 ? costcenterFilter : costcenterfilterFlag;
            category = categoryFilter != -1 ? categoryFilter : categoryfilterFlag;

            let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
            pageId = parseInt(pageId.split('_')[1]);
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                params: {
                    'page': pageId,
                    'flag': 1,
                    'from': from,
                    'to': to,
                    'budget': budget,
                    'costcenter': costcenter,
                    'category': category,
                    'account': accountFilter,
                }
            });
        }

        // else if (context.fieldId == 'custpage_pageid' && datefilterfrom.length != 0 && datefilterto.length != 0) {
        //     filter3 = carPlate.length != 0 ? carPlate : custpage_car_plate_flag;
        //     filter4 = ovfilter != -1 ? ovfilter : custpage_ov_flag;
        //     filter5 = pofilter != 'Seleccione...' ? pofilter : custpage_pedido_flag;
        //     filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_ov_flag_text;

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
        //             'param5': filter5,
        //             'location': locationfilterFlag,
        //             'locationtxt': locationfilterFlagText,
        //             'param4txt': filtertxt
        //         }
        //     });
        // } else if (context.fieldId == 'custpage_pageid') {
        //     if (datefilterfromFlag.length != 0 && datefiltertoFlag.length != 0) {
        //         filter3 = carPlate.length != 0 ? carPlate : custpage_car_plate_flag;
        //         filter4 = ovfilter != -1 ? ovfilter : custpage_ov_flag;
        //         filter5 = pofilter != 'Seleccione...' ? pofilter : custpage_pedido_flag;
        //         filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_ov_flag_text;

        //         let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
        //         pageId = parseInt(pageId.split('_')[1]);
        //         window.onbeforeunload = null;
        //         document.location = url.resolveScript({
        //             scriptId: getParameterFromURL('script'),
        //             deploymentId: getParameterFromURL('deploy'),
        //             params: {
        //                 'page': pageId,
        //                 'flag': 1,
        //                 'param1': datefilterfromFlag,
        //                 'param2': datefiltertoFlag,
        //                 'param3': filter3,
        //                 'param4': filter4,
        //                 'param5': filter5,
        //                 'location': locationfilterFlag,
        //                 'locationtxt': locationfilterFlagText,
        //                 'param4txt': filtertxt
        //             }
        //         });
        //     } else if (locationfilterFlag != -1) {
        //         filterloc = locationfilter != -1 ? locationfilter : locationfilterFlag;
        //         filterlocText = locationfiltertxt != 'Seleccione...' ? locationfiltertxt : locationfilterFlagText;

        //         filter = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
        //         filter2 = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
        //         filter3 = carPlate.length != 0 ? carPlate : custpage_car_plate_flag;
        //         filter4 = ovfilter != -1 ? ovfilter : custpage_ov_flag;
        //         filter5 = pofilter != 'Seleccione...' ? pofilter : custpage_pedido_flag;
        //         filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_ov_flag_text;

        //         let pageId = context.currentRecord.getValue({ fieldId: 'custpage_pageid' });
        //         pageId = parseInt(pageId.split('_')[1]);
        //         window.onbeforeunload = null;
        //         document.location = url.resolveScript({
        //             scriptId: getParameterFromURL('script'),
        //             deploymentId: getParameterFromURL('deploy'),
        //             params: {
        //                 'page': pageId,
        //                 'flag': 1,
        //                 'param1': filter,
        //                 'param2': filter2,
        //                 'param3': filter3,
        //                 'param4': filter4,
        //                 'param5': filter5,
        //                 'location': filterloc,
        //                 'locationtxt': filterlocText,
        //                 'param4txt': filtertxt
        //             }
        //         });
        //     }
        // } else if (carPlate.length != 0) {
        //     filter = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
        //     filter2 = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
        //     filter4 = ovfilter != -1 ? ovfilter : custpage_ov_flag;
        //     filter5 = pofilter != 'Seleccione...' ? pofilter : custpage_pedido_flag;
        //     filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_ov_flag_text;

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
        //             'param5': filter5,
        //             'location': locationfilterFlag,
        //             'locationtxt': locationfilterFlagText,
        //             'param4txt': filtertxt
        //         }
        //     });
        // } else if (ovfilter != -1) {
        //     filter = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
        //     filter2 = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
        //     filter3 = carPlate.length != 0 ? carPlate : custpage_car_plate_flag;
        //     filter5 = pofilter != 'Seleccione...' ? pofilter : custpage_pedido_flag;
        //     filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_ov_flag_text;

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
        //             'param4': ovfilter,
        //             'param5': filter5,
        //             'location': locationfilterFlag,
        //             'locationtxt': locationfilterFlagText,
        //             'param4txt': filtertxt
        //         }
        //     });
        // } else if (pofilter != 'Seleccione...') {
        //     filter = datefilterfrom.length != 0 ? datefilterfrom : datefilterfromFlag;
        //     filter2 = datefilterto.length != 0 ? datefilterto : datefiltertoFlag;
        //     filter3 = carPlate.length != 0 ? carPlate : custpage_car_plate_flag;
        //     filter4 = ovfilter != -1 ? ovfilter : custpage_ov_flag;
        //     filtertxt = param4txt != 'Seleccione...' ? param4txt : custpage_ov_flag_text;

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
        //             'param5': pofilter,
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
            // const custpage_task_status = record.getValue('custpage_task_status');
            // if (custpage_task_status == 1) {
            const existSearch = searchOpen();
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
            // } else {
            //     return true;
            // }
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

    const searchOpen = () => {
        try {
            // Search: PE Reporte Presupuestal Log Search
            // const searchLoad = search.create({
            //     type: "customrecord_pe_reporte_presupuestal_log",
            //     filters:
            //         [
            //             ["custrecord_pe_status_process", "startswith", "Procesando..."]
            //         ],
            //     columns:
            //         [
            //             search.createColumn({ name: "custrecord_pe_estimated_time", label: "PE Estimated Time" }),
            //             search.createColumn({ name: "created", label: "Date Created" })
            //         ]
            // });
            let searchLoad = search.load({ id: 'customsearch_tails_tasks_payments_search' });
            const searchResultCount = searchLoad.runPaged().count;
            if (searchResultCount != 0) {
                const searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
                let time = searchResult[0].getValue(searchLoad.columns[0]);
                let fecha = searchResult[0].getValue(searchLoad.columns[1]);
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
            //return searchResultCount;
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

    const cancelarFiltros = () => {
        const record = currentRecord.get();
        // let locationfilterFlag = record.getValue('custpage_location');
        // let locationfilterFlagText = record.getValue('custpage_location_text');

        window.onbeforeunload = null;
        document.location = url.resolveScript({
            scriptId: getParameterFromURL('script'),
            deploymentId: getParameterFromURL('deploy'),
            // params: {
            //     'location': locationfilterFlag,
            //     'locationtxt': locationfilterFlagText
            // }
        });

        // try {
        //     let url = window.location.href; //Obtención de URL de la pagina
        //     let params = url.split('&'); //separacion de URL y parametros
        //     window.location.href = params[0] + '&' + params[1]; //'https://5091977.app.netsuite.com/app/site/hosting/scriptlet.nl?script=209&deploy=1'
        // } catch (error) {
        //     console.log('NS - Error - cancelarFiltros', e);
        // }
    }

    const testBtn = () => {
        // const record = currentRecord.get();
        // record.setValue({ fieldId: 'custpage_sum_total', value: sum, ignoreFieldChange: true });
        //console.log(record.getValue('custpage_sum_total') + ' - ' + sum);
        location.reload()
    }

    return {
        fieldChanged: fieldChanged,
        //saveRecord: saveRecord,
        getSuiteletPage: getSuiteletPage,
        cancelarFiltros: cancelarFiltros,
        testBtn: testBtn
    };

});
/*******************************************************************************************************************
TRACKING
/*******************************************************************************************************************
Commit:01
Version: 1.0
Date: 03/04/2022
Author: Dennis Fernández
Description: Creación del script en SB.
/*******************************************************************************************************************
Commit:02
Version: 1.0
Date: 19/05/2022
Author: Dennis Fernández
Description: Se realzia el pase a PROD.
==================================================================================================================*/
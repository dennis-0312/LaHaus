/*******************************************************************************************************************
This script for Reporte de presupuesto (Lista de oc, facturas de compra, nc y pagos) 
/******************************************************************************************************************* 
File Name: TS_SS_REPORTE_RP_Report.js                                                                        
Commit: 02                                                        
Version: 1.0                                                                     
Date: 18/08/2022
ApiVersion: Script 2.1
Enviroment: PR
Governance points: N/A
==================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/log', 'N/runtime', 'N/format', 'N/file', 'N/record', 'N/search', 'N/task'], (log, runtime, format, file, record, search, task) => {
    const SEARCH_ID = 'customsearch_co_cate_ppto_estados_rp'; //CO Categoria PPTO Estados - RP PRODUCCION
    const LOG_RECORD = 'customrecord_co_log_report_ppto'; //CO Log Report PPTO
    const FILE_CABINET_ID = 44417; //SB-6032 - PR-44417
    const execute = (context) => {
        try {
            const FECHA = new Date();
            let recordid = runtime.getCurrentScript().getParameter({ name: 'custscript_lh_logrecordid_rp' });
            try {
                log.debug('INICIO', 'INICIO REPORTE ====================================');
                log.debug('REGISTRO', 'Registro: ' + recordid + ' - init');
                record.submitFields({ type: LOG_RECORD, id: recordid, values: { 'custrecord_lh_process_status_rp': 'Procesando...' } });
                const HEADER = 'SUBSIDIARIA;CENTRO DE COSTO;CATEGORIA;CUENTA;ANIO;ESTADO;ENERO;' +
                    'FEBRERO;MARZO;ABRIL;MAYO;JUNIO;JULIO;AGOSTO;SEPTIEMBRE;OCTUBRE;NOVIEMBRE;DICIEMBRE;TOTAL;\n';
                const searchRes = searchLoad(recordid);
                let cadenaFecha = format.format({ value: FECHA, type: format.Type.DATETIME });
                cadenaFecha = cadenaFecha.replace(/[/]/gi, '_').replace(/ /gi, '_').replace(/:/gi, '_');
                let fileName = 'ReporteControlPresupuestal_' + cadenaFecha + '.csv';
                log.debug('fileName', fileName);
                const fileObj = file.create({
                    name: fileName,
                    fileType: file.Type.CSV,
                    contents: HEADER + searchRes,
                    encoding: file.Encoding.UTF8,
                    folder: FILE_CABINET_ID,
                    isOnline: true
                });
                const fileId = fileObj.save();
                log.debug('fileId', fileId);
                setRecord(recordid, fileId, 1);
            } catch (error) {
                log.error('Error-execute', error);
                setRecord(recordid, error.message, 2);
                log.debug('ERROR', 'FIN REPORTE =======================================');
            }
            log.debug('FIN', 'FIN REPORTE =======================================');
            let tail = searchTail();
            if (tail != 0) {
                const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                mrTask.scriptId = 'customscript_ts_ss_reporte_rp_report';
                mrTask.deploymentId = 'customdeploy_ts_ss_reporte_rp_report';
                mrTask.params = {
                    'custscript_lh_logrecordid_rp': tail
                }
                mrTask.submit();
            }
        } catch (error) {
            log.error('Error-execute-final', error);
        }
    }


    const searchLoad = (recordid) => {
        let contentReport = '';
        try {
            let jsonRequest = search.lookupFields({ type: LOG_RECORD, id: recordid, columns: ['custrecord_lh_request_rp'] });
            jsonRequest = JSON.parse(jsonRequest.custrecord_lh_request_rp);
            log.debug('jsonRequest', jsonRequest);
            let searchObj = search.load({ id: SEARCH_ID });
            let filters = searchObj.filters;

            const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: jsonRequest.custscript_year_rp });
            filters.push(filterOne);
            //=================================================================================================================================================
            if (jsonRequest.custscript_subsidiaria_rp.length != 0) {
                const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_categoriap_subsidiaria', join: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: jsonRequest.custscript_subsidiaria_rp });
                filters.push(filterTwo);
            }

            if (jsonRequest.custscript_ceco_rp.length != 0) {
                const filterThree = search.createFilter({ name: 'custrecord_lh_cp_centro_costo', join: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: jsonRequest.custscript_ceco_rp });
                filters.push(filterThree);
            }

            if (jsonRequest.custscript_categoria_rp.length != 0) {
                const filterFour = search.createFilter({ name: 'custrecord_lh_cp_nombre_categoria', join: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: jsonRequest.custscript_categoria_rp });
                filters.push(filterFour);
            }

            if (jsonRequest.custscript_cuenta_rp.length != 0) {
                const filterFive = search.createFilter({ name: 'custrecord_lh_cp_cuenta', join: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: jsonRequest.custscript_cuenta_rp });
                filters.push(filterFive);
            }

            if (jsonRequest.custscript_estado_rp.length != 0) {
                const filterSix = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: jsonRequest.custscript_estado_rp });
                filters.push(filterSix);
            }

            let searchResultCount = searchObj.runPaged().count;
            log.debug('searchResultCount', searchResultCount);
            searchObj.run().each((result) => {
                let subsidiaria = result.getText(searchObj.columns[1]);
                let ceco = result.getText(searchObj.columns[2]);
                let categoria = result.getText(searchObj.columns[3]);
                let cuenta = result.getText(searchObj.columns[4]);
                let anio = result.getText(searchObj.columns[5]);
                let estado = result.getText(searchObj.columns[6]);
                let enero = result.getValue(searchObj.columns[7]);
                let febrero = result.getValue(searchObj.columns[8]);
                let marzo = result.getValue(searchObj.columns[9]);
                let abril = result.getValue(searchObj.columns[10]);
                let mayo = result.getValue(searchObj.columns[11]);
                let junio = result.getValue(searchObj.columns[12]);
                let julio = result.getValue(searchObj.columns[13]);
                let agosto = result.getValue(searchObj.columns[14]);
                let septiembre = result.getValue(searchObj.columns[15]);
                let octubre = result.getValue(searchObj.columns[16]);
                let noviembre = result.getValue(searchObj.columns[17]);
                let diciembre = result.getValue(searchObj.columns[18]);
                let total = result.getValue(searchObj.columns[19]);

                contentReport =
                    contentReport + subsidiaria + ';' + ceco + ';' + categoria + ';' +
                    cuenta + ';' + anio + ';' + estado + ';' + enero + ';' + febrero + ';' +
                    marzo + ';' + abril + ';' + mayo + ';' + junio + ';' + julio + ';' +
                    agosto + ';' + septiembre + ';' + octubre + ';' + noviembre + ';' +
                    diciembre + ';' + total + ';\n';
                return true;
            });
            return contentReport;
        } catch (error) {
            log.error('Error-searchLoad', error);
        }
    }


    const setRecord = (recordid, fileid, flag) => {
        try {
            if (flag == 1) {
                const fileAux = file.load({ id: fileid });
                record.submitFields({
                    type: LOG_RECORD,
                    id: recordid,
                    values: {
                        'custrecord_lh_task_status_rp': flag,
                        'custrecord_lh_process_status_rp': 'Generado',
                        'custrecord_lh_url_file_cabinet_rp': fileAux.url + '&_xd=T'
                        // custrecord_pe_file_name: fileAux.name
                    }
                });
                log.debug('REGISTRO', 'Registro: ' + recordid + ' - success');
            } else {
                record.submitFields({
                    type: LOG_RECORD,
                    id: recordid,
                    values: {
                        'custrecord_lh_task_status_rp': flag,
                        'custrecord_lh_process_status_rp': 'Error',
                        'custrecord_lh_url_file_cabinet_rp': fileid
                        // custrecord_pe_file_name: fileAux.name
                    }
                });
            }
        } catch (error) {
            log.error('Error-setRecord', error);
        }
    }


    const searchTail = () => {
        try {
            const searchLoad = search.create({
                type: "customrecord_co_log_report_ppto",
                filters:
                    [
                        ["custrecord_lh_task_status_rp", "startswith", "0"],
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "created",
                            sort: search.Sort.ASC,
                            label: "Date Created"
                        }),
                        // search.createColumn({ name: "custrecord_lh_request_rp", label: "LH REQUEST RP" })
                    ]
            });
            const searchResultCount = searchLoad.runPaged().count;
            //log.debug('searchResultCount', searchResultCount);
            if (searchResultCount != 0) {
                const searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
                // log.debug('searchResult', searchResult);
                let internalid = searchResult[0].getValue(searchLoad.columns[0]);
                //let requestrp = searchResult[0].getValue(searchLoad.columns[2]);
                log.debug('internalid', internalid);
                // log.debug('ovinput', ovinput);
                // return {
                //     internalid: internalid,
                //     requestrp: requestrp
                // }
                return internalid;
            } else {
                return 0;
            }
        } catch (error) {
            log.error('Error-searchTail', error);
        }
    }

    return {
        execute: execute
    }
});

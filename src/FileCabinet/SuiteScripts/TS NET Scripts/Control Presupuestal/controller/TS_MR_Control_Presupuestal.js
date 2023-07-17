/*********************************************************************************************************************************************
This script for Integration (Script para recepción de ) 
/*********************************************************************************************************************************************
File Name: TS_MR_Asiento_Provision_Costos.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 13/01/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/search', 'N/record', 'N/task', 'N/runtime'], (log, search, record, task, runtime) => {
    const scriptObj = runtime.getCurrentScript();
    const PENDING_APPROVAL = 1;
    const APPROVAL = 2;
    //let purchaseOrder = 230654;

    const getInputData = () => {
        let purchaseOrder = scriptObj.getParameter({ name: 'custscript_param_purchase_order' });
        log.debug('Params', purchaseOrder);
        try {
            let json = new Array();
            let objRecord = record.load({ type: 'purchaseorder', id: purchaseOrder });
            let numLines = objRecord.getLineCount({ sublistId: 'item' });
            for (let i = 0; i < numLines; i++) {
                let status = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_approval_status', line: i });

                if (status == PENDING_APPROVAL) {
                    objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_approval_status', line: i, value: APPROVAL });
                    let item = objRecord.getSublistText({ sublistId: 'item', fieldId: 'item', line: i });
                    let criterio = objRecord.getSublistText({ sublistId: 'item', fieldId: 'department', line: i });
                    log.debug('item', item);
                    log.debug('criterio', criterio);
                    json.push({
                        line: item,
                        nivelControl: criterio
                    });
                }
            }
            purchaseOrder = objRecord.save();
            log.debug('Record', purchaseOrder);
            return json;
        } catch (error) {
            log.error('Error-getInputData', error);
        }
    }

    const map = (context) => {
        try {
            //log.debug('Context-map-Length', context.value);
            context.write({
                key: context.key,
                value: context.value
            });
        } catch (error) {
            log.error('Error-map', error);
        }
    }

    const reduce = (context) => {
        try {
            //log.debug('Context-reduce', JSON.parse(context.values));

            context.write({
                key: context.key,
                value: context.values
            });
        } catch (error) {
            log.error('Error-reduce', error);
        }
    }

    const summarize = (context) => {
        let records = '';
        try {
            context.output.iterator().each((key, value) => {
                records = JSON.parse(value);
                // for (let i in records) {
                //     log.debug('Records', records[i]);
                // }
                log.debug('Records', records[0]);

            });

            ;
            var arrCustomerId = new Array();
            var busqueda = search.create({
                type: "customrecord_cola_aprobacion",
                filters:
                    [
                        search.createFilter({
                            name: 'custrecord_estado',
                            operator: search.Operator.HASKEYWORDS,
                            values: 'Pendientes Aprobar'
                        })
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "ID" })
                    ]
            });
            var pageData = busqueda.runPaged({
                pageSize: 1000
            });
            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    var arrCustomer = new Array();
                    //0. Internal id match
                    if (result.getValue(columns[0]) != null)
                        arrCustomer[0] = result.getValue(columns[0]);
                    else
                        arrCustomer[0] = '';
                    arrCustomerId.push(arrCustomer);
                });
            });
            arrCustomerId.map(items => {
                let customer = record.load({ type: 'customrecord_cola_aprobacion', id: items[0] });
                let orden = customer.getValue({ fieldId: 'custrecord_orden_compra' });
                customer.setValue({ fieldId: 'custrecord_estado', value: 'Procesando' });
                customer.save();

                try {
                    let mapReduceScript = task.create({ taskType: task.TaskType.MAP_REDUCE });
                    mapReduceScript.scriptId = 'customscript_ts_mr_control_presupuestal';
                    mapReduceScript.deploymentId = 'customdeploy_ts_mr_control_presupuestal';
                    mapReduceScript.params = {
                        'custscript_param_purchase_order': orden,
                    };
                    let mapReduceTaskId = mapReduceScript.submit();

                    customer = record.load({ type: 'customrecord_cola_aprobacion', id: items[0] });
                    customer.setValue({ fieldId: 'custrecord_estado', value: 'Culminado' });
                    customer.save();
                } catch (error) {
                    customer = record.load({ type: 'customrecord_cola_aprobacion', id: items[0] });
                    customer.setValue({ fieldId: 'custrecord_estado', value: 'Pendientes Aprobar' });
                    customer.save();
                    log.error('Error-getInputData', error);

                }
            })
            return true;
        } catch (error) {
            log.error('Error-summarize', error);
        }
    }


    const createJournal = (fecha, provision, nota) => {
        const objRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });

        objRecord.setValue({ fieldId: 'trandate', value: new Date(fecha) });
        //objRecord.setValue({ fieldId: 'currency', value: context.currency });
        objRecord.setValue({ fieldId: 'memo', value: nota });
        objRecord.setValue({ fieldId: 'subsidiary', value: 2 });

        objRecord.selectNewLine({ sublistId: 'line' });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 1237, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: provision, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: 310, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 2, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 2, ignoreFieldChange: false });
        objRecord.commitLine({ sublistId: 'line' });

        objRecord.selectNewLine({ sublistId: 'line' });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 798, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: provision, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: 310, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 2, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 2, ignoreFieldChange: false });
        objRecord.commitLine({ sublistId: 'line' });

        const newJournal = objRecord.save({ ignoreMandatoryFields: false });

        return newJournal
    }


    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 13/01/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/


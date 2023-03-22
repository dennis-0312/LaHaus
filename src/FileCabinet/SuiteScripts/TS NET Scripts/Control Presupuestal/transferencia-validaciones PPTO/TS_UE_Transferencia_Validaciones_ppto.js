/********************************************************************************************************************************************************
This script for LH Categoria Presupuesto Transferencias
/******************************************************************************************************************************************************** 
File Name: TS_UE_Transferencia_Validaciones_ppto.js                                                                        
Commit: 01                                                        
Version: 1.2                                                                    
Date: 05/08/2022
ApiVersion: Script 2.x
Enviroment: PR
Governance points: N/A
========================================================================================================================================================*/

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime'],

    function (record, search, runtime) {
        const PRESUPUESTADO = 1;
        const DISPONIBLE = 7;
        const ADICION_PPTO = 9;

        function beforeLoad(scriptContext) {
            try {
                log.error("INI beforeLoad", "INI beforeLoad");
                var form = scriptContext.form;
                var currentRecord = scriptContext.newRecord;
                var typeEvent = scriptContext.type;
                log.debug('currentRecord.type', currentRecord.type);
                log.debug('typeEvent', typeEvent);
                //form.clientScriptFileId = 250383; // ==> id del archivo client en el file cabinet (Sandbox)
                form.clientScriptFileId = 525563; // ==> id del archivo client en el file cabinet (Producción)

                if (currentRecord.type === 'customrecord_lh_categoria_presupuesto') {
                    if (typeEvent === 'edit') {
                        //form.removeButton('submitter');
                    }

                    if (typeEvent === 'view') {
                        var btnGenerarPeriod = form.addButton({
                            id: 'custpage_lh_btn_gen_period',
                            label: "Generar Periodo",
                            functionName: 'generarPeriodo(' + currentRecord.id + ',"' + currentRecord.type + '")'
                        });
                    }
                }


                if (currentRecord.type === 'customrecord_lh_categoriap_transferencia') {
                    var transfAprobador = currentRecord.getValue('custrecord_lh_tp_solicitante');
                    var sessionObj = runtime.getCurrentUser().id;
                    var statusTransf = currentRecord.getValue('custrecord_lh_detalle_cppto_estado_aprob');

                    //if (typeEvent === 'view' && statusTransf == '1') {
                    if (typeEvent === 'view') {
                        //form.clientScriptFileId = 250383; // ==> id del archivo client en el file cabinet
                        if (statusTransf == '1') {
                            if (transfAprobador == sessionObj) {
                                var btnAprobar = form.addButton({
                                    id: 'custpage_lh_btn_aprobar',
                                    label: "Aprobar",
                                    functionName: 'statusAprobacion(' + currentRecord.id + ',"' + currentRecord.type + '", 2)'
                                });

                                var btnRechazar = form.addButton({
                                    id: 'custpage_lh_btn_rechazar',
                                    label: "Rechazar",
                                    functionName: 'statusAprobacion(' + currentRecord.id + ',"' + currentRecord.type + '", 3)'
                                });
                            }
                        } else if (statusTransf == '2') {
                            var editTransfer = form.getButton('edit');
                            if (editTransfer != null) editTransfer.isDisabled = true;
                        }
                    }
                }
                log.error("FIN beforeLoad", "FIN beforeLoad");
            } catch (e) {
                log.error("Error", "[ beforeLoad ] " + e);
            }

        }

        function beforeSubmit(scriptContext) { 

        }


        function afterSubmit(scriptContext) {
            try {
                log.error("INI afterSubmit", "INI afterSubmit");
                var form = scriptContext.form;
                var currentRecord = scriptContext.newRecord;
                var typeEvent = scriptContext.type;
                var oldRecord = scriptContext.oldRecord;

                if (currentRecord.type == 'customrecord_lh_categoriap_periodo') {
                    if (typeEvent === 'xedit' || typeEvent === 'edit') {
                        //var rec = record.load({ type: currentRecord.type, id: currentRecord.id });
                        //var statusCategPpto = currentRecord.getValue('custrecord_lh_detalle_cppto_status');
                        var myStatusCategPpto = search.lookupFields({
                            type: currentRecord.type,
                            id: currentRecord.id,
                            columns: ['custrecord_lh_detalle_cppto_status', 'custrecord_lh_detalle_cppto_categoria', 'custrecord_lh_detalle_cppto_anio']
                        });
                        var statusCategPpto = myStatusCategPpto['custrecord_lh_detalle_cppto_status'][0].value;
                        log.debug('statusCategPpto', statusCategPpto);
                        //var statusCategPpto = rec.getValue('custrecord_lh_detalle_cppto_status');
                        if (statusCategPpto == PRESUPUESTADO) {
                            var rec = record.load({ type: currentRecord.type, id: currentRecord.id });
                            var mntTotalMes = 0.00;
                            //var catPpto = rec.getValue('custrecord_lh_detalle_cppto_categoria');
                            //var anioCategPpto = rec.getValue('custrecord_lh_detalle_cppto_anio');
                            var catPpto = myStatusCategPpto['custrecord_lh_detalle_cppto_categoria'][0].value;
                            var anioCategPpto = myStatusCategPpto['custrecord_lh_detalle_cppto_anio'][0].value;
                            log.debug('catPpto', catPpto);
                            log.debug('anioCategPpto', anioCategPpto);


                            var arrayFilters = [
                                ["custrecord_lh_detalle_cppto_categoria", "anyof", catPpto],
                                "AND",
                                ["custrecord_lh_detalle_cppto_status", "anyof", 7],
                                "AND",
                                ["custrecord_lh_detalle_cppto_anio", "anyof", anioCategPpto],
                                "AND",
                                ["custrecord_ts_cp_campo_flag", "isempty", ""]
                            ]
                            var busqIdDisponible = search.create({
                                type: currentRecord.type,
                                filters: arrayFilters,
                                columns: ["internalid"]
                            });
                            var runIdDisponible = busqIdDisponible.run().getRange(0, 1);
                            log.debug('runIdDisponible', runIdDisponible);

                            if (runIdDisponible.length != 0) {
                                var idCategPptoDisp = runIdDisponible[0].getValue("internalid");
                                log.debug('idCategPptoDisp', idCategPptoDisp);

                                var recStatusDisp = record.load({
                                    type: currentRecord.type,
                                    id: idCategPptoDisp,
                                    isDynamic: true,
                                });

                                for (var j = 1; j <= 12; j++) {
                                    if (j < 10) j = '0' + j;
                                    fieldMes = 'custrecord_lh_detalle_cppto_' + j;
                                    log.debug('fieldMes saveRecord', fieldMes);
                                    //var mntMesPres = rec.getValue(fieldMes) || 0.00;
                                    var mntMesPres = search.lookupFields({
                                        type: currentRecord.type,
                                        id: currentRecord.id,
                                        columns: fieldMes
                                    }) || 0.00;
                                    var mntMesDisp = recStatusDisp.getValue(fieldMes) || 0.00;
                                    //var newMntDisp = mntMesPres + mntMesDisp;
                                    var newMntDisp = Number(mntMesPres[fieldMes]) + mntMesDisp;
                                    log.debug('mntMesPres saveRecord', Number(mntMesPres[fieldMes]));
                                    log.debug('mntMesDisp saveRecord', mntMesDisp);
                                    log.debug('newMntDisp saveRecord', newMntDisp);
                                    mntTotalMes += newMntDisp;
                                    recStatusDisp.setValue(fieldMes, newMntDisp);
                                }
                                log.debug('mntTotalMes saveRecord', mntTotalMes);
                                recStatusDisp.setValue('custrecord_lh_detalle_cppto_total', mntTotalMes);
                                recStatusDisp.setValue('custrecord_ts_cp_campo_flag', 'Modificado');
                                recStatusDisp.save({ ignoreMandatoryFields: true, enableSourcing: false });
                            } else {
                                calcularTotal(currentRecord.type, currentRecord.id);
                            }

                        } else {
                            calcularTotal(currentRecord.type, currentRecord.id);
                        }
                    }
                }


                if (currentRecord.type === 'customrecord_lh_categoria_presupuesto') {
                    if (typeEvent === 'create') {
                        // BUSCA LA LISTA DE AÑOS DISPONIBLES
                        var busqAnios = search.create({
                            type: "customrecord_lh_cp_anio",
                            filters: [],
                            columns: [
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                })
                            ]
                        });
                        var runAnios = busqAnios.run().getRange(0, 100);
                        var columns = runAnios[0].columns;
                        var anioIni = Number(runAnios[0].getValue(columns[0]));
                        var anioFin = Number(runAnios[runAnios.length - 1].getValue(columns[0]));

                        var currentTime = new Date();
                        var anioPeriodo = currentTime.getFullYear();

                        if (anioPeriodo >= anioIni && anioPeriodo <= anioFin) {
                            var busqIdAnio = search.create({
                                type: "customrecord_lh_cp_anio",
                                filters: [["name", "is", Number(anioPeriodo).toFixed()]],
                                columns: ["internalid"]
                            });
                            var runIdAnio = busqIdAnio.run().getRange(0, 1);
                            var idAnio = runIdAnio[0].getValue("internalid");

                            for (var k = 1; k <= 6; k++) {
                                createCategoriaPeriodos(currentRecord.id, k, idAnio);
                            }
                            createCategoriaPeriodos(currentRecord.id, 9, idAnio);
                            createCategoriaPeriodos(currentRecord.id, 7, idAnio);
                        }
                    }
                }


                if (currentRecord.type === 'customrecord_lh_categoriap_transferencia') {
                    // if (typeEvent === 'create' || typeEvent === 'edit' || typeEvent === 'copy') {
                    if (typeEvent === 'create') {
                        var recTransf = record.load({ type: currentRecord.type, id: currentRecord.id, isDynamic: true });
                        recTransf.setValue('custrecord_lh_detalle_cppto_estado_aprob', 1);
                        recTransf.save({ ignoreMandatoryFields: true, enableSourcing: false });
                    }
                }

                log.error("INI afterSubmit", "INI afterSubmit");

            } catch (e) {
                log.error("Error", "[ afterSubmit ] " + e);

            }
        }


        function createCategoriaPeriodos(_internalId, _k, _idAnio) {
            var recCategPptoPeriod = record.create({
                type: 'customrecord_lh_categoriap_periodo',
                isDynamic: true,
            });
            recCategPptoPeriod.setValue('custrecord_lh_detalle_cppto_categoria', _internalId);
            recCategPptoPeriod.setValue('custrecord_lh_detalle_cppto_status', _k);
            recCategPptoPeriod.setValue('custrecord_lh_detalle_cppto_anio', _idAnio);
            for (var j = 1; j <= 12; j++) {
                if (j < 10) j = '0' + j;
                fieldMes = 'custrecord_lh_detalle_cppto_' + j;
                recCategPptoPeriod.setValue(fieldMes, 0.00);
            }
            recCategPptoPeriod.save({ ignoreMandatoryFields: true, enableSourcing: false });
        }


        function calcularTotal(_typeRec, _idRec) {
            var mntTotMes = 0.00;
            for (var j = 1; j <= 12; j++) {
                if (j < 10) j = '0' + j;
                fieldMes = 'custrecord_lh_detalle_cppto_' + j;
                log.debug('fieldMes saveRecord', fieldMes);
                var mntDisp = search.lookupFields({
                    type: _typeRec,
                    id: _idRec,
                    columns: fieldMes
                }) || 0.00;

                log.debug('mntDisp saveRecord', Number(mntDisp[fieldMes]));
                mntTotMes += Number(mntDisp[fieldMes]);
            }
            log.debug('mntTotMes saveRecord', mntTotMes);
            record.submitFields({
                type: _typeRec,
                id: _idRec,
                values: { 'custrecord_lh_detalle_cppto_total': mntTotMes },
                options: { enableSourcing: false, ignoreMandatoryFields: true }
            });

        }


        return {
            beforeLoad: beforeLoad,
            //beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });


/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 16/07/2022
Author: Jean Ñique
Description: Creación del script.
========================================================================================================================================================*/
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:02
Version: 1.2
Date: 05/08/2022
Author: Jean Ñique
Description: Modificación del script para que realice las validaciones y transferencias de Control Presupuestal.
========================================================================================================================================================*/
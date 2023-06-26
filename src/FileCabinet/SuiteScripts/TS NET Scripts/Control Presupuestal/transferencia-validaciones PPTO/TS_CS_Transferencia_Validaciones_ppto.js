/********************************************************************************************************************************************************
This script for LH Categoria Presupuesto Transferencias
/******************************************************************************************************************************************************** 
File Name: TS_CS_Transferencia_Validaciones_ppto.js                                                                        
Commit: 01                                                        
Version: 1.2                                                                     
Date: 05/08/2022
ApiVersion: Script 2.x
Enviroment: PR
Governance points: N/A
========================================================================================================================================================*/

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/record',
    'N/search',
    'N/format',
    '../../Reporte Presupuestal/controller/TS_Script_Controller'
], (record, search, format, _controller) => {
    const CATEGORIA_PPTO_PERIODOS = 'customsearch_co_categoria_ppto_periodos'; //CO Categoria Presupuesto Periodos Search - CP PRODUCCION
    const ID_AÑO_SEARCH = 'customsearch_co_cp_anio'; //CO CP Año Search - CP PRODUCCION
    const CATEGORIA_PERIODO_RECORD = 'customrecord_lh_categoriap_periodo';
    const arregloTrimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
    const TEMPORALIDAD_MENSUAL = 1;
    const TEMPORALIDAD_TRIMESTRAL = 2;
    const TEMPORALIDAD_ANUAL = 3;
    const CONTROL_CENTROCOSTO = 1;
    const CONTROL_CUENTACONTABLE = 2;
    const CONTROL_CATEGORIA = 2;
    const ADICION = 1;
    const RESERVADO = 2;
    const PRESUPUESTADO = 1;
    const TRANSFERIDO = 6;
    const DISPONIBLE = 7;
    const TRANSFERENCIA = 2;
    const APPROVED_STATUS = 2;


    function pageInit(scriptContext) {
        try {
            var rec = scriptContext.currentRecord;
            var typeTrans = rec.type;
            console.log('typeTrans pageInit', typeTrans);

            if (typeTrans === 'customrecord_lh_categoriap_transferencia') {
                var status = rec.getValue('custrecord_lh_detalle_cppto_estado_aprob');
                if (!rec.isNew) {
                    if (status == '2') {
                        var fieldCateg = rec.getField('custrecord_lh_detalle_cppto_partida_ori');
                        fieldCateg.isDisabled = true;
                        var fieldPeriodOrig = rec.getField('custrecord_lh_detalle_cppto_peri_origen');
                        fieldPeriodOrig.isDisabled = true;
                        var fieldPeriodDest = rec.getField('custrecord_lh_detalle_cppto_peri_destino');
                        fieldPeriodDest.isDisabled = true;
                        var fieldMntTransf = rec.getField('custrecord_lh_detalle_cppto_aumento_ppto');
                        fieldMntTransf.isDisabled = true;
                        var fieldAprobador = rec.getField('custrecord_lh_tp_solicitante');
                        fieldAprobador.isDisabled = true;
                        var fieldMotivo = rec.getField('custrecord_lh_detalle_cppto_transf_ppto');
                        fieldMotivo.isDisabled = true;
                        var fieldEstado = rec.getField('custrecord_lh_detalle_cppto_estado_aprob');
                        fieldEstado.isDisabled = true;
                    }
                }
            }

            if (typeTrans == CATEGORIA_PERIODO_RECORD) {
                var fieldMes = '';
                var statusPrep = rec.getValue('custrecord_lh_detalle_cppto_status');
                console.log('statusPrep', statusPrep);

                var categPptoPeriod = rec.getField('custrecord_lh_detalle_cppto_categoria');
                categPptoPeriod.isDisabled = true;
                var statusPptoPeriod = rec.getField('custrecord_lh_detalle_cppto_status');
                statusPptoPeriod.isDisabled = true;
                var anioPptoPeriod = rec.getField('custrecord_lh_detalle_cppto_anio');
                anioPptoPeriod.isDisabled = true;
                if (!rec.isNew) {
                    for (var j = 1; j <= 12; j++) {
                        if (j < 10) j = '0' + j;
                        fieldMes = 'custrecord_lh_detalle_cppto_' + j;
                        var fieldCuentaCategPpto = rec.getField(fieldMes);
                        fieldCuentaCategPpto.isDisabled = true;
                    }
                }
                var totalPptoPeriod = rec.getField('custrecord_lh_detalle_cppto_total');
                totalPptoPeriod.isDisabled = true;
            }
            return true;
        } catch (e) {
            console.log('Error en fieldChanged', e);
        }
    }


    function fieldChanged(scriptContext) {
        try {
            var rec = scriptContext.currentRecord;
            var typeTrans = rec.type;
            var fieldName = scriptContext.fieldId;
            if (typeTrans === CATEGORIA_PERIODO_RECORD) {
                var fieldMes = '';
                var mntTotalMes = 0.00;
                var arrayFieldMeses = [];

                for (var j = 1; j <= 12; j++) {
                    if (j < 10) j = '0' + j;
                    fieldMes = 'custrecord_lh_detalle_cppto_' + j;
                    arrayFieldMeses.push(fieldMes);
                    var mntMes = rec.getValue(fieldMes) || 0.00;
                    mntTotalMes += mntMes;
                }

                if (arrayFieldMeses.includes(fieldName)) {
                    rec.setValue('custrecord_lh_detalle_cppto_total', mntTotalMes);
                }
            }
            return true;
        } catch (e) {
            console.log('Error en fieldChanged', e);
        }
    }


    function saveRecord(scriptContext) {
        try {
            var rec = scriptContext.currentRecord;
            var typeTrans = rec.type;

            if (typeTrans === 'customrecord_lh_categoriap_transferencia') {
                var solicitud = scriptContext.currentRecord.getValue('custrecord_lh_detalle_cppto_solicitud')
                if (solicitud == ADICION) {
                    return true;
                } else {
                    var mntTransferir = rec.getValue('custrecord_lh_detalle_cppto_aumento_ppto');
                    if (mntTransferir <= 0) {
                        alert('El monto a transferir debe ser mayor a 0');
                        return false;
                    }
                    var partidaDestino = rec.getValue('custrecord_lh_detalle_cppto_partida_dis');
                    var fechaDestino = rec.getValue('custrecord_lh_detalle_cppto_fecha_dis').toString();

                    //console.log(partidaDestino.length + ' - ' + fechaDestino.length + ' - ' + fechaDestino)
                    if (partidaDestino.length > 0 && fechaDestino.length > 0) {
                        return true;
                    } else {
                        alert('Debe ingresar una partida y un periodo a disminuir ');
                        return false;
                    }
                }
            }

            if (typeTrans === 'customrecord_lh_configuracion_presupuest') {
                var idTransaction = rec.getValue('custrecord_lh_cp_transaccion');
                var idSubsidiary = rec.getValue('custrecord_lh_cp_subsidiaria');
                var checkFlujo = rec.getValue('custrecord_lh_cp_flujo_aprobacion');

                var arrayFilters = [
                    ["custrecord_lh_cp_transaccion", "anyof", idTransaction],
                    "AND",
                    ["custrecord_lh_cp_subsidiaria", "anyof", idSubsidiary],
                    "AND",
                    ["custrecord_lh_cp_flujo_aprobacion", "is", checkFlujo]
                ]

                if (!rec.isNew) {
                    arrayFilters.push("AND", ["internalid", "noneof", rec.id]);
                }

                var busqConfigPpto = search.create({
                    type: typeTrans,
                    filters: arrayFilters,
                    columns: ["custrecord_lh_cp_flujo_aprobacion"]
                });

                var runConfigPpto = busqConfigPpto.run().getRange(0, 1000);
                if (runConfigPpto.length > 0) {
                    var c = 0;
                    for (var i = 0; i < runConfigPpto.length; i++) {
                        var checkConfigPpto = runConfigPpto[i].getValue('custrecord_lh_cp_flujo_aprobacion');
                        console.log('checkConfigPpto', checkConfigPpto);
                        if (checkConfigPpto) c += 1;
                    }
                    if (c >= 1) {
                        alert('Ya existe un flujo de Aprobación activado para esa configuración');
                        return false;
                    } else {
                        return true;
                    }

                } else {
                    return true;
                }

            }

            if (typeTrans == 'customrecord_lh_cp_tipo_cambio') {
                var subsidiariaTc = rec.getValue('custrecord_lh_tc_subsidiaria');
                var periodoTc = rec.getValue('custrecord_lh_tc_periodo');
                //var tipoCambio = rec.getValue('custrecord_lh_tc_tipo_cambio');

                var arrayFilters = [
                    ["custrecord_lh_tc_subsidiaria", "anyof", subsidiariaTc],
                    "AND",
                    ["custrecord_lh_tc_periodo", "anyof", periodoTc],
                    /*             "AND",
                                ["custrecord_lh_tc_tipo_cambio", "is", tipoCambio] */
                ]

                if (!rec.isNew) {
                    arrayFilters.push("AND", ["internalid", "noneof", rec.id]);
                }

                var busqTipoCambio = search.create({
                    type: typeTrans,
                    filters: arrayFilters,
                    columns: ["internalid"]
                });

                var runTipoCambio = busqTipoCambio.run().getRange(0, 1000);
                if (runTipoCambio.length > 0) {
                    alert('Ya existe un registro con dicha subsidiaria, periodo');
                    return false;
                } else {
                    return true;
                }

            }

            return true;
        } catch (e) {
            console.log('Error en saveRecord', e);
        }
    }


    function statusAprobacion(_internalId, _recordType, _idStatus) {
        let tempo = 0;
        let rangeDates;
        try {
            let statusTransf = _idStatus == APPROVED_STATUS ? "aprobar" : "rechazar";
            let flag = confirm('¿Esta seguro de ' + statusTransf + ' la solicitud?');
            if (flag) {
                let recTranferencia = record.load({ type: _recordType, id: _internalId, isDynamic: true })
                let solicitud = recTranferencia.getValue('custrecord_lh_detalle_cppto_solicitud');
                let idpartidaadi = recTranferencia.getValue('custrecord_lh_detalle_cppto_partida_adi');
                let idpartidadis = recTranferencia.getValue('custrecord_lh_detalle_cppto_partida_dis');
                let fdesde = recTranferencia.getValue('custrecord_lh_detalle_cppto_fecha_adi');
                let fhasta = recTranferencia.getValue('custrecord_lh_detalle_cppto_fecha_dis');
                let monto = parseFloat(recTranferencia.getValue('custrecord_lh_detalle_cppto_aumento_ppto'));
                let parsedDateStringAsRawDateObjectfdesde = format.parse({ value: fdesde, type: format.Type.DATE });
                fdesde = format.format({ value: parsedDateStringAsRawDateObjectfdesde, type: format.Type.DATE });
                let parsedDateStringAsRawDateObjectfhasta = format.parse({ value: fdesde, type: format.Type.DATE });
                fhasta = format.format({ value: parsedDateStringAsRawDateObjectfhasta, type: format.Type.DATE });

                if (solicitud == ADICION) {
                    if (_idStatus == APPROVED_STATUS) {
                        let successInc = _controller.applyIncrease(fdesde, monto, idpartidaadi);
                        if (successInc == 1) {
                            alert('Operación realizada con éxito.');
                            recTranferencia.setValue('custrecord_lh_detalle_cppto_estado_aprob', _idStatus);
                            recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });
                            window.location.reload();
                        } else {
                            alert('Ocurrió un error al adicionar presupuesto. Comunicarse con el área de soporte.');
                        }
                    } else {
                        recTranferencia.setValue('custrecord_lh_detalle_cppto_estado_aprob', _idStatus);
                        recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });
                        window.location.reload();
                    }
                } else {
                    if (_idStatus == APPROVED_STATUS) {
                        let year = fhasta.split('/')[2];
                        let month = parseInt(fhasta.split('/')[1]);
                        let tempConfig = _controller.getConfig();
                        if (tempConfig == TEMPORALIDAD_MENSUAL) {
                            rangeDates = _controller.getMonthly(parseInt(month), year);
                        } else if (tempConfig == TEMPORALIDAD_TRIMESTRAL) {
                            for (let i in arregloTrimestre) {
                                let bloque = arregloTrimestre[i].includes(month.toString());
                                if (bloque == true) {
                                    tempo = parseInt(i);
                                    break;
                                }
                            }
                            rangeDates = _controller.getQuaterly(tempo, year);

                        } else if (tempConfig == TEMPORALIDAD_ANUAL) {
                            alert('Revisar proceso de transferencia anual. Comunicarse con el área de soporte.');
                        } else {
                            alert('No existe una configuración de presupuesto activo.');
                        }
                        console.log('rangeDates', rangeDates);
                        let presupuestado = _controller.getPresupuestado(rangeDates.fdesde, rangeDates.fhasta, idpartidadis);
                        let reservado = _controller.getReservado(rangeDates.fdesde, rangeDates.fhasta, idpartidadis);
                        let comprometido = _controller.getComprometido(rangeDates.fdesde, rangeDates.fhasta, idpartidadis);
                        let ejecutado = _controller.getEjecutado(rangeDates.fdesde, rangeDates.fhasta, idpartidadis);
                        let disponible = parseFloat(presupuestado) - (parseFloat(reservado) + parseFloat(comprometido) + parseFloat(ejecutado));
                        let tengodisponible = disponible - monto;
                        console.log('presupuestado:', presupuestado);
                        console.log('tengodisponible:', disponible);
                        console.log('tengodisponibleFinal:', tengodisponible);

                        if (tengodisponible >= 0) {
                            let successInc = _controller.applyIncrease(fdesde, monto, idpartidaadi);
                            let successDec = _controller.applyDecrease(fhasta, monto, idpartidadis);
                            if (successInc == 1 && successDec == 1) {
                                alert('Transferencia realizada con éxito');
                                recTranferencia.setValue('custrecord_lh_detalle_cppto_estado_aprob', _idStatus);
                                recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });
                                window.location.reload();
                            } else {
                                alert('Ocurrió un error al transferir presupuesto. Comunicarse con el área de soporte.');
                            }
                        } else {
                            alert('No tiene monto disponible para transferir.');
                        }
                    } else {
                        recTranferencia.setValue('custrecord_lh_detalle_cppto_estado_aprob', _idStatus);
                        recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });
                        window.location.reload();
                    }
                }
            }
        } catch (e) {
            console.log('Error en statusAprobacion: ', e);
        }
    }


    function generarPeriodo(_internalId, _recordType) {
        try {
            var flag = confirm('¿Esta seguro de generar los periodos?');

            if (flag) {

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
                var runAnios = busqAnios.run().getRange(0, 20);
                var columns = runAnios[0].columns;
                var anioIni = Number(runAnios[0].getValue(columns[0]));
                var anioFin = Number(runAnios[runAnios.length - 1].getValue(columns[0]));


                var anioPeriodo = parseInt(prompt('Digíte el Año (Entre ' + anioIni + ' y ' + anioFin + '): '));
                console.log('anioPeriodo', anioPeriodo);
                if (anioPeriodo >= anioIni && anioPeriodo <= anioFin) {
                    alert('Se van a generar los periodos para el año ' + anioPeriodo);

                    var busqIdAnio = search.create({
                        type: "customrecord_lh_cp_anio",
                        filters: [["name", "is", anioPeriodo]],
                        columns: ["internalid"]
                    });
                    var runIdAnio = busqIdAnio.run().getRange(0, 1);
                    var idAnio = runIdAnio[0].getValue("internalid");

                    console.log('idCategPpto', _internalId);
                    console.log('idAnio', idAnio);

                    for (var k = 1; k <= 6; k++) {
                        createCategoriaPeriodos(_internalId, k, idAnio);
                    }
                    createCategoriaPeriodos(_internalId, 9, idAnio);
                    createCategoriaPeriodos(_internalId, 7, idAnio);
                    window.location.reload();

                } else {
                    alert('Valor fuera de rango o dato no numérico. Vuelva a intentarlo');
                }


            }

        } catch (e) {
            console.log('Error en generarPeriodo', e);

        }

    }


    function getNombrePeriodo(_idPeriodo) {
        var namePeriodo = '';
        var mesPeriodo = '';
        var anioPeriodo = '';
        if (_idPeriodo) {
            var busqPeriodo = search.lookupFields({
                type: 'accountingperiod',
                id: _idPeriodo,
                columns: 'periodname'
            });
            namePeriodo = busqPeriodo.periodname;
            mesPeriodo = getNumeroMes(namePeriodo.split(' ')[0]);
            anioPeriodo = namePeriodo.split(' ')[1];
        }

        return { 'mes': mesPeriodo, 'anio': anioPeriodo, 'namePeriodo': namePeriodo };
    }


    function getNumeroMes(_nombreMes) {
        var jsonNumeroMes = {
            'ene': '01',
            'feb': '02',
            'mar': '03',
            'abr': '04',
            'may': '05',
            'jun': '06',
            'jul': '07',
            'ago': '08',
            'sep': '09',
            'oct': '10',
            'nov': '11',
            'dic': '12'
        }
        return jsonNumeroMes[_nombreMes]
    }


    function getMontoPeriodo(_idCategoria, _anio, _idStatus, _mes, _idCentroCosto) {

        console.log('getMontoPeriodo', _idCategoria + ',' + _anio + ',' + _idStatus + ',' + _mes + ',' + _idCentroCosto);
        var busqIdAnio = search.create({
            type: "customrecord_lh_cp_anio",
            filters: [["name", "is", _anio]],
            columns: ["internalid"]
        });
        var runIdAnio = busqIdAnio.run().getRange(0, 1);
        if (runIdAnio.length > 0) {
            var idAnio = runIdAnio[0].getValue("internalid");
        } else {
            alert('El año del periodo tiene deber ser a partir del 2020');
            return false;
        }

        var myFilters = [
            ["custrecord_lh_detalle_cppto_anio", "anyof", idAnio],
            "AND",
            ["custrecord_lh_detalle_cppto_status", "anyof", _idStatus],
            "AND",
            ["custrecord_lh_detalle_cppto_categoria.custrecord_lh_cp_centro_costo", "anyof", _idCentroCosto]
        ];
        if (_idCategoria) myFilters.push("AND", ["custrecord_lh_detalle_cppto_categoria.custrecord_lh_cp_nombre_categoria", "anyof", _idCategoria]);

        //Obtiene el monto del periodo
        var columnaMes = "custrecord_lh_detalle_cppto_" + _mes;
        console.log('columnaMes', columnaMes);
        var searchMonto = search.create({
            type: "customrecord_lh_categoriap_periodo",
            filters: myFilters,
            columns: ['internalid', columnaMes]
        });
        var runMonto = searchMonto.run().getRange(0, 1);
        var montoPeriodo = '';
        var idCategPeriod = '';
        if (runMonto.length > 0) {
            idCategPeriod = runMonto[0].getValue('internalid');
            montoPeriodo = runMonto[0].getValue(columnaMes);
        } else {
            //alert('No se ha configurado monto para el periodo ' + _namePeriodo);
            return false;
        }
        return { 'idCategPeriodo': idCategPeriod, 'montoPeriodo': montoPeriodo };
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


    function setTransferenciaMontos(_id_categoria, _field_periodo, _mnt_transferir, _tipo) {

        var recCategPeriodoTransf = record.load({
            type: CATEGORIA_PERIODO_RECORD,
            id: _id_categoria,
            isDynamic: true,
        });
        var mntActualTransf = recCategPeriodoTransf.getValue(_field_periodo);
        var newMntActualTransf = 0.00;
        if (_tipo == 'origen') {
            newMntActualTransf = Number(mntActualTransf) - Number(_mnt_transferir);
        } else {
            newMntActualTransf = Number(mntActualTransf) + Number(_mnt_transferir);
        }
        console.log('newMntActualTransf', newMntActualTransf);
        recCategPeriodoTransf.setValue(_field_periodo, newMntActualTransf);
        recCategPeriodoTransf.save({ ignoreMandatoryFields: true, enableSourcing: false });
        console.log('guarda transferencia');

    }


    function getConfigPpto() {
        var temporalidadConfPpto = '';
        var nivelControlConfPpto = '';
        var busqTemporalidaPpto = search.create({
            type: "customrecord_lh_configuracion_presupuest",
            filters: [
                ["custrecord_lh_cp_flujo_aprobacion", "is", "T"],
                "AND",
                ["isinactive", "is", "F"]
            ],
            columns: ["custrecord_lh_cp_temporalidad", "custrecord_lh_cp_nivel_control"]
        });
        var runTemporalidaPpto = busqTemporalidaPpto.run().getRange(0, 1);
        if (runTemporalidaPpto.length > 0) {
            temporalidadConfPpto = runTemporalidaPpto[0].getValue('custrecord_lh_cp_temporalidad');
            nivelControlConfPpto = runTemporalidaPpto[0].getValue('custrecord_lh_cp_nivel_control');
        } else {
            alert('Debe registrar una configuración de presupesto o active el flujo de aprobación');
            return false;
        }
        return {
            'temporalidad': temporalidadConfPpto,
            'nivelControl': nivelControlConfPpto
        }
    }


    function createCategoriaPeriodos(_internalId, _k, _idAnio) {
        var recCategPptoPeriod = record.create({
            type: CATEGORIA_PERIODO_RECORD,
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


    function getMntStatusPeriod(_record, _id_record, _column) {
        var recCategPeriod = search.lookupFields({
            type: _record,
            id: _id_record,
            columns: _column
        });
        return recCategPeriod[_column];
    }


    function setAdicion(_recPer, _idStatusPer, _mes, _monto, _recDisp) {
        console.log('_recPer', _recPer);
        console.log('_idStatusPer', _idStatusPer);
        console.log('_mes', _mes);
        console.log('_monto', _monto);

        var jsonSendValues = {
            type: _recPer,
            id: _idStatusPer,
        };
        if (_mes == '01') jsonSendValues.values = { "custrecord_lh_detalle_cppto_01": _monto }
        if (_mes == '02') jsonSendValues.values = { "custrecord_lh_detalle_cppto_02": _monto }
        if (_mes == '03') jsonSendValues.values = { "custrecord_lh_detalle_cppto_03": _monto }
        if (_mes == '04') jsonSendValues.values = { "custrecord_lh_detalle_cppto_04": _monto }
        if (_mes == '05') jsonSendValues.values = { "custrecord_lh_detalle_cppto_05": _monto }
        if (_mes == '06') jsonSendValues.values = { "custrecord_lh_detalle_cppto_06": _monto }
        if (_mes == '07') jsonSendValues.values = { "custrecord_lh_detalle_cppto_07": _monto }
        if (_mes == '08') jsonSendValues.values = { "custrecord_lh_detalle_cppto_08": _monto }
        if (_mes == '09') jsonSendValues.values = { "custrecord_lh_detalle_cppto_09": _monto }
        if (_mes == '10') jsonSendValues.values = { "custrecord_lh_detalle_cppto_10": _monto }
        if (_mes == '11') jsonSendValues.values = { "custrecord_lh_detalle_cppto_11": _monto }
        if (_mes == '12') jsonSendValues.values = { "custrecord_lh_detalle_cppto_12": _monto }
        if (_recDisp == 'SI') jsonSendValues.values["custrecord_ts_cp_campo_flag"] = "Modificado";
        jsonSendValues.options = { enableSourcing: false, ignoreMandatoryFields: true }
        console.log('jsonSendValues', JSON.stringify(jsonSendValues));
        record.submitFields(jsonSendValues);

    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord,
        statusAprobacion: statusAprobacion,
        generarPeriodo: generarPeriodo
    };

});

/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 14/07/2022
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
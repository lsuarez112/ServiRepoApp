import { buildTemplates } from './template-engine.js';

const CLIENT_TOKEN = '5632674a4257a67218c812191c3efd81';
const BASE_URL = 'https://cloud01.browix.com/v1/externalpermissions';

$(async function () {

    setupTables()

    await buildTemplates();

    initTables()

    initModal();

    const { supervisores, repositores, otros } = await getUsers();

    Alpine.store('usuarios').supervisores = supervisores;

    Alpine.store('usuarios').repositores = repositores;

    Alpine.store('usuarios').otros = otros;

    $('#cantidadSupervisores').text(`${supervisores.length} supervisores`);

    $('#cantidadRepositores').text(`${repositores.length} repositores`);

    Alpine.store('usuarios').estado = 'RENDER';
});

function setupTables() {
    if (!Alpine.store('usuarios')) {
        Alpine.store('usuarios', {
            supervisores: [],
            repositores: [],
            otros: [],
            estado: 'CARGANDO',
            modalSupervisor: {
                isOpen: false,
                estado: 'CARGANDO',
                usuario: {},
                marcaciones: [],
                desde: '',
                hasta: '',
                dniSupervisor: '',
                resumenGlobal: {},
                exportarExcel() {

                    const nombreCompleto = `${this.usuario.last_name}, ${this.usuario.name}`;

                    const dni = this.usuario.identification_number || "sinDNI";

                    // generar nombre de archivo seguro
                    const safeFileName = `${this.usuario.last_name}_${this.usuario.name}_${dni}`
                        .replace(/[^a-z0-9]/gi, '_') // reemplaza cualquier cosa que no sea letra o número por _
                        .toLowerCase();

                    const dataUsuarios = {
                        [nombreCompleto]: {
                            ...this.usuario,
                            intervals: this.marcaciones
                        }
                    };

                    globalExportarExcel(dataUsuarios, safeFileName)
                },
                async buscarMarcaciones() {
                    this.estado = 'CARGANDO';

                    this.marcaciones = await fetchMarcacionesPorUsuario(this.dniSupervisor, this.desde, this.hasta)

                    let totalBrutoSegundos = 0;
                    let totalNetoSegundos = 0;
                    let totalTrasladoSegundos = 0;

                    for (const fecha in this.marcaciones) {
                        const dataDia = this.marcaciones[fecha];
                        totalBrutoSegundos += dataDia.tiempo_bruto_total * 3600;
                        totalNetoSegundos += dataDia.tiempo_neto_total * 3600;
                        totalTrasladoSegundos += dataDia.tiempo_traslado_total * 3600;
                    }

                    this.resumenGlobal = {
                        tiempo_bruto_total_hms: segToHMS(totalBrutoSegundos),
                        tiempo_neto_total_hms: segToHMS(totalNetoSegundos),
                        tiempo_traslado_total_hms: segToHMS(totalTrasladoSegundos)
                    };

                    this.estado = 'RENDER';
                },
                async open(dniSupervisor) {

                    this.estado = 'CARGANDO';
                    this.isOpen = true;

                    this.dniSupervisor = dniSupervisor;

                    const supervisorData = await fetchUserByDNI(dniSupervisor);

                    this.usuario = limpiarDatosUsuario(supervisorData.User);

                    const today = new Date();
                    const hasta = today.toISOString().split("T")[0];

                    const hace30 = new Date(today);
                    hace30.setDate(hace30.getDate() - 30);
                    const desde = hace30.toISOString().split("T")[0];

                    await sleep(1500)

                    this.desde = desde;
                    this.hasta = hasta;

                    this.marcaciones = await fetchMarcacionesPorUsuario(dniSupervisor, this.desde, this.hasta)

                    let totalBrutoSegundos = 0;
                    let totalNetoSegundos = 0;
                    let totalTrasladoSegundos = 0;

                    for (const fecha in this.marcaciones) {
                        const dataDia = this.marcaciones[fecha];
                        totalBrutoSegundos += dataDia.tiempo_bruto_total * 3600;
                        totalNetoSegundos += dataDia.tiempo_neto_total * 3600;
                        totalTrasladoSegundos += dataDia.tiempo_traslado_total * 3600;
                    }

                    this.resumenGlobal = {
                        tiempo_bruto_total_hms: segToHMS(totalBrutoSegundos),
                        tiempo_neto_total_hms: segToHMS(totalNetoSegundos),
                        tiempo_traslado_total_hms: segToHMS(totalTrasladoSegundos)
                    };

                    const supervisados = Alpine.store('usuarios').repositores.filter(
                        r => r.Supervisor && r.Supervisor.external_code === dniSupervisor
                    );

                    this.estado = 'RENDER';
                },
                close() {
                    this.isOpen = false;
                },
            },
            reposDeSupervisor: {
                isOpen: false,
                estado: 'CARGANDO',
                supervisorName: '',
                desde: '',
                hasta: '',
                repositores: [],
                exportarExcel() {

                    const supervisor = (this.supervisorName || "Supervisor").replaceAll(' ', '_');

                    // fechas
                    const desde = this.desde || "inicio";
                    const hasta = this.hasta || "hoy";

                    // nombre de archivo seguro
                    const safeFileName = `${supervisor}_${desde}_a_${hasta}`
                        .replace(/[^a-z0-9]/gi, '_')
                        .toLowerCase();

                    // armar dataUsuarios con todos los repositores
                    const dataUsuarios = {};

                    console.log('repositores', this.repositores)

                    this.repositores.forEach(repo => {
                        const nombreCompleto = `${repo.User.last_name}, ${repo.User.name}`;
                        dataUsuarios[nombreCompleto] = {
                            transporte_primario: repo.User.primary_transport || "Desconocido",
                            intervals: repo.marcaciones || {}
                        };
                    });

                    globalExportarExcel(dataUsuarios, safeFileName);

                },
                async buscarMarcaciones() {
                    this.estado = 'CARGANDO';

                    const totalRepos = this.repositores.length;
                    for (const [i, repo] of this.repositores.entries()) {
                        repo.User = limpiarDatosUsuario(repo.User);

                        this.marcacionesDe = `${repo.User.last_name}, ${repo.User.name} (${i + 1}/${totalRepos})`;

                        await sleep(1050);

                        repo.marcaciones = await fetchMarcacionesPorUsuario(
                            repo.User.identification_number,
                            this.desde,
                            this.hasta
                        );

                        let totalBrutoSegundos = 0;
                        let totalNetoSegundos = 0;
                        let totalTrasladoSegundos = 0;

                        for (const fecha in repo.marcaciones) {
                            const dataDia = repo.marcaciones[fecha];
                            totalBrutoSegundos += dataDia.tiempo_bruto_total * 3600;
                            totalNetoSegundos += dataDia.tiempo_neto_total * 3600;
                            totalTrasladoSegundos += dataDia.tiempo_traslado_total * 3600;
                        }

                        repo.resumenGlobal = {
                            tiempo_bruto_total_hms: segToHMS(totalBrutoSegundos),
                            tiempo_neto_total_hms: segToHMS(totalNetoSegundos),
                            tiempo_traslado_total_hms: segToHMS(totalTrasladoSegundos)
                        };

                        // console.log('obtener marcaciones de repositor:', repo);
                    }

                    this.estado = 'RENDER';

                },
                async openRepositores(dniSupervisor) {
                    this.estado = 'CARGANDO';
                    this.isOpen = true;

                    this.repositores = [];

                    const supervisorData = Alpine.store('usuarios').supervisores.filter(
                        s => s.User.external_code === dniSupervisor
                    );

                    this.supervisorName = `${supervisorData[0].User.last_name}, ${supervisorData[0].User.name}`;

                    const supervisados = Alpine.store('usuarios').repositores.filter(
                        r => r.Supervisor &&
                            r.Supervisor.external_code === dniSupervisor
                    );

                    const today = new Date();
                    const hasta = today.toISOString().split("T")[0];

                    const hace30 = new Date(today);
                    hace30.setDate(hace30.getDate() - 30);
                    const desde = hace30.toISOString().split("T")[0];

                    this.desde = desde;
                    this.hasta = hasta;

                    const totalRepos = supervisados.length;
                    for (const [i, repo] of supervisados.entries()) {
                        repo.User = limpiarDatosUsuario(repo.User);

                        this.marcacionesDe = `${repo.User.last_name}, ${repo.User.name} (${i + 1}/${totalRepos})`;

                        await sleep(1050);

                        repo.marcaciones = await fetchMarcacionesPorUsuario(
                            repo.User.identification_number,
                            desde,
                            hasta
                        );

                        let totalBrutoSegundos = 0;
                        let totalNetoSegundos = 0;
                        let totalTrasladoSegundos = 0;

                        for (const fecha in repo.marcaciones) {
                            const dataDia = repo.marcaciones[fecha];
                            totalBrutoSegundos += dataDia.tiempo_bruto_total * 3600;
                            totalNetoSegundos += dataDia.tiempo_neto_total * 3600;
                            totalTrasladoSegundos += dataDia.tiempo_traslado_total * 3600;
                        }

                        repo.resumenGlobal = {
                            tiempo_bruto_total_hms: segToHMS(totalBrutoSegundos),
                            tiempo_neto_total_hms: segToHMS(totalNetoSegundos),
                            tiempo_traslado_total_hms: segToHMS(totalTrasladoSegundos)
                        };

                        // console.log('obtener marcaciones de repositor:', repo);

                        this.repositores.push(repo);
                    }

                    this.estado = 'RENDER';

                    console.log(supervisorData);
                },
                close() {
                    this.isOpen = false;
                },
            },
            modalRepositor: {
                isOpen: false,
                estado: 'CARGANDO',
                usuario: {},
                marcaciones: [],
                desde: '',
                hasta: '',
                dniRepositor: '',
                resumenGlobal: {},
                exportarExcel() {

                    const nombreCompleto = `${this.usuario.last_name}, ${this.usuario.name}`;

                    const dni = this.usuario.identification_number || "sinDNI";

                    // generar nombre de archivo seguro
                    const safeFileName = `${this.usuario.last_name}_${this.usuario.name}_${dni}`
                        .replace(/[^a-z0-9]/gi, '_') // reemplaza cualquier cosa que no sea letra o número por _
                        .toLowerCase();

                    const dataUsuarios = {
                        [nombreCompleto]: {
                            ...this.usuario,
                            intervals: this.marcaciones
                        }
                    };

                    globalExportarExcel(dataUsuarios, safeFileName)

                },
                async buscarMarcaciones() {
                    this.estado = 'CARGANDO';

                    this.marcaciones = await fetchMarcacionesPorUsuario(this.dniRepositor, this.desde, this.hasta)

                    let totalBrutoSegundos = 0;
                    let totalNetoSegundos = 0;
                    let totalTrasladoSegundos = 0;

                    for (const fecha in this.marcaciones) {
                        const dataDia = this.marcaciones[fecha];
                        totalBrutoSegundos += dataDia.tiempo_bruto_total * 3600;
                        totalNetoSegundos += dataDia.tiempo_neto_total * 3600;
                        totalTrasladoSegundos += dataDia.tiempo_traslado_total * 3600;
                    }

                    this.resumenGlobal = {
                        tiempo_bruto_total_hms: segToHMS(totalBrutoSegundos),
                        tiempo_neto_total_hms: segToHMS(totalNetoSegundos),
                        tiempo_traslado_total_hms: segToHMS(totalTrasladoSegundos)
                    };

                    this.estado = 'RENDER';
                },
                async open(dniRepositor) {

                    this.estado = 'CARGANDO';
                    this.isOpen = true;

                    this.dniRepositor = dniRepositor;

                    const repositorData = await fetchUserByDNI(dniRepositor);

                    this.usuario = limpiarDatosUsuario(repositorData.User);

                    const today = new Date();
                    const hasta = today.toISOString().split("T")[0];

                    const hace30 = new Date(today);
                    hace30.setDate(hace30.getDate() - 30);
                    const desde = hace30.toISOString().split("T")[0];

                    await sleep(1500)

                    this.desde = desde;
                    this.hasta = hasta;

                    this.marcaciones = await fetchMarcacionesPorUsuario(this.dniRepositor, this.desde, this.hasta)

                    let totalBrutoSegundos = 0;
                    let totalNetoSegundos = 0;
                    let totalTrasladoSegundos = 0;

                    for (const fecha in this.marcaciones) {
                        const dataDia = this.marcaciones[fecha];
                        totalBrutoSegundos += dataDia.tiempo_bruto_total * 3600;
                        totalNetoSegundos += dataDia.tiempo_neto_total * 3600;
                        totalTrasladoSegundos += dataDia.tiempo_traslado_total * 3600;
                    }

                    this.resumenGlobal = {
                        tiempo_bruto_total_hms: segToHMS(totalBrutoSegundos),
                        tiempo_neto_total_hms: segToHMS(totalNetoSegundos),
                        tiempo_traslado_total_hms: segToHMS(totalTrasladoSegundos)
                    };

                    this.estado = 'RENDER';
                },
                close() {
                    this.isOpen = false;
                }
            }
        });
    }
    else {
        console.log('Store ya inicializado:', Alpine.store('usuarios'));
    }
}

function initTables() {
    // Verifica que Alpine ya esté disponible
    if (typeof Alpine?.store !== 'function') {
        console.warn('⚠️ Alpine aún no está listo. Asegurate de cargarlo antes.');
        return;
    }

    const supervisores = document.getElementById('tablaSupervisores');
    if (supervisores) Alpine.initTree(supervisores);

    const supervisorModal = document.getElementById('supervisorModal');
    if (supervisorModal) Alpine.initTree(supervisorModal);

    const repositores = document.getElementById('tablaRepositores');
    if (repositores) Alpine.initTree(repositores);
}

function initModal() {
    // Verifica que Alpine ya esté disponible
    if (typeof Alpine?.store !== 'function') {
        console.warn('⚠️ Alpine aún no está listo. Asegurate de cargarlo antes.');
        return;
    }

    const supervisorModal = document.getElementById('supervisorModal');
    if (supervisorModal) Alpine.initTree(supervisorModal);
}

async function getUsers() {

    let supervisores, repositores, otros = [];

    try {
        const url = `${BASE_URL}/getUsers/uuid:${CLIENT_TOKEN}/limit:200/page:1`;
        const response = await axios.get(url);
        const records = response.data.response.data.records;

        // Separar en supervisores y repositores
        supervisores = [];
        repositores = [];
        otros = [];

        records.forEach(userObj => {
            const user = userObj.User;
            if (user.role === "2") {
                supervisores.push(userObj);
            } else if (user.role === "3") {
                repositores.push(userObj);
            } else {
                otros.push(userObj);
            }
        });

    } catch (error) {
        console.error("Error al obtener usuarios:", error);

        return {
            supervisores: [],
            repositores: [],
            otros: []
        };
    }

    return { supervisores, repositores, otros };

}

async function fetchUserByDNI(dni) {
    const url = `${BASE_URL}/getUsers/uuid:${CLIENT_TOKEN}/${dni}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error en la respuesta HTTP: ${response.status}`);
        }

        const data = await response.json();
        const records = data.response?.data?.records;

        if (!records || records.length === 0) {
            console.log(`No se encontraron datos de usuario con DNI: ${dni}`);
            return null;
        }

        if (records.length > 1) {
            console.log(`Se encontró más de un usuario con DNI: ${dni}`);
            return null;
        }

        const userData = records[0];
        return userData;

    } catch (error) {
        console.error("Error al obtener el usuario:", error);
        return null;
    }
}

async function fetchMarcacionesPorUsuario(dni, desde, hasta) {

    // Simula timeout de 1.5 segundos por restricciones de la API
    await sleep(1500)
    const url = `${BASE_URL}/getIntervalsInDateRange/uuid:${CLIENT_TOKEN}/${desde}/${hasta}/${dni}/returnOnlyDataPayload:1`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        const intervals = data.data || [];

        // Agrupar igual que en Python
        const agrupados = {};

        intervals.forEach(interval => {
            const i = interval.Interval;
            const branchIn = interval.BranchIn;
            const branchOut = interval.BranchOut;

            const datetimeIn = new Date(i.datetime_in);
            const datetimeOut = i.datetime_out ? new Date(i.datetime_out) : new Date();
            const fecha = i.datetime_in.split(" ")[0];

            const duracionSeg = (datetimeOut - datetimeIn) / 1000;
            const duracionHMS = segToHMS(duracionSeg);

            if (!agrupados[fecha]) {
                agrupados[fecha] = {
                    intervals: [],
                    tiempo_neto_total: 0,
                    tiempo_traslado_total: 0,
                    tiempo_bruto_total: 0,
                    recorrido_puntos: []
                };
            }

            const datetimeOutStr = i.datetime_out || '';
            const outParts = datetimeOutStr ? datetimeOutStr.split(" ") : [];

            agrupados[fecha].intervals.push({
                datetime_in: i.datetime_in,
                date_in: i.datetime_in.split(" ")[0],
                time_in: i.datetime_in.split(" ")[1],
                datetime_out: datetimeOutStr,
                date_out: outParts[0] || '',
                time_out: outParts[1] || '',
                tiempo_neto_hms: duracionHMS,
                tiempo_neto_decimal: duracionSeg / 3600,
                ubicacion: branchIn.name,
                lat_in: i.lat_in,
                lon_in: i.lon_in,
                lat_out: i.lat_out,
                lon_out: i.lon_out,
                // Links Google maps
                marcacion_in: `https://www.google.com/maps?q=${i.lat_in},${i.lon_in}`,
                marcacion_out: `https://www.google.com/maps?q=${i.lat_out},${i.lon_out}`,
            });

            agrupados[fecha].tiempo_neto_total += duracionSeg / 3600;
            agrupados[fecha].recorrido_puntos.push(`${i.lat_in},${i.lon_in}`);
        });


        // Ahora calculamos tiempos brutos y links de recorrido
        for (const fecha in agrupados) {
            const dataDia = agrupados[fecha];
            let tiempoTrasladoSegundos = 0;
            dataDia.tiempo_traslado_total = 0; // en horas

            // Recorrido: calcular traslados entre marcaciones
            dataDia.intervals.forEach((intervalo, idx) => {
                if (idx === 0) {
                    intervalo.tiempo_traslado_hms = "0:00:00";
                    intervalo.tiempo_traslado_decimal = 0;
                } else {
                    const prev = dataDia.intervals[idx - 1];
                    const prevOut = new Date(prev.datetime_out);
                    const currIn = new Date(intervalo.datetime_in);
                    const trasladoSeg = (currIn - prevOut) / 1000;
                    tiempoTrasladoSegundos += trasladoSeg;

                    intervalo.tiempo_traslado_hms = segToHMS(trasladoSeg);
                    intervalo.tiempo_traslado_decimal = trasladoSeg / 3600;
                }
            });

            dataDia.tiempo_traslado_total = tiempoTrasladoSegundos / 3600;
            dataDia.tiempo_traslado_total_hms = segToHMS(tiempoTrasladoSegundos);

            // tiempo bruto (de la primer entrada a la última salida)
            if (dataDia.intervals.length > 1) {
                const primer = new Date(dataDia.intervals[0].datetime_in);
                const ultimo = new Date(dataDia.intervals[dataDia.intervals.length - 1].datetime_out || new Date());
                dataDia.tiempo_bruto_total = (ultimo - primer) / 1000 / 3600;
                dataDia.tiempo_bruto_total_hms = segToHMS((ultimo - primer) / 1000);

                dataDia.tiempo_neto_total_hms = segToHMS(dataDia.tiempo_neto_total * 3600);
            } else {
                dataDia.tiempo_bruto_total = dataDia.tiempo_neto_total;
                dataDia.tiempo_bruto_total_hms = dataDia.intervals[0].tiempo_neto_hms;
                dataDia.tiempo_neto_total_hms = dataDia.intervals[0].tiempo_neto_hms;
            }

            // Link de recorrido
            dataDia.recorrido_link = `https://www.google.com/maps/dir/` + dataDia.recorrido_puntos.join("/");
        }

        return agrupados;

    } catch (error) {
        console.error("Error al obtener marcaciones:", error);
        return {};
    }
}

function segToHMS(segundos) {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = Math.floor(segundos % 60);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function limpiarDatosUsuario(usuario) {
    // Clonar para no mutar original
    const limpio = { ...usuario };

    const fechaLegible = (fechaStr) => {
        if (!fechaStr) return "—";
        const date = new Date(fechaStr);
        if (isNaN(date)) return fechaStr; // fallback si no parsea bien
        return date.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Campos fecha
    limpio.birthday = fechaLegible(limpio.birthday);
    limpio.admission_date = fechaLegible(limpio.admission_date);
    limpio.created = fechaLegible(limpio.created);
    limpio.modified = fechaLegible(limpio.modified);

    // Nulos o vacíos
    for (const key in limpio) {
        if (limpio[key] === null || limpio[key] === '') {
            limpio[key] = '—';
        }
    }

    // Customfieldvalue con sus fechas si hiciera falta
    if (Array.isArray(limpio.Customfieldvalue)) {
        limpio.Customfieldvalue = limpio.Customfieldvalue.map(field => ({
            ...field,
            field_value_alpha: field.field_value_alpha || '—'
        }));
    }

    return limpio;
}

function globalExportarExcel(dataUsuarios, safeFileName = "marcaciones") {
    let rows = [];

    for (const usuario in dataUsuarios) {
        const infoUsuario = dataUsuarios[usuario];
        const transporte = infoUsuario.transporte_primario || "Desconocido";
        const marcaciones = infoUsuario.intervals;

        for (const fecha in marcaciones) {
            const dayData = marcaciones[fecha];

            dayData.intervals.forEach((m, i) => {
                rows.push({
                    "Número de Marcación": i + 1,
                    "Nombre": usuario,
                    "Día": fecha,
                    "Recorrido (enlace Google maps desde la 1er marcación a la última)": dayData.recorrido_link || '',
                    "Horas Totales del Día con Traslados": dayData.tiempo_bruto_total_hms,
                    "Horas Totales dentro del Super": dayData.tiempo_neto_total_hms,
                    "Tiempo de Traslado Total del Día": dayData.tiempo_traslado_total_hms,
                    "Tiempo de Traslado entre bocas": m.tiempo_traslado_hms,
                    "Nombre Boca": m.ubicacion,
                    "Hora Ingreso": m.datetime_in,
                    "Ubicación de Ingreso (enlace de Google maps)": m.marcacion_in,
                    "Hora Egreso": m.datetime_out,
                    "Ubicación de Egreso (enlace de Google maps)": m.marcacion_out,
                    "Tipo Transporte": transporte
                });
            });
        }
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marcaciones");
    XLSX.writeFile(wb, `${safeFileName}.xlsx`);
}
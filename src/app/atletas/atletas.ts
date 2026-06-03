import { Component, OnInit, HostListener, signal, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs'
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Servicios y modelos
import { AdminAthletesService } from '../core/services/admin-athletes.service';
import { AdminDisciplinesService } from '../core/services/admin-disciplines.service';
import { Discipline } from '../core/models/discipline.model';
import { AdminProfilesService } from '../core/services/admin-profiles.service';
import { ProfileService } from '../core/services/profile.service';
import { StorageService } from '../core/services/storage.service';
import { UserProfile } from '../core/models/profile.model';


interface Atleta {
  cedula: string;
  foto: string;
  initials: string;
  nombre: string;
  fechaNacimiento: string;
  edad: number;
  sexo: 'M' | 'F';
  disciplinas: string[];
  disciplinasInfo?: { nombre: string; tipo: string }[];
  estado: 'Activo' | 'Pendiente' | 'Inactivo';
  id_user?: string; // Para operaciones de actualización
  telefono?: string;                    
  esMenor?: boolean;                    
  encargadoNombre?: string;             
  encargadoTelefono?: string;
  name?: string;
  first_last_name?: string;
  second_last_name?: string;
}

@Component({
  selector: 'app-atletas',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './atletas.html',
  styleUrl: './atletas.css',
})
export class Atletas implements OnInit {

  // Servicios inyectados
  private adminAthletesService = inject(AdminAthletesService);
  private adminDisciplinesService = inject(AdminDisciplinesService);
  private router = inject(Router);
  private adminProfilesService = inject(AdminProfilesService);
  private profileService  = inject(ProfileService);
  private storageService  = inject(StorageService);

  isDark = signal(false);
  sidebarName     = signal('Administrador');
  sidebarInitials = signal('A');
  sidebarAvatarUrl = signal<string | null>(null);

  // ── Datos reales desde API ──────────────────────────────────────────
  atletasReales = signal<Atleta[]>([]);
  listaDisciplinasAPI = signal<Discipline[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');


  // ── Filters ───────────────────────────────────────
  searchQuery = signal('');
  minAge = signal<number | null>(null);
  maxAge = signal<number | null>(null);
  selectedSex = signal('');

  disciplineMenuOpen = signal(false);
  categoriaMenuOpen = signal(false);
  selectedDisciplines = signal<string[]>([]);
  selectedCategorias = signal<string[]>([]);

  disciplinesList: string[] = [];

  showCategoriaMenu = computed(() =>
    this.selectedDisciplines().includes('Para Tenis de Mesa')
  );

  readonly categorias = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  filteredAtletas = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const disciplines = this.selectedDisciplines();
    const sex = this.selectedSex();
    const min = this.minAge();
    const max = this.maxAge();

    const source = this.atletasReales();

    return source.filter(a => {
      if (query && !a.nombre.toLowerCase().includes(query) && !a.cedula.toLowerCase().includes(query)) return false;
      if (disciplines.length > 0 && !a.disciplinas.some(d => disciplines.includes(d))) return false;
      if (sex && a.sexo !== sex) return false;
      if (min !== null && a.edad < min) return false;
      if (max !== null && a.edad > max) return false;
      return true;
    });
  });

  // ── Selection ─────────────────────────────────────
  selectedIds = signal<Set<string>>(new Set());

  allSelected = computed(() => {
    const filtered = this.filteredAtletas();
    return filtered.length > 0 && filtered.every(a => this.selectedIds().has(a.cedula));
  });

  someSelected = computed(() => this.selectedIds().size > 0);
  selectedCount = computed(() => this.selectedIds().size);

  partialSelection = computed(() =>
    this.someSelected() && !this.allSelected()
  );

  toggleSelectAll() {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.filteredAtletas().map(a => a.cedula)));
    }
  }

  toggleSelect(id: string) {
    const next = new Set(this.selectedIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedIds.set(next);
  }


  clearSelection() { this.selectedIds.set(new Set()); }

  // ── View / Edit panel ─────────────────────────────
  panelAtleta = signal<Atleta | null>(null);
  panelMode = signal<'view' | 'edit'>('view');
  editForm: Atleta = {} as Atleta;
  panelSaved = signal(false);
  
  openPanel(a: Atleta, mode: 'view' | 'edit') {
  const partesNombre = a.nombre.split(' ');
  
  // Se formatea la fecha para mostrar en DD/MM/YYYY
  let fechaMostrar = a.fechaNacimiento;
  if (fechaMostrar && fechaMostrar !== 'N/A' && fechaMostrar.includes('-')) {
    const partes = fechaMostrar.split('-');
    if (partes.length === 3) {
      fechaMostrar = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
  }
  
  this.editForm = { 
    ...a, 
    fechaNacimiento: fechaMostrar,
    disciplinas: [...(a.disciplinas || [])],
    name: partesNombre[0] || '',
    first_last_name: partesNombre[1] || '',
    second_last_name: partesNombre[2] || '',
    telefono: a.telefono || '',
    encargadoNombre: a.encargadoNombre || '',
    encargadoTelefono: a.encargadoTelefono || ''
  };
  this.panelMode.set(mode);
  this.panelAtleta.set(a);
  this.panelSaved.set(false);
}

  closePanel() { this.panelAtleta.set(null); }

// ── Guardar cambios del atleta (HU-10) ───────────────────────────────
async savePanel() {
  const atletaActual = this.panelAtleta();
  if (!atletaActual || !atletaActual.id_user) return;

  this.panelSaved.set(true);
  
  try {
    // Recalcular edad y esMenor antes de guardar
    let nuevaEdad = this.editForm.edad;
    let esMenor = this.editForm.esMenor;
    let fechaFormateada = '';
    
    if (this.editForm.fechaNacimiento && this.editForm.fechaNacimiento !== 'N/A') {
      fechaFormateada = this.formatFechaParaAPI(this.editForm.fechaNacimiento);
      if (fechaFormateada) {
        nuevaEdad = this.calcularEdad(fechaFormateada);
        esMenor = nuevaEdad < 18;
      }
    }
    
    // Se actualiza el perfil
    const partesNombre = this.editForm.nombre.trim().split(' ');
    const nuevoNombre = partesNombre[0] || '';
    const nuevoPrimerApellido = partesNombre[1] || '';
    const nuevoSegundoApellido = partesNombre[2] || '';
    
    const profileData: any = {
      name: nuevoNombre,
      first_last_name: nuevoPrimerApellido,
      second_last_name: nuevoSegundoApellido,
      dni: this.editForm.cedula,
      sex: this.editForm.sexo === 'M' ? 'male' : 'female'
    };
    
    if (fechaFormateada) {
      profileData.birth_date = fechaFormateada;
    }
    
    await firstValueFrom(this.adminProfilesService.updateAnyProfile(atletaActual.id_user, profileData));
    
    // Se actualizan los datos de atleta
    const athleteData: any = {
      phone: esMenor ? '' : (this.editForm.telefono || '') // Si es menor, no guardar teléfono propio
    };
    
    if (esMenor) {
      athleteData.legal_guardian_name = this.editForm.encargadoNombre || '';
      athleteData.legal_guardian_phone = this.editForm.encargadoTelefono || '';
    } else {
      // Si es adulto, se limpian los campos de encargado en la BD
      athleteData.legal_guardian_name = null;
      athleteData.legal_guardian_phone = null;
    }
    
    await firstValueFrom(this.adminAthletesService.updateAthleteRecord(atletaActual.id_user, athleteData));
    
    // Se actualiza el estado (Activo/Inactivo)
    const isActive = this.editForm.estado === 'Activo';
    await firstValueFrom(this.adminProfilesService.blockUnblockUser(atletaActual.id_user, isActive));
    
    // Se calculan las nuevas iniciales
    const nuevasIniciales = this.obtenerIniciales(nuevoNombre, nuevoPrimerApellido);
    const nombreCompleto = `${nuevoNombre} ${nuevoPrimerApellido} ${nuevoSegundoApellido}`.trim();
    
    // Se construiye el atleta actualizado completo
    const atletaActualizado: Atleta = {
      id_user: atletaActual.id_user,
      cedula: this.editForm.cedula,
      nombre: nombreCompleto,
      fechaNacimiento: fechaFormateada ? new Date(fechaFormateada).toLocaleDateString() : this.editForm.fechaNacimiento,
      edad: nuevaEdad,
      sexo: this.editForm.sexo,
      disciplinas: this.editForm.disciplinas || [],
      estado: this.editForm.estado,
      telefono: esMenor ? '' : (this.editForm.telefono || ''),
      esMenor: esMenor,
      encargadoNombre: esMenor ? (this.editForm.encargadoNombre || '') : '',
      encargadoTelefono: esMenor ? (this.editForm.encargadoTelefono || '') : '',
      foto: this.editForm.foto || '',
      initials: nuevasIniciales
    };
    
    // Se actualiza el atleta en la lista local
    const currentList = this.atletasReales();
    const index = currentList.findIndex(a => a.id_user === atletaActual.id_user);
    
    if (index !== -1) {
      currentList[index] = atletaActualizado;
      this.atletasReales.set([...currentList]);
    }
    
    // Se cierra el panel y se abre de nuevo con los datos actualizados
    this.closePanel();
    this.openPanel(atletaActualizado, 'view');
    
    this.panelSaved.set(true);
    setTimeout(() => this.panelSaved.set(false), 2000);
    
  } catch (error) {
    console.error('Error guardando cambios:', error);
    this.errorMessage.set('Error al guardar los cambios');
    this.panelSaved.set(false);
  }
}


// Formatear fecha DD/MM/YYYY a YYYY-MM-DD para la API
formatFechaParaAPI(fecha: string): string {
  if (!fecha || fecha === 'N/A') return '';
  
  // Si ya está en formato YYYY-MM-DD, devolverla
  if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return fecha;
  }
  
  // Convertir de DD/MM/YYYY a YYYY-MM-DD
  const partes = fecha.split('/');
  if (partes.length === 3) {
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const anio = partes[2];
    return `${anio}-${mes}-${dia}`;
  }
  
  return '';
}


// ── Mostrar mensaje temporal ─────────────────────────────────────────
mostrarMensaje(texto: string, tipo: 'success' | 'error') {
  const msgDiv = document.createElement('div');
  msgDiv.textContent = texto;
  msgDiv.className = `adm-toast adm-toast--${tipo}`;
  document.body.appendChild(msgDiv);
  setTimeout(() => msgDiv.remove(), 3000);
}


// ── Eliminar atleta (con confirmación) ───────────────────────────────
async deleteAthlete(atleta: Atleta) {
  if (!atleta.id_user) {
    this.errorMessage.set('No se puede eliminar: falta identificación');
    return;
  }

  // Confirmación con mensaje personalizado
  const confirmado = confirm(`¿Está seguro/a de que se quiere eliminar a ${atleta.nombre}?\n\nEsta acción no se puede deshacer.`);
  
  if (!confirmado) return;

  this.isLoading.set(true);
  
  try {
    // Se elimina el perfil de usuario
    await firstValueFrom(this.adminProfilesService.deleteUser(atleta.id_user));
    
    // Se elimina de la lista local
    const currentList = this.atletasReales();
    const nuevaLista = currentList.filter(a => a.id_user !== atleta.id_user);
    this.atletasReales.set(nuevaLista);
    
    // Si el panel estaba abierto con el atleta seleccionado, se cierra
    if (this.panelAtleta()?.id_user === atleta.id_user) {
      this.closePanel();
    }
    
    this.mostrarMensaje(`${atleta.nombre} ha sido eliminado correctamente`, 'success');
    
  } catch (error) {
    console.error('Error eliminando atleta:', error);
    this.errorMessage.set('Error al eliminar el atleta');
    this.mostrarMensaje(`Error al eliminar a ${atleta.nombre}`, 'error');
  } finally {
    this.isLoading.set(false);
  }
}


// ── Exportar atletas seleccionados ─────────────────────────────────────
exportarSeleccionados(formato: 'pdf' | 'excel' | 'word') {
  const atletasSeleccionados = this.atletasReales().filter(a => 
    this.selectedIds().has(a.cedula)
  );
  
  if (atletasSeleccionados.length === 0) {
    this.mostrarMensaje('No hay atletas seleccionados', 'error');
    return;
  }

  if (formato === 'excel') {
    this.exportarExcel(atletasSeleccionados);
  } else if (formato === 'pdf') {
    this.exportarPDF(atletasSeleccionados);
  } else if (formato === 'word') {
    this.exportarWord(atletasSeleccionados);
  }
}


private exportarExcel(atletas: Atleta[]) {
  const hayMenores = atletas.some(a => a.esMenor);
  
  const datos = atletas.map(a => {
    const telefono = a.esMenor ? (a.encargadoTelefono || 'No registrado') : (a.telefono || 'No registrado');
    
    const disciplinasTexto = a.disciplinasInfo && a.disciplinasInfo.length > 0
      ? a.disciplinasInfo.map(d => `${d.nombre} (${d.tipo === 'sport' ? 'Deportiva' : 'Recreativa'})`).join(', ')
      : 'Ninguna';
    
    const row: any = {
      'Nombre': a.nombre,
      'Cédula': a.cedula,
      'Fecha nacimiento': a.fechaNacimiento,
      'Edad': a.edad,
      'Sexo': a.sexo === 'M' ? 'Masculino' : 'Femenino',
      'Disciplina(s)': disciplinasTexto,
      'Teléfono de contacto': telefono,
      'Estado': a.estado
    };
    
    if (hayMenores) {
      row['Encargado legal'] = a.esMenor ? (a.encargadoNombre || 'No registrado') : '';
    }
    
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Atletas');
  
  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  XLSX.writeFile(wb, `atletas_exportados_${timestamp}.xlsx`);
  this.mostrarMensaje(`${atletas.length} atleta(s) exportados a Excel`, 'success');
}

private async exportarPDF(atletas: Atleta[]) {
  if (!atletas || atletas.length === 0) {
    this.mostrarMensaje('No hay atletas seleccionados', 'error');
    return;
  }
  
  this.mostrarMensaje('Generando PDF, por favor espere...', 'success');
  
  const ATHLETES_PER_PAGE = 25;
  const totalPages = Math.ceil(atletas.length / ATHLETES_PER_PAGE);
  
  const pagesAtletas: Atleta[][] = [];
  for (let i = 0; i < totalPages; i++) {
    const start = i * ATHLETES_PER_PAGE;
    const end = start + ATHLETES_PER_PAGE;
    pagesAtletas.push(atletas.slice(start, end));
  }
  
  // Se crea el PDF
  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'landscape'
  });
  
  // Se procesa cada página por separado
  for (let i = 0; i < pagesAtletas.length; i++) {
    const pageAtletas = pagesAtletas[i];
    const html = this.generarPaginaHTML(pageAtletas, i + 1, totalPages);
    
    // Se crea el iframe temporal para esta página
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1200px';
    iframe.style.height = '800px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    // Se espera a que el iframe cargue y procese
    await new Promise<void>((resolve) => {
      iframe.onload = async () => {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();
          
          // Esperar a que el contenido se renderice
          setTimeout(async () => {
            try {
              const canvas = await html2canvas(iframeDoc.body, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: false,
                windowWidth: iframeDoc.body.scrollWidth,
                windowHeight: iframeDoc.body.scrollHeight
              });
              
              const imgData = canvas.toDataURL('image/jpeg', 1.0);
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const imgWidth = pdfWidth - 20;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              // Si no es la primera página, se agrega la página nueva en el PDF
              if (i > 0) {
                pdf.addPage();
              }
              
              pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
              
              document.body.removeChild(iframe);
              resolve();
            } catch (err) {
              console.error('Error en página', i + 1, err);
              document.body.removeChild(iframe);
              resolve();
            }
          }, 300);
        } else {
          document.body.removeChild(iframe);
          resolve();
        }
      };
      iframe.src = 'about:blank';
    });
  }
  
  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  pdf.save(`atletas_exportados_${timestamp}.pdf`);
  this.mostrarMensaje(`${atletas.length} atleta(s) exportados a PDF (${totalPages} página(s))`, 'success');
}

private exportarWord(atletas: Atleta[]) {
  const contenido = this.generarHTMLParaExportar(atletas);
  
  const blob = new Blob([contenido], { type: 'application/msword' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  link.download = `atletas_exportados_${timestamp}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  this.mostrarMensaje(`${atletas.length} atleta(s) exportados a Word`, 'success');
}

private generarPaginaHTML(atletas: Atleta[], paginaNumero: number, totalPaginas: number): string {
  const hayMenores = atletas.some(a => a.esMenor);
  
  const filas = atletas.map(a => {
    const telefono = a.esMenor ? (a.encargadoTelefono || 'No registrado') : (a.telefono || 'No registrado');
    
    const disciplinasTexto = a.disciplinasInfo && a.disciplinasInfo.length > 0
      ? a.disciplinasInfo.map(d => `${d.nombre} (${d.tipo === 'sport' ? 'Deportiva' : 'Recreativa'})`).join(', ')
      : 'Ninguna';
    
    return `
      <tr>
        <td>${a.nombre}</td>
        <td>${a.cedula}</td>
        <td>${a.fechaNacimiento}</td>
        <td>${a.edad}</td>
        <td>${a.sexo === 'M' ? 'Masculino' : 'Femenino'}</td>
        <td>${disciplinasTexto}</td>
        <td>${telefono}</td>
        ${hayMenores ? `<td>${a.esMenor ? (a.encargadoNombre || 'No registrado') : ''}</td>` : ''}
        <td>${a.estado}</td>
      </tr>
    `;
  }).join('');

  const encargadoHeader = hayMenores ? '<th>Encargado legal</th>' : '';

  return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Atletas - Página ${paginaNumero}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          margin: 0 !important;
          padding: 20px !important;
          background: white;
          font-family: Arial, sans-serif;
        }
        h1 { 
          color: #1e3a8a; 
          text-align: center; 
          margin: 0 0 10px 0;
          font-size: 16px;
        }
        .info {
          margin: 5px 0;
          font-size: 10px;
          text-align: center;
        }
        table { 
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th, td { 
          border: 1px solid #999;
          padding: 5px 6px;
          text-align: left;
          vertical-align: top;
          font-size: 10px;
        }
        th { 
          background-color: #1e3a8a; 
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) { 
          background-color: #f2f2f2; 
        }
        .footer { 
          margin-top: 10px; 
          text-align: center; 
          font-size: 9px; 
          color: #666;
        }
        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
      <div class="reporte-container">
        <h1>Listado de Atletas</h1>
        <div class="info">Página ${paginaNumero} de ${totalPaginas} | Fecha: ${new Date().toLocaleString()} | Total en esta página: ${atletas.length} atletas</div>
        <table cellspacing="0">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Fecha nac.</th>
              <th>Edad</th>
              <th>Sexo</th>
              <th>Disciplina(s)</th>
              <th>Teléfono</th>
              ${encargadoHeader}
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <div class="footer">Reporte generado desde el Sistema de Gestión de Atletas del Comité Cantonal de Deportes y Recreación Montes de Oca</div>
      </div>
    </body>
    </html>
  `;
}

private generarHTMLParaExportar(atletas: Atleta[]): string {
  const hayMenores = atletas.some(a => a.esMenor);
  
  const filas = atletas.map(a => {
    const telefono = a.esMenor ? (a.encargadoTelefono || 'No registrado') : (a.telefono || 'No registrado');
    
    const disciplinasTexto = a.disciplinasInfo && a.disciplinasInfo.length > 0
      ? a.disciplinasInfo.map(d => `${d.nombre} (${d.tipo === 'sport' ? 'Deportiva' : 'Recreativa'})`).join(', ')
      : 'Ninguna';
    
    return `
      <tr>
        <td>${a.nombre}</td>
        <td>${a.cedula}</td>
        <td>${a.fechaNacimiento}</td>
        <td>${a.edad}</td>
        <td>${a.sexo === 'M' ? 'Masculino' : 'Femenino'}</td>
        <td>${disciplinasTexto}</td>
        <td>${telefono}</td>
        ${hayMenores ? `<td>${a.esMenor ? (a.encargadoNombre || 'No registrado') : ''}</td>` : ''}
        <td>${a.estado}</td>
      </tr>
    `;
  }).join('');

  const encargadoHeader = hayMenores ? '<th>Encargado legal</th>' : '';

  return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Atletas</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          background: white;
        }
        h1 { color: #1e3a8a; text-align: center; font-size: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #999; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #1e3a8a; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #666; }
      </style>
    </head>
    <body>
      <h1>Listado de Atletas</h1>
      <p>Fecha: ${new Date().toLocaleString()} | Total: ${atletas.length} atletas</p>
      <table cellspacing="0">
        <thead>
          <tr><th>Nombre</th><th>Cédula</th><th>Fecha nac.</th><th>Edad</th>
            <th>Sexo</th><th>Disciplina(s)</th><th>Teléfono</th>
            ${encargadoHeader}<th>Estado</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
      <div class="footer">Reporte generado desde el Sistema de Gestión de Atletas</div>
    </body>
    </html>
  `;
}


// ── Export ────────────────────────────────────────
exportSelection(format: 'csv' | 'pdf' | 'word') {
  const formatMap = {
    'pdf': 'pdf',
    'word': 'word',
    'csv': 'excel' // CSV convertido a Excel
  };
  this.exportarSeleccionados(formatMap[format] as 'pdf' | 'excel' | 'word');
}

  // ── Dropdown close on outside click ───────────────
  // ── Métodos para el menú de disciplinas (HU-11) ────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.at-multiselect')) {
      this.disciplineMenuOpen.set(false);
      this.categoriaMenuOpen.set(false);
    }
  }

  toggleDisciplineMenu(e: Event) {
    e.stopPropagation();
    this.disciplineMenuOpen.update(v => !v);
    this.categoriaMenuOpen.set(false);
  }

  toggleCategoriaMenu(e: Event) {
    e.stopPropagation();
    this.categoriaMenuOpen.update(v => !v);
    this.disciplineMenuOpen.set(false);
  }

  toggleDiscipline(d: string) {
    const cur = this.selectedDisciplines();
    if (cur.includes(d)) {
      this.selectedDisciplines.set(cur.filter(x => x !== d));
      if (d === 'Para Tenis de Mesa') this.selectedCategorias.set([]);
    } else {
      this.selectedDisciplines.set([...cur, d]);
    }
  }

  toggleCategoria(c: string) {
    const cur = this.selectedCategorias();
    this.selectedCategorias.set(
      cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c]
    );
  }

  disciplineLabel() {
    const n = this.selectedDisciplines().length;
    return n === 0 ? 'Disciplinas' : `${n} disciplina${n > 1 ? 's' : ''}`;
  }

  categoriaLabel() {
    const n = this.selectedCategorias().length;
    return n === 0 ? 'Categoría funcional' : `${n} categoría${n > 1 ? 's' : ''}`;
  }

  // ── Cargar datos desde API ─────────────────────────────────────────
  cargarAtletasReales() {
  this.isLoading.set(true);
    
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn('No hay token, no se pueden cargar atletas');
    this.isLoading.set(false);
    this.errorMessage.set('No hay sesión activa. Por favor inicie sesión.');
    return;
  }

  this.adminAthletesService.getAllAthletes().subscribe({
    next: (data: any) => {
      this.procesarAtletasConDisciplinas(data);
    },
    error: (err) => {
      console.error('Error cargando atletas:', err);
      this.errorMessage.set('Error al cargar atletas.');
      this.isLoading.set(false);
      }
    });
  }

cargarDisciplinas() {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  this.adminDisciplinesService.getAllDisciplines().subscribe({
    next: (data: any) => {
      this.listaDisciplinasAPI.set(data as Discipline[]);
      // Extraer nombres únicos con type assertion
      const disciplinas = data as Discipline[];
      const nombresUnicos: string[] = [...new Set(disciplinas.map(d => d.name))];
      this.disciplinesList = nombresUnicos.sort();
    },
    error: (err) => console.error('Error cargando disciplinas:', err)
  });
}

procesarAtletasConDisciplinas(atletasData: any[]) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    this.isLoading.set(false);
    return;
  }

  // Se obtiene todos los perfiles
  this.adminProfilesService.getAllProfiles().subscribe({
    next: (perfiles: any) => {
      const promesas = atletasData.map(atleta => {
        // Se buscar el perfil que coincide con el id_user del atleta
        const perfil = perfiles.find((p: any) => p.id_user === atleta.id_user);
        
        return new Promise<Atleta>((resolve) => {
          this.adminDisciplinesService.getUserEnrollments(atleta.id_user).subscribe({
            next: (enrollments: any) => {
              const disciplinasInfo = enrollments
              .map((e: any) => ({
                  nombre: e.disciplines?.name,
                  tipo: e.disciplines?.discipline_type
                }))
                .filter((d: any) => d.nombre);

              const disciplinasNombres = disciplinasInfo.map((d: any) => d.nombre);
              
              // Se calcula la edad y se determina si es menor de edad
              const edad = perfil?.birth_date ? this.calcularEdad(perfil.birth_date) : 0;
              const esMenor = edad < 18;
              
              // Determina qué teléfono y contacto mostrar
              let telefono = '';
              let encargadoNombre = '';
              let encargadoTelefono = '';
              
              if (esMenor && atleta.legal_guardian_name && atleta.legal_guardian_phone) {
                // Para menores de edad se muestran los datos del encargado
                encargadoNombre = atleta.legal_guardian_name;
                encargadoTelefono = atleta.legal_guardian_phone;
                telefono = atleta.legal_guardian_phone; // El teléfono que se muestra es el del encargado
              } else {
                // Para los adultos se muesra su propio teléfono
                telefono = atleta.phone || 'No registrado';
              }
              
              // Se generan iniciales para el avatar en caso de que no haya foto
              const nombreCompleto = `${perfil?.name || ''} ${perfil?.first_last_name || ''} ${perfil?.second_last_name || ''}`.trim();
              const iniciales = this.obtenerIniciales(perfil?.name || '', perfil?.first_last_name || '');
              
              resolve({
                id_user: atleta.id_user,
                cedula: perfil?.dni || 'N/A',
                nombre: nombreCompleto || 'Sin nombre',
                fechaNacimiento: perfil?.birth_date ? new Date(perfil.birth_date).toLocaleDateString() : 'N/A',
                edad: edad,
                sexo: this.mapearSexo(perfil?.sex),
                // Si hay foto se usa, pero si no, usa un string vacío, que en HTML se manejará con iniciales
                foto: perfil?.profile_image_url || '',
                estado: perfil?.is_active ? 'Activo' : 'Inactivo',
                disciplinas: disciplinasNombres,
                disciplinasInfo: disciplinasInfo,
                initials: iniciales,
                telefono: telefono,
                esMenor: esMenor,
                encargadoNombre: encargadoNombre,
                encargadoTelefono: encargadoTelefono
              });
            },
            error: () => {
              const edad = perfil?.birth_date ? this.calcularEdad(perfil.birth_date) : 0;
              const esMenor = edad < 18;
              let telefono = '';
              let encargadoNombre = '';
              let encargadoTelefono = '';
              
              if (esMenor && atleta.legal_guardian_name && atleta.legal_guardian_phone) {
                encargadoNombre = atleta.legal_guardian_name;
                encargadoTelefono = atleta.legal_guardian_phone;
                telefono = atleta.legal_guardian_phone;
              } else {
                telefono = atleta.phone || 'No registrado';
              }
              
              const nombreCompleto = `${perfil?.name || ''} ${perfil?.first_last_name || ''} ${perfil?.second_last_name || ''}`.trim();
              const iniciales = this.obtenerIniciales(perfil?.name || '', perfil?.first_last_name || '');
              
              resolve({
                id_user: atleta.id_user,
                cedula: perfil?.dni || 'N/A',
                nombre: nombreCompleto || 'Sin nombre',
                fechaNacimiento: perfil?.birth_date ? new Date(perfil.birth_date).toLocaleDateString() : 'N/A',
                edad: edad,
                sexo: this.mapearSexo(perfil?.sex),
                foto: perfil?.profile_image_url || '',
                estado: perfil?.is_active ? 'Activo' : 'Inactivo',
                disciplinas: [],
                disciplinasInfo: [],
                initials: iniciales,
                telefono: telefono,
                esMenor: esMenor,
                encargadoNombre: encargadoNombre,
                encargadoTelefono: encargadoTelefono
              });
            }
          });
        });
      });
      
      Promise.all(promesas).then((resultados) => {
        this.atletasReales.set(resultados);
        this.isLoading.set(false);
      });
    },
    error: (err) => {
      console.error('Error cargando perfiles:', err);
      this.isLoading.set(false);
    }
  });
}

mapearSexo(sexo: string): 'M' | 'F' {
  if (sexo === 'male') return 'M';
  if (sexo === 'female') return 'F';
  return 'M'; // valor por defecto
}

calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

// ── Recalcular la edad y el estado del menor de edad cuando cambia la fecha ─────────
onFechaNacimientoChange() {
  if (this.editForm.fechaNacimiento && this.editForm.fechaNacimiento !== 'N/A') {
    const fechaFormateada = this.formatFechaParaAPI(this.editForm.fechaNacimiento);
    if (fechaFormateada) {
      const nuevaEdad = this.calcularEdad(fechaFormateada);
      this.editForm.edad = nuevaEdad;
      this.editForm.esMenor = nuevaEdad < 18;
      
      // Si es mayor de edad, se limpian los campos de encargado
      if (!this.editForm.esMenor) {
        this.editForm.encargadoNombre = '';
        this.editForm.encargadoTelefono = '';
      }
    }
  }
}

  obtenerIniciales(nombre: string, apellido: string): string {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }

  // ── Theme & auth ──────────────────────────────────
  ngOnInit() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      this.isDark.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    // Cargar datos reales
    this.cargarAtletasReales();
    this.cargarDisciplinas();
    this.loadSidebarData();
  }

  private loadSidebarData() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    let userId = '';
    try { userId = JSON.parse(atob(token.split('.')[1])).sub ?? ''; } catch { return; }
    this.profileService.getOwnProfile().subscribe({
      next: (data) => {
        const profiles = data as UserProfile[];
        const p = profiles.find(x => x.id_user === userId) ?? profiles[0];
        if (p) {
          this.sidebarName.set([p.name, p.first_last_name].filter(Boolean).join(' ') || 'Administrador');
          this.sidebarInitials.set(((p.name?.[0] ?? '') + (p.first_last_name?.[0] ?? '')).toUpperCase() || 'A');
        }
      },
      error: () => {},
    });
    this.storageService.getAvatarAsBlob(userId).subscribe({
      next: (blob) => this.sidebarAvatarUrl.set(URL.createObjectURL(blob)),
      error: () => this.sidebarAvatarUrl.set(null),
    });
  }

  toggleTheme() {
    const next = !this.isDark();
    this.isDark.set(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
    
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/inicio-sesion']);
  }
}

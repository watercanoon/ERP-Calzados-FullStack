import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

const numeroALetras = (num) => {
    const enteros = Math.floor(num);
    const centavos = Math.round((num - enteros) * 100);
    return `SON: ${enteros} CON ${centavos}/100 SOLES`;
};

// AHORA RECIBE EL PARÁMETRO "DESCUENTO"
export const generarBoleta = async (carrito, subtotal, idVenta, tipoDocumento = 'BOLETA', cliente = {}, descuento = 0) => {
  const doc = new jsPDF();

  // --- 1. CONFIGURACIÓN ---
  const empresa = {
    nombre: "ERP CALZADOS S.A.C.",
    ruc: "20601234567",
    direccion: "Av. Los Héroes 123, Lima, Perú",
    telefono: "(01) 555-0909"
  };

  // --- 2. MATEMÁTICA FINANCIERA (SUNAT) ---
  // A. Aplicamos descuento al total bruto
  const totalPagar = subtotal - descuento;

  // B. Sacamos la Base Imponible del TOTAL FINAL PAGADO
  const igvTasa = 0.18;
  const opGravada = totalPagar / (1 + igvTasa);
  const igvTotal = totalPagar - opGravada;

  // --- 3. DISEÑO VISUAL ---
  let tituloDoc = "BOLETA DE VENTA ELECTRÓNICA";
  let serie = "B001";
  let colorTema = [37, 99, 235];

  if (tipoDocumento === 'FACTURA') {
    tituloDoc = "FACTURA ELECTRÓNICA";
    serie = "F001";
    colorTema = [220, 38, 38];
  } else if (tipoDocumento === 'TICKET') {
    tituloDoc = "TICKET DE VENTA";
    serie = "T001";
    colorTema = [75, 85, 99];
  }

  const numeroComprobante = `${serie}-${idVenta.toString().padStart(6, '0')}`;

  // HEADER
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorTema);
  doc.text(empresa.nombre, 105, 20, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(empresa.direccion, 105, 26, { align: 'center' });
  doc.text(`RUC: ${empresa.ruc}  |  Telf: ${empresa.telefono}`, 105, 31, { align: 'center' });

  // CUADRO RUC
  doc.setDrawColor(200);
  doc.roundedRect(140, 10, 60, 25, 2, 2);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`R.U.C. ${empresa.ruc}`, 170, 18, { align: 'center' });
  doc.setFillColor(...colorTema);
  doc.rect(140, 21, 60, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(tituloDoc, 170, 26, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.text(numeroComprobante, 170, 33, { align: 'center' });

  doc.setDrawColor(200);
  doc.line(10, 40, 200, 40);

  // DATOS CLIENTE
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("FECHA:", 15, 50);
  doc.text("CLIENTE:", 15, 56);
  if (tipoDocumento === 'FACTURA') doc.text("DIR:", 15, 62);

  doc.text("MONEDA:", 140, 50);
  doc.text(tipoDocumento === 'FACTURA' ? "RUC:" : "DNI:", 140, 56);

  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleString(), 55, 50);
  doc.text((cliente.nombre || "VARIOS").toUpperCase(), 55, 56);
  if (tipoDocumento === 'FACTURA') doc.text((cliente.direccion || "-").toUpperCase(), 55, 62);

  doc.text("SOLES", 160, 50);
  doc.text(cliente.doc || "-", 160, 56);

  // TABLA
  const columnas = ["Cant.", "Descripción", "P. Unit", "Total"];
  const filas = carrito.map(item => [
    item.cantidad,
    item.nombre,
    `S/ ${Number(item.precio).toFixed(2)}`,
    `S/ ${(Number(item.precio) * item.cantidad).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 70,
    head: [columnas],
    body: filas,
    theme: 'plain',
    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', lineColor: 200, lineWidth: 0.1 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { halign: 'center', width: 15 }, 2: { halign: 'right' }, 3: { halign: 'right' } }
  });

  // --- 4. TOTALES DETALLADOS (LA CALCULADORA) ---
  let finalY = doc.lastAutoTable.finalY + 5;
  const xLabels = 140;
  const xValues = 195;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  // Subtotal (Suma de precios)
  doc.text("SUBTOTAL:", xLabels, finalY + 5);
  doc.text(`S/ ${subtotal.toFixed(2)}`, xValues, finalY + 5, { align: 'right' });

  // Descuento (Si existe)
  if (descuento > 0) {
    doc.setTextColor(220, 38, 38); // Rojo para descuento
    doc.text("DESCUENTO (-):", xLabels, finalY + 10);
    doc.text(`S/ ${descuento.toFixed(2)}`, xValues, finalY + 10, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset color
    finalY += 5; // Empujar líneas abajo
  }

  // Operaciones
  doc.text("OP. GRAVADA:", xLabels, finalY + 10);
  doc.text(`S/ ${opGravada.toFixed(2)}`, xValues, finalY + 10, { align: 'right' });

  doc.text("I.G.V. (18%):", xLabels, finalY + 15);
  doc.text(`S/ ${igvTotal.toFixed(2)}`, xValues, finalY + 15, { align: 'right' });

  // Total Final
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL A PAGAR:", xLabels, finalY + 23);
  doc.text(`S/ ${totalPagar.toFixed(2)}`, xValues, finalY + 23, { align: 'right' });

  // Letras
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(numeroALetras(totalPagar), 15, finalY + 5);

  // QR
  const dataQR = `${empresa.ruc}|${tipoDocumento==='FACTURA'?'01':'03'}|${serie}|${idVenta}|${igvTotal.toFixed(2)}|${totalPagar.toFixed(2)}|${new Date().toLocaleDateString()}|6|${cliente.doc||'0'}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(dataQR);
    doc.addImage(qrDataUrl, 'PNG', 15, finalY + 10, 25, 25);
  } catch (err) {}

  doc.save(`${tituloDoc}_${serie}-${idVenta}.pdf`);
};
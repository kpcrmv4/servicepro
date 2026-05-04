import { Document, Image as PdfImage, Page, Text, View } from '@react-pdf/renderer';
import { styles, brandedStyles, formatTHB, formatDate, DEFAULT_PRIMARY } from './styles';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface InvoicePdfProps {
  shop: {
    name: string;
    address?: string | null;
    phone?: string | null;
    tax_id?: string | null;
    logo_url?: string | null;
    primary_color?: string | null;
  };
  invoice: {
    invoice_number: string;
    issue_date: string;
    due_date?: string | null;
    items: InvoiceItem[];
    subtotal: number;
    discount?: number;
    vat: number;
    total: number;
    notes?: string | null;
  };
  customer: {
    name: string;
    phone?: string | null;
    address?: string | null;
  };
  vehicle?: {
    license_plate?: string | null;
    brand?: string | null;
    model?: string | null;
  };
  jobNumber?: string | null;
}

export function InvoicePdf({ shop, invoice, customer, vehicle, jobNumber }: InvoicePdfProps) {
  const accent = shop.primary_color || DEFAULT_PRIMARY;
  const branded = brandedStyles(accent);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={branded.header}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            {shop.logo_url ? (
              <PdfImage
                src={shop.logo_url}
                style={{ width: 36, height: 36, objectFit: 'contain' }}
              />
            ) : null}
            <View>
              <Text style={branded.shopName}>{shop.name}</Text>
              {shop.address && <Text style={styles.meta}>{shop.address}</Text>}
              <Text style={styles.meta}>
                {shop.phone && `Tel: ${shop.phone}`}
                {shop.tax_id && `   Tax ID: ${shop.tax_id}`}
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.docType}>INVOICE / ใบแจ้งหนี้</Text>
            <Text style={styles.meta}>No: {invoice.invoice_number}</Text>
            <Text style={styles.meta}>Date: {formatDate(invoice.issue_date)}</Text>
            {invoice.due_date && <Text style={styles.meta}>Due: {formatDate(invoice.due_date)}</Text>}
          </View>
        </View>

        {/* Customer + Vehicle */}
        <View style={[styles.section, styles.row]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bold}>Bill To / ลูกค้า</Text>
            <Text>{customer.name}</Text>
            {customer.phone && <Text style={styles.meta}>{customer.phone}</Text>}
            {customer.address && <Text style={styles.meta}>{customer.address}</Text>}
          </View>
          {vehicle && (
            <View style={{ flex: 1 }}>
              <Text style={styles.bold}>Vehicle / รถ</Text>
              <Text>
                {vehicle.brand} {vehicle.model}
              </Text>
              <Text style={styles.meta}>License: {vehicle.license_plate || '-'}</Text>
              {jobNumber && <Text style={styles.meta}>Job: {jobNumber}</Text>}
            </View>
          )}
        </View>

        {/* Items */}
        <View style={styles.table}>
          <View style={styles.thead}>
            <Text style={styles.cellName}>Description / รายการ</Text>
            <Text style={styles.cellQty}>Qty</Text>
            <Text style={styles.cellPrice}>Unit Price</Text>
            <Text style={styles.cellTotal}>Total</Text>
          </View>
          {invoice.items.map((it, idx) => (
            <View style={styles.trow} key={idx}>
              <Text style={styles.cellName}>{it.description}</Text>
              <Text style={styles.cellQty}>{it.quantity}</Text>
              <Text style={styles.cellPrice}>{formatTHB(it.unit_price)}</Text>
              <Text style={styles.cellTotal}>{formatTHB(it.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{formatTHB(invoice.subtotal)}</Text>
          </View>
          {invoice.discount && invoice.discount > 0 && (
            <View style={styles.totalsRow}>
              <Text>Discount</Text>
              <Text>-{formatTHB(invoice.discount)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text>VAT</Text>
            <Text>{formatTHB(invoice.vat)}</Text>
          </View>
          <View style={branded.grandTotal}>
            <Text>Total / ยอดรวม</Text>
            <Text>THB {formatTHB(invoice.total)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={[styles.section, { marginTop: 16 }]}>
            <Text style={styles.bold}>Notes</Text>
            <Text style={styles.meta}>{invoice.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Generated by KPServicePro · {new Date().toISOString().slice(0, 10)}
        </Text>
      </Page>
    </Document>
  );
}

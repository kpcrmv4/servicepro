import { Document, Image as PdfImage, Page, Text, View } from '@react-pdf/renderer';
import { styles, brandedStyles, formatTHB, formatDate, DEFAULT_PRIMARY } from './styles';

export interface QuotationPdfProps {
  shop: {
    name: string;
    address?: string | null;
    phone?: string | null;
    tax_id?: string | null;
    logo_url?: string | null;
    primary_color?: string | null;
  };
  quotation: {
    quotation_number: string;
    issue_date: string;
    valid_until?: string | null;
    items: Array<{
      type: 'part' | 'labor' | 'other' | string;
      description: string;
      quantity: number;
      unit_price: number;
      discount?: number;
    }>;
    subtotal: number;
    vat: number;
    total: number;
    notes?: string | null;
  };
  customer: { name: string; phone?: string | null };
  vehicle?: {
    license_plate?: string | null;
    brand?: string | null;
    model?: string | null;
  };
}

export function QuotationPdf({ shop, quotation, customer, vehicle }: QuotationPdfProps) {
  const accent = shop.primary_color || DEFAULT_PRIMARY;
  const branded = brandedStyles(accent);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={branded.header}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            {shop.logo_url ? (
              <PdfImage src={shop.logo_url} style={{ width: 36, height: 36, objectFit: 'contain' }} />
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
            <Text style={styles.docType}>QUOTATION / ใบเสนอราคา</Text>
            <Text style={styles.meta}>No: {quotation.quotation_number}</Text>
            <Text style={styles.meta}>Date: {formatDate(quotation.issue_date)}</Text>
            {quotation.valid_until && (
              <Text style={styles.meta}>Valid until: {formatDate(quotation.valid_until)}</Text>
            )}
          </View>
        </View>

        <View style={[styles.section, styles.row]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bold}>Customer / ลูกค้า</Text>
            <Text>{customer.name}</Text>
            {customer.phone && <Text style={styles.meta}>{customer.phone}</Text>}
          </View>
          {vehicle && (
            <View style={{ flex: 1 }}>
              <Text style={styles.bold}>Vehicle / รถ</Text>
              <Text>
                {vehicle.brand} {vehicle.model}
              </Text>
              <Text style={styles.meta}>License: {vehicle.license_plate || '-'}</Text>
            </View>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.thead}>
            <Text style={[styles.cellName, { width: '15%', flex: 0 }]}>Type</Text>
            <Text style={styles.cellName}>Description</Text>
            <Text style={styles.cellQty}>Qty</Text>
            <Text style={styles.cellPrice}>Unit</Text>
            <Text style={styles.cellTotal}>Total</Text>
          </View>
          {quotation.items.map((it, idx) => {
            const lineTotal = it.quantity * it.unit_price - (it.discount || 0);
            return (
              <View style={styles.trow} key={idx}>
                <Text style={[styles.cellName, { width: '15%', flex: 0 }]}>
                  {it.type === 'part' ? 'Part' : it.type === 'labor' ? 'Labor' : 'Other'}
                </Text>
                <Text style={styles.cellName}>{it.description}</Text>
                <Text style={styles.cellQty}>{it.quantity}</Text>
                <Text style={styles.cellPrice}>{formatTHB(it.unit_price)}</Text>
                <Text style={styles.cellTotal}>{formatTHB(lineTotal)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{formatTHB(quotation.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>VAT 7%</Text>
            <Text>{formatTHB(quotation.vat)}</Text>
          </View>
          <View style={branded.grandTotal}>
            <Text>Total / ยอดรวม</Text>
            <Text>THB {formatTHB(quotation.total)}</Text>
          </View>
        </View>

        {quotation.notes && (
          <View style={[styles.section, { marginTop: 16 }]}>
            <Text style={styles.bold}>Terms & Conditions</Text>
            <Text style={styles.meta}>{quotation.notes}</Text>
          </View>
        )}

        <View style={[styles.section, { marginTop: 32 }]}>
          <View style={styles.row}>
            <View style={{ width: '40%' }}>
              <Text style={styles.meta}>Customer Signature</Text>
              <Text style={{ marginTop: 30, borderTopWidth: 0.5, borderColor: '#94a3b8' }}>
                Date: __________________
              </Text>
            </View>
            <View style={{ width: '40%' }}>
              <Text style={styles.meta}>Authorized By</Text>
              <Text style={{ marginTop: 30, borderTopWidth: 0.5, borderColor: '#94a3b8' }}>
                {shop.name}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated by KPServicePro · {new Date().toISOString().slice(0, 10)}
        </Text>
      </Page>
    </Document>
  );
}

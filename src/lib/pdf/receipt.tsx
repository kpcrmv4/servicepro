import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles, formatTHB, formatDate } from './styles';

export interface ReceiptPdfProps {
  shop: {
    name: string;
    address?: string | null;
    phone?: string | null;
    tax_id?: string | null;
  };
  receipt: {
    receipt_number: string;
    issue_date: string;
    invoice_number?: string | null;
    amount: number;
    payment_method: string;
    reference?: string | null;
    notes?: string | null;
  };
  customer: {
    name: string;
    phone?: string | null;
  };
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  transfer: 'Bank Transfer',
  promptpay: 'PromptPay',
  credit_card: 'Credit Card',
};

export function ReceiptPdf({ shop, receipt, customer }: ReceiptPdfProps) {
  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>{shop.name}</Text>
            {shop.address && <Text style={styles.meta}>{shop.address}</Text>}
            <Text style={styles.meta}>
              {shop.phone && `Tel: ${shop.phone}`}
              {shop.tax_id && `   Tax ID: ${shop.tax_id}`}
            </Text>
          </View>
          <View>
            <Text style={styles.docType}>RECEIPT / ใบเสร็จ</Text>
            <Text style={styles.meta}>No: {receipt.receipt_number}</Text>
            <Text style={styles.meta}>Date: {formatDate(receipt.issue_date)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>Received From / รับจาก</Text>
          <Text>{customer.name}</Text>
          {customer.phone && <Text style={styles.meta}>{customer.phone}</Text>}
        </View>

        {receipt.invoice_number && (
          <View style={styles.section}>
            <Text style={styles.meta}>For Invoice: {receipt.invoice_number}</Text>
          </View>
        )}

        <View
          style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: '#f1f5f9',
            borderRadius: 4,
          }}
        >
          <View style={styles.row}>
            <Text style={styles.bold}>Payment Method</Text>
            <Text>{METHOD_LABELS[receipt.payment_method] || receipt.payment_method}</Text>
          </View>
          {receipt.reference && (
            <View style={styles.row}>
              <Text style={styles.bold}>Reference</Text>
              <Text>{receipt.reference}</Text>
            </View>
          )}
          <View style={[styles.row, { marginTop: 8 }]}>
            <Text style={[styles.bold, { fontSize: 14 }]}>Amount Received</Text>
            <Text style={[styles.bold, { fontSize: 14, color: '#1e40af' }]}>
              THB {formatTHB(receipt.amount)}
            </Text>
          </View>
        </View>

        {receipt.notes && (
          <View style={styles.section}>
            <Text style={styles.meta}>{receipt.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>Thank you for your business · ขอบคุณที่ใช้บริการ</Text>
      </Page>
    </Document>
  );
}

import { StyleSheet } from '@react-pdf/renderer';

/**
 * Shared PDF styles. The accent color (header underline, totals,
 * footer) is themable per-tenant via brandedStyles(primaryColor).
 *
 * We rely on @react-pdf/renderer's default Helvetica to avoid
 * bundling Thai fonts (which are large). Thai text renders correctly
 * when the Helvetica fallback hits the system Thai stack on the
 * platform that opens the PDF; in production you can register
 * Sarabun / Noto Sans Thai with `Font.register({...})`.
 */
export const DEFAULT_PRIMARY = '#7C5BFB';

export const brandedStyles = (primaryColor = DEFAULT_PRIMARY) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: primaryColor,
      paddingBottom: 6,
    },
    shopName: {
      fontSize: 14,
      fontWeight: 700,
      color: primaryColor,
    },
    grandTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderTopWidth: 1,
      borderColor: primaryColor,
      marginTop: 4,
      fontSize: 12,
      fontWeight: 700,
      color: primaryColor,
    },
  });

export const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    paddingBottom: 6,
  },
  shopName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1e40af',
  },
  docType: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
  },
  meta: {
    fontSize: 9,
    color: '#64748b',
  },
  section: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bold: {
    fontWeight: 700,
  },
  table: {
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: '#cbd5e1',
  },
  thead: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontWeight: 700,
    fontSize: 9,
  },
  trow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  cellQty: {
    width: '12%',
    textAlign: 'right',
  },
  cellPrice: {
    width: '18%',
    textAlign: 'right',
  },
  cellTotal: {
    width: '20%',
    textAlign: 'right',
    fontWeight: 700,
  },
  cellName: {
    flex: 1,
  },
  totals: {
    marginTop: 12,
    alignSelf: 'flex-end',
    width: '50%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: '#1e40af',
    marginTop: 4,
    fontSize: 12,
    fontWeight: 700,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export function formatTHB(n: number | string | null | undefined): string {
  const num = Number(n) || 0;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

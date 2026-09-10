"""Professional Macro Fundamental Report Exporter (PDF, CSV, JSON)."""

import io
import csv
import json
from datetime import datetime, timezone
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


class ReportExporter:
    """Exports institutional macro reports in PDF, CSV, and JSON formats."""

    @staticmethod
    def generate_pdf_report(report_type: str, data: Dict[str, Any]) -> bytes:
        """Generate formatted PDF report buffer."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=12
        )
        subtitle_style = ParagraphStyle(
            "DocSub",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=16
        )
        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )

        elements = []
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        elements.append(Paragraph(f"FORTUNE ANUKPOSI QUANTITATIVE MACRO TERMINAL", title_style))
        elements.append(Paragraph(f"REPORT: {report_type.upper()} | GENERATED: {now_str} | CLASSIFICATION: INSTITUTIONAL RESEARCH", subtitle_style))
        elements.append(Spacer(1, 10))

        # Regime Banner
        regime = data.get("regime", {})
        elements.append(Paragraph(f"<b>Current Macro Regime:</b> {regime.get('primary_regime', 'Disinflationary Slowdown')}", body_style))
        elements.append(Paragraph(f"{regime.get('summary', '')}", body_style))
        elements.append(Spacer(1, 15))

        # Asset Table
        assets = data.get("assets", [])
        if assets:
            elements.append(Paragraph("<b>Covered Global Trading Assets Overview</b>", styles["Heading2"]))
            table_data = [["Symbol", "Asset Class", "Macro Score", "Tactical Bias", "Confidence", "Primary Driver"]]
            for a in assets[:15]:
                table_data.append([
                    a.get("symbol", ""),
                    a.get("asset_class", ""),
                    f"{a.get('score', 0.0):+.1f}",
                    a.get("tactical_bias", ""),
                    f"{a.get('confidence', 0.0):.0f}%",
                    Paragraph(a.get("primary_driver", "")[:50] + "...", body_style)
                ])

            t = Table(table_data, colWidths=[65, 65, 65, 85, 60, 200])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 20))

        # Copyright & Disclaimer
        copyright_text = (
            f"<b>© {datetime.now(timezone.utc).year} Fortune Anukposi. All rights reserved.</b> "
            "Fortune Anukposi Quantitative Macro Fundamental Intelligence Terminal. "
            "Fundamental bias is an analytical output derived from quantitative macroeconomic factor scoring. "
            "Strictly for institutional research."
        )
        elements.append(Paragraph(copyright_text, subtitle_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_csv_report(assets: List[Dict[str, Any]]) -> str:
        """Generate CSV string of macro biases and factor scores."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Symbol", "Asset Class", "Price", "Daily Change %",
            "Macro Score", "Weekly Score", "Tactical Bias", "Weekly Bias",
            "Confidence %", "Primary Driver", "Updated At"
        ])
        for a in assets:
            writer.writerow([
                a.get("symbol"),
                a.get("asset_class"),
                a.get("current_price"),
                a.get("daily_change_pct"),
                a.get("score"),
                a.get("weekly_score"),
                a.get("tactical_bias"),
                a.get("weekly_bias"),
                a.get("confidence"),
                a.get("primary_driver"),
                datetime.now(timezone.utc).isoformat()
            ])
        return output.getvalue()

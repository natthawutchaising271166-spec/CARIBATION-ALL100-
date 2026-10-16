with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''      // Row 1: Format code (A1) and Retention (L1-M1)
      const row1 = worksheet.getRow(1);
      row1.height = 20;
      row1.getCell(1).value = formatCode;
      row1.getCell(1).font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      const cellRetention = row1.getCell(11);
      cellRetention.value = "Retention";
      cellRetention.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      cellRetention.alignment = { vertical: 'middle', horizontal: 'center' };
      cellRetention.border = solidBlackBorder;
      worksheet.mergeCells('L1:M1');
      const cellYear = row1.getCell(12);
      cellYear.value = retention;
      cellYear.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      cellYear.alignment = { vertical: 'middle', horizontal: 'center' };
      row1.getCell(12).border = solidBlackBorder;
      row1.getCell(13).border = solidBlackBorder;
      // Row 2: Title (A2:H2) and Company (I2:M2)
      const row2 = worksheet.getRow(2);
      row2.height = 32;
      worksheet.mergeCells('A2:H2');
      const cellTitle = row2.getCell(1);
      cellTitle.value = titleText;
      cellTitle.font = {
        name: 'Courier New',
        size: 17,
        bold: true,
        underline: true,
        color: { argb: 'FF0000FF' }
      };
      cellTitle.alignment = { vertical: 'middle', horizontal: 'left' };
      worksheet.mergeCells('I2:M2');
      const cellCompany = row2.getCell(9);
      cellCompany.value = company;
      cellCompany.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF000000' } };
      cellCompany.alignment = { vertical: 'middle', horizontal: 'left' };
      // Row 3: Issue date
      const row3 = worksheet.getRow(3);
      row3.height = 18;
      worksheet.mergeCells('I3:J3');
      const cellIssueLbl = row3.getCell(9);
      cellIssueLbl.value = "Issue date  :";
      cellIssueLbl.font = { name: 'Courier New', size: 10.5, bold: true, color: { argb: 'FF0000FF' } };
      cellIssueLbl.alignment = { vertical: 'middle', horizontal: 'right' };
      worksheet.mergeCells('K3:M3');
      const cellIssueVal = row3.getCell(11);
      cellIssueVal.value = issueDateStr;
      cellIssueVal.font = { name: 'Courier New', size: 10.5, bold: true, underline: 'single', color: { argb: 'FF0000FF' } };
      cellIssueVal.alignment = { vertical: 'middle', horizontal: 'left' };
      // Row 4: Prepared by
      const row4 = worksheet.getRow(4);
      row4.height = 18;
      worksheet.mergeCells('I4:J4');
      const cellPrepLbl = row4.getCell(9);
      cellPrepLbl.value = "Prepared by :";
      cellPrepLbl.font = { name: 'Courier New', size: 10.5, bold: true, color: { argb: 'FF0000FF' } };
      cellPrepLbl.alignment = { vertical: 'middle', horizontal: 'right' };
      worksheet.mergeCells('K4:M4');
      const cellPrepVal = row4.getCell(11);
      cellPrepVal.value = preparedBy;
      cellPrepVal.font = { name: 'Courier New', size: 10.5, bold: true, underline: 'single', color: { argb: 'FF0000FF' } };
      cellPrepVal.alignment = { vertical: 'middle', horizontal: 'left' };
      // Row 5: Approve by
      const row5 = worksheet.getRow(5);
      row5.height = 18;
      worksheet.mergeCells('I5:J5');
      const cellApprLbl = row5.getCell(9);
      cellApprLbl.value = "Approve by  :";
      cellApprLbl.font = { name: 'Courier New', size: 10.5, bold: true, color: { argb: 'FF0000FF' } };
      cellApprLbl.alignment = { vertical: 'middle', horizontal: 'right' };
      worksheet.mergeCells('K5:M5');
      const cellApprVal = row5.getCell(11);
      cellApprVal.value = approveBy;
      cellApprVal.font = { name: 'Courier New', size: 10.5, bold: true, underline: 'single', color: { argb: 'FF0000FF' } };
      cellApprVal.alignment = { vertical: 'middle', horizontal: 'left' };
      // Row 6: Empty spacer
      const row6 = worksheet.getRow(6);
      row6.height = 10;'''

replacement = '''      // Row 1: Format code (A1) and Retention (K1, L1:M1) starting at K up to M
      const row1 = worksheet.getRow(1);
      row1.height = 22;
      row1.getCell(1).value = formatCode;
      row1.getCell(1).font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      const cellRetention = row1.getCell(11);
      cellRetention.value = "Retention";
      cellRetention.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      cellRetention.alignment = { vertical: 'middle', horizontal: 'center' };
      cellRetention.border = solidBlackBorder;
      worksheet.mergeCells('L1:M1');
      const cellYear = row1.getCell(12);
      cellYear.value = retention;
      cellYear.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      cellYear.alignment = { vertical: 'middle', horizontal: 'center' };
      row1.getCell(12).border = solidBlackBorder;
      row1.getCell(13).border = solidBlackBorder;
      // Row 2: Title (A2:H2) and Company (K2:M2)
      const row2 = worksheet.getRow(2);
      row2.height = 28;
      worksheet.mergeCells('A2:H2');
      const cellTitle = row2.getCell(1);
      cellTitle.value = titleText;
      cellTitle.font = {
        name: 'Courier New',
        size: 16,
        bold: true,
        underline: true,
        color: { argb: 'FF0000FF' }
      };
      cellTitle.alignment = { vertical: 'middle', horizontal: 'left' };
      worksheet.mergeCells('K2:M2');
      const cellCompany = row2.getCell(11);
      cellCompany.value = company;
      cellCompany.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };
      cellCompany.alignment = { vertical: 'middle', horizontal: 'left' };
      // Row 3: Issue date (Label at K3, Value at L3:M3)
      const row3 = worksheet.getRow(3);
      row3.height = 20;
      const cellIssueLbl = row3.getCell(11);
      cellIssueLbl.value = "Issue date  :";
      cellIssueLbl.font = { name: 'Courier New', size: 10.5, bold: true, color: { argb: 'FF0000FF' } };
      cellIssueLbl.alignment = { vertical: 'middle', horizontal: 'right' };
      worksheet.mergeCells('L3:M3');
      const cellIssueVal = row3.getCell(12);
      cellIssueVal.value = issueDateStr;
      cellIssueVal.font = { name: 'Courier New', size: 10.5, bold: true, underline: 'single', color: { argb: 'FF0000FF' } };
      cellIssueVal.alignment = { vertical: 'middle', horizontal: 'left' };
      // Row 4: Prepared by (Label at K4, Value at L4:M4)
      const row4 = worksheet.getRow(4);
      row4.height = 20;
      const cellPrepLbl = row4.getCell(11);
      cellPrepLbl.value = "Prepared by :";
      cellPrepLbl.font = { name: 'Courier New', size: 10.5, bold: true, color: { argb: 'FF0000FF' } };
      cellPrepLbl.alignment = { vertical: 'middle', horizontal: 'right' };
      worksheet.mergeCells('L4:M4');
      const cellPrepVal = row4.getCell(12);
      cellPrepVal.value = preparedBy;
      cellPrepVal.font = { name: 'Courier New', size: 10.5, bold: true, underline: 'single', color: { argb: 'FF0000FF' } };
      cellPrepVal.alignment = { vertical: 'middle', horizontal: 'left' };
      // Row 5: Approve by (Label at K5, Value at L5:M5)
      const row5 = worksheet.getRow(5);
      row5.height = 20;
      const cellApprLbl = row5.getCell(11);
      cellApprLbl.value = "Approve by  :";
      cellApprLbl.font = { name: 'Courier New', size: 10.5, bold: true, color: { argb: 'FF0000FF' } };
      cellApprLbl.alignment = { vertical: 'middle', horizontal: 'right' };
      worksheet.mergeCells('L5:M5');
      const cellApprVal = row5.getCell(12);
      cellApprVal.value = approveBy;
      cellApprVal.font = { name: 'Courier New', size: 10.5, bold: true, underline: 'single', color: { argb: 'FF0000FF' } };
      cellApprVal.alignment = { vertical: 'middle', horizontal: 'left' };
      // Row 6: Empty spacer
      const row6 = worksheet.getRow(6);
      row6.height = 10;'''

if target in text:
    text = text.replace(target, replacement)
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Successfully updated exportExcelWithExactFormat in app.js")
else:
    print("Target not found in app.js")

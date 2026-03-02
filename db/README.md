# CIPS Certification MS SQL Schema

This folder provides a Microsoft SQL Server script for the CIPS Certification Application Process shown in the supplied workflow image.

## File

- `cips_certification_mssql.sql`: creates database `CIPS_Certification`, core workflow tables, constraints, indexes, one reporting view, and one status transition stored procedure.

## Run

```sql
:r .\db\cips_certification_mssql.sql
```

or execute the script in SQL Server Management Studio (SSMS).

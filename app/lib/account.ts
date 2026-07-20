export function isCompanyAccount(userData: any): boolean {
  const companyCode = userData?.companyCode

  return (
    userData?.accountType === "company" ||
    (typeof companyCode === "string" && companyCode.trim().length > 0) ||
    userData?.billing?.accountType === "company" ||
    userData?.billing?.method === "company_contract"
  )
}

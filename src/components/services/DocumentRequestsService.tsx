import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Upload, Loader2, Truck } from "lucide-react";
import { openEmailRequest } from "@/lib/email";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GCashPayment, SERVICE_FEES } from "@/components/GCashPayment";
import { createNotification } from "@/services/notifications";
import { generateOrderId } from "@/lib/utils";

export const DocumentRequestsService = () => {
  const [documentType, setDocumentType] = useState("birth-certificate");
  const [fullName, setFullName] = useState("");
  const [dateRef, setDateRef] = useState("");
  const [placeOfRegistration, setPlaceOfRegistration] = useState("");
  const [relationship, setRelationship] = useState("");
  const [purpose, setPurpose] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [validId, setValidId] = useState<File | null>(null);
  const [authLetter, setAuthLetter] = useState<File | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [delRecipient, setDelRecipient] = useState("");
  const [delPhone, setDelPhone] = useState("");
  const [delHouseNo, setDelHouseNo] = useState("");
  const [delStreet, setDelStreet] = useState("");
  const [delBarangay, setDelBarangay] = useState("");
  const [delCity, setDelCity] = useState("");
  const [delProvince, setDelProvince] = useState("");
  const [delPostalCode, setDelPostalCode] = useState("");
  const [delLandmark, setDelLandmark] = useState("");

  // Birth certificate specific fields
  const [bcFirstName, setBcFirstName] = useState("");
  const [bcMiddleName, setBcMiddleName] = useState("");
  const [bcLastName, setBcLastName] = useState("");
  const [bcDobMonth, setBcDobMonth] = useState("");
  const [bcDobDay, setBcDobDay] = useState("");
  const [bcDobYear, setBcDobYear] = useState("");
  const [bcBirthCity, setBcBirthCity] = useState("");
  const [bcBirthProvince, setBcBirthProvince] = useState("");
  const [bcFatherName, setBcFatherName] = useState("");
  const [bcMotherMaidenName, setBcMotherMaidenName] = useState("");
  const [bcPurpose, setBcPurpose] = useState("");

  // Marriage certificate specific fields
  const [mcHusbandFirst, setMcHusbandFirst] = useState("");
  const [mcHusbandMiddle, setMcHusbandMiddle] = useState("");
  const [mcHusbandLast, setMcHusbandLast] = useState("");
  const [mcWifeMaidenName, setMcWifeMaidenName] = useState("");
  const [mcDateMonth, setMcDateMonth] = useState("");
  const [mcDateDay, setMcDateDay] = useState("");
  const [mcDateYear, setMcDateYear] = useState("");
  const [mcPlaceCity, setMcPlaceCity] = useState("");
  const [mcPlaceProvince, setMcPlaceProvince] = useState("");
  const [mcPurpose, setMcPurpose] = useState("");

  // Death certificate specific fields
  const [dcFirstName, setDcFirstName] = useState("");
  const [dcMiddleName, setDcMiddleName] = useState("");
  const [dcLastName, setDcLastName] = useState("");
  const [dcDeathMonth, setDcDeathMonth] = useState("");
  const [dcDeathDay, setDcDeathDay] = useState("");
  const [dcDeathYear, setDcDeathYear] = useState("");
  const [dcPlaceOfDeath, setDcPlaceOfDeath] = useState("");
  const [dcPlaceCity, setDcPlaceCity] = useState("");
  const [dcPlaceProvince, setDcPlaceProvince] = useState("");
  const [dcDateOfBirth, setDcDateOfBirth] = useState("");
  const [dcCivilStatus, setDcCivilStatus] = useState("");
  const [dcPurpose, setDcPurpose] = useState("");

  // Certificate of Residency specific fields
  const [rcFirstName, setRcFirstName] = useState("");
  const [rcMiddleName, setRcMiddleName] = useState("");
  const [rcLastName, setRcLastName] = useState("");
  const [rcHouseNo, setRcHouseNo] = useState("");
  const [rcStreet, setRcStreet] = useState("");
  const [rcBarangay, setRcBarangay] = useState("");
  const [rcCityMunicipality, setRcCityMunicipality] = useState("");
  const [rcLengthOfStay, setRcLengthOfStay] = useState("");
  const [rcPurpose, setRcPurpose] = useState("");
  const [rcUtilityBill, setRcUtilityBill] = useState<File | null>(null);
  const [rcLeaseContract, setRcLeaseContract] = useState<File | null>(null);
  const [rcBarangayId, setRcBarangayId] = useState<File | null>(null);
  const [rcCedula, setRcCedula] = useState<File | null>(null);

  // Cedula (Community Tax Certificate) specific fields
  const [cdFirstName, setCdFirstName] = useState("");
  const [cdMiddleName, setCdMiddleName] = useState("");
  const [cdLastName, setCdLastName] = useState("");
  const [cdAddress, setCdAddress] = useState("");
  const [cdDobMonth, setCdDobMonth] = useState("");
  const [cdDobDay, setCdDobDay] = useState("");
  const [cdDobYear, setCdDobYear] = useState("");
  const [cdBirthPlace, setCdBirthPlace] = useState("");
  const [cdCivilStatus, setCdCivilStatus] = useState("");
  const [cdOccupation, setCdOccupation] = useState("");
  const [cdTin, setCdTin] = useState("");
  const [cdAnnualIncome, setCdAnnualIncome] = useState("");
  const [cdIsBusinessOwner, setCdIsBusinessOwner] = useState(false);
  const [cdBusinessName, setCdBusinessName] = useState("");
  const [cdBusinessAddress, setCdBusinessAddress] = useState("");
  const [cdBusinessCapitalization, setCdBusinessCapitalization] = useState("");

  const isBirthCert = documentType === "birth-certificate";
  const isMarriageCert = documentType === "marriage-certificate";
  const isDeathCert = documentType === "death-certificate";
  const isResidenceCert = documentType === "residence-certificate";
  const isCedula = documentType === "cedula";
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const navigate = useNavigate();

  const getDateLabel = (type: string) => {
    if (type === "marriage-certificate") return "Date of Marriage";
    if (type === "death-certificate") return "Date of Death";
    return "Date of Birth";
  };

  const showDateField = (type: string) =>
    ["birth-certificate", "marriage-certificate", "death-certificate"].includes(type);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setEmail(session.user.email);
    });
  }, []);

  /** Upload a file to Supabase Storage and return its public URL */
  const uploadFile = async (file: File, userId: string, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: false });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    return data?.publicUrl ?? null;
  };

  const handleSubmit = async () => {
    if (!documentType || !deliveryMethod || !contactNumber || !email) {
      toast.error("Please fill in all required fields including delivery method");
      return;
    }

    if (isBirthCert) {
      if (!bcFirstName || !bcLastName || !bcDobMonth || !bcDobDay || !bcDobYear || !bcBirthCity || !bcBirthProvince || !bcPurpose) {
        toast.error("Please fill in all required fields for the birth certificate");
        return;
      }
    } else if (isMarriageCert) {
      if (!mcHusbandFirst || !mcHusbandLast || !mcWifeMaidenName || !mcDateMonth || !mcDateDay || !mcDateYear || !mcPlaceCity || !mcPlaceProvince || !mcPurpose) {
        toast.error("Please fill in all required fields for the marriage certificate");
        return;
      }
    } else if (isDeathCert) {
      if (!dcFirstName || !dcLastName || !dcDeathMonth || !dcDeathDay || !dcDeathYear || !dcPlaceCity || !dcPlaceProvince || !dcPurpose) {
        toast.error("Please fill in all required fields for the death certificate");
        return;
      }
    } else if (isResidenceCert) {
      if (!rcFirstName || !rcLastName || !rcHouseNo || !rcBarangay || !rcCityMunicipality || !rcLengthOfStay || !rcPurpose) {
        toast.error("Please fill in all required fields for the Certificate of Residency");
        return;
      }
    } else if (isCedula) {
      if (!cdFirstName || !cdLastName || !cdAddress || !cdDobMonth || !cdDobDay || !cdDobYear || !cdCivilStatus || !cdOccupation || !cdAnnualIncome) {
        toast.error("Please fill in all required fields for the Cedula");
        return;
      }
    } else {
      if (!fullName || !purpose) {
        toast.error("Please fill in all required fields");
        return;
      }
    }

    if (deliveryMethod === "home-delivery" && (!delRecipient || !delPhone || !delHouseNo || !delBarangay || !delCity || !delProvince)) {
      toast.error("Please fill in all required delivery address fields");
      return;
    }

    const deliveryAddress = deliveryMethod === "home-delivery"
      ? `${delRecipient} | ${delPhone}\n${delHouseNo}${delStreet ? ", " + delStreet : ""}, ${delBarangay}, ${delCity}, ${delProvince}${delPostalCode ? " " + delPostalCode : ""}${delLandmark ? " (" + delLandmark + ")" : ""}`
      : "";

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    try {
      // Upload all attached files to Supabase Storage
      const uid = session.user.id;
      const validIdUrl = validId ? await uploadFile(validId, uid, "valid-id") : null;
      const authLetterUrl = authLetter ? await uploadFile(authLetter, uid, "auth-letter") : null;
      const rcUtilityBillUrl = rcUtilityBill ? await uploadFile(rcUtilityBill, uid, "proof-residency") : null;
      const rcLeaseContractUrl = rcLeaseContract ? await uploadFile(rcLeaseContract, uid, "proof-residency") : null;
      const rcBarangayIdUrl = rcBarangayId ? await uploadFile(rcBarangayId, uid, "proof-residency") : null;
      const rcCedulaUrl = rcCedula ? await uploadFile(rcCedula, uid, "proof-residency") : null;

      const description = isBirthCert
        ? [
            `Full Name: ${bcFirstName} ${bcMiddleName ? bcMiddleName + " " : ""}${bcLastName}`,
            `First Name: ${bcFirstName}`,
            `Middle Name: ${bcMiddleName || "N/A"}`,
            `Last Name: ${bcLastName}`,
            `Date of Birth: ${bcDobMonth}/${bcDobDay}/${bcDobYear}`,
            `Place of Birth: ${bcBirthCity}, ${bcBirthProvince}`,
            `Full Name of Father: ${bcFatherName || "N/A"}`,
            `Full Maiden Name of Mother: ${bcMotherMaidenName || "N/A"}`,
            `Purpose of Request: ${bcPurpose}`,
            `Contact Number: ${contactNumber}`,
            `Email Address: ${email}`,
            validIdUrl ? `Valid ID: [photo]${validIdUrl}` : validId ? `Valid ID: ${validId.name}` : "",
            authLetterUrl ? `Authorization Letter: [photo]${authLetterUrl}` : authLetter ? `Authorization Letter: ${authLetter.name}` : "",
            `Delivery Method: ${deliveryMethod === "home-delivery" ? "Home Delivery" : "Pickup at City Hall"}`,
            deliveryMethod === "home-delivery" ? `Delivery Address: ${deliveryAddress}` : "",
          ].filter(Boolean).join("\n\n")
        : isMarriageCert
        ? [
            `Full Name of Husband: ${mcHusbandFirst} ${mcHusbandMiddle ? mcHusbandMiddle + " " : ""}${mcHusbandLast}`,
            `Husband First Name: ${mcHusbandFirst}`,
            `Husband Middle Name: ${mcHusbandMiddle || "N/A"}`,
            `Husband Last Name: ${mcHusbandLast}`,
            `Full Maiden Name of Wife: ${mcWifeMaidenName}`,
            `Date of Marriage: ${mcDateMonth}/${mcDateDay}/${mcDateYear}`,
            `Place of Marriage: ${mcPlaceCity}, ${mcPlaceProvince}`,
            `Purpose of Request: ${mcPurpose}`,
            `Contact Number: ${contactNumber}`,
            `Email Address: ${email}`,
            validIdUrl ? `Valid ID: [photo]${validIdUrl}` : validId ? `Valid ID: ${validId.name}` : "",
            authLetterUrl ? `Authorization Letter: [photo]${authLetterUrl}` : authLetter ? `Authorization Letter: ${authLetter.name}` : "",
            `Delivery Method: ${deliveryMethod === "home-delivery" ? "Home Delivery" : "Pickup at City Hall"}`,
            deliveryMethod === "home-delivery" ? `Delivery Address: ${deliveryAddress}` : "",
          ].filter(Boolean).join("\n\n")
        : isDeathCert
        ? [
            `Full Name of Deceased: ${dcFirstName} ${dcMiddleName ? dcMiddleName + " " : ""}${dcLastName}`,
            `First Name: ${dcFirstName}`,
            `Middle Name: ${dcMiddleName || "N/A"}`,
            `Last Name: ${dcLastName}`,
            `Date of Death: ${dcDeathMonth}/${dcDeathDay}/${dcDeathYear}`,
            `Place of Death: ${dcPlaceOfDeath || "N/A"}, ${dcPlaceCity}, ${dcPlaceProvince}`,
            dcDateOfBirth ? `Date of Birth: ${dcDateOfBirth}` : "",
            dcCivilStatus ? `Civil Status: ${dcCivilStatus}` : "",
            `Purpose of Request: ${dcPurpose}`,
            `Contact Number: ${contactNumber}`,
            `Email Address: ${email}`,
            validIdUrl ? `Valid ID: [photo]${validIdUrl}` : validId ? `Valid ID: ${validId.name}` : "",
            authLetterUrl ? `Authorization Letter: [photo]${authLetterUrl}` : authLetter ? `Authorization Letter: ${authLetter.name}` : "",
            `Delivery Method: ${deliveryMethod === "home-delivery" ? "Home Delivery" : "Pickup at City Hall"}`,
            deliveryMethod === "home-delivery" ? `Delivery Address: ${deliveryAddress}` : "",
          ].filter(Boolean).join("\n\n")
        : isCedula
        ? [
            `Full Name: ${cdFirstName} ${cdMiddleName ? cdMiddleName + " " : ""}${cdLastName}`,
            `First Name: ${cdFirstName}`,
            `Middle Name: ${cdMiddleName || "N/A"}`,
            `Last Name: ${cdLastName}`,
            `Address: ${cdAddress}`,
            `Date of Birth: ${cdDobMonth}/${cdDobDay}/${cdDobYear}`,
            `Place of Birth: ${cdBirthPlace}`,
            `Civil Status: ${cdCivilStatus}`,
            `Occupation / Profession: ${cdOccupation}`,
            cdTin ? `TIN: ${cdTin}` : "",
            `Annual Income: ₱${cdAnnualIncome}`,
            cdIsBusinessOwner ? `Business Owner: Yes` : "",
            cdIsBusinessOwner && cdBusinessName ? `Business Name: ${cdBusinessName}` : "",
            cdIsBusinessOwner && cdBusinessAddress ? `Business Address: ${cdBusinessAddress}` : "",
            cdIsBusinessOwner && cdBusinessCapitalization ? `Business Capitalization: ₱${cdBusinessCapitalization}` : "",
            `Contact Number: ${contactNumber}`,
            `Email Address: ${email}`,
            validIdUrl ? `Valid ID: [photo]${validIdUrl}` : validId ? `Valid ID: ${validId.name}` : "",
            authLetterUrl ? `Authorization Letter: [photo]${authLetterUrl}` : authLetter ? `Authorization Letter: ${authLetter.name}` : "",
            `Delivery Method: ${deliveryMethod === "home-delivery" ? "Home Delivery" : "Pickup at City Hall"}`,
            deliveryMethod === "home-delivery" ? `Delivery Address: ${deliveryAddress}` : "",
          ].filter(Boolean).join("\n\n")
        : isResidenceCert
        ? [
            `Full Name: ${rcFirstName} ${rcMiddleName ? rcMiddleName + " " : ""}${rcLastName}`,
            `First Name: ${rcFirstName}`,
            `Middle Name: ${rcMiddleName || "N/A"}`,
            `Last Name: ${rcLastName}`,
            `Complete Address: ${rcHouseNo} ${rcStreet ? rcStreet + ", " : ""}${rcBarangay}, ${rcCityMunicipality}`,
            `House No.: ${rcHouseNo}`,
            rcStreet ? `Street: ${rcStreet}` : "",
            `Barangay: ${rcBarangay}`,
            `City/Municipality: ${rcCityMunicipality}`,
            `Length of Stay: ${rcLengthOfStay}`,
            `Purpose of Request: ${rcPurpose}`,
            `Contact Number: ${contactNumber}`,
            `Email Address: ${email}`,
            validIdUrl ? `Valid ID: [photo]${validIdUrl}` : validId ? `Valid ID: ${validId.name}` : "",
            rcUtilityBillUrl ? `Utility Bill: [photo]${rcUtilityBillUrl}` : rcUtilityBill ? `Utility Bill: ${rcUtilityBill.name}` : "",
            rcLeaseContractUrl ? `Lease Contract: [photo]${rcLeaseContractUrl}` : rcLeaseContract ? `Lease Contract: ${rcLeaseContract.name}` : "",
            rcBarangayIdUrl ? `Barangay ID: [photo]${rcBarangayIdUrl}` : rcBarangayId ? `Barangay ID: ${rcBarangayId.name}` : "",
            rcCedulaUrl ? `Community Tax Certificate (Cedula): [photo]${rcCedulaUrl}` : rcCedula ? `Community Tax Certificate (Cedula): ${rcCedula.name}` : "",
            authLetterUrl ? `Authorization Letter: [photo]${authLetterUrl}` : authLetter ? `Authorization Letter: ${authLetter.name}` : "",
            `Delivery Method: ${deliveryMethod === "home-delivery" ? "Home Delivery" : "Pickup at City Hall"}`,
            deliveryMethod === "home-delivery" ? `Delivery Address: ${deliveryAddress}` : "",
          ].filter(Boolean).join("\n\n")
        : [
            documentType && showDateField(documentType) ? `${getDateLabel(documentType)}: ${dateRef || "N/A"}` : "",
            `Place of Registration: ${placeOfRegistration || "N/A"}`,
            `Relationship to Owner: ${relationship || "N/A"}`,
            `Purpose of Request: ${purpose}`,
            `Contact Number: ${contactNumber}`,
            `Email Address: ${email}`,
            validIdUrl ? `Valid ID: [photo]${validIdUrl}` : validId ? `Valid ID: ${validId.name}` : "",
            authLetterUrl ? `Authorization Letter: [photo]${authLetterUrl}` : authLetter ? `Authorization Letter: ${authLetter.name}` : "",
            `Delivery Method: ${deliveryMethod === "home-delivery" ? "Home Delivery" : "Pickup at City Hall"}`,
            deliveryMethod === "home-delivery" ? `Delivery Address: ${deliveryAddress}` : "",
          ].filter(Boolean).join("\n\n");

      const { data, error } = await supabase.from("citizen_concerns").insert({
        user_id: session.user.id,
        subject: `Document Request: ${documentType}`,
        description,
        category: documentType,
        status: "pending",
      }).select();

      if (error) throw error;

      try {
        await openEmailRequest("New Document Request", [
          `From: ${session.user.email}`,
          `Document Type: ${documentType}`,
          `Full Name: ${isBirthCert ? `${bcFirstName} ${bcMiddleName ? bcMiddleName + " " : ""}${bcLastName}` : isMarriageCert ? `${mcHusbandFirst} ${mcHusbandMiddle ? mcHusbandMiddle + " " : ""}${mcHusbandLast}` : isDeathCert ? `${dcFirstName} ${dcMiddleName ? dcMiddleName + " " : ""}${dcLastName}` : isResidenceCert ? `${rcFirstName} ${rcMiddleName ? rcMiddleName + " " : ""}${rcLastName}` : isCedula ? `${cdFirstName} ${cdMiddleName ? cdMiddleName + " " : ""}${cdLastName}` : fullName}`,
          `Purpose: ${isBirthCert ? bcPurpose : isMarriageCert ? mcPurpose : isDeathCert ? dcPurpose : isResidenceCert ? rcPurpose : isCedula ? "Cedula (Community Tax Certificate)" : purpose}`,
          `Contact: ${contactNumber}`,
        ]);
      } catch (emailError) {
        console.warn("Email notification failed, but request was submitted:", emailError);
      }

      // Open GCash payment dialog for the newly created request
      const newRequestId = data?.[0]?.id;

      // Create a notification for the user
      if (session?.user?.id) {
        await createNotification(
          session.user.id,
          "Request Submitted",
          `Your ${documentType.replace(/-/g, " ")} request has been submitted and is now being processed.`,
          "success",
          newRequestId,
        );
      }

      const orderId = newRequestId ? generateOrderId(newRequestId, new Date().toISOString()) : null;

      if (newRequestId && SERVICE_FEES[documentType]) {
        setPendingRequestId(newRequestId);
        setPaymentOpen(true);
        toast.success(`Request submitted! Order ID: ${orderId}. Please complete payment via GCash.`);
      } else {
        toast.success(`Your document request has been submitted! Order ID: ${orderId}`);
      }
      setDocumentType("");
      setFullName("");
      setDateRef("");
      setPlaceOfRegistration("");
      setRelationship("");
      setPurpose("");
      setContactNumber("");
      setValidId(null);
      setAuthLetter(null);
      setDeliveryMethod("");
      setDelRecipient("");
      setDelPhone("");
      setDelHouseNo("");
      setDelStreet("");
      setDelBarangay("");
      setDelCity("");
      setDelProvince("");
      setDelPostalCode("");
      setDelLandmark("");
      // Reset birth certificate fields
      setBcFirstName("");
      setBcMiddleName("");
      setBcLastName("");
      setBcDobMonth("");
      setBcDobDay("");
      setBcDobYear("");
      setBcBirthCity("");
      setBcBirthProvince("");
      setBcFatherName("");
      setBcMotherMaidenName("");
      setBcPurpose("");
      // Reset marriage certificate fields
      setMcHusbandFirst("");
      setMcHusbandMiddle("");
      setMcHusbandLast("");
      setMcWifeMaidenName("");
      setMcDateMonth("");
      setMcDateDay("");
      setMcDateYear("");
      setMcPlaceCity("");
      setMcPlaceProvince("");
      setMcPurpose("");
      // Reset death certificate fields
      setDcFirstName("");
      setDcMiddleName("");
      setDcLastName("");
      setDcDeathMonth("");
      setDcDeathDay("");
      setDcDeathYear("");
      setDcPlaceOfDeath("");
      setDcPlaceCity("");
      setDcPlaceProvince("");
      setDcDateOfBirth("");
      setDcCivilStatus("");
      setDcPurpose("");
      // Reset certificate of residency fields
      setRcFirstName("");
      setRcMiddleName("");
      setRcLastName("");
      setRcHouseNo("");
      setRcStreet("");
      setRcBarangay("");
      setRcCityMunicipality("");
      setRcLengthOfStay("");
      setRcPurpose("");
      setRcUtilityBill(null);
      setRcLeaseContract(null);
      setRcBarangayId(null);
      setRcCedula(null);
      // Reset cedula fields
      setCdFirstName("");
      setCdMiddleName("");
      setCdLastName("");
      setCdAddress("");
      setCdDobMonth("");
      setCdDobDay("");
      setCdDobYear("");
      setCdBirthPlace("");
      setCdCivilStatus("");
      setCdOccupation("");
      setCdTin("");
      setCdAnnualIncome("");
      setCdIsBusinessOwner(false);
      setCdBusinessName("");
      setCdBusinessAddress("");
      setCdBusinessCapitalization("");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Error submitting request:", errorMsg, error);
      toast.error(`Failed to submit request: ${errorMsg}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-12 w-12 text-civic-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-civic-gray-dark mb-2">Document Requests</h2>
        <p className="text-muted-foreground">Apply for permits, certificates, and other official documents</p>
      </div>

      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request a Document</CardTitle>
            <CardDescription>Fill in the details below to submit your request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document Type */}
            <div>
              <Label htmlFor="document-type">Document Type <span className="text-destructive">*</span></Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="birth-certificate">Birth Certificate</SelectItem>
                  <SelectItem value="marriage-certificate">Marriage Certificate</SelectItem>
                  <SelectItem value="death-certificate">Death Certificate</SelectItem>
                  <SelectItem value="residence-certificate">Certificate of Residency</SelectItem>
                  <SelectItem value="cedula">Cedula (Community Tax Certificate)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* === BIRTH CERTIFICATE FIELDS === */}
            {isBirthCert && (
              <>
                {/* Full Name — First / Middle / Last */}
                <div className="space-y-1">
                  <Label>Full Name of the Person <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Input placeholder="First Name" value={bcFirstName} onChange={(e) => setBcFirstName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">First Name</p>
                    </div>
                    <div>
                      <Input placeholder="Middle Name" value={bcMiddleName} onChange={(e) => setBcMiddleName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Middle Name</p>
                    </div>
                    <div>
                      <Input placeholder="Last Name" value={bcLastName} onChange={(e) => setBcLastName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Last Name</p>
                    </div>
                  </div>
                </div>

                {/* Date of Birth — Month / Day / Year */}
                <div className="space-y-1">
                  <Label>Date of Birth <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Select value={bcDobMonth} onValueChange={setBcDobMonth}>
                        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>
                          {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                            <SelectItem key={m} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Month</p>
                    </div>
                    <div>
                      <Input type="number" placeholder="Day" min={1} max={31} value={bcDobDay} onChange={(e) => setBcDobDay(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Day</p>
                    </div>
                    <div>
                      <Input type="number" placeholder="Year" min={1900} max={new Date().getFullYear()} value={bcDobYear} onChange={(e) => setBcDobYear(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Year</p>
                    </div>
                  </div>
                </div>

                {/* Place of Birth — Municipality/City + Province */}
                <div className="space-y-1">
                  <Label>Place of Birth <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input placeholder="e.g. San Carlos City" value={bcBirthCity} onChange={(e) => setBcBirthCity(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Municipality / City</p>
                    </div>
                    <div>
                      <Input placeholder="e.g. Pangasinan" value={bcBirthProvince} onChange={(e) => setBcBirthProvince(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Province</p>
                    </div>
                  </div>
                </div>

                {/* Father's Name */}
                <div>
                  <Label htmlFor="bc-father">Full Name of Father</Label>
                  <Input id="bc-father" placeholder="e.g. Juan Dela Cruz Sr." value={bcFatherName} onChange={(e) => setBcFatherName(e.target.value)} />
                </div>

                {/* Mother's Maiden Name */}
                <div>
                  <Label htmlFor="bc-mother">Full Maiden Name of Mother <span className="text-xs text-muted-foreground">(before marriage)</span></Label>
                  <Input id="bc-mother" placeholder="e.g. Maria Santos" value={bcMotherMaidenName} onChange={(e) => setBcMotherMaidenName(e.target.value)} />
                </div>

                {/* Purpose — dropdown */}
                <div>
                  <Label>Purpose of Request <span className="text-destructive">*</span></Label>
                  <Select value={bcPurpose} onValueChange={setBcPurpose}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="School enrollment">School Enrollment</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Employment">Employment</SelectItem>
                      <SelectItem value="Marriage">Marriage</SelectItem>
                      <SelectItem value="Personal copy">Personal Copy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* === MARRIAGE CERTIFICATE FIELDS === */}
            {isMarriageCert && (
              <>
                {/* Husband's Full Name — First / Middle / Last */}
                <div className="space-y-1">
                  <Label>Full Name of Husband <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Input placeholder="First Name" value={mcHusbandFirst} onChange={(e) => setMcHusbandFirst(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">First Name</p>
                    </div>
                    <div>
                      <Input placeholder="Middle Name" value={mcHusbandMiddle} onChange={(e) => setMcHusbandMiddle(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Middle Name</p>
                    </div>
                    <div>
                      <Input placeholder="Last Name" value={mcHusbandLast} onChange={(e) => setMcHusbandLast(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Last Name</p>
                    </div>
                  </div>
                </div>

                {/* Wife's Maiden Name */}
                <div>
                  <Label htmlFor="mc-wife">Full Maiden Name of Wife <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground">(her name before marriage)</span></Label>
                  <Input id="mc-wife" placeholder="e.g. Maria Santos" value={mcWifeMaidenName} onChange={(e) => setMcWifeMaidenName(e.target.value)} />
                </div>

                {/* Date of Marriage — Month / Day / Year */}
                <div className="space-y-1">
                  <Label>Date of Marriage <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Select value={mcDateMonth} onValueChange={setMcDateMonth}>
                        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>
                          {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                            <SelectItem key={m} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Month</p>
                    </div>
                    <div>
                      <Input type="number" placeholder="Day" min={1} max={31} value={mcDateDay} onChange={(e) => setMcDateDay(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Day</p>
                    </div>
                    <div>
                      <Input type="number" placeholder="Year" min={1900} max={new Date().getFullYear()} value={mcDateYear} onChange={(e) => setMcDateYear(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Year</p>
                    </div>
                  </div>
                </div>

                {/* Place of Marriage — City + Province */}
                <div className="space-y-1">
                  <Label>Place of Marriage <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input placeholder="e.g. San Carlos City" value={mcPlaceCity} onChange={(e) => setMcPlaceCity(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">City / Municipality</p>
                    </div>
                    <div>
                      <Input placeholder="e.g. Pangasinan" value={mcPlaceProvince} onChange={(e) => setMcPlaceProvince(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Province</p>
                    </div>
                  </div>
                </div>

                {/* Purpose — dropdown */}
                <div>
                  <Label>Purpose of Request <span className="text-destructive">*</span></Label>
                  <Select value={mcPurpose} onValueChange={setMcPurpose}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Visa">Visa</SelectItem>
                      <SelectItem value="Loan">Loan</SelectItem>
                      <SelectItem value="School requirement">School Requirement</SelectItem>
                      <SelectItem value="Legal purposes">Legal Purposes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* === DEATH CERTIFICATE FIELDS === */}
            {isDeathCert && (
              <>
                {/* Full Name of Deceased — First / Middle / Last */}
                <div className="space-y-1">
                  <Label>Full Name of the Deceased <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Input placeholder="First Name" value={dcFirstName} onChange={(e) => setDcFirstName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">First Name</p>
                    </div>
                    <div>
                      <Input placeholder="Middle Name" value={dcMiddleName} onChange={(e) => setDcMiddleName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Middle Name</p>
                    </div>
                    <div>
                      <Input placeholder="Last Name" value={dcLastName} onChange={(e) => setDcLastName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Last Name</p>
                    </div>
                  </div>
                </div>

                {/* Date of Death — Month / Day / Year */}
                <div className="space-y-1">
                  <Label>Date of Death <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Select value={dcDeathMonth} onValueChange={setDcDeathMonth}>
                        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>
                          {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                            <SelectItem key={m} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Month</p>
                    </div>
                    <div>
                      <Input type="number" placeholder="Day" min={1} max={31} value={dcDeathDay} onChange={(e) => setDcDeathDay(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Day</p>
                    </div>
                    <div>
                      <Input type="number" placeholder="Year" min={1900} max={new Date().getFullYear()} value={dcDeathYear} onChange={(e) => setDcDeathYear(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Year</p>
                    </div>
                  </div>
                </div>

                {/* Place of Death — Hospital/Home + City + Province */}
                <div className="space-y-1">
                  <Label>Place of Death <span className="text-destructive">*</span></Label>
                  <div className="space-y-2">
                    <div>
                      <Input placeholder="e.g. Region 1 Medical Center / Residence" value={dcPlaceOfDeath} onChange={(e) => setDcPlaceOfDeath(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Hospital / Home</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input placeholder="e.g. San Carlos City" value={dcPlaceCity} onChange={(e) => setDcPlaceCity(e.target.value)} />
                        <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">City / Municipality</p>
                      </div>
                      <div>
                        <Input placeholder="e.g. Pangasinan" value={dcPlaceProvince} onChange={(e) => setDcPlaceProvince(e.target.value)} />
                        <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Province</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date of Birth (if known) */}
                <div>
                  <Label htmlFor="dc-dob">Date of Birth <span className="text-xs text-muted-foreground">(if known)</span></Label>
                  <Input id="dc-dob" type="date" value={dcDateOfBirth} onChange={(e) => setDcDateOfBirth(e.target.value)} />
                </div>

                {/* Civil Status */}
                <div>
                  <Label>Civil Status</Label>
                  <Select value={dcCivilStatus} onValueChange={setDcCivilStatus}>
                    <SelectTrigger><SelectValue placeholder="Select civil status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Purpose — dropdown */}
                <div>
                  <Label>Purpose of Request <span className="text-destructive">*</span></Label>
                  <Select value={dcPurpose} onValueChange={setDcPurpose}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Insurance claim">Insurance Claim</SelectItem>
                      <SelectItem value="SSS/GSIS claim">SSS / GSIS Claim</SelectItem>
                      <SelectItem value="Bank transactions">Bank Transactions</SelectItem>
                      <SelectItem value="Estate settlement">Estate Settlement</SelectItem>
                      <SelectItem value="Personal copy">Personal Copy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* === CERTIFICATE OF RESIDENCY FIELDS === */}
            {isResidenceCert && (
              <>
                {/* Full Name — First / Middle / Last */}
                <div className="space-y-1">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Input placeholder="First Name" value={rcFirstName} onChange={(e) => setRcFirstName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">First Name</p>
                    </div>
                    <div>
                      <Input placeholder="Middle Name" value={rcMiddleName} onChange={(e) => setRcMiddleName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Middle Name</p>
                    </div>
                    <div>
                      <Input placeholder="Last Name" value={rcLastName} onChange={(e) => setRcLastName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Last Name</p>
                    </div>
                  </div>
                </div>

                {/* Complete Address */}
                <div className="space-y-1">
                  <Label>Complete Address <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input placeholder="e.g. 123" value={rcHouseNo} onChange={(e) => setRcHouseNo(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">House No.</p>
                    </div>
                    <div>
                      <Input placeholder="e.g. Rizal St." value={rcStreet} onChange={(e) => setRcStreet(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Street</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Input placeholder="e.g. Brgy. Bonifacio" value={rcBarangay} onChange={(e) => setRcBarangay(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Barangay</p>
                    </div>
                    <div>
                      <Input placeholder="e.g. San Carlos City" value={rcCityMunicipality} onChange={(e) => setRcCityMunicipality(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">City / Municipality</p>
                    </div>
                  </div>
                </div>

                {/* Length of Stay */}
                <div>
                  <Label htmlFor="rc-stay">Length of Stay <span className="text-destructive">*</span></Label>
                  <Input id="rc-stay" placeholder="e.g. 5 years, since 2019" value={rcLengthOfStay} onChange={(e) => setRcLengthOfStay(e.target.value)} />
                </div>

                {/* Purpose — dropdown */}
                <div>
                  <Label>Purpose of Request <span className="text-destructive">*</span></Label>
                  <Select value={rcPurpose} onValueChange={setRcPurpose}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="School requirement">School Requirement</SelectItem>
                      <SelectItem value="Employment">Employment</SelectItem>
                      <SelectItem value="Bank account">Bank Account Opening</SelectItem>
                      <SelectItem value="Scholarship">Scholarship</SelectItem>
                      <SelectItem value="Government transactions">Government Transactions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Proof of Residency Uploads */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                  <p className="text-sm font-semibold text-foreground">📄 Proof of Residency <span className="text-xs font-normal text-muted-foreground">(upload at least one)</span></p>

                  {/* Utility Bill */}
                  <div>
                    <Label htmlFor="rc-utility" className="text-xs">Utility Bill (Water / Electric)</Label>
                    <div className="mt-1 flex items-center gap-3 border rounded-md px-3 py-2 bg-white">
                      <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <label htmlFor="rc-utility" className="flex-1 text-xs text-muted-foreground cursor-pointer">
                        {rcUtilityBill ? rcUtilityBill.name : "Click to upload"}
                      </label>
                      <input id="rc-utility" type="file" accept=".jpg,.jpeg,.png,.pdf" className="sr-only" onChange={(e) => setRcUtilityBill(e.target.files?.[0] || null)} />
                    </div>
                  </div>

                  {/* Lease Contract */}
                  <div>
                    <Label htmlFor="rc-lease" className="text-xs">Lease Contract</Label>
                    <div className="mt-1 flex items-center gap-3 border rounded-md px-3 py-2 bg-white">
                      <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <label htmlFor="rc-lease" className="flex-1 text-xs text-muted-foreground cursor-pointer">
                        {rcLeaseContract ? rcLeaseContract.name : "Click to upload"}
                      </label>
                      <input id="rc-lease" type="file" accept=".jpg,.jpeg,.png,.pdf" className="sr-only" onChange={(e) => setRcLeaseContract(e.target.files?.[0] || null)} />
                    </div>
                  </div>

                  {/* Barangay ID */}
                  <div>
                    <Label htmlFor="rc-brgyid" className="text-xs">Barangay ID</Label>
                    <div className="mt-1 flex items-center gap-3 border rounded-md px-3 py-2 bg-white">
                      <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <label htmlFor="rc-brgyid" className="flex-1 text-xs text-muted-foreground cursor-pointer">
                        {rcBarangayId ? rcBarangayId.name : "Click to upload"}
                      </label>
                      <input id="rc-brgyid" type="file" accept=".jpg,.jpeg,.png,.pdf" className="sr-only" onChange={(e) => setRcBarangayId(e.target.files?.[0] || null)} />
                    </div>
                  </div>

                  {/* Cedula */}
                  <div>
                    <Label htmlFor="rc-cedula" className="text-xs">Community Tax Certificate (Cedula) <span className="text-[10px] text-muted-foreground">(often required before issuance)</span></Label>
                    <div className="mt-1 flex items-center gap-3 border rounded-md px-3 py-2 bg-white">
                      <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <label htmlFor="rc-cedula" className="flex-1 text-xs text-muted-foreground cursor-pointer">
                        {rcCedula ? rcCedula.name : "Click to upload"}
                      </label>
                      <input id="rc-cedula" type="file" accept=".jpg,.jpeg,.png,.pdf" className="sr-only" onChange={(e) => setRcCedula(e.target.files?.[0] || null)} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* === CEDULA (COMMUNITY TAX CERTIFICATE) FIELDS === */}
            {isCedula && (
              <>
                {/* Full Name — First / Middle / Last */}
                <div className="space-y-1">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Input placeholder="First Name" value={cdFirstName} onChange={(e) => setCdFirstName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">First Name</p>
                    </div>
                    <div>
                      <Input placeholder="Middle Name" value={cdMiddleName} onChange={(e) => setCdMiddleName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Middle Name</p>
                    </div>
                    <div>
                      <Input placeholder="Last Name" value={cdLastName} onChange={(e) => setCdLastName(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Last Name</p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="cd-address">Address <span className="text-destructive">*</span></Label>
                  <Textarea id="cd-address" placeholder="Complete address (House No., Street, Barangay, City)" rows={2} value={cdAddress} onChange={(e) => setCdAddress(e.target.value)} />
                </div>

                {/* Date of Birth — Month / Day / Year */}
                <div className="space-y-1">
                  <Label>Date of Birth <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Select value={cdDobMonth} onValueChange={setCdDobMonth}>
                        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>
                          {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                            <SelectItem key={m} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Month</p>
                    </div>
                    <div>
                      <Input type="number" placeholder="Day" min={1} max={31} value={cdDobDay} onChange={(e) => setCdDobDay(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Day</p>
                    </div>
                    <div>
                      <Input type="number" placeholder="Year" min={1900} max={new Date().getFullYear()} value={cdDobYear} onChange={(e) => setCdDobYear(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Year</p>
                    </div>
                  </div>
                </div>

                {/* Place of Birth */}
                <div>
                  <Label htmlFor="cd-birthplace">Place of Birth</Label>
                  <Input id="cd-birthplace" placeholder="e.g. San Carlos City, Pangasinan" value={cdBirthPlace} onChange={(e) => setCdBirthPlace(e.target.value)} />
                </div>

                {/* Civil Status */}
                <div>
                  <Label>Civil Status <span className="text-destructive">*</span></Label>
                  <Select value={cdCivilStatus} onValueChange={setCdCivilStatus}>
                    <SelectTrigger><SelectValue placeholder="Select civil status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                      <SelectItem value="Separated">Separated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Occupation */}
                <div>
                  <Label htmlFor="cd-occupation">Occupation / Profession <span className="text-destructive">*</span></Label>
                  <Input id="cd-occupation" placeholder="e.g. Teacher, Farmer, OFW" value={cdOccupation} onChange={(e) => setCdOccupation(e.target.value)} />
                </div>

                {/* TIN & Annual Income */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="cd-tin">TIN <span className="text-xs text-muted-foreground">(if available)</span></Label>
                    <Input id="cd-tin" placeholder="e.g. 123-456-789-000" value={cdTin} onChange={(e) => setCdTin(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="cd-income">Annual Income <span className="text-destructive">*</span></Label>
                    <Input id="cd-income" placeholder="e.g. 250,000" value={cdAnnualIncome} onChange={(e) => setCdAnnualIncome(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">In Philippine Pesos (₱) — for tax computation</p>
                  </div>
                </div>

                {/* Business Owner toggle */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cd-biz-toggle"
                      checked={cdIsBusinessOwner}
                      onChange={(e) => setCdIsBusinessOwner(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="cd-biz-toggle" className="text-sm font-semibold cursor-pointer">I am a business owner</Label>
                  </div>

                  {cdIsBusinessOwner && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <Label htmlFor="cd-bizname" className="text-xs">Business Name</Label>
                        <Input id="cd-bizname" placeholder="e.g. Juan's Sari-Sari Store" value={cdBusinessName} onChange={(e) => setCdBusinessName(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="cd-bizaddr" className="text-xs">Business Address</Label>
                        <Input id="cd-bizaddr" placeholder="Complete business address" value={cdBusinessAddress} onChange={(e) => setCdBusinessAddress(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="cd-bizcap" className="text-xs">Business Capitalization</Label>
                        <Input id="cd-bizcap" placeholder="e.g. 500,000" value={cdBusinessCapitalization} onChange={(e) => setCdBusinessCapitalization(e.target.value)} />
                        <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">In Philippine Pesos (₱)</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* === GENERIC FIELDS (other document types) === */}
            {!isBirthCert && !isMarriageCert && !isDeathCert && !isResidenceCert && !isCedula && (
              <>
                {/* Full Name */}
                <div>
                  <Label htmlFor="full-name">Full Name of Document Owner <span className="text-destructive">*</span></Label>
                  <Input
                    id="full-name"
                    placeholder="e.g. Juan Dela Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                {/* Date reference - dynamic based on document type */}
                {documentType && showDateField(documentType) && (
                <div>
                  <Label htmlFor="date-ref">{getDateLabel(documentType)}</Label>
                  <Input
                    id="date-ref"
                    type="date"
                    value={dateRef}
                    onChange={(e) => setDateRef(e.target.value)}
                  />
                </div>
                )}

                {/* Place of Registration */}
                <div>
                  <Label htmlFor="place-reg">Place of Registration</Label>
                  <Input
                    id="place-reg"
                    placeholder="e.g. San Carlos City, Pangasinan"
                    value={placeOfRegistration}
                    onChange={(e) => setPlaceOfRegistration(e.target.value)}
                  />
                </div>

                {/* Relationship */}
                <div>
                  <Label htmlFor="relationship">Relationship to Owner</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Self</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="legal-representative">Legal Representative</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Purpose */}
                <div>
                  <Label htmlFor="purpose">Purpose of Request <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="purpose"
                    placeholder="e.g. For employment, school enrollment, travel abroad..."
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Contact Number */}
            <div>
              <Label htmlFor="contact">Contact Number <span className="text-destructive">*</span></Label>
              <Input
                id="contact"
                placeholder="e.g. 09XX-XXX-XXXX"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="req-email">Email Address <span className="text-destructive">*</span></Label>
              <Input
                id="req-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Valid ID upload */}
            <div>
              <Label htmlFor="valid-id">Upload Valid ID <span className="text-destructive">*</span></Label>
              <div className="mt-1 flex items-center gap-3 border rounded-md px-3 py-2 bg-muted/30">
                <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <label htmlFor="valid-id" className="flex-1 text-sm text-muted-foreground cursor-pointer">
                  {validId ? validId.name : "Click to upload (JPG, PNG, PDF)"}
                </label>
                <input
                  id="valid-id"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="sr-only"
                  onChange={(e) => setValidId(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Authorization Letter upload */}
            <div>
              <Label htmlFor="auth-letter">Upload Authorization Letter <span className="text-xs text-muted-foreground">(if applicable)</span></Label>
              <div className="mt-1 flex items-center gap-3 border rounded-md px-3 py-2 bg-muted/30">
                <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <label htmlFor="auth-letter" className="flex-1 text-sm text-muted-foreground cursor-pointer">
                  {authLetter ? authLetter.name : "Click to upload (JPG, PNG, PDF)"}
                </label>
                <input
                  id="auth-letter"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="sr-only"
                  onChange={(e) => setAuthLetter(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Delivery Method */}
            <div>
              <Label htmlFor="delivery-method">Delivery Method <span className="text-destructive">*</span></Label>
              <Select value={deliveryMethod} onValueChange={(v) => { setDeliveryMethod(v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="How would you like to receive the document?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup at City Hall</SelectItem>
                  <SelectItem value="home-delivery">Home Delivery (via courier)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shopee-style Delivery Address */}
            {deliveryMethod === "home-delivery" && (
              <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/40 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-orange-500" />
                  <p className="text-sm font-semibold text-orange-700">Delivery Address</p>
                </div>

                {/* Recipient + Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="del-recipient" className="text-xs">Recipient Name <span className="text-destructive">*</span></Label>
                    <Input id="del-recipient" placeholder="e.g. Juan Dela Cruz" value={delRecipient} onChange={(e) => setDelRecipient(e.target.value)} className="bg-white" />
                  </div>
                  <div>
                    <Label htmlFor="del-phone" className="text-xs">Phone Number <span className="text-destructive">*</span></Label>
                    <Input id="del-phone" placeholder="e.g. 09XX-XXX-XXXX" value={delPhone} onChange={(e) => setDelPhone(e.target.value)} className="bg-white" />
                  </div>
                </div>

                {/* House No. + Street */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="del-house" className="text-xs">House / Unit / Floor No. <span className="text-destructive">*</span></Label>
                    <Input id="del-house" placeholder="e.g. 123 / Blk 5 Lot 10" value={delHouseNo} onChange={(e) => setDelHouseNo(e.target.value)} className="bg-white" />
                  </div>
                  <div>
                    <Label htmlFor="del-street" className="text-xs">Street Name</Label>
                    <Input id="del-street" placeholder="e.g. Rizal St." value={delStreet} onChange={(e) => setDelStreet(e.target.value)} className="bg-white" />
                  </div>
                </div>

                {/* Barangay + City */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="del-brgy" className="text-xs">Barangay <span className="text-destructive">*</span></Label>
                    <Input id="del-brgy" placeholder="e.g. Brgy. Bonifacio" value={delBarangay} onChange={(e) => setDelBarangay(e.target.value)} className="bg-white" />
                  </div>
                  <div>
                    <Label htmlFor="del-city" className="text-xs">City / Municipality <span className="text-destructive">*</span></Label>
                    <Input id="del-city" placeholder="e.g. San Carlos City" value={delCity} onChange={(e) => setDelCity(e.target.value)} className="bg-white" />
                  </div>
                </div>

                {/* Province + Postal Code */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="del-province" className="text-xs">Province <span className="text-destructive">*</span></Label>
                    <Input id="del-province" placeholder="e.g. Pangasinan" value={delProvince} onChange={(e) => setDelProvince(e.target.value)} className="bg-white" />
                  </div>
                  <div>
                    <Label htmlFor="del-postal" className="text-xs">Postal Code</Label>
                    <Input id="del-postal" placeholder="e.g. 2420" value={delPostalCode} onChange={(e) => setDelPostalCode(e.target.value)} className="bg-white" />
                  </div>
                </div>

                {/* Landmark */}
                <div>
                  <Label htmlFor="del-landmark" className="text-xs">Landmark <span className="text-xs font-normal text-muted-foreground">(optional — helps the courier find you)</span></Label>
                  <Input id="del-landmark" placeholder="e.g. Near San Carlos City Plaza, beside Mercury Drug" value={delLandmark} onChange={(e) => setDelLandmark(e.target.value)} className="bg-white" />
                </div>
              </div>
            )}

            {/* Fee display */}
            {documentType && SERVICE_FEES[documentType] && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm flex items-center justify-between">
                <span className="text-muted-foreground">Processing Fee:</span>
                <span className="font-bold text-lg" style={{ color: "#007DFE" }}>
                  ₱{SERVICE_FEES[documentType].fee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <Button className="w-full" variant="civic" onClick={handleSubmit}>
              Submit Request{documentType && SERVICE_FEES[documentType] ? " & Pay via GCash" : ""}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* GCash Payment Dialog */}
      <GCashPayment
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        serviceType={documentType || "birth-certificate"}
        onPaymentSubmitted={async (info) => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Save payment record (uses the payments table)
            // The table may not exist yet if migration hasn't run — handled gracefully
            const { error } = await supabase.from("payments" as any).insert({
              user_id: session.user.id,
              request_id: pendingRequestId,
              amount: info.amount,
              payment_method: "gcash",
              reference_number: info.referenceNumber,
              gcash_number: info.gcashNumber,
              proof_url: info.proofUrl,
              status: "pending_verification",
            } as any);

            if (error) {
              console.warn("Could not save payment record:", error);
            }

            toast.success("Payment proof submitted! We'll verify it shortly.");
            setPaymentOpen(false);
            setPendingRequestId(null);
          } catch (err) {
            console.error("Payment submission error:", err);
            toast.error("Failed to record payment. Please contact support.");
          }
        }}
        onCancel={() => {
          setPaymentOpen(false);
          setPendingRequestId(null);
        }}
      />
    </div>
  );
};
import { ProofDocument } from "@/lib/data";
import { FileText, Download } from "lucide-react";

interface ProofDocumentsProps {
  documents: ProofDocument[];
}

export default function ProofDocuments({ documents }: ProofDocumentsProps) {
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      medical: "Medical Document",
      financial: "Financial Statement",
      identification: "Identification",
      id_proof: "ID Proof",
      address_proof: "Address Proof",
      other: "Other Document",
    };
    return labels[type] || type;
  };

  return (
    <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-medium text-gray-900">Proof of Need</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        This campaign has been verified with supporting documentation. All documents have been reviewed to confirm the need for assistance.
      </p>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{doc.name}</p>
                <p className="text-sm text-gray-600">{doc.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {getDocumentTypeLabel(doc.type)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button className="text-primary-600 hover:text-primary-700 p-2">
              <Download className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

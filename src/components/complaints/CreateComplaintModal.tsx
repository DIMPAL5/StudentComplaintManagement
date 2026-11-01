import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DataService } from '../../services/dataService';
import { ComplaintCategory, Department, Asset, CampusBuilding, Priority, Complaint } from '../../types';
import {
  X,
  Upload,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Bot,
  CheckCircle2,
  Building,
  MapPin,
  FileText,
  Info,
  ExternalLink,
  Camera,
  QrCode,
  Mic,
  MicOff,
} from 'lucide-react';
import { CameraModal } from '../common/CameraModal';

interface CreateComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (complaint: Complaint) => void;
}

export const CreateComplaintModal: React.FC<CreateComplaintModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [buildings, setBuildings] = useState<CampusBuilding[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [campusBuilding, setCampusBuilding] = useState('');
  const [block, setBlock] = useState('Main Wing');
  const [floor, setFloor] = useState('1st Floor');
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera, Voice & QR Scanner
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  // Recommendations & Duplicates
  const [duplicateMatches, setDuplicateMatches] = useState<Complaint[]>([]);
  const [recommendedDept, setRecommendedDept] = useState<string>('');
  const [recommendedPriority, setRecommendedPriority] = useState<Priority>('medium');
  const [isSafetyAlert, setIsSafetyAlert] = useState(false);

  // Guided Assistant Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardAnswers, setWizardAnswers] = useState({
    scope: 'single', // 'single' | 'whole_room'
    severity: 'functional', // 'functional' | 'hazard' | 'urgent'
    troubleshooted: 'no', // 'yes' | 'no'
  });

  useEffect(() => {
    const loadMetadata = async () => {
      const [catList, deptList, assetList, bldgList] = await Promise.all([
        DataService.getCategories(),
        DataService.getDepartments(),
        DataService.getAssets(),
        DataService.getBuildings(),
      ]);
      setCategories(catList);
      setDepartments(deptList);
      setAssets(assetList);
      setBuildings(bldgList);

      if (catList.length > 0) {
        setCategoryId(catList[0].id);
      }
      if (bldgList.length > 0) {
        setCampusBuilding(bldgList[0].name);
      }
    };
    if (isOpen) {
      loadMetadata();
    }
  }, [isOpen]);

  // Dynamic recommendation check
  useEffect(() => {
    if (!categoryId) return;
    const runRecommendations = async () => {
      const rec = await DataService.recommendDepartmentAndPriority(categoryId, `${title} ${description}`, campusBuilding);
      setRecommendedDept(rec.departmentName);
      setRecommendedPriority(rec.priority);
      setIsSafetyAlert(rec.isSafetyHazard);
    };
    const timer = setTimeout(runRecommendations, 300);
    return () => clearTimeout(timer);
  }, [categoryId, title, description, campusBuilding]);

  // Duplicate complaint detection
  useEffect(() => {
    if (!campusBuilding || (!title && !roomNumber)) {
      setDuplicateMatches([]);
      return;
    }
    const checkDuplicates = async () => {
      const duplicates = await DataService.detectDuplicates(title, campusBuilding, roomNumber, categoryId);
      setDuplicateMatches(duplicates);
    };
    const timer = setTimeout(checkDuplicates, 400);
    return () => clearTimeout(timer);
  }, [title, campusBuilding, roomNumber, categoryId]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File too large', 'Please select an image smaller than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Voice Dictation
  const toggleVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('warning', 'Speech Dictation Not Supported', 'Your browser does not support Web Speech API. Please type your description.');
      return;
    }

    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsRecordingVoice(true);
      showToast('info', 'Listening...', 'Speak your complaint clearly into the microphone.');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecordingVoice(false);
        showToast('success', 'Voice Transcribed', 'Speech recorded into description.');
      };

      recognition.onerror = (event: any) => {
        setIsRecordingVoice(false);
        showToast('warning', 'Voice Input Ended', event.error || 'Microphone closed.');
      };

      recognition.onend = () => {
        setIsRecordingVoice(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsRecordingVoice(false);
      showToast('error', 'Voice Dictation Error', err.message);
    }
  };

  // Quick QR Scan Simulator
  const handleScanAsset = (asset: Asset) => {
    setSelectedAssetId(asset.id);
    setCampusBuilding(asset.building);
    setRoomNumber(asset.room);
    setTitle((prev) => prev || `Malfunction reported on ${asset.name}`);
    setShowQrScanner(false);
    showToast('success', 'QR Asset Scanned!', `Loaded ${asset.assetCode} (${asset.name}) in ${asset.building} ${asset.room}.`);
  };

  const applyWizardResults = () => {
    if (wizardAnswers.severity === 'hazard') {
      setDescription((prev) => `${prev} [SAFETY HAZARD REPORTED: Immediate physical safety risk observed.]`.trim());
    } else if (wizardAnswers.scope === 'whole_room') {
      setDescription((prev) => `${prev} [Widespread campus issue affecting multiple students/staff simultaneously.]`.trim());
    }
    setShowWizard(false);
    showToast('info', 'Assistant recommendations applied', 'Form fields adjusted based on your answers.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('error', 'Authentication required', 'Please log in to submit a complaint.');
      return;
    }

    if (!title.trim() || !description.trim() || !roomNumber.trim()) {
      showToast('warning', 'Missing required fields', 'Please provide a title, description, and room number.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newComplaint = await DataService.createComplaint(
        {
          title: title.trim(),
          description: description.trim(),
          categoryId,
          campusBuilding,
          block,
          floor,
          roomNumber: roomNumber.trim(),
          assetId: selectedAssetId || undefined,
          imageUrl: imagePreview || undefined,
          isAnonymous,
        },
        currentUser
      );

      showToast(
        'success',
        'Complaint Submitted Successfully!',
        `Ticket code: ${newComplaint.complaintCode}. Routed to ${newComplaint.departmentName}.`
      );

      onSuccess(newComplaint);
      onClose();
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const eligibleAssets = assets.filter(
    (a) =>
      (!campusBuilding || a.building.toLowerCase().includes(campusBuilding.toLowerCase())) &&
      (!selectedCategoryObj || a.category.toLowerCase().includes(selectedCategoryObj.name.toLowerCase().slice(0, 5)))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Submit New Complaint</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                Auto-ID
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide incident details for automated smart routing and SLA tracking.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Guided Assistant Banner */}
          {!showWizard ? (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-950 dark:text-blue-200">
                    Not sure what priority or department to choose?
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    Use our Guided Complaint Assistant for automated classification.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shadow-sm transition-colors"
              >
                Launch Assistant
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border-2 border-blue-500 dark:border-blue-400 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-blue-600" />
                  Guided Diagnostic Wizard
                </span>
                <button
                  onClick={() => setShowWizard(false)}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    1. What is the scope of impact?
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWizardAnswers((p) => ({ ...p, scope: 'single' }))}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-medium ${
                        wizardAnswers.scope === 'single'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Single Device / Localized
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardAnswers((p) => ({ ...p, scope: 'whole_room' }))}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-medium ${
                        wizardAnswers.scope === 'whole_room'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Entire Room / Multiple People
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    2. Does this pose any physical hazard?
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWizardAnswers((p) => ({ ...p, severity: 'functional' }))}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-medium ${
                        wizardAnswers.severity === 'functional'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Standard Malfunction
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardAnswers((p) => ({ ...p, severity: 'hazard' }))}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-medium ${
                        wizardAnswers.severity === 'hazard'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Safety Hazard (Sparks, Leaks)
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyWizardResults}
                  className="w-full mt-2 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors"
                >
                  Apply Diagnostic Recommendations
                </button>
              </div>
            </div>
          )}

          {/* Duplicate Complaint Alert Banner */}
          {duplicateMatches.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span className="text-xs font-bold">
                  Potential Duplicate Issue Detected ({duplicateMatches.length} active ticket found)
                </span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                An open complaint already exists in this location. You may follow the existing ticket or proceed with your submission.
              </p>
              <div className="space-y-1">
                {duplicateMatches.slice(0, 2).map((dup) => (
                  <div
                    key={dup.id}
                    className="p-2 bg-white dark:bg-slate-800 rounded-lg text-xs flex items-center justify-between border border-amber-200 dark:border-slate-700"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-600 mr-2">{dup.complaintCode}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{dup.title}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase font-bold">
                      {dup.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form id="createComplaintForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Complaint Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., HDMI Projector not detecting laptop signal in LH 304"
                required
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Category & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.slaHours}h SLA)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Department (Smart Suggested)
                </label>
                <input
                  type="text"
                  readOnly
                  value={recommendedDept || 'Analyzing...'}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            {/* Location: Building, Block, Floor, Room */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Campus Location Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Building <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={campusBuilding}
                    onChange={(e) => setCampusBuilding(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Wing / Block
                  </label>
                  <input
                    type="text"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="e.g. Wing A, East Corridors"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Floor
                  </label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Basement">Basement</option>
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Room / Lab Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g., Room 304, Lab 2B"
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Optional Linked Asset & QR Scanner */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Optional Linked Campus Asset
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQrScanner(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan Asset QR Sticker</span>
                  </button>
                </div>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">None / General Room Incident</option>
                  {eligibleAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      [{asset.assetCode}] {asset.name} ({asset.building} - {asset.room})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description & Speech-to-Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceRecognition}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                    isRecordingVoice
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                  title="Speak your complaint using microphone dictation"
                >
                  {isRecordingVoice ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isRecordingVoice ? 'Listening...' : 'Voice Dictate'}</span>
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Explain the symptom, error messages, and what steps were attempted (or use Voice Dictate)..."
                required
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Photo Attachment, Live Camera & Preview */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Attach Photo Proof (Choose file or Live Camera)
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Upload File</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-teal-500 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Take Live Photo</span>
                </button>

                {imagePreview && (
                  <div className="flex items-center gap-2 pl-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover ring-2 ring-blue-500 shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Anonymous Toggle (if category allows) */}
            {selectedCategoryObj?.allowAnonymous && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="anonCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="anonCheck" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span className="font-bold">Submit Anonymously</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your name and roll ID will be concealed from ordinary staff. Note: anonymous submissions cannot receive individual SMS follow-ups.
                  </p>
                </label>
              </div>
            )}

            {/* Smart Priority & Safety Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Calculated Priority:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    recommendedPriority === 'critical'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : recommendedPriority === 'high'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}
                >
                  {recommendedPriority}
                </span>
                {isSafetyAlert && (
                  <span className="flex items-center text-rose-600 font-semibold gap-1 text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5" /> Safety Hazard Flagged
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                SLA: {selectedCategoryObj?.slaHours || 24} hours
              </span>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="createComplaintForm"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-semibold shadow-md shadow-blue-600/20 disabled:opacity-60 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Submitting ticket...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Submit Complaint</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => setImagePreview(dataUrl)}
        title="Snap Photo of Malfunction / Hazard"
      />

      {/* QR Code Asset Scanner Modal */}
      {showQrScanner && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Scan Campus Asset QR Sticker</h3>
              </div>
              <button onClick={() => setShowQrScanner(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select or scan any registered campus asset sticker below to auto-populate building, room, and equipment specs:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {assets.map((ast) => (
                <div
                  key={ast.id}
                  onClick={() => handleScanAsset(ast)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300">
                      [{ast.assetCode}]
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{ast.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {ast.building} • {ast.room}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-teal-600">Select & Populate →</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowQrScanner(false)}
              className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

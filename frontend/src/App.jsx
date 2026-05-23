import { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  MapPin, 
  Search, 
  ShieldAlert, 
  Award, 
  Map as MapIcon, 
  ListTodo, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X, 
  User, 
  RefreshCw,
  TrendingUp,
  FolderTree
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix Leaflet marker icon issue in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// Component to dynamically change map view center
function ChangeMapView({ coords }) {
  const map = useMap();
  if (coords) {
    map.setView(coords, 14, { animate: true });
  }
  return null;
}

function App() {
  const [view, setView] = useState('citizen'); // 'citizen' or 'dashboard'
  
  // Citizen - Report Form States
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [coords, setCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [ecoScore, setEcoScore] = useState(() => {
    return parseInt(localStorage.getItem('eco_score') || '0', 10);
  });

  // Citizen - Tracking States
  const [trackingCode, setTrackingCode] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  // Dashboard States
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Active');
  
  // Developer Login & Notes
  const [currentUser, setCurrentUser] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  
  const [isEditingComplaint, setIsEditingComplaint] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const fileInputRef = useRef(null);

  // Sync eco score to local storage
  useEffect(() => {
    localStorage.setItem('eco_score', ecoScore.toString());
  }, [ecoScore]);

  // Load complaints when switching to dashboard
  useEffect(() => {
    if (view === 'dashboard') {
      fetchComplaints();
    }
  }, [view]);

  const fetchComplaints = async () => {
    setDashboardLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/complaints/`);
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getGeoLocation = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Konum alınamadı. Lütfen konum izinlerini kontrol edin.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setSubmitError('Lütfen bir fotoğraf çekin veya yükleyin.');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Lütfen şikayetiniz hakkında kısa bir açıklama yazın.');
      return;
    }

    if (reporterPhone && !/^\d{10,11}$/.test(reporterPhone)) {
      setSubmitError('Lütfen 10 veya 11 haneli geçerli bir telefon numarası giriniz (sadece rakam).');
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append('description', description);
    formData.append('image', imageFile);
    if (reporterName) formData.append('reporter_name', reporterName);
    if (reporterPhone) formData.append('reporter_phone', reporterPhone);
    if (coords) {
      formData.append('latitude', coords.lat);
      formData.append('longitude', coords.lng);
    }

    try {
      const response = await fetch(`${API_BASE}/api/complaints/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessData(data);
        // Playful gamification: increment score for validated report
        setEcoScore(prev => prev + 15);
        // Reset form
        setDescription('');
        setReporterName('');
        setReporterPhone('');
        setImageFile(null);
        setImagePreview(null);
        setCoords(null);
      } else {
        if (response.status === 400 && data.detail && data.detail.toLowerCase().includes("spam")) {
           setEcoScore(prev => prev - 10);
        }
        setSubmitError(data.detail || 'Şikayet gönderilirken bir hata oluştu.');
      }
    } catch (error) {
      setSubmitError('Sunucu bağlantısı kurulamadı. Lütfen backend sunucusunun çalıştığından emin olun.');
      console.error(error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    setTrackLoading(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/complaints/track/${trackingCode}`);
      const data = await response.json();

      if (response.ok) {
        setTrackResult(data);
      } else {
        setTrackError(data.detail || 'Şikayet bulunamadı.');
      }
    } catch (error) {
      setTrackError('Bağlantı hatası.');
    } finally {
      setTrackLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === "Çözüldü") {
       setTimeout(() => alert("Sistem: Vakayı oluşturan kullanıcıya çözüm SMS'i gönderildi."), 500);
    }
    try {
      const response = await fetch(`${API_BASE}/api/complaints/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updated = await response.json();
        // Update local state list
        setComplaints(prev => prev.map(c => c.id === id ? updated : c));
        // Update overlay details if currently selected
        if (selectedComplaint && selectedComplaint.id === id) {
          setSelectedComplaint(updated);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Filter complaints based on search/status filter
  const filteredComplaints = complaints.filter(c => {
    if (statusFilter === 'Active') {
      return c.status === 'Bekliyor' || c.status === 'İşleme Alındı';
    }
    if (statusFilter === 'Archived') {
      return c.status === 'Çözüldü' || c.status === 'Çözülemedi';
    }
    if (statusFilter === 'All') return true;
    return c.status === statusFilter;
  });

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedComplaint) return;
    
    setNoteSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/complaints/${selectedComplaint.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: currentUser.name, text: newNote }),
      });
      if (response.ok) {
        const addedNote = await response.json();
        const updatedComplaint = { ...selectedComplaint, notes: [...(selectedComplaint.notes || []), addedNote] };
        setSelectedComplaint(updatedComplaint);
        setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updatedComplaint : c));
        setNewNote('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm("Bu şikayeti tamamen silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch(`${API_BASE}/api/complaints/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setComplaints(prev => prev.filter(c => c.id !== id));
        setSelectedComplaint(null);
      }
    } catch (err) {
      console.error('Silme hatası:', err);
    }
  };

  const handleSendSMS = () => {
    alert("Vatandaşa SMS başarıyla gönderildi (Simülasyon).");
  };

  const maskPhone = (phone) => {
    if (!phone) return "Belirtilmemiş";
    if (phone.length < 10) return phone;
    return phone.substring(0, 4) + " *** ** " + phone.substring(phone.length - 2);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/complaints/${selectedComplaint.id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (response.ok) {
        const updated = await response.json();
        setSelectedComplaint(updated);
        setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
        setIsEditingComplaint(false);
      }
    } catch (err) {
      console.error('Error updating details:', err);
    }
  };

  const getUrgencyClass = (urgency) => {
    if (urgency === 'Kırmızı Kod') return 'kirmizi';
    if (urgency === 'Sarı Kod') return 'sari';
    return 'yesil';
  };

  const getStatusClass = (status) => {
    if (status === 'Bekliyor') return 'bekliyor';
    if (status === 'İşleme Alındı') return 'isleme_alindi';
    if (status === 'Çözüldü') return 'cozuldu';
    return 'cozulemedi';
  };

  // Center of Turkey (Ankara) or average of coordinates if available
  const getMapCenter = () => {
    const validCoords = complaints.filter(c => c.latitude && c.longitude);
    if (selectedComplaint && selectedComplaint.latitude && selectedComplaint.longitude) {
      return [selectedComplaint.latitude, selectedComplaint.longitude];
    }
    if (validCoords.length > 0) {
      const sumLat = validCoords.reduce((acc, c) => acc + c.latitude, 0);
      const sumLng = validCoords.reduce((acc, c) => acc + c.longitude, 0);
      return [sumLat / validCoords.length, sumLng / validCoords.length];
    }
    return [39.9334, 32.8597]; // Ankara
  };

  if (!currentUser) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
        <div className="card glass" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px' }}>
          <Award size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Kent Göz</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Demo testing için profil seçin</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button 
              className="btn btn-primary" 
              style={{ justifyContent: 'center', padding: '12px' }}
              onClick={() => {
                setCurrentUser({ name: "Demo Vatandaş", role: "citizen" });
                setView('citizen');
              }}
            >
              Vatandaş Olarak Devam Et
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ justifyContent: 'center', padding: '12px' }}
              onClick={() => {
                setCurrentUser({ name: "Geliştirici Admin", role: "admin" });
                setView('dashboard');
              }}
            >
              Yönetici Olarak Devam Et
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <nav className="navbar glass">
        <div className="nav-logo">
          <Award size={32} />
          <div>
            Kent Göz
            <span className="logo-sub">Yeşil Şehir Hizmetleri</span>
          </div>
        </div>
        <div className="nav-buttons">
          <button 
            className={`btn ${view === 'citizen' ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => setView('citizen')}
          >
            <User size={18} /> Vatandaş Portalı
          </button>
          {currentUser.role === 'admin' && (
            <button 
              className={`btn ${view === 'dashboard' ? 'btn-active' : 'btn-secondary'}`}
              onClick={() => setView('dashboard')}
            >
              <MapIcon size={18} /> Yönetici Paneli
            </button>
          )}
          <button 
            className="btn btn-secondary"
            onClick={() => setCurrentUser(null)}
          >
            Çıkış Yap
          </button>
        </div>
      </nav>

      {/* Citizen Portal Page */}
      {view === 'citizen' && (
        <div className="citizen-view">
          <div className="citizen-container">
            {/* Left side - Upload form */}
            <div className="card glass">
              <h2><Camera size={24} /> Yeni Şikayet Bildirimi</h2>
              <p className="card-subtitle">
                Çevre sorunlarını, hasarları veya temizlik ihtiyaçlarını bildirin. Sistem üzerinden anında inceleyelim.
              </p>
              
              <form onSubmit={handleFormSubmit}>
                {submitError && (
                  <div className="location-bar" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: '20px' }}>
                    <div className="location-info" style={{ color: 'var(--red-kod)' }}>
                      <ShieldAlert size={18} />
                      <span>{submitError}</span>
                    </div>
                  </div>
                )}

                {/* Custom camera/file upload */}
                <div className="form-group">
                  <span className="form-label">Görsel Yükle (Fotoğraf Çekimi)</span>
                  {!imagePreview ? (
                    <div 
                      className="file-upload-container"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <Camera size={44} className="file-upload-icon" />
                      <div>
                        <strong style={{ color: 'var(--primary)' }}>Kamerayı Aç / Fotoğraf Seç</strong>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Doğrudan kameranızla çekebilir veya galeri yükleyebilirsiniz.
                        </p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="file-input" 
                        accept="image/*" 
                        capture="environment" // direct camera open on mobile
                        onChange={handleImageChange}
                      />
                    </div>
                  ) : (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Şikayet önizleme" />
                      <button 
                        type="button" 
                        className="remove-img-btn"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="form-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 45%' }}>
                    <label className="form-label">Adınız Soyadınız (İsteğe Bağlı)</label>
                    <input 
                      type="text" 
                      className="input-text"
                      placeholder="Örn: Ali Yılmaz"
                      maxLength={50}
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: '1 1 45%' }}>
                    <label className="form-label">Telefon (İsteğe Bağlı)</label>
                    <input 
                      type="tel" 
                      className="input-text"
                      placeholder="Örn: 0555 123 45 67"
                      maxLength={11}
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Açıklama</label>
                  <textarea 
                    className="textarea-input"
                    placeholder="Lütfen sorunun ne olduğunu, ne kadar süredir devam ettiğini kısaca yazın..."
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Geolocation */}
                <div className="location-bar">
                  <div className="location-info">
                    <MapPin size={18} />
                    {coords ? (
                      <div>
                        <span>Konum Eklendi</span>
                        <div className="location-coords">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>
                      </div>
                    ) : (
                      <span>Konum Belirtilmedi (Önerilir)</span>
                    )}
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={getGeoLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? 'Alınıyor...' : coords ? 'Konumu Güncelle' : 'Konumumu Bul'}
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '16px' }}
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Gönderiliyor ve İnceleniyor...' : 'Şikayeti Gönder'}
                </button>
              </form>
            </div>

            {/* Right side - Tracking and Gamification */}
            <div>
              {/* Tracking card */}
              <div className="card glass" style={{ marginBottom: '24px' }}>
                <h2><Search size={24} /> Şikayet Takip</h2>
                <p className="card-subtitle">Gönderdiğiniz şikayetin durumunu sorgulayın.</p>
                
                <form onSubmit={handleTrackSubmit} className="tracking-search-box">
                  <input 
                    type="text" 
                    className="input-text" 
                    placeholder="Örn: BEYAZ-A7X9"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={trackLoading}>
                    {trackLoading ? 'Sorgulanıyor...' : 'Sorgula'}
                  </button>
                </form>

                {trackError && (
                  <p style={{ color: 'var(--red-kod)', fontSize: '14px', textAlign: 'left' }}>{trackError}</p>
                )}

                {trackResult && (
                  <div className="status-result-card">
                    <div className="status-header">
                      <span className="tracking-code-badge">{trackResult.tracking_code}</span>
                      <span className={`status-badge ${getStatusClass(trackResult.status)}`}>
                        {trackResult.status}
                      </span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Vaka Tanımı:</span>
                      <span className="detail-value">{trackResult.detected_issue}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Yönlendirilen Birim:</span>
                      <span className="detail-value">{trackResult.department}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Aciliyet:</span>
                      <span className={`urgency-badge ${getUrgencyClass(trackResult.urgency_code)}`}>
                        {trackResult.urgency_code}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Oluşturma:</span>
                      <span className="detail-value">
                        {new Date(trackResult.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Gamification widget */}
              <div className="gamification-widget">
                <div className="trust-icon-box">
                  <Award size={24} />
                </div>
                <div className="trust-info">
                  <h4>Çevre Bilinci Puanım</h4>
                  <p>Mevcut Puan: <strong style={{ color: 'var(--primary)', fontSize: '15px' }}>{ecoScore}</strong></p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Duyarlı vatandaşlarımızın katılımıyla şehrimiz daha temiz ve yeşil bir hale geliyor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard View */}
      {view === 'dashboard' && (
        <div className="dashboard-view">
          <div className="dashboard-grid">
            {/* Left list panel */}
            <div className="card glass list-panel" style={{ padding: 0 }}>
              <div className="list-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ListTodo size={20} />
                  <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Tüm Bildirimler</h3>
                </div>
                <button className="close-btn" onClick={fetchComplaints} title="Yenile">
                  <RefreshCw size={16} />
                </button>
              </div>
              
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                {['Active', 'Archived', 'All'].map(f => (
                  <button 
                    key={f}
                    className={`btn btn-secondary ${statusFilter === f ? 'btn-active' : ''}`}
                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === 'Active' ? 'Aktif Sorunlar' : f === 'Archived' ? 'Arşiv' : 'Tümü'}
                  </button>
                ))}
              </div>

              <div className="list-scroll">
                {dashboardLoading ? (
                  <div className="empty-state">Yükleniyor...</div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="empty-state">
                    <CheckCircle size={32} />
                    <span>Hiç bildirim bulunamadı.</span>
                  </div>
                ) : (
                  filteredComplaints.map(c => (
                    <div 
                      key={c.id} 
                      className={`complaint-item ${selectedComplaint && selectedComplaint.id === c.id ? 'selected' : ''}`}
                      onClick={() => setSelectedComplaint(c)}
                    >
                      <div className="item-header">
                        <span className="tracking-code-badge">{c.tracking_code}</span>
                        <span className={`urgency-badge ${getUrgencyClass(c.urgency_code)}`}>
                          {c.urgency_code}
                        </span>
                      </div>
                      
                      <div className="item-desc">{c.description}</div>
                      
                      <div className="item-footer">
                        <div className="risk-label">
                          <span>Risk:</span>
                          <span className={`risk-number ${c.risk_score > 70 ? 'high' : c.risk_score > 40 ? 'medium' : 'low'}`}>
                            %{c.risk_score}
                          </span>
                        </div>
                        <span className={`status-badge ${getStatusClass(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Map Panel */}
            <div className="map-panel">
              <MapContainer 
                center={getMapCenter()} 
                zoom={6} 
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Dynamically adjust map center to selected item */}
                {selectedComplaint && selectedComplaint.latitude && selectedComplaint.longitude && (
                  <ChangeMapView coords={[selectedComplaint.latitude, selectedComplaint.longitude]} />
                )}

                {complaints
                  .filter(c => c.latitude && c.longitude)
                  .map(c => (
                    <Marker 
                      key={c.id} 
                      position={[c.latitude, c.longitude]}
                      eventHandlers={{
                        click: () => {
                          setSelectedComplaint(c);
                        },
                      }}
                    >
                      <Popup>
                        <strong style={{ color: 'var(--primary)' }}>{c.detected_issue}</strong>
                        <p style={{ margin: '4px 0', fontSize: '12px' }}>{c.description}</p>
                        <span className={`urgency-badge ${getUrgencyClass(c.urgency_code)}`}>{c.urgency_code}</span>
                      </Popup>
                    </Marker>
                  ))
                }
              </MapContainer>

              {/* Floating detail overlay */}
              {selectedComplaint && (
                <div className="detail-overlay glass">
                  <div className="detail-title-bar">
                    <div>
                      {isEditingComplaint ? (
                        <input 
                          type="text" 
                          value={editFormData.detected_issue || ''} 
                          onChange={e => setEditFormData({...editFormData, detected_issue: e.target.value})}
                          style={{ fontSize: '18px', fontWeight: 700, width: '100%', marginBottom: '4px', background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }}
                        />
                      ) : (
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {selectedComplaint.detected_issue}
                        </h3>
                      )}
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                        Kod: {selectedComplaint.tracking_code}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {!isEditingComplaint ? (
                        <button className="close-btn" onClick={() => { setIsEditingComplaint(true); setEditFormData(selectedComplaint); }} title="Düzenle">
                          <AlertTriangle size={16} />
                        </button>
                      ) : (
                        <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={handleEditSubmit}>Kaydet</button>
                      )}
                      <button className="close-btn" onClick={() => { setSelectedComplaint(null); setIsEditingComplaint(false); }}>
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {selectedComplaint.image_url ? (
                    <img 
                      src={selectedComplaint.image_url} 
                      alt="Kanıt görseli" 
                      className="detail-img"
                    />
                  ) : (
                    <div className="detail-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border)' }}>
                      Görsel Yok
                    </div>
                  )}

                  {isEditingComplaint ? (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Bildiren İsim:</span>
                        <input 
                          type="text" 
                          value={editFormData.reporter_name || ''} 
                          onChange={e => setEditFormData({...editFormData, reporter_name: e.target.value})} 
                          style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px', width: '60%' }} 
                        />
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Bildiren Telefon:</span>
                        <input 
                          type="text" 
                          value={editFormData.reporter_phone || ''} 
                          onChange={e => setEditFormData({...editFormData, reporter_phone: e.target.value})} 
                          style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px', width: '60%' }} 
                        />
                      </div>
                    </>
                  ) : (
                    <div className="detail-row">
                      <span className="detail-label">Bildiren:</span>
                      <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {selectedComplaint.reporter_name || "Anonim"} - {maskPhone(selectedComplaint.reporter_phone)}
                        {selectedComplaint.reporter_phone && (
                          <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px', background: 'var(--bg-card)' }} onClick={handleSendSMS}>SMS At</button>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Açıklama:</span>
                    {isEditingComplaint ? (
                      <textarea value={editFormData.description || ''} onChange={e => setEditFormData({...editFormData, description: e.target.value})} style={{ width: '100%', background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px' }} />
                    ) : (
                      <span className="detail-value">{selectedComplaint.description}</span>
                    )}
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Sorumlu Birim:</span>
                    {isEditingComplaint ? (
                      <input type="text" value={editFormData.department || ''} onChange={e => setEditFormData({...editFormData, department: e.target.value})} style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px', width: '60%' }} />
                    ) : (
                      <span className="detail-value">{selectedComplaint.department}</span>
                    )}
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Sistem Doğruluğu:</span>
                    {isEditingComplaint ? (
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="1" 
                        value={editFormData.ai_confidence !== undefined ? editFormData.ai_confidence : ''} 
                        onChange={e => setEditFormData({...editFormData, ai_confidence: parseFloat(e.target.value) || 0})} 
                        style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px', width: '80px' }} 
                      />
                    ) : (
                      <span className="detail-value">%{Math.round((selectedComplaint.ai_confidence || 0) * 100)}</span>
                    )}
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Risk Skoru:</span>
                    {isEditingComplaint ? (
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={editFormData.risk_score !== undefined ? editFormData.risk_score : ''} 
                        onChange={e => setEditFormData({...editFormData, risk_score: parseInt(e.target.value, 10) || 0})} 
                        style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px', width: '80px' }} 
                      />
                    ) : (
                      <span className="detail-value">%{selectedComplaint.risk_score}</span>
                    )}
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Öncelik Seviyesi:</span>
                    {isEditingComplaint ? (
                      <select value={editFormData.urgency_code || ''} onChange={e => setEditFormData({...editFormData, urgency_code: e.target.value})} style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }}>
                        <option value="Kırmızı Kod">Kırmızı Kod</option>
                        <option value="Sarı Kod">Sarı Kod</option>
                        <option value="Yeşil Kod">Yeşil Kod</option>
                      </select>
                    ) : (
                      <span className={`urgency-badge ${getUrgencyClass(selectedComplaint.urgency_code)}`}>
                        {selectedComplaint.urgency_code}
                      </span>
                    )}
                  </div>
                  {isEditingComplaint ? (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Enlem (Lat):</span>
                        <input type="number" step="any" value={editFormData.latitude !== undefined ? editFormData.latitude : ''} onChange={e => setEditFormData({...editFormData, latitude: parseFloat(e.target.value) || 0})} style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px', width: '120px' }} />
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Boylam (Lng):</span>
                        <input type="number" step="any" value={editFormData.longitude !== undefined ? editFormData.longitude : ''} onChange={e => setEditFormData({...editFormData, longitude: parseFloat(e.target.value) || 0})} style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px', width: '120px' }} />
                      </div>
                    </>
                  ) : (
                    <div className="detail-row">
                      <span className="detail-label">Konum (Lat, Lng):</span>
                      <span className="detail-value">
                        {selectedComplaint.latitude !== null && selectedComplaint.longitude !== null 
                          ? `${selectedComplaint.latitude.toFixed(6)}, ${selectedComplaint.longitude.toFixed(6)}`
                          : "Belirtilmemiş"}
                      </span>
                    </div>
                  )}

                  {/* Notes Section */}
                  <div className="notes-container" style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Çalışan Notları</h4>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', paddingRight: '4px' }}>
                      {(!selectedComplaint.notes || selectedComplaint.notes.length === 0) ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Henüz not eklenmemiş.</p>
                      ) : (
                        selectedComplaint.notes.map(note => (
                          <div key={note.id} style={{ background: 'var(--bg-main)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>{note.author}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(note.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{note.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Not ekle..." 
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                      />
                      <button type="submit" disabled={noteSubmitting} className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px' }}>
                        Ekle
                      </button>
                    </form>
                  </div>

                  <div className="detail-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="detail-label" style={{ fontWeight: 500, minWidth: 'max-content' }}>Durum Değiştir:</span>
                      <select 
                        className="status-dropdown"
                        value={selectedComplaint.status}
                        onChange={(e) => handleStatusChange(selectedComplaint.id, e.target.value)}
                      >
                        <option value="Bekliyor">Bekliyor</option>
                        <option value="İşleme Alındı">İşleme Alındı</option>
                        <option value="Çözüldü">Çözüldü</option>
                        <option value="Çözülemedi">Çözülemedi</option>
                      </select>
                    </div>
                    <button className="btn btn-secondary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red-kod)', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={() => handleDeleteComplaint(selectedComplaint.id)}>
                      🗑️ Vakayı Sil
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {successData && (
        <div className="modal-backdrop">
          <div className="modal-content glass">
            <div className="success-icon-wrapper">
              <CheckCircle size={36} />
            </div>
            <h3 className="success-title">Şikayetiniz Alındı!</h3>
            <p className="success-desc">
              Sistem şikayetinizi inceledi ve başarıyla sınıflandırdı.
            </p>
            
            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid var(--border)' }}>
              <div className="detail-row">
                <span className="detail-label">Takip Kodu:</span>
                <span className="detail-value" style={{ fontFamily: 'var(--mono)', color: 'var(--primary)', fontWeight: 'bold' }}>
                  {successData.tracking_code}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tespit Edilen Konu:</span>
                <span className="detail-value">{successData.detected_issue}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Atanan Birim:</span>
                <span className="detail-value">{successData.department}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Öncelik Derecesi:</span>
                <span className={`urgency-badge ${getUrgencyClass(successData.urgency_code)}`}>
                  {successData.urgency_code}
                </span>
              </div>
            </div>

            <div className="gamification-widget" style={{ marginTop: 0, marginBottom: '24px' }}>
              <div className="trust-icon-box" style={{ background: '#eab308' }}>
                <Award size={24} />
              </div>
              <div className="trust-info">
                <h4 style={{ color: '#ca8a04' }}>Duyarlılığınız İçin Teşekkürler!</h4>
                <p style={{ fontSize: '12px' }}>Katkılarınız şehrimizi daha yaşanabilir kılmaktadır.</p>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
              onClick={() => setSuccessData(null)}
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

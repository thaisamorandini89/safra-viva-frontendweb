import { useState } from "react";

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <circle cx="20" cy="20" r="18" fill="#166534" />
        <path d="M20 8 C14 14 10 20 14 26 C18 32 26 30 28 24 C30 18 26 12 20 8Z" fill="#4ade80" opacity="0.8"/>
        <path d="M20 8 C26 14 30 20 26 26 C22 32 14 30 12 24 C10 18 14 12 20 8Z" fill="#86efac" opacity="0.6"/>
        <circle cx="20" cy="22" r="4" fill="#fff" opacity="0.9"/>
      </svg>
    </div>
    <div>
      <div className="text-white font-bold text-lg leading-none tracking-wide">SafraViva</div>
      <div className="text-green-300 text-xs leading-none">Inteligência para o Campo & Pecuária</div>
    </div>
  </div>
);

const navItems = [
  { icon: "🏠", label: "Início" },
  { icon: "🏢", label: "Empresas Agrícolas", tab: 0 },
  { icon: "🌿", label: "Propriedades", tab: 1 },
  { icon: "🗂️", label: "Talhões" },
  { icon: "⚙️", label: "Atividades" },
  { icon: "💰", label: "Financeiro" },
  { icon: "📦", label: "Insumos" },
  { icon: "📊", label: "Relatórios" },
  { icon: "🗺️", label: "Mapa" },
  { icon: "⚙️", label: "Configurações" },
];

function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="w-52 min-h-screen bg-green-900 flex flex-col py-4 shrink-0">
      <div className="px-4 mb-8">
        <Logo />
      </div>
      <nav className="flex-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => item.tab !== undefined && onTabChange(item.tab)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors
              ${item.tab === activeTab
                ? "bg-green-600 text-white"
                : "text-green-200 hover:bg-green-800 hover:text-white"}`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="px-4 mt-4 pt-4 border-t border-green-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">KC</div>
          <div>
            <div className="text-white text-sm font-semibold leading-none">Karla Klemke</div>
            <div className="text-green-300 text-xs mt-0.5">Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ breadcrumb, page }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <div className="text-sm text-gray-500">
        <span className="text-gray-400">{breadcrumb}</span>
        <span className="mx-1 text-gray-300">›</span>
        <span className="font-semibold text-gray-700">{page}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>📅 15 de Maio de 2024</span>
        <span className="relative">
          🔔
          <span className="absolute -top-1 -right-1 bg-orange-400 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">3</span>
        </span>
        <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer">👤</span>
      </div>
    </div>
  );
}

function Field({ label, required, children, className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function Input({ placeholder, className = "", type = "text" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition ${className}`}
    />
  );
}

function Select({ placeholder, options = [] }) {
  return (
    <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white appearance-none transition">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-green-700 font-bold text-sm mb-3 mt-5 first:mt-0 pb-1 border-b border-green-100">
      {children}
    </h3>
  );
}

function EmpresaForm() {
  const [empresaAtiva, setEmpresaAtiva] = useState(true);
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <TopBar breadcrumb="Empresas Agrícolas" page="Novo Cadastro" />
      <div className="p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-gray-800">Cadastro de Empresa Agrícola</h2>
        <p className="text-sm text-gray-400 mb-5">Preencha as informações da empresa agrícola.</p>

        <SectionTitle>Dados Cadastrais</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Razão Social" required><Input placeholder="Ex.: Agropecuária Boa Vista Ltda." /></Field>
          <Field label="Nome Fantasia"><Input placeholder="Ex.: Fazenda Boa Vista" /></Field>
          <Field label="CNPJ" required><Input placeholder="00.000.000/0001-00" /></Field>
          <Field label="Inscrição Estadual"><Input placeholder="Ex.: 123.456.789.123" /></Field>
          <Field label="Inscrição Municipal"><Input placeholder="Ex.: 123456" /></Field>
        </div>

        <SectionTitle>Contato</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Telefone"><Input placeholder="(00) 00000-0000" /></Field>
          <Field label="E-mail" required><Input placeholder="exemplo@empresa.com.br" type="email" /></Field>
          <Field label="Website"><Input placeholder="www.empresa.com.br" /></Field>
        </div>

        <SectionTitle>Endereço Sede</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Field label="CEP">
            <div className="flex gap-2">
              <Input placeholder="00000-000" />
              <button className="shrink-0 border border-green-600 text-green-700 text-xs px-3 py-2 rounded-md hover:bg-green-50 font-semibold transition whitespace-nowrap">
                Buscar CEP
              </button>
            </div>
          </Field>
          <Field label="Logradouro" className="col-span-2"><Input placeholder="Ex.: Rua das Palmeiras" /></Field>
          <Field label="Número"><Input placeholder="Ex.: 123" /></Field>
          <Field label="Complemento"><Input placeholder="Ex.: Sala 01" /></Field>
          <Field label="Bairro"><Input placeholder="Ex.: Centro" /></Field>
          <Field label="Cidade" required><Select placeholder="Selecione" /></Field>
          <Field label="Estado" required><Select placeholder="Selecione" /></Field>
        </div>

        <SectionTitle>Informações Adicionais</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Data de Fundação">
            <div className="relative">
              <Input placeholder="dd/mm/aaaa" />
            </div>
          </Field>
          <Field label="Tipo de Empresa"><Select placeholder="Selecione o tipo" /></Field>
          <Field label="Regime Tributário"><Select placeholder="Selecione o regime" /></Field>
        </div>
        <Field label="Observações" className="mt-3">
          <textarea
            rows={4}
            placeholder="Informações adicionais sobre a empresa..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none transition"
          />
          <div className="text-right text-xs text-gray-400 -mt-1">0/500 caracteres</div>
        </Field>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setEmpresaAtiva(!empresaAtiva)}
            className={`relative w-11 h-6 rounded-full transition-colors ${empresaAtiva ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${empresaAtiva ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
          <span className="text-sm text-gray-600">Empresa ativa</span>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
          <button className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
          <button className="px-5 py-2 text-sm font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition">Salvar Empresa</button>
        </div>
      </div>
    </div>
  );
}

function MapPin() {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg relative flex items-center justify-center overflow-hidden border border-gray-200">
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
      />
      <div className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-500 shadow z-10 flex flex-col items-center gap-1">
        <span className="text-2xl">📍</span>
        <span>Mato Grosso, BR</span>
      </div>
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button className="w-6 h-6 bg-white border border-gray-300 rounded text-sm shadow hover:bg-gray-50">+</button>
        <button className="w-6 h-6 bg-white border border-gray-300 rounded text-sm shadow hover:bg-gray-50">−</button>
      </div>
    </div>
  );
}

function PropriedadeForm() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <TopBar breadcrumb="Propriedades" page="Nova Propriedade" />
      <div className="p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-gray-800">Cadastro de Propriedade</h2>
        <p className="text-sm text-gray-400 mb-5">Preencha as informações da propriedade rural.</p>

        <SectionTitle>Vinculação</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Empresa Agrícola" required><Select placeholder="Selecione a empresa" /></Field>
          <Field label="Nome da Fazenda / Propriedade" required><Input placeholder="Ex.: Fazenda Santa Maria" /></Field>
        </div>

        <SectionTitle>Identificação Legal</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Field label="CAR" required>
            <div className="relative">
              <Input placeholder="Ex.: MT-5104851-1234.5678.9012.3456" />
              <span className="absolute right-2 top-2 text-gray-400 text-xs cursor-help">ⓘ</span>
            </div>
          </Field>
          <Field label="CCIR">
            <div className="relative">
              <Input placeholder="Ex.: 123.456.789.012-3" />
              <span className="absolute right-2 top-2 text-gray-400 text-xs cursor-help">ⓘ</span>
            </div>
          </Field>
          <Field label="NIRF">
            <div className="relative">
              <Input placeholder="Ex.: 5.123.456-7" />
              <span className="absolute right-2 top-2 text-gray-400 text-xs cursor-help">ⓘ</span>
            </div>
          </Field>
        </div>

        <SectionTitle>Localização</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Estado" required><Select placeholder="Selecione" options={["Mato Grosso","São Paulo","Minas Gerais","Goiás","Paraná"]} /></Field>
          <Field label="Cidade" required><Select placeholder="Selecione" /></Field>
          <Field label="Logradouro / Acesso"><Input placeholder="Ex.: Rodovia BR-163, KM 845" /></Field>
          <Field label="CEP"><Input placeholder="00000-000" /></Field>
          <Field label="Ponto de Referência" className="col-span-2"><Input placeholder="Ex.: Após a ponte, entrar à direita" /></Field>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <SectionTitle>Coordenadas Geográficas</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Latitude" required><Input placeholder="Ex.: -12.34567890" /></Field>
              <Field label="Longitude" required><Input placeholder="Ex.: -55.67890123" /></Field>
            </div>
            <button className="flex items-center gap-2 bg-green-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-800 transition font-semibold">
              📍 Abrir Mapa
            </button>
          </div>
          <div className="h-44 mt-5">
            <MapPin />
            <p className="text-xs text-gray-400 mt-1 text-center">*Clique no mapa para definir a localização da sede da propriedade.</p>
          </div>
        </div>

        <SectionTitle>Dados Físicos</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Área Total (ha)" required><Input placeholder="Ex.: 1.500,00" /></Field>
          <Field label="Área Agricultável (ha)" required><Input placeholder="Ex.: 1.100,00" /></Field>
          <Field label="Área de Preservação (APP + Reserva) (ha)" required><Input placeholder="Ex.: 400,00" /></Field>
          <Field label="Área de Pastagem (ha)"><Input placeholder="Ex.: 0,00" /></Field>
          <Field label="Área de Vegetação Nativa (ha)"><Input placeholder="Ex.: 0,00" /></Field>
          <Field label="Altitude Média (m)"><Input placeholder="Ex.: 450" /></Field>
        </div>

        <SectionTitle>Outras Informações</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Tipo de Solo Predominante"><Select placeholder="Selecione" /></Field>
          <Field label="Classe de Capacidade de Uso"><Select placeholder="Selecione" /></Field>
          <Field label="Observações">
            <textarea
              rows={3}
              placeholder="Informações adicionais sobre a propriedade..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none transition"
            />
            <div className="text-right text-xs text-gray-400 -mt-1">0/500 caracteres</div>
          </Field>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
          <button className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
          <button className="px-5 py-2 text-sm font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition">Salvar Propriedade</button>
        </div>
      </div>
    </div>
  );
}

const TABS = ["Empresa Agrícola", "Propriedade"];

export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <div className="flex min-h-screen font-sans bg-gray-50" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar activeTab={tab} onTabChange={setTab} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab switcher */}
        <div className="flex gap-0 bg-white border-b border-gray-200 px-6 pt-3">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
                ${tab === i
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {t === "Empresa Agrícola" ? "🏢 " : "🌿 "}{t}
            </button>
          ))}
        </div>
        {tab === 0 ? <EmpresaForm /> : <PropriedadeForm />}
      </div>
    </div>
  );
}

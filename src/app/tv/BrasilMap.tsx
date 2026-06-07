"use client";

interface Props {
  porUf: Record<string, number>;
  maxCount: number;
}

function getFill(count: number, max: number): string {
  if (!count || !max) return "#1f2937";
  const t = count / max;
  if (t < 0.15) return "#1e3a5f";
  if (t < 0.35) return "#1d4ed8";
  if (t < 0.65) return "#2563eb";
  if (t < 0.85) return "#3b82f6";
  return "#60a5fa";
}

// States small enough that showing a count number would cause overlap
const TINY_STATES = new Set(["DF", "AL", "SE", "PB", "PE"]);

// ViewBox 0 0 460 540
const STATES: { id: string; d: string; lx: number; ly: number }[] = [
  // Norte
  { id: "RR", lx: 137, ly: 27,  d: "M100,2 L174,2 L182,52 L100,52 Z" },
  { id: "AP", lx: 243, ly: 27,  d: "M218,2 L268,2 L268,52 L218,52 Z" },
  { id: "AM", lx: 95,  ly: 130, d: "M10,52 L100,52 L100,2 L174,2 L182,52 L218,52 L218,196 L148,196 L142,178 L88,178 L88,210 L10,210 Z" },
  { id: "PA", lx: 248, ly: 120, d: "M182,18 L218,18 L218,2 L268,2 L268,52 L300,52 L300,196 L218,196 L182,52 Z" },
  { id: "RO", lx: 118, ly: 225, d: "M88,178 L142,178 L148,196 L148,264 L88,264 Z" },
  { id: "AC", lx: 44,  ly: 186, d: "M2,162 L88,162 L88,178 L88,210 L2,210 Z" },
  { id: "TO", lx: 268, ly: 208, d: "M240,148 L296,148 L296,196 L240,264 Z" },

  // Nordeste
  { id: "MA", lx: 294, ly: 142, d: "M272,88 L316,88 L316,196 L272,196 Z" },
  { id: "PI", lx: 336, ly: 169, d: "M316,100 L356,100 L356,238 L316,238 Z" },
  { id: "CE", lx: 378, ly: 124, d: "M356,88 L400,88 L400,160 L356,160 Z" },
  { id: "RN", lx: 413, ly: 127, d: "M390,102 L436,102 L436,152 L390,152 Z" },
  { id: "PB", lx: 409, ly: 161, d: "M382,150 L436,150 L436,172 L382,172 Z" },
  { id: "PE", lx: 392, ly: 177, d: "M348,162 L436,162 L436,192 L348,192 Z" },
  { id: "AL", lx: 406, ly: 205, d: "M388,190 L424,190 L424,220 L388,220 Z" },
  { id: "SE", lx: 384, ly: 205, d: "M372,190 L396,190 L396,220 L372,220 Z" },
  { id: "BA", lx: 348, ly: 272, d: "M296,192 L372,192 L396,220 L424,220 L408,322 L296,322 Z" },

  // Centro-Oeste
  { id: "MT", lx: 194, ly: 250, d: "M148,178 L240,178 L240,322 L148,322 Z" },
  { id: "GO", lx: 268, ly: 305, d: "M240,264 L296,264 L296,340 L240,340 Z" },
  { id: "DF", lx: 266, ly: 292, d: "M255,282 L278,282 L278,302 L255,302 Z" },
  { id: "MS", lx: 196, ly: 374, d: "M152,322 L240,322 L240,420 L152,420 Z" },

  // Sudeste
  { id: "MG", lx: 312, ly: 348, d: "M240,268 L378,268 L378,390 L240,390 Z" },
  { id: "ES", lx: 362, ly: 338, d: "M346,308 L378,308 L378,368 L346,368 Z" },
  { id: "RJ", lx: 330, ly: 391, d: "M304,370 L358,370 L358,412 L304,412 Z" },
  { id: "SP", lx: 258, ly: 400, d: "M212,354 L304,354 L304,438 L212,438 Z" },

  // Sul
  { id: "PR", lx: 240, ly: 436, d: "M208,412 L272,412 L272,460 L208,460 Z" },
  { id: "SC", lx: 240, ly: 482, d: "M208,460 L272,460 L272,504 L208,504 Z" },
  { id: "RS", lx: 220, ly: 496, d: "M176,456 L264,456 L264,536 L176,536 Z" },
];

export default function BrasilMap({ porUf, maxCount }: Props) {
  return (
    <svg
      viewBox="0 0 460 540"
      className="h-full w-auto max-w-full"
      style={{ overflow: "visible" }}
    >
      {STATES.map(({ id, d, lx, ly }) => {
        const count = porUf[id] ?? 0;
        const fill = getFill(count, maxCount);
        const hasData = count > 0;
        const tiny = TINY_STATES.has(id);

        return (
          <g key={id}>
            <path
              d={d}
              fill={fill}
              stroke="#0f172a"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* UF label with dark halo to prevent overlap */}
            <text
              x={lx}
              y={hasData && !tiny ? ly - 5 : ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={hasData ? "#f1f5f9" : "#6b7280"}
              stroke="#0f172a"
              strokeWidth="2.5"
              paintOrder="stroke fill"
              fontSize={tiny ? 6 : 7.5}
              fontWeight="bold"
              fontFamily="ui-monospace, monospace"
              style={{ pointerEvents: "none" }}
            >
              {id}
            </text>
            {/* Count — only for non-tiny states with data */}
            {hasData && !tiny && (
              <text
                x={lx}
                y={ly + 7}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth="2.5"
                paintOrder="stroke fill"
                fontSize={9}
                fontWeight="900"
                fontFamily="ui-monospace, monospace"
                style={{ pointerEvents: "none" }}
              >
                {count}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

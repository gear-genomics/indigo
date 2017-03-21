/*
============================================================================
Indigo: InDel Discovery in Sanger Chromatograms
============================================================================
Copyright (C) 2017 Tobias Rausch

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
============================================================================
Contact: Tobias Rausch (rausch@embl.de)
============================================================================
*/

#ifndef ABIF_H
#define ABIF_H

#include <sdsl/suffix_arrays.hpp>
#include <htslib/faidx.h>
#include <fstream>
#include <iomanip>
#include <boost/dynamic_bitset.hpp>
#include <boost/program_options/cmdline.hpp>
#include <boost/program_options/options_description.hpp>
#include <boost/program_options/parsers.hpp>
#include <boost/program_options/variables_map.hpp>
#include <boost/date_time/posix_time/posix_time.hpp>
#include <boost/date_time/gregorian/gregorian.hpp>
#include <boost/iostreams/stream.hpp>
#include <boost/iostreams/stream_buffer.hpp>
#include <boost/iostreams/device/file.hpp>
#include <boost/iostreams/filtering_stream.hpp>
#include <boost/iostreams/filter/zlib.hpp>
#include <boost/iostreams/filter/gzip.hpp>
#include <boost/filesystem.hpp>
#include <boost/progress.hpp>

namespace indigo
{

struct Abif {
  std::string key;
  std::string name;
  int32_t number;
  int16_t etype;
  int16_t esize;
  int32_t nelements;
  int32_t dsize;
  int32_t doffset;
};

struct Trace {
  typedef std::vector<int16_t> TMountains;
  typedef std::vector<uint8_t> TQual;
  
  std::string acgtOrder;
  std::string basecalls1;
  std::string basecalls2;
  TQual qual;
  TMountains basecallpos;
  TMountains peaks1;
  TMountains peaks2;
  std::vector<TMountains> trace;
  std::vector<TMountains> traceACGT;

  Trace() {
    trace.resize(4);
    traceACGT.resize(4);
  }
};


struct BaseCalls {
  typedef std::vector<int16_t> TPosition;
  typedef std::vector<float> TPeak;
  typedef std::vector<TPeak> TPeakACGT;
  typedef std::vector<TPosition> TPositionACGT;
  typedef std::vector<uint16_t> TBCPos;
  
  bool indelshift;
  uint16_t ltrim;
  uint16_t rtrim;
  uint16_t breakpoint;
  std::string consensus;
  std::string primary;
  std::string secondary;
  TBCPos bcPos;
  TPeakACGT peak;
  TPositionACGT pos;

  BaseCalls() {
    peak.resize(4);
    pos.resize(4);
  }
};
  
inline void
maxima(std::vector<int16_t> const& trace, std::vector<int16_t>& pos) {
  for(uint16_t i = 1; i < trace.size() - 1; ++i) {
    if (((trace[i-1] <= trace[i]) && (trace[i] > trace[i+1])) || ((trace[i-1] < trace[i]) && (trace[i] >= trace[i+1]))) pos.push_back(i);
  }
}

inline std::pair<int16_t, int16_t>
peak(std::vector<int16_t> const& trace, std::vector<int16_t> const& maxima, int16_t s, int16_t e) {
  int16_t bestVal = 0;
  int16_t bestIdx = 0;
  for(uint32_t i = 0; i<maxima.size(); ++i) {
    if ((maxima[i] > s) && (maxima[i] < e)) {
      if (trace[maxima[i]] > bestVal) {
	bestIdx = maxima[i];
	bestVal = trace[maxima[i]];
      }
    }
  }
  return std::make_pair(bestVal, bestIdx);
}

inline char
iupac(std::vector<int16_t> const& p) {
  if (p.size() == 1) {
    if (p[0] == 0) return 'A';
    else if (p[0] == 1) return 'C';
    else if (p[0] == 2) return 'G';
    else if (p[0] == 3) return 'T';
  } else if (p.size() == 2) {
    if ((p[0] == 0) && (p[1] == 2)) return 'R';
    else if ((p[0] == 1) && (p[1] == 3)) return 'Y';
    else if ((p[0] == 1) && (p[1] == 2)) return 'S';
    else if ((p[0] == 0) && (p[1] == 3)) return 'W';
    else if ((p[0] == 2) && (p[1] == 3)) return 'K';
    else if ((p[0] == 0) && (p[1])) return 'M';
  }
  return 'N';
}

inline char
iupac(char const one, char const two) {
  std::vector<int16_t> p(2);
  if (one == 'A') p[0] = 0;
  else if (one == 'C') p[0] = 1;
  else if (one == 'G') p[0] = 2;
  else if (one == 'T') p[0] = 3;
  if (two == 'A') p[1] = 0;
  else if (two == 'C') p[1] = 1;
  else if (two == 'G') p[1] = 2;
  else if (two == 'T') p[1] = 3;
  if (p[1] < p[0]) {
    int16_t tmp = p[0];
    p[0] = p[1];
    p[1] = tmp;
  }
  return iupac(p);
}
  

// Big endian machine?
inline bool
bigendian() {
  int num = 1;
  if (*(char *)&num == 1) return false;
  else return true;
}

inline void
plotByte(char byte) {
  for (int i = 7; 0<=i; i--) printf("%d", (byte>>i) & 0x01);
  std::cout << std::endl;
}

inline void
plotUInt32(uint32_t byte) {
  for (int i = 31; 0<=i; i--) printf("%d", (byte>>i) & 0x01);
  std::cout << std::endl;
}


inline std::string
readBinStr(std::vector<char> const& buffer, int32_t pos, int32_t len) {
  return std::string(buffer.begin() + pos, buffer.begin() + pos + len);
}

inline uint8_t
readBinUI8(std::vector<char> const& buffer, int32_t pos) {
  return (uint8_t)(buffer[pos]);
}

inline int32_t
readBinI32(std::vector<char> const& buffer, int32_t pos) {
  return (((uint32_t) 0) | ((uint8_t)(buffer[pos])<<24) | ((uint8_t)(buffer[pos+1])<<16) | ((uint8_t)(buffer[pos+2])<<8) | ((uint8_t)(buffer[pos+3])));
}

inline uint16_t
readBinUI16(std::vector<char> const& buffer, int32_t pos) {
  return (((uint16_t) 0) | ((uint8_t)(buffer[pos])<<8) | ((uint8_t)(buffer[pos+1])));
}

inline int16_t
readBinI16(std::vector<char> const& buffer, int32_t pos) {
  return (((uint16_t) 0) | ((uint8_t)(buffer[pos])<<8) | ((uint8_t)(buffer[pos+1])));
}

inline std::string
removeNonDna(std::string const& str) {
  std::string out;
  for(uint32_t i = 0; i<str.size();++i) {
    if ((str[i] == 'A') || (str[i] == 'C') || (str[i] == 'G') || (str[i] == 'T')) out = out.append(str, i, 1);
  }
  return out;
}

inline bool
readab(boost::filesystem::path const& filename, Trace& tr) {
  // Read the mountains
  std::ifstream bfile(filename.string().c_str(), std::ios_base::binary | std::ios::ate);
  std::streamsize bsize = bfile.tellg();
  bfile.seekg(0, std::ios::beg);
  std::vector<char> buffer(bsize);
  if (bfile.read(buffer.data(), bsize)) {
    std::string filetype = readBinStr(buffer, 0, 4);
    if (filetype != "ABIF") {
      std::cerr << "File is not in ABIF format!" << std::endl;
      bfile.close();
      return false;
    }
    //int16_t version = readBinI16(buffer, 4);
    //std::string name = readBinStr(buffer, 6, 4);
    //int32_t number = readBinI32(buffer, 10);
    //int16_t etype = readBinI16(buffer, 14);
    int16_t esize = readBinI16(buffer, 16);
    int32_t nelements = readBinI32(buffer, 18);
    int32_t offset = readBinI32(buffer, 26);
    //int32_t handle = readBinI32(buffer, 30);
    //std::cout << filetype << '\t' << version << '\t' << name << '\t' << number << '\t' << etype << '\t' << esize << '\t' << nelements << '\t' << offset << '\t' << handle << std::endl;

    // Get all ABIF records
    std::vector<Abif> abi;
    for (int32_t i = 0; i < nelements; ++i) {
      int32_t ofs = i * esize + offset;
      std::vector<char> entry(buffer.begin()+ofs, buffer.begin()+ofs+esize);
      Abif ab;
      ab.name = readBinStr(entry, 0, 4);
      ab.number = readBinI32(entry, 4);
      ab.etype = readBinI16(entry, 8);
      ab.esize = readBinI16(entry, 10);
      ab.nelements = readBinI32(entry, 12);
      ab.dsize = readBinI32(entry, 16);
      ab.doffset = readBinI32(entry, 20);
      ab.key = ab.name + "." + boost::lexical_cast<std::string>(ab.number);
      if (ab.name == "PCON") ab.etype = 1;
      abi.push_back(ab);
      //std::cout << ab.key << "\t" << ab.name << "\t" << ab.number << "\t" << ab.etype << "\t" << ab.esize << "\t" << ab.nelements << "\t" << ab.dsize << "\t" << ab.doffset << std::endl;
    }

    // Get what we need and dump the rest of this stupid format
    for(uint32_t i = 0; i < abi.size(); ++i) {
      int32_t ofs = i * esize + offset;
      int32_t ofsraw = ofs + 20;
      if (abi[i].dsize > 4) ofsraw = abi[i].doffset;
      std::vector<char> entry(buffer.begin()+ofsraw, buffer.begin()+ofsraw + abi[i].nelements*abi[i].esize + 1);
      if (abi[i].etype == 2) {
	if (abi[i].key == "PBAS.2") tr.basecalls1 = removeNonDna(readBinStr(entry, 0, entry.size()));
	else if (abi[i].key == "P2BA.1") tr.basecalls2 = removeNonDna(readBinStr(entry, 0, entry.size()));
	else if (abi[i].key == "FWO_.1") tr.acgtOrder = readBinStr(entry, 0, entry.size());
      } else if (abi[i].etype == 4) {
	if (abi[i].key == "PLOC.2") {
	  for(int32_t k = 0; k < abi[i].nelements; ++k) {
	    tr.basecallpos.push_back(readBinI16(entry, k*2));
	  }
	} else if (abi[i].key == "P1AM.1") {
	  for(int32_t k = 0; k < abi[i].nelements; ++k) {
	    tr.peaks1.push_back(readBinI16(entry, k*2));
	  }
	} else if (abi[i].key == "P2AM.1") {
	  for(int32_t k = 0; k < abi[i].nelements; ++k) {
	    tr.peaks2.push_back(readBinI16(entry, k*2));
	  }
	} else if (abi[i].key == "DATA.9") {
	  for(int32_t k = 0; k < abi[i].nelements; ++k) {
	    tr.trace[0].push_back(readBinI16(entry, k*2));
	  }
	} else if (abi[i].key == "DATA.10") {
	  for(int32_t k = 0; k < abi[i].nelements; ++k) {
	    tr.trace[1].push_back(readBinI16(entry, k*2));
	  }
	} else if (abi[i].key == "DATA.11") {
	  for(int32_t k = 0; k < abi[i].nelements; ++k) {
	    tr.trace[2].push_back(readBinI16(entry, k*2));
	  }
	} else if (abi[i].key == "DATA.12") {
	  for(int32_t k = 0; k < abi[i].nelements; ++k) {
	    tr.trace[3].push_back(readBinI16(entry, k*2));
	  }
	}
      } else if (abi[i].etype == 1) {
	if (abi[i].key == "PCON.2") {
	  for(int32_t k = 0; k < abi[i].nelements; ++k) {
	    tr.qual.push_back(readBinUI8(entry, k));
	  }
	}
      }
    }
  }
  bfile.close();

  // Resize basecalls to position vector
  tr.basecalls1.resize(tr.basecallpos.size());
  tr.basecalls2.resize(tr.basecallpos.size());
  tr.qual.resize(tr.basecallpos.size());

  // Assign trace
  for(uint32_t i = 0; i<tr.acgtOrder.size(); ++i) {
    if (tr.acgtOrder[i] == 'A') tr.traceACGT[0] = tr.trace[i];
    else if (tr.acgtOrder[i] == 'C') tr.traceACGT[1] = tr.trace[i];
    else if (tr.acgtOrder[i] == 'G') tr.traceACGT[2] = tr.trace[i];
    else if (tr.acgtOrder[i] == 'T') tr.traceACGT[3] = tr.trace[i];
  }
  
  // Close input file
  return true;
}


inline void
basecall(Trace const& tr, BaseCalls& bc, float sigratio) {
  typedef std::vector<int16_t> TMount;
  typedef std::vector<TMount> TMountACGT;
  TMountACGT peakACGT(4);
  for(uint32_t k = 0; k<4; ++k) maxima(tr.traceACGT[k], peakACGT[k]);

  // Get peak regions
  std::vector<float> st;
  std::vector<float> ed;
  int16_t oldVal = 0;
  int16_t lastDiff = 0;
  for(uint32_t i = 0; i<tr.basecallpos.size(); ++i) {
    lastDiff = tr.basecallpos[i] - oldVal;
    st.push_back((float) tr.basecallpos[i] - 0.5 * (float) lastDiff);
    if (i > 0) ed.push_back((float) tr.basecallpos[i-1] + 0.5 * (float) lastDiff);
    oldVal = tr.basecallpos[i];
  }
  ed.push_back(tr.basecallpos[tr.basecallpos.size()-1] + 0.5 * lastDiff);

  // Call peaks
  std::vector<char> primary;
  std::vector<char> secondary;
  std::vector<char> consensus;
  for(uint32_t i = 0; i<st.size(); ++i) {
    typedef std::pair<int16_t, int16_t> TPeak;
    TPeak p[4];
    for(uint32_t k = 0; k<4; ++k) p[k] = peak(tr.traceACGT[k], peakACGT[k], st[i], ed[i]);
    if ((p[0].first == 0) && (p[1].first == 0) && (p[2].first == 0) && (p[3].first == 0)) continue;
    int16_t maxVal = 0;
    for(uint32_t k = 0; k<4; ++k) {
      if (p[k].first > maxVal) maxVal = p[k].first;
      bc.peak[k].push_back(p[k].first);
      bc.pos[k].push_back(p[k].second);
    }
    float srat[4];
    float bestRat = 0;
    int16_t bestIdx = 0;
    int32_t validBases = 0;
    for(uint32_t k = 0; k<4; ++k) {
      srat[k] = (float) p[k].first / (float)maxVal;
      if (srat[k] >= sigratio) ++validBases;
      if (srat[k] > bestRat) {
	bestRat = srat[k];
	bestIdx = k;
      }
    }
    bc.bcPos.push_back(p[bestIdx].second);
    if ((validBases == 4) || (validBases == 0)) {
      primary.push_back('N');
      secondary.push_back('N');
      consensus.push_back('N');
    } else if (validBases > 1) {
      if (bestIdx == 0) primary.push_back('A');
      else if (bestIdx == 1) primary.push_back('C');
      else if (bestIdx == 2) primary.push_back('G');
      else if (bestIdx == 3) primary.push_back('T');
      std::vector<int16_t> leftover;
      for(int32_t k = 0; k<4; ++k) 
	if ((k != bestIdx) && (srat[k] >= sigratio)) leftover.push_back(k);
      secondary.push_back(iupac(leftover));
      consensus.push_back('N');
    } else {
      if (bestIdx == 0) {
	primary.push_back('A');
	secondary.push_back('A');
	consensus.push_back('A');
      } else if (bestIdx == 1) {
	primary.push_back('C');
	secondary.push_back('C');
	consensus.push_back('C');
      } else if (bestIdx == 2) {
	primary.push_back('G');
	secondary.push_back('G');
	consensus.push_back('G');
      } else if (bestIdx == 3) {
	primary.push_back('T');
	secondary.push_back('T');
	consensus.push_back('T');
      }
    }
  }
  bc.primary = std::string(primary.begin(), primary.end());
  bc.secondary = std::string(secondary.begin(), secondary.end());
  bc.consensus = std::string(consensus.begin(), consensus.end());
}


inline std::string
trimmedPSeq(BaseCalls const& bc) {
  uint16_t len = bc.primary.size() - bc.ltrim - bc.rtrim;
  return bc.primary.substr(bc.ltrim, len);
}

inline std::string
trimmedSecSeq(BaseCalls const& bc) {
  uint16_t len = bc.secondary.size() - bc.ltrim - bc.rtrim;
  return bc.secondary.substr(bc.ltrim, len);
}

inline std::string
trimmedCSeq(BaseCalls const& bc) {
  uint16_t len = bc.consensus.size() - bc.ltrim - bc.rtrim;
  return bc.consensus.substr(bc.ltrim, len);
}

inline uint16_t
_estimateCut(std::vector<double> const& score) {
  double cumscore = 0;
  uint16_t wsize = 50;
  uint16_t hsize = score.size() / 2;
  for(uint16_t i = 0; ((i < wsize) && (i < hsize)); ++i) cumscore += score[i];
  for(uint16_t k = wsize; k < hsize; ++k) {
    cumscore -= score[k-wsize];
    cumscore += score[k];
    if (cumscore > 0) return k;
  }
  return hsize;
}

inline uint16_t
_estimateCut(std::string const& seq) {
  uint16_t trim = 50;  // Default trim size
  uint16_t ncount = 0;
  uint16_t wsize = trim;
  uint16_t hsize = seq.size() / 2;
  
  for(uint16_t i = 0; ((i < wsize) && (i < hsize)); ++i)
    if ((seq[i] != 'A') && (seq[i] != 'C') && (seq[i] != 'G') && (seq[i] != 'T')) ++ncount;
  for(uint16_t k = wsize; k < hsize; ++k) {
    if ((seq[k-wsize] != 'A') && (seq[k-wsize] != 'C') && (seq[k-wsize] != 'G') && (seq[k-wsize] != 'T')) --ncount;
    if ((seq[k] != 'A') && (seq[k] != 'C') && (seq[k] != 'G') && (seq[k] != 'T')) ++ncount;
    if ((float) ncount / (float) wsize >= 0.1) trim = k;   // take last k above threshold;
  }
  return trim;
}
     

inline bool
estimateTrim(BaseCalls& bc) {
  bc.ltrim = _estimateCut(bc.secondary);
  bc.rtrim = _estimateCut(std::string(bc.secondary.rbegin(), bc.secondary.rend()));

  // Check overall trim size
  if ((uint32_t) (bc.ltrim + bc.rtrim + 10) >= (uint32_t) bc.secondary.size()) {
    std::cerr << "Poor quality Sanger trace where trim sizes are larger than the sequence size!" << std::endl;
    return false;
  }
  return true;
}
  
 
inline bool
estimateTrim(BaseCalls& bc, Trace const& tr) {
  double cutoff = 0.1;

  typedef std::vector<double> TScore;
  TScore score;
  for(uint32_t i = 0; i < tr.qual.size(); ++i) score.push_back(cutoff - std::pow((double) 10, (double) tr.qual[i] / (double) -10.0));

  bc.ltrim = _estimateCut(score);
  TScore rev(score.rbegin(), score.rend());
  bc.rtrim = _estimateCut(rev);

  // Check overall trim size
  if ((uint32_t) (bc.ltrim + bc.rtrim + 10) >= (uint32_t) bc.secondary.size()) {
    std::cerr << "Poor quality Sanger trace where trim sizes are larger than the sequence size!" << std::endl;
    return false;
  }
  return true;
}

template<typename TConfig>
inline bool
findBreakpoint(TConfig const& c, BaseCalls& bc) {
  int32_t ncount = 0;
  for(uint32_t i = 0; ((i<c.kmer) && (i<bc.consensus.size())); ++i)
    if (bc.consensus[i] == 'N') ++ncount;
  std::vector<float> nratio;
  nratio.push_back((float)ncount / (float)c.kmer);  
  for(uint32_t i = c.kmer; i < bc.consensus.size(); ++i) {
    if (bc.consensus[i-c.kmer] == 'N') --ncount;
    if (bc.consensus[i] == 'N') ++ncount;
    nratio.push_back((float)ncount / (float)c.kmer);
  }
  float totalN = 0;
  for(uint32_t i = 0; i < nratio.size(); ++i) totalN += nratio[i];
  float leftSum = nratio[0];
  float rightSum = totalN - leftSum;
  float bestDiff = 0;
  bool traceleft = true;
  bc.breakpoint = 0;
  for(uint32_t i = 1; i < nratio.size() - 1; ++i) {
    float right = rightSum / (float)(nratio.size() - i);
    float left = leftSum / (float)i;
    float diff = std::abs(right - left);
    if (diff > bestDiff) {
      bc.breakpoint = i;
      bestDiff = diff;
      if (left < right) traceleft = true;
      else traceleft = false;
    }
    leftSum += nratio[i];
    rightSum -= nratio[i];
  }
  bc.indelshift = true;
  // Forward breakpoint to first N
  for(uint32_t i = bc.breakpoint; i < bc.consensus.size(); ++i) {
    if (bc.consensus[i] == 'N') {
      bc.breakpoint = i;
      break;
    }
  }
  if ((bc.breakpoint <= bc.ltrim) || ((bc.consensus.size() - bc.breakpoint <= bc.rtrim)) || (bestDiff < 0.25)) {
    // No indel shift
    bc.indelshift = false;
    bc.breakpoint = bc.consensus.size() - bc.rtrim - 1;
    traceleft = true;
    bestDiff = 0;
  }


  // Flip trace if indelshift happens to the left
  if (!traceleft) {
    bc.breakpoint = (uint16_t) (bc.consensus.size() - bc.breakpoint - 1);
    std::reverse(bc.consensus.begin(), bc.consensus.end());
    std::reverse(bc.primary.begin(), bc.primary.end());
    std::reverse(bc.secondary.begin(), bc.secondary.end());
    uint16_t tmptrim = bc.ltrim;
    bc.ltrim = bc.rtrim;
    bc.rtrim = tmptrim;
    for(uint32_t k = 0; k<4; ++k) {
      std::reverse(bc.peak[k].begin(), bc.peak[k].end());
      std::reverse(bc.pos[k].begin(), bc.pos[k].end());
    }
  }

  return true;
}
 

}

#endif

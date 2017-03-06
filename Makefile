DEBUG ?= 0
STATIC ?= 0

# Submodules
PWD = $(shell pwd)
SDSL_ROOT ?= ${PWD}/src/sdslLite
EBROOTHTSLIB ?= ${PWD}/src/htslib/
BOOST_ROOT ?= ${PWD}/src/modular-boost

# Flags
CXX=g++
CXXFLAGS += -std=c++11 -O3 -DNDEBUG -isystem ${EBROOTHTSLIB} -isystem ${BOOST_ROOT} -isystem ${SDSL_ROOT}/include -pedantic -W -Wall
LDFLAGS += -L${SDSL_ROOT}/lib -L${BOOST_ROOT}/stage/lib -lboost_iostreams -lboost_filesystem -lboost_system -lboost_program_options -lboost_date_time -lsdsl -ldivsufsort -ldivsufsort64 -L${EBROOTHTSLIB}

ifeq (${STATIC}, 1)
	LDFLAGS += -static -static-libgcc -pthread -lhts -lz
else
	LDFLAGS += -lhts -lz -Wl,-rpath,${EBROOTHTSLIB},-rpath,${BOOST_ROOT}/stage/lib
endif

ifeq (${DEBUG}, 1)
	CXXFLAGS += -g -O0 -fno-inline -DDEBUG
else ifeq (${DEBUG}, 2)
	CXXFLAGS += -g -O0 -fno-inline -DPROFILE
	LDFLAGS += -lprofiler -ltcmalloc
else
	CXXFLAGS += -O3 -fno-tree-vectorize -DNDEBUG
endif

# External sources
SDSLSOURCES = $(wildcard src/sdsl/lib/*.cpp)
IDXSOURCES = $(wildcard src/*.cpp) $(wildcard src/*.h)
HTSLIBSOURCES = $(wildcard src/htslib/*.c) $(wildcard src/htslib/*.h)
BOOSTSOURCES = $(wildcard src/modular-boost/libs/iostreams/include/boost/iostreams/*.hpp)
PBASE=$(shell pwd)

# Targets
TARGETS = .sdsl .htslib .boost src/indigo

all:   	$(TARGETS)

.sdsl: $(SDSLSOURCES)
	cd src/sdsl/ && ./install.sh ${PBASE}/src/sdslLite && cd ../../ && touch .sdsl

.htslib: $(HTSLIBSOURCES)
	cd src/htslib && make && make lib-static && cd ../../ && touch .htslib

.boost: $(BOOSTSOURCES)
	cd src/modular-boost && ./bootstrap.sh --prefix=${PWD}/src/modular-boost --without-icu --with-libraries=iostreams,filesystem,system,program_options,date_time && ./b2 && ./b2 headers && cd ../../ && touch .boost

src/indigo: .sdsl .htslib .boost ${IDXSOURCES}
	$(CXX) $(CXXFLAGS) $@.cpp -o $@ $(LDFLAGS)

clean:
	cd src/htslib && make clean
	cd src/modular-boost && ./b2 --clean-all
	cd src/sdsl/ && ./uninstall.sh && cd ../../ && rm -rf src/sdslLite/
	rm -f $(TARGETS) $(TARGETS:=.o)

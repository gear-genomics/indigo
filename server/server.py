import os
import uuid
import re
import subprocess
import argparse
import json
from subprocess import call
from flask import Flask, send_file, send_from_directory, flash, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename


INDIGOWS = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
CORS(app)
app.config['INDIGO'] = os.path.join(INDIGOWS, "..")
app.config['UPLOAD_FOLDER'] = os.path.join(app.config['INDIGO'], "data")
app.config['MAX_CONTENT_LENGTH'] = 8 * 1024 * 1024  # maximum of 8MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in set(['scf', 'abi', 'ab1', 'ab!', 'ab', 'pdf', 'fa', 'bcf'])


uuid_re = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')


def is_valid_uuid(s):
    return uuid_re.match(s) is not None


@app.route('/api/v1/download/<uuid>/<ext>')
def download(uuid, ext):
    if is_valid_uuid(uuid):
        filename = "indigo_" + uuid + "." + ext
        if allowed_file(filename):
            sf = os.path.join(app.config['UPLOAD_FOLDER'], uuid[0:2])
            if os.path.exists(sf):
                if os.path.isfile(os.path.join(sf, filename)):
                    return send_file(os.path.join(sf, filename), attachment_filename=filename)
    return "File does not exist!"


@app.route('/api/v1/upload', methods=['POST'])
def upload_file():
    if request.method == 'POST':
        uuidstr = str(uuid.uuid4())

        # Get subfolder
        sf = os.path.join(app.config['UPLOAD_FOLDER'], uuidstr[0:2])
        if not os.path.exists(sf):
            os.makedirs(sf)

        # Default trim sizes
        ltrim = 50
        rtrim = 50

        # Experiment
        if 'showExample' in request.form.keys():
            fexpname = os.path.join(INDIGOWS, "sample.abi")
            genome = os.path.join(INDIGOWS, "sample.fa")
        else:
            if 'queryFile' not in request.files:
                return jsonify(errors=[{"title": "Chromatogram file is missing!"}]), 400
            fexp = request.files['queryFile']
            if fexp.filename == '':
                return jsonify(errors=[{"title": "Chromatogram file name is missing!"}]), 400
            if not allowed_file(fexp.filename):
                return jsonify(errors=[{"title": "Chromatogram file has incorrect file type!"}]), 400
            fexpname = os.path.join(
                sf, "indigo_" + uuidstr + "_" + secure_filename(fexp.filename))
            fexp.save(fexpname)

            # Trim size
            if 'leftTrim' in request.form.keys():
                ltrim = int(request.form['leftTrim'])
            if 'rightTrim' in request.form.keys():
                rtrim = int(request.form['rightTrim'])

            # Genome
            if 'genome' in request.form.keys():
                genome = request.form['genome']
                if genome == '':
                    return jsonify(errors=[{"title": "Genome index is missing!"}]), 400
                genome = os.path.join(app.config['INDIGO'], "fm", genome)
            elif 'fastaFile' in request.files.keys():
                fafile = request.files['fastaFile']
                if fafile.filename == '':
                    return jsonify(errors=[{"title": "Fasta file is missing!"}]), 400
                if not allowed_file(fafile.filename):
                    return jsonify(errors=[{"title": "Fasta file has incorrect file type!"}]), 400
                genome = os.path.join(
                    sf, "indigo_" + uuidstr + "_" + secure_filename(fafile.filename))
                fafile.save(genome)
            elif 'chromatogramFile' in request.files.keys():
                wtabfile = request.files['chromatogramFile']
                if wtabfile.filename == '':
                    return jsonify(errors=[{"title": "Wildtype Chromatogram file is missing!"}]), 400
                if not allowed_file(wtabfile.filename):
                    return jsonify(errors=[{"title": "Wildtype Chromatogram has incorrect file type!"}]), 400
                genome = os.path.join(
                    sf, "indigo_" + uuidstr + "_" + secure_filename(wtabfile.filename))
                wtabfile.save(genome)
            else:
                return jsonify(errors=[{"title": "No input reference file provided!"}]), 400

        # Run Rscript
        outfile = os.path.join(sf, "indigo_" + uuidstr + "")
        logfile = os.path.join(sf, "indigo_" + uuidstr + ".log")
        errfile = os.path.join(sf, "indigo_" + uuidstr + ".err")
        with open(logfile, "w") as log:
            with open(errfile, "w") as err:
                blexe = os.path.join(app.config['INDIGO'], "indigo.sh")
                return_code = call([blexe, fexpname, genome, str(
                    ltrim), str(rtrim), outfile], stdout=log, stderr=err)
        if return_code != 0:
            errInfo = "!"
            with open(errfile, "r") as err:
                errInfo = ": " + err.read()
            return jsonify(errors=[{"title": "Error in running Indigo" + errInfo}]), 400

        # Send download url
        urlout = "download/" + uuidstr
        dt = json.loads(open(outfile + ".json").read())
        dt["url"] = urlout
        return jsonify(data=dt), 200
    return jsonify(errors=[{"title": "Error in handling POST request!"}]), 400


@app.route('/api/v1/genomeindex', methods=['POST'])
def genomeind():
    return send_from_directory(os.path.join(INDIGOWS, "../fm"), "genomeindexindex.json"), 200


@app.route('/api/v1/health', methods=['GET'])
def health():
    return jsonify(status="OK")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3300, debug=True, threaded=True)

FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ARG COMFYUI_REF=8f40b43e0204d5b9780f3e9618e140e929e80594

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    COMFYUI_ROOT=/opt/ComfyUI \
    WORKFLOW_ROOT=/opt/ovs/workflows \
    COMFYUI_URL=http://127.0.0.1:8188

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates ffmpeg git python3 python3-pip python3-venv tini \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/Comfy-Org/ComfyUI.git ${COMFYUI_ROOT} \
    && cd ${COMFYUI_ROOT} \
    && git checkout ${COMFYUI_REF} \
    && pip3 install --no-cache-dir -r requirements.txt

COPY requirements.gateway.txt /tmp/requirements.gateway.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.gateway.txt

COPY gateway /opt/ovs/gateway
COPY entrypoint.sh /opt/ovs/entrypoint.sh
RUN chmod +x /opt/ovs/entrypoint.sh \
    && mkdir -p /opt/ovs/workflows ${COMFYUI_ROOT}/input ${COMFYUI_ROOT}/output ${COMFYUI_ROOT}/models

EXPOSE 8080
ENTRYPOINT ["/usr/bin/tini", "--", "/opt/ovs/entrypoint.sh"]
